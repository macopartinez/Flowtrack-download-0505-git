/**
 * Script de test pour vérifier les nouveaux followers via les notifications
 * Version AUTO : S'exécute automatiquement après les redirections
 * 
 * UTILISATION :
 * 1. Ouvrir Instagram (n'importe quelle page)
 * 2. Console (F12)
 * 3. Copier-coller ce script UNE SEULE FOIS
 * 4. Le script fait tout automatiquement !
 */

(function() {
  'use strict';
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Notification Checker AUTO - Démarrage...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Base de données simulée
  const mockDatabase = {
    followers: {
      'user1': { username: 'user1', addedAt: '2024-01-01' },
      'user2': { username: 'user2', addedAt: '2024-01-02' },
      'user3': { username: 'user3', addedAt: '2024-01-03' },
    }
  };
  
  // Vérifier si on est sur la page des notifications
  const currentUrl = window.location.href;
  const isOnNotifications = currentUrl.includes('/notifications/');
  
  console.log(`📍 URL actuelle : ${currentUrl}`);
  console.log(`📊 Sur /notifications/ : ${isOnNotifications ? 'OUI ✅' : 'NON ❌'}\n`);
  
  // Vérifier si on doit s'auto-exécuter
  const autoRun = localStorage.getItem('notificationCheckerAutoRun');
  
  if (!isOnNotifications) {
    console.log('⚠️  VOUS N\'ÊTES PAS SUR LA PAGE DES NOTIFICATIONS\n');
    
    // Sauvegarder l'URL actuelle pour y retourner après
    const returnUrl = currentUrl;
    localStorage.setItem('notificationCheckerReturnUrl', returnUrl);
    console.log(`💾 URL de retour sauvegardée : ${returnUrl}\n`);
    
    // Activer l'auto-exécution
    localStorage.setItem('notificationCheckerAutoRun', 'true');
    console.log('🤖 Mode auto-exécution activé\n');
    
    // Sauvegarder le script lui-même pour le réexécuter
    const scriptCode = '(' + arguments.callee.toString() + ')();';
    localStorage.setItem('notificationCheckerScript', scriptCode);
    
    console.log('🔄 Redirection automatique dans 3 secondes...\n');
    console.log('⚡ Le script se relancera AUTOMATIQUEMENT après la redirection !\n');
    
    let countdown = 3;
    const countdownInterval = setInterval(() => {
      console.log(`   Redirection dans ${countdown}...`);
      countdown--;
      
      if (countdown === 0) {
        clearInterval(countdownInterval);
        console.log('\n🔄 Redirection en cours...\n');
        
        // Injecter un script qui se réexécutera au chargement
        const injectionScript = `
          (function() {
            const autoRun = localStorage.getItem('notificationCheckerAutoRun');
            if (autoRun === 'true') {
              console.log('🤖 Auto-exécution détectée...');
              setTimeout(() => {
                const scriptCode = localStorage.getItem('notificationCheckerScript');
                if (scriptCode) {
                  console.log('🔄 Relancement automatique du script...\\n');
                  eval(scriptCode);
                }
              }, 1000);
            }
          })();
        `;
        
        // Créer un script tag qui s'exécutera après le chargement
        const script = document.createElement('script');
        script.textContent = injectionScript;
        document.head.appendChild(script);
        
        // Rediriger
        window.location.href = 'https://www.instagram.com/notifications/';
      }
    }, 1000);
    
    return;
  }
  
  // On est sur /notifications/
  if (autoRun === 'true') {
    console.log('✅ Auto-exécution confirmée !\n');
  }
  
  console.log('✅ Vous êtes sur la page des notifications !\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 ÉTAT INITIAL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('Base de données locale :');
  console.log(`   Followers enregistrés : ${Object.keys(mockDatabase.followers).length}`);
  console.log(`   Liste : ${Object.keys(mockDatabase.followers).join(', ')}\n`);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 EXTRACTION DES NOTIFICATIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('🔎 Recherche des éléments de notification...');
  
  // Attendre un peu que la page soit chargée
  setTimeout(() => {
    const notificationItems = document.querySelectorAll('[role="button"]');
    console.log(`✅ Trouvé ${notificationItems.length} éléments [role="button"]\n`);
    
    if (notificationItems.length === 0) {
      console.log('⚠️  Aucune notification trouvée !');
      console.log('   La page n\'est peut-être pas complètement chargée.');
      console.log('   Attendez quelques secondes et relancez le script.\n');
      return;
    }
    
    console.log('🔍 Analyse des notifications pour trouver les follows...\n');
    
    const followers = [];
    
    for (const item of Array.from(notificationItems)) {
      const text = item.textContent || '';
      
      // Détecter les notifications de follow
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
          
          // Extraire le timestamp
          const timeElement = item.querySelector('time');
          let timestamp = Date.now();
          let timeText = 'maintenant';
          
          if (timeElement) {
            const datetime = timeElement.getAttribute('datetime');
            if (datetime) {
              timestamp = new Date(datetime).getTime();
              timeText = new Date(timestamp).toLocaleString('fr-FR');
            }
          } else {
            // Parser le temps relatif
            if (text.includes('min')) {
              const minutes = parseInt(text.match(/(\d+)\s*min/)?.[1] || '0');
              timestamp = Date.now() - minutes * 60 * 1000;
              timeText = `Il y a ${minutes} min`;
            } else if (text.includes('h')) {
              const hours = parseInt(text.match(/(\d+)\s*h/)?.[1] || '0');
              timestamp = Date.now() - hours * 60 * 60 * 1000;
              timeText = `Il y a ${hours}h`;
            } else if (text.includes('j') || text.includes('d')) {
              const days = parseInt(text.match(/(\d+)\s*[jd]/)?.[1] || '0');
              timestamp = Date.now() - days * 24 * 60 * 60 * 1000;
              timeText = `Il y a ${days}j`;
            }
          }
          
          followers.push({
            username,
            timestamp,
            timeText
          });
          
          console.log(`   ✅ @${username} - ${timeText}`);
        }
      }
    }
    
    console.log(`\n   Total : ${followers.length} notifications de follow\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🆕 DÉTECTION DES NOUVEAUX FOLLOWERS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Filtrer les nouveaux followers
    const newFollowers = followers.filter(
      nf => !mockDatabase.followers[nf.username]
    );
    
    if (newFollowers.length === 0) {
      console.log('   ✅ Aucun nouveau follower détecté');
      console.log('   Tous les followers des notifications sont déjà dans la base\n');
    } else {
      console.log(`   ⚠️  ${newFollowers.length} nouveau(x) follower(s) détecté(s) :\n`);
      newFollowers.forEach(nf => {
        console.log(`      • @${nf.username} - ${nf.timeText}`);
      });
      console.log('');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔢 CALCUL DES UNFOLLOWERS CACHÉS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (newFollowers.length > 0) {
      // Demander le nombre actuel de followers
      const currentFollowerCount = parseInt(prompt('Entrez le nombre de followers actuel affiché sur votre profil:', '100'));
      
      const previousCount = Object.keys(mockDatabase.followers).length;
      const newFollowersCount = newFollowers.length;
      const expectedCount = previousCount + newFollowersCount;
      
      console.log(`   📊 Nombre précédent (base) : ${previousCount}`);
      console.log(`   🆕 Nouveaux followers (notifications) : ${newFollowersCount}`);
      console.log(`   📈 Nombre attendu : ${expectedCount} (${previousCount} + ${newFollowersCount})`);
      console.log(`   📱 Nombre actuel affiché : ${currentFollowerCount}\n`);
      
      if (currentFollowerCount < expectedCount) {
        const hiddenUnfollowers = expectedCount - currentFollowerCount;
        console.log(`   🚨 UNFOLLOWERS CACHÉS DÉTECTÉS !`);
        console.log(`   ❌ ${hiddenUnfollowers} personne(s) vous ont unfollow\n`);
        console.log(`   💡 Calcul : ${expectedCount} (attendu) - ${currentFollowerCount} (réel) = ${hiddenUnfollowers} unfollower(s)\n`);
        console.log(`   ➡️  Action recommandée : Lancer l'analyse des unfollowers\n`);
      } else if (currentFollowerCount === expectedCount) {
        console.log(`   ✅ Aucun unfollower caché`);
        console.log(`   Le nombre de followers correspond exactement à l'attendu\n`);
      } else {
        console.log(`   ⚠️  Anomalie détectée`);
        console.log(`   Le nombre actuel (${currentFollowerCount}) est supérieur à l'attendu (${expectedCount})`);
        console.log(`   Cela peut indiquer un problème de synchronisation\n`);
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 RÉSUMÉ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`   Notifications de follow trouvées : ${followers.length}`);
    console.log(`   Nouveaux followers détectés : ${newFollowers.length}`);
    console.log(`   Followers déjà enregistrés : ${followers.length - newFollowers.length}\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ANALYSE TERMINÉE AVEC SUCCÈS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Retourner à la page d'origine
    const returnUrl = localStorage.getItem('notificationCheckerReturnUrl');
    
    if (returnUrl) {
      console.log('🔙 Retour à la page d\'origine dans 3 secondes...\n');
      console.log(`   URL de retour : ${returnUrl}\n`);
      
      let countdown = 3;
      const countdownInterval = setInterval(() => {
        console.log(`   Retour dans ${countdown}...`);
        countdown--;
        
        if (countdown === 0) {
          clearInterval(countdownInterval);
          console.log('\n🔄 Redirection vers le profil...\n');
          
          // Nettoyer le localStorage
          localStorage.removeItem('notificationCheckerReturnUrl');
          localStorage.removeItem('notificationCheckerAutoRun');
          localStorage.removeItem('notificationCheckerScript');
          
          // Retourner à la page d'origine
          window.location.href = returnUrl;
        }
      }, 1000);
    } else {
      console.log('ℹ️  Aucune URL de retour trouvée. Restez sur cette page.\n');
      
      // Nettoyer quand même
      localStorage.removeItem('notificationCheckerAutoRun');
      localStorage.removeItem('notificationCheckerScript');
    }
    
  }, 2000); // Attendre 2 secondes que la page charge
  
})();

// Vérifier si on doit s'auto-exécuter au chargement de la page
(function checkAutoRun() {
  const autoRun = localStorage.getItem('notificationCheckerAutoRun');
  if (autoRun === 'true' && window.location.href.includes('/notifications/')) {
    console.log('🤖 Auto-exécution détectée au chargement de la page...\n');
  }
})();

console.log('✅ Script chargé');
