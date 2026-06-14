/**
 * Script de nettoyage : Supprimer les followers qui sont aussi des unfollowers
 * À exécuter une seule fois pour corriger les données existantes
 */

import { db } from "./db";
import { followers, unfollowers } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

async function cleanupFollowers() {
  console.log('🧹 Nettoyage des followers...\n');
  
  try {
    // 1. Récupérer tous les unfollowers
    const allUnfollowers = await db.select().from(unfollowers);
    console.log(`📊 Unfollowers trouvés: ${allUnfollowers.length}`);
    
    // 2. Grouper par userId
    const unfollowersByUser = new Map<number, Set<string>>();
    for (const unfollower of allUnfollowers) {
      if (!unfollowersByUser.has(unfollower.userId)) {
        unfollowersByUser.set(unfollower.userId, new Set());
      }
      unfollowersByUser.get(unfollower.userId)!.add(unfollower.username);
    }
    
    console.log(`👥 Utilisateurs avec unfollowers: ${unfollowersByUser.size}\n`);
    
    // 3. Pour chaque utilisateur, supprimer les followers qui sont aussi des unfollowers
    let totalDeleted = 0;
    
    for (const [userId, unfollowerUsernames] of unfollowersByUser.entries()) {
      console.log(`\n🔍 Utilisateur ${userId}:`);
      console.log(`   Unfollowers: ${unfollowerUsernames.size}`);
      
      // Récupérer les followers de cet utilisateur
      const userFollowers = await db
        .select()
        .from(followers)
        .where(eq(followers.userId, userId));
      
      console.log(`   Followers en DB: ${userFollowers.length}`);
      
      // Trouver les doublons (followers qui sont aussi unfollowers)
      const duplicates = userFollowers.filter(f => 
        unfollowerUsernames.has(f.username)
      );
      
      if (duplicates.length > 0) {
        console.log(`   ⚠️ Doublons trouvés: ${duplicates.length}`);
        console.log(`   Exemples: ${duplicates.slice(0, 5).map(d => d.username).join(', ')}`);
        
        // Supprimer les doublons
        for (const duplicate of duplicates) {
          await db
            .delete(followers)
            .where(
              and(
                eq(followers.userId, userId),
                eq(followers.username, duplicate.username)
              )
            );
        }
        
        totalDeleted += duplicates.length;
        console.log(`   ✅ ${duplicates.length} doublons supprimés`);
      } else {
        console.log(`   ✅ Aucun doublon`);
      }
      
      // Afficher le nouveau total
      const newCount = await db
        .select()
        .from(followers)
        .where(eq(followers.userId, userId));
      
      console.log(`   📊 Nouveau total: ${newCount.length} followers`);
    }
    
    console.log(`\n✅ Nettoyage terminé!`);
    console.log(`📊 Total supprimé: ${totalDeleted} doublons`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
  
  process.exit(0);
}

cleanupFollowers();
