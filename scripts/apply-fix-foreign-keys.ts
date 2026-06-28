import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString, { ssl: 'require' });

async function applyFix() {
  try {
    console.log('🔧 Application de la correction des clés étrangères...\n');

    // 1. Supprimer les anciennes contraintes
    console.log('📌 Suppression des anciennes contraintes...');
    
    await sql`ALTER TABLE followers DROP CONSTRAINT IF EXISTS fk_follower_user`;
    console.log('   ✅ fk_follower_user supprimée');
    
    await sql`ALTER TABLE unfollowers DROP CONSTRAINT IF EXISTS fk_unfollower_user`;
    console.log('   ✅ fk_unfollower_user supprimée');
    
    await sql`ALTER TABLE blockers DROP CONSTRAINT IF EXISTS fk_blocker_user`;
    console.log('   ✅ fk_blocker_user supprimée');

    // 2. Ajouter les nouvelles contraintes
    console.log('\n📌 Ajout des nouvelles contraintes vers app_users...');
    
    await sql`
      ALTER TABLE followers 
      ADD CONSTRAINT fk_follower_user 
      FOREIGN KEY (user_id) 
      REFERENCES app_users(id) 
      ON DELETE CASCADE
    `;
    console.log('   ✅ fk_follower_user créée (vers app_users)');
    
    await sql`
      ALTER TABLE unfollowers 
      ADD CONSTRAINT fk_unfollower_user 
      FOREIGN KEY (user_id) 
      REFERENCES app_users(id) 
      ON DELETE CASCADE
    `;
    console.log('   ✅ fk_unfollower_user créée (vers app_users)');
    
    await sql`
      ALTER TABLE blockers 
      ADD CONSTRAINT fk_blocker_user 
      FOREIGN KEY (user_id) 
      REFERENCES app_users(id) 
      ON DELETE CASCADE
    `;
    console.log('   ✅ fk_blocker_user créée (vers app_users)');

    // 3. Vérification
    console.log('\n📊 Vérification des nouvelles contraintes...\n');
    
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

    constraints.forEach((c: any) => {
      console.log(`✅ ${c.table_name}.${c.column_name} → ${c.foreign_table_name}.${c.foreign_column_name}`);
    });

    console.log('\n🎉 Migration terminée avec succès !');
    console.log('\n💡 Vous pouvez maintenant:');
    console.log('   1. Cliquer sur "Synchroniser maintenant" dans le popup Waler');
    console.log('   2. Les données seront sauvegardées dans la base');
    console.log('   3. Le dashboard affichera les stats correctement');

    await sql.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await sql.end();
    process.exit(1);
  }
}

applyFix();
