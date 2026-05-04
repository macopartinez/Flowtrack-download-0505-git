import { db } from "./db";
import { agentStates, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * Service de gestion des agents
 * Gère la pause/reprise des agents lors des changements de plan
 */

export type AgentType = 'follow' | 'prospects' | 'connections' | 'clients';
export type AgentStatus = 'active' | 'paused' | 'stopped';

export interface AgentState {
  id: number;
  userId: number;
  agentType: AgentType;
  status: AgentStatus;
  pausedAt: Date | null;
  pauseReason: string | null;
  lastRunAt: Date | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Agents qui nécessitent le plan Pro
 */
const PRO_ONLY_AGENTS: AgentType[] = ['clients', 'prospects', 'connections'];

/**
 * Agents disponibles pour tous les plans
 */
const BASIC_AGENTS: AgentType[] = ['follow'];

/**
 * Récupère l'état d'un agent pour un utilisateur
 */
export async function getAgentState(
  userId: number,
  agentType: AgentType
): Promise<AgentState | null> {
  const [state] = await db
    .select()
    .from(agentStates)
    .where(
      and(
        eq(agentStates.userId, userId),
        eq(agentStates.agentType, agentType)
      )
    );

  return state || null;
}

/**
 * Récupère tous les états des agents d'un utilisateur
 */
export async function getAllAgentStates(userId: number): Promise<AgentState[]> {
  return db
    .select()
    .from(agentStates)
    .where(eq(agentStates.userId, userId));
}

/**
 * Crée ou met à jour l'état d'un agent
 */
export async function upsertAgentState(
  userId: number,
  agentType: AgentType,
  status: AgentStatus,
  options: {
    pauseReason?: string;
    metadata?: any;
  } = {}
): Promise<AgentState> {
  const existing = await getAgentState(userId, agentType);

  if (existing) {
    const [updated] = await db
      .update(agentStates)
      .set({
        status,
        pausedAt: status === 'paused' ? new Date() : null,
        pauseReason: status === 'paused' ? options.pauseReason : null,
        metadata: options.metadata || existing.metadata,
        updatedAt: new Date(),
      })
      .where(eq(agentStates.id, existing.id))
      .returning();

    return updated;
  } else {
    const [created] = await db
      .insert(agentStates)
      .values({
        userId,
        agentType,
        status,
        pausedAt: status === 'paused' ? new Date() : null,
        pauseReason: status === 'paused' ? options.pauseReason : null,
        metadata: options.metadata || {},
      })
      .returning();

    return created;
  }
}

/**
 * Met en pause tous les agents Pro d'un utilisateur
 * Appelé lors d'un downgrade Pro → Premium
 */
export async function pauseProAgents(
  userId: number,
  reason: string = 'plan_downgrade'
): Promise<{ paused: AgentType[]; message: string }> {
  const pausedAgents: AgentType[] = [];

  for (const agentType of PRO_ONLY_AGENTS) {
    const state = await getAgentState(userId, agentType);
    
    // Ne mettre en pause que si l'agent est actif
    if (!state || state.status === 'active') {
      await upsertAgentState(userId, agentType, 'paused', {
        pauseReason: reason,
        metadata: {
          ...state?.metadata,
          pausedByPlanChange: true,
          previousStatus: state?.status || 'active',
        },
      });
      pausedAgents.push(agentType);
    }
  }

  console.log(`⏸️ Paused Pro agents for user ${userId}:`, pausedAgents);

  return {
    paused: pausedAgents,
    message: `${pausedAgents.length} agents Pro mis en pause. Ils reprendront automatiquement lors du retour au plan Pro.`,
  };
}

/**
 * Réactive tous les agents Pro d'un utilisateur
 * Appelé lors d'un upgrade Premium → Pro
 */
export async function resumeProAgents(
  userId: number
): Promise<{ resumed: AgentType[]; message: string }> {
  const resumedAgents: AgentType[] = [];

  for (const agentType of PRO_ONLY_AGENTS) {
    const state = await getAgentState(userId, agentType);
    
    // Réactiver seulement si l'agent a été mis en pause par un changement de plan
    if (state?.status === 'paused' && state.metadata?.pausedByPlanChange) {
      await upsertAgentState(userId, agentType, 'active', {
        metadata: {
          ...state.metadata,
          pausedByPlanChange: false,
          resumedAt: new Date().toISOString(),
        },
      });
      resumedAgents.push(agentType);
    }
  }

  console.log(`▶️ Resumed Pro agents for user ${userId}:`, resumedAgents);

  return {
    resumed: resumedAgents,
    message: `${resumedAgents.length} agents Pro réactivés. Ils vont reprendre leur travail.`,
  };
}

/**
 * Arrête complètement tous les agents d'un utilisateur
 * Appelé lors d'une annulation d'abonnement
 */
export async function stopAllAgents(
  userId: number,
  reason: string = 'subscription_cancelled'
): Promise<{ stopped: AgentType[]; message: string }> {
  const allAgents: AgentType[] = [...BASIC_AGENTS, ...PRO_ONLY_AGENTS];
  const stoppedAgents: AgentType[] = [];

  for (const agentType of allAgents) {
    const state = await getAgentState(userId, agentType);
    
    if (!state || state.status !== 'stopped') {
      await upsertAgentState(userId, agentType, 'stopped', {
        pauseReason: reason,
        metadata: {
          ...state?.metadata,
          stoppedAt: new Date().toISOString(),
          previousStatus: state?.status || 'active',
        },
      });
      stoppedAgents.push(agentType);
    }
  }

  console.log(`⏹️ Stopped all agents for user ${userId}:`, stoppedAgents);

  return {
    stopped: stoppedAgents,
    message: `Tous les agents ont été arrêtés. Réactivez votre abonnement pour les relancer.`,
  };
}

/**
 * Réactive tous les agents lors d'une réactivation d'abonnement
 */
export async function reactivateAllAgents(
  userId: number,
  tier: 'premium' | 'pro'
): Promise<{ reactivated: AgentType[]; message: string }> {
  const reactivatedAgents: AgentType[] = [];
  
  // Déterminer quels agents réactiver selon le tier
  const agentsToReactivate = tier === 'pro' 
    ? [...BASIC_AGENTS, ...PRO_ONLY_AGENTS]
    : BASIC_AGENTS;

  for (const agentType of agentsToReactivate) {
    const state = await getAgentState(userId, agentType);
    
    if (state?.status === 'stopped') {
      await upsertAgentState(userId, agentType, 'active', {
        metadata: {
          ...state.metadata,
          reactivatedAt: new Date().toISOString(),
        },
      });
      reactivatedAgents.push(agentType);
    }
  }

  console.log(`🔄 Reactivated agents for user ${userId} (${tier}):`, reactivatedAgents);

  return {
    reactivated: reactivatedAgents,
    message: `${reactivatedAgents.length} agents réactivés pour le plan ${tier}.`,
  };
}

/**
 * Vérifie si un agent peut s'exécuter pour un utilisateur
 */
export async function canAgentRun(
  userId: number,
  agentType: AgentType
): Promise<{ allowed: boolean; reason?: string }> {
  // Vérifier le plan de l'utilisateur
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  // Vérifier si l'agent nécessite Pro
  if (PRO_ONLY_AGENTS.includes(agentType) && user.subscriptionTier !== 'pro') {
    return { 
      allowed: false, 
      reason: `L'agent ${agentType} nécessite le plan Pro` 
    };
  }

  // Vérifier l'état de l'agent
  const state = await getAgentState(userId, agentType);
  
  if (state?.status === 'paused') {
    return { 
      allowed: false, 
      reason: `L'agent est en pause: ${state.pauseReason}` 
    };
  }

  if (state?.status === 'stopped') {
    return { 
      allowed: false, 
      reason: `L'agent est arrêté` 
    };
  }

  return { allowed: true };
}

/**
 * Met à jour la dernière exécution d'un agent
 */
export async function updateAgentLastRun(
  userId: number,
  agentType: AgentType
): Promise<void> {
  const state = await getAgentState(userId, agentType);
  
  if (state) {
    await db
      .update(agentStates)
      .set({
        lastRunAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(agentStates.id, state.id));
  }
}
