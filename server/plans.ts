import { db } from "./db";
import { plans, subscriptions, type Plan, type Subscription } from "@shared/schema";
import { eq } from "drizzle-orm";

// Plans par défaut
export const DEFAULT_PLANS = [
  {
    // NB : nom interne "base" = tier client 'premium' (routes.ts mappe
    // 'premium' → 'base'). On ne renomme pas la clé pour ne pas casser ce mapping.
    name: "base",
    displayName: "Base",
    priceMonthly: 499, // 4.99€
    priceYearly: 4799, // 47.99€ (économie de ~20%)
    maxAccounts: 1,
    maxHistoryDays: 30,
    features: [
      "1 Instagram account",
      "Personal mode only",
      "30-day change history",
      "See who unfollowed or blocked you",
      "Relationship & psychological insights",
      "Real-time unfollower alerts",
      "PDF export",
      "Email support",
    ],
    stripePriceIdMonthly: process.env.STRIPE_PRICE_BASE_MONTHLY || null,
    stripePriceIdYearly: process.env.STRIPE_PRICE_BASE_YEARLY || null,
    isActive: true,
  },
  {
    name: "pro",
    displayName: "Pro",
    priceMonthly: 1499, // 14.99€
    priceYearly: 14399, // 143.99€ (économie de ~20%)
    maxAccounts: 3,
    maxHistoryDays: 0, // 0 = illimité
    features: [
      "Everything in Base",
      "Up to 3 Instagram accounts",
      "Unlimited history",
      "Personal + Professional dual mode",
      "Client & prospect CRM (VIP / Keep / Watch)",
      "DM conversation temperature (hot / warm / cold)",
      "Lead qualification phases",
      "Interaction signal timeline",
      "Contact health & priority scoring",
      "PDF progress reports & export",
      "Waler Pro Coach badge",
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
