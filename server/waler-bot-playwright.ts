import { chromium, Browser, Page } from 'playwright';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { processReceivedCode, verifyCode as verifyCodeFromDB } from './verification-codes';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Bot de vérification Waler avec Playwright
 * Écoute les DMs Instagram et répond avec le token de vérification
 */
export class WalerBotPlaywright {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private processedMessages = new Set<string>();

  /**
   * Démarre le bot Waler avec Playwright
   */
  async start() {
    try {
      console.log('🚀 Starting Waler verification bot with Playwright...');

      // Lancer le navigateur
      this.browser = await chromium.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const context = await this.browser.newContext();

      // Charger les cookies sauvegardés
      console.log('🍪 Loading saved cookies...');
      const cookiesPath = path.join(process.cwd(), 'cookies-waler.json');
      
      if (fs.existsSync(cookiesPath)) {
        const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf-8'));
        await context.addCookies(cookies);
        console.log('✅ Cookies loaded successfully');
        await this.page.waitForTimeout(3000);
        
        // Vérifier si on est connecté
        const isLoggedIn = await this.page.locator('svg[aria-label="Home"]').count() > 0;
        if (isLoggedIn) {
          console.log('✅ Login successful with saved cookies!');
        } else {
          console.log('⚠️ Cookies expired, please login manually');
          await this.page.goto('https://www.instagram.com/accounts/login/');
          console.log('⏳ Waiting for manual login...');
          await this.page.waitForURL('**/direct/**', { timeout: 300000 });
          console.log('✅ Login successful!');
        }
      } else {
        // Pas de cookies sauvegardés - login manuel
        console.log('🌐 Opening Instagram login page...');
        console.log('👉 Please login manually with waler.web credentials');
        await this.page.goto('https://www.instagram.com/accounts/login/');
        
        console.log('⏳ Waiting for manual login...');
        await this.page.waitForURL('**/direct/**', { timeout: 300000 });
        console.log('✅ Login successful!');
      }

      this.isRunning = true;

      // Aller sur la page des messages et attendre les notifications
      await this.page.goto('https://www.instagram.com/direct/inbox/');
      await this.page.waitForTimeout(2000);

      // Écouter les changements dans le DOM (nouvelles notifications)
      await this.page.evaluate(() => {
        // Observer les changements dans la liste des messages
        const observer = new MutationObserver(() => {
          // Déclencher un événement personnalisé quand un nouveau message arrive
          window.dispatchEvent(new CustomEvent('newMessage'));
        });

        const inbox = document.querySelector('[role="list"]');
        if (inbox) {
          observer.observe(inbox, { childList: true, subtree: true });
        }
      });

      // Écouter l'événement personnalisé
      this.page.on('console', async (msg) => {
        if (msg.text().includes('NEW_MESSAGE_RECEIVED')) {
          console.log('📨 New message detected!');
          await this.checkMessages();
        }
      });

      // Vérifier aussi toutes les 30 secondes au cas où
      this.checkInterval = setInterval(() => {
        this.checkMessages().catch(err => {
          console.error('❌ Error checking messages:', err.message);
        });
      }, 30000);

      console.log('✅ Waler bot started - listening for real-time notifications');
    } catch (error: any) {
      console.error('❌ Failed to start Waler bot:', error.message);
      await this.stop();
      throw error;
    }
  }

  /**
   * Vérifie les nouveaux messages en interceptant les requêtes réseau
   */
  private async checkMessages() {
    if (!this.page) return;

    try {
      // Rester sur la page inbox et écouter les messages
      const currentUrl = this.page.url();
      if (!currentUrl.includes('/direct/')) {
        await this.page.goto('https://www.instagram.com/direct/inbox/');
        await this.page.waitForTimeout(2000);
      }

      // Récupérer le contenu HTML et chercher les messages non lus
      const pageContent = await this.page.content();
      
      // Chercher les codes VERIFY-XXX dans le contenu de la page
      const verifyCodeMatches = pageContent.match(/VERIFY-[A-Z0-9]{6}/gi);
      
      if (verifyCodeMatches && verifyCodeMatches.length > 0) {
        console.log(`🔍 Found ${verifyCodeMatches.length} VERIFY code(s) in page`);
        
        // Traiter uniquement les codes uniques
        const uniqueCodes = Array.from(new Set(verifyCodeMatches.map(c => c.toUpperCase())));
        
        for (const code of uniqueCodes) {
          if (!this.processedMessages.has(code)) {
            this.processedMessages.add(code);
            console.log(`📨 Processing code: ${code}`);
            await this.handleVerifyCode(code);
          }
        }
      }
    } catch (error: any) {
      console.error('Error checking messages:', error.message);
    }
  }

