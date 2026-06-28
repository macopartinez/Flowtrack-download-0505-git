import { db } from "../server/db";
import { followers } from "../shared/schema";
import { eq } from "drizzle-orm";

async function analyzeFollowers() {
  try {
    const userId = 21;
    
    console.log(`🔍 Analyse des followers pour l'utilisateur ${userId}...\n`);
    
    const allFollowers = await db
      .select()
      .from(followers)
      .where(eq(followers.userId, userId));
    
    console.log(`📊 Total: ${allFollowers.length} followers\n`);
    
    // Analyser les patterns
    const patterns = {
      with67: allFollowers.filter(f => f.username.includes('.67')),
      withUnderscore67: allFollowers.filter(f => f.username.match(/^_.*\.67_?$/)),
      real: allFollowers.filter(f => !f.username.includes('.67'))
    };
    
    console.log(`🔢 Statistiques:`);
    console.log(`   - Avec ".67": ${patterns.with67.length}`);
    console.log(`   - Pattern "_xxx.67_": ${patterns.withUnderscore67.length}`);
    console.log(`   - Vrais followers (sans .67): ${patterns.real.length}\n`);
    
    console.log(`✅ Vrais followers (premiers 20):`);
    patterns.real.slice(0, 20).forEach((f, i) => {
      console.log(`   ${i + 1}. @${f.username}`);
    });
    
    console.log(`\n❌ Followers fictifs avec .67 (premiers 10):`);
    patterns.with67.slice(0, 10).forEach((f, i) => {
      console.log(`   ${i + 1}. @${f.username}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    process.exit(0);
  }
}

analyzeFollowers();
