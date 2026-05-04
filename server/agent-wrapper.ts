import { canAgentRun, updateAgentLastRun, type AgentType } from "./agent-manager";

/**
 * Wrapper pour les agents qui vérifie automatiquement
 * si l'agent peut s'exécuter selon le plan de l'utilisateur
 */

export async function withAgentCheck<T>(
  userId: number,
  agentType: AgentType,
  agentFunction: () => Promise<T>
): Promise<T> {
  // Vérifier si l'agent peut s'exécuter
  const check = await canAgentRun(userId, agentType);
  
  if (!check.allowed) {
    console.log(`⏸️ Agent ${agentType} cannot run for user ${userId}: ${check.reason}`);
    throw new Error(`Agent ${agentType} is not available: ${check.reason}`);
  }

  // Exécuter l'agent
  console.log(`▶️ Running agent ${agentType} for user ${userId}`);
  const result = await agentFunction();

  // Mettre à jour la dernière exécution
  await updateAgentLastRun(userId, agentType);

  return result;
}

/**
 * Exemple d'utilisation dans un agent:
 * 
 * // Agent Prospects
 * export async function runProspectsAgent(userId: number) {
 *   return withAgentCheck(userId, 'prospects', async () => {
 *     // Logique de l'agent prospects
 *     const prospects = await analyzeNewFollowers(userId);
 *     return prospects;
 *   });
 * }
 * 
 * // Agent Connections
 * export async function runConnectionsAgent(userId: number) {
 *   return withAgentCheck(userId, 'connections', async () => {
 *     // Logique de l'agent connections
 *     const connections = await analyzeRelationships(userId);
 *     return connections;
 *   });
 * }
 * 
 * // Agent Clients (Pro only)
 * export async function runClientsAgent(userId: number) {
 *   return withAgentCheck(userId, 'clients', async () => {
 *     // Logique de l'agent clients
 *     const clients = await manageClients(userId);
 *     return clients;
 *   });
 * }
 */
