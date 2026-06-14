/**
 * SCRIPT DE RÉPARATION IMMÉDIATE
 * Corrige la désynchronisation du compteur de followers
 * 
 * UTILISATION:
 * 1. Ouvrir Instagram sur ton profil
 * 2. Ouvrir la console DevTools (F12)
 * 3. Copier-coller ce script et appuyer sur Entrée
 */

console.log('🔧 RÉPARATION DU COMPTEUR DE FOLLOWERS\n');

// Étape 1: Lire le compteur affiché sur Instagram
console.log('📊 Étape 1: Lecture du compteur Instagram...');

const followerCountElement = 
  document.querySelector('a[href*="/followers/"] span') ||
  document.querySelector('a[href$="/followers/"] span') ||
  Array.from(document.querySelectorAll('span')).find(el => 
    el.textContent?.includes('follower')
  );

if (!followerCountElement) {
  console.error('❌ Compteur Instagram non trouvé. Es-tu sur ta page de profil?');
  throw new Error('Veuillez aller sur votre page de profil Instagram');
}

const countText = followerCountElement.textContent?.trim() || '0';
const parseFollowerCount = (text) => {
  const cleaned = text.replace(/,/g, '').replace(/\s/g, '');
  if (cleaned.includes('K')) return Math.floor(parseFloat(cleaned) * 1000);
  if (cleaned.includes('M')) return Math.floor(parseFloat(cleaned) * 1000000);
  return parseInt(cleaned) || 0;
};

const instagramCount = parseFollowerCount(countText);
console.log(`   ✅ Instagram affiche: ${instagramCount} followers`);

// Étape 2: Lire la base de données
console.log('\n📂 Étape 2: Lecture de la base de données...');

chrome.storage.local.get(['followerDatabase', 'lastFollowerCount'], (result) => {
  if (!result.followerDatabase) {
    console.error('❌ Aucune base de données trouvée');
    return;
  }
  
  const db = result.followerDatabase;
  const actualCount = Object.keys(db.followers).length;
  const storedTotalCount = db.totalCount;
  const cachedCount = result.lastFollowerCount || 0;
  
  console.log(`   Base de données totalCount: ${storedTotalCount}`);
  console.log(`   Nombre réel de followers en DB: ${actualCount}`);
  console.log(`   Cache lastFollowerCount: ${cachedCount}`);
  
  // Étape 3: Analyser la situation
  console.log('\n🔍 Étape 3: Analyse de la désynchronisation...');
  
  const dbVsActual = storedTotalCount - actualCount;
  const instagramVsActual = instagramCount - actualCount;
  const instagramVsStored = instagramCount - storedTotalCount;
  
  console.log(`   Différence DB totalCount vs réel: ${dbVsActual > 0 ? '+' : ''}${dbVsActual}`);
  console.log(`   Différence Instagram vs réel: ${instagramVsActual > 0 ? '+' : ''}${instagramVsActual}`);
  console.log(`   Différence Instagram vs DB: ${instagramVsStored > 0 ? '+' : ''}${instagramVsStored}`);
  
  // Étape 4: Déterminer la source de vérité
  console.log('\n🎯 Étape 4: Détermination de la source de vérité...');
  
  let correctCount = instagramCount;
  let reason = 'Compteur Instagram (source de vérité externe)';
  
  // Si Instagram et le nombre réel sont proches (±2), utiliser le nombre réel
  if (Math.abs(instagramVsActual) <= 2) {
    correctCount = actualCount;
    reason = 'Nombre réel en DB (proche d\'Instagram, plus fiable)';
  }
  
  console.log(`   Source choisie: ${correctCount} followers`);
  console.log(`   Raison: ${reason}`);
  
  // Étape 5: Appliquer les corrections
  console.log('\n🔧 Étape 5: Application des corrections...');
  
  let needsUpdate = false;
  
  // Correction 1: totalCount
  if (db.totalCount !== correctCount) {
    console.log(`   ✏️ Correction totalCount: ${db.totalCount} → ${correctCount}`);
    db.totalCount = correctCount;
    needsUpdate = true;
  } else {
    console.log(`   ✅ totalCount déjà correct: ${correctCount}`);
  }
  
  // Correction 2: Vérifier si on doit nettoyer ou ajouter des followers
  if (actualCount !== correctCount) {
    const diff = correctCount - actualCount;
    
    if (diff > 0) {
      console.log(`   ⚠️ Il manque ${diff} follower(s) dans la base`);
      console.log(`   💡 Recommandation: Lancer un scan pour capturer les followers manquants`);
    } else {
      console.log(`   ⚠️ Il y a ${Math.abs(diff)} follower(s) en trop dans la base`);
      console.log(`   💡 Recommandation: Lancer une détection d'unfollowers pour nettoyer`);
    }
  }
  
  // Sauvegarder les corrections
  if (needsUpdate) {
    chrome.storage.local.set({ 
      followerDatabase: db,
      lastFollowerCount: correctCount 
    }, () => {
      console.log('\n✅ RÉPARATION TERMINÉE!');
      console.log(`   💾 Base de données mise à jour`);
      console.log(`   📊 Nouveau compteur: ${correctCount} followers`);
      console.log('\n💡 Rechargez la page pour voir les changements');
      
      // Afficher un résumé
      console.log('\n📋 RÉSUMÉ:');
      console.log(`   Avant: totalCount = ${storedTotalCount}, réel = ${actualCount}`);
      console.log(`   Après: totalCount = ${correctCount}, réel = ${actualCount}`);
      console.log(`   Instagram: ${instagramCount} followers`);
    });
  } else {
    console.log('\n✅ Aucune correction nécessaire pour totalCount');
    console.log('   Mais il y a une différence entre le nombre réel et Instagram');
    console.log('\n💡 ACTIONS RECOMMANDÉES:');
    
    if (actualCount < instagramCount) {
      console.log(`   1. Ouvrir le modal followers sur Instagram`);
      console.log(`   2. Lancer un scan pour capturer les ${instagramCount - actualCount} followers manquants`);
    } else if (actualCount > instagramCount) {
      console.log(`   1. Lancer une détection d'unfollowers`);
      console.log(`   2. Nettoyer les ${actualCount - instagramCount} entrées en trop`);
    }
  }
});

console.log('\n⏳ Traitement en cours...');
