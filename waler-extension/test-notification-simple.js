/**
 * Script de test SIMPLE et FONCTIONNEL
 * 
 * UTILISATION :
 * 1. Allez MANUELLEMENT sur https://www.instagram.com/notifications/
 * 2. Ouvrez la console (F12)
 * 3. Copiez-collez ce script
 * 4. Résultats instantanés !
 */

(function() {
  'use strict';
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Notification Checker - Analyse des nouveaux followers');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Vérifier qu'on est bien sur /notifications/
  if (!window.location.href.includes('/notifications/')) {
    console.log('❌ ERREUR : Vous devez être sur la page /notifications/\n');
    console.log('➡️  Allez sur : https://www.instagram.com/notifications/');
    console.log('   Puis relancez ce script\n');
    return;
  }
  
  console.log('✅ Vous êtes sur la page des notifications\n');
  
  // Base de données simulée (remplacer par vos vraies données)
  const mockDatabase = {
    followers: {
      'user1': { username: 'user1', addedAt: '2024-01-01' },
      'user2': { username: 'user2', addedAt: '2024-01-02' },
      'user3': { username: 'user3', addedAt: '2024-01-03' },
    }
  };
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 BASE DE DONNÉES LOCALE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log(`   Followers enregistrés : ${Object.keys(mockDatabase.followers).length}`);
  console.log(`   Liste : ${Object.keys(mockDatabase.followers).join(', ')}\n`);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 EXTRACTION DES NOTIFICATIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('⏳ Attente du chargement de la page (2 secondes)...\n');
  
  setTimeout(() => {
    console.log('🔎 Recherche des notifications de follow...\n');
    
    const notificationItems = document.querySelectorAll('[role="button"]');
    console.log(`   Trouvé ${notificationItems.length} éléments au total\n`);
    
    if (notificationItems.length === 0) {
      console.log('⚠️  Aucune notification trouvée !');
      console.log('   Vérifiez que la page est bien chargée\n');
      return;
    }
    
    const followers = [];
    
    for (const item of Array.from(notificationItems)) {
      const text = item.textContent || '';
      
      // Détecter les notifications de follow (français et anglais)
      if (
        text.includes('a commencé à vous suivre') ||
        text.includes('started following you') ||
        text.includes('s\'est abonné') ||
        text.includes('follows you')
      ) {
        // Extraire le username
        const usernameMatch = text.match(/@?([a-zA-Z0-9._]+)/);
        if (usernameMatch) {
          const username = usernameMatch[1];
          
          // Extraire le temps
          let timeText = 'maintenant';
          
          if (text.includes('min')) {
            const min = parseInt(text.match(/(\d+)\s*min/)?.[1] || '0');
            timeText = `Il y a ${min} min`;
          } else if (text.includes('h')) {
            const h = parseInt(text.match(/(\d+)\s*h/)?.[1] || '0');
            timeText = `Il y a ${h}h`;
          } else if (text.includes('j') || text.includes('d')) {
            const d = parseInt(text.match(/(\d+)\s*[jd]/)?.[1] || '0');
            timeText = `Il y a ${d}j`;
          }
          
          followers.push({ username, timeText });
          console.log(`   ✅ @${username} - ${timeText}`);
        }
      }
    }
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 RÉSULTAT : ${followers.length} notification(s) de follow trouvée(s)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    // Filtrer les nouveaux followers
    const newFollowers = followers.filter(f => !mockDatabase.followers[f.username]);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🆕 NOUVEAUX FOLLOWERS (pas dans la base)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (newFollowers.length === 0) {
      console.log('   ✅ Aucun nouveau follower détecté');
      console.log('   Tous les followers des notifications sont déjà dans la base\n');
    } else {
      console.log(`   ⚠️  ${newFollowers.length} nouveau(x) follower(s) détecté(s) :\n`);
      newFollowers.forEach(f => {
        console.log(`      • @${f.username} - ${f.timeText}`);
      });
      console.log('');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔢 CALCUL DES UNFOLLOWERS CACHÉS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (newFollowers.length > 0) {
      console.log('📱 Entrez le nombre de followers actuel affiché sur votre profil\n');
      
      const currentCount = parseInt(prompt('Nombre de followers actuel:', '100'));
      
      if (isNaN(currentCount)) {
        console.log('❌ Nombre invalide. Analyse annulée.\n');
        return;
      }
      
      const previousCount = Object.keys(mockDatabase.followers).length;
      const newFollowersCount = newFollowers.length;
      const expectedCount = previousCount + newFollowersCount;
      
      console.log(`   📊 Nombre précédent (base de données) : ${previousCount}`);
      console.log(`   🆕 Nouveaux followers (notifications) : ${newFollowersCount}`);
      console.log(`   📈 Nombre attendu : ${expectedCount} (${previousCount} + ${newFollowersCount})`);
      console.log(`   📱 Nombre actuel (profil) : ${currentCount}\n`);
      
      if (currentCount < expectedCount) {
        const hiddenUnfollowers = expectedCount - currentCount;
        console.log(`   🚨 UNFOLLOWERS CACHÉS DÉTECTÉS !`);
        console.log(`   ❌ ${hiddenUnfollowers} personne(s) vous ont unfollow\n`);
        console.log(`   💡 Formule : ${expectedCount} (attendu) - ${currentCount} (actuel) = ${hiddenUnfollowers}\n`);
        console.log(`   ➡️  Recommandation : Lancer l'analyse complète des unfollowers\n`);
      } else if (currentCount === expectedCount) {
        console.log(`   ✅ Aucun unfollower caché détecté`);
        console.log(`   Le nombre de followers correspond exactement à l'attendu\n`);
      } else {
        console.log(`   ⚠️  Anomalie détectée`);
        console.log(`   Le nombre actuel (${currentCount}) est SUPÉRIEUR à l'attendu (${expectedCount})`);
        console.log(`   Différence : +${currentCount - expectedCount}`);
        console.log(`   Cela peut indiquer un problème de synchronisation de la base\n`);
      }
    } else {
      console.log('   ℹ️  Aucun nouveau follower détecté, pas de calcul nécessaire\n');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 RÉSUMÉ FINAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`   Total notifications de follow : ${followers.length}`);
    console.log(`   Nouveaux followers détectés : ${newFollowers.length}`);
    console.log(`   Déjà dans la base : ${followers.length - newFollowers.length}\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ANALYSE TERMINÉE AVEC SUCCÈS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  }, 2000);
  
})();

console.log('✅ Script chargé et en cours d\'exécution...\n');
