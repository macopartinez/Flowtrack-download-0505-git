import { db } from "./db";
import { plans, subscriptions, type Plan, type Subscription } from "@shared/schema";
import { eq } from "drizzle-orm";

// Plans par défaut
export const DEFAULT_PLANS = [
  {
    name: "base",
    displayName: "Plan Base",
    priceMonthly: 999, // 9.99€
    priceYearly: 9900, // 99€ (économie de ~17%)
    maxAccounts: 1,
    maxHistoryDays: 0, // Illimité
    features: [
      "1 compte Instagram/Facebook",
      "Mode personnel uniquement",
      "Historique illimité",
      "Statistiques complètes",
      "Détection des unfollowers",
      "Notifications email",
      "Export CSV/PDF",
    ],
    stripePriceIdMonthly: process.env.STRIPE_PRICE_BASE_MONTHLY || null,
    stripePriceIdYearly: process.env.STRIPE_PRICE_BASE_YEARLY || null,
    isActive: true,
  },
  {
    name: "pro",
    displayName: "Plan Pro",
    priceMonthly: 1999, // 19.99€
    priceYearly: 19900, // 199€ (économie de ~17%)
    maxAccounts: 5,
    maxHistoryDays: 0, // Illimité
    features: [
      "5 comptes Instagram/Facebook",
      "Mode personnel + professionnel",
      "Historique illimité",
      "Statistiques avancées",
      "Analytics professionnels",
      "Notifications temps réel",
      "Export CSV/PDF/Excel",
      "Support prioritaire",
      "Intégrations avancées",
    ],
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || null,
    stripePriceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY || null,
    isActive: true,
  },
];

/**
 * Initialise les plans par défaut dans la DB
 */
export async function seedPlans(): Promise<void> {
  for (const plan of DEFAULT_PLANS) {
    const existing = await db.select().from(plans).where(eq(plans.name, plan.name));
    
    if (existing.length === 0) {
      await db.insert(plans).values(plan);
      console.log(`✅ Plan "${plan.displayName}" créé`);
    }
  }
}

/**
 * Récupère tous les plans actifs
 */
export async function getActivePlans(): Promise<Plan[]> {
  return db.select().from(plans).where(eq(plans.isActive, true));
}

/**
 * Récupère un plan par son nom
 */
export async function getPlanByName(name: string): Promise<Plan | null> {
  const [plan] = await db.select().from(plans).where(eq(plans.name, name));
  return plan || null;
}

/**
 * Récupère un plan par son ID
 */
export async function getPlanById(id: number): Promise<Plan | null> {
  const [plan] = await db.select().from(plans).where(eq(plans.id, id));
  return plan || null;
}

/**
 * Récupère le plan d'un utilisateur
 */
export async function getUserPlan(userId: number): Promise<{
  plan: Plan;
  subscription: Subscription | null;
}> {
  // Chercher la subscription de l'utilisateur
  const [userSubscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));

  if (userSubscription) {
    const plan = await getPlanById(userSubscription.planId);
    if (plan) {
      return { plan, subscription: userSubscription };
    }
  }

  // Par défaut, retourner le plan Base
  const basePlan = await getPlanByName("base");
  if (!basePlan) {
    throw new Error("Base plan not found");
  }

  return { plan: basePlan, subscription: null };
}

/**
 * Crée ou met à jour une subscription pour un utilisateur
 */
export async function upsertSubscription(data: {
  userId: number;
  planId: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status?: string;
  billingPeriod?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}): Promise<Subscription> {
  // Vérifier si subscription existe
  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, data.userId));

  if (existing) {
    // Mettre à jour
    const [updated] = await db
      .update(subscriptions)
      .set({
        planId: data.planId,
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        status: data.status || existing.status,
        billingPeriod: data.billingPeriod,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, existing.id))
      .returning();

    return updated;
  } else {
    // Créer
    const [created] = await db
      .insert(subscriptions)
      .values({
        userId: data.userId,
        planId: data.planId,
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        status: data.status || "active",
        billingPeriod: data.billingPeriod,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
      })
      .returning();

    return created;
  }
}

/**
 * Vérifie si un utilisateur peut ajouter un compte
 */
export async function canAddAccount(userId: number, currentAccountCount: number): Promise<{
  allowed: boolean;
  reason?: string;
  maxAccounts: number;
}> {
  const { plan } = await getUserPlan(userId);

  // 0 = illimité
  if (plan.maxAccounts === 0) {
    return { allowed: true, maxAccounts: 0 };
  }

  if (currentAccountCount >= plan.maxAccounts) {
    return {
      allowed: false,
      reason: `Plan ${plan.displayName} limité à ${plan.maxAccounts} compte(s)`,
      maxAccounts: plan.maxAccounts,
    };
  }

  return { allowed: true, maxAccounts: plan.maxAccounts };
}
