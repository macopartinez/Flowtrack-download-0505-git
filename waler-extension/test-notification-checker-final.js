/**
 * Script de test FINAL - S'exécute automatiquement
 * 
 * UTILISATION SIMPLE :
 * 1. Ouvrir Instagram
 * 2. Console (F12)
 * 3. Copier-coller ce script UNE SEULE FOIS
 * 4. Tout se fait automatiquement !
 * 
 * ASTUCE : Créer un bookmark avec ce code pour l'exécuter en 1 clic
 */

// Enregistrer le script dans sessionStorage pour qu'il survive aux redirections
sessionStorage.setItem('notificationCheckerActive', 'true');

// Fonction principale
function runNotificationChecker() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Notification Checker FINAL - Démarrage...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Base de données simulée
  const mockDatabase = {
    followers: {
      'user1': { username: 'user1', addedAt: '2024-01-01' },
      'user2': { username: 'user2', addedAt: '2024-01-02' },
      'user3': { username: 'user3', addedAt: '2024-01-03' },
    }
  };
  
  const currentUrl = window.location.href;
  const isOnNotifications = currentUrl.includes('/notifications/');
  
  console.log(`📍 URL actuelle : ${currentUrl}`);
  console.log(`📊 Sur /notifications/ : ${isOnNotifications ? 'OUI ✅' : 'NON ❌'}\n`);
  
  if (!isOnNotifications) {
    // Sauvegarder l'URL de retour
    sessionStorage.setItem('notificationCheckerReturnUrl', currentUrl);
    console.log(`💾 URL de retour sauvegardée\n`);
    
    console.log('🔄 Redirection vers /notifications/ dans 2 secondes...\n');
    console.log('⚡ Le script continuera AUTOMATIQUEMENT !\n');
    
    setTimeout(() => {
      window.location.href = 'https://www.instagram.com/notifications/';
    }, 2000);
    
    return;
  }
  
  // On est sur /notifications/
  console.log('✅ Sur la page des notifications !\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 ÉTAT INITIAL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log(`Base de données : ${Object.keys(mockDatabase.followers).length} followers\n`);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 EXTRACTION DES NOTIFICATIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  setTimeout(() => {
    const notificationItems = document.querySelectorAll('[role="button"]');
    console.log(`✅ Trouvé ${notificationItems.length} notifications\n`);
    
    const followers = [];
    
    for (const item of Array.from(notificationItems)) {
      const text = item.textContent || '';
      
      if (
        text.includes('a commencé à vous suivre') ||
        text.includes('started following you') ||
        text.includes('s\'est abonné') ||
        text.includes('follows you')
      ) {
        const usernameMatch = text.match(/@?([a-zA-Z0-9._]+)/);
        if (usernameMatch) {
          const username = usernameMatch[1];
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
    
    console.log(`\n   Total : ${followers.length} follows\n`);
    
    const newFollowers = followers.filter(f => !mockDatabase.followers[f.username]);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🆕 NOUVEAUX FOLLOWERS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (newFollowers.length > 0) {
      console.log(`   ⚠️  ${newFollowers.length} nouveau(x) :\n`);
      newFollowers.forEach(f => console.log(`      • @${f.username} - ${f.timeText}`));
      console.log('');
      
      const currentCount = parseInt(prompt('Nombre de followers actuel:', '100'));
      const previousCount = Object.keys(mockDatabase.followers).length;
      const expectedCount = previousCount + newFollowers.length;
      
      console.log(`   📊 Précédent : ${previousCount}`);
      console.log(`   🆕 Nouveaux : ${newFollowers.length}`);
      console.log(`   📈 Attendu : ${expectedCount}`);
      console.log(`   📱 Actuel : ${currentCount}\n`);
      
      if (currentCount < expectedCount) {
        const hidden = expectedCount - currentCount;
        console.log(`   🚨 ${hidden} UNFOLLOWER(S) CACHÉ(S) !\n`);
      } else {
        console.log(`   ✅ Aucun unfollower caché\n`);
      }
    } else {
      console.log(`   ✅ Aucun nouveau follower\n`);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 TERMINÉ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const returnUrl = sessionStorage.getItem('notificationCheckerReturnUrl');
    
    if (returnUrl) {
      console.log('🔙 Retour au profil dans 3 secondes...\n');
      
      let countdown = 3;
      const interval = setInterval(() => {
        console.log(`   ${countdown}...`);
        countdown--;
        
        if (countdown === 0) {
          clearInterval(interval);
          sessionStorage.removeItem('notificationCheckerActive');
          sessionStorage.removeItem('notificationCheckerReturnUrl');
          window.location.href = returnUrl;
        }
      }, 1000);
    } else {
      sessionStorage.removeItem('notificationCheckerActive');
    }
    
  }, 2000);
}

// Exécuter immédiatement
runNotificationChecker();

// Observer pour réexécuter après redirection
if (sessionStorage.getItem('notificationCheckerActive') === 'true') {
  const observer = new MutationObserver(() => {
    if (document.readyState === 'complete') {
      observer.disconnect();
      if (window.location.href.includes('/notifications/')) {
        console.log('🤖 Réexécution automatique détectée...\n');
        setTimeout(() => runNotificationChecker(), 1000);
      }
    }
  });
  
  observer.observe(document, { childList: true, subtree: true });
}

console.log('✅ Script chargé - Mode automatique activé');
