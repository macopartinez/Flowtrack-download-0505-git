import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function getCode() {
  try {
    const codeToFind = 'VERIFY-ZTIS3O';
    
    const result = await db.execute(sql`
      SELECT code_to_send, code, created_at, expires_at, used
      FROM verification_codes
      WHERE code_to_send = ${codeToFind}
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    console.log('Result:', result[0]);
    
    if (result[0]) {
      const row = result[0] as any;
      console.log(`\n✅ Code à 6 chiffres pour ${codeToFind}: ${row.code}`);
    } else {
      console.log(`❌ Code ${codeToFind} not found in database`);
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

getCode();
