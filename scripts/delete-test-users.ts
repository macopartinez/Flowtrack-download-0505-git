import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function deleteTestUsers() {
  try {
    // Supprimer tous les utilisateurs sauf les agents (Clara et Nathan)
    const agentEmails = [
      'clara@waler.com',
      'nathan@waler.com',
      'agent.clara@waler.com',
      'agent.nathan@waler.com'
    ];
    
    const result = await db.execute(sql`
      DELETE FROM users
      WHERE email NOT IN (${sql.join(agentEmails.map(e => sql`${e}`), sql`, `)})
      RETURNING id, email, username
    `);
    
    console.log(`✅ Deleted ${result.length} test user(s):`);
    for (const user of result as any[]) {
      console.log(`   - ${user.email} (@${user.username})`);
    }
    
    // Nettoyer aussi les codes de vérification
    await db.execute(sql`
      DELETE FROM verification_codes
      WHERE created_at < NOW() - INTERVAL '1 hour'
    `);
    console.log('✅ Cleaned up old verification codes');
    
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

deleteTestUsers();
