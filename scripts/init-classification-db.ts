/**
 * Script d'initialisation de la base de données pour le système de classification
 * Usage: npm run init-classification-db
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

const dbPath = join(__dirname, '..', 'server', 'waler.db');
const db = new Database(dbPath);

console.log('🔧 Initialisation du système de classification...\n');

try {
  // Lire et exécuter init_classification_tables.sql
  console.log('📊 Création des tables de classification...');
  const classificationSQL = readFileSync(
    join(__dirname, '..', 'server', 'init_classification_tables.sql'),
    'utf-8'
  );
  
  db.exec(classificationSQL);
  console.log('✅ Tables de classification créées\n');

  // Lire et exécuter init_dm_tables.sql
  console.log('💬 Création des tables DMs...');
  const dmSQL = readFileSync(
    join(__dirname, '..', 'server', 'init_dm_tables.sql'),
    'utf-8'
  );
  
  db.exec(dmSQL);
  console.log('✅ Tables DMs créées\n');

  // Vérifier que les tables existent
  console.log('🔍 Vérification des tables...');
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    AND name IN (
      'contact_scores', 
      'classification_suggestions', 
      'classification_history',
      'dm_messages',
      'dm_conversations',
      'dm_stats'
    )
    ORDER BY name
  `).all();

  console.log('\nTables créées:');
  tables.forEach((table: any) => {
    console.log(`  ✓ ${table.name}`);
  });

  // Vérifier les vues
  const views = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='view' 
    AND name LIKE 'v_%'
    ORDER BY name
  `).all();

  if (views.length > 0) {
    console.log('\nVues créées:');
    views.forEach((view: any) => {
      console.log(`  ✓ ${view.name}`);
    });
  }

  // Statistiques
  console.log('\n📈 Statistiques:');
  console.log(`  • ${tables.length} tables créées`);
  console.log(`  • ${views.length} vues créées`);

  console.log('\n✨ Initialisation terminée avec succès!\n');
  console.log('Prochaines étapes:');
  console.log('  1. Installer l\'extension Waler dans Chrome');
  console.log('  2. Se connecter à Instagram');
  console.log('  3. Naviguer vers /classification dans FlowTrack\n');

} catch (error) {
  console.error('❌ Erreur lors de l\'initialisation:', error);
  process.exit(1);
} finally {
  db.close();
}
