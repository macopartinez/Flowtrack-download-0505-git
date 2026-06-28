import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString, { ssl: 'require' });

async function checkFollowersTable() {
  try {
    console.log('📋 Structure de la table followers:\n');

    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'followers'
      ORDER BY ordinal_position
    `;

    columns.forEach((c: any) => {
      console.log(`  - ${c.column_name} (${c.data_type}) ${c.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Données dans la table followers:\n');

    const followers = await sql`
      SELECT * FROM followers LIMIT 10
    `;

    console.log(`✅ ${followers.length} follower(s) trouvé(s)`);
    
    if (followers.length > 0) {
      followers.forEach((f: any) => {
        console.log(f);
      });
    }

    await sql.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await sql.end();
  }
}

checkFollowersTable();
