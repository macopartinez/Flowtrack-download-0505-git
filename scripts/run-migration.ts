import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('🚀 Running migration: add_analysis_columns.sql');
    
    const migrationPath = join(__dirname, '../db/migrations/add_analysis_columns.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Exécuter la migration
    await db.execute(sql.raw(migrationSQL));
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
