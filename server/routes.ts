import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import Database from "better-sqlite3";
import path from "path";
import crypto from "crypto";
import { loginSchema, registerSchema, verifyCodeSchema, unfollowers, blockers, users, subscriptions, planChangeHistory, followers as followersTable } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { 
  getUserByEmail, 
  createUser, 
  verifyPassword, 
  setCurrentUser, 
  getCurrentUser,
  destroySession,
  getUserById
} from "./auth";
import { requireAuth, requireOwnership, rateLimit, requireVerified } from "./middleware";
import { createVerification, verifyToken, resendVerificationCode } from "./verification";
import { createCheckoutSession, createCustomerPortal, constructWebhookEvent, stripe } from "./stripe";
import { getActivePlans, getUserPlan, getPlanById, upsertSubscription, seedPlans } from "./plans";
import { startWalerBotPlaywright, stopWalerBotPlaywright, verifyWalerCode } from './waler-bot-playwright';
import { startWalerBotNew, stopWalerBotNew } from './waler-bot-new';
import { startWalerBotSimple, stopWalerBotSimple } from './waler-bot-simple';
import { createVerificationCode } from './verification-codes';
import { startAgentA, startAgentB, startAgentC, stopAgentA, stopAgentB, stopAgentC } from "./agents-bot-playwright";
import { followUserWithAgents } from './agents-follow';
import { startUserAnalysis } from './agents-analysis';
import { startWalerOnboardingBot, stopWalerOnboardingBot, verifyOnboardingCode, getWalerOnboardingBot } from "./waler-onboarding-bot";
import { triggerAgentForClient, triggerAgentForProspect, isAgentRunning, getAgentsStatus, forceCleanAgent } from './agent-trigger';
import type Stripe from "stripe";
import { exec } from 'child_process';
import fs from 'fs';

