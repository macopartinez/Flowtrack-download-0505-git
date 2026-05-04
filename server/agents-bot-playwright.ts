import { chromium, Browser, Page } from 'playwright';
import { db } from './db';
import { users, unfollowers, followers, blockers } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Bot pour les agents A, B, C avec Playwright
 * Détecte les unfollowers et nouveaux followers en temps réel
 */
export class AgentBot {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private agentName: string;
  private agentUsername: string;
  private agentPassword: string;
  private previousFollowersList: Set<string> = new Set();
  private pendingFollows: string[] = []; // Liste des users à follow

  constructor(agentName: 'A' | 'B' | 'C') {
    this.agentName = agentName;
    
    // Récupérer les credentials selon l'agent
    if (agentName === 'A') {
      this.agentUsername = process.env.AGENT_A_INSTAGRAM_USER!;
      this.agentPassword = process.env.AGENT_A_INSTAGRAM_PASS!;
    } else if (agentName === 'B') {
      this.agentUsername = process.env.AGENT_B_INSTAGRAM_USER!;
      this.agentPassword = process.env.AGENT_B_INSTAGRAM_PASS!;
    } else {
      this.agentUsername = process.env.AGENT_C_INSTAGRAM_USER!;
      this.agentPassword = process.env.AGENT_C_INSTAGRAM_PASS!;
    }
  }

  /**
   * Démarre le bot
   */
  async start() {
    if (this.isRunning) {
      console.log(`⚠️ Agent ${this.agentName} bot is already running`);
      return;
    }

    try {
      console.log(`🚀 Starting Agent ${this.agentName} bot with Playwright...`);

      // Lancer le navigateur
      this.browser = await chromium.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      this.page = await this.browser.newPage();

      // Ouvrir Instagram - L'utilisateur se connecte manuellement
      console.log(`🌐 Opening Instagram login page for Agent ${this.agentName}...`);
      console.log(`👉 Please login manually with ${this.agentUsername}`);
      await this.page.goto('https://www.instagram.com/accounts/login/');
      
      // Attendre que l'utilisateur se connecte
      console.log('⏳ Waiting for manual login...');
      await this.page.waitForURL('**/', { timeout: 300000 }); // 5 minutes max
      console.log('✅ Login successful!');

      this.isRunning = true;

      // Charger la liste initiale des followers
      await this.loadInitialFollowers();

      // Vérifier les changements toutes les 60 secondes
      this.checkInterval = setInterval(() => {
        this.checkForChanges().catch(err => {
          console.error(`❌ Error checking changes for Agent ${this.agentName}:`, err.message);
        });
      }, 60000);

      console.log(`✅ Agent ${this.agentName} bot started - checking every 60s`);
    } catch (error: any) {
      console.error(`❌ Failed to start Agent ${this.agentName} bot:`, error.message);
      await this.stop();
      throw error;
    }
  }

  /**
   * Charge la liste initiale des followers pour tous les clients
   */
  private async loadInitialFollowers() {
    if (!this.page) return;

    try {
      console.log(`📊 Loading initial followers list for Agent ${this.agentName}...`);

      // Aller sur la page "Following"
      await this.page.goto(`https://www.instagram.com/${this.agentUsername}/following/`);
      await this.page.waitForTimeout(3000);

      // Scroll pour charger tous les followers
      await this.scrollFollowingList();

      // Récupérer tous les usernames
      const usernames = await this.page.locator('a[href^="/"][role="link"]').allTextContents();
      
      // Filtrer et nettoyer
      usernames.forEach(username => {
        const cleaned = username.trim();
        if (cleaned && !cleaned.includes('•')) {
          this.previousFollowersList.add(cleaned);
        }
      });

      console.log(`✅ Loaded ${this.previousFollowersList.size} followers for Agent ${this.agentName}`);
    } catch (error: any) {
      console.error(`Error loading initial followers:`, error.message);
    }
  }

