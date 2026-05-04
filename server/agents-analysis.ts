import { chromium, Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Analyse le profil Instagram d'un utilisateur avec un agent
 */
async function analyzeUserWithAgent(
  agentUsername: string,
  cookiesFile: string,
  targetUsername: string
): Promise<any> {
  let browser: Browser | null = null;

  try {
    console.log(`🔍 Agent @${agentUsername} analyzing @${targetUsername}`);

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
      return null;
    }

    const page = await context.newPage();

    // Aller sur le profil de l'utilisateur
    await page.goto(`https://www.instagram.com/${targetUsername}/`);
    await page.waitForTimeout(5000);

    // Extraire les données du profil
    const profileData: any = {
      username: targetUsername,
      analyzedAt: new Date(),
      followers: 0,
      following: 0,
      posts: 0,
      bio: '',
      isPrivate: false,
    };

    try {
      // Extraire le nombre de followers avec timeout
      try {
        const followersText = await page.locator('a[href*="/followers/"] span').first().textContent({ timeout: 10000 });
        if (followersText) {
          profileData.followers = parseInt(followersText.replace(/[^0-9]/g, '')) || 0;
        }
      } catch (e) {
        console.log('Could not extract followers count');
      }

      // Extraire le nombre de following avec timeout
      try {
        const followingText = await page.locator('a[href*="/following/"] span').first().textContent({ timeout: 10000 });
        if (followingText) {
          profileData.following = parseInt(followingText.replace(/[^0-9]/g, '')) || 0;
        }
      } catch (e) {
        console.log('Could not extract following count');
      }

      // Extraire le nombre de posts avec timeout
      try {
        const postsText = await page.locator('header section ul li span').first().textContent({ timeout: 10000 });
        if (postsText) {
          profileData.posts = parseInt(postsText.replace(/[^0-9]/g, '')) || 0;
        }
      } catch (e) {
        console.log('Could not extract posts count');
      }

      // Extraire la bio avec timeout
      try {
        const bioElement = await page.locator('header section div span').first().textContent({ timeout: 10000 });
        if (bioElement) {
          profileData.bio = bioElement.trim();
        }
      } catch (e) {
        console.log('Could not extract bio');
      }

      // Vérifier si le compte est privé
      const isPrivate = await page.locator('h2:has-text("This Account is Private")').count() > 0;
      profileData.isPrivate = isPrivate;

      console.log(`✅ Agent @${agentUsername} analyzed @${targetUsername}:`, profileData);
    } catch (error: any) {
      console.error(`Error extracting profile data:`, error.message);
    }

    return profileData;
  } catch (error: any) {
    console.error(`❌ Error analyzing @${targetUsername} with @${agentUsername}:`, error.message);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Lance l'analyse d'un utilisateur par les agents A et B
 */
export async function startUserAnalysis(targetUsername: string): Promise<void> {
  const agentA = process.env.AGENT_A_INSTAGRAM_USER;
  const agentB = process.env.AGENT_B_INSTAGRAM_USER;

  if (!agentA || !agentB) {
    console.error('❌ Agent usernames not found in environment variables');
    return;
  }

  console.log(`🚀 Starting analysis for @${targetUsername}`);

  // Lancer les analyses en parallèle
  const [dataA, dataB] = await Promise.all([
    analyzeUserWithAgent(agentA, 'cookies-clara.json', targetUsername),
    analyzeUserWithAgent(agentB, 'cookies-nathan.json', targetUsername)
  ]);

  // Marquer l'analyse comme "analyzing" au début
  try {
    await db
      .update(users)
      .set({
        analysisStatus: 'analyzing',
      })
      .where(eq(users.username, targetUsername));
  } catch (error: any) {
    console.error(`Error updating analysis status:`, error.message);
  }

  // Mettre à jour la base de données avec les résultats
  if (dataA || dataB) {
    const analysisData = dataA || dataB;
    
    try {
      // Mettre à jour l'utilisateur dans la DB
      await db
        .update(users)
        .set({
          followersCount: analysisData.followers,
          followingCount: analysisData.following,
          postsCount: analysisData.posts,
          bio: analysisData.bio,
          isPrivate: analysisData.isPrivate,
          analysisStatus: 'completed',
          lastAnalyzedAt: new Date(),
        })
        .where(eq(users.username, targetUsername));

      console.log(`✅ Analysis completed and saved for @${targetUsername}`);
    } catch (error: any) {
      console.error(`Error saving analysis data:`, error.message);
      
      // Marquer comme failed en cas d'erreur
      await db
        .update(users)
        .set({
          analysisStatus: 'failed',
        })
        .where(eq(users.username, targetUsername));
    }
  } else {
    // Aucune donnée récupérée - marquer comme failed
    try {
      await db
        .update(users)
        .set({
          analysisStatus: 'failed',
        })
        .where(eq(users.username, targetUsername));
    } catch (error: any) {
      console.error(`Error updating analysis status:`, error.message);
    }
  }

  console.log(`✅ Analysis finished for @${targetUsername}`);
}
