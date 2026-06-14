import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString, { ssl: 'require' });

async function listAllUsers() {
  try {
    console.log('📊 Liste de TOUS les utilisateurs dans la base...\n');

    // Tous les utilisateurs
    const allUsers = await sql`
      SELECT id, username, email, platform, created_at
      FROM users
      ORDER BY id
    `;

    console.log(`✅ ${allUsers.length} utilisateur(s) total:\n`);
    
    if (allUsers.length === 0) {
      console.log('❌ Aucun utilisateur dans la base !');
      console.log('\n💡 Solution:');
      console.log('   1. Le problème est que vous êtes connecté avec un ID (21) qui n\'existe pas');
      console.log('   2. Vous devez créer un VRAI compte dans la base de données');
      console.log('   3. Ou l\'authentification utilise une autre table (Supabase Auth)');
    } else {
      allUsers.forEach((u: any) => {
        console.log(`ID: ${u.id} | @${u.username || 'N/A'} | ${u.email || 'N/A'} | ${u.platform || 'N/A'}`);
      });
    }

    // Vérifier aussi la table app_users (peut-être utilisée pour l'auth)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Vérification de la table app_users...\n');

    const appUsers = await sql`
      SELECT * FROM app_users LIMIT 10
    `;

    if (appUsers.length > 0) {
      console.log(`✅ ${appUsers.length} entrée(s) dans app_users:`);
      appUsers.forEach((u: any) => {
        console.log(u);
      });
    } else {
      console.log('⚠️ Table app_users vide');
    }

    await sql.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await sql.end();
  }
}

listAllUsers();
