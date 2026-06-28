/**
 * Système de déclenchement automatique des agents Pro
 * Lance l'agent approprié selon le type d'ajout (client ou prospect)
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';

// Stockage des processus en cours
const runningAgents: Map<string, ChildProcess> = new Map();

/**
 * Lance l'agent Pro Clients pour un client spécifique
 */
export async function triggerAgentForClient(clientId: number): Promise<boolean> {
  console.log(`🤖 Déclenchement de l'agent Pro Clients pour le client ${clientId}`);
  
  // Vérifier si un agent est déjà en cours
  if (runningAgents.has('pro_clients')) {
    console.log('⚠️ Agent Pro Clients déjà en cours, ajout à la file d\'attente');
    return false;
  }

  try {
    const agentPath = path.join(process.cwd(), 'agent_pro_clients.py');
    
    // Lancer l'agent avec RUN_ON_START=true et CLIENT_ID spécifique
    const agentProcess = spawn('python', [agentPath], {
      env: {
        ...process.env,
        RUN_ON_START: 'true',
        TARGET_CLIENT_ID: clientId.toString()
      },
      stdio: 'pipe'
    });

    runningAgents.set('pro_clients', agentProcess);

    // Logger la sortie
    agentProcess.stdout?.on('data', (data) => {
      console.log(`[Agent Pro Clients] ${data.toString().trim()}`);
    });

    agentProcess.stderr?.on('data', (data) => {
      console.error(`[Agent Pro Clients ERROR] ${data.toString().trim()}`);
    });

    agentProcess.on('close', (code) => {
      console.log(`✅ Agent Pro Clients terminé avec le code ${code}`);
      runningAgents.delete('pro_clients');
    });

    agentProcess.on('error', (error) => {
      console.error(`❌ Erreur lors du lancement de l'agent Pro Clients:`, error);
      runningAgents.delete('pro_clients');
    });

    return true;
  } catch (error) {
    console.error('❌ Erreur lors du déclenchement de l\'agent Pro Clients:', error);
    return false;
  }
}

// NB: L'analyse du cercle/prospects (anciennement agent_pro_circle.py) est
// désormais effectuée dans l'extension Chrome (pro-engagement-collector.ts).
// Le déclenchement Python pour les prospects a donc été retiré.

/**
 * Force le nettoyage d'un agent bloqué
 */
export function forceCleanAgent(agentType: 'pro_clients'): void {
  if (runningAgents.has(agentType)) {
    const process = runningAgents.get(agentType);
    process?.kill();
    runningAgents.delete(agentType);
    console.log(`🧹 Agent ${agentType} nettoyé manuellement`);
  }
}

/**
 * Vérifie si un agent est en cours d'exécution
 */
export function isAgentRunning(agentType: 'pro_clients'): boolean {
  return runningAgents.has(agentType);
}

/**
 * Arrête un agent en cours
 */
export function stopAgent(agentType: 'pro_clients'): boolean {
  const agent = runningAgents.get(agentType);
  if (agent) {
    agent.kill();
    runningAgents.delete(agentType);
    console.log(`🛑 Agent ${agentType} arrêté`);
    return true;
  }
  return false;
}

/**
 * Obtient le statut de tous les agents
 */
export function getAgentsStatus() {
  return {
    pro_clients: runningAgents.has('pro_clients')
  };
}
