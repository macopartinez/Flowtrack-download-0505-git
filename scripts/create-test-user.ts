import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString, { ssl: 'require' });

async function createTestUser() {
  try {
    console.log('🔧 Création d\'un utilisateur de test...\n');

    const username = 'testuser';
    const email = 'test@flowtrack.com';
    const password = 'password123';
    const hashedPassword = password; // Simplifié pour le test

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await sql`
      SELECT id, username, email 
      FROM users 
      WHERE username = ${username} OR email = ${email}
    `;

    if (existingUser.length > 0) {
      console.log('✅ Utilisateur existe déjà:');
      console.log(`   ID: ${existingUser[0].id}`);
      console.log(`   Username: ${existingUser[0].username}`);
      console.log(`   Email: ${existingUser[0].email}`);
      
      // Créer les stats si elles n'existent pas
      const stats = await sql`
        SELECT * FROM user_stats WHERE user_id = ${existingUser[0].id}
      `;

      if (stats.length === 0) {
        await sql`
          INSERT INTO user_stats (user_id, total_followers, total_unfollowers, total_blockers, last_updated)
          VALUES (${existingUser[0].id}, 0, 0, 0, ${new Date().toISOString()})
        `;
        console.log('✅ Stats créées pour l\'utilisateur');
      }

      await sql.end();
      return;
    }

    // Créer l'utilisateur
    const result = await sql`
      INSERT INTO users (username, email, password_hash, platform, usage_mode, created_at)
      VALUES (${username}, ${email}, ${hashedPassword}, 'instagram', 'personal', ${new Date().toISOString()})
      RETURNING id, username, email
    `;

    const user = result[0];
    console.log('✅ Utilisateur créé avec succès:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${password}`);

    // Créer les stats initiales
    await sql`
      INSERT INTO user_stats (user_id, total_followers, total_unfollowers, total_blockers, last_updated)
      VALUES (${user.id}, 0, 0, 0, ${new Date().toISOString()})
    `;

    console.log('\n✅ Stats initiales créées');
    console.log('\n📝 Pour vous connecter:');
    console.log(`   1. Aller sur http://localhost:5000/login`);
    console.log(`   2. Username: ${username}`);
    console.log(`   3. Password: ${password}`);

    await sql.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await sql.end();
  }
}

createTestUser();
