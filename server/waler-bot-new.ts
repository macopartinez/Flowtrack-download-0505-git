import { chromium, Browser, Page } from 'playwright';
import { processReceivedCode } from './verification-codes';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Bot Waler - Nouvelle version
 * S'active sur réception de message, vérifie inbox + requests, identifie messages non lus
 */
export class WalerBotNew {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private processedCodes = new Set<string>();

  async start() {
    try {
      console.log('🚀 Starting Waler bot...');

      this.browser = await chromium.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const context = await this.browser.newContext();

      // Charger les cookies
      const cookiesPath = path.join(process.cwd(), 'cookies-waler.json');
      if (fs.existsSync(cookiesPath)) {
        const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf-8'));
        await context.addCookies(cookies);
        console.log('✅ Cookies loaded');
      }

      this.page = await context.newPage();

      // Aller sur Instagram
      await this.page.goto('https://www.instagram.com/direct/inbox/');
      await this.page.waitForTimeout(3000);

      console.log('✅ Waler bot started - monitoring messages');

      // Vérifier toutes les 10 secondes
      this.checkInterval = setInterval(() => {
        this.checkForNewMessages().catch(err => {
          console.error('❌ Error:', err.message);
        });
      }, 10000);

      // Premier check immédiat
      await this.checkForNewMessages();

    } catch (error: any) {
      console.error('❌ Failed to start:', error.message);
      await this.stop();
      throw error;
    }
  }

  /**
   * Vérifie les nouveaux messages dans inbox ET requests
   */
  private async checkForNewMessages() {
    if (!this.page) return;

    try {
      // 1. Vérifier les message requests (inbox/requests)
      console.log('🔍 Checking message requests...');
      await this.page.goto('https://www.instagram.com/direct/requests/');
      await this.page.waitForTimeout(3000);
      
      // Gérer la popup "Turn on notifications" - cliquer sur "Not Now" pour la fermer
      const dismissButtons = [
        'button:has-text("Not Now")',
        'button:has-text("Not now")',
        'button:has-text("Pas maintenant")',
        'button:has-text("Later")',
        'div[role="button"]:has-text("Not Now")',
        'div[role="button"]:has-text("Not now")'
      ];
      
      for (const selector of dismissButtons) {
        try {
          const button = this.page.locator(selector).first();
          const isVisible = await button.isVisible({ timeout: 1000 });
          if (isVisible) {
            console.log('❌ Found notification popup, dismissing...');
            await button.click();
            await this.page.waitForTimeout(2000);
            console.log('✅ Popup dismissed');
            break;
          }
        } catch {
          continue;
        }
      }
      
      await this.processUnreadMessages();

      // 2. Vérifier l'inbox normal
      console.log('🔍 Checking inbox...');
      await this.page.goto('https://www.instagram.com/direct/inbox/');
      await this.page.waitForTimeout(2000);
      await this.processUnreadMessages();

    } catch (error: any) {
      console.error('Error checking messages:', error.message);
    }
  }

  /**
   * Traite les messages - scan du HTML pour trouver les codes VERIFY
   */
  private async processUnreadMessages() {
    if (!this.page) return;

    try {
      // Scanner le HTML de la page pour trouver les codes VERIFY
      const pageContent = await this.page.content();
      const verifyMatches = pageContent.match(/VERIFY-[A-Z0-9]{6}/gi);
      
      if (verifyMatches && verifyMatches.length > 0) {
        console.log(`� Found ${verifyMatches.length} VERIFY code(s) in page`);
        
        const uniqueCodes = Array.from(new Set(verifyMatches.map(c => c.toUpperCase())));
        
        for (const codeToSend of uniqueCodes) {
          if (!this.processedCodes.has(codeToSend)) {
            this.processedCodes.add(codeToSend);
            console.log(`📨 Processing ${codeToSend}`);

            // Vérifier dans Supabase
            const result = await processReceivedCode(codeToSend);

            if (result.success && result.code6Digit) {
              console.log(`✅ Code validated! Sending ${result.code6Digit}`);
              
              // Cliquer sur le premier thread (le plus récent)
              const firstThread = this.page.locator('a[href*="/direct/t/"]').first();
              const threadCount = await this.page.locator('a[href*="/direct/t/"]').count();
              
              if (threadCount > 0) {
                await firstThread.click();
                await this.page.waitForTimeout(3000);
                await this.sendResponse(result.code6Digit);
                
                // Retourner à l'inbox
                await this.page.goto('https://www.instagram.com/direct/inbox/');
                await this.page.waitForTimeout(2000);
              }
            } else {
              console.log(`❌ Invalid code: ${codeToSend}`);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error processing messages:', error.message);
    }
  }

  /**
   * Extrait le username depuis le header de la conversation
   */
  private async extractUsername(): Promise<string | null> {
    if (!this.page) return null;

    try {
      const usernameElement = await this.page.locator('header span[dir="auto"]').first().textContent();
      return usernameElement?.trim() || null;
    } catch {
      return null;
    }
  }

  /**
   * Envoie le code à 6 chiffres
   */
  private async sendResponse(code6Digit: string) {
    if (!this.page) return;

    try {
      const message = `✅ Your Waler verification code is:\n\n🔢 ${code6Digit}\n\nEnter this code on the website to continue.\n\n⏰ This code expires in 15 minutes.`;
      
      const textbox = this.page.locator('div[contenteditable="true"][role="textbox"]').first();
      await textbox.click();
      await this.page.waitForTimeout(500);
      await textbox.fill(message);
      await this.page.waitForTimeout(500);
      await textbox.press('Enter');
      await this.page.waitForTimeout(2000);

      console.log(`✅ Sent code ${code6Digit}`);
    } catch (error: any) {
      console.error('Error sending response:', error.message);
    }
  }

  async stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    if (this.browser) {
      await this.browser.close();
    }
    console.log('🛑 Waler bot stopped');
  }
}

// Instance globale
let walerBotInstance: WalerBotNew | null = null;

export async function startWalerBotNew() {
  if (walerBotInstance) {
    throw new Error('Waler bot is already running');
  }
  walerBotInstance = new WalerBotNew();
  await walerBotInstance.start();
  return { message: 'Waler bot started successfully' };
}

export async function stopWalerBotNew() {
  if (!walerBotInstance) {
    throw new Error('Waler bot is not running');
  }
  await walerBotInstance.stop();
  walerBotInstance = null;
  return { message: 'Waler bot stopped successfully' };
}
