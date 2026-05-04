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

/**
 * Lance l'agent Pro Circle pour un prospect/membre du cercle spécifique
 */
export async function triggerAgentForProspect(prospectId: number): Promise<boolean> {
  console.log(`🤖 Déclenchement de l'agent Pro Circle pour le prospect ${prospectId}`);

  try {
    const agentPath = path.join(process.cwd(), 'agent_pro_circle.py');
    
    // Lancer l'agent avec RUN_ON_START=true et PROSPECT_ID spécifique
    const agentProcess = spawn('python', [agentPath], {
      env: {
        ...process.env,
        RUN_ON_START: 'true',
        TARGET_PROSPECT_ID: prospectId.toString()
      },
      stdio: 'pipe'
    });

    // Utiliser l'ID du prospect comme clé pour permettre plusieurs instances
    const agentKey = `pro_circle_${prospectId}`;
    runningAgents.set(agentKey, agentProcess);

    // Logger la sortie
    agentProcess.stdout?.on('data', (data) => {
      console.log(`[Agent Pro Circle] ${data.toString().trim()}`);
    });

    agentProcess.stderr?.on('data', (data) => {
      console.error(`[Agent Pro Circle ERROR] ${data.toString().trim()}`);
    });

    agentProcess.on('close', (code) => {
      console.log(`✅ Agent Pro Circle terminé avec le code ${code}`);
      runningAgents.delete(agentKey);
    });

    agentProcess.on('error', (error) => {
      console.error(`❌ Erreur lors du lancement de l'agent Pro Circle:`, error);
      runningAgents.delete(agentKey);
    });

    // Timeout de sécurité : nettoyer après 5 minutes si l'agent ne se termine pas
    setTimeout(() => {
      if (runningAgents.has(agentKey)) {
        console.log('⚠️ Timeout agent Pro Circle - nettoyage forcé');
        agentProcess.kill();
        runningAgents.delete(agentKey);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return true;
  } catch (error) {
    console.error('❌ Erreur lors du déclenchement de l\'agent Pro Circle:', error);
    return false;
  }
}

/**
 * Force le nettoyage d'un agent bloqué
 */
export function forceCleanAgent(agentType: 'pro_clients' | 'pro_circle'): void {
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
export function isAgentRunning(agentType: 'pro_clients' | 'pro_circle'): boolean {
  return runningAgents.has(agentType);
}

/**
 * Arrête un agent en cours
 */
export function stopAgent(agentType: 'pro_clients' | 'pro_circle'): boolean {
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
    pro_clients: runningAgents.has('pro_clients'),
    pro_circle: runningAgents.has('pro_circle')
  };
}
