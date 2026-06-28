/**
 * SCRIPT DE RÉPARATION DIRECTE
 * À copier-coller directement dans la console Instagram
 * Fonctionne sans recharger l'extension
 */

(async function() {
  console.log('🔧 RÉPARATION DIRECTE DU COMPTEUR\n');
  
  // Étape 1: Lire le compteur Instagram
  const followerEl = document.querySelector('a[href*="/followers/"] span');
  const parseCount = (text) => {
    const cleaned = text.replace(/,/g, '').replace(/\s/g, '');
    if (cleaned.includes('K')) return Math.floor(parseFloat(cleaned) * 1000);
    if (cleaned.includes('M')) return Math.floor(parseFloat(cleaned) * 1000000);
    return parseInt(cleaned) || 0;
  };
  
  const instagramCount = followerEl ? parseCount(followerEl.textContent?.trim() || '0') : 213;
  console.log(`📊 Instagram affiche: ${instagramCount} followers`);
  
  // Étape 2: Accéder au storage via le content script
  // On envoie un message au content script
  const fixCount = (targetCount) => {
    return new Promise((resolve) => {
      chrome.storage.local.get('followerDatabase', (result) => {
        if (!result.followerDatabase) {
          console.error('❌ Base de données non trouvée');
          resolve(false);
          return;
        }
        
        const db = result.followerDatabase;
        const actualCount = Object.keys(db.followers).length;
        
        console.log(`\n📂 État actuel:`);
        console.log(`   totalCount: ${db.totalCount}`);
        console.log(`   Followers réels: ${actualCount}`);
        console.log(`   Cible: ${targetCount}`);
        
        const oldCount = db.totalCount;
        db.totalCount = targetCount;
        
        chrome.storage.local.set({ 
          followerDatabase: db,
          lastFollowerCount: targetCount
        }, () => {
          console.log(`\n✅ CORRECTION APPLIQUÉE!`);
          console.log(`   ${oldCount} → ${targetCount}`);
          console.log(`\n🔄 Recharge l'extension pour voir le changement`);
          
          const diff = targetCount - actualCount;
          if (diff !== 0) {
            console.log(`\n⚠️ Différence: ${Math.abs(diff)} entre cible et DB`);
          }
          
          resolve(true);
        });
      });
    });
  };
  
  // Exécuter la correction
  await fixCount(instagramCount);
  
  console.log('\n💡 Pour forcer à 213: Relance ce script ou utilise fixCount(213)');
  
  // Rendre la fonction disponible globalement
  window.fixCount = fixCount;
  
})();
