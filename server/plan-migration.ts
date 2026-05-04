import { db } from "./db";
import { users, subscriptions, plans, planChangeHistory } from "@shared/schema";
import { eq } from "drizzle-orm";
import { pauseProAgents, resumeProAgents, stopAllAgents, reactivateAllAgents } from "./agent-manager";

/**
 * Service de migration de plan qui garantit qu'aucune donnée n'est perdue
 * lors du changement de plan (upgrade ou downgrade)
 */

export interface PlanChangeResult {
  success: boolean;
  previousPlan: string;
  newPlan: string;
  dataPreserved: boolean;
  message: string;
  warnings?: string[];
  agentsAffected?: {
    paused?: string[];
    resumed?: string[];
    stopped?: string[];
    reactivated?: string[];
  };
}

/**
 * Change le plan d'un utilisateur en préservant toutes ses données
 */
export async function changePlan(
  userId: number,
  newPlanId: number,
  options: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    billingPeriod?: 'monthly' | 'yearly';
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
  } = {}
): Promise<PlanChangeResult> {
  try {
    // 1. Récupérer le plan actuel
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!currentUser) {
      throw new Error(`User ${userId} not found`);
    }

    const [currentSubscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    const previousPlanName = currentUser.subscriptionTier || 'none';

    // 2. Récupérer le nouveau plan
    const [newPlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, newPlanId));

    if (!newPlan) {
      throw new Error(`Plan ${newPlanId} not found`);
    }

    const newPlanName = newPlan.name;

    // 3. Vérifier les limites et créer des warnings si nécessaire
    const warnings: string[] = [];
    
    // Note: On ne supprime JAMAIS les données, on avertit seulement
    if (newPlan.maxAccounts < (currentUser.followersCount || 0)) {
      warnings.push(
        `Le nouveau plan limite à ${newPlan.maxAccounts} comptes. ` +
        `Vos données existantes sont préservées mais vous ne pourrez pas ajouter de nouveaux comptes.`
      );
    }

    // 4. Mettre à jour la subscription (SANS supprimer de données)
    if (currentSubscription) {
      await db
        .update(subscriptions)
        .set({
          planId: newPlanId,
          stripeCustomerId: options.stripeCustomerId || currentSubscription.stripeCustomerId,
          stripeSubscriptionId: options.stripeSubscriptionId || currentSubscription.stripeSubscriptionId,
          billingPeriod: options.billingPeriod || currentSubscription.billingPeriod,
          currentPeriodStart: options.currentPeriodStart || currentSubscription.currentPeriodStart,
          currentPeriodEnd: options.currentPeriodEnd || currentSubscription.currentPeriodEnd,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, currentSubscription.id));
    } else {
      // Créer une nouvelle subscription
      await db.insert(subscriptions).values({
        userId,
        planId: newPlanId,
        stripeCustomerId: options.stripeCustomerId,
        stripeSubscriptionId: options.stripeSubscriptionId,
        status: 'active',
        billingPeriod: options.billingPeriod,
        currentPeriodStart: options.currentPeriodStart,
        currentPeriodEnd: options.currentPeriodEnd,
      });
    }

    // 5. Mettre à jour le tier dans la table users
    await db
      .update(users)
      .set({
        subscriptionTier: newPlanName as 'premium' | 'pro',
        subscriptionStatus: 'active',
      })
      .where(eq(users.id, userId));

    // 6. Enregistrer dans l'historique des changements
    const changeType = 
      !currentSubscription ? 'initial' :
      previousPlanName === 'none' ? 'initial' :
      newPlan.priceMonthly > (currentSubscription.planId || 0) ? 'upgrade' : 'downgrade';
    
    await db.insert(planChangeHistory).values({
      userId,
      previousPlanId: currentSubscription?.planId || null,
      newPlanId,
      changeType,
      reason: 'manual_change',
      dataPreserved: true,
      warnings: warnings.length > 0 ? warnings : null,
      metadata: {
        previousPlan: previousPlanName,
        newPlan: newPlanName,
        timestamp: new Date().toISOString(),
        stripeCustomerId: options.stripeCustomerId,
        stripeSubscriptionId: options.stripeSubscriptionId,
      },
    });

    // 7. Gérer les agents selon le changement de plan
    const agentsAffected: {
      paused?: string[];
      resumed?: string[];
      stopped?: string[];
      reactivated?: string[];
    } = {};

    // Downgrade Pro → Premium : mettre en pause les agents Pro
    if (previousPlanName === 'pro' && newPlanName === 'premium') {
      const pauseResult = await pauseProAgents(userId, 'plan_downgrade');
      agentsAffected.paused = pauseResult.paused;
      warnings.push(pauseResult.message);
      console.log(`⏸️ Paused Pro agents:`, pauseResult.paused);
    }

    // Upgrade Premium → Pro : réactiver les agents Pro
    if (previousPlanName === 'premium' && newPlanName === 'pro') {
      const resumeResult = await resumeProAgents(userId);
      agentsAffected.resumed = resumeResult.resumed;
      if (resumeResult.resumed.length > 0) {
        warnings.push(resumeResult.message);
      }
      console.log(`▶️ Resumed Pro agents:`, resumeResult.resumed);
    }

    // 8. Logger le changement
    console.log(`✅ Plan changed for user ${userId}: ${previousPlanName} → ${newPlanName}`);
    console.log(`   Data preserved: ALL (followers, unfollowers, blockers, clients, etc.)`);
    console.log(`   Change type: ${changeType}`);
    if (warnings.length > 0) {
      console.log(`   Warnings: ${warnings.join(', ')}`);
    }

    return {
      success: true,
      previousPlan: previousPlanName,
      newPlan: newPlanName,
      dataPreserved: true,
      message: `Plan changé avec succès de ${previousPlanName} vers ${newPlanName}. Toutes vos données ont été préservées.`,
      warnings: warnings.length > 0 ? warnings : undefined,
      agentsAffected: Object.keys(agentsAffected).length > 0 ? agentsAffected : undefined,
    };
  } catch (error) {
    console.error('Error changing plan:', error);
    throw error;
  }
}

