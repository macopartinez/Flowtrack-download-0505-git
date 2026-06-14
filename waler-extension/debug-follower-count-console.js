/**
 * Script de débogage SIMPLIFIÉ pour la console Instagram
 * Ce script vérifie uniquement le DOM (pas le storage Chrome)
 * 
 * UTILISATION:
 * 1. Ouvrir Instagram dans Chrome
 * 2. Ouvrir la console (F12)
 * 3. Copier-coller ce script et appuyer sur Entrée
 */

(function debugFollowerCountConsole() {
  console.log('='.repeat(60));
  console.log('DEBUG - Détection des Followers (Console)');
  console.log('='.repeat(60));
  console.log('');

  // 1. Vérifier le nombre de followers dans le DOM
  console.log('📊 Vérification du DOM...');
  
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
    
    console.log('');
    console.log('💡 Pour vérifier le storage Chrome:');
    console.log('   Ouvrez la console de l\'extension (pas la page web)');
    console.log('   Ou utilisez le script debug-follower-count-extension.js');
    
    return {
      success: true,
      dom: {
        element: 'found',
        text: countText,
        count: currentCount
      }
    };
  } else {
    console.log('   ❌ Élément non trouvé dans le DOM');
    console.log('');
    console.log('💡 Vérifiez que vous êtes bien sur votre profil Instagram');
    
    return {
      success: false,
      error: 'Follower count element not found'
    };
  }
})();
