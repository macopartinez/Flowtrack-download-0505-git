import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString, { ssl: 'require' });

async function checkUser21() {
  try {
    console.log('🔍 Vérification de l\'utilisateur ID 21...\n');

    // Vérifier l'utilisateur dans app_users
    const users = await sql`
      SELECT id, username, email, platform, created_at
      FROM app_users
      WHERE id = 21
    `;

    if (users.length === 0) {
      console.log('❌ Utilisateur ID 21 non trouvé dans la base');
      await sql.end();
      return;
    }

    const user = users[0];
    console.log('✅ Utilisateur trouvé:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: @${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Platform: ${user.platform}`);
    console.log(`   Créé le: ${new Date(user.created_at).toLocaleString()}`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Compter les followers
    const followersCount = await sql`
      SELECT COUNT(*) as count 
      FROM followers 
      WHERE user_id = 21
    `;

    // Compter les unfollowers
    const unfollowersCount = await sql`
      SELECT COUNT(*) as count 
      FROM unfollowers 
      WHERE user_id = 21
    `;

    // Compter les blockers
    const blockersCount = await sql`
      SELECT COUNT(*) as count 
      FROM blockers 
      WHERE user_id = 21
    `;

    console.log(`✅ Followers: ${followersCount[0].count}`);
    console.log(`❌ Unfollowers: ${unfollowersCount[0].count}`);
    console.log(`🚫 Blockers: ${blockersCount[0].count}`);

    // Derniers followers
    const recentFollowers = await sql`
      SELECT username, detected_at, avatar_url
      FROM followers 
      WHERE user_id = 21
      ORDER BY detected_at DESC 
      LIMIT 10
    `;

    if (recentFollowers.length > 0) {
      console.log('\n🆕 Derniers followers:');
      recentFollowers.forEach((f: any, i: number) => {
        console.log(`  ${i + 1}. @${f.username} - ${new Date(f.detected_at).toLocaleString()}`);
      });
    } else {
      console.log('\n⚠️ Aucun follower dans la base');
      console.log('   Les données de l\'extension ne sont pas synchronisées.');
      console.log('   Cliquez sur "Synchroniser maintenant" dans le popup.');
    }

    // Derniers unfollowers
    const recentUnfollowers = await sql`
      SELECT username, detected_at
      FROM unfollowers 
      WHERE user_id = 21
      ORDER BY detected_at DESC 
      LIMIT 10
    `;

    if (recentUnfollowers.length > 0) {
      console.log('\n❌ Derniers unfollowers:');
      recentUnfollowers.forEach((f: any, i: number) => {
        console.log(`  ${i + 1}. @${f.username} - ${new Date(f.detected_at).toLocaleString()}`);
      });
    }

    console.log('\n✅ Vérification terminée');
    await sql.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await sql.end();
  }
}

checkUser21();
