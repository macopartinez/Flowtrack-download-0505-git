import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import Database from "better-sqlite3";
import path from "path";
import { loginSchema, registerSchema, verifyCodeSchema, unfollowers, blockers, users, subscriptions, planChangeHistory } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq } from "drizzle-orm";
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
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
    
    const [recentUnfollowers, recentFollowers, recentBlockers] = await Promise.all([
      storage.getUnfollowers(requestedUserId),
      storage.getFollowers(requestedUserId),
      storage.getBlockers(requestedUserId),
    ]);

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
