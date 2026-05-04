import { chromium, Browser, Page } from 'playwright';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Follow un utilisateur avec Playwright
 */
export async function followUserWithPlaywright(
  agentUsername: string,
  agentPassword: string,
  targetUsername: string
): Promise<{ success: boolean; error?: string }> {
  let browser: Browser | null = null;
  
  try {
    console.log(`🚀 Following @${targetUsername} with ${agentUsername}...`);
    
    // Lancer le navigateur avec options stealth
    browser = await chromium.launch({
      headless: false, // Mode visible pour éviter détection
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      locale: 'en-US',
    });

    const page = await context.newPage();
    
    // Masquer les traces de Playwright
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    // Aller sur Instagram
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    // Accepter les cookies
    try {
      const cookieButton = page.locator('button:has-text("Allow all cookies"), button:has-text("Tout autoriser"), button:has-text("Allow essential and optional cookies")');
      if (await cookieButton.isVisible({ timeout: 5000 })) {
        await cookieButton.click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      // Pas de bouton cookies
    }

    // Attendre le formulaire de login avec timeout plus long
    await page.waitForSelector('input[name="username"]', { timeout: 30000 });

    // Remplir le formulaire
    const usernameInput = page.locator('input[name="username"], input[aria-label*="username"]').first();
    await usernameInput.fill(agentUsername);
    await page.waitForTimeout(500);

    const passwordInput = page.locator('input[name="password"], input[aria-label*="Password"]').first();
    await passwordInput.fill(agentPassword);
    await page.waitForTimeout(500);

    // Cliquer sur le bouton de connexion
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();
    await page.waitForTimeout(5000);

    // Gérer les popups post-login
    try {
      const notNowButton = page.locator('button:has-text("Not now"), button:has-text("Pas maintenant")').first();
      if (await notNowButton.isVisible({ timeout: 3000 })) {
        await notNowButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      // Pas de popup
    }

    // Aller sur le profil de l'utilisateur cible
    await page.goto(`https://www.instagram.com/${targetUsername}/`);
    await page.waitForTimeout(3000);

    // Vérifier si le compte existe
    const pageText = await page.textContent('body');
    if (pageText?.includes("Sorry, this page isn't available") || 
        pageText?.includes("Désolé, cette page n'est pas disponible")) {
      throw new Error('User not found');
    }

    // Chercher le bouton Follow
    const followButton = page.locator('button:has-text("Follow"), button:has-text("Suivre")').first();
    
    if (await followButton.isVisible({ timeout: 5000 })) {
      await followButton.click();
      await page.waitForTimeout(2000);
      console.log(`✅ ${agentUsername} followed @${targetUsername}`);
      
      await browser.close();
      return { success: true };
    } else {
      // Vérifier si déjà suivi
      const followingButton = page.locator('button:has-text("Following"), button:has-text("Abonné")').first();
      if (await followingButton.isVisible({ timeout: 2000 })) {
        console.log(`ℹ️ ${agentUsername} already follows @${targetUsername}`);
        await browser.close();
        return { success: true };
      }
      
      throw new Error('Follow button not found');
    }
  } catch (error: any) {
    console.error(`❌ Error following with ${agentUsername}:`, error.message);
    if (browser) await browser.close();
    return { success: false, error: error.message };
  }
}

/**
 * Fait suivre un nouveau client par les agents A et B avec Playwright
 */
export async function followNewClientPlaywright(userId: number): Promise<{
  agentA: { success: boolean; error?: string };
  agentB: { success: boolean; error?: string };
}> {
  // Récupérer l'utilisateur
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user || !user.username) {
    throw new Error('Utilisateur non trouvé');
  }

  const targetUsername = user.username;

  console.log(`🎯 Triggering follow for @${targetUsername}...`);

  // Agent A - Unfollow Detector
  const agentAResult = await followUserWithPlaywright(
    process.env.AGENT_A_INSTAGRAM_USER!,
    process.env.AGENT_A_INSTAGRAM_PASS!,
    targetUsername
  );

  // Agent B - Account Verification
  const agentBResult = await followUserWithPlaywright(
    process.env.AGENT_B_INSTAGRAM_USER!,
    process.env.AGENT_B_INSTAGRAM_PASS!,
    targetUsername
  );

  return {
    agentA: agentAResult,
    agentB: agentBResult,
  };
}
