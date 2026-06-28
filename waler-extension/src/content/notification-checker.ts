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
      if (localStorage.getItem('unfollowerCheckState')) {
        console.log('🔕 [Notifications] Analyse unfollower en cours — navigation /notifications/ annulée');
        return [];
      }

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
   * Extraire les notifications de type "follow" de la page actuelle.
   * Utilise des regex sur le texte directement pour éviter les faux positifs DOM.
   */
  private async extractFollowNotifications(): Promise<NewFollowerNotification[]> {
    const followers: NewFollowerNotification[] = [];

    try {
      await this.sleep(2000);

      // Patterns précis : username DOIT être le premier mot suivi d'une phrase de follow
      const followPatterns = [
        /^([a-zA-Z0-9._]+)\s+started following you/i,
        /^([a-zA-Z0-9._]+)\s+a commencé à vous suivre/i,
        /^([a-zA-Z0-9._]+)\s+a commencé a vous suivre/i,
        /^([a-zA-Z0-9._]+)\s+s['']est abonné/i,
        /^([a-zA-Z0-9._]+)\s+follows you\b/i,
      ];
      const systemPages = new Set([
        'explore', 'reels', 'direct', 'p', 'stories', 'tv',
        'accounts', 'notifications', 'settings',
      ]);
      const foundUsernames = new Set<string>();

      // Chercher dans les éléments texte courts (< 250 chars = un seul item de notification)
      const candidates = Array.from(document.querySelectorAll('span, div, li, article, p'));
      for (const el of candidates) {
        const text = (el.textContent?.trim() || '');
        if (text.length < 5 || text.length > 250) continue;

        for (const pattern of followPatterns) {
          const match = text.match(pattern);
          if (!match) continue;

          const username = match[1];
          if (!username || systemPages.has(username) || foundUsernames.has(username)) break;

          // Parser le timestamp depuis l'élément <time> le plus proche
          const timeEl = el.querySelector('time') ?? el.parentElement?.querySelector('time');
          let timestamp = Date.now();
          if (timeEl) {
            const dt = timeEl.getAttribute('datetime');
            if (dt) timestamp = new Date(dt).getTime();
          } else {
            // Fallback : heure relative dans le texte
            const daysMatch = text.match(/(\d+)\s*[dj]\b/);
            const hoursMatch = text.match(/(\d+)\s*h\b/);
            const minsMatch = text.match(/(\d+)\s*min\b/);
            if (daysMatch) timestamp = Date.now() - parseInt(daysMatch[1]) * 86400_000;
            else if (hoursMatch) timestamp = Date.now() - parseInt(hoursMatch[1]) * 3600_000;
            else if (minsMatch) timestamp = Date.now() - parseInt(minsMatch[1]) * 60_000;
            else timestamp = 0; // date inconnue → considéré comme ancien
          }

          foundUsernames.add(username);
          followers.push({ username, timestamp, type: 'follow' });
          console.log(`📢 Found follow notification: @${username} (${timestamp > 0 ? new Date(timestamp).toLocaleString() : 'date inconnue'})`);
          break; // un seul username par élément
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
      if (localStorage.getItem('unfollowerCheckState')) {
        console.log('🔕 [Notifications] Analyse unfollower en cours — detectHiddenUnfollowers annulé');
        return { newFollowersFromNotifications: [], shouldCheckUnfollowers: false };
      }

      console.log('🔍 Checking for hidden unfollowers (new follower + unfollower = 0 change)...');
      
      // Récupérer les nouveaux followers depuis les notifications
      const notificationFollowers = await this.checkNewFollowersFromNotifications();
      
      // Fenêtre de récence : seulement les follows depuis la dernière vérification
      const stored = await chrome.storage.local.get('lastNotificationCheck');
      const lastCheck = (stored.lastNotificationCheck as number) || 0;
      // Si jamais vérifié → on accepte les 48 dernières heures max
      const recentThreshold = lastCheck > 0 ? lastCheck : (Date.now() - 48 * 60 * 60 * 1000);

      // Filtrer : pas dans la DB ET suivi après la dernière vérification
      const newFollowers = notificationFollowers
        .filter(nf => !localFollowerDatabase.followers[nf.username])
        .filter(nf => nf.timestamp > recentThreshold)
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
    if (localStorage.getItem('unfollowerCheckState')) {
      console.log('🔕 [AutoCheck] Analyse unfollower en cours — auto-check notifications ignoré');
      return;
    }

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
    if (localStorage.getItem('unfollowerCheckState')) {
      console.log('🔕 [StartAutoCheck] Analyse unfollower en cours — startAutoCheck ignoré');
      return;
    }

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
