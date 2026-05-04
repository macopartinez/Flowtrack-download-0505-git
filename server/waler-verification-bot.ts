import { IgApiClient } from 'instagram-private-api';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Bot de vérification Waler
 * Écoute les DMs reçus et répond avec le token de vérification
 */
export class WalerVerificationBot {
  private ig: IgApiClient;
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.ig = new IgApiClient();
    this.ig.state.generateDevice(process.env.AGENT_WALER_INSTAGRAM_USER!);
  }

  /**
   * Démarre le bot
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️ Waler bot is already running');
      return;
    }

    try {
      // Login
      await this.ig.account.login(
        process.env.AGENT_WALER_INSTAGRAM_USER!,
        process.env.AGENT_WALER_INSTAGRAM_PASS!
      );
      console.log('✅ Waler verification bot logged in');

      this.isRunning = true;

      // Vérifier les messages toutes les 10 secondes
      this.checkInterval = setInterval(() => {
        this.checkMessages().catch(err => {
          console.error('❌ Error checking messages:', err.message);
        });
      }, 10000);

      console.log('🤖 Waler bot started - checking messages every 10s');
    } catch (error: any) {
      console.error('❌ Failed to start Waler bot:', error.message);
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
    console.log('🛑 Waler bot stopped');
  }

  /**
   * Vérifie les nouveaux messages
   */
  private async checkMessages() {
    try {
      const inbox = await this.ig.feed.directInbox().items();

      for (const thread of inbox) {
        const lastMessage = thread.items[0];
        
        // Vérifier si c'est un message texte non lu
        if (lastMessage && lastMessage.item_type === 'text' && !lastMessage.is_sent_by_viewer) {
          const messageText = lastMessage.text || '';
          
          // Vérifier si c'est un code de vérification (format: VERIFY-ABC123-@username)
          if (messageText.startsWith('VERIFY-')) {
            await this.handleVerificationRequest(thread.thread_id, messageText);
          }
        }
      }
    } catch (error: any) {
      console.error('Error checking messages:', error.message);
    }
  }

  /**
   * Traite une demande de vérification
   */
  private async handleVerificationRequest(threadId: string, verificationCode: string) {
    try {
      // Extraire le username du code (format: VERIFY-ABC123-@username)
      const match = verificationCode.match(/VERIFY-[^-]+-@(.+)/);
      if (!match) {
        console.log('⚠️ Invalid verification code format:', verificationCode);
        return;
      }

      const username = match[1].trim();

      // Chercher l'utilisateur dans la DB
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));

      if (!user) {
        console.log('⚠️ User not found:', username);
        await this.sendMessage(threadId, '❌ User not found. Please check your username.');
        return;
      }

      // Vérifier que le code correspond
      if (user.verificationCode !== verificationCode) {
        console.log('⚠️ Invalid verification code for user:', username);
        await this.sendMessage(threadId, '❌ Invalid verification code.');
        return;
      }

      // Vérifier l'expiration
      if (user.verificationTokenExpiry) {
        const expiry = new Date(user.verificationTokenExpiry);
        if (expiry < new Date()) {
          console.log('⚠️ Verification code expired for user:', username);
          await this.sendMessage(
            threadId,
            '❌ Your verification code has expired. Please request a new one.'
          );
          return;
        }
      }

      // Envoyer le token de vérification
      const token = user.verificationToken;
      if (!token) {
        console.log('⚠️ No verification token for user:', username);
        await this.sendMessage(threadId, '❌ No verification token found.');
        return;
      }

      await this.sendMessage(
        threadId,
        `✅ Your verification code is: ${token}\n\nEnter this code on Waler to complete your registration.\n\n⏰ This code expires in 15 minutes.`
      );

      console.log(`✅ Sent verification token to @${username}: ${token}`);
    } catch (error: any) {
      console.error('Error handling verification request:', error.message);
    }
  }

  /**
   * Envoie un message dans un thread
   */
  private async sendMessage(threadId: string, text: string) {
    try {
      await this.ig.entity.directThread(threadId).broadcastText(text);
    } catch (error: any) {
      console.error('Error sending message:', error.message);
    }
  }
}

// Instance singleton
let botInstance: WalerVerificationBot | null = null;

/**
 * Démarre le bot de vérification Waler
 */
export async function startWalerBot() {
  if (!process.env.AGENT_WALER_INSTAGRAM_USER || !process.env.AGENT_WALER_INSTAGRAM_PASS) {
    console.log('⚠️ Waler bot credentials not configured');
    return;
  }

  if (botInstance) {
    console.log('⚠️ Waler bot already running');
    return;
  }

  botInstance = new WalerVerificationBot();
  await botInstance.start();
}

/**
 * Arrête le bot de vérification Waler
 */
export function stopWalerBot() {
  if (botInstance) {
    botInstance.stop();
    botInstance = null;
  }
}
