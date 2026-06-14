import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString, { ssl: 'require' });

async function checkAndFixData() {
  try {
    console.log('🔍 Vérification des données...\n');

    // Vérifier les utilisateurs
    const users = await sql`
      SELECT id, username, email, platform, created_at
      FROM users
      WHERE username IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 10
    `;

    console.log(`📊 ${users.length} utilisateur(s) trouvé(s):\n`);
    users.forEach((u: any, i: number) => {
      console.log(`${i + 1}. @${u.username} (${u.email}) - ${u.platform} - ID: ${u.id}`);
    });

    if (users.length === 0) {
      console.log('\n⚠️ Aucun utilisateur trouvé. Vous devez vous inscrire via l\'interface web.');
      console.log('   1. Aller sur http://localhost:5000/signup');
      console.log('   2. Créer un compte');
      console.log('   3. Connecter l\'extension');
      await sql.end();
      return;
    }

    // Pour chaque utilisateur, vérifier les données
    for (const user of users) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`👤 Utilisateur: @${user.username}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      // Compter les followers
      const followersCount = await sql`
        SELECT COUNT(*) as count 
        FROM followers 
        WHERE user_id = ${user.id}
      `;

      // Compter les unfollowers
      const unfollowersCount = await sql`
        SELECT COUNT(*) as count 
        FROM unfollowers 
        WHERE user_id = ${user.id}
      `;

      // Compter les blockers
      const blockersCount = await sql`
        SELECT COUNT(*) as count 
        FROM blockers 
        WHERE user_id = ${user.id}
      `;

      console.log(`✅ Followers: ${followersCount[0].count}`);
      console.log(`❌ Unfollowers: ${unfollowersCount[0].count}`);
      console.log(`🚫 Blockers: ${blockersCount[0].count}`);

      // Derniers followers
      const recentFollowers = await sql`
        SELECT username, detected_at 
        FROM followers 
        WHERE user_id = ${user.id}
        ORDER BY detected_at DESC 
        LIMIT 5
      `;

      if (recentFollowers.length > 0) {
        console.log('\n🆕 Derniers followers:');
        recentFollowers.forEach((f: any, i: number) => {
          console.log(`  ${i + 1}. @${f.username} - ${new Date(f.detected_at).toLocaleString()}`);
        });
      }

      // Derniers unfollowers
      const recentUnfollowers = await sql`
        SELECT username, detected_at 
        FROM unfollowers 
        WHERE user_id = ${user.id}
        ORDER BY detected_at DESC 
        LIMIT 5
      `;

      if (recentUnfollowers.length > 0) {
        console.log('\n❌ Derniers unfollowers:');
        recentUnfollowers.forEach((f: any, i: number) => {
          console.log(`  ${i + 1}. @${f.username} - ${new Date(f.detected_at).toLocaleString()}`);
        });
      }
    }

    console.log('\n✅ Vérification terminée');
    await sql.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await sql.end();
  }
}

checkAndFixData();