export async function registerRoutes(
  httpServer: Server,
  app: Express,
  pgPool?: any
): Promise<Server> {
  
  // Initialize plans in database
  // TODO: Uncomment after running db:push
  // await seedPlans();
  
  // ==================== AUTH ROUTES ====================
  
  // Register
  app.post("/api/auth/register", rateLimit(5, 60000), async (req, res) => {
    try {
      const input = registerSchema.parse(req.body);
      
      // Check if email already exists
      const existingUser = await getUserByEmail(input.email);
      if (existingUser) {
        // En mode développement, supprimer l'ancien compte pour permettre de retester
        if (process.env.NODE_ENV === 'development') {
          console.log(`🗑️ Deleting existing user with email ${input.email} for re-testing`);
          await db.delete(users).where(eq(users.id, existingUser.id));
        } else {
          return res.status(400).json({ message: "Cet email est déjà utilisé" });
        }
      }
      
      // Create user with hashed password
      const user = await createUser({
        username: input.username,
        email: input.email,
        password: input.password,
      });
      
      // Update subscription tier if plan was selected
      if (input.selectedPlan) {
        const tier = input.selectedPlan === 'pro' ? 'pro' : 'premium';
        await db.update(users)
          .set({ 
            subscriptionTier: tier,
            subscriptionStatus: 'active',
            trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days trial
          })
          .where(eq(users.id, user.id));
        console.log(`✅ Set user ${user.id} to ${tier} plan with 7-day trial`);
      }
      
      // Set session
      setCurrentUser(req, user.id);
      
      // Seed mock data for demo
      // TODO: Fix foreign key constraint issue
      // await seedMockData(user.id);
      
      // Generate verification code
      const verification = await createVerification(user.id);
      
      // Return user without passwordHash + verification code
      const { passwordHash, ...safeUser } = user;
      res.json({ 
        user: safeUser,
        verificationCode: verification.verificationCode,
        verificationRequired: true
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        console.error("Register error:", err);
        res.status(500).json({ message: "Erreur lors de l'inscription" });
      }
    }
  });
  
  // Login
  app.post("/api/auth/login", rateLimit(5, 60000), async (req, res) => {
    try {
      const input = loginSchema.parse(req.body);
      
      const user = await getUserByEmail(input.email);
      if (!user) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }
      
      const isValid = await verifyPassword(input.password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }
      
      // Regenerate session to prevent fixation
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ message: "Erreur de session" });
        }
        
        setCurrentUser(req, user.id);
        
        // Explicitly save session to ensure it's persisted
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Erreur de sauvegarde de session" });
          }
          
          console.log(`✅ User ${user.id} logged in successfully, session saved`);
          const { passwordHash, ...safeUser } = user;
          res.json(safeUser);
        });
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        console.error("Login error:", err);
        res.status(500).json({ message: "Erreur lors de la connexion" });
      }
    }
  });
  
  // Logout
  app.post("/api/auth/logout", async (req, res) => {
    try {
      await destroySession(req);
      res.clearCookie("connect.sid");
      res.json({ message: "Déconnexion réussie" });
    } catch (err) {
      res.status(500).json({ message: "Erreur lors de la déconnexion" });
    }
  });
  
  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    console.log("🔍 /api/auth/me called", {
      sessionID: req.sessionID,
      hasSession: !!req.session,
      userId: req.session?.userId,
      cookies: req.headers.cookie
    });
    
    const userId = getCurrentUser(req);
    if (!userId) {
      console.log("❌ No userId in session");
      return res.status(401).json({ message: "Non authentifié" });
    }
    
    const user = await getUserById(userId);
    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }
    
    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  });
  
  // Get subscription status
  app.get("/api/subscription/status", async (req, res) => {
    const userId = getCurrentUser(req);
    if (!userId) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    
    const response = {
      tier: user.subscriptionTier || null,
      status: user.subscriptionStatus || null,
      trialEndsAt: user.trialEndsAt || null
    };
    
    console.log(`📊 Subscription status for user ${userId}:`, response);
    res.json(response);
  });
  
  // DEV ONLY: Force Pro mode for current user
  app.post("/api/subscription/force-pro", requireAuth, async (req, res) => {
    const userId = getCurrentUser(req);
    if (!userId) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    
    try {
      await db.update(users)
        .set({ 
          subscriptionTier: 'pro',
          subscriptionStatus: 'active'
        })
        .where(eq(users.id, userId));
      
      console.log(`✅ User ${userId} upgraded to Pro (DEV MODE)`);
      res.json({ 
        success: true, 
        message: "Upgraded to Pro successfully",
        tier: "pro",
        status: "active"
      });
    } catch (error) {
      console.error("Error forcing Pro mode:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour" });
    }
  });
  
  // ==================== EXTENSION AUTH TOKEN ====================
  
  // Temporary token storage (in-memory)
  const extensionTokens = new Map<string, { userId: number; expiresAt: number }>();
  
  // Generate temporary token for extension authentication
  app.post("/api/extension/generate-token", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }
      
      // Generate a temporary token (valid for 5 minutes)
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
      
      // Store token in memory
      extensionTokens.set(token, { userId, expiresAt });
      
      // Clean up expired tokens
      extensionTokens.forEach((value, key) => {
        if (value.expiresAt < Date.now()) {
          extensionTokens.delete(key);
        }
      });
      
      console.log(`🔑 Generated extension token for user ${userId}`);
      
      res.json({ 
        token,
        userId,
        expiresAt: new Date(expiresAt)
      });
    } catch (err) {
      console.error("Generate extension token error:", err);
      res.status(500).json({ message: "Erreur lors de la génération du token" });
    }
  });
  
  // Validate extension token
  app.post("/api/extension/validate-token", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Token requis" });
      }
      
      const tokenData = extensionTokens.get(token);
      
      if (!tokenData) {
        return res.status(401).json({ message: "Token invalide" });
      }
      
      if (tokenData.expiresAt < Date.now()) {
        extensionTokens.delete(token);
        return res.status(401).json({ message: "Token expiré" });
      }
      
      // Token is valid, delete it (one-time use)
      extensionTokens.delete(token);
      
      console.log(`✅ Token validated for user ${tokenData.userId}`);
      
      res.json({ 
        valid: true,
        userId: tokenData.userId
      });
    } catch (err) {
      console.error("Validate token error:", err);
      res.status(500).json({ message: "Erreur lors de la validation du token" });
    }
  });
  
  // Extension authentication page
  app.get("/extension-auth", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Authentification requise</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 50px; background: #0a0a0a; color: #fff; }
              h1 { color: #22c55e; }
              a { color: #22c55e; text-decoration: none; }
            </style>
          </head>
          <body>
            <h1>🔒 Authentification requise</h1>
            <p>Veuillez vous connecter à FlowTrack pour continuer.</p>
            <a href="/">Retour à l'accueil</a>
          </body>
          </html>
        `);
      }
      
      // Generate a temporary token (valid for 5 minutes)
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 5 * 60 * 1000;
      
      extensionTokens.set(token, { userId, expiresAt });
      
      console.log(`🔑 Generated extension auth token for user ${userId}`);
      
      // Return HTML page that will communicate with the extension
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Connexion à l'extension Waler</title>
          <style>
            body {
              font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
              color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
            }
            .container {
              text-align: center;
              max-width: 500px;
              padding: 40px;
              background: rgba(255, 255, 255, 0.05);
              border-radius: 20px;
              border: 1px solid rgba(34, 197, 94, 0.2);
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            }
            h1 {
              font-size: 32px;
              margin-bottom: 20px;
              background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            .spinner {
              border: 4px solid rgba(255, 255, 255, 0.1);
              border-top: 4px solid #22c55e;
              border-radius: 50%;
              width: 50px;
              height: 50px;
              animation: spin 1s linear infinite;
              margin: 30px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .status {
              margin-top: 20px;
              font-size: 14px;
              color: rgba(255, 255, 255, 0.7);
            }
            .success {
              color: #22c55e;
              font-weight: 600;
            }
            .error {
              color: #ef4444;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔐 Connexion à Waler</h1>
            <div class="spinner"></div>
            <div class="status" id="status">Authentification en cours...</div>
          </div>
          
          <script>
            const token = "${token}";
            const userId = ${userId};
            
            // Attendre que la page soit chargée
            window.addEventListener('load', () => {
              // Ajouter les paramètres à l'URL pour que le content script les capture
              const url = new URL(window.location.href);
              url.searchParams.set('waler_token', token);
              url.searchParams.set('waler_user_id', userId.toString());
              
              // Remplacer l'URL sans recharger la page
              window.history.replaceState({}, '', url.toString());
              
              // Attendre un peu pour que le content script ait le temps de capturer les paramètres
              setTimeout(() => {
                document.getElementById('status').innerHTML = '<span class="success">✅ Authentification réussie !</span><br><small>Vous pouvez fermer cet onglet.</small>';
                
                // Fermer automatiquement après 2 secondes
                setTimeout(() => {
                  window.close();
                }, 2000);
              }, 1000);
            });
          </script>
        </body>
        </html>
      `);
    } catch (err) {
      console.error("Extension auth error:", err);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Erreur</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; background: #0a0a0a; color: #fff; }
            h1 { color: #ef4444; }
          </style>
        </head>
        <body>
          <h1>❌ Erreur</h1>
          <p>Une erreur est survenue lors de l'authentification.</p>
        </body>
        </html>
      `);
    }
  });
  
  // ==================== VERIFICATION ROUTES ====================
  
  // Generate verification code
  app.post("/api/auth/verification/generate", requireAuth, rateLimit(3, 60000), async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }
      
      const verification = await createVerification(userId);
      const user = await getUserById(userId);
      
      res.json({
        verificationCode: verification.verificationCode,
        username: user?.username,
        expiresAt: verification.expiresAt,
      });
    } catch (err) {
      console.error("Verification generation error:", err);
      res.status(500).json({ message: "Erreur lors de la génération du code" });
    }
  });
  
  // Verify code
  app.post("/api/auth/verification/verify", requireAuth, rateLimit(10, 60000), async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }
      
      const input = verifyCodeSchema.parse(req.body);
      
      if (input.userId !== userId) {
        return res.status(403).json({ message: "Non autorisé" });
      }
      
      const result = await verifyToken(userId, input.code);
      
      if (result.success) {
        res.json({ success: true, message: result.message });
      } else {
        res.status(400).json({ success: false, message: result.message });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        console.error("Verification error:", err);
        res.status(500).json({ message: "Erreur lors de la vérification" });
      }
    }
  });
  
  // Resend verification code
  app.post("/api/auth/verification/resend", requireAuth, rateLimit(3, 60000), async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }
      
      const verification = await resendVerificationCode(userId);
      const user = await getUserById(userId);
      
      res.json({
        verificationCode: verification.verificationCode,
        username: user?.username,
        expiresAt: verification.expiresAt,
      });
    } catch (err) {
      console.error("Resend verification error:", err);
      res.status(500).json({ message: "Erreur lors du renvoi du code" });
    }
  });
  
  // ==================== PLANS & SUBSCRIPTION ROUTES ====================
  
  // Get all plans
  app.get("/api/plans", async (req, res) => {
    try {
      const plans = await getActivePlans();
      res.json(plans);
    } catch (err) {
      console.error("Get plans error:", err);
      res.status(500).json({ message: "Erreur lors de la récupération des plans" });
    }
  });
  
  // Get user's current plan
  app.get("/api/subscription/current", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }
      
      const { plan, subscription } = await getUserPlan(userId);
      res.json({ plan, subscription });
    } catch (err) {
      console.error("Get user plan error:", err);
      res.status(500).json({ message: "Erreur lors de la récupération du plan" });
    }
  });
  
  // Create Stripe checkout session
  app.post("/api/checkout", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }
      
      const { priceId, billingPeriod } = req.body;
      
      if (!priceId) {
        return res.status(400).json({ message: "priceId requis" });
      }
      
      const user = await getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      // Récupérer customerId si existe
      const { subscription } = await getUserPlan(userId);
      
      const session = await createCheckoutSession({
        userId,
        userEmail: user.email,
        priceId,
        successUrl: `${process.env.CLIENT_URL || 'http://localhost:5000'}/dashboard/${userId}?checkout=success`,
        cancelUrl: `${process.env.CLIENT_URL || 'http://localhost:5000'}/pricing?checkout=canceled`,
        customerId: subscription?.stripeCustomerId || undefined,
      });
      
      res.json({ sessionId: session.id, url: session.url });
    } catch (err) {
      console.error("Checkout error:", err);
      res.status(500).json({ message: "Erreur lors de la création de la session" });
    }
  });
  
  // Create Stripe customer portal session
  app.post("/api/portal", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }
      
      const { subscription } = await getUserPlan(userId);
      
      if (!subscription?.stripeCustomerId) {
        return res.status(400).json({ message: "Aucun abonnement actif" });
      }
      
      const portalSession = await createCustomerPortal({
        customerId: subscription.stripeCustomerId,
        returnUrl: `${process.env.CLIENT_URL || 'http://localhost:5000'}/settings`,
      });
      
      res.json({ url: portalSession.url });
    } catch (err) {
      console.error("Portal error:", err);
      res.status(500).json({ message: "Erreur lors de la création du portail" });
    }
  });
  
  // Stripe webhooks
  app.post("/api/webhooks/stripe", async (req, res) => {
    const signature = req.headers["stripe-signature"];
    
    if (!signature || Array.isArray(signature)) {
      return res.status(400).send("Missing or invalid stripe-signature header");
    }
    
    try {
      const event = constructWebhookEvent(req.body, signature);
      
      console.log(`Webhook received: ${event.type}`);
      
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = parseInt(session.metadata?.userId || "0");
          
          if (!userId || !session.subscription) break;
          
          // Récupérer la subscription Stripe pour obtenir le priceId
          const stripeSubscription = session.subscription as string;
          
          // Récupérer tous les plans pour mapper le priceId
          const allPlans = await getActivePlans();
          let planId: number | null = null;
          
          // Récupérer les line items pour obtenir le priceId
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          const priceId = lineItems.data[0]?.price?.id;
          
          // Trouver le plan correspondant au priceId
          for (const plan of allPlans) {
            if (plan.stripePriceIdMonthly === priceId || plan.stripePriceIdYearly === priceId) {
              planId = plan.id;
              break;
            }
          }
          
          if (!planId) {
            console.error(`No plan found for priceId: ${priceId}`);
            break;
          }
          
          await upsertSubscription({
            userId,
            planId,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: stripeSubscription,
            status: "active",
          });
          
          console.log(`✅ Subscription created for user ${userId}, plan ${planId}`);
          
          // Trigger agent follow automatically after payment
          try {
            const [user] = await db.select().from(users).where(eq(users.id, userId));
            if (user && user.username) {
              const { followWithActiveBots } = await import("./agents-bot-playwright");
              const followResult = await followWithActiveBots(user.username);
              console.log(`🤖 Agent follow triggered for user ${userId} (@${user.username}):`, followResult);
            }
          } catch (followErr) {
            console.error(`❌ Failed to trigger agent follow for user ${userId}:`, followErr);
            // Don't fail the webhook if follow fails
          }
          
          break;
        }
        
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`Subscription updated: ${subscription.id}`);
          
          // Récupérer l'utilisateur via le customerId
          const [userSub] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeCustomerId, subscription.customer as string));
          
          if (userSub) {
            // Récupérer le nouveau plan basé sur le priceId
            const priceId = subscription.items.data[0]?.price?.id;
            const allPlans = await getActivePlans();
            let newPlanId: number | null = null;
            
            for (const plan of allPlans) {
              if (plan.stripePriceIdMonthly === priceId || plan.stripePriceIdYearly === priceId) {
                newPlanId = plan.id;
                break;
              }
            }
            
            if (newPlanId && newPlanId !== userSub.planId) {
              // Changement de plan détecté - utiliser le service de migration
              const { changePlan } = await import("./plan-migration");
              const result = await changePlan(userSub.userId, newPlanId, {
                stripeCustomerId: subscription.customer as string,
                stripeSubscriptionId: subscription.id,
                billingPeriod: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly',
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              });
              
              console.log(`✅ Plan changed via webhook:`, result);
            } else {
              // Mise à jour simple (statut, dates, etc.)
              await db
                .update(subscriptions)
                .set({
                  status: subscription.status,
                  currentPeriodStart: new Date(subscription.current_period_start * 1000),
                  currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                  cancelAtPeriodEnd: subscription.cancel_at_period_end,
                  updatedAt: new Date(),
                })
                .where(eq(subscriptions.id, userSub.id));
              
              console.log(`✅ Subscription status updated for user ${userSub.userId}`);
            }
          }
          break;
        }
        
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`Subscription deleted: ${subscription.id}`);
          
          // Récupérer l'utilisateur
          const [userSub] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
          
          if (userSub) {
            // Utiliser le service de migration pour annuler (préserve les données)
            const { cancelPlan } = await import("./plan-migration");
            const result = await cancelPlan(userSub.userId);
            console.log(`✅ Plan cancelled via webhook:`, result);
          }
          break;
        }
        
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          console.log(`Payment failed for invoice: ${invoice.id}`);
          
          // Mettre à jour le statut mais NE PAS supprimer les données
          if (invoice.subscription) {
            const [userSub] = await db
              .select()
              .from(subscriptions)
              .where(eq(subscriptions.stripeSubscriptionId, invoice.subscription as string));
            
            if (userSub) {
              await db
                .update(subscriptions)
                .set({
                  status: 'past_due',
                  updatedAt: new Date(),
                })
                .where(eq(subscriptions.id, userSub.id));
              
              // Mettre à jour le statut dans users aussi
              await db
                .update(users)
                .set({
                  subscriptionStatus: 'past_due',
                })
                .where(eq(users.id, userSub.userId));
              
              console.log(`⚠️ Payment failed for user ${userSub.userId} - status set to past_due (data preserved)`);
            }
          }
          break;
        }
      }
      
      res.json({ received: true });
    } catch (err) {
      console.error("Webhook error:", err);
      res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  });
  
  // ==================== AGENT FOLLOW ROUTES ====================
  
  // Trigger agent follow after payment
  app.post("/api/agents/follow", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }
      
      const { followNewClient } = await import("./instagram-follow");
      const result = await followNewClient(userId);
      
      res.json({
        success: true,
        needsManualApproval: result.needsManualApproval,
        agentA: result.agentA,
        agentB: result.agentB,
      });
    } catch (err) {
      console.error("Agent follow error:", err);
      res.status(500).json({ 
        message: "Erreur lors du follow des agents",
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  });
  
  // Check if agents have been approved (for private accounts)
  app.post("/api/check-agent-approval", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }
      
      const { checkAgentApproval } = await import("./instagram-follow");
      const result = await checkAgentApproval(userId);
      
      res.json(result);
    } catch (err) {
      console.error("Check approval error:", err);
      res.status(500).json({ 
        message: "Erreur lors de la vérification",
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  });
  
  // ==================== MARK UNFOLLOWER AS BLOCKER ====================
  
  app.post("/api/unfollowers/:id/mark-as-blocker", async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const unfollowerId = parseInt(req.params.id);
      if (isNaN(unfollowerId)) {
        return res.status(400).json({ message: "Invalid unfollower ID" });
      }
      
      // Get the unfollower
      const [unfollower] = await db
        .select()
        .from(unfollowers)
        .where(eq(unfollowers.id, unfollowerId))
        .limit(1);
      
      if (!unfollower) {
        return res.status(404).json({ message: "Unfollower not found" });
      }
      
      // Verify ownership
      if (unfollower.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Create blocker entry
      const [blocker] = await db
        .insert(blockers)
        .values({
          userId: unfollower.userId,
          username: unfollower.username,
          avatarUrl: unfollower.avatarUrl,
          type: "blocker",
          blockType: "manually_marked",
          detectedAt: new Date(),
        })
        .returning();
      
      // Delete from unfollowers
      await db
        .delete(unfollowers)
        .where(eq(unfollowers.id, unfollowerId));
      
      res.json({ 
        success: true, 
        blocker,
        message: "Marked as blocker successfully" 
      });
    } catch (err) {
      console.error("Mark as blocker error:", err);
      res.status(500).json({ 
        message: "Error marking as blocker",
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  });
  
  // ==================== LEGACY CONNECT (redirect to register) ====================
  
  app.post(api.users.connect.path, rateLimit(5, 60000), async (req, res) => {
    try {
      const input = api.users.connect.input.parse(req.body);
      
      // Check if email already exists - if so, try login
      const existingUser = await getUserByEmail(input.email);
      if (existingUser) {
        const isValid = await verifyPassword(input.password, existingUser.passwordHash);
        if (isValid) {
          setCurrentUser(req, existingUser.id);
          const { passwordHash, ...safeUser } = existingUser;
          return res.json(safeUser);
        }
        return res.status(400).json({ message: "Cet email est déjà utilisé" });
      }
      
      // Create new user
      const user = await createUser({
        username: input.username,
        email: input.email,
        password: input.password,
      });
      
      setCurrentUser(req, user.id);
      await seedMockData(user.id);
      
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        console.error("Connect error:", err);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // ==================== PROTECTED ROUTES ====================

  app.get(api.users.get.path, requireAuth, async (req, res) => {
    const userId = getCurrentUser(req);
    const requestedId = Number(req.params.id);
    
    // Users can only access their own data
    if (userId !== requestedId) {
      return res.status(403).json({ message: "Accès non autorisé" });
    }
    
    const user = await getUserById(requestedId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    
    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  });

  app.get(api.stats.get.path, requireAuth, async (req, res) => {
    const currentUserId = getCurrentUser(req);
    const requestedUserId = Number(req.params.userId);
    
    // Users can only access their own stats
    if (currentUserId !== requestedUserId) {
      return res.status(403).json({ message: "Accès non autorisé" });
    }
    
    // Get user's Instagram stats from database
    const user = await getUserById(requestedUserId);
    
    // Get followers from SQLite (old system)
    const recentFollowers = await storage.getFollowers(requestedUserId);
    
    // Get unfollowers and ghost from PostgreSQL (new system)
    let recentUnfollowers: any[] = [];
    let recentBlockers: any[] = [];
    
    if (pgPool) {
      try {
        // Get unfollowers (status = 'unfollowed')
        const unfollowersResult = await pgPool.query(`
          SELECT id, username, avatar_url as "avatarUrl", status, detected_at as "detectedAt", verified_at as "verifiedAt"
          FROM unfollowers
          WHERE user_id = $1 AND status = 'unfollowed'
          ORDER BY detected_at DESC
        `, [requestedUserId]);
        
        // Get ghost followers (status = 'blocked' OR 'deleted')
        const ghostResult = await pgPool.query(`
          SELECT id, username, avatar_url as "avatarUrl", status, detected_at as "detectedAt", verified_at as "verifiedAt"
          FROM unfollowers
          WHERE user_id = $1 AND status IN ('blocked', 'deleted')
          ORDER BY detected_at DESC
        `, [requestedUserId]);
        
        recentUnfollowers = unfollowersResult.rows;
        recentBlockers = ghostResult.rows;
      } catch (error) {
        console.error('Error fetching unfollowers from PostgreSQL:', error);
        // Fallback to SQLite if PostgreSQL fails
        recentUnfollowers = await storage.getUnfollowers(requestedUserId);
        recentBlockers = await storage.getBlockers(requestedUserId);
      }
    } else {
      // Fallback to SQLite if pgPool not available
      recentUnfollowers = await storage.getUnfollowers(requestedUserId);
      recentBlockers = await storage.getBlockers(requestedUserId);
    }

    // Generate chart data for current month (31 days) based on real data
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const chartData = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      
      // Count actual followers/unfollowers for this day
      const dayFollowers = recentFollowers.filter(f => {
        const d = new Date(f.detectedAt || new Date());
        return d.getDate() === day && d.getMonth() === now.getMonth();
      }).length;
      
      const dayUnfollowers = recentUnfollowers.filter(u => {
        const d = new Date(u.detectedAt || new Date());
        return d.getDate() === day && d.getMonth() === now.getMonth();
      }).length;
      
      const dayBlockers = recentBlockers.filter(b => {
        const d = new Date(b.detectedAt || new Date());
        return d.getDate() === day && d.getMonth() === now.getMonth();
      }).length;
      
      return { 
        day, 
        followers: dayFollowers,
        unfollowers: dayUnfollowers,
        blockers: dayBlockers
      };
    });

    res.json({
      // Real Instagram stats from database
      instagramFollowers: user?.followersCount || 0,
      instagramFollowing: user?.followingCount || 0,
      instagramPosts: user?.postsCount || 0,
      instagramBio: user?.bio || '',
      isPrivate: user?.isPrivate || false,
      analysisStatus: user?.analysisStatus || 'pending',
      lastAnalyzedAt: user?.lastAnalyzedAt || null,
      // Activity tracking stats
      totalUnfollowers: recentUnfollowers.length,
      totalFollowers: recentFollowers.length,
      totalBlockers: recentBlockers.length,
      recentUnfollowers,
      recentFollowers,
      recentBlockers,
      chartData,
      growthRate: recentFollowers.length > 0 ? ((recentFollowers.length - recentUnfollowers.length) / Math.max(recentFollowers.length, 1)) * 100 : -2.4,
    });
  });

  // ==================== ADMIN: TRIGGER FOLLOW ====================
  
  // Admin endpoint to trigger follow for a specific user
  app.post("/api/admin/trigger-follow/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Récupérer l'utilisateur
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || !user.username) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Utiliser les bots actifs pour follow
      const { followWithActiveBots } = await import("./agents-bot-playwright");
      const result = await followWithActiveBots(user.username);
      
      res.json({
        success: true,
        userId,
        username: user.username,
        agentA: result.agentA,
        agentB: result.agentB,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== WALER BOT CONTROL ====================
  
  // Start Waler bot manually (SIMPLE VERSION)
  app.post("/api/admin/waler-bot/start", async (req, res) => {
    try {
      const result = await startWalerBotSimple();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stop Waler bot (SIMPLE VERSION)
  app.post("/api/admin/waler-bot/stop", async (req, res) => {
    try {
      const result = await stopWalerBotSimple();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== WALER ONBOARDING BOT ====================
  
  // Start Waler onboarding bot
  app.post("/api/admin/waler-onboarding/start", async (req, res) => {
    try {
      await startWalerOnboardingBot();
      res.json({ message: "Waler onboarding bot started successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stop Waler onboarding bot
  app.post("/api/admin/waler-onboarding/stop", async (req, res) => {
    try {
      stopWalerOnboardingBot();
      res.json({ message: "Waler onboarding bot stopped successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get Waler onboarding bot status
  app.get("/api/admin/waler-onboarding/status", async (req, res) => {
    try {
      const bot = getWalerOnboardingBot();
      if (!bot) {
        res.json({ isRunning: false });
      } else {
        res.json(bot.getStatus());
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Generate code to send for onboarding
  app.post("/api/verification/generate-code", async (req, res) => {
    try {
      const { instagramUsername } = req.body;
      
      if (!instagramUsername) {
        return res.status(400).json({ success: false, message: "Instagram username required" });
      }

      const codeToSend = await createVerificationCode(instagramUsername);
      
      res.json({ 
        success: true,
        codeToSend,
        message: `Send this code to @waler.web on Instagram: ${codeToSend}`
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Check analysis status for a user
  app.get("/api/agents/analysis-status/:username", async (req, res) => {
    try {
      const { username } = req.params;
      
      if (!username) {
        return res.status(400).json({ success: false, message: "Username required" });
      }

      // Vérifier si l'utilisateur a des données d'analyse
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const status = user.analysisStatus || 'pending';
      const message = 
        status === 'pending' ? 'Analysis not started yet' :
        status === 'analyzing' ? 'Analysis in progress' :
        status === 'completed' ? 'Analysis completed' :
        'Analysis failed';

      res.json({
        success: true,
        status,
        message,
        data: status === 'completed' ? {
          followersCount: user.followersCount,
          followingCount: user.followingCount,
          postsCount: user.postsCount,
          bio: user.bio,
          isPrivate: user.isPrivate,
          lastAnalyzedAt: user.lastAnalyzedAt,
        } : null
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Trigger agents to follow user
  app.post("/api/agents/follow-user", async (req, res) => {
    try {
      const { instagramUsername } = req.body;
      
      if (!instagramUsername) {
        return res.status(400).json({ success: false, message: "Instagram username required" });
      }

      // Déclencher le follow en arrière-plan (ne pas attendre)
      followUserWithAgents(instagramUsername).then(() => {
        console.log(`✅ Agents followed @${instagramUsername}, starting analysis...`);
        
        // Déclencher l'analyse automatique après le follow
        startUserAnalysis(instagramUsername).catch(error => {
          console.error(`Error analyzing @${instagramUsername}:`, error);
        });
      }).catch(error => {
        console.error(`Error following @${instagramUsername}:`, error);
      });
      
      res.json({ 
        success: true,
        message: `Agents will follow @${instagramUsername} and start analysis`
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Analyze a person from Pro mode (people/client)
  app.post("/api/pro/analyze-person", async (req, res) => {
    try {
      const { instagramUsername } = req.body;
      const userId = getCurrentUser(req);
      
      if (!instagramUsername) {
        return res.status(400).json({ success: false, message: "Instagram username required" });
      }

      if (!userId) {
        return res.status(401).json({ success: false, message: "User not authenticated" });
      }

      console.log(`🔍 Starting Pro analysis for @${instagramUsername}`);

      // Sauvegarder le prospect dans circle_members
      const prospectId = Date.now();
      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);
      
      // Vérifier que l'utilisateur existe
      const userExists = sqlite.prepare(`SELECT id FROM users WHERE id = ?`).get(userId);
      
      if (!userExists) {
        sqlite.close();
        return res.status(400).json({ 
          success: false, 
          message: `User ID ${userId} not found in database. Please re-login.` 
        });
      }
      
      sqlite.prepare(`
        INSERT OR IGNORE INTO circle_members (
          id, user_id, member_username, category, created_at
        ) VALUES (?, ?, ?, 'prospect', datetime('now'))
      `).run(prospectId, userId, instagramUsername);
      
      sqlite.close();

      console.log(`💾 Prospect @${instagramUsername} sauvegardé avec ID ${prospectId}`);

      // Note: L'Agent Pro Circle est déjà déclenché par /api/pro/trigger-agent-prospect
      // Pas besoin de lancer les agents A et B ici
      
      res.json({ 
        success: true,
        status: 'analyzing',
        message: `Analysis started for @${instagramUsername}`,
        prospectId
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Verify onboarding code (using Supabase)
  app.post("/api/verification/verify-code", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ valid: false, message: "Code required" });
      }

      const result = await verifyWalerCode(code);
      
      res.json({ 
        valid: result.valid,
        instagramUsername: result.instagramUsername,
        message: result.valid ? "Code verified successfully" : "Invalid or expired code"
      });
    } catch (error: any) {
      res.status(500).json({ valid: false, message: error.message });
    }
  });

  // ==================== AGENTS A, B, C CONTROL ====================
  
  // Start Agent A
  app.post("/api/admin/agent-a/start", async (req, res) => {
    try {
      await startAgentA();
      res.json({ message: "Agent A started successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stop Agent A
  app.post("/api/admin/agent-a/stop", async (req, res) => {
    try {
      await stopAgentA();
      res.json({ message: "Agent A stopped successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Start Agent B
  app.post("/api/admin/agent-b/start", async (req, res) => {
    try {
      await startAgentB();
      res.json({ message: "Agent B started successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stop Agent B
  app.post("/api/admin/agent-b/stop", async (req, res) => {
    try {
      await stopAgentB();
      res.json({ message: "Agent B stopped successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Start Agent C
  app.post("/api/admin/agent-c/start", async (req, res) => {
    try {
      await startAgentC();
      res.json({ message: "Agent C started successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stop Agent C
  app.post("/api/admin/agent-c/stop", async (req, res) => {
    try {
      await stopAgentC();
      res.json({ message: "Agent C stopped successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== PRO AGENTS TRIGGER ROUTES ====================
  
  // Créer un nouveau client dans la BDD
  app.post("/api/pro/clients", requireAuth, async (req, res) => {
    try {
      const { instagramUsername, displayName, tags, notes, initialGoal } = req.body;
      const userId = req.session.userId;
      
      if (!instagramUsername || !displayName) {
        return res.status(400).json({ message: "Instagram username and display name are required" });
      }
      
      const db = getDb();
      const result = db.prepare(`
        INSERT INTO clients (coach_user_id, instagram_username, display_name, tags, notes, initial_goal)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, instagramUsername, displayName, JSON.stringify(tags || []), notes || '', initialGoal || '');
      
      const clientId = result.lastInsertRowid;
      
      console.log(`✅ Client créé dans la BDD: ${instagramUsername} (ID: ${clientId})`);
      
      res.json({ 
        success: true,
        clientId,
        message: "Client créé avec succès"
      });
    } catch (error: any) {
      console.error("Erreur lors de la création du client:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Déclencher l'agent Pro Clients pour un client spécifique
  app.post("/api/pro/trigger-agent-client/:clientId", requireAuth, async (req, res) => {
    try {
      const clientIdParam = Array.isArray(req.params.clientId) ? req.params.clientId[0] : req.params.clientId;
      const clientId = parseInt(clientIdParam);
      
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }

      console.log(`🚀 Déclenchement de l'agent Pro Clients pour le client ${clientId}`);
      
      const triggered = await triggerAgentForClient(clientId);
      
      if (triggered) {
        res.json({ 
          success: true,
          message: "Agent Pro Clients démarré avec succès",
          clientId 
        });
      } else {
        res.status(409).json({ 
          success: false,
          message: "Agent Pro Clients déjà en cours d'exécution" 
        });
      }
    } catch (error: any) {
      console.error("Erreur lors du déclenchement de l'agent:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Déclencher l'agent Pro Circle pour un prospect spécifique
  app.post("/api/pro/trigger-agent-prospect/:prospectId", requireAuth, async (req, res) => {
    try {
      const prospectIdParam = Array.isArray(req.params.prospectId) ? req.params.prospectId[0] : req.params.prospectId;
      const prospectId = parseInt(prospectIdParam);
      
      if (isNaN(prospectId)) {
        return res.status(400).json({ message: "Invalid prospect ID" });
      }

      console.log(`🚀 Déclenchement de l'agent Pro Circle pour le prospect ${prospectId}`);
      
      const triggered = await triggerAgentForProspect(prospectId);
      
      if (triggered) {
        res.json({ 
          success: true,
          message: "Agent Pro Circle démarré avec succès",
          prospectId 
        });
      } else {
        res.status(409).json({ 
          success: false,
          message: "Agent Pro Circle déjà en cours d'exécution" 
        });
      }
    } catch (error: any) {
      console.error("Erreur lors du déclenchement de l'agent:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Obtenir le statut des agents Pro
  app.get("/api/pro/agents-status", requireAuth, async (req, res) => {
    try {
      const status = getAgentsStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== EXTENSION API ROUTES ====================
  
  // Sync data from extension
  app.post("/api/extension/sync", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const { data } = req.body;
      
      if (!Array.isArray(data)) {
        return res.status(400).json({ message: "Invalid data format" });
      }

      console.log(`📥 Extension sync: ${data.length} items from user ${userId}`);

      for (const item of data) {
        switch (item.type) {
          case 'follower':
            await storage.createFollower({
              userId,
              username: item.username,
              avatarUrl: item.avatarUrl,
            });
            console.log(`➕ Follower added: @${item.username}`);
            break;

          case 'unfollower':
            await storage.createUnfollower({
              userId,
              username: item.username,
              avatarUrl: item.avatarUrl,
            });
            console.log(`➖ Unfollower added: @${item.username}`);
            break;

          case 'blocker':
            await storage.createBlocker({
              userId,
              username: item.username,
              avatarUrl: item.avatarUrl,
              type: 'blocker',
            });
            console.log(`🚫 Blocker added: @${item.username}`);
            break;

          case 'engagement':
            console.log(`💫 Engagement tracked: ${item.metadata?.action} by @${item.username}`);
            break;
        }
      }

      res.json({ 
        success: true,
        synced: data.length,
        message: `${data.length} items synchronized`
      });
    } catch (error: any) {
      console.error("Extension sync error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Sync full database from extension
  app.post("/api/extension/sync-full", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const { followers, totalCount, lastScanDate } = req.body;
      
      if (!Array.isArray(followers)) {
        return res.status(400).json({ message: "Invalid data format" });
      }

      console.log(`📥 Full database sync: ${followers.length} followers from user ${userId}`);

      let added = 0;
      let skipped = 0;

      for (const follower of followers) {
        try {
          // Vérifier si le follower existe déjà
          const existing = await db
            .select()
            .from(followersTable)
            .where(
              and(
                eq(followersTable.userId, userId),
                eq(followersTable.username, follower.username)
              )
            )
            .limit(1);

          if (existing.length === 0) {
            await storage.createFollower({
              userId,
              username: follower.username,
              avatarUrl: follower.avatarUrl,
            });
            added++;
          } else {
            skipped++;
          }
        } catch (error: any) {
          console.error(`Error adding follower @${follower.username}:`, error.message);
        }
      }

      console.log(`✅ Full sync complete: ${added} added, ${skipped} skipped`);

      res.json({ 
        success: true,
        added,
        skipped,
        total: followers.length,
        message: `Full sync complete: ${added} new followers added`
      });
    } catch (error: any) {
      console.error("Full sync error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get extension auth token
  app.post("/api/extension/auth", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const user = await getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      const token = Buffer.from(`${userId}:${Date.now()}`).toString('base64');

      res.json({
        success: true,
        userId,
        username: user.username,
        token,
      });
    } catch (error: any) {
      console.error("Extension auth error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Trigger Agent B for unfollower verification
  app.post("/api/extension/trigger-agent-b", async (req, res) => {
    try {
      // Pour test: utiliser userId depuis le body ou défaut à 21
      const userId = req.body.userId || 21;
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const { missingUsernames } = req.body;
      
      if (!Array.isArray(missingUsernames) || missingUsernames.length === 0) {
        return res.status(400).json({ message: "missingUsernames requis (array)" });
      }

      console.log(`🤖 Déclenchement Agent B pour ${missingUsernames.length} unfollowers`);
      console.log(`📋 Usernames à vérifier:`, missingUsernames);

      // Sauvegarder les usernames dans un fichier temporaire pour l'Agent B
      const tempFile = `agent-b-queue-${Date.now()}.json`;
      fs.writeFileSync(tempFile, JSON.stringify({
        userId,
        missingUsernames,
        timestamp: new Date().toISOString()
      }));

      console.log(`💾 Queue sauvegardée dans ${tempFile}`);

      // Déclencher l'Agent B en arrière-plan
      exec('python agent_b.py', { cwd: process.cwd() }, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Erreur Agent B: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`⚠️ Agent B stderr: ${stderr}`);
        }
        console.log(`✅ Agent B output: ${stdout}`);
      });

      res.json({
        success: true,
        message: `Agent B déclenché pour ${missingUsernames.length} unfollowers`,
        usernames: missingUsernames,
        queueFile: tempFile
      });
    } catch (error: any) {
      console.error("Trigger Agent B error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update user info from extension
  app.post("/api/extension/update-user-info", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const { followersCount, followingCount, postsCount, bio, isPrivate } = req.body;

      await db.update(users)
        .set({
          followersCount,
          followingCount,
          postsCount,
          bio,
          isPrivate,
          lastAnalyzedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.log(`📊 User info updated from extension for user ${userId}`);

      res.json({ success: true });
    } catch (error: any) {
      console.error("Update user info error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Verify missing followers (unfollowers not found on Instagram)
  app.post("/api/extension/verify-missing-followers", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const { missingUsernames, unfollowedUsernames, blockedUsernames } = req.body;

      if (!Array.isArray(missingUsernames)) {
        return res.status(400).json({ message: "missingUsernames must be an array" });
      }

      console.log(`🔍 Received verification request for ${missingUsernames.length} missing followers`);
      console.log(`📊 Already classified: ${unfollowedUsernames?.length || 0} unfollows, ${blockedUsernames?.length || 0} blocked`);

      // Get user's Instagram username
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || !user.instagramUsername) {
        return res.status(400).json({ message: "Instagram username not found" });
      }

      // Find or create client
      const [client] = await db.select().from(clients).where(eq(clients.instagramUsername, user.instagramUsername));
      
      let clientId: number;
      if (!client) {
        const [newClient] = await db.insert(clients).values({
          instagramUsername: user.instagramUsername,
          userId: userId,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();
        clientId = newClient.id;
      } else {
        clientId = client.id;
      }

      // Save already classified unfollows and blocks
      if (unfollowedUsernames && unfollowedUsernames.length > 0) {
        for (const username of unfollowedUsernames) {
          await db.insert(unfollowList).values({
            clientId: clientId,
            followerUsername: username,
            followerUserId: null,
            unfollowType: 'unfollow',
            detectedAt: new Date(),
            verifiedByAgent: false,
          }).onConflictDoNothing();
        }
        console.log(`✅ Saved ${unfollowedUsernames.length} unfollows`);
      }

      if (blockedUsernames && blockedUsernames.length > 0) {
        for (const username of blockedUsernames) {
          await db.insert(unfollowList).values({
            clientId: clientId,
            followerUsername: username,
            followerUserId: null,
            unfollowType: 'blocked',
            detectedAt: new Date(),
            verifiedByAgent: false,
          }).onConflictDoNothing();
        }
        console.log(`✅ Saved ${blockedUsernames.length} blocked`);
      }

      // Save deleted accounts (not found on Instagram) to PostgreSQL
      if (missingUsernames && missingUsernames.length > 0 && pgPool) {
        try {
          for (const username of missingUsernames) {
            await pgPool.query(`
              INSERT INTO unfollowers (user_id, username, status, detected_at)
              VALUES ($1, $2, 'deleted', NOW())
              ON CONFLICT (user_id, username) 
              DO UPDATE SET status = 'deleted', detected_at = NOW()
            `, [userId, username]);
          }
          console.log(`✅ Saved ${missingUsernames.length} deleted accounts to PostgreSQL`);
        } catch (error) {
          console.error('Error saving deleted accounts to PostgreSQL:', error);
        }
      }

      // Also save blocked accounts to PostgreSQL
      if (blockedUsernames && blockedUsernames.length > 0 && pgPool) {
        try {
          for (const username of blockedUsernames) {
            await pgPool.query(`
              INSERT INTO unfollowers (user_id, username, status, detected_at)
              VALUES ($1, $2, 'blocked', NOW())
              ON CONFLICT (user_id, username) 
              DO UPDATE SET status = 'blocked', detected_at = NOW()
            `, [userId, username]);
          }
          console.log(`✅ Saved ${blockedUsernames.length} blocked accounts to PostgreSQL`);
        } catch (error) {
          console.error('Error saving blocked accounts to PostgreSQL:', error);
        }
      }

      // Also save unfollowed accounts to PostgreSQL
      if (unfollowedUsernames && unfollowedUsernames.length > 0 && pgPool) {
        try {
          for (const username of unfollowedUsernames) {
            await pgPool.query(`
              INSERT INTO unfollowers (user_id, username, status, detected_at)
              VALUES ($1, $2, 'unfollowed', NOW())
              ON CONFLICT (user_id, username) 
              DO UPDATE SET status = 'unfollowed', detected_at = NOW()
            `, [userId, username]);
          }
          console.log(`✅ Saved ${unfollowedUsernames.length} unfollowed accounts to PostgreSQL`);
        } catch (error) {
          console.error('Error saving unfollowed accounts to PostgreSQL:', error);
        }
      }

      // Create Event for Agent B to verify missing usernames via Google
      if (missingUsernames.length > 0) {
        const [event] = await db.insert(events).values({
          clientId: clientId,
          type: 'unfollower_verification',
          status: 'pending',
          needsCheckB: true,
          metadata: JSON.stringify({ missingUsernames }),
          createdAt: new Date(),
        }).returning();

        console.log(`📋 Created Event ${event.id} for Agent B to verify ${missingUsernames.length} usernames`);

        res.json({
          success: true,
          eventId: event.id,
          message: `${missingUsernames.length} usernames sent to Agent B for Google verification`,
        });
      } else {
        res.json({
          success: true,
          message: 'All followers classified, no Google verification needed',
        });
      }
    } catch (error: any) {
      console.error("Verify missing followers error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== CLASSIFICATION SYSTEM ROUTES ====================
  
  // Analyze contact and return score
  app.post("/api/extension/analyze-contact", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const { contactUsername, scoreBreakdown, currentCategory } = req.body;

      if (!contactUsername || !scoreBreakdown) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Upsert contact score in database
      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      sqlite.prepare(`
        INSERT INTO contact_scores (
          user_id, contact_username, dm_score, engagement_score, 
          activity_score, seniority_score, reciprocity_score, total_score,
          current_category, last_calculated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(user_id, contact_username) DO UPDATE SET
          dm_score = excluded.dm_score,
          engagement_score = excluded.engagement_score,
          activity_score = excluded.activity_score,
          seniority_score = excluded.seniority_score,
          reciprocity_score = excluded.reciprocity_score,
          total_score = excluded.total_score,
          current_category = excluded.current_category,
          last_calculated_at = datetime('now')
      `).run(
        userId,
        contactUsername,
        scoreBreakdown.dms,
        scoreBreakdown.engagement,
        scoreBreakdown.activity,
        scoreBreakdown.seniority,
        scoreBreakdown.reciprocity,
        scoreBreakdown.total,
        currentCategory || 'lead'
      );

      sqlite.close();

      console.log(`📊 Contact score updated: @${contactUsername} = ${scoreBreakdown.total}/100`);

      res.json({
        success: true,
        score: scoreBreakdown.total,
        breakdown: scoreBreakdown
      });
    } catch (error: any) {
      console.error("Analyze contact error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Create classification suggestion
  app.post("/api/extension/suggest-transition", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const { contactUsername, fromCategory, toCategory, score, confidence, reason, evidence } = req.body;

      if (!contactUsername || !fromCategory || !toCategory) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      const result = sqlite.prepare(`
        INSERT INTO classification_suggestions (
          user_id, contact_username, from_category, to_category,
          score, confidence, reason, evidence, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
      `).run(
        userId,
        contactUsername,
        fromCategory,
        toCategory,
        score,
        confidence,
        reason,
        JSON.stringify(evidence || [])
      );

      const suggestionId = result.lastInsertRowid;

      sqlite.close();

      console.log(`💡 Suggestion created: @${contactUsername} ${fromCategory} → ${toCategory} (ID: ${suggestionId})`);

      res.json({
        success: true,
        suggestionId,
        created: true
      });
    } catch (error: any) {
      console.error("Create suggestion error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Validate suggestion (accept or reject)
  app.post("/api/extension/validate-suggestion", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const { suggestionId, action, reason } = req.body;

      if (!suggestionId || !action) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      // Get suggestion
      const suggestion = sqlite.prepare(`
        SELECT * FROM classification_suggestions 
        WHERE id = ? AND user_id = ?
      `).get(suggestionId, userId) as any;

      if (!suggestion) {
        sqlite.close();
        return res.status(404).json({ message: "Suggestion not found" });
      }

      if (action === 'accept') {
        // Update suggestion status
        sqlite.prepare(`
          UPDATE classification_suggestions 
          SET status = 'accepted', validated_at = datetime('now')
          WHERE id = ?
        `).run(suggestionId);

        // Update contact score category
        sqlite.prepare(`
          UPDATE contact_scores 
          SET current_category = ?, suggested_category = NULL
          WHERE user_id = ? AND contact_username = ?
        `).run(suggestion.to_category, userId, suggestion.contact_username);

        // Update circle_members if exists
        sqlite.prepare(`
          UPDATE circle_members 
          SET category_v2 = ?
          WHERE user_id = ? AND member_username = ?
        `).run(suggestion.to_category, userId, suggestion.contact_username);

        // Log transition
        sqlite.prepare(`
          INSERT INTO classification_history (
            user_id, contact_username, from_category, to_category,
            score_at_transition, trigger_type, created_at
          ) VALUES (?, ?, ?, ?, ?, 'auto_accepted', datetime('now'))
        `).run(
          userId,
          suggestion.contact_username,
          suggestion.from_category,
          suggestion.to_category,
          suggestion.score
        );

        sqlite.close();

        console.log(`✅ Suggestion ${suggestionId} accepted: @${suggestion.contact_username} → ${suggestion.to_category}`);

        res.json({
          success: true,
          newCategory: suggestion.to_category
        });
      } else if (action === 'reject') {
        // Update suggestion status
        sqlite.prepare(`
          UPDATE classification_suggestions 
          SET status = 'rejected', validated_at = datetime('now'), rejection_reason = ?
          WHERE id = ?
        `).run(reason || '', suggestionId);

        sqlite.close();

        console.log(`❌ Suggestion ${suggestionId} rejected`);

        res.json({ success: true });
      } else {
        sqlite.close();
        res.status(400).json({ message: "Invalid action" });
      }
    } catch (error: any) {
      console.error("Validate suggestion error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get pending suggestions
  app.get("/api/extension/pending-suggestions", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      const suggestions = sqlite.prepare(`
        SELECT 
          s.*,
          cs.total_score as current_score
        FROM classification_suggestions s
        LEFT JOIN contact_scores cs ON s.user_id = cs.user_id AND s.contact_username = cs.contact_username
        WHERE s.user_id = ? AND s.status = 'pending'
        ORDER BY s.created_at DESC
      `).all(userId);

      sqlite.close();

      // Parse JSON fields
      const parsedSuggestions = suggestions.map((s: any) => ({
        ...s,
        evidence: JSON.parse(s.evidence || '[]')
      }));

      res.json({ suggestions: parsedSuggestions });
    } catch (error: any) {
      console.error("Get pending suggestions error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Log classification transition
  app.post("/api/extension/log-transition", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const { contactUsername, fromCategory, toCategory, score, triggerType, notes } = req.body;

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      sqlite.prepare(`
        INSERT INTO classification_history (
          user_id, contact_username, from_category, to_category,
          score_at_transition, trigger_type, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        userId,
        contactUsername,
        fromCategory || null,
        toCategory,
        score || null,
        triggerType,
        notes || null
      );

      sqlite.close();

      console.log(`📝 Transition logged: @${contactUsername} ${fromCategory} → ${toCategory}`);

      res.json({ success: true });
    } catch (error: any) {
      console.error("Log transition error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== DM COLLECTION ROUTES ====================

  // Sync DMs from extension
  app.post("/api/extension/sync-dms", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const { messages, conversations } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "Invalid messages data" });
      }

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      let insertedMessages = 0;
      let updatedConversations = 0;

      // Insérer les messages
      const insertMessage = sqlite.prepare(`
        INSERT INTO dm_messages (
          user_id, conversation_with, message_id, message_text,
          media_urls, is_sent, is_read, reactions, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime(?, 'unixepoch'))
        ON CONFLICT(user_id, message_id) DO UPDATE SET
          is_read = excluded.is_read,
          reactions = excluded.reactions
      `);

      messages.forEach((msg: any) => {
        insertMessage.run(
          userId,
          msg.conversationWith,
          msg.messageId,
          msg.text,
          JSON.stringify(msg.mediaUrls || []),
          msg.isSent ? 1 : 0,
          msg.isRead ? 1 : 0,
          JSON.stringify(msg.reactions || []),
          Math.floor(msg.timestamp / 1000)
        );
        insertedMessages++;
      });

      // Mettre à jour les conversations
      if (conversations && Array.isArray(conversations)) {
        const upsertConversation = sqlite.prepare(`
          INSERT INTO dm_conversations (
            user_id, conversation_with, full_name, avatar_url,
            is_verified, total_messages, unread_count, last_message_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime(?, 'unixepoch'))
          ON CONFLICT(user_id, conversation_with) DO UPDATE SET
            full_name = excluded.full_name,
            avatar_url = excluded.avatar_url,
            total_messages = excluded.total_messages,
            unread_count = excluded.unread_count,
            last_message_at = excluded.last_message_at,
            updated_at = datetime('now')
        `);

        conversations.forEach((conv: any) => {
          upsertConversation.run(
            userId,
            conv.username,
            conv.fullName || null,
            conv.avatarUrl || null,
            conv.isVerified ? 1 : 0,
            conv.messageCount || 0,
            conv.unreadCount || 0,
            Math.floor(conv.lastMessageAt / 1000)
          );
          updatedConversations++;
        });
      }

      // Calculer les statistiques DMs
      sqlite.prepare(`
        INSERT OR REPLACE INTO dm_stats (
          user_id, contact_username, messages_sent, messages_received,
          total_messages, first_message_at, last_message_at, last_calculated_at
        )
        SELECT 
          user_id,
          conversation_with,
          SUM(CASE WHEN is_sent = 1 THEN 1 ELSE 0 END) as messages_sent,
          SUM(CASE WHEN is_sent = 0 THEN 1 ELSE 0 END) as messages_received,
          COUNT(*) as total_messages,
          MIN(sent_at) as first_message_at,
          MAX(sent_at) as last_message_at,
          datetime('now') as last_calculated_at
        FROM dm_messages
        WHERE user_id = ?
        GROUP BY conversation_with
      `).run(userId);

      sqlite.close();

      console.log(`💬 DMs synced: ${insertedMessages} messages, ${updatedConversations} conversations`);

      res.json({
        success: true,
        insertedMessages,
        updatedConversations
      });
    } catch (error: any) {
      console.error("Sync DMs error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get DM conversations
  app.get("/api/extension/dm-conversations", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      const conversations = sqlite.prepare(`
        SELECT * FROM v_recent_conversations
        WHERE user_id = ?
        ORDER BY last_message_at DESC
        LIMIT 50
      `).all(userId);

      sqlite.close();

      res.json({ conversations });
    } catch (error: any) {
      console.error("Get DM conversations error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get DM stats for a contact
  app.get("/api/extension/dm-stats/:username", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const { username } = req.params;

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      const stats = sqlite.prepare(`
        SELECT * FROM dm_stats
        WHERE user_id = ? AND contact_username = ?
      `).get(userId, username);

      const messages = sqlite.prepare(`
        SELECT * FROM dm_messages
        WHERE user_id = ? AND conversation_with = ?
        ORDER BY sent_at DESC
        LIMIT 100
      `).all(userId, username);

      sqlite.close();

      res.json({
        stats: stats || null,
        messages: messages || []
      });
    } catch (error: any) {
      console.error("Get DM stats error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== CLASSIFICATION DASHBOARD ROUTES ====================

  // Get dashboard stats
  app.get("/api/classification/dashboard-stats", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      // Pending suggestions
      const pendingSuggestions = sqlite.prepare(`
        SELECT COUNT(*) as count FROM classification_suggestions
        WHERE user_id = ? AND status = 'pending'
      `).get(userId) as any;

      // Accepted today
      const acceptedToday = sqlite.prepare(`
        SELECT COUNT(*) as count FROM classification_suggestions
        WHERE user_id = ? AND status = 'accepted' 
        AND DATE(validated_at) = DATE('now')
      `).get(userId) as any;

      // Total contacts
      const totalContacts = sqlite.prepare(`
        SELECT COUNT(*) as count, AVG(total_score) as avgScore 
        FROM contact_scores
        WHERE user_id = ?
      `).get(userId) as any;

      // DM conversations
      const dmConversations = sqlite.prepare(`
        SELECT 
          COUNT(*) as count,
          SUM(total_messages) as totalMessages
        FROM dm_conversations
        WHERE user_id = ?
      `).get(userId) as any;

      sqlite.close();

      res.json({
        pendingSuggestions: pendingSuggestions?.count || 0,
        acceptedToday: acceptedToday?.count || 0,
        totalContacts: totalContacts?.count || 0,
        avgScore: Math.round(totalContacts?.avgScore || 0),
        dmConversations: dmConversations?.count || 0,
        messagesAnalyzed: dmConversations?.totalMessages || 0
      });
    } catch (error: any) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get all suggestions
  app.get("/api/classification/suggestions", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      const suggestions = sqlite.prepare(`
        SELECT 
          s.*,
          cs.total_score as current_score
        FROM classification_suggestions s
        LEFT JOIN contact_scores cs ON s.user_id = cs.user_id AND s.contact_username = cs.contact_username
        WHERE s.user_id = ? AND s.status = 'pending'
        ORDER BY s.created_at DESC
      `).all(userId);

      sqlite.close();

      res.json({ suggestions });
    } catch (error: any) {
      console.error("Get suggestions error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Validate suggestion (for dashboard)
  app.post("/api/classification/validate-suggestion", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const { suggestionId, action, reason } = req.body;

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      const suggestion = sqlite.prepare(`
        SELECT * FROM classification_suggestions 
        WHERE id = ? AND user_id = ?
      `).get(suggestionId, userId) as any;

      if (!suggestion) {
        sqlite.close();
        return res.status(404).json({ message: "Suggestion not found" });
      }

      if (action === 'accept') {
        sqlite.prepare(`
          UPDATE classification_suggestions 
          SET status = 'accepted', validated_at = datetime('now')
          WHERE id = ?
        `).run(suggestionId);

        sqlite.prepare(`
          UPDATE contact_scores 
          SET current_category = ?
          WHERE user_id = ? AND contact_username = ?
        `).run(suggestion.to_category, userId, suggestion.contact_username);

        sqlite.prepare(`
          INSERT INTO classification_history (
            user_id, contact_username, from_category, to_category,
            score_at_transition, trigger_type, created_at
          ) VALUES (?, ?, ?, ?, ?, 'auto_accepted', datetime('now'))
        `).run(
          userId,
          suggestion.contact_username,
          suggestion.from_category,
          suggestion.to_category,
          suggestion.score
        );

        sqlite.close();
        res.json({ success: true });
      } else if (action === 'reject') {
        sqlite.prepare(`
          UPDATE classification_suggestions 
          SET status = 'rejected', validated_at = datetime('now'), rejection_reason = ?
          WHERE id = ?
        `).run(reason || '', suggestionId);

        sqlite.close();
        res.json({ success: true });
      } else {
        sqlite.close();
        res.status(400).json({ message: "Invalid action" });
      }
    } catch (error: any) {
      console.error("Validate suggestion error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get contact scores
  app.get("/api/classification/contact-scores", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      const scores = sqlite.prepare(`
        SELECT * FROM contact_scores
        WHERE user_id = ?
        ORDER BY total_score DESC
        LIMIT 100
      `).all(userId);

      sqlite.close();

      res.json({ scores });
    } catch (error: any) {
      console.error("Get contact scores error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get classification stats
  app.get("/api/classification/stats", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      // Category distribution
      const categoryDistribution = sqlite.prepare(`
        SELECT current_category as category, COUNT(*) as count
        FROM contact_scores
        WHERE user_id = ?
        GROUP BY current_category
      `).all(userId);

      // Transition history (last 30 days)
      const transitionHistory = sqlite.prepare(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM classification_history
        WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `).all(userId);

      // Acceptance rate
      const acceptanceStats = sqlite.prepare(`
        SELECT 
          SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
          COUNT(*) as total
        FROM classification_suggestions
        WHERE user_id = ? AND status IN ('accepted', 'rejected')
      `).get(userId) as any;

      const acceptanceRate = acceptanceStats?.total > 0
        ? (acceptanceStats.accepted / acceptanceStats.total) * 100
        : 0;

      // Average score by category
      const avgScoreByCategory = sqlite.prepare(`
        SELECT current_category as category, AVG(total_score) as avgScore
        FROM contact_scores
        WHERE user_id = ?
        GROUP BY current_category
      `).all(userId);

      // Total transitions
      const totalTransitions = sqlite.prepare(`
        SELECT COUNT(*) as count FROM classification_history
        WHERE user_id = ?
      `).get(userId) as any;

      sqlite.close();

      res.json({
        categoryDistribution,
        transitionHistory,
        acceptanceRate,
        totalTransitions: totalTransitions?.count || 0,
        avgScoreByCategory
      });
    } catch (error: any) {
      console.error("Get classification stats error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get DM conversations (for dashboard)
  app.get("/api/classification/dm-conversations", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      const conversations = sqlite.prepare(`
        SELECT * FROM v_recent_conversations
        WHERE user_id = ?
        ORDER BY last_message_at DESC
        LIMIT 50
      `).all(userId);

      sqlite.close();

      res.json({ conversations });
    } catch (error: any) {
      console.error("Get DM conversations error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== PRIVACY & SECURITY ROUTES ====================

  // Get privacy data overview
  app.get("/api/classification/privacy-data", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      const dmCount = sqlite.prepare(`
        SELECT COUNT(*) as count FROM dm_messages WHERE user_id = ?
      `).get(userId) as any;

      const conversationCount = sqlite.prepare(`
        SELECT COUNT(*) as count FROM dm_conversations WHERE user_id = ?
      `).get(userId) as any;

      const scoreCount = sqlite.prepare(`
        SELECT COUNT(*) as count FROM contact_scores WHERE user_id = ?
      `).get(userId) as any;

      // Calculer la taille approximative
      const totalSize = (dmCount?.count || 0) * 500 + (conversationCount?.count || 0) * 200;
      const sizeKB = Math.round(totalSize / 1024);

      sqlite.close();

      res.json({
        dmCount: dmCount?.count || 0,
        conversationCount: conversationCount?.count || 0,
        scoreCount: scoreCount?.count || 0,
        totalSize: sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`,
        encryptionEnabled: true,
      });
    } catch (error: any) {
      console.error("Get privacy data error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get privacy settings
  app.get("/api/classification/privacy-settings", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      // Créer table si n'existe pas
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS privacy_settings (
          user_id INTEGER PRIMARY KEY,
          dm_collection BOOLEAN DEFAULT 1,
          score_calculation BOOLEAN DEFAULT 1,
          data_storage BOOLEAN DEFAULT 1,
          analytics BOOLEAN DEFAULT 0,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      let settings = sqlite.prepare(`
        SELECT * FROM privacy_settings WHERE user_id = ?
      `).get(userId) as any;

      if (!settings) {
        // Créer paramètres par défaut
        sqlite.prepare(`
          INSERT INTO privacy_settings (user_id) VALUES (?)
        `).run(userId);

        settings = {
          dm_collection: 1,
          score_calculation: 1,
          data_storage: 1,
          analytics: 0,
        };
      }

      sqlite.close();

      res.json({
        dmCollection: Boolean(settings.dm_collection),
        scoreCalculation: Boolean(settings.score_calculation),
        dataStorage: Boolean(settings.data_storage),
        analytics: Boolean(settings.analytics),
      });
    } catch (error: any) {
      console.error("Get privacy settings error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update privacy settings
  app.post("/api/classification/privacy-settings", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const { dmCollection, scoreCalculation, dataStorage, analytics } = req.body;

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      sqlite.prepare(`
        INSERT INTO privacy_settings (
          user_id, dm_collection, score_calculation, data_storage, analytics, updated_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(user_id) DO UPDATE SET
          dm_collection = COALESCE(?, dm_collection),
          score_calculation = COALESCE(?, score_calculation),
          data_storage = COALESCE(?, data_storage),
          analytics = COALESCE(?, analytics),
          updated_at = datetime('now')
      `).run(
        userId,
        dmCollection !== undefined ? (dmCollection ? 1 : 0) : null,
        scoreCalculation !== undefined ? (scoreCalculation ? 1 : 0) : null,
        dataStorage !== undefined ? (dataStorage ? 1 : 0) : null,
        analytics !== undefined ? (analytics ? 1 : 0) : null,
        dmCollection !== undefined ? (dmCollection ? 1 : 0) : null,
        scoreCalculation !== undefined ? (scoreCalculation ? 1 : 0) : null,
        dataStorage !== undefined ? (dataStorage ? 1 : 0) : null,
        analytics !== undefined ? (analytics ? 1 : 0) : null
      );

      sqlite.close();

      res.json({ success: true });
    } catch (error: any) {
      console.error("Update privacy settings error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Export user data (RGPD)
  app.get("/api/classification/export-data", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      // Collecter toutes les données
      const messages = sqlite.prepare(`
        SELECT * FROM dm_messages WHERE user_id = ?
      `).all(userId);

      const conversations = sqlite.prepare(`
        SELECT * FROM dm_conversations WHERE user_id = ?
      `).all(userId);

      const scores = sqlite.prepare(`
        SELECT * FROM contact_scores WHERE user_id = ?
      `).all(userId);

      const suggestions = sqlite.prepare(`
        SELECT * FROM classification_suggestions WHERE user_id = ?
      `).all(userId);

      const history = sqlite.prepare(`
        SELECT * FROM classification_history WHERE user_id = ?
      `).all(userId);

      sqlite.close();

      const exportData = {
        exportDate: new Date().toISOString(),
        userId,
        data: {
          messages,
          conversations,
          scores,
          suggestions,
          history,
        },
        metadata: {
          messageCount: messages.length,
          conversationCount: conversations.length,
          scoreCount: scores.length,
        },
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="waler-data-${userId}-${Date.now()}.json"`);
      res.json(exportData);
    } catch (error: any) {
      console.error("Export data error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Delete all user data (RGPD)
  app.delete("/api/classification/delete-data", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      // Supprimer toutes les données
      sqlite.prepare(`DELETE FROM dm_messages WHERE user_id = ?`).run(userId);
      sqlite.prepare(`DELETE FROM dm_conversations WHERE user_id = ?`).run(userId);
      sqlite.prepare(`DELETE FROM dm_stats WHERE user_id = ?`).run(userId);
      sqlite.prepare(`DELETE FROM contact_scores WHERE user_id = ?`).run(userId);
      sqlite.prepare(`DELETE FROM classification_suggestions WHERE user_id = ?`).run(userId);
      sqlite.prepare(`DELETE FROM classification_history WHERE user_id = ?`).run(userId);
      sqlite.prepare(`DELETE FROM privacy_settings WHERE user_id = ?`).run(userId);

      sqlite.close();

      console.log(`🗑️ All data deleted for user ${userId}`);

      res.json({ success: true, message: "Toutes vos données ont été supprimées" });
    } catch (error: any) {
      console.error("Delete data error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== SURVEILLANCE ROUTES ====================

  // Get surveillance configuration for all contacts
  app.get("/api/surveillance/config", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      const configs = sqlite.prepare(`
        SELECT * FROM surveillance_config
        WHERE user_id = ? AND is_active = 1
        ORDER BY priority ASC, next_check_at ASC
      `).all(userId);

      sqlite.close();

      res.json({ configs });
    } catch (error: any) {
      console.error("Get surveillance config error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get contacts to check now (by priority)
  app.get("/api/surveillance/to-check", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      const contacts = sqlite.prepare(`
        SELECT * FROM v_contacts_to_check
        WHERE user_id = ? AND should_check_now = 1
        ORDER BY priority ASC
        LIMIT 50
      `).all(userId);

      sqlite.close();

      res.json({ contacts });
    } catch (error: any) {
      console.error("Get contacts to check error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update surveillance configuration
  app.post("/api/surveillance/config", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const { contactUsername, category, checkInterval, priority } = req.body;

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      // Calculer next_check_at
      const nextCheckAt = new Date(Date.now() + checkInterval * 60 * 1000).toISOString();

      sqlite.prepare(`
        INSERT INTO surveillance_config (
          user_id, contact_username, category, check_interval, priority, next_check_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, contact_username) DO UPDATE SET
          category = ?,
          check_interval = ?,
          priority = ?,
          next_check_at = ?,
          updated_at = CURRENT_TIMESTAMP
      `).run(
        userId, contactUsername, category, checkInterval, priority, nextCheckAt,
        category, checkInterval, priority, nextCheckAt
      );

      sqlite.close();

      res.json({ success: true });
    } catch (error: any) {
      console.error("Update surveillance config error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Record surveillance check
  app.post("/api/surveillance/record-check", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const { contactUsername, category, status, changesDetected, details, durationMs } = req.body;

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      sqlite.prepare(`
        INSERT INTO surveillance_history (
          user_id, contact_username, category, check_type, status, 
          changes_detected, details, duration_ms
        ) VALUES (?, ?, ?, 'scheduled', ?, ?, ?, ?)
      `).run(
        userId, contactUsername, category, status,
        changesDetected || 0, details ? JSON.stringify(details) : null, durationMs || 0
      );

      sqlite.close();

      res.json({ success: true });
    } catch (error: any) {
      console.error("Record surveillance check error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get surveillance alerts
  app.get("/api/surveillance/alerts", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      const alerts = sqlite.prepare(`
        SELECT * FROM v_unread_alerts
        WHERE user_id = ?
        LIMIT 50
      `).all(userId);

      sqlite.close();

      res.json({ alerts });
    } catch (error: any) {
      console.error("Get surveillance alerts error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Mark alert as read
  app.post("/api/surveillance/alerts/:alertId/read", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const { alertId } = req.params;

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      sqlite.prepare(`
        UPDATE surveillance_alerts
        SET is_read = 1
        WHERE id = ? AND user_id = ?
      `).run(alertId, userId);

      sqlite.close();

      res.json({ success: true });
    } catch (error: any) {
      console.error("Mark alert as read error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get surveillance statistics
  app.get("/api/surveillance/stats", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      const statsByCategory = sqlite.prepare(`
        SELECT * FROM v_surveillance_stats_by_category
        WHERE user_id = ?
      `).all(userId);

      const trends = sqlite.prepare(`
        SELECT * FROM v_surveillance_trends
        WHERE user_id = ?
        ORDER BY total_changes DESC
        LIMIT 10
      `).all(userId);

      const totalAlerts = sqlite.prepare(`
        SELECT COUNT(*) as count FROM surveillance_alerts
        WHERE user_id = ? AND is_read = 0
      `).get(userId) as any;

      sqlite.close();

      res.json({
        byCategory: statsByCategory,
        trends,
        unreadAlerts: totalAlerts?.count || 0,
      });
    } catch (error: any) {
      console.error("Get surveillance stats error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Sync surveillance with classification
  app.post("/api/surveillance/sync-with-classification", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      // Récupérer tous les contacts avec scores
      const contacts = sqlite.prepare(`
        SELECT contact_username, current_category FROM contact_scores
        WHERE user_id = ?
      `).all(userId) as any[];

      // Créer/mettre à jour la config de surveillance pour chaque contact
      for (const contact of contacts) {
        const intervals: Record<string, number> = {
          'client': 15,
          'prospect': 60,
          'network': 240,
          'lead': 1440,
        };

        const priorities: Record<string, number> = {
          'client': 1,
          'prospect': 2,
          'network': 3,
          'lead': 4,
        };

        const checkInterval = intervals[contact.current_category] || 1440;
        const priority = priorities[contact.current_category] || 4;
        const nextCheckAt = new Date(Date.now() + checkInterval * 60 * 1000).toISOString();

        sqlite.prepare(`
          INSERT INTO surveillance_config (
            user_id, contact_username, category, check_interval, priority, next_check_at
          ) VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, contact_username) DO UPDATE SET
            category = ?,
            check_interval = ?,
            priority = ?,
            next_check_at = ?,
            updated_at = CURRENT_TIMESTAMP
        `).run(
          userId, contact.contact_username, contact.current_category, checkInterval, priority, nextCheckAt,
          contact.current_category, checkInterval, priority, nextCheckAt
        );
      }

      sqlite.close();

      res.json({ 
        success: true, 
        synced: contacts.length,
        message: `Surveillance configurée pour ${contacts.length} contacts`
      });
    } catch (error: any) {
      console.error("Sync surveillance error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Analyze DMs and trigger classification
  app.post("/api/extension/analyze-dms", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const { contactUsername } = req.body;

      if (!contactUsername) {
        return res.status(400).json({ message: "Missing contact username" });
      }

      const dbPath = path.join(import.meta.dirname, "waler.db");
      const sqlite = new Database(dbPath);

      // Récupérer les messages
      const messages = sqlite.prepare(`
        SELECT * FROM dm_messages
        WHERE user_id = ? AND conversation_with = ?
        ORDER BY sent_at ASC
      `).all(userId, contactUsername);

      // Récupérer les stats
      const stats = sqlite.prepare(`
        SELECT * FROM dm_stats
        WHERE user_id = ? AND contact_username = ?
      `).get(userId, contactUsername) as any;

      sqlite.close();

      // Calculer le score DMs basé sur les statistiques
      let dmScore = 0;

      if (stats) {
        // Fréquence des messages (0-5 points)
        const messageFrequency = Math.min(Math.floor(stats.total_messages / 5), 5);

        // Temps de réponse (0-5 points)
        let responseTimeScore = 0;
        if (stats.avg_response_time_received_minutes < 60) responseTimeScore = 5;
        else if (stats.avg_response_time_received_minutes < 360) responseTimeScore = 4;
        else if (stats.avg_response_time_received_minutes < 1440) responseTimeScore = 3;
        else if (stats.avg_response_time_received_minutes < 2880) responseTimeScore = 2;
        else responseTimeScore = 1;

        // Initiateur (0-5 points)
        const initiatorScore = Math.min(
          Math.floor(stats.conversations_initiated_by_contact / 2),
          5
        );

        // Longueur des messages (0-5 points)
        let lengthScore = 0;
        if (stats.avg_message_length_received > 200) lengthScore = 5;
        else if (stats.avg_message_length_received > 100) lengthScore = 4;
        else if (stats.avg_message_length_received > 50) lengthScore = 3;
        else if (stats.avg_message_length_received > 20) lengthScore = 2;
        else lengthScore = 1;

        // Note: Les mots-clés (0-10 points) sont analysés côté extension
        // Ici on calcule seulement les métriques quantitatives

        dmScore = messageFrequency + responseTimeScore + initiatorScore + lengthScore;
      }

      res.json({
        success: true,
        dmScore,
        messageCount: messages.length,
        stats
      });
    } catch (error: any) {
      console.error("Analyze DMs error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== UNFOLLOWERS API ROUTES ====================

  // Get unfollowers (simple unfollows only)
  app.get("/api/unfollowers", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      if (!pgPool) {
        return res.status(500).json({ message: "Database pool not available" });
      }

      const result = await pgPool.query(`
        SELECT id, username, avatar_url, status, detected_at, verified_at
        FROM unfollowers
        WHERE user_id = $1 AND status = 'unfollowed'
        ORDER BY detected_at DESC
      `, [userId]);

      // Convertir snake_case en camelCase
      const unfollowers = result.rows.map(row => ({
        id: row.id,
        username: row.username,
        avatarUrl: row.avatar_url,
        status: row.status,
        detectedAt: row.detected_at,
        verifiedAt: row.verified_at
      }));

      res.json({ unfollowers });
    } catch (error: any) {
      console.error("Get unfollowers error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get ghost followers (blocked + deleted)
  app.get("/api/ghost-followers", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      if (!pgPool) {
        return res.status(500).json({ message: "Database pool not available" });
      }

      const result = await pgPool.query(`
        SELECT id, username, avatar_url, status, detected_at, verified_at
        FROM unfollowers
        WHERE user_id = $1 AND status IN ('blocked', 'deleted')
        ORDER BY detected_at DESC
      `, [userId]);

      // Convertir snake_case en camelCase
      const ghostFollowers = result.rows.map(row => ({
        id: row.id,
        username: row.username,
        avatarUrl: row.avatar_url,
        status: row.status,
        detectedAt: row.detected_at,
        verifiedAt: row.verified_at
      }));

      res.json({ ghostFollowers });
    } catch (error: any) {
      console.error("Get ghost followers error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Check if an unfollower is unlocked
  app.get("/api/unfollowers/:unfollowerId/unlocked", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      if (!pgPool) {
        return res.status(500).json({ message: "Database pool not available" });
      }

      const unfollowerId = parseInt(req.params.unfollowerId);
      const result = await pgPool.query(`
        SELECT id FROM unlocked_unfollowers
        WHERE user_id = $1 AND unfollower_id = $2
      `, [userId, unfollowerId]);

      res.json({ unlocked: result.rows.length > 0 });
    } catch (error: any) {
      console.error("Check unlocked error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Unlock an unfollower (after completing questionnaire)
  app.post("/api/unfollowers/:unfollowerId/unlock", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      if (!pgPool) {
        return res.status(500).json({ message: "Database pool not available" });
      }

      const unfollowerId = parseInt(req.params.unfollowerId);
      
      // Insert or ignore if already unlocked
      await pgPool.query(`
        INSERT INTO unlocked_unfollowers (user_id, unfollower_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, unfollower_id) DO NOTHING
      `, [userId, unfollowerId]);

      res.json({ success: true, message: "Compte débloqué" });
    } catch (error: any) {
      console.error("Unlock unfollower error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get all unlocked unfollowers for a user
  app.get("/api/unfollowers/unlocked/list", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      if (!pgPool) {
        return res.status(500).json({ message: "Database pool not available" });
      }

      const result = await pgPool.query(`
        SELECT unfollower_id FROM unlocked_unfollowers
        WHERE user_id = $1
      `, [userId]);

      const unlockedIds = result.rows.map(row => row.unfollower_id);
      res.json({ unlockedIds });
    } catch (error: any) {
      console.error("Get unlocked list error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Unlock ALL unfollowers for a user (after completing Your Circle questionnaire)
  app.post("/api/unfollowers/unlock-all", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      if (!pgPool) {
        return res.status(500).json({ message: "Database pool not available" });
      }

      // Get all unfollower IDs for this user
      const unfollowersResult = await pgPool.query(`
        SELECT id FROM unfollowers
        WHERE user_id = $1
      `, [userId]);

      // Insert all unfollower IDs into unlocked_unfollowers
      const values = unfollowersResult.rows.map(row => `(${userId}, ${row.id})`).join(',');
      
      if (values) {
        await pgPool.query(`
          INSERT INTO unlocked_unfollowers (user_id, unfollower_id)
          VALUES ${values}
          ON CONFLICT (user_id, unfollower_id) DO NOTHING
        `);
      }

      res.json({ 
        success: true, 
        message: "Tous les comptes débloqués",
        count: unfollowersResult.rows.length
      });
    } catch (error: any) {
      console.error("Unlock all unfollowers error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get unfollower stats
  app.get("/api/unfollowers/stats", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      if (!pgPool) {
        return res.status(500).json({ message: "Database pool not available" });
      }

      const result = await pgPool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'unfollowed') as unfollowed_count,
          COUNT(*) FILTER (WHERE status = 'blocked') as blocked_count,
          COUNT(*) FILTER (WHERE status = 'deleted') as deleted_count,
          COUNT(*) as total_count
        FROM unfollowers
        WHERE user_id = $1
      `, [userId]);

      const stats = result.rows[0];

      res.json({
        unfollowed: parseInt(stats.unfollowed_count) || 0,
        blocked: parseInt(stats.blocked_count) || 0,
        deleted: parseInt(stats.deleted_count) || 0,
        ghost: (parseInt(stats.blocked_count) || 0) + (parseInt(stats.deleted_count) || 0),
        total: parseInt(stats.total_count) || 0
      });
    } catch (error: any) {
      console.error("Get unfollower stats error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}

async function seedMockData(userId: number) {
  const names = ["thomas_95", "marie_photo", "alex_dev", "julia_art", "kevin_fit", "sophie_travel", "lucas_music", "emma_cook", "noah_sport", "lea_mode"];
  const now = new Date();

  for (let i = 0; i < 10; i++) {
    const detectedAt = new Date(now.getFullYear(), now.getMonth(), Math.floor(Math.random() * 28) + 1);
    await storage.createUnfollower({
      userId,
      username: names[i],
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${names[i]}`,
    });
  }

  const followerNames = ["camille_b", "pierre_v", "sarah_m", "antoine_r", "chloe_d", "maxime_l", "ines_p", "romain_g"];
  for (let i = 0; i < 8; i++) {
    await storage.createFollower({
      userId,
      username: followerNames[i],
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${followerNames[i]}`,
    });
  }

  const blockerNames = ["ghost_user_1", "deleted_acc", "block_me_99", "vanished_x"];
  for (let i = 0; i < 4; i++) {
    await storage.createBlocker({
      userId,
      username: blockerNames[i],
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${blockerNames[i]}`,
      type: i < 2 ? "blocker" : "disappeared",
    });
  }
}
