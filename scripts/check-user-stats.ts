import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function checkUserStats() {
  try {
    const username = 'pako_mrtz';
    
    const result = await db.execute(sql`
      SELECT 
        id,
        username,
        email,
        subscription_tier,
        subscription_status,
        followers_count,
        following_count,
        posts_count,
        bio,
        is_private,
        analysis_status,
        last_analyzed_at
      FROM app_users
      WHERE username = ${username}
    `);
    
    if (result.length > 0) {
      console.log('\n📊 User stats from database:\n');
      const user = result[0] as any;
      console.log(`Username: @${user.username}`);
      console.log(`Email: ${user.email}`);
      console.log(`Plan: ${user.subscription_tier || 'none'} (${user.subscription_status || 'none'})`);
      console.log(`\n📈 Instagram Stats:`);
      console.log(`  Followers: ${user.followers_count || 'N/A'}`);
      console.log(`  Following: ${user.following_count || 'N/A'}`);
      console.log(`  Posts: ${user.posts_count || 'N/A'}`);
      console.log(`  Bio: ${user.bio || 'N/A'}`);
      console.log(`  Private: ${user.is_private ? 'Yes' : 'No'}`);
      console.log(`\n🔍 Analysis:`);
      console.log(`  Status: ${user.analysis_status}`);
      console.log(`  Last analyzed: ${user.last_analyzed_at || 'Never'}`);
    } else {
      console.log(`❌ User @${username} not found`);
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUserStats();
