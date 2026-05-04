import { chromium, Browser, Page } from 'playwright';
import { processReceivedCode } from './verification-codes';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Waler Bot - Version ultra simple
 * Reste sur inbox, scanne le HTML toutes les 10s
 */
export class WalerBotSimple {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private processedCodes = new Set<string>();

  async start() {
    try {
      console.log('🚀 Starting Waler bot (simple version)...');

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

      // Aller sur inbox UNE SEULE FOIS
      await this.page.goto('https://www.instagram.com/direct/inbox/');
      await this.page.waitForTimeout(5000);

      console.log('✅ Waler bot started');
      console.log('⚠️ IMPORTANT: Close the "Turn on notifications" popup manually if it appears!');

      // Scanner toutes les 10 secondes SANS changer de page
      this.checkInterval = setInterval(() => {
        this.scanForCodes().catch(err => {
          console.error('❌ Error:', err.message);
        });
      }, 10000);

      // Premier scan immédiat
      await this.scanForCodes();

    } catch (error: any) {
      console.error('❌ Failed to start:', error.message);
      await this.stop();
      throw error;
    }
  }

  /**
   * Scanne le HTML de la page actuelle pour trouver les codes VERIFY
   */
  private async scanForCodes() {
    if (!this.page) return;

    try {
      console.log('🔍 Scanning for VERIFY codes...');
      
      const pageContent = await this.page.content();
      const verifyMatches = pageContent.match(/VERIFY-[A-Z0-9]{6}/gi);
      
      if (verifyMatches && verifyMatches.length > 0) {
        console.log(`✅ Found ${verifyMatches.length} VERIFY code(s)`);
        
        const uniqueCodes = Array.from(new Set(verifyMatches.map(c => c.toUpperCase())));
        
        for (const codeToSend of uniqueCodes) {
          if (!this.processedCodes.has(codeToSend)) {
            this.processedCodes.add(codeToSend);
            console.log(`📨 Processing ${codeToSend}`);

            // Vérifier dans Supabase
            const result = await processReceivedCode(codeToSend);

            if (result.success && result.code6Digit) {
              console.log(`✅ Code validated! Sending ${result.code6Digit}`);
              await this.sendCode(result.code6Digit);
            } else {
              console.log(`❌ Invalid code: ${codeToSend}`);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error scanning:', error.message);
    }
  }

  /**
   * Envoie le code à 6 chiffres
   */
  private async sendCode(code6Digit: string) {
    if (!this.page) return;

    try {
      // Cliquer sur le premier thread
      const firstThread = this.page.locator('a[href*="/direct/t/"]').first();
      await firstThread.click();
      await this.page.waitForTimeout(3000);

      // Envoyer le message
      const message = `✅ Your Waler verification code is:\n\n🔢 ${code6Digit}\n\nEnter this code on the website to continue.\n\n⏰ This code expires in 15 minutes.`;
      
      const textbox = this.page.locator('div[contenteditable="true"][role="textbox"]').first();
      await textbox.click();
      await this.page.waitForTimeout(500);
      await textbox.fill(message);
      await this.page.waitForTimeout(500);
      await textbox.press('Enter');
      await this.page.waitForTimeout(2000);

      console.log(`✅ Sent code ${code6Digit}`);

      // Retourner à l'inbox
      await this.page.goto('https://www.instagram.com/direct/inbox/');
      await this.page.waitForTimeout(2000);
    } catch (error: any) {
      console.error('Error sending code:', error.message);
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
let walerBotInstance: WalerBotSimple | null = null;

export async function startWalerBotSimple() {
  if (walerBotInstance) {
    throw new Error('Waler bot is already running');
  }
  walerBotInstance = new WalerBotSimple();
  await walerBotInstance.start();
  return { message: 'Waler bot started successfully' };
}

export async function stopWalerBotSimple() {
  if (!walerBotInstance) {
    throw new Error('Waler bot is not running');
  }
  await walerBotInstance.stop();
  walerBotInstance = null;
  return { message: 'Waler bot stopped successfully' };
}