  /**
   * Traite un code VERIFY reçu
   */
  private async handleVerifyCode(codeToSend: string) {
    try {
      // Traiter le code et générer le code à 6 chiffres
      const result = await processReceivedCode(codeToSend);
      
      if (!result.success || !result.code6Digit) {
        console.log(`❌ Invalid or expired code: ${codeToSend}`);
        return;
      }
      
      console.log(`✅ Generated 6-digit code: ${result.code6Digit} for ${codeToSend}`);
      
      // Envoyer le code via DM
      await this.sendCodeResponse(codeToSend, result.code6Digit);
    } catch (error: any) {
      console.error(`Error handling code ${codeToSend}:`, error.message);
    }
  }

  /**
   * Envoie le code à 6 chiffres en réponse
   * Approche simple : clique sur le premier thread visible (le plus récent)
   */
  private async sendCodeResponse(codeToSend: string, code6Digit: string) {
    if (!this.page) return;

    try {
      console.log(`📤 Sending code ${code6Digit} for ${codeToSend}`);
      
      // Attendre un peu pour que le message apparaisse dans l'inbox
      await this.page.waitForTimeout(2000);
      
      // Cliquer sur le premier thread (le plus récent, qui contient le code)
      const firstThread = this.page.locator('a[role="link"][href*="/direct/t/"]').first();
      
      const threadCount = await this.page.locator('a[role="link"][href*="/direct/t/"]').count();
      console.log(`📋 Found ${threadCount} threads, clicking on first one`);
      
      if (threadCount > 0) {
        await firstThread.click();
        await this.page.waitForTimeout(3000);

        // Envoyer le message
        const message = `✅ Your Waler verification code is:\n\n🔢 ${code6Digit}\n\nEnter this code on the website to continue.\n\n⏰ This code expires in 15 minutes.`;
        
        const textbox = this.page.locator('div[contenteditable="true"][role="textbox"]').first();
        await textbox.click();
        await this.page.waitForTimeout(500);
        await textbox.fill(message);
        await this.page.waitForTimeout(500);
        
        // Appuyer sur Enter pour envoyer
        await textbox.press('Enter');
        await this.page.waitForTimeout(2000);

        console.log(`✅ Sent 6-digit code ${code6Digit} in response to ${codeToSend}`);

        // Retourner à la liste des messages
        await this.page.goto('https://www.instagram.com/direct/inbox/');
        await this.page.waitForTimeout(2000);
      } else {
        console.log(`⚠️ No threads found in inbox`);
      }
    } catch (error: any) {
      console.error(`❌ Error sending code response:`, error.message);
    }
  }

