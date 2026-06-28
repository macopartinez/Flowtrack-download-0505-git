/**
 * Script de test pour vérifier la synchronisation du compteur de followers
 * À exécuter dans la console DevTools de l'extension
 */

console.log('🧪 Test de synchronisation du compteur de followers\n');

// Test 1: Vérifier la synchronisation actuelle
console.log('📊 Test 1: Vérification de la synchronisation actuelle');
chrome.storage.local.get('followerDatabase', (result) => {
  if (!result.followerDatabase) {
    console.log('❌ Aucune base de données trouvée');
    return;
  }
  
  const db = result.followerDatabase;
  const actualCount = Object.keys(db.followers).length;
  const storedCount = db.totalCount;
  
  console.log(`   totalCount stocké: ${storedCount}`);
  console.log(`   Nombre réel: ${actualCount}`);
  console.log(`   Différence: ${Math.abs(storedCount - actualCount)}`);
  
  if (storedCount === actualCount) {
    console.log('   ✅ Synchronisation OK!');
  } else {
    console.log(`   ❌ DÉSYNCHRONISÉ! (${storedCount} vs ${actualCount})`);
    console.log('   🔧 Correction automatique...');
    
    db.totalCount = actualCount;
    chrome.storage.local.set({ followerDatabase: db }, () => {
      console.log('   ✅ Correction appliquée!');
    });
  }
  
  console.log('\n');
  
  // Test 2: Afficher les statistiques
  console.log('📈 Test 2: Statistiques de la base de données');
  console.log(`   Total followers: ${actualCount}`);
  console.log(`   Premier follower ID: ${db.firstFollowerId || 'N/A'}`);
  console.log(`   Dernier scan: ${db.lastScanDate || 'N/A'}`);
  console.log(`   Initialisé: ${db.isInitialized ? 'Oui' : 'Non'}`);
  
  console.log('\n');
  
  // Test 3: Vérifier la cohérence avec le compteur affiché
  console.log('🔍 Test 3: Comparaison avec le compteur Instagram');
  
  // Chercher le compteur sur la page
  const followerCountElement = 
    document.querySelector('a[href*="/followers/"] span') ||
    document.querySelector('a[href$="/followers/"] span');
  
  if (followerCountElement) {
    const displayedText = followerCountElement.textContent?.trim() || '0';
    const displayedCount = parseFollowerCount(displayedText);
    
    console.log(`   Affiché sur Instagram: ${displayedCount}`);
    console.log(`   Dans la base de données: ${actualCount}`);
    console.log(`   Différence: ${Math.abs(displayedCount - actualCount)}`);
    
    if (displayedCount === actualCount) {
      console.log('   ✅ Parfaitement synchronisé!');
    } else if (Math.abs(displayedCount - actualCount) <= 2) {
      console.log('   ⚠️ Légère différence (acceptable, comptes shadowbanned)');
    } else {
      console.log('   ❌ Différence importante! Un scan est recommandé.');
    }
  } else {
    console.log('   ⚠️ Compteur Instagram non trouvé (pas sur la page de profil?)');
  }
  
  console.log('\n');
  
  // Test 4: Vérifier lastFollowerCount
  console.log('💾 Test 4: Vérification du cache lastFollowerCount');
  chrome.storage.local.get('lastFollowerCount', (cacheResult) => {
    const cachedCount = cacheResult.lastFollowerCount || 0;
    console.log(`   lastFollowerCount: ${cachedCount}`);
    console.log(`   Base de données: ${actualCount}`);
    console.log(`   Différence: ${Math.abs(cachedCount - actualCount)}`);
    
    if (cachedCount === actualCount) {
      console.log('   ✅ Cache synchronisé!');
    } else {
      console.log('   ⚠️ Cache désynchronisé (normal si pas de changement récent)');
    }
    
    console.log('\n✅ Tests terminés!');
  });
});

// Fonction utilitaire pour parser le compteur
function parseFollowerCount(text) {
  const cleaned = text.replace(/,/g, '').replace(/\s/g, '');
  
  if (cleaned.includes('K')) {
    return Math.floor(parseFloat(cleaned) * 1000);
  } else if (cleaned.includes('M')) {
    return Math.floor(parseFloat(cleaned) * 1000000);
  }
  
  return parseInt(cleaned) || 0;
}

// Fonction de réparation manuelle
window.fixFollowerCountSync = function() {
  console.log('🔧 Réparation manuelle de la synchronisation...');
  
  chrome.storage.local.get('followerDatabase', (result) => {
    if (!result.followerDatabase) {
      console.log('❌ Aucune base de données trouvée');
      return;
    }
    
    const db = result.followerDatabase;
    const actualCount = Object.keys(db.followers).length;
    
    console.log(`   Ancien totalCount: ${db.totalCount}`);
    console.log(`   Nouveau totalCount: ${actualCount}`);
    
    db.totalCount = actualCount;
    
    chrome.storage.local.set({ followerDatabase: db }, () => {
      console.log('   ✅ Réparation terminée!');
      console.log('   💾 Base de données sauvegardée');
    });
  });
};

console.log('💡 Astuce: Utilisez fixFollowerCountSync() pour forcer la synchronisation');
