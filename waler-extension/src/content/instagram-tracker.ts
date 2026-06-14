// Using Chrome API
import { DOMObserver } from './dom-observer.js';
import { DataCollector } from './data-collector.js';
import { DMInterceptor, type DMMessage } from './dm-interceptor.js';
import { DMAnalyzer } from './dm-analyzer.js';
import { ScoringEngine, type Contact } from './scoring-engine.js';
import ScanOverlay from './scan-overlay.js';
import { InstagramAPIInterceptor } from './instagram-api-interceptor.js';
import { ActionRecorder } from './action-recorder.js';
import { InstagramModalScroller } from './instagram-modal-scroller.js';
import { FollowerExtractor } from './follower-extractor.js';
import { UnfollowerDetector } from './unfollower-detector.js';
import { NotificationChecker } from './notification-checker.js';

// Interfaces pour la base de données de followers
interface FollowerEntry {
  username: string;
  avatarUrl?: string;
  addedAt: string;
  position?: number;
}

interface FollowerDatabase {
  followers: { [username: string]: FollowerEntry };
  lastScanDate: string;
  totalCount: number;
  firstFollowerId: string;
  isInitialized: boolean;
}

class InstagramTracker {
  private observer: DOMObserver;
  private collector: DataCollector;
  private dmInterceptor: DMInterceptor;
  private dmAnalyzer: DMAnalyzer;
  private scoringEngine: ScoringEngine;
  private currentUsername: string | null = null;
  private dmSyncInterval: NodeJS.Timeout | null = null;
  private followersCache: Set<string> = new Set();
  private isInitialized = false;
  private lastProfileVisits: Map<string, number> = new Map();
  private readonly VISIT_DEBOUNCE_MS = 30000; // 30 secondes
  private followerCountObserver: MutationObserver | null = null;
  private lastFollowerCount: number = 0;
  private autoCheckInterval: NodeJS.Timeout | null = null;
  private lastUserActivity: number = Date.now();
  private readonly INACTIVITY_THRESHOLD = 2 * 60 * 1000; // 2 minutes
  
  // Nouvelles propriétés pour le système intelligent
  private followerDatabase: FollowerDatabase = {
    followers: {},
    lastScanDate: '',
    totalCount: 0,
    firstFollowerId: '',
    isInitialized: false
  };
  private isScanning: boolean = false;
  private scanProgress: { current: number; total: number } = { current: 0, total: 0 };
  private scanOverlay: ScanOverlay = new ScanOverlay();
  private apiInterceptor: InstagramAPIInterceptor = new InstagramAPIInterceptor();
  private recorder: ActionRecorder | null = null;
  private unfollowerDetector: UnfollowerDetector = new UnfollowerDetector();
  private notificationChecker: NotificationChecker = new NotificationChecker();

  constructor() {
    this.observer = new DOMObserver();
    this.collector = new DataCollector();
    this.dmInterceptor = new DMInterceptor();
    this.dmAnalyzer = new DMAnalyzer();
    this.scoringEngine = new ScoringEngine();
  }

