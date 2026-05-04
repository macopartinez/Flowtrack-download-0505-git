import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Fait suivre un utilisateur par un agent Instagram
 */
export async function followUserWithAgent(
  agentUsername: string,
  cookiesFile: string,
  targetUsername: string
): Promise<boolean> {
  let browser: Browser | null = null;

  try {
    console.log(`🤖 Agent @${agentUsername} will follow @${targetUsername}`);

    // Lancer le navigateur
    browser = await chromium.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext();
    
    // Charger les cookies
    const cookiesPath = path.join(process.cwd(), cookiesFile);
    if (fs.existsSync(cookiesPath)) {
      const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf-8'));
      await context.addCookies(cookies);
      console.log(`🍪 Cookies loaded for @${agentUsername}`);
    } else {
      console.error(`❌ Cookies file not found: ${cookiesPath}`);
      return false;
    }

    const page = await context.newPage();

    // Aller directement sur Instagram (déjà connecté avec les cookies)
    await page.goto('https://www.instagram.com/');
    await page.waitForTimeout(3000);

    // Aller sur le profil de l'utilisateur
    await page.goto(`https://www.instagram.com/${targetUsername}/`);
    await page.waitForTimeout(3000);

    // Chercher le bouton "Follow"
    const followButton = page.locator('button:has-text("Follow")').first();
    
    if (await followButton.count() > 0) {
      await followButton.click();
      await page.waitForTimeout(2000);
      console.log(`✅ Agent @${agentUsername} followed @${targetUsername}`);
      return true;
    } else {
      console.log(`⚠️ Already following or button not found for @${targetUsername}`);
      return false;
    }
  } catch (error: any) {
    console.error(`❌ Error following @${targetUsername} with @${agentUsername}:`, error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Fait suivre un utilisateur par les agents A et B
 */
export async function followUserWithAgents(targetUsername: string): Promise<void> {
  const agentA = process.env.AGENT_A_INSTAGRAM_USER;
  const agentB = process.env.AGENT_B_INSTAGRAM_USER;

  if (!agentA || !agentB) {
    console.error('❌ Agent usernames not found in environment variables');
    return;
  }

  // Lancer les follows en parallèle
  await Promise.all([
    followUserWithAgent(agentA, 'cookies-clara.json', targetUsername),
    followUserWithAgent(agentB, 'cookies-nathan.json', targetUsername)
  ]);

  console.log(`✅ Agents finished following @${targetUsername}`);
}
