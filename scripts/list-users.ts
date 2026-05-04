import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function listUsers() {
  try {
    const result = await db.execute(sql`
      SELECT id, email, username, subscription_tier, subscription_status, created_at
      FROM app_users
      ORDER BY created_at DESC
    `);
    
    console.log(`\n📋 Found ${result.length} user(s) in database:\n`);
    for (const user of result as any[]) {
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Tier: ${user.subscription_tier || 'none'}`);
      console.log(`   Status: ${user.subscription_status || 'none'}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('   ---');
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

listUsers();