  async init() {
    if (this.isInitialized) return;

    console.log('🔍 Waler Instagram Tracker initializing...');
    console.log('🆕 VERSION: API Interception Auto-Start v1.0');

    this.currentUsername = this.extractUsername();

    // Si le username n'est pas dans l'URL (page notifications, feed, etc.),
    // on peut quand même fonctionner si l'utilisateur est connecté (cookie ds_user_id).
    // Le vrai username sera résolu via l'API dans fetchRealFollowerCount().
    if (!this.currentUsername) {
      const loggedInId = this.getLoggedInUserId();
      if (!loggedInId) {
        console.log('❌ Could not detect Instagram username (utilisateur non connecté ?)');
        return;
      }
      console.log('ℹ️ Username non présent dans l\'URL, résolution via le compte connecté (ds_user_id)...');
      const resolvedCount = await this.fetchRealFollowerCount();
      console.log(`ℹ️ Compte connecté résolu: @${this.currentUsername} (${resolvedCount} followers)`);
      if (!this.currentUsername) {
        console.log('❌ Impossible de résoudre le compte connecté');
        return;
      }
    }

    console.log(`✅ Tracking account: @${this.currentUsername}`);

    // Indiquer au collector quel compte suivre (filtre l'interception API)
    this.collector.setTrackedUsername(this.currentUsername);

    // Nettoyer un éventuel état corrompu (ex. fausse détection de 29000 unfollowers)
    await this.cleanupCorruptedState();

    // Charger la base de données de followers
    await this.loadFollowerDatabase();

    // Démarrer l'interception API pour détecter automatiquement les changements
    console.log('🔌 Starting continuous API interception...');
    this.apiInterceptor.start(
      (followers) => {
        // Callback pour les followers (utilisé pendant le scan)
      },
      (data) => {
        // Callback pour les informations utilisateur
        this.collector.processUserInfo(data);
      }
    );

    // Vérifier si un scan initial est nécessaire
    console.log('🔍 Checking initialization status...');
    console.log('📊 followerDatabase.isInitialized:', this.followerDatabase.isInitialized);
    console.log('📊 Total followers in DB:', Object.keys(this.followerDatabase.followers).length);
    
    if (!this.followerDatabase.isInitialized) {
      console.log('📊 First launch detected, initial scan required');
      await this.notifyInitialScanRequired();
    } else {
      console.log('✅ Database already initialized, skipping initial scan');
    }

    await this.loadFollowersCache();

    // Vérifier automatiquement si une vérification d'unfollower est en cours
    await this.unfollowerDetector.checkCurrentPageForUnfollower();

    // Auto-vérification des notifications (si état en cours)
    // Attendre que la page soit complètement chargée
    if (document.readyState === 'complete') {
      await this.notificationChecker.autoCheckNotifications();
    } else {
      window.addEventListener('load', async () => {
        await this.notificationChecker.autoCheckNotifications();
      });
    }

    // Écouter les messages depuis la console pour déclencher l'Agent B
    window.addEventListener('message', async (event) => {
      if (event.data.type === 'TRIGGER_AGENT_B_FROM_PAGE') {
        console.log('🤖 Message reçu pour déclencher l\'Agent B:', event.data.data);
        await this.unfollowerDetector.triggerAgentB(event.data.data.missingUsernames);
      }
    });

    // Activer le recorder avec Ctrl+Alt+R
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.altKey && e.key === 'r') {
        e.preventDefault();
        if (!this.recorder) {
          console.log('🎬 Activation du Recorder Mode');
          this.recorder = new ActionRecorder();
        } else {
          console.log('⚠️ Recorder déjà actif');
        }
      }
    });

    this.observer.onProfileVisit((username) => {
      if (this.isSystemPage()) {
        console.log(`🚫 Ignoring system page`);
        return;
      }
      
      if (username === this.currentUsername) {
        console.log(`🚫 Ignoring self-visit: @${username}`);
        return;
      }
      
      const now = Date.now();
      const lastVisit = this.lastProfileVisits.get(username);
      
      if (!lastVisit || now - lastVisit > this.VISIT_DEBOUNCE_MS) {
        this.collector.trackProfileVisit(username);
        this.lastProfileVisits.set(username, now);
        console.log(`👤 Profile visit: @${username}`);
      } else {
        console.log(`⏭️ Skipping duplicate visit: @${username} (visited ${Math.floor((now - lastVisit) / 1000)}s ago)`);
      }
    });

    this.observer.onEngagement((engagement) => {
      if (this.isSystemPage() || this.isOnOwnProfile()) {
        console.log(`🚫 Ignoring engagement on system page or own profile`);
        return;
      }
      
      this.collector.trackEngagement(engagement);
    });

    this.observer.start();

    console.log('📊 DOM observation started');

    // Observer automatique pour détecter l'ouverture du modal followers
    this.setupFollowersModalObserver();

    // Start follower count monitoring (PRIORITAIRE - avant le DM sync)
    await this.startFollowerCountMonitoring();

    // Start DM sync
    this.startDMSync();

    // Track user activity
    this.trackUserActivity();

    this.isInitialized = true;
    console.log('✅ Waler Instagram Tracker ready');
  }

  private extractUsername(): string | null {
    const metaTag = document.querySelector('meta[property="al:ios:url"]');
    if (metaTag) {
      const content = metaTag.getAttribute('content');
      const match = content?.match(/instagram:\/\/user\?username=([^&]+)/);
      if (match) return match[1];
    }

    // Chemins réservés qui ne sont PAS des usernames de profil
    const RESERVED_PATHS = [
      'explore', 'reels', 'reel', 'direct', 'accounts', 'stories',
      'notifications', 'p', 'tv', 'about', 'legal', 'privacy',
      'developer', 'directory', 'web', 'session', 'emails', 'challenge',
      'lite', 'igtv', 'ar', 'topics',
    ];

    const pathMatch = window.location.pathname.match(/^\/([^\/]+)/);
    if (pathMatch && !RESERVED_PATHS.includes(pathMatch[1])) {
      return pathMatch[1];
    }

    return null;
  }

  private isSystemPage(): boolean {
    const path = window.location.pathname;
    const systemPages = ['/explore', '/reels', '/direct', '/accounts', '/stories'];
    return systemPages.some(page => path.startsWith(page));
  }

  private isOnOwnProfile(): boolean {
    const path = window.location.pathname;
    return path === `/${this.currentUsername}` || path === `/${this.currentUsername}/`;
  }

  private async loadFollowerDatabase() {
    try {
      console.log('📂 Loading follower database from storage...');
      const stored = await chrome.storage.local.get('followerDatabase');
      console.log('📂 Storage result:', stored);
      
      if (stored.followerDatabase) {
        this.followerDatabase = stored.followerDatabase;
        const actualCount = Object.keys(this.followerDatabase.followers).length;
        console.log(`📦 Loaded follower database: ${actualCount} followers`);
        console.log('📦 Database isInitialized:', this.followerDatabase.isInitialized);
        console.log('📦 Database totalCount:', this.followerDatabase.totalCount);
        
        // NOTE: Ne pas synchroniser totalCount avec actualCount car :
        // - actualCount = nombre d'entrées dans la DB historique (inclut les unfollowers)
        // - totalCount devrait être le nombre RÉEL de followers actuels
        // La synchronisation se fera via l'API interceptor qui détecte le vrai nombre
        
        console.log(`📊 Database entries: ${actualCount} (historique)`);
        console.log(`📊 Database totalCount: ${this.followerDatabase.totalCount}`);
        console.log(`ℹ️ Waiting for API to detect real follower count...`);
      } else {
        console.log('📦 No follower database found in storage (first use)');
      }
    } catch (error) {
      console.error('Error loading follower database:', error);
    }
  }

  private async updateFollowerCountToBackend(followerCount: number) {
    try {
      console.log(`📊 Sending follower count (${followerCount}) to backend...`);
      
      // Envoyer au service worker qui se chargera de l'envoi au backend
      chrome.runtime.sendMessage({
        type: 'UPDATE_USER_INFO',
        data: {
          username: this.currentUsername,
          followersCount: followerCount,
          followingCount: 0, // On mettra à jour plus tard si disponible
          postsCount: 0,
          bio: '',
          isPrivate: false,
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Error sending follower count:', chrome.runtime.lastError);
        } else if (response && response.success) {
          console.log('✅ Follower count sent successfully to backend');
        } else {
          console.warn('⚠️ Failed to send follower count:', response);
        }
      });
    } catch (error) {
      console.error('❌ Error updating follower count:', error);
    }
  }

  private async saveFollowerDatabase() {
    try {
      // NOTE: Ne PAS synchroniser totalCount avec le nombre d'entrées car :
      // - Nombre d'entrées = historique (inclut les unfollowers)
      // - totalCount = nombre réel de followers actuels (mis à jour par l'API)
      
      const entriesCount = Object.keys(this.followerDatabase.followers).length;
      
      await chrome.storage.local.set({ followerDatabase: this.followerDatabase });
      console.log(`💾 Follower database saved`);
      console.log(`   - Entries (historique): ${entriesCount}`);
      console.log(`   - totalCount (réel): ${this.followerDatabase.totalCount}`);
    } catch (error) {
      console.error('Error saving follower database:', error);
    }
  }

  private async loadFollowersCache() {
    try {
      const stored = await chrome.storage.local.get('followersCache');
      if (stored.followersCache) {
        this.followersCache = new Set(stored.followersCache);
        console.log(`📦 Loaded ${this.followersCache.size} followers from cache`);
      }
    } catch (error) {
      console.error('Error loading followers cache:', error);
    }
  }

  private async saveFollowersCache() {
    try {
      await chrome.storage.local.set({ followersCache: Array.from(this.followersCache) });
    } catch (error) {
      console.error('Error saving followers cache:', error);
    }
  }

  private async notifyInitialScanRequired() {
    try {
      await chrome.runtime.sendMessage({
        type: 'INITIAL_SCAN_REQUIRED'
      });
    } catch (error) {
      console.error('Error sending initial scan notification:', error);
    }
  }

  private async updateScanProgress(current: number, total: number) {
    this.scanProgress = { current, total };
    
    try {
      await chrome.runtime.sendMessage({
        type: 'SCAN_PROGRESS',
        current,
        total
      });
    } catch (error) {
      console.error('Error updating scan progress:', error);
    }
  }

  private async updateBadge(text: string) {
    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_BADGE',
        text
      });
    } catch (error) {
      console.error('Error updating badge:', error);
    }
  }

  /**
   * Start DM synchronization
   */
  private startDMSync() {
    // La fonctionnalité DM n'est pas encore implémentée (DMInterceptor est un stub).
    // On vérifie l'existence des méthodes pour ne pas planter l'initialisation.
    const interceptor = this.dmInterceptor as any;
    if (typeof interceptor.start !== 'function') {
      console.log('💬 DM interceptor non disponible (stub) - ignoré');
      return;
    }

    console.log('💬 Starting DM interceptor...');
    interceptor.start({});

    this.dmSyncInterval = setInterval(async () => {
      await this.syncDMs();
    }, 60000);

    console.log('💬 DM interceptor started');
  }

  private async syncDMs() {
    try {
      const interceptor = this.dmInterceptor as any;
      if (typeof interceptor.getConversations !== 'function') {
        return;
      }
      const conversations = interceptor.getConversations();
      
      if (conversations.length === 0) {
        console.log('💬 No DMs to sync');
        return;
      }

      const allMessages: any[] = [];
      
      conversations.forEach((conv: any) => {
        conv.messages.forEach((msg: any) => {
          allMessages.push({
            conversationId: conv.username,
            conversationWith: conv.username,
            messageId: `${conv.username}_${msg.timestamp}`,
            text: msg.text,
            timestamp: msg.timestamp,
            isSent: msg.isSent,
            mediaUrls: [],
            reactions: [],
            isRead: true
          });
        });
      });

      try {
        await chrome.runtime.sendMessage({
          type: 'SYNC_DMS',
          messages: allMessages,
          conversations: conversations.map(c => ({
            username: c.username,
            messageCount: c.messageCount,
            lastMessageAt: c.lastMessageAt
          }))
        });

        console.log(`💬 Synced ${allMessages.length} DMs from ${conversations.length} conversations`);
        await interceptor.saveConversations();
      } catch (msgError: any) {
        if (msgError.message?.includes('Extension context invalidated')) {
          console.log('⚠️ Extension reloaded, stopping DM sync');
          if (this.dmSyncInterval) {
            clearInterval(this.dmSyncInterval);
            this.dmSyncInterval = null;
          }
        } else {
          throw msgError;
        }
      }
    } catch (error) {
      console.error('Error syncing DMs:', error);
    }
  }

  /**
   * Track user activity for smart auto-check
   */
  private trackUserActivity() {
    const updateActivity = () => {
      this.lastUserActivity = Date.now();
    };

    document.addEventListener('mousemove', updateActivity);
    document.addEventListener('keydown', updateActivity);
    document.addEventListener('scroll', updateActivity);
    document.addEventListener('click', updateActivity);

    console.log('👤 User activity tracking enabled');
  }

  private isUserInactive(): boolean {
    return Date.now() - this.lastUserActivity > this.INACTIVITY_THRESHOLD;
  }

  /**
   * Nettoie un état corrompu provoqué par d'anciennes fausses détections
   * (ex. 29000 unfollowers issus du compteur d'un autre profil).
   */
  private async cleanupCorruptedState() {
    try {
      const ANOMALY_THRESHOLD = 1000;
      const stored = await chrome.storage.local.get(['unfollowerCount', 'unfollowerDetected', 'lastFollowerCount']);

      let cleaned = false;

      // Effacer une fausse détection d'unfollowers absurde
      if (typeof stored.unfollowerCount === 'number' && stored.unfollowerCount > ANOMALY_THRESHOLD) {
        await chrome.storage.local.remove(['unfollowerDetected', 'unfollowerCount', 'unfollowerDetectedAt']);
        console.warn(`🧹 Fausse détection nettoyée: ${stored.unfollowerCount} unfollowers (valeur absurde)`);
        cleaned = true;
      }

      // Réinitialiser un compteur de référence corrompu pour qu'il se resynchronise
      if (typeof stored.lastFollowerCount === 'number' && stored.lastFollowerCount > ANOMALY_THRESHOLD) {
        await chrome.storage.local.remove('lastFollowerCount');
        console.warn(`🧹 lastFollowerCount corrompu (${stored.lastFollowerCount}) réinitialisé`);
        cleaned = true;
      }

      if (cleaned) {
        // Effacer le badge erroné
        try {
          await chrome.runtime.sendMessage({ type: 'UPDATE_BADGE', text: '' });
        } catch (e) {
          // ignore
        }
      }
    } catch (error) {
      console.error('Error cleaning corrupted state:', error);
    }
  }

  private async startFollowerCountMonitoring() {
    this.autoCheckInterval = setInterval(() => {
      this.checkFollowerCountChange();
    }, 30000);

    await this.checkFollowerCountChange();
    console.log('👥 Automatic follower monitoring started');
  }

  /**
   * Récupère l'ID du compte CONNECTÉ depuis le cookie ds_user_id.
   * Ce cookie est lisible par le content script et identifie l'utilisateur
   * connecté, indépendamment du profil actuellement affiché.
   */
  private getLoggedInUserId(): string | null {
    const match = document.cookie.match(/ds_user_id=(\d+)/);
    return match ? match[1] : null;
  }

  private async fetchRealFollowerCount(): Promise<number | null> {
    // Méthode 1 (FIABLE) : infos du compte CONNECTÉ via son user id (cookie ds_user_id).
    // Indépendant du profil affiché → évite de capter le compteur d'autres profils.
    try {
      const userId = this.getLoggedInUserId();
      if (userId) {
        // Même origine (www) pour éviter le blocage CORS depuis le content script
        const response = await fetch(`https://www.instagram.com/api/v1/users/${userId}/info/`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'x-ig-app-id': '936619743392459',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const user = data?.user;
          const count = user?.follower_count;
          if (typeof count === 'number') {
            // Corriger le username suivi si nécessaire
            if (user?.username && user.username !== this.currentUsername) {
              this.currentUsername = user.username;
              this.collector.setTrackedUsername(user.username);
            }
            return count;
          }
        } else {
          console.log(`⚠️ [API] users/${userId}/info a répondu ${response.status}`);
        }
      }
    } catch (error) {
      console.log('⚠️ [API] Echec récupération via ds_user_id:', error);
    }

    // Méthode 2 (fallback) : web_profile_info via le username suivi
    try {
      if (!this.currentUsername) return null;

      const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(this.currentUsername)}`;
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'x-ig-app-id': '936619743392459',
          'x-requested-with': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        console.log(`⚠️ [API] web_profile_info a répondu ${response.status}`);
        return null;
      }

      const data = await response.json();
      const count = data?.data?.user?.edge_followed_by?.count;
      return typeof count === 'number' ? count : null;
    } catch (error) {
      console.log('⚠️ [API] Impossible de récupérer le nombre de followers via l\'API:', error);
      return null;
    }
  }

  /**
   * Lit le nombre de followers depuis le DOM (fallback si l'API échoue).
   */
  private getFollowerCountFromDOM(): number | null {
    const path = window.location.pathname;
    if (path !== `/${this.currentUsername}` && path !== `/${this.currentUsername}/`) {
      return null;
    }

    let followerCountElement: Element | null | undefined =
      document.querySelector('a[href*="/followers/"] span') ||
      document.querySelector('a[href$="/followers/"] span');

    if (!followerCountElement) {
      const spans = Array.from(document.querySelectorAll('span'));
      followerCountElement = spans.find(el => {
        const text = el.textContent?.trim() || '';
        return text.includes('follower') && /\d/.test(text);
      });
    }

    if (!followerCountElement) {
      const headerLinks = Array.from(document.querySelectorAll('header section ul li a'));
      for (const link of headerLinks) {
        if (link.getAttribute('href')?.includes('followers')) {
          followerCountElement = link.querySelector('span');
          break;
        }
      }
    }

    if (!followerCountElement) {
      return null;
    }

    const countText = followerCountElement.textContent?.trim() || '0';
    return this.parseFollowerCount(countText);
  }

  private async checkFollowerCountChange() {
    try {
      // Vérifier si le contexte de l'extension est toujours valide
      if (!chrome.runtime?.id) {
        console.log('⚠️ Extension context invalidated, stopping monitoring');
        if (this.autoCheckInterval) {
          clearInterval(this.autoCheckInterval);
        }
        return;
      }

      // 1. Source principale : l'API Instagram (fiable, fonctionne partout)
      let count = await this.fetchRealFollowerCount();
      let source = 'API';

      // 2. Fallback : le DOM (uniquement si on est sur le profil)
      if (count === null) {
        count = this.getFollowerCountFromDOM();
        source = 'DOM';
      }

      if (count === null) {
        console.log('⚠️ Impossible de déterminer le nombre de followers (API + DOM échoués)');
        return;
      }

      const stored = await chrome.storage.local.get('lastFollowerCount');
      const lastCount = stored.lastFollowerCount || 0;

      console.log(`🔍 [${source}] Checking: current=${count}, last=${lastCount}, diff=${count - lastCount}`);

      if (lastCount === 0) {
        await chrome.storage.local.set({ lastFollowerCount: count });
        this.lastFollowerCount = count;
        console.log(`📊 [${source}] Initial follower count: ${count}`);

        // Mettre à jour aussi totalCount et envoyer au backend
        if (this.followerDatabase.isInitialized) {
          this.followerDatabase.totalCount = count;
          await this.saveFollowerDatabase();
          console.log(`💾 [${source}] Updated totalCount to ${count}`);

          // Envoyer au backend
          await this.updateFollowerCountToBackend(count);
        }
        return;
      }

      if (count !== lastCount) {
        const diff = count - lastCount;

        // GARDE-FOU : un vrai changement entre deux vérifications (30s) est petit.
        // Un écart énorme signifie une donnée corrompue (ex. compteur d'un autre
        // profil capté par erreur). On resynchronise SANS déclencher de notification.
        const ANOMALY_THRESHOLD = 1000;
        if (Math.abs(diff) > ANOMALY_THRESHOLD) {
          console.warn(`⚠️ [${source}] Écart anormal détecté (${lastCount} → ${count}, diff=${diff}). Resynchronisation sans notification.`);
          await chrome.storage.local.set({ lastFollowerCount: count });
          this.lastFollowerCount = count;
          if (this.followerDatabase.isInitialized) {
            this.followerDatabase.totalCount = count;
            await this.saveFollowerDatabase();
            await this.updateFollowerCountToBackend(count);
          }
          return;
        }

        console.log(`🔔 [${source}] Follower count changed: ${lastCount} → ${count} (${diff > 0 ? '+' : ''}${diff})`);

        await chrome.storage.local.set({ lastFollowerCount: count });
        this.lastFollowerCount = count;

        // Mettre à jour totalCount et le backend avec le nombre réel
        if (this.followerDatabase.isInitialized) {
          this.followerDatabase.totalCount = count;
          await this.saveFollowerDatabase();
          await this.updateFollowerCountToBackend(count);
        }

        if (diff > 0) {
          await this.handleNewFollowers(diff);
        } else {
          await this.handleUnfollowers(Math.abs(diff));
        }
      } else {
        // Pas de changement apparent, mais vérifier les notifications
        // pour détecter les cas : +1 nouveau follower -1 unfollower = 0
        await this.checkForHiddenUnfollowers();
      }
    } catch (error) {
      console.error('Error checking follower count:', error);
    }
  }

  private parseFollowerCount(text: string): number {
    const cleaned = text.replace(/,/g, '').replace(/\s/g, '');
    
    if (cleaned.includes('K')) {
      return Math.floor(parseFloat(cleaned) * 1000);
    } else if (cleaned.includes('M')) {
      return Math.floor(parseFloat(cleaned) * 1000000);
    }
    
    return parseInt(cleaned) || 0;
  }

  /**
   * Handle new followers (scan intelligent avec estimation)
   */
  private async handleNewFollowers(diff: number) {
    console.log(`🆕 ${diff} new follower(s) detected`);

    try {
      await chrome.runtime.sendMessage({
        type: 'FOLLOWER_CHANGE_DETECTED',
        count: diff,
        changeType: 'follower'
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }

    if (this.isUserInactive()) {
      console.log(`🤖 User inactive, starting smart scan for ${diff} new followers...`);
      await this.updateBadge('🔍');
      setTimeout(() => {
        this.scanNewFollowersIntelligent(diff);
      }, 1000);
    } else {
      console.log(`👤 User active, notification sent`);
      try {
        await this.updateBadge(`+${diff}`);
      } catch (error) {
        console.error('Error updating badge:', error);
      }
    }
  }

  /**
   * Handle unfollowers - Envoie une notification pour analyse manuelle
   */
  private async handleUnfollowers(diff: number) {
    console.log(`🚫 ${diff} unfollower(s) detected`);

    try {
      // Envoyer la notification au service worker
      await chrome.runtime.sendMessage({
        type: 'FOLLOWER_CHANGE_DETECTED',
        count: diff,
        changeType: 'unfollower'
      });

      // Stocker la baisse pour affichage dans le popup
      await chrome.storage.local.set({
        unfollowerDetected: true,
        unfollowerCount: diff,
        unfollowerDetectedAt: Date.now(),
      });

      // Mettre à jour le badge
      await this.updateBadge(`-${diff}`);

      console.log(`📢 Unfollower notification sent to popup`);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Vérifier les notifications pour détecter les unfollowers cachés
   * Logique : Si nouveaux followers dans notifications mais nombre total n'augmente pas assez → unfollowers cachés
   */
  private async checkForHiddenUnfollowers() {
    try {
      // Vérifier seulement toutes les 5 minutes pour éviter trop de requêtes
      const stored = await chrome.storage.local.get('lastNotificationCheck');
      const lastCheck = stored.lastNotificationCheck || 0;
      const now = Date.now();
      
      if (now - lastCheck < 5 * 60 * 1000) {
        return; // Moins de 5 minutes depuis la dernière vérification
      }
      
      console.log('🔍 Checking notifications for hidden unfollowers...');
      
      const result = await this.notificationChecker.detectHiddenUnfollowers(this.followerDatabase);
      
      if (result.newFollowersFromNotifications.length > 0) {
        const newFollowersCount = result.newFollowersFromNotifications.length;
        console.log(`📢 Found ${newFollowersCount} new follower(s) in notifications`);
        
        // Ajouter les nouveaux followers à la base de données
        for (const username of result.newFollowersFromNotifications) {
          this.followerDatabase.followers[username] = {
            username,
            addedAt: new Date().toISOString(),
            position: Object.keys(this.followerDatabase.followers).length + 1
          };
        }
        
        // Synchroniser totalCount avec le nombre réel de followers
        this.followerDatabase.totalCount = Object.keys(this.followerDatabase.followers).length;
        
        // Calculer le nombre attendu vs le nombre réel
        const currentCount = this.lastFollowerCount; // Nombre actuel affiché
        const previousCount = this.followerDatabase.totalCount - newFollowersCount; // Nombre avant les nouveaux
        const expectedCount = previousCount + newFollowersCount; // Nombre attendu après les nouveaux
        
        console.log(`📊 Previous: ${previousCount}, New followers: ${newFollowersCount}, Expected: ${expectedCount}, Current: ${currentCount}`);
        
        if (currentCount < expectedCount) {
          // Il manque des followers → Unfollowers cachés détectés !
          const hiddenUnfollowers = expectedCount - currentCount;
          console.log(`⚠️ HIDDEN UNFOLLOWERS DETECTED! Expected ${expectedCount} but got ${currentCount} → ${hiddenUnfollowers} unfollower(s)`);
          
          // Sauvegarder la base mise à jour
          await chrome.storage.local.set({ followerDatabase: this.followerDatabase });
          
          // Déclencher l'analyse des unfollowers
          console.log('🚀 Triggering unfollower analysis due to hidden unfollowers...');
          await this.handleUnfollowers(hiddenUnfollowers);
        } else {
          // Tout est normal, juste des nouveaux followers
          console.log('✅ No hidden unfollowers, just new followers');
          
          // Sauvegarder la base mise à jour
          await chrome.storage.local.set({ followerDatabase: this.followerDatabase });
          
          // Traiter comme de nouveaux followers normaux
          await this.handleNewFollowers(newFollowersCount);
        }
      }
      
      // Mettre à jour le timestamp de la dernière vérification
      await chrome.storage.local.set({ lastNotificationCheck: now });
      
    } catch (error) {
      console.error('Error checking for hidden unfollowers:', error);
    }
  }

  /**
   * Lance l'analyse complète des unfollowers (appelé depuis le popup)
   */
  async startUnfollowerAnalysis() {
    if (this.unfollowerDetector.isAnalysisRunning()) {
      console.log('⏳ Unfollower analysis already in progress');
      return;
    }

    try {
      console.log('🎬 Starting unfollower analysis...');
      this.scanOverlay.show('Analyse des unfollowers en cours...');

      // Lancer l'analyse
      const result = await this.unfollowerDetector.analyzeUnfollowers(this.currentUsername!);

      // Afficher les résultats
      this.scanOverlay.showSuccess(
        `Analyse terminée!\n` +
        `Unfollows: ${result.unfollowed.length}\n` +
        `Blocages: ${result.blocked.length}\n` +
        `Vérification Google: ${result.notFoundOnInstagram.length}`
      );

      // Réinitialiser le flag
      await chrome.storage.local.set({
        unfollowerDetected: false,
        unfollowerCount: 0,
      });

      console.log('✅ Unfollower analysis completed');
    } catch (error) {
      console.error('Error during unfollower analysis:', error);
      this.scanOverlay.showError('Erreur lors de l\'analyse des unfollowers');
    }
  }

  /**
   * SCAN INITIAL PROGRESSIF PAR PORTIONS
   */
  async performInitialScan() {
    if (this.isScanning) {
      console.log('⏳ Scan already in progress');
      return;
    }

    this.isScanning = true;
    console.log('🎬 Starting initial follower scan...');
    await this.updateBadge('⏳');
    this.scanOverlay.show('Scan initial en cours...');

    try {
      // Aller sur le profil
      if (!this.isOnOwnProfile()) {
        window.location.href = `/${this.currentUsername}`;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Vérifier si la modal est déjà ouverte
      let modal = document.querySelector('[role="dialog"]');
      
      if (!modal) {
        console.log('⏳ Modal not open, trying to open it...');
        this.scanOverlay.updateProgress(0, 100, 'Ouverture de la modal followers...');
        
        // Attendre que la page soit complètement chargée
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Chercher le lien followers
        let followersLink: HTMLAnchorElement | null = null;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (!followersLink && attempts < maxAttempts) {
          followersLink = document.querySelector(`a[href="/${this.currentUsername}/followers/"]`) as HTMLAnchorElement;
          
          if (!followersLink) {
            followersLink = document.querySelector(`a[href*="/followers/"]`) as HTMLAnchorElement;
          }
          
          if (!followersLink) {
            const links = Array.from(document.querySelectorAll('a'));
            followersLink = links.find(link => link.href.includes('/followers/')) as HTMLAnchorElement;
          }
          
          if (!followersLink) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        if (!followersLink) {
          console.error('❌ Followers link not found');
          this.scanOverlay.showError('Veuillez ouvrir manuellement la modal followers et relancer le scan');
          this.isScanning = false;
          return;
        }
        
        console.log('✅ Followers link found:', followersLink.href);
        followersLink.click();
        await new Promise(resolve => setTimeout(resolve, 2000));

        modal = document.querySelector('[role="dialog"]');
        if (!modal) {
          console.log('❌ Followers modal not found after click');
          this.scanOverlay.showError('Veuillez ouvrir manuellement la modal followers et relancer le scan');
          this.isScanning = false;
          return;
        }
      } else {
        console.log('✅ Followers modal already open!');
      }

      // Chercher le container scrollable (comme Playwright)
      // Essayer plusieurs stratégies
      let scrollContainer: HTMLElement | null = null;
      
      // Stratégie 1: Chercher un div avec overflow dans la modal
      const divs = modal.querySelectorAll('div');
      for (const div of Array.from(divs)) {
        const style = window.getComputedStyle(div);
        if ((style.overflow === 'auto' || style.overflow === 'scroll' || 
             style.overflowY === 'auto' || style.overflowY === 'scroll')) {
          scrollContainer = div as HTMLElement;
          console.log('✅ Found scrollable div with overflow');
          break;
        }
      }
      
      // Stratégie 2: Si pas trouvé, utiliser la modal elle-même
      if (!scrollContainer) {
        scrollContainer = modal as HTMLElement;
        console.log('⚠️ Using modal itself as scroll container');
      }
      
      console.log(`📏 Scroll container: scrollHeight=${scrollContainer.scrollHeight}, clientHeight=${scrollContainer.clientHeight}`);

      // Parser le nombre total de followers depuis plusieurs sources
      let totalFollowers = 0;
      
      // Stratégie 1: Depuis le titre de la modal
      const modalTitle = modal.querySelector('h1, div[role="dialog"] span');
      if (modalTitle) {
        const titleText = modalTitle.textContent || '';
        console.log(`📊 Modal title: "${titleText}"`);
        const match = titleText.match(/(\d+[\d,\.]*[KkMm]?)\s*(follower|abonné)/i);
        if (match) {
          totalFollowers = this.parseFollowerCount(match[1]);
          console.log(`✅ Parsed ${totalFollowers} followers from modal title`);
        }
      }
      
      // Stratégie 2: Depuis la page de profil (lien "X followers")
      if (totalFollowers === 0) {
        const profileFollowerLink = document.querySelector('a[href*="/followers/"]');
        if (profileFollowerLink) {
          const linkText = profileFollowerLink.textContent || '';
          console.log(`📊 Profile link text: "${linkText}"`);
          const match = linkText.match(/(\d+[\d,\.]*[KkMm]?)\s*(follower|abonné)/i);
          if (match) {
            totalFollowers = this.parseFollowerCount(match[1]);
            console.log(`✅ Parsed ${totalFollowers} followers from profile link`);
          }
        }
      }
      
      // Stratégie 3: Utiliser lastFollowerCount
      if (totalFollowers === 0 && this.lastFollowerCount > 0) {
        totalFollowers = this.lastFollowerCount;
        console.log(`✅ Using cached count: ${totalFollowers}`);
      }
      
      // Fallback final
      if (totalFollowers === 0) {
        totalFollowers = 100;
        console.log(`⚠️ Using fallback count: ${totalFollowers}`);
      }
      
      const portionSize = 100;
      const maxPortions = totalFollowers < 100 ? 1 : totalFollowers < 500 ? 5 : 10;
      
      console.log(`📊 Total followers: ${totalFollowers}, scanning in ${maxPortions} portions`);

      let scannedFollowers = new Set<string>();
      let lastCount = 0;
      let stableCount = 0;
      const maxStableChecks = 5; // Arrêter après 5 vérifications sans changement

      console.log('🔄 Starting API-based follower collection...');

      // Démarrer l'interception API
      let apiFollowers: string[] = [];
      this.apiInterceptor.start((followers) => {
        apiFollowers = followers;
        console.log(`📡 API intercepted ${followers.length} followers`);
      });

      // Fonction pour collecter les followers visibles
      const collectVisibleFollowers = () => {
        const links = modal.querySelectorAll('a[href^="/"]');
        for (const link of Array.from(links)) {
          const href = link.getAttribute('href');
          if (href) {
            const usernameMatch = href.match(/^\/([a-zA-Z0-9._]+)\/?(\?.*)?$/);
            if (usernameMatch) {
              const username = usernameMatch[1];
              const systemPages = ['explore', 'reels', 'direct', 'p', 'stories', 'tv', 'accounts'];
              if (!systemPages.includes(username) && !scannedFollowers.has(username)) {
                scannedFollowers.add(username);
              }
            }
          }
        }
      };

      // Pattern de scroll adaptatif et randomisé (basé sur Waler Recorder)
      // S'adapte au nombre de followers et ajoute de la variation naturelle
      
      // Calculer le scroll optimal en fonction du nombre de followers
      let baseScrollPx = 9; // Pattern de base enregistré
      let baseDelayMs = 58;
      
      if (totalFollowers > 1000) {
        // Énormément de followers : scroll encore plus rapide
        baseScrollPx = 50;
        baseDelayMs = 100;
      } else if (totalFollowers > 500) {
        // Beaucoup de followers : scroll plus rapide
        baseScrollPx = 25;
        baseDelayMs = 80;
      }
      
      console.log(`🚀 Starting adaptive scroll (${baseScrollPx}px/${baseDelayMs}ms for ${totalFollowers} followers)...`);
      
      while (stableCount < maxStableChecks) {
        // Collecter les followers visibles
        collectVisibleFollowers();
        
        const currentCount = scannedFollowers.size;
        const newFound = currentCount - lastCount;
        
        // Log toutes les 50 itérations pour ne pas spammer
        if (currentCount % 50 === 0 && currentCount !== lastCount) {
          console.log(`📊 Followers: ${currentCount}/${totalFollowers}`);
          await this.updateScanProgress(currentCount, totalFollowers);
          this.scanOverlay.updateProgress(currentCount, totalFollowers, `${currentCount}/${totalFollowers} followers`);
        }

        // Vérifier si on a tout chargé
        if (currentCount >= totalFollowers) {
          console.log('✅ All expected followers loaded!');
          break;
        }
        
        // Vérifier la stabilité
        if (currentCount === lastCount) {
          stableCount++;
        } else {
          stableCount = 0;
          lastCount = currentCount;
        }

        // Scroll avec variation naturelle (±30% du pattern de base)
        // Exemple : si base = 9px, variation entre 6.3px et 11.7px
        const scrollVariation = baseScrollPx * (0.7 + Math.random() * 0.6);
        scrollContainer.scrollTop += Math.round(scrollVariation);
        
        // Délai avec variation naturelle (±40% du délai de base)
        // Exemple : si base = 58ms, variation entre 34.8ms et 81.2ms
        const delayVariation = baseDelayMs * (0.6 + Math.random() * 0.8);
        await new Promise(resolve => setTimeout(resolve, Math.round(delayVariation)));
        
        // Pause aléatoire occasionnelle (simule l'hésitation humaine)
        if (Math.random() < 0.05) { // 5% de chance
          const pauseDuration = 200 + Math.random() * 500; // 200-700ms
          await new Promise(resolve => setTimeout(resolve, pauseDuration));
        }
      }

      console.log(`✅ Scroll complete: ${scannedFollowers.size} followers collected from DOM`);

      // Arrêter l'interception API
      this.apiInterceptor.stop();
      
      // Combiner les followers du DOM et de l'API
      apiFollowers.forEach(username => scannedFollowers.add(username));
      
      console.log(`✅ Initial scan complete: ${scannedFollowers.size} followers loaded (DOM + API)`);

      // Sauvegarder dans la base
      this.followerDatabase.followers = {};
      const followersArray = Array.from(scannedFollowers);
      const firstFollower = followersArray[0];
      
      followersArray.forEach((username, index) => {
        this.followerDatabase.followers[username] = {
          username,
          addedAt: new Date().toISOString(),
          position: index
        };
      });

      this.followerDatabase.totalCount = scannedFollowers.size;
      this.followerDatabase.firstFollowerId = firstFollower;
      this.followerDatabase.lastScanDate = new Date().toISOString();
      this.followerDatabase.isInitialized = true;

      await this.saveFollowerDatabase();

      // Fermer la modal
      const closeButton = modal.querySelector('button[aria-label="Close"], button[aria-label="Fermer"]');
      if (closeButton) {
        (closeButton as HTMLButtonElement).click();
      }

      await this.updateBadge('✅');
      this.scanOverlay.showSuccess(`${scannedFollowers.size} followers scannés !`);
      console.log('✅ Initial scan completed successfully');

    } catch (error) {
      console.error('Error during initial scan:', error);
      this.scanOverlay.showError('Erreur lors du scan');
    } finally {
      this.isScanning = false;
      setTimeout(() => this.updateBadge(''), 3000);
    }
  }

  /**
   * SCAN INITIAL AVEC SMART SCROLLER (Nouvelle version optimisée)
   * Utilise InstagramModalScroller et FollowerExtractor
   */
  async performInitialScanWithSmartScroller() {
    if (this.isScanning) {
      console.log('⏳ Scan already in progress');
      return;
    }

    this.isScanning = true;
    console.log('🎬 Starting initial scan with Smart Scroller...');
    await this.updateBadge('⏳');
    this.scanOverlay.show('Scan intelligent en cours...');

    try {
      // 1. Vérifier si le modal est déjà ouvert
      let modal = document.querySelector('[role="dialog"]');
      
      if (modal) {
        console.log('✅ Followers modal already open!');
        // Attendre un peu pour que le contenu se charge
        console.log('⏳ Waiting for modal content to load...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // 2. Aller sur le profil si nécessaire
        if (!this.isOnOwnProfile()) {
          console.log(`📍 Navigating to profile: /${this.currentUsername}`);
          window.location.href = `/${this.currentUsername}`;
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

        // 3. Chercher le lien followers avec plusieurs stratégies
        console.log('🔍 Searching for followers link...');
        let followersLink: HTMLAnchorElement | null = null;
        let attempts = 0;
        const maxAttempts = 10;

        while (!followersLink && attempts < maxAttempts) {
          // Stratégie 1: Lien exact avec username
          followersLink = document.querySelector(`a[href="/${this.currentUsername}/followers/"]`) as HTMLAnchorElement;
          
          // Stratégie 2: N'importe quel lien vers /followers/
          if (!followersLink) {
            followersLink = document.querySelector(`a[href*="/followers/"]`) as HTMLAnchorElement;
          }
          
          // Stratégie 3: Chercher dans tous les liens
          if (!followersLink) {
            const links = Array.from(document.querySelectorAll('a'));
            followersLink = links.find(link => link.href.includes('/followers/')) as HTMLAnchorElement;
          }
          
          if (!followersLink) {
            attempts++;
            console.log(`⏳ Attempt ${attempts}/${maxAttempts} - Waiting for page to load...`);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        if (!followersLink) {
          this.scanOverlay.showError('Veuillez ouvrir manuellement le modal followers et relancer le scan');
          throw new Error('Followers link not found after multiple attempts. Please open the followers modal manually.');
        }

        console.log('✅ Followers link found:', followersLink.href);
        followersLink.click();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 4. Vérifier que le modal est maintenant ouvert
        modal = document.querySelector('[role="dialog"]');
        if (!modal) {
          throw new Error('Followers modal not found after clicking link');
        }

        console.log('✅ Modal opened successfully');
      }

      // 4. Créer l'extracteur de données
      const extractor = new FollowerExtractor();

      // 5. Créer le scroller intelligent avec callback de progression
      const scroller = new InstagramModalScroller({
        maxScrollAttempts: 6, // 6 tentatives avant d'arrêter (équilibre entre patience et discrétion)
        scrollDelay: 400, // 400ms entre chaque scroll (plus lent = plus sûr)
        waitForLoadTimeout: 8000, // 8 secondes pour attendre le chargement (Instagram peut être lent)
        onProgress: (progress) => {
          console.log(`📊 Progress: ${progress.totalFollowers} followers scannés`);
          
          // Extraire les données au fur et à mesure du scroll
          extractor.extractAllVisible();
          
          this.scanOverlay.updateProgress(
            progress.totalFollowers,
            progress.totalFollowers + 100, // Estimation
            `${progress.totalFollowers} followers scannés`
          );
        }
      });

      // 6. Scroller jusqu'à la fin
      console.log('🚀 Starting intelligent scroll to capture ALL followers...');
      const allUsernames = await scroller.scrollToEnd();
      
      console.log(`✅ Scroll complete: ${allUsernames.length} followers found`);
      console.log(`� First 10 followers:`, allUsernames.slice(0, 10));

      // 7. Vérifier qu'on a bien des usernames
      if (allUsernames.length === 0) {
        throw new Error('No followers found during scroll. Please try again.');
      }

      // 8. Sauvegarder dans la base de données (utiliser directement les usernames du scroller)
      this.followerDatabase.followers = {};
      const firstFollower = allUsernames[0];

      console.log(`💾 Saving ${allUsernames.length} followers to database...`);
      
      allUsernames.forEach((username, index) => {
        this.followerDatabase.followers[username] = {
          username: username,
          avatarUrl: '', // Pas d'avatar pour l'instant (extraction simple)
          addedAt: new Date().toISOString(),
          position: index
        };
      });

      this.followerDatabase.totalCount = allUsernames.length;
      this.followerDatabase.firstFollowerId = firstFollower;
      this.followerDatabase.lastScanDate = new Date().toISOString();
      this.followerDatabase.isInitialized = true;

      await this.saveFollowerDatabase();
      console.log(`✅ Database saved: ${allUsernames.length} followers`);

      // 9. Fermer le modal
      scroller.closeModal();

      // 10. Afficher le succès
      await this.updateBadge('✅');
      this.scanOverlay.showSuccess(
        `${allUsernames.length} followers scannés avec succès !`
      );
      console.log('✅ Smart scan completed successfully');

    } catch (error) {
      console.error('Error during smart scan:', error);
      this.scanOverlay.showError(`Erreur: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isScanning = false;
      setTimeout(() => this.updateBadge(''), 3000);
    }
  }

  /**
   * SCAN INTELLIGENT NOUVEAUX FOLLOWERS (Estimation)
   */
  private async scanNewFollowersIntelligent(expectedNew: number) {
    if (this.isScanning) return;
    
    this.isScanning = true;
    console.log(`🔍 Starting smart scan for ${expectedNew} new followers...`);
    this.scanOverlay.show(`Détection de ${expectedNew} nouveau(x) follower(s)...`);

    try {
      // Ouvrir la modal
      const followersLink = document.querySelector(`a[href="/${this.currentUsername}/followers/"]`) as HTMLAnchorElement;
      if (!followersLink) {
        this.isScanning = false;
        return;
      }

      followersLink.click();
      await new Promise(resolve => setTimeout(resolve, 2000));

      const modal = document.querySelector('[role="dialog"]');
      if (!modal) {
        this.isScanning = false;
        return;
      }

      // Scanner les (expectedNew + 5) premiers
      const scanLimit = expectedNew + 5;
      const links = modal.querySelectorAll('a[href^="/"]');
      const currentFollowers: string[] = [];

      for (const link of Array.from(links).slice(0, scanLimit * 2)) {
        const href = link.getAttribute('href');
        if (href) {
          const usernameMatch = href.match(/^\/([a-zA-Z0-9._]+)\/?(\?.*)?$/);
          if (usernameMatch) {
            const username = usernameMatch[1];
            const systemPages = ['explore', 'reels', 'direct', 'p', 'stories', 'tv', 'accounts'];
            if (!systemPages.includes(username)) {
              currentFollowers.push(username);
              
              // Arrêter si on trouve le 1er ID de la base
              if (username === this.followerDatabase.firstFollowerId) {
                break;
              }
            }
          }
        }
      }

      // Trouver les nouveaux (avant le 1er ID de la base)
      const newFollowers: string[] = [];
      for (const username of currentFollowers) {
        if (username === this.followerDatabase.firstFollowerId) {
          break;
        }
        newFollowers.push(username);
      }

      console.log(`🆕 Found ${newFollowers.length} new followers:`, newFollowers);

      // Ajouter à la base et envoyer au backend
      for (const username of newFollowers) {
        this.followerDatabase.followers[username] = {
          username,
          addedAt: new Date().toISOString()
        };

        await chrome.runtime.sendMessage({
          type: 'TRACK_FOLLOWER',
          data: {
            username,
            metadata: { detectedAt: new Date().toISOString() }
          }
        });
      }

      // Mettre à jour le 1er ID et synchroniser totalCount
      if (newFollowers.length > 0) {
        this.followerDatabase.firstFollowerId = newFollowers[0];
        // Toujours synchroniser avec le nombre réel
        this.followerDatabase.totalCount = Object.keys(this.followerDatabase.followers).length;
        await this.saveFollowerDatabase();
      }

      // Fermer la modal
      const closeButton = modal.querySelector('button[aria-label="Close"], button[aria-label="Fermer"]');
      if (closeButton) {
        (closeButton as HTMLButtonElement).click();
      }

      this.scanOverlay.showSuccess(`${newFollowers.length} nouveau(x) follower(s) détecté(s) !`);
      console.log('✅ Smart scan completed');

    } catch (error) {
      console.error('Error during smart scan:', error);
      this.scanOverlay.showError('Erreur lors de la détection');
    } finally {
      this.isScanning = false;
      await this.updateBadge('');
    }
  }

  /**
   * DÉTECTION UNFOLLOWERS AVEC SMART SCROLLER
   * Utilise InstagramModalScroller et FollowerExtractor pour détecter les unfollowers
   */
  async detectUnfollowersWithSmartScroller() {
    if (this.isScanning) {
      console.log('⏳ Scan already in progress');
      return;
    }

    this.isScanning = true;
    console.log('🔍 Starting unfollower detection with Smart Scroller...');
    await this.updateBadge('🔍');
    this.scanOverlay.show('Détection des unfollowers...');

    try {
      // 1. Ouvrir le modal followers
      const followersLink = document.querySelector(`a[href="/${this.currentUsername}/followers/"]`) as HTMLAnchorElement;
      if (!followersLink) {
        throw new Error('Followers link not found');
      }

      followersLink.click();
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 2. Vérifier que le modal est ouvert
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) {
        throw new Error('Followers modal not found');
      }

      // 3. Créer le scroller et l'extracteur
      const scroller = new InstagramModalScroller({
        maxScrollAttempts: 3,
        scrollDelay: 300,
        onProgress: (progress) => {
          this.scanOverlay.updateProgress(
            progress.totalFollowers,
            Object.keys(this.followerDatabase.followers).length,
            `${progress.totalFollowers} followers vérifiés`
          );
        }
      });

      const extractor = new FollowerExtractor();

      // 4. Scroller et extraire tous les followers actuels
      console.log('🚀 Scanning current followers...');
      const currentUsernames = await scroller.scrollToEnd();
      
      console.log(`✅ Found ${currentUsernames.length} current followers`);

      // 5. Comparer avec la base de données pour trouver les unfollowers
      const previousUsernames = Object.keys(this.followerDatabase.followers);
      console.log(`📊 Previous followers in DB: ${previousUsernames.length}`);
      console.log(`📊 Current followers scanned: ${currentUsernames.length}`);
      
      // Comparer directement les listes de usernames
      const currentSet = new Set(currentUsernames);
      const previousSet = new Set(previousUsernames);
      const unfollowers = previousUsernames.filter(username => !currentSet.has(username));
      const newFollowers = currentUsernames.filter(username => !previousSet.has(username));

      console.log(`🚫 Detected ${unfollowers.length} unfollowers:`, unfollowers);
      console.log(`🆕 Detected ${newFollowers.length} new followers:`, newFollowers);

      // 6. Envoyer les nouveaux followers au backend
      for (const username of newFollowers) {
        try {
          this.followerDatabase.followers[username] = {
            username,
            addedAt: new Date().toISOString()
          };
          
          await chrome.runtime.sendMessage({
            type: 'TRACK_FOLLOWER',
            data: {
              username,
              metadata: { detectedAt: new Date().toISOString() }
            }
          });
        } catch (error) {
          console.error(`Error tracking new follower ${username}:`, error);
        }
      }

      // 7. Envoyer les unfollowers au backend et retirer de la base
      for (const username of unfollowers) {
        try {
          await chrome.runtime.sendMessage({
            type: 'TRACK_UNFOLLOWER',
            data: {
              username,
              metadata: { detectedAt: new Date().toISOString() }
            }
          });

          delete this.followerDatabase.followers[username];
        } catch (error) {
          console.error(`Error tracking unfollower ${username}:`, error);
        }
      }

      // Synchroniser totalCount avec le nombre réel de followers dans la base
      this.followerDatabase.totalCount = Object.keys(this.followerDatabase.followers).length;
      this.followerDatabase.lastScanDate = new Date().toISOString();
      await this.saveFollowerDatabase();

      // 7. Fermer le modal
      scroller.closeModal();

      // 8. Afficher le résultat
      await this.updateBadge(unfollowers.length > 0 ? `-${unfollowers.length}` : '✅');
      this.scanOverlay.showSuccess(
        unfollowers.length > 0
          ? `${unfollowers.length} unfollower(s) détecté(s) !`
          : 'Aucun unfollower détecté'
      );
      console.log('✅ Unfollower detection completed');

    } catch (error) {
      console.error('Error during unfollower detection:', error);
      this.scanOverlay.showError(`Erreur: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isScanning = false;
      setTimeout(() => this.updateBadge(''), 3000);
    }
  }

  /**
   * SCAN PROGRESSIF UNFOLLOWERS (Par portions intelligent)
   */
  private async scanUnfollowersProgressive(expectedUnfollowers: number) {
    if (this.isScanning) return;
    
    this.isScanning = true;
    console.log(`🔍 Starting progressive scan for ${expectedUnfollowers} unfollowers...`);
    this.scanOverlay.show(`Recherche de ${expectedUnfollowers} unfollower(s)...`);

    try {
      // Ouvrir la modal
      const followersLink = document.querySelector(`a[href="/${this.currentUsername}/followers/"]`) as HTMLAnchorElement;
      if (!followersLink) {
        this.isScanning = false;
        return;
      }

      followersLink.click();
      await new Promise(resolve => setTimeout(resolve, 2000));

      const modal = document.querySelector('[role="dialog"]');
      if (!modal) {
        this.isScanning = false;
        return;
      }

      const scrollContainer = modal.querySelector('div[style*="overflow"]');
      if (!scrollContainer) {
        this.isScanning = false;
        return;
      }

      const portionSize = 50;
      const maxPortions = 10;
      let portion = 0;
      let unfollowersFound: string[] = [];
      let scannedFollowers = new Set<string>();

      while (portion < maxPortions && unfollowersFound.length < expectedUnfollowers) {
        portion++;

        // Scanner la portion actuelle
        const links = modal.querySelectorAll('a[href^="/"]');
        
        for (const link of Array.from(links)) {
          const href = link.getAttribute('href');
          if (href) {
            const usernameMatch = href.match(/^\/([a-zA-Z0-9._]+)\/?(\?.*)?$/);
            if (usernameMatch) {
              const username = usernameMatch[1];
              const systemPages = ['explore', 'reels', 'direct', 'p', 'stories', 'tv', 'accounts'];
              if (!systemPages.includes(username)) {
                scannedFollowers.add(username);
              }
            }
          }
        }

        // Comparer avec la base pour trouver les manquants
        const dbFollowers = Object.keys(this.followerDatabase.followers);
        for (const dbFollower of dbFollowers) {
          if (!scannedFollowers.has(dbFollower) && !unfollowersFound.includes(dbFollower)) {
            unfollowersFound.push(dbFollower);
          }
        }

        console.log(`📊 Portion ${portion}: ${unfollowersFound.length}/${expectedUnfollowers} unfollowers found`);
        await this.updateScanProgress(unfollowersFound.length, expectedUnfollowers);
        this.scanOverlay.updateProgress(unfollowersFound.length, expectedUnfollowers, `Portion ${portion}`);

        // Conditions d'arrêt intelligent
        if (unfollowersFound.length === expectedUnfollowers) {
          console.log('✅ All unfollowers found, stopping scan');
          break;
        }

        if (unfollowersFound.length === 0 && portion > 2) {
          console.log('⚠️ No unfollowers in recent portions, stopping');
          break;
        }

        // Scroll pour charger plus
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
        const delay = 800 + Math.random() * 400;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      console.log(`🚫 Found ${unfollowersFound.length} unfollowers:`, unfollowersFound);

      // Envoyer au backend et retirer de la base
      for (const username of unfollowersFound) {
        await chrome.runtime.sendMessage({
          type: 'TRACK_UNFOLLOWER',
          data: {
            username,
            metadata: { detectedAt: new Date().toISOString() }
          }
        });

        delete this.followerDatabase.followers[username];
      }

      this.followerDatabase.totalCount -= unfollowersFound.length;
      await this.saveFollowerDatabase();

      // Fermer la modal
      const closeButton = modal.querySelector('button[aria-label="Close"], button[aria-label="Fermer"]');
      if (closeButton) {
        (closeButton as HTMLButtonElement).click();
      }

      this.scanOverlay.showSuccess(`${unfollowersFound.length} unfollower(s) détecté(s) !`);
      console.log('✅ Progressive scan completed');

    } catch (error) {
      console.error('Error during progressive scan:', error);
      this.scanOverlay.showError('Erreur lors de la détection');
    } finally {
      this.isScanning = false;
      await this.updateBadge('');
    }
  }

  /**
   * Vérification rapide des nouveaux followers (seulement les 10 premiers visibles)
   */
  private async quickCheckForNewFollowers() {
    try {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) {
        console.log('❌ Modal not found');
        return;
      }

      // Extraire les premiers followers visibles
      const extractor = new FollowerExtractor();
      const visibleFollowers = extractor.extractAllVisible();
      
      if (visibleFollowers.length === 0) {
        console.log('⚠️ No followers found in modal');
        return;
      }

      console.log(`📊 Found ${visibleFollowers.length} visible followers`);

      // Vérifier si le premier follower est nouveau
      const firstFollower = visibleFollowers[0];
      const isNew = !this.followerDatabase.followers[firstFollower.username];

      if (isNew) {
        console.log(`🆕 New follower detected: @${firstFollower.username}`);
        
        // Ajouter à la base
        this.followerDatabase.followers[firstFollower.username] = {
          username: firstFollower.username,
          avatarUrl: firstFollower.avatarUrl,
          addedAt: new Date().toISOString()
        };
        
        this.followerDatabase.totalCount++;
        this.followerDatabase.firstFollowerId = firstFollower.username;
        await this.saveFollowerDatabase();

        // Envoyer au backend pour synchronisation
        await chrome.runtime.sendMessage({
          type: 'TRACK_FOLLOWER',
          data: {
            username: firstFollower.username,
            avatarUrl: firstFollower.avatarUrl,
            metadata: { detectedAt: new Date().toISOString() }
          }
        });

        console.log('✅ New follower tracked and synced!');
      } else {
        console.log(`✓ First follower @${firstFollower.username} already in database`);
      }
    } catch (error) {
      console.error('Error during quick check:', error);
    }
  }

  /**
   * Observer automatique pour détecter l'ouverture du modal followers
   * et lancer la vérification des nouveaux followers
   */
  private setupFollowersModalObserver() {
    console.log('👁️ Setting up followers modal observer...');
    
    let lastModalCheck = 0;
    const CHECK_INTERVAL = 2000; // Vérifier toutes les 2 secondes
    
    const checkForFollowersModal = () => {
      const now = Date.now();
      if (now - lastModalCheck < CHECK_INTERVAL) return;
      lastModalCheck = now;
      
      // Chercher le modal followers
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return;
      
      // Vérifier si c'est bien le modal followers (contient "followers" ou "abonnés")
      const modalText = modal.textContent?.toLowerCase() || '';
      const isFollowersModal = modalText.includes('follower') || modalText.includes('abonné');
      
      if (!isFollowersModal) return;
      
      // Vérifier si on a déjà une base initialisée
      if (!this.followerDatabase.isInitialized) {
        console.log('⚠️ Database not initialized, skipping auto-check');
        return;
      }
      
      // Vérifier si un scan est déjà en cours
      if (this.isScanning) {
        console.log('⏳ Scan already in progress, skipping auto-check');
        return;
      }
      
      console.log('✅ Followers modal detected! Checking for new followers...');
      
      // Lancer la vérification rapide après un petit délai
      setTimeout(() => {
        this.quickCheckForNewFollowers();
      }, 1500);
    };
    
    // Observer les changements du DOM pour détecter l'ouverture du modal
    const observer = new MutationObserver(() => {
      checkForFollowersModal();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('✅ Followers modal observer active');
  }
}

// Initialize tracker
const tracker = new InstagramTracker();
tracker.init();

// Fonction de debug globale pour corriger le compteur
(window as any).fixFollowerCount = async (targetCount?: number) => {
  console.log('🔧 Fix Follower Count - Debug Tool\n');
  
  try {
    // Lire le compteur Instagram si targetCount n'est pas fourni
    if (!targetCount) {
      const followerEl = document.querySelector('a[href*="/followers/"] span');
      if (followerEl) {
        const parseCount = (text: string) => {
          const cleaned = text.replace(/,/g, '').replace(/\s/g, '');
          if (cleaned.includes('K')) return Math.floor(parseFloat(cleaned) * 1000);
          if (cleaned.includes('M')) return Math.floor(parseFloat(cleaned) * 1000000);
          return parseInt(cleaned) || 0;
        };
        targetCount = parseCount(followerEl.textContent?.trim() || '0');
        console.log(`📊 Compteur Instagram détecté: ${targetCount}`);
      } else {
        console.error('❌ Compteur Instagram non trouvé et aucune valeur fournie');
        console.log('💡 Usage: fixFollowerCount(213)');
        return;
      }
    }
    
    // Lire la base de données
    const stored = await chrome.storage.local.get('followerDatabase');
    if (!stored.followerDatabase) {
      console.error('❌ Base de données non trouvée');
      return;
    }
    
    const db = stored.followerDatabase;
    const actualCount = Object.keys(db.followers).length;
    
    console.log(`\n📂 État actuel:`);
    console.log(`   totalCount: ${db.totalCount}`);
    console.log(`   Followers réels: ${actualCount}`);
    console.log(`   Cible: ${targetCount}`);
    
    // Appliquer la correction
    const oldCount = db.totalCount;
    db.totalCount = targetCount;
    
    await chrome.storage.local.set({ 
      followerDatabase: db,
      lastFollowerCount: targetCount
    });
    
    console.log(`\n✅ CORRECTION APPLIQUÉE!`);
    console.log(`   ${oldCount} → ${targetCount}`);
    console.log(`\n🔄 Recharge l'extension (chrome://extensions/) pour voir le changement`);
    
    // Analyser la différence
    const diff = targetCount - actualCount;
    if (diff !== 0) {
      console.log(`\n⚠️ Note: Différence de ${Math.abs(diff)} entre cible (${targetCount}) et DB (${actualCount})`);
      if (diff > 0) {
        console.log(`   → ${diff} follower(s) manquant(s) dans la base`);
        console.log(`   💡 Lance un scan pour les capturer`);
      } else {
        console.log(`   → ${Math.abs(diff)} entrée(s) obsolète(s) dans la base`);
        console.log(`   💡 Lance une détection d'unfollowers`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
};

// Fonction de debug globale pour vérifier l'état de la détection
(window as any).debugFollowerDetection = async function() {
  console.log('='.repeat(60));
  console.log('DEBUG - État de la Détection des Followers');
  console.log('='.repeat(60));
  console.log('');

  // 1. Vérifier le DOM
  console.log('� [1/4] DOM...');
  const followerCountElement = 
    document.querySelector('a[href*="/followers/"] span') ||
    document.querySelector('a[href$="/followers/"] span');
  
  if (followerCountElement) {
    const countText = followerCountElement.textContent?.trim();
    const parseCount = (text: string) => {
      const cleaned = text.replace(/,/g, '').replace(/\s/g, '');
      if (cleaned.includes('K')) return Math.floor(parseFloat(cleaned) * 1000);
      if (cleaned.includes('M')) return Math.floor(parseFloat(cleaned) * 1000000);
      return parseInt(cleaned) || 0;
    };
    const domCount = parseCount(countText || '0');
    console.log(`   ✅ Followers (DOM): ${domCount}`);
  } else {
    console.log('   ❌ Élément non trouvé');
  }

  // 2. Vérifier le storage
  console.log('📦 [2/4] Storage...');
  const stored = await chrome.storage.local.get(['lastFollowerCount', 'followerDatabase']);
  console.log(`   lastFollowerCount: ${stored.lastFollowerCount || 'non défini'}`);
  if (stored.followerDatabase) {
    const dbCount = Object.keys(stored.followerDatabase.followers || {}).length;
    console.log(`   Database count: ${dbCount}`);
    console.log(`   Database.totalCount: ${stored.followerDatabase.totalCount}`);
  }

  // 3. Vérifier l'API Interceptor
  console.log('🔌 [3/4] API Interceptor...');
  console.log('   ℹ️ L\'interception fetch/XHR s\'exécute dans le monde MAIN (page-interceptor.js)');
  console.log('   ℹ️ Cherchez le log "[MAIN] Waler page interceptor installed" au chargement de la page');
  console.log('   ℹ️ et "User info detected in API response" lors de la navigation');

  // 4. Vérifier la synchronisation
  console.log('🔍 [4/4] Synchronisation...');
  const domCount = followerCountElement ? 
    parseInt(followerCountElement.textContent?.replace(/[^0-9]/g, '') || '0') : null;
  const lastCount = stored.lastFollowerCount;
  const dbCount = stored.followerDatabase ? 
    Object.keys(stored.followerDatabase.followers || {}).length : null;

  if (domCount === lastCount && domCount === dbCount) {
    console.log('   ✅ Tout est synchronisé!');
  } else {
    console.log('   ⚠️ DÉSYNCHRONISATION:');
    console.log(`      DOM: ${domCount}`);
    console.log(`      lastFollowerCount: ${lastCount}`);
    console.log(`      Database: ${dbCount}`);
  }

  console.log('');
  console.log('='.repeat(60));
};

console.log('💡 Debug tools available:');
console.log('   - debugFollowerDetection() : Vérifier l\'état de la détection');
console.log('   - fixFollowerCount() : Corriger le compteur');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_INITIAL_SCAN') {
    console.log('📨 Received START_INITIAL_SCAN message from popup');
    // Utiliser la nouvelle méthode avec Smart Scroller
    tracker['performInitialScanWithSmartScroller']();
    sendResponse({ success: true });
  } else if (message.type === 'START_UNFOLLOWER_ANALYSIS') {
    console.log('📨 Received START_UNFOLLOWER_ANALYSIS message from popup');
    tracker['startUnfollowerAnalysis']();
    sendResponse({ success: true });
  } else if (message.type === 'START_NOTIFICATION_CHECK') {
    console.log('📨 Received START_NOTIFICATION_CHECK message from popup');
    // Lancer la vérification automatique des notifications
    tracker['notificationChecker'].startAutoCheck(tracker['followerDatabase']);
    sendResponse({ success: true });
  } else if (message.type === 'FOLLOWER_COUNT_CHANGED') {
    // Synchroniser lastFollowerCount quand l'API détecte un changement
    console.log('📨 Received FOLLOWER_COUNT_CHANGED from API interceptor');
    const { newCount, diff } = message.data;
    tracker['lastFollowerCount'] = newCount;
    console.log(`🔄 Synchronized lastFollowerCount to ${newCount} (${diff > 0 ? '+' : ''}${diff})`);
    
    // Déclencher handleNewFollowers ou handleUnfollowers si nécessaire
    if (diff > 0) {
      tracker['handleNewFollowers'](diff);
    } else if (diff < 0) {
      tracker['handleUnfollowers'](Math.abs(diff));
    }
    sendResponse({ success: true });
  }
  return true;
});

export default tracker;