  /**
   * Scroll la liste des following pour tout charger
   */
  private async scrollFollowingList() {
    if (!this.page) return;

    const scrollContainer = await this.page.locator('div[role="dialog"]').first();
    
    for (let i = 0; i < 10; i++) { // Max 10 scrolls
      await scrollContainer.evaluate(el => {
        el.scrollTop = el.scrollHeight;
      });
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Vérifie les changements (unfollowers et nouveaux followers)
   */
  private async checkForChanges() {
    if (!this.page) return;

    try {
      console.log(`🔍 Checking for changes (Agent ${this.agentName})...`);

      // Aller sur la page "Following"
      await this.page.goto(`https://www.instagram.com/${this.agentUsername}/following/`);
      await this.page.waitForTimeout(3000);

      // Scroll pour charger tous
      await this.scrollFollowingList();

      // Récupérer la liste actuelle
      const usernames = await this.page.locator('a[href^="/"][role="link"]').allTextContents();
      const currentFollowers = new Set<string>();
      
      usernames.forEach(username => {
        const cleaned = username.trim();
        if (cleaned && !cleaned.includes('•')) {
          currentFollowers.add(cleaned);
        }
      });

      // Détecter les unfollowers (dans previous mais pas dans current)
      const unfollowersList: string[] = [];
      this.previousFollowersList.forEach(username => {
        if (!currentFollowers.has(username)) {
          unfollowersList.push(username);
        }
      });

      // Détecter les nouveaux followers (dans current mais pas dans previous)
      const newFollowersList: string[] = [];
      currentFollowers.forEach(username => {
        if (!this.previousFollowersList.has(username)) {
          newFollowersList.push(username);
        }
      });

      // Traiter les unfollowers
      if (unfollowersList.length > 0) {
        console.log(`📉 Found ${unfollowersList.length} unfollower(s):`, unfollowersList);
        await this.processUnfollowers(unfollowersList);
      }

      // Traiter les nouveaux followers
      if (newFollowersList.length > 0) {
        console.log(`📈 Found ${newFollowersList.length} new follower(s):`, newFollowersList);
        await this.processNewFollowers(newFollowersList);
      }

      if (unfollowersList.length === 0 && newFollowersList.length === 0) {
        console.log(`✅ No changes detected (Agent ${this.agentName})`);
      }

      // Mettre à jour la liste précédente
      this.previousFollowersList = currentFollowers;
    } catch (error: any) {
      console.error(`Error checking for changes:`, error.message);
    }
  }

  /**
   * Traite les unfollowers détectés
   */
  private async processUnfollowers(unfollowersList: string[]) {
    for (const username of unfollowersList) {
      try {
        // Trouver l'utilisateur dans la DB
        const [user] = await db.select().from(users).where(eq(users.username, username));

        if (user) {
          // Vérifier si le compte existe toujours (Agent B uniquement)
          let accountDeleted = false;
          if (this.agentName === 'B') {
            accountDeleted = await this.checkIfAccountDeleted(username);
          }

          if (accountDeleted) {
            // Ajouter aux blockers (Ghost)
            await db.insert(blockers).values({
              userId: user.id,
              username: user.username,
              avatarUrl: user.avatarUrl,
              blockType: 'deleted_account',
            });
            console.log(`👻 ${username} - Account deleted (Ghost)`);
          } else {
            // Ajouter aux unfollowers
            await db.insert(unfollowers).values({
              userId: user.id,
              username: user.username,
              avatarUrl: user.avatarUrl,
            });
            console.log(`📉 ${username} - Unfollowed`);
          }
        }
      } catch (error: any) {
        console.error(`Error processing unfollower ${username}:`, error.message);
      }
    }
  }

  /**
   * Traite les nouveaux followers
   */
  private async processNewFollowers(newFollowersList: string[]) {
    for (const username of newFollowersList) {
      try {
        // Trouver l'utilisateur dans la DB
        const [user] = await db.select().from(users).where(eq(users.username, username));

        if (user) {
          // Ajouter aux followers
          await db.insert(followers).values({
            userId: user.id,
            username: user.username,
            avatarUrl: user.avatarUrl,
          });
          console.log(`📈 ${username} - New follower`);
        }
      } catch (error: any) {
        console.error(`Error processing new follower ${username}:`, error.message);
      }
    }
  }

  /**
   * Vérifie si un compte Instagram a été supprimé (Agent B uniquement)
   */
  private async checkIfAccountDeleted(username: string): Promise<boolean> {
    if (!this.page) return false;

    try {
      await this.page.goto(`https://www.instagram.com/${username}/`);
      await this.page.waitForTimeout(2000);

      // Vérifier si la page affiche "Sorry, this page isn't available"
      const pageText = await this.page.textContent('body');
      return pageText?.includes("Sorry, this page isn't available") || 
             pageText?.includes("Désolé, cette page n'est pas disponible") || false;
    } catch {
      return false;
    }
  }

  /**
   * Ajoute un utilisateur à la file d'attente pour follow
   */
  async queueFollow(username: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isRunning || !this.page) {
      return { success: false, error: 'Bot not running' };
    }

    try {
      console.log(`📝 Agent ${this.agentName}: Queuing follow for @${username}`);
      
      // Aller sur le profil de l'utilisateur
      await this.page.goto(`https://www.instagram.com/${username}/`);
      await this.page.waitForTimeout(3000);

      // Vérifier si le compte existe
      const pageText = await this.page.textContent('body');
      if (pageText?.includes("Sorry, this page isn't available") || 
          pageText?.includes("Désolé, cette page n'est pas disponible")) {
        return { success: false, error: 'User not found' };
      }

      // Chercher le bouton Follow
      const followButton = this.page.locator('button:has-text("Follow"), button:has-text("Suivre")').first();
      
      if (await followButton.isVisible({ timeout: 5000 })) {
        await followButton.click();
        await this.page.waitForTimeout(2000);
        console.log(`✅ Agent ${this.agentName} followed @${username}`);
        return { success: true };
      } else {
        // Vérifier si déjà suivi
        const followingButton = this.page.locator('button:has-text("Following"), button:has-text("Abonné")').first();
        if (await followingButton.isVisible({ timeout: 2000 })) {
          console.log(`ℹ️ Agent ${this.agentName} already follows @${username}`);
          return { success: true };
        }
        
        return { success: false, error: 'Follow button not found' };
      }
    } catch (error: any) {
      console.error(`❌ Agent ${this.agentName} error following @${username}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Arrête le bot
   */
  async stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }

    this.isRunning = false;
    console.log(`🛑 Agent ${this.agentName} bot stopped`);
  }
}

// Instances singleton pour chaque agent
let agentAInstance: AgentBot | null = null;
let agentBInstance: AgentBot | null = null;
let agentCInstance: AgentBot | null = null;

/**
 * Démarre l'agent A
 */
export async function startAgentA() {
  if (agentAInstance) {
    console.log('⚠️ Agent A already running');
    return;
  }

  agentAInstance = new AgentBot('A');
  await agentAInstance.start();
}

/**
 * Démarre l'agent B
 */
export async function startAgentB() {
  if (agentBInstance) {
    console.log('⚠️ Agent B already running');
    return;
  }

  agentBInstance = new AgentBot('B');
  await agentBInstance.start();
}

/**
 * Démarre l'agent C
 */
export async function startAgentC() {
  if (agentCInstance) {
    console.log('⚠️ Agent C already running');
    return;
  }

  agentCInstance = new AgentBot('C');
  await agentCInstance.start();
}

/**
 * Arrête l'agent A
 */
export async function stopAgentA() {
  if (agentAInstance) {
    await agentAInstance.stop();
    agentAInstance = null;
  }
}

/**
 * Arrête l'agent B
 */
export async function stopAgentB() {
  if (agentBInstance) {
    await agentBInstance.stop();
    agentBInstance = null;
  }
}

/**
 * Arrête l'agent C
 */
export async function stopAgentC() {
  if (agentCInstance) {
    await agentCInstance.stop();
    agentCInstance = null;
  }
}

/**
 * Fait suivre un utilisateur par les agents A et B (s'ils sont actifs)
 */
export async function followWithActiveBots(username: string): Promise<{
  agentA: { success: boolean; error?: string };
  agentB: { success: boolean; error?: string };
}> {
  const results: {
    agentA: { success: boolean; error?: string };
    agentB: { success: boolean; error?: string };
  } = {
    agentA: { success: false, error: 'Agent A not running' },
    agentB: { success: false, error: 'Agent B not running' },
  };

  // Follow avec Agent A si actif
  if (agentAInstance) {
    results.agentA = await agentAInstance.queueFollow(username);
  }

  // Follow avec Agent B si actif
  if (agentBInstance) {
    results.agentB = await agentBInstance.queueFollow(username);
  }

  return results;
}
