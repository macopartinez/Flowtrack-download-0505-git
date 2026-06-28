import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString, { ssl: 'require' });

async function showTables() {
  try {
    console.log('📊 Liste des tables dans la base de données:\n');

    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log(`✅ ${tables.length} table(s) trouvée(s):\n`);
    tables.forEach((t: any, i: number) => {
      console.log(`${i + 1}. ${t.table_name}`);
    });

    // Afficher la structure de la table users si elle existe
    const usersTable = tables.find((t: any) => t.table_name === 'users' || t.table_name === 'User');
    
    if (usersTable) {
      console.log(`\n📋 Structure de la table "${usersTable.table_name}":\n`);
      
      const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = ${usersTable.table_name}
        ORDER BY ordinal_position
      `;

      columns.forEach((c: any) => {
        console.log(`  - ${c.column_name} (${c.data_type}) ${c.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }

    await sql.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await sql.end();
  }
}

showTables();
