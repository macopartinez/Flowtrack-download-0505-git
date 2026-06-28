import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function verifyUser() {
  try {
    // Change this to your username
    const username = process.argv[2] || 'pako_mrtz';
    
    // Marquer l'utilisateur comme vérifié
    await db.execute(sql`
      UPDATE app_users
      SET is_verified = true
      WHERE username = ${username}
    `);
    
    console.log(`✅ User @${username} is now verified`);
    
    // Vérifier le statut
    const result = await db.execute(sql`
      SELECT username, email, is_verified, subscription_tier, subscription_status
      FROM app_users
      WHERE username = ${username}
    `);
    
    if (result.length > 0) {
      const user = result[0] as any;
      console.log('\n📊 User status:');
      console.log(`  Username: @${user.username}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Verified: ${user.is_verified ? '✅ Yes' : '❌ No'}`);
      console.log(`  Plan: ${user.subscription_tier || 'none'} (${user.subscription_status || 'none'})`);
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verifyUser();
