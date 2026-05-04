import { IgApiClient } from 'instagram-private-api';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface FollowResult {
  success: boolean;
  isPrivate: boolean;
  needsApproval: boolean;
  error?: string;
}

/**
 * Follow un utilisateur Instagram avec un agent
 */
async function followUserWithAgent(
  agentUsername: string,
  agentPassword: string,
  targetUsername: string
): Promise<FollowResult> {
  const ig = new IgApiClient();
  ig.state.generateDevice(agentUsername);

  try {
    // Login de l'agent
    await ig.account.login(agentUsername, agentPassword);
    console.log(`✅ Agent ${agentUsername} connecté`);

    // Rechercher l'utilisateur cible
    const userId = await ig.user.getIdByUsername(targetUsername);
    const userInfo = await ig.user.info(userId);

    // Vérifier si le compte est privé
    const isPrivate = userInfo.is_private;

    // Follow l'utilisateur
    await ig.friendship.create(userId);
    console.log(`✅ Agent ${agentUsername} a suivi @${targetUsername}`);

    return {
      success: true,
      isPrivate,
      needsApproval: isPrivate,
    };
  } catch (error: any) {
    console.error(`❌ Erreur follow avec ${agentUsername}:`, error.message);
    return {
      success: false,
      isPrivate: false,
      needsApproval: false,
      error: error.message,
    };
  }
}

/**
 * Fait suivre un nouveau client par tous les agents nécessaires
 */
export async function followNewClient(userId: number): Promise<{
  agentA: FollowResult;
  agentB: FollowResult;
  needsManualApproval: boolean;
}> {
  // Récupérer l'utilisateur
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user || !user.username) {
    throw new Error('Utilisateur non trouvé');
  }

  const targetUsername = user.username;

  // Agent A - Unfollow Detector
  const agentAResult = await followUserWithAgent(
    process.env.AGENT_A_INSTAGRAM_USER!,
    process.env.AGENT_A_INSTAGRAM_PASS!,
    targetUsername
  );

  // Agent B - Account Verification
  const agentBResult = await followUserWithAgent(
    process.env.AGENT_B_INSTAGRAM_USER!,
    process.env.AGENT_B_INSTAGRAM_PASS!,
    targetUsername
  );

  const needsManualApproval = agentAResult.isPrivate || agentBResult.isPrivate;

  // Mettre à jour le statut de l'utilisateur
  await db.update(users)
    .set({ 
      isConnected: !needsManualApproval,
      // Stocker si en attente d'approbation
    })
    .where(eq(users.id, userId));

  return {
    agentA: agentAResult,
    agentB: agentBResult,
    needsManualApproval,
  };
}

/**
 * Vérifie si les agents ont été acceptés (pour comptes privés)
 */
export async function checkAgentApproval(userId: number): Promise<{
  agentAApproved: boolean;
  agentBApproved: boolean;
  allApproved: boolean;
}> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user || !user.username) {
    throw new Error('Utilisateur non trouvé');
  }

  const ig = new IgApiClient();
  ig.state.generateDevice(process.env.AGENT_A_INSTAGRAM_USER!);

  try {
    // Login Agent A
    await ig.account.login(
      process.env.AGENT_A_INSTAGRAM_USER!,
      process.env.AGENT_A_INSTAGRAM_PASS!
    );

    const userId_ig = await ig.user.getIdByUsername(user.username);
    const friendshipA = await ig.friendship.show(userId_ig);

    const agentAApproved = friendshipA.following;

    // Vérifier Agent B
    const igB = new IgApiClient();
    igB.state.generateDevice(process.env.AGENT_B_INSTAGRAM_USER!);
    
    await igB.account.login(
      process.env.AGENT_B_INSTAGRAM_USER!,
      process.env.AGENT_B_INSTAGRAM_PASS!
    );

    const userId_igB = await igB.user.getIdByUsername(user.username);
    const friendshipB = await igB.friendship.show(userId_igB);

    const agentBApproved = friendshipB.following;

    const allApproved = agentAApproved && agentBApproved;

    // Si tous approuvés, mettre à jour isConnected
    if (allApproved) {
      await db.update(users)
        .set({ isConnected: true })
        .where(eq(users.id, userId));
    }

    return {
      agentAApproved,
      agentBApproved,
      allApproved,
    };
  } catch (error: any) {
    console.error('Erreur vérification approval:', error.message);
    return {
      agentAApproved: false,
      agentBApproved: false,
      allApproved: false,
    };
  }
}