/**
 * Downgrade un utilisateur vers un plan inférieur
 * IMPORTANT: Les données ne sont JAMAIS supprimées, seulement les accès sont limités
 */
export async function downgradePlan(
  userId: number,
  newPlanId: number
): Promise<PlanChangeResult> {
  const result = await changePlan(userId, newPlanId);
  
  // Ajouter un message spécifique pour le downgrade
  result.message += '\n\nNote: Vos données historiques restent accessibles. ' +
    'Vous pouvez toujours consulter vos unfollowers, followers et blockers passés.';
  
  return result;
}

/**
 * Upgrade un utilisateur vers un plan supérieur
 */
export async function upgradePlan(
  userId: number,
  newPlanId: number,
  stripeData?: {
    customerId: string;
    subscriptionId: string;
    billingPeriod: 'monthly' | 'yearly';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }
): Promise<PlanChangeResult> {
  const result = await changePlan(userId, newPlanId, stripeData);
  
  result.message += '\n\nFélicitations! Vous avez maintenant accès à toutes les fonctionnalités de votre nouveau plan.';
  
  return result;
}

/**
 * Annule un plan (downgrade vers gratuit) mais GARDE toutes les données
 */
export async function cancelPlan(userId: number): Promise<PlanChangeResult> {
  try {
    // Trouver le plan gratuit/base
    const [basePlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.name, 'base'));

    if (!basePlan) {
      throw new Error('Base plan not found');
    }

    // Mettre à jour la subscription pour annuler à la fin de la période
    const [currentSubscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    if (currentSubscription) {
      await db
        .update(subscriptions)
        .set({
          cancelAtPeriodEnd: true,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, currentSubscription.id));
    }

    // Arrêter tous les agents lors de l'annulation
    const stopResult = await stopAllAgents(userId, 'subscription_cancelled');

    return {
      success: true,
      previousPlan: 'premium/pro',
      newPlan: 'base',
      dataPreserved: true,
      message: 'Votre abonnement sera annulé à la fin de la période de facturation. ' +
        'Toutes vos données resteront accessibles et vous pourrez réactiver votre plan à tout moment.',
      warnings: [
        'Votre plan actuel restera actif jusqu\'à la fin de la période payée',
        'Aucune donnée ne sera supprimée',
        stopResult.message,
      ],
      agentsAffected: {
        stopped: stopResult.stopped,
      },
    };
  } catch (error) {
    console.error('Error canceling plan:', error);
    throw error;
  }
}

/**
 * Vérifie si un utilisateur peut accéder à une fonctionnalité selon son plan
 * (pour l'UI, ne bloque PAS l'accès aux données existantes)
 */
export async function canAccessFeature(
  userId: number,
  feature: 'multiple_accounts' | 'professional_mode' | 'advanced_analytics' | 'export'
): Promise<{ allowed: boolean; reason?: string }> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  const tier = user.subscriptionTier;

  switch (feature) {
    case 'multiple_accounts':
      return tier === 'pro'
        ? { allowed: true }
        : { allowed: false, reason: 'Fonctionnalité réservée au plan Pro' };
    
    case 'professional_mode':
      return tier === 'pro'
        ? { allowed: true }
        : { allowed: false, reason: 'Mode professionnel réservé au plan Pro' };
    
    case 'advanced_analytics':
      return tier === 'pro' || tier === 'premium'
        ? { allowed: true }
        : { allowed: false, reason: 'Fonctionnalité réservée aux plans Premium et Pro' };
    
    case 'export':
      return tier === 'pro' || tier === 'premium'
        ? { allowed: true }
        : { allowed: false, reason: 'Export réservé aux plans Premium et Pro' };
    
    default:
      return { allowed: true };
  }
}
