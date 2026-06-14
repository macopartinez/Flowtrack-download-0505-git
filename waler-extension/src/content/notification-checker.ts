/**
 * Notification Checker - Vérifie les notifications Instagram pour détecter les nouveaux followers
 * Utile pour détecter les cas où : +1 follower et -1 unfollower = 0 changement apparent
 */

export interface NewFollowerNotification {
  username: string;
  timestamp: number;
  type: 'follow';
}

export class NotificationChecker {
  /**
   * Ouvrir la page des notifications et extraire les nouveaux followers
   */
  async checkNewFollowersFromNotifications(): Promise<NewFollowerNotification[]> {
    try {
      console.log('🔔 Opening notifications page...');
      
      // Naviguer vers la page des notifications
      const currentUrl = window.location.href;
      const isOnNotificationsPage = currentUrl.includes('/notifications/');
      
      if (!isOnNotificationsPage) {
        // Ouvrir les notifications via le bouton
        const notificationButton = document.querySelector('a[href*="/notifications/"]') as HTMLAnchorElement;
        if (notificationButton) {
          notificationButton.click();
          await this.sleep(3000); // Attendre que la page charge
        } else {
          // Naviguer directement
          window.location.href = 'https://www.instagram.com/notifications/';
          await this.sleep(3000);
        }
      }

      // Extraire les notifications de type "follow"
      const followers = await this.extractFollowNotifications();
      
      console.log(`✅ Found ${followers.length} new follower notifications`);
      
      // Retourner à la page d'origine si nécessaire
      if (!isOnNotificationsPage && currentUrl !== window.location.href) {
        window.location.href = currentUrl;
      }
      
      return followers;
      
    } catch (error) {
      console.error('Error checking notifications:', error);
      return [];
    }
  }

