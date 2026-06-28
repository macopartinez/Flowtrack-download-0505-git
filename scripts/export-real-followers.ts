import { db } from "../server/db";
import { followers } from "../shared/schema";
import { eq } from "drizzle-orm";
import { writeFileSync } from "fs";

async function exportRealFollowers() {
  try {
    const userId = 21;
    
    console.log(`📊 Récupération des vrais followers pour l'utilisateur ${userId}...\n`);
    
    const allFollowers = await db
      .select()
      .from(followers)
      .where(eq(followers.userId, userId))
      .orderBy(followers.detectedAt);
    
    console.log(`✅ ${allFollowers.length} followers trouvés\n`);
    
    // Créer l'objet pour l'extension
    const followerDatabase = {
      followers: {} as Record<string, any>,
      lastScanDate: new Date().toISOString(),
      totalCount: allFollowers.length,
      firstFollowerId: allFollowers[0]?.username || '',
      isInitialized: true
    };
    
    allFollowers.forEach(f => {
      followerDatabase.followers[f.username] = {
        username: f.username,
        avatarUrl: f.avatarUrl || '',
        addedAt: f.detectedAt?.toISOString() || new Date().toISOString()
      };
    });
    
    // Sauvegarder dans un fichier JSON pour vérification
    writeFileSync(
      'follower-database-export.json',
      JSON.stringify(followerDatabase, null, 2)
    );
    
    console.log('✅ Export sauvegardé dans: follower-database-export.json');
    console.log(`📊 Total exporté: ${allFollowers.length} followers`);
    console.log('\n📋 Premiers 10 followers:');
    allFollowers.slice(0, 10).forEach((f, i) => {
      console.log(`   ${i + 1}. @${f.username}`);
    });
    
    console.log('\n📋 Derniers 10 followers:');
    allFollowers.slice(-10).forEach((f, i) => {
      console.log(`   ${i + 1}. @${f.username}`);
    });
    
    console.log('\n💡 Pour restaurer dans l\'extension:');
    console.log('   1. Ouvrez le fichier follower-database-export.json');
    console.log('   2. Copiez le contenu');
    console.log('   3. Dans la console du service worker, exécutez:');
    console.log('      const followerDatabase = <COLLEZ_ICI>;');
    console.log('      chrome.storage.local.set({ followerDatabase });');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    process.exit(0);
  }
}

exportRealFollowers();