  /**
   * Extrait le username Instagram depuis le header de la conversation
   */
  private async extractInstagramUsername(): Promise<string | null> {
    if (!this.page) return null;

    try {
      // Essayer plusieurs sélecteurs
      const selectors = [
        'header span[dir="auto"]',
        'header a[role="link"] span',
        'header h1',
        '[role="dialog"] header span',
      ];

      for (const selector of selectors) {
        try {
          const element = await this.page.locator(selector).first().textContent({ timeout: 2000 });
          if (element && element.trim() && !element.includes('Message') && !element.includes('Direct')) {
            const username = element.trim().replace('@', '');
            console.log(`📍 Found username via selector "${selector}": ${username}`);
            return username;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Fallback: extraire depuis l'URL de la page
      const url = this.page.url();
      console.log(`📍 Trying to extract from URL: ${url}`);
      
      // Format: /direct/t/THREAD_ID/ - on ne peut pas extraire le username
      // Donc on va chercher dans le contenu de la page
      const pageContent = await this.page.content();
      const usernameMatch = pageContent.match(/"username":"([^"]+)"/);
      if (usernameMatch && usernameMatch[1]) {
        console.log(`📍 Found username in page content: ${usernameMatch[1]}`);
        return usernameMatch[1];
      }

      console.log('⚠️ Could not extract username from any source');
      return null;
    } catch (error: any) {
      console.error('Error extracting Instagram username:', error.message);
      return null;
    }
  }

  /**
   * Traite une liste de threads de messages
   */
  private async processThreads(threads: any[], isRequest: boolean = false) {
    console.log(`🔄 Processing ${threads.length} threads (isRequest: ${isRequest})`);
    
    for (let i = 0; i < threads.length; i++) {
      const thread = threads[i];
      try {
        console.log(`📝 Processing thread ${i + 1}/${threads.length}`);
        
        // Cliquer sur le thread
        await thread.click();
        await this.page!.waitForTimeout(3000);
        
        // Récupérer l'URL actuelle
        const url = this.page!.url();
        
        // Extraire le username depuis l'URL (format: /direct/t/THREAD_ID/)
        const username = url.split('/').pop() || 'unknown';
        console.log(`👤 Username/Thread: ${username}`);

        // Récupérer les messages - essayer plusieurs sélecteurs
        console.log(`📖 Looking for messages...`);
        let messages = await this.page!.locator('[data-testid="message-text"]').allTextContents();
        
        if (messages.length === 0) {
          // Essayer un autre sélecteur
          messages = await this.page!.locator('div[dir="auto"]').allTextContents();
        }
        
        if (messages.length === 0) {
          // Essayer encore un autre sélecteur
          messages = await this.page!.locator('.x1lliihq').allTextContents();
        }
        
        console.log(`📨 Found ${messages.length} message(s)`);
        
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          console.log(`💬 Last message: "${lastMessage.substring(0, 50)}..."`);

          // Vérifier si c'est un nouveau message (pas déjà traité)
          const messageKey = `${username}-${lastMessage}`;
          if (!this.processedMessages.has(messageKey) && lastMessage && lastMessage.length < 200) {
            this.processedMessages.add(messageKey);
            
            // Chercher un code VERIFY-XXX dans le message
            const verifyCodeMatch = lastMessage.match(/VERIFY-[A-Z0-9]{6}/i);
            
            if (!verifyCodeMatch) {
              console.log(`⚠️ No VERIFY code found in message: "${lastMessage}"`);
              await this.sendMessage(
                `❌ Please send your verification code in the format: VERIFY-XXXXXX\n\nYou can find this code on the Waler registration page.`
              );
              return;
            }
            
            const codeToSend = verifyCodeMatch[0].toUpperCase();
            console.log(`🔍 Found verification code: ${codeToSend}`);
            
            // Traiter le code reçu et générer le code à 6 chiffres
            const result = await processReceivedCode(codeToSend);
            
            if (!result.success || !result.code6Digit) {
              console.log(`❌ Invalid or expired code: ${codeToSend}`);
              await this.sendMessage(
                `❌ Invalid or expired verification code.\n\nPlease make sure you're using the code from the Waler registration page and that it hasn't expired (15 minutes).`
              );
              return;
            }
            
            console.log(`✅ Generated 6-digit code: ${result.code6Digit} for ${codeToSend}`);
            
            await this.sendMessage(
              `✅ Your Waler verification code is:\n\n🔢 ${result.code6Digit}\n\nEnter this code on the website to continue.\n\n⏰ This code expires in 15 minutes.`
            );
            
            console.log(`✅ Sent 6-digit code ${result.code6Digit} in response to ${codeToSend}`);
            
            // Nettoyer le cache
            if (this.processedMessages.size > 100) {
              const arr = Array.from(this.processedMessages);
              this.processedMessages = new Set(arr.slice(-100));
            }
          }
        }

        // Retourner à la liste des messages
        await this.page!.goto('https://www.instagram.com/direct/inbox/');
        await this.page!.waitForTimeout(1000);
      } catch (err: any) {
        console.error('Error processing thread:', err.message);
      }
    }
  }

  /**
   * Traite une demande de vérification
   */
  private async handleVerificationRequest(verificationCode: string) {
    if (!this.page) return;

    try {
      console.log('📨 Processing verification request:', verificationCode);

      // Extraire le username du code (format: VERIFY-ABC123-@username)
      const match = verificationCode.match(/VERIFY-[^-]+-@(.+)/);
      if (!match) {
        console.log('⚠️ Invalid verification code format:', verificationCode);
        await this.sendMessage('❌ Invalid verification code format.');
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
        await this.sendMessage('❌ User not found. Please check your username.');
        return;
      }

      // Vérifier que le code correspond
      if (user.verificationCode !== verificationCode) {
        console.log('⚠️ Invalid verification code for user:', username);
        await this.sendMessage('❌ Invalid verification code.');
        return;
      }

      // Vérifier l'expiration
      if (user.verificationTokenExpiry) {
        const expiry = new Date(user.verificationTokenExpiry);
        if (expiry < new Date()) {
          console.log('⚠️ Verification code expired for user:', username);
          await this.sendMessage('❌ Your verification code has expired. Please request a new one.');
          return;
        }
      }

      // Envoyer le token de vérification
      const token = user.verificationToken;
      if (!token) {
        console.log('⚠️ No verification token for user:', username);
        await this.sendMessage('❌ No verification token found.');
        return;
      }

      await this.sendMessage(
        `✅ Your verification code is: ${token}\n\nEnter this code on Waler to complete your registration.\n\n⏰ This code expires in 15 minutes.`
      );

      console.log(`✅ Sent verification token to @${username}: ${token}`);
    } catch (error: any) {
      console.error('Error handling verification request:', error.message);
    }
  }

  /**
   * Envoie un message dans le thread actuel
   */
  private async sendMessage(text: string) {
    if (!this.page) return;

    try {
      console.log('📝 Trying to send message...');
      
      // Trouver la zone de texte - essayer plusieurs sélecteurs
      let messageBox = this.page.locator('div[contenteditable="true"][role="textbox"]').first();
      
      // Vérifier si l'élément existe
      const count = await messageBox.count();
      console.log(`🔍 Found ${count} textbox(es)`);
      
      if (count === 0) {
        // Essayer un autre sélecteur
        messageBox = this.page.locator('div[contenteditable="true"]').first();
        console.log(`🔍 Trying alternative selector...`);
      }
      
      // Cliquer sur la zone de texte pour la focus
      await messageBox.click();
      await this.page.waitForTimeout(500);
      
      // Taper le texte
      await messageBox.fill(text);
      await this.page.waitForTimeout(1000);

      console.log('✍️ Text entered, looking for send button...');

      // Envoyer le message - essayer plusieurs sélecteurs
      let sendButton = this.page.locator('button:has-text("Send")').first();
      let buttonCount = await sendButton.count();
      
      if (buttonCount === 0) {
        sendButton = this.page.locator('button:has-text("Envoyer")').first();
        buttonCount = await sendButton.count();
      }
      
      if (buttonCount === 0) {
        // Essayer avec le sélecteur SVG
        sendButton = this.page.locator('button svg[aria-label="Send"]').first();
        buttonCount = await sendButton.count();
      }
      
      console.log(`🔍 Found ${buttonCount} send button(s)`);
      
      if (buttonCount > 0) {
        await sendButton.click();
        await this.page.waitForTimeout(2000);
        console.log('📤 Message sent successfully!');
      } else {
        console.log('⚠️ Send button not found, trying Enter key...');
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(2000);
        console.log('📤 Message sent via Enter key!');
      }
    } catch (error: any) {
      console.error('❌ Error sending message:', error.message);
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
    console.log('🛑 Waler bot stopped');
  }
}

// Instance singleton
let botInstance: WalerBotPlaywright | null = null;

/**
 * Démarre le bot de vérification Waler
 */
export async function startWalerBotPlaywright() {
  if (!process.env.AGENT_WALER_INSTAGRAM_USER || !process.env.AGENT_WALER_INSTAGRAM_PASS) {
    console.log('⚠️ Waler bot credentials not configured');
    return;
  }

  if (botInstance) {
    console.log('⚠️ Waler bot already running');
    return;
  }

  botInstance = new WalerBotPlaywright();
  await botInstance.start();
}

/**
 * Arrête le bot de vérification Waler
 */
export async function stopWalerBotPlaywright() {
  if (botInstance) {
    await botInstance.stop();
    botInstance = null;
  }
}

/**
 * Vérifie un code de vérification depuis Supabase
 */
export async function verifyWalerCode(code: string): Promise<{ valid: boolean; instagramUsername?: string }> {
  return await verifyCodeFromDB(code);
}
