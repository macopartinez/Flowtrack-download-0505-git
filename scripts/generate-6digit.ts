import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function generate6Digit() {
  try {
    const codeToFind = 'VERIFY-ZTIS3O';
    const code6Digit = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Mettre à jour le code dans la DB
    await db.execute(sql`
      UPDATE verification_codes
      SET code = ${code6Digit}
      WHERE code_to_send = ${codeToFind}
    `);
    
    console.log(`✅ Code à 6 chiffres généré pour ${codeToFind}: ${code6Digit}`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

generate6Digit();
