/**
 * Script de débogage pour vérifier l'état de la détection des followers
 * 
 * UTILISATION (dans le content script de l'extension):
 * Ce script doit être injecté par l'extension, pas copié-collé dans la console
 * 
 * Pour l'utiliser depuis la console, tapez: debugFollowerCount()
 */

window.debugFollowerCount = async function() {
  console.log('='.repeat(60));
  console.log('DEBUG - État de la Détection des Followers');
  console.log('='.repeat(60));
  console.log('');

  // 1. Vérifier le nombre de followers dans le DOM
  console.log('📊 [1/5] Vérification du DOM...');
  const followerCountElement = 
    document.querySelector('a[href*="/followers/"] span') ||
    document.querySelector('a[href$="/followers/"] span') ||
    Array.from(document.querySelectorAll('span')).find(el => 
      el.textContent?.includes('follower')
    );

  if (followerCountElement) {
    const countText = followerCountElement.textContent?.trim();
    console.log(`   ✅ Élément trouvé: "${countText}"`);
    
    // Parser le nombre
    const parseCount = (text) => {
      const cleaned = text.replace(/,/g, '').replace(/\s/g, '');
      if (cleaned.includes('K')) return Math.floor(parseFloat(cleaned) * 1000);
      if (cleaned.includes('M')) return Math.floor(parseFloat(cleaned) * 1000000);
      return parseInt(cleaned) || 0;
    };
    
    const currentCount = parseCount(countText);
    console.log(`   📈 Nombre de followers (DOM): ${currentCount}`);
  } else {
    console.log('   ❌ Élément non trouvé dans le DOM');
  }

  console.log('');

  // 2. Vérifier lastFollowerCount dans le storage
  console.log('📦 [2/5] Vérification du Storage...');
  const stored = await chrome.storage.local.get(['lastFollowerCount', 'followerDatabase', 'userInfo']);
  
  if (stored.lastFollowerCount) {
    console.log(`   ✅ lastFollowerCount: ${stored.lastFollowerCount}`);
  } else {
    console.log('   ⚠️ lastFollowerCount non défini');
  }

  if (stored.followerDatabase) {
    const dbCount = Object.keys(stored.followerDatabase.followers || {}).length;
    console.log(`   📊 Followers dans la DB: ${dbCount}`);
    console.log(`   📊 DB.totalCount: ${stored.followerDatabase.totalCount}`);
    console.log(`   📊 DB.isInitialized: ${stored.followerDatabase.isInitialized}`);
  } else {
    console.log('   ⚠️ followerDatabase non défini');
  }

  if (stored.userInfo) {
    console.log(`   📊 UserInfo.followersCount: ${stored.userInfo.followersCount}`);
  }

  console.log('');

  // 3. Comparer les valeurs
  console.log('🔍 [3/5] Comparaison des Valeurs...');
  const domCount = followerCountElement ? parseCount(followerCountElement.textContent?.trim()) : null;
  const lastCount = stored.lastFollowerCount || null;
  const dbCount = stored.followerDatabase ? Object.keys(stored.followerDatabase.followers || {}).length : null;

  if (domCount !== null && lastCount !== null) {
    const diff = domCount - lastCount;
    if (diff === 0) {
      console.log(`   ✅ DOM et lastFollowerCount synchronisés (${domCount})`);
    } else {
      console.log(`   ⚠️ DÉSYNCHRONISATION DÉTECTÉE!`);
      console.log(`      DOM: ${domCount}`);
      console.log(`      lastFollowerCount: ${lastCount}`);
      console.log(`      Différence: ${diff > 0 ? '+' : ''}${diff}`);
    }
  }

  if (domCount !== null && dbCount !== null) {
    const diff = domCount - dbCount;
    if (diff === 0) {
      console.log(`   ✅ DOM et Database synchronisés (${domCount})`);
    } else {
      console.log(`   ⚠️ DOM vs Database: ${domCount} vs ${dbCount} (diff: ${diff > 0 ? '+' : ''}${diff})`);
    }
  }

  console.log('');

  // 4. Vérifier l'API Interceptor
  console.log('🔌 [4/5] Vérification de l\'API Interceptor...');
  if (window.fetch.toString().includes('native code')) {
    console.log('   ⚠️ API Interceptor NON ACTIF (fetch natif)');
  } else {
    console.log('   ✅ API Interceptor ACTIF (fetch intercepté)');
  }

  console.log('');

  // 5. Recommandations
  console.log('💡 [5/5] Recommandations...');
  
  if (domCount !== null && lastCount !== null && domCount !== lastCount) {
    console.log('   🔧 Action recommandée: Synchroniser lastFollowerCount');
    console.log('   📝 Exécutez: await chrome.storage.local.set({ lastFollowerCount: ' + domCount + ' })');
  } else if (domCount !== null && dbCount !== null && domCount !== dbCount) {
    console.log('   🔧 Action recommandée: Lancer un scan complet des followers');
    console.log('   📝 Ouvrez le popup de l\'extension et cliquez sur "Scan Initial"');
  } else {
    console.log('   ✅ Tout semble synchronisé!');
    console.log('   📝 Demandez à quelqu\'un de vous follow pour tester la détection');
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('FIN DU DEBUG');
  console.log('='.repeat(60));

  // Retourner un objet avec toutes les infos
  return {
    dom: {
      element: followerCountElement ? 'found' : 'not found',
      count: domCount
    },
    storage: {
      lastFollowerCount: lastCount,
      databaseCount: dbCount,
      userInfoCount: stored.userInfo?.followersCount
    },
    apiInterceptor: {
      active: !window.fetch.toString().includes('native code')
    },
    synchronized: domCount === lastCount && domCount === dbCount
  };
};
