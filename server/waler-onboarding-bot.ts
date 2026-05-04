import { IgApiClient } from 'instagram-private-api';

/**
 * Bot Waler pour l'onboarding
 * Génère et envoie des codes de vérification à 6 chiffres
 */
export class WalerOnboardingBot {
  private ig: IgApiClient;
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private processedMessages = new Set<string>(); // Pour éviter de traiter 2 fois le même message
  private verificationCodes = new Map<string, { code: string; expiry: Date }>(); // username -> code

  constructor() {
    this.ig = new IgApiClient();
    this.ig.state.generateDevice(process.env.AGENT_WALER_INSTAGRAM_USER!);
  }

  /**
   * Démarre le bot
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️ Waler onboarding bot is already running');
      return;
    }

    try {
      // Login
      await this.ig.account.login(
        process.env.AGENT_WALER_INSTAGRAM_USER!,
        process.env.AGENT_WALER_INSTAGRAM_PASS!
      );
      console.log('✅ Waler onboarding bot logged in');

      this.isRunning = true;

      // Vérifier les messages toutes les 5 secondes
      this.checkInterval = setInterval(() => {
        this.checkMessages().catch(err => {
          console.error('❌ Error checking messages:', err.message);
        });
      }, 5000);

      console.log('🤖 Waler onboarding bot started - checking messages every 5s');
    } catch (error: any) {
      console.error('❌ Failed to start Waler onboarding bot:', error.message);
      throw error;
    }
  }

  /**
   * Arrête le bot
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Waler onboarding bot stopped');
  }

  /**
   * Génère un code à 6 chiffres
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Vérifie les nouveaux messages
   */
  private async checkMessages() {
    try {
      const inbox = await this.ig.feed.directInbox().items();

      for (const thread of inbox) {
        const lastMessage = thread.items[0];
        const myUserId = await this.ig.account.currentUser().then(u => u.pk);
        
        // Vérifier si c'est un message texte non lu envoyé par quelqu'un d'autre
        if (lastMessage && 
            lastMessage.item_type === 'text' && 
            lastMessage.user_id !== myUserId &&
            !this.processedMessages.has(lastMessage.item_id)) {
          
          const messageText = (lastMessage.text || '').toLowerCase().trim();
          const senderUsername = thread.users[0]?.username;

          // Marquer comme traité
          this.processedMessages.add(lastMessage.item_id);

          // Si le message contient "code" ou "verify" ou c'est juste "hi"/"hello"
          if (messageText.includes('code') || 
              messageText.includes('verify') || 
              messageText.includes('verification') ||
              messageText === 'hi' ||
              messageText === 'hello' ||
              messageText === 'hey' ||
              messageText.length < 20) { // Message court = probablement une demande
            
            await this.sendVerificationCode(thread.thread_id, senderUsername);
          }
        }
      }

      // Nettoyer les anciens messages traités (garder seulement les 100 derniers)
      if (this.processedMessages.size > 100) {
        const array = Array.from(this.processedMessages);
        this.processedMessages = new Set(array.slice(-100));
      }
    } catch (error: any) {
      console.error('Error checking messages:', error.message);
    }
  }

  /**
   * Envoie un code de vérification
   */
  private async sendVerificationCode(threadId: string, username: string) {
    try {
      // Générer un nouveau code
      const code = this.generateCode();
      const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Stocker le code
      this.verificationCodes.set(username, { code, expiry });

      // Envoyer le message
      const message = `✅ Your Waler verification code is:\n\n🔢 ${code}\n\nEnter this code on the website to continue.\n\n⏰ This code expires in 15 minutes.`;
      
      await this.ig.entity.directThread(threadId).broadcastText(message);

      console.log(`✅ Sent verification code to @${username}: ${code}`);

      // Nettoyer les codes expirés
      this.cleanExpiredCodes();
    } catch (error: any) {
      console.error('Error sending verification code:', error.message);
    }
  }

  /**
   * Vérifie un code
   */
  verifyCode(username: string, code: string): boolean {
    const stored = this.verificationCodes.get(username);
    
    if (!stored) {
      return false;
    }

    // Vérifier l'expiration
    if (stored.expiry < new Date()) {
      this.verificationCodes.delete(username);
      return false;
    }

    // Vérifier le code
    if (stored.code === code) {
      this.verificationCodes.delete(username); // Code utilisé
      return true;
    }

    return false;
  }

  /**
   * Nettoie les codes expirés
   */
  private cleanExpiredCodes() {
    const now = new Date();
    const entries = Array.from(this.verificationCodes.entries());
    for (const [username, data] of entries) {
      if (data.expiry < now) {
        this.verificationCodes.delete(username);
      }
    }
  }

  /**
   * Récupère le statut du bot
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeCodes: this.verificationCodes.size,
      processedMessages: this.processedMessages.size
    };
  }
}

// Instance singleton
let botInstance: WalerOnboardingBot | null = null;

/**
 * Démarre le bot d'onboarding Waler
 */
export async function startWalerOnboardingBot() {
  if (!process.env.AGENT_WALER_INSTAGRAM_USER || !process.env.AGENT_WALER_INSTAGRAM_PASS) {
    console.log('⚠️ Waler bot credentials not configured');
    return;
  }

  if (botInstance) {
    console.log('⚠️ Waler onboarding bot already running');
    return botInstance;
  }

  botInstance = new WalerOnboardingBot();
  await botInstance.start();
  return botInstance;
}

/**
 * Arrête le bot d'onboarding Waler
 */
export function stopWalerOnboardingBot() {
  if (botInstance) {
    botInstance.stop();
    botInstance = null;
  }
}

/**
 * Récupère l'instance du bot
 */
export function getWalerOnboardingBot(): WalerOnboardingBot | null {
  return botInstance;
}

/**
 * Vérifie un code de vérification
 */
export function verifyOnboardingCode(username: string, code: string): boolean {
  if (!botInstance) {
    return false;
  }
  return botInstance.verifyCode(username, code);
}
