import { db } from "../server/db";
import { followers } from "../shared/schema";
import { eq } from "drizzle-orm";

async function exportFollowersForExtension() {
  try {
    const userId = 21;
    
    console.log(`📊 Récupération des followers pour l'utilisateur ${userId}...`);
    
    const allFollowers = await db
      .select()
      .from(followers)
      .where(eq(followers.userId, userId))
      .orderBy(followers.detectedAt);
    
    console.log(`✅ ${allFollowers.length} followers trouvés`);
    
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
    
    // Afficher le code à copier dans la console du service worker
    console.log('\n📋 Copiez ce code dans la console du service worker :\n');
    console.log('─'.repeat(80));
    console.log(`
const followerDatabase = ${JSON.stringify(followerDatabase, null, 2)};

chrome.storage.local.set({ followerDatabase }, () => {
  console.log('✅ Base de données restaurée avec ${allFollowers.length} vrais followers');
  console.log('👉 Vous pouvez maintenant analyser les unfollowers');
});
    `.trim());
    console.log('─'.repeat(80));
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    process.exit(0);
  }
}

exportFollowersForExtension();
