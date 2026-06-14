/**
 * Script de test pour vérifier le déroulement de la détection des nouveaux followers
 * À exécuter dans la console du navigateur sur Instagram
 */

console.log('🚀 Démarrage du test de vérification des nouveaux followers...\n');

// Simuler une base de données de followers
const mockFollowerDatabase = {
  followers: {
    'user1': { username: 'user1', addedAt: '2024-01-01' },
    'user2': { username: 'user2', addedAt: '2024-01-02' },
    'user3': { username: 'user3', addedAt: '2024-01-03' },
  },
  totalCount: 3,
  lastScanDate: '2024-01-03',
  isInitialized: true
};

// Fonction pour extraire les notifications de follow
async function extractFollowNotifications() {
  console.log('📋 Extraction des notifications de follow...\n');
  
  const followers = [];
  
  // Sélectionner tous les éléments de notification
  const notificationItems = document.querySelectorAll('[role="button"]');
  console.log(`   Trouvé ${notificationItems.length} notifications au total`);
  
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
          timeText,
          type: 'follow'
        });
        
        console.log(`   ✅ @${username} - ${timeText}`);
      }
    }
  }
  
  return followers;
}

// Fonction principale de test
async function testNotificationChecker() {
  // Vérifier si on revient d'une redirection
  const wasRedirected = localStorage.getItem('notificationCheckerRedirected');
  
  if (!wasRedirected) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 ÉTAT INITIAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('Base de données locale :');
    console.log(`   Nombre de followers enregistrés : ${Object.keys(mockFollowerDatabase.followers).length}`);
    console.log(`   Followers : ${Object.keys(mockFollowerDatabase.followers).join(', ')}\n`);
  }
  
  // Vérifier si on est sur la page des notifications
  const currentUrl = window.location.href;
  const isOnNotificationsPage = currentUrl.includes('/notifications/');
  
  if (!isOnNotificationsPage) {
    console.log('⚠️  Vous n\'êtes pas sur la page des notifications');
    console.log('   🔄 Redirection automatique vers les notifications...\n');
    
    // Marquer qu'on va rediriger
    localStorage.setItem('notificationCheckerRedirected', 'true');
    
    // Rediriger automatiquement vers la page des notifications
    window.location.href = 'https://www.instagram.com/notifications/';
    
    return;
  }
  
  // On est sur la page des notifications
  if (wasRedirected) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 ÉTAT INITIAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('Base de données locale :');
    console.log(`   Nombre de followers enregistrés : ${Object.keys(mockFollowerDatabase.followers).length}`);
    console.log(`   Followers : ${Object.keys(mockFollowerDatabase.followers).join(', ')}\n`);
    
    console.log('✅ Redirection réussie - Page des notifications chargée\n');
    
    // Nettoyer le flag
    localStorage.removeItem('notificationCheckerRedirected');
  } else {
    console.log('✅ Vous êtes déjà sur la page des notifications\n');
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 EXTRACTION DES NOTIFICATIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const notificationFollowers = await extractFollowNotifications();
  
  console.log(`\n   Total de notifications de follow trouvées : ${notificationFollowers.length}\n`);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🆕 DÉTECTION DES NOUVEAUX FOLLOWERS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Filtrer les nouveaux followers (pas dans la base)
  const newFollowers = notificationFollowers.filter(
    nf => !mockFollowerDatabase.followers[nf.username]
  );
  
  if (newFollowers.length === 0) {
    console.log('   ✅ Aucun nouveau follower détecté');
    console.log('   Tous les followers des notifications sont déjà dans la base\n');
  } else {
    console.log(`   ⚠️  ${newFollowers.length} nouveau(x) follower(s) détecté(s) :\n`);
    newFollowers.forEach(nf => {
      console.log(`      • @${nf.username} - ${nf.timeText}`);
    });
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔢 CALCUL DES UNFOLLOWERS CACHÉS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (newFollowers.length > 0) {
    // Simuler le nombre de followers actuel (à remplacer par la vraie valeur)
    const currentFollowerCount = parseInt(prompt('Entrez le nombre de followers actuel affiché sur votre profil:', '100'));
    
    const previousCount = Object.keys(mockFollowerDatabase.followers).length;
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
      console.log(`   ➡️  Action recommandée : Lancer l'analyse des unfollowers pour identifier qui\n`);
    } else if (currentFollowerCount === expectedCount) {
      console.log(`   ✅ Aucun unfollower caché`);
      console.log(`   Le nombre de followers correspond exactement à l'attendu\n`);
    } else {
      console.log(`   ⚠️  Anomalie détectée`);
      console.log(`   Le nombre actuel (${currentFollowerCount}) est supérieur à l'attendu (${expectedCount})`);
      console.log(`   Cela peut indiquer un problème de synchronisation\n`);
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 RÉSUMÉ');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log(`   Notifications de follow trouvées : ${notificationFollowers.length}`);
  console.log(`   Nouveaux followers détectés : ${newFollowers.length}`);
  console.log(`   Followers déjà enregistrés : ${notificationFollowers.length - newFollowers.length}\n`);
  
  console.log('✅ Test terminé !\n');
}

// Vérifier si on doit relancer le script après une redirection
if (localStorage.getItem('notificationCheckerRedirected') === 'true') {
  console.log('🔄 Script relancé automatiquement après redirection...\n');
  
  // Attendre que la page soit complètement chargée
  setTimeout(() => {
    testNotificationChecker().catch(error => {
      console.error('❌ Erreur lors du test :', error);
      localStorage.removeItem('notificationCheckerRedirected');
    });
  }, 2000);
} else {
  // Lancer le test normalement
  testNotificationChecker().catch(error => {
    console.error('❌ Erreur lors du test :', error);
  });
}
