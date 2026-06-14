import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString, { ssl: 'require' });

async function checkStats() {
  try {
    console.log('🔍 Vérification des stats dans la base de données...\n');

    // Récupérer tous les utilisateurs
    const users = await sql`
      SELECT id, username, email
      FROM users
    `;

    console.log(`📊 ${users.length} utilisateur(s) trouvé(s)\n`);

    for (const user of users) {
      console.log(`\n👤 Utilisateur: ${user.username} (ID: ${user.id})`);
      console.log(`📧 Email: ${user.email}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Compter les changements de compte (followers/unfollowers)
      const accountChanges = await sql`
        SELECT change_type, COUNT(*) as count 
        FROM account_changes 
        WHERE user_id = ${user.id}
        GROUP BY change_type
      `;

      const followers = accountChanges.find((c: any) => c.change_type === 'follower')?.count || 0;
      const unfollowers = accountChanges.find((c: any) => c.change_type === 'unfollower')?.count || 0;
      const blockers = accountChanges.find((c: any) => c.change_type === 'blocker')?.count || 0;

      console.log(`✅ Followers: ${followers}`);
      console.log(`❌ Unfollowers: ${unfollowers}`);
      console.log(`🚫 Blockers: ${blockers}`);

      // Stats utilisateur
      const userStats = await sql`
        SELECT * 
        FROM user_stats 
        WHERE user_id = ${user.id}
        LIMIT 1
      `;

      if (userStats.length > 0) {
        const stats = userStats[0];
        console.log(`\n📊 Stats globales:`);
        console.log(`  Total followers: ${stats.total_followers}`);
        console.log(`  Total unfollowers: ${stats.total_unfollowers}`);
        console.log(`  Total blockers: ${stats.total_blockers}`);
        console.log(`  Dernière mise à jour: ${new Date(stats.last_updated).toLocaleString()}`);
      }

      // Derniers changements
      const recentChanges = await sql`
        SELECT account_username, change_type, detected_at 
        FROM account_changes 
        WHERE user_id = ${user.id}
        ORDER BY detected_at DESC 
        LIMIT 10
      `;

      if (recentChanges.length > 0) {
        console.log('\n🆕 Derniers changements:');
        recentChanges.forEach((c: any, i: number) => {
          const emoji = c.change_type === 'follower' ? '✅' : c.change_type === 'unfollower' ? '❌' : '🚫';
          console.log(`  ${i + 1}. ${emoji} @${c.account_username} (${c.change_type}) - ${new Date(c.detected_at).toLocaleString()}`);
        });
      } else {
        console.log('\n⚠️ Aucun changement dans la base');
      }

      // Prospects
      const prospectsCount = await sql`
        SELECT COUNT(*) as count 
        FROM prospects 
        WHERE user_id = ${user.id}
      `;

      console.log(`\n🎯 Prospects: ${prospectsCount[0].count}`);

      // Connections
      const connectionsCount = await sql`
        SELECT COUNT(*) as count 
        FROM connections 
        WHERE user_id = ${user.id}
      `;

      console.log(`🤝 Connections: ${connectionsCount[0].count}`);
    }

    console.log('\n✅ Vérification terminée');
    await sql.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await sql.end();
  }
}

checkStats();