  /**
   * Extraire les notifications de type "follow" de la page actuelle
   */
  private async extractFollowNotifications(): Promise<NewFollowerNotification[]> {
    const followers: NewFollowerNotification[] = [];
    
    try {
      // Attendre que les notifications se chargent
      await this.sleep(2000);
      
      // Sélecteurs possibles pour les notifications de follow
      const notificationItems = document.querySelectorAll('[role="button"]');
      
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
            
            // Extraire le timestamp (si disponible)
            const timeElement = item.querySelector('time');
            let timestamp = Date.now();
            
            if (timeElement) {
              const datetime = timeElement.getAttribute('datetime');
              if (datetime) {
                timestamp = new Date(datetime).getTime();
              }
            } else {
              // Essayer de parser le texte de temps relatif
              if (text.includes('min')) {
                const minutes = parseInt(text.match(/(\d+)\s*min/)?.[1] || '0');
                timestamp = Date.now() - minutes * 60 * 1000;
              } else if (text.includes('h')) {
                const hours = parseInt(text.match(/(\d+)\s*h/)?.[1] || '0');
                timestamp = Date.now() - hours * 60 * 60 * 1000;
              } else if (text.includes('j') || text.includes('d')) {
                const days = parseInt(text.match(/(\d+)\s*[jd]/)?.[1] || '0');
                timestamp = Date.now() - days * 24 * 60 * 60 * 1000;
              }
            }
            
            followers.push({
              username,
              timestamp,
              type: 'follow'
            });
            
            console.log(`📢 Found follow notification: @${username} at ${new Date(timestamp).toLocaleString()}`);
          }
        }
      }
      
    } catch (error) {
      console.error('Error extracting follow notifications:', error);
    }
    
    return followers;
  }

  /**
   * Vérifier si des nouveaux followers ont été détectés dans les notifications
   * mais pas encore dans la base de données locale
   */
  async detectHiddenUnfollowers(localFollowerDatabase: any): Promise<{
    newFollowersFromNotifications: string[];
    shouldCheckUnfollowers: boolean;
  }> {
    try {
      console.log('🔍 Checking for hidden unfollowers (new follower + unfollower = 0 change)...');
      
      // Récupérer les nouveaux followers depuis les notifications
      const notificationFollowers = await this.checkNewFollowersFromNotifications();
      
      // Filtrer ceux qui ne sont pas encore dans la base locale
      const newFollowers = notificationFollowers
        .filter(nf => !localFollowerDatabase.followers[nf.username])
        .map(nf => nf.username);
      
      if (newFollowers.length > 0) {
        console.log(`⚠️ Found ${newFollowers.length} new followers in notifications but not in database!`);
        console.log('This suggests hidden unfollowers (new follower + unfollower = 0 net change)');
        
        return {
          newFollowersFromNotifications: newFollowers,
          shouldCheckUnfollowers: true
        };
      }
      
      console.log('✅ No hidden unfollowers detected');
      return {
        newFollowersFromNotifications: [],
        shouldCheckUnfollowers: false
      };
      
    } catch (error) {
      console.error('Error detecting hidden unfollowers:', error);
      return {
        newFollowersFromNotifications: [],
        shouldCheckUnfollowers: false
      };
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Auto-exécution : Vérifie automatiquement si on doit analyser les notifications
   * Cette fonction s'exécute automatiquement au chargement de la page
   */
  async autoCheckNotifications(): Promise<void> {
    console.log('🔍 [AutoCheck] Vérification de l\'état auto-check...');
    
    try {
      // Vérifier si on a un état en cours dans localStorage
      const stateStr = localStorage.getItem('notificationCheckerAutoState');
      
      console.log('🔍 [AutoCheck] État dans localStorage:', stateStr ? 'TROUVÉ' : 'AUCUN');
      
      if (stateStr) {
        const state = JSON.parse(stateStr);
        console.log('🤖 [AutoCheck] Auto-exécution détectée - Followers:', Object.keys(state.followers || {}).length);
        console.log('🔍 [AutoCheck] URL actuelle:', window.location.href);
        
        // On est sur /notifications/ après une redirection
        if (window.location.href.includes('/notifications/')) {
          console.log('✅ [AutoCheck] Sur /notifications/ - Lancement de l\'analyse...');
          
          // Attendre un peu que la page charge
          await this.sleep(3000);
          
          console.log('🔍 [AutoCheck] Début de l\'analyse des notifications...');
          // Reconstruire l'objet database
          const database = {
            followers: state.followers,
            isInitialized: state.isInitialized
          };
          const result = await this.detectHiddenUnfollowers(database);
          console.log('✅ [AutoCheck] Analyse terminée:', result);
          
          // Retourner à la page d'origine
          const returnUrl = state.returnUrl;
          if (returnUrl) {
            console.log(`🔙 [AutoCheck] Retour à ${returnUrl} dans 3 secondes...`);
            
            setTimeout(() => {
              console.log('🔄 [AutoCheck] Redirection vers:', returnUrl);
              localStorage.removeItem('notificationCheckerAutoState');
              window.location.href = returnUrl;
            }, 3000);
          } else {
            console.log('⚠️ [AutoCheck] Pas d\'URL de retour');
            localStorage.removeItem('notificationCheckerAutoState');
          }
        } else {
          console.log('⚠️ [AutoCheck] Pas sur /notifications/, URL:', window.location.href);
        }
      } else {
        console.log('ℹ️ [AutoCheck] Aucun état auto-check en cours');
      }
    } catch (error) {
      console.error('❌ [AutoCheck] Erreur lors de l\'auto-vérification:', error);
      localStorage.removeItem('notificationCheckerAutoState');
    }
  }

  /**
   * Démarrer une vérification automatique avec redirection
   */
  async startAutoCheck(database: any): Promise<void> {
    console.log('🚀 [StartAutoCheck] Démarrage de la vérification automatique...');
    const currentUrl = window.location.href;
    console.log('🔍 [StartAutoCheck] URL actuelle:', currentUrl);
    
    if (!currentUrl.includes('/notifications/')) {
      // Sauvegarder l'état pour l'auto-exécution
      // Ne sauvegarder que les données sérialisables
      const state = {
        followers: database.followers || {},
        isInitialized: database.isInitialized || false,
        returnUrl: currentUrl,
        timestamp: Date.now()
      };
      
      console.log('💾 [StartAutoCheck] Sauvegarde de l\'état (nombre de followers):', Object.keys(state.followers).length);
      
      try {
        const stateJson = JSON.stringify(state);
        localStorage.setItem('notificationCheckerAutoState', stateJson);
        console.log('✅ [StartAutoCheck] État sauvegardé dans localStorage');
      } catch (error) {
        console.error('❌ [StartAutoCheck] Erreur lors de la sauvegarde:', error);
        return;
      }
      
      // Vérifier que c'est bien sauvegardé
      const saved = localStorage.getItem('notificationCheckerAutoState');
      console.log('🔍 [StartAutoCheck] Vérification sauvegarde:', saved ? 'OK' : 'ÉCHEC');
      
      console.log('🔄 [StartAutoCheck] Redirection vers /notifications/ dans 1 seconde...');
      
      // Rediriger
      setTimeout(() => {
        console.log('🔄 [StartAutoCheck] Redirection maintenant...');
        window.location.href = 'https://www.instagram.com/notifications/';
      }, 1000);
    } else {
      console.log('ℹ️ [StartAutoCheck] Déjà sur /notifications/, analyse directe...');
      // Déjà sur /notifications/
      await this.detectHiddenUnfollowers(database);
    }
  }
}
