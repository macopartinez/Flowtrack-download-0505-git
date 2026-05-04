import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';
import { startUserAnalysis } from '../server/agents-analysis.js';

async function fixUserPlan() {
  try {
    const username = 'pako_mrtz';
    
    // Mettre à jour le plan vers Pro
    await db.execute(sql`
      UPDATE app_users
      SET subscription_tier = 'pro',
          subscription_status = 'active',
          trial_ends_at = NOW() + INTERVAL '7 days'
      WHERE username = ${username}
    `);
    
    console.log(`✅ Updated @${username} to Pro plan with 7-day trial`);
    
    // Relancer l'analyse
    console.log(`🚀 Starting analysis for @${username}...`);
    await startUserAnalysis(username);
    
    console.log('✅ Done!');
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixUserPlan();
