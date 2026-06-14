/**
 * FORCE SYNC - Synchronise la base avec le compteur Instagram
 * Ce script force la synchronisation du totalCount avec le compteur affiché sur Instagram
 * 
 * UTILISATION:
 * 1. Aller sur ton profil Instagram
 * 2. Ouvrir la console DevTools (F12)
 * 3. Copier-coller ce script
 */

(async function forceSyncWithInstagram() {
  console.log('🔄 SYNCHRONISATION FORCÉE AVEC INSTAGRAM\n');
  
  // Lire le compteur Instagram
  const followerCountElement = 
    document.querySelector('a[href*="/followers/"] span') ||
    document.querySelector('a[href$="/followers/"] span');
  
  if (!followerCountElement) {
    console.error('❌ Compteur non trouvé. Assurez-vous d\'être sur votre profil.');
    return;
  }
  
  const parseCount = (text) => {
    const cleaned = text.replace(/,/g, '').replace(/\s/g, '');
    if (cleaned.includes('K')) return Math.floor(parseFloat(cleaned) * 1000);
    if (cleaned.includes('M')) return Math.floor(parseFloat(cleaned) * 1000000);
    return parseInt(cleaned) || 0;
  };
  
  const instagramCount = parseCount(followerCountElement.textContent?.trim() || '0');
  console.log(`📊 Instagram affiche: ${instagramCount} followers`);
  
  // Mettre à jour la base de données
  chrome.storage.local.get('followerDatabase', (result) => {
    if (!result.followerDatabase) {
      console.error('❌ Base de données non trouvée');
      return;
    }
    
    const db = result.followerDatabase;
    const actualCount = Object.keys(db.followers).length;
    
    console.log(`📂 Base de données: ${actualCount} followers enregistrés`);
    console.log(`📊 totalCount actuel: ${db.totalCount}`);
    
    // Forcer la synchronisation avec Instagram
    const oldTotalCount = db.totalCount;
    db.totalCount = instagramCount;
    
    chrome.storage.local.set({ 
      followerDatabase: db,
      lastFollowerCount: instagramCount
    }, () => {
      console.log(`\n✅ SYNCHRONISATION TERMINÉE!`);
      console.log(`   ${oldTotalCount} → ${instagramCount}`);
      console.log(`   Cache mis à jour: ${instagramCount}`);
      
      // Analyser la différence
      const diff = instagramCount - actualCount;
      if (diff > 0) {
        console.log(`\n⚠️ ATTENTION: Il manque ${diff} follower(s) dans la base`);
        console.log(`   Nombre réel en DB: ${actualCount}`);
        console.log(`   Nombre Instagram: ${instagramCount}`);
        console.log(`\n💡 SOLUTION: Lancer un scan pour capturer les followers manquants`);
        console.log(`   1. Ouvrir le modal followers`);
        console.log(`   2. Attendre que l'extension scanne automatiquement`);
      } else if (diff < 0) {
        console.log(`\n⚠️ ATTENTION: Il y a ${Math.abs(diff)} follower(s) en trop dans la base`);
        console.log(`   Nombre réel en DB: ${actualCount}`);
        console.log(`   Nombre Instagram: ${instagramCount}`);
        console.log(`\n💡 SOLUTION: Lancer une détection d'unfollowers`);
        console.log(`   Cela nettoiera les entrées obsolètes`);
      } else {
        console.log(`\n✅ PARFAIT! La base contient exactement ${actualCount} followers`);
        console.log(`   Tout est synchronisé!`);
      }
      
      console.log(`\n🔄 Rechargez la page pour voir les changements`);
    });
  });
})();
