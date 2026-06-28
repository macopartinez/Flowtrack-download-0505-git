import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString, { ssl: 'require' });

async function checkForeignKeys() {
  try {
    console.log('🔍 Vérification des contraintes de clé étrangère...\n');

    const constraints = await sql`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('followers', 'unfollowers', 'blockers')
    `;

    console.log(`✅ ${constraints.length} contrainte(s) trouvée(s):\n`);

    constraints.forEach((c: any) => {
      console.log(`📌 Table: ${c.table_name}`);
      console.log(`   Colonne: ${c.column_name}`);
      console.log(`   Référence: ${c.foreign_table_name}.${c.foreign_column_name}`);
      console.log(`   Contrainte: ${c.constraint_name}`);
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 Solution:\n');
    console.log('Les contraintes pointent vers la table "users" (Supabase Auth)');
    console.log('mais vos données sont dans "app_users".\n');
    console.log('Nous devons modifier les contraintes pour pointer vers "app_users".');

    await sql.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await sql.end();
  }
}

checkForeignKeys();
