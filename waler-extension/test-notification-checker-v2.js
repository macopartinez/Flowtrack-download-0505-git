/**
 * Script de test pour vérifier les nouveaux followers via les notifications
 * Version 2 CORRIGÉE : Fonctionne automatiquement
 * 
 * UTILISATION :
 * 1. Ouvrir Instagram (n'importe quelle page)
 * 2. Ouvrir la console (F12)
 * 3. Copier-coller ce script UNE SEULE FOIS
 * 4. Attendre 3 secondes → Redirection automatique
 * 5. Après la redirection, COPIER-COLLER LE SCRIPT À NOUVEAU
 * 6. L'analyse se fait automatiquement !
 */

(function() {
  'use strict';
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Notification Checker v2 - Démarrage...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('🔍 Vérification de l\'état dans localStorage...');
  
  // Vérifier si on a un état en cours
  const stateStr = localStorage.getItem('notificationCheckerState');
  
  if (stateStr) {
    // On continue une analyse en cours
    console.log('✅ État trouvé dans localStorage\n');
    
    const state = JSON.parse(stateStr);
    console.log('📂 Détails de l\'état récupéré :');
    console.log(`   - Étape actuelle : ${state.step}`);
    console.log(`   - Heure de démarrage : ${new Date(state.startTime).toLocaleTimeString()}`);
    console.log(`   - URL actuelle : ${window.location.href}\n`);
    
    if (state.step === 'extract_notifications') {
      console.log('➡️  Passage à l\'extraction des notifications...\n');
      extractNotifications(state);
    } else if (state.step === 'analyze_results') {
      console.log('➡️  Passage à l\'analyse des résultats...\n');
      analyzeResults(state);
    } else {
      console.log('⚠️  Étape inconnue : ' + state.step);
      console.log('   Nettoyage de l\'état et redémarrage...\n');
      localStorage.removeItem('notificationCheckerState');
      startNewAnalysis();
    }
  } else {
    // Nouvelle analyse
    console.log('❌ Aucun état trouvé dans localStorage');
    console.log('➡️  Démarrage d\'une nouvelle analyse...\n');
    startNewAnalysis();
  }
  
  // ============================================================================
  // ÉTAPE 1 : Démarrer une nouvelle analyse
  // ============================================================================
  function startNewAnalysis() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 NOUVELLE ANALYSE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Base de données simulée (à remplacer par la vraie base)
    const mockDatabase = {
      followers: {
        'user1': { username: 'user1', addedAt: '2024-01-01' },
        'user2': { username: 'user2', addedAt: '2024-01-02' },
        'user3': { username: 'user3', addedAt: '2024-01-03' },
      }
    };
    
    console.log('Base de données locale :');
    console.log(`   Followers enregistrés : ${Object.keys(mockDatabase.followers).length}`);
    console.log(`   Liste : ${Object.keys(mockDatabase.followers).join(', ')}\n`);
    
    // Vérifier si on est déjà sur la page des notifications
    const currentUrl = window.location.href;
    const isOnNotifications = currentUrl.includes('/notifications/');
    
    if (isOnNotifications) {
      console.log('✅ Déjà sur la page des notifications\n');
      
      // Créer l'état et passer à l'extraction
      const state = {
        step: 'extract_notifications',
        database: mockDatabase,
        startTime: Date.now()
      };
      
      console.log('💾 Sauvegarde de l\'état dans localStorage...');
      localStorage.setItem('notificationCheckerState', JSON.stringify(state));
      console.log('✅ État sauvegardé\n');
      
      console.log('⏳ Attente de 2 secondes pour le chargement de la page...\n');
      // Attendre un peu que la page charge
      setTimeout(() => extractNotifications(state), 2000);
    } else {
      console.log('⚠️  Pas sur la page des notifications');
      console.log(`   URL actuelle : ${currentUrl}`);
      console.log('🔄 Redirection vers /notifications/...\n');
      
      // Sauvegarder l'URL de retour
      localStorage.setItem('notificationCheckerReturnUrl', currentUrl);
      console.log(`💾 URL de retour sauvegardée : ${currentUrl}\n`);
      
      // Sauvegarder l'état avant la redirection
      const state = {
        step: 'extract_notifications',
        database: mockDatabase,
        startTime: Date.now()
      };
      
      console.log('💾 Sauvegarde de l\'état dans localStorage avant redirection...');
      localStorage.setItem('notificationCheckerState', JSON.stringify(state));
      console.log('✅ État sauvegardé\n');
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚡ IMPORTANT - LISEZ ATTENTIVEMENT');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('🔄 Redirection vers /notifications/ dans 3 secondes...\n');
      console.log('📝 APRÈS LA REDIRECTION :');
      console.log('   1. Ouvrez la console (F12)');
      console.log('   2. RE-COPIEZ-COLLEZ CE MÊME SCRIPT');
      console.log('   3. Le script continuera automatiquement l\'analyse\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      let countdown = 3;
      const interval = setInterval(() => {
        console.log(`   Redirection dans ${countdown}...`);
        countdown--;
        
        if (countdown === 0) {
          clearInterval(interval);
          console.log('\n🔄 Redirection maintenant...\n');
          window.location.href = 'https://www.instagram.com/notifications/';
        }
      }, 1000);
    }
  }
  
  // ============================================================================
  // ÉTAPE 2 : Extraire les notifications
  // ============================================================================
  function extractNotifications(state) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 EXTRACTION DES NOTIFICATIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('🔎 Recherche des éléments de notification...');
    const followers = [];
    
    // Sélectionner tous les éléments de notification
    const notificationItems = document.querySelectorAll('[role="button"]');
    console.log(`✅ Trouvé ${notificationItems.length} éléments [role="button"]\n`);
    
    if (notificationItems.length === 0) {
      console.log('⚠️  Aucune notification trouvée !');
      console.log('   Vérifiez que vous êtes bien sur la page /notifications/');
      console.log('   URL actuelle : ' + window.location.href + '\n');
    }
    
    console.log('🔍 Analyse des notifications pour trouver les follows...\n');
    
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
    
    // Sauvegarder les résultats et passer à l'analyse
    state.step = 'analyze_results';
    state.notificationFollowers = followers;
    localStorage.setItem('notificationCheckerState', JSON.stringify(state));
    
    // Analyser immédiatement
    analyzeResults(state);
  }
  
  // ============================================================================
  // ÉTAPE 3 : Analyser les résultats
  // ============================================================================
  function analyzeResults(state) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🆕 DÉTECTION DES NOUVEAUX FOLLOWERS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const notificationFollowers = state.notificationFollowers || [];
    const database = state.database || { followers: {} };
    
    // Filtrer les nouveaux followers
    const newFollowers = notificationFollowers.filter(
      nf => !database.followers[nf.username]
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
      
      const previousCount = Object.keys(database.followers).length;
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
    
    console.log(`   Notifications de follow trouvées : ${notificationFollowers.length}`);
    console.log(`   Nouveaux followers détectés : ${newFollowers.length}`);
    console.log(`   Followers déjà enregistrés : ${notificationFollowers.length - newFollowers.length}\n`);
    
    const duration = ((Date.now() - state.startTime) / 1000).toFixed(1);
    console.log(`   ⏱️  Durée totale : ${duration}s\n`);
    
    console.log('✅ Analyse terminée !\n');
    
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
          localStorage.removeItem('notificationCheckerState');
          localStorage.removeItem('notificationCheckerReturnUrl');
          
          // Retourner à la page d'origine
          window.location.href = returnUrl;
        }
      }, 1000);
    } else {
      console.log('ℹ️  Aucune URL de retour trouvée.\n');
      
      // Nettoyer quand même
      localStorage.removeItem('notificationCheckerState');
    }
  }
  
})();

console.log('✅ Script chargé et exécuté');
