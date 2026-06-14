/**
 * Unfollower Detector
 * 
 * Orchestrateur principal pour la détection et classification des unfollowers
 * - Scan complet des followers actuels
 * - Comparaison avec la base de données
 * - Recherche automatique des IDs manquants
 * - Classification: unfollow / blocked / deleted
 */

import { InstagramModalScroller } from './instagram-modal-scroller.js';
import { InstagramSearchAutomator } from './instagram-search-automator.js';
import { ProfileAnalyzer } from './profile-analyzer.js';

export interface UnfollowerAnalysisResult {
  totalMissing: number;
  unfollowed: string[];
  blocked: string[];
  notFoundOnInstagram: string[];
  errors: string[];
}

export class UnfollowerDetector {
  private scroller: InstagramModalScroller;
  private searcher: InstagramSearchAutomator;
  private analyzer: ProfileAnalyzer;
  private isRunning: boolean = false;
  private maxSearches: number = 20;
  private searchCount: number = 0;

  constructor() {
    this.scroller = new InstagramModalScroller({
      maxScrollAttempts: 6,
      scrollDelay: 400,
      waitForLoadTimeout: 8000,
    });
    this.searcher = new InstagramSearchAutomator();
    this.analyzer = new ProfileAnalyzer();
  }

  /**
   * Lance l'analyse complète des unfollowers
   */
  async analyzeUnfollowers(currentUsername: string): Promise<UnfollowerAnalysisResult> {
    if (this.isRunning) {
      throw new Error('Analysis already in progress');
    }

    this.isRunning = true;
    this.searchCount = 0;

    const result: UnfollowerAnalysisResult = {
      totalMissing: 0,
      unfollowed: [],
      blocked: [],
      notFoundOnInstagram: [],
      errors: [],
    };

    try {
      console.log('🎬 Starting unfollower analysis...');

      // Phase 1: Scan complet des followers actuels
      console.log('📊 Phase 1: Scanning current followers...');
      const currentFollowers = await this.scanCurrentFollowers();
      console.log(`✅ Current followers scanned: ${currentFollowers.length}`);

      // Phase 2: Comparer avec la base de données
      console.log('📊 Phase 2: Comparing with database...');
      const missingFollowers = await this.findMissingFollowers(currentFollowers);
      result.totalMissing = missingFollowers.length;
      console.log(`🔍 Missing followers: ${missingFollowers.length}`);

      if (missingFollowers.length === 0) {
        console.log('✅ No unfollowers detected');
        return result;
      }

      // Fermer le modal followers avant de commencer les recherches
      console.log('🚪 Closing followers modal...');
      await this.closeFollowersModal();
      await this.sleep(2000); // Attendre que le modal se ferme

      // Phase 3: Vérifier chaque follower manquant par navigation URL
      console.log('📊 Phase 3: Checking missing followers via URL navigation...');
      await this.updateProgress('Vérification des unfollowers...', 0, missingFollowers.length);

      // Marquer le début de l'analyse
      await chrome.storage.local.set({ isAnalyzing: true });

      // Sauvegarder l'état dans localStorage pour survivre aux navigations
      await this.initializeUrlCheckState(currentUsername, missingFollowers);

      // Naviguer vers le premier profil
      if (missingFollowers.length > 0) {
        console.log(`➡️ Navigating to first profile: @${missingFollowers[0]}`);
        window.location.href = `https://www.instagram.com/${missingFollowers[0]}/`;
        // Le reste sera géré par checkCurrentPageForUnfollower()
        return result; // Retourner temporairement, le vrai résultat sera dans localStorage
      }

      // Phase 5: Envoyer les résultats au backend
      console.log('📊 Phase 4: Sending results to backend...');
      await this.sendResultsToBackend(result);

      console.log('✅ Unfollower analysis completed');
      console.log(`📊 Results: ${result.unfollowed.length} unfollows, ${result.blocked.length} blocked, ${result.notFoundOnInstagram.length} not found`);

      return result;

    } catch (error) {
      console.error('Error during unfollower analysis:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Scan complet des followers actuels via le modal
   */
  private async scanCurrentFollowers(): Promise<string[]> {
    try {
      // Vérifier que le modal est ouvert
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) {
        throw new Error('Followers modal not open. Please open it manually.');
      }

      // Utiliser le scroller intelligent
      const followers = await this.scroller.scrollToEnd();
      return followers;

    } catch (error) {
      console.error('Error scanning current followers:', error);
      throw error;
    }
  }

  /**
   * Compare les followers actuels avec la base de données
   */
  private async findMissingFollowers(currentFollowers: string[]): Promise<string[]> {
    try {
      // Charger la base de données de followers
      const stored = await chrome.storage.local.get('followerDatabase');
      const followerDatabase = stored.followerDatabase;

      if (!followerDatabase || !followerDatabase.followers) {
        console.warn('⚠️ No follower database found');
        return [];
      }

      const previousFollowers = Object.keys(followerDatabase.followers);
      console.log(`📊 Previous followers: ${previousFollowers.length}`);
      console.log(`📊 Current followers: ${currentFollowers.length}`);

      // Trouver les followers manquants
      const missing = previousFollowers.filter(username => !currentFollowers.includes(username));
      
      console.log(`🔍 Missing followers: ${missing.length}`);
      return missing;

    } catch (error) {
      console.error('Error finding missing followers:', error);
      throw error;
    }
  }

  /**
   * Envoie les résultats au backend
   */
  private async sendResultsToBackend(result: UnfollowerAnalysisResult): Promise<void> {
    try {
      console.log('📤 Sending results to backend...');

      const response = await chrome.runtime.sendMessage({
        type: 'SEND_UNFOLLOWER_RESULTS',
        data: {
          unfollowedUsernames: result.unfollowed,
          blockedUsernames: result.blocked,
          missingUsernames: result.notFoundOnInstagram,
        },
      });

      if (response && response.success) {
        console.log('✅ Results sent to backend successfully');
        
        // Mettre à jour les stats de session avec les résultats de l'analyse
        await chrome.runtime.sendMessage({
          type: 'UPDATE_UNFOLLOWER_STATS',
          data: {
            unfollowers: result.unfollowed.length,
            potentialBlockers: result.blocked.length + result.notFoundOnInstagram.length,
          },
        });
        
        // Si des unfollowers n'ont pas été trouvés sur Instagram, déclencher l'Agent B
        if (result.notFoundOnInstagram.length > 0) {
          console.log(`🤖 Déclenchement de l'Agent B pour ${result.notFoundOnInstagram.length} unfollowers non trouvés`);
          await this.triggerAgentB(result.notFoundOnInstagram);
        }
      } else {
        console.error('❌ Failed to send results to backend:', response);
      }

    } catch (error) {
      console.error('Error sending results to backend:', error);
      throw error;
    }
  }

  /**
   * Déclenche l'Agent B pour vérifier les unfollowers via Google
   */
  async triggerAgentB(missingUsernames: string[]): Promise<void> {
    try {
      console.log(`🤖 Triggering Agent B for ${missingUsernames.length} usernames...`);
      
      const response = await chrome.runtime.sendMessage({
        type: 'TRIGGER_AGENT_B',
        data: {
          missingUsernames,
        },
      });

      if (response && response.success) {
        console.log('✅ Agent B triggered successfully');
        console.log(`🔍 Agent B will verify these usernames via Google search`);
      } else {
        console.error('❌ Failed to trigger Agent B:', response);
      }

    } catch (error) {
      console.error('Error triggering Agent B:', error);
    }
  }

  /**
   * Met à jour la progression (pour l'overlay)
   */
  private async updateProgress(message: string, current: number, total: number): Promise<void> {
    try {
      await chrome.runtime.sendMessage({
        type: 'UNFOLLOWER_ANALYSIS_PROGRESS',
        data: {
          message,
          current,
          total,
          percentage: Math.round((current / total) * 100),
        },
      });
    } catch (error) {
      // Ignore errors (overlay might not be listening)
    }
  }

  /**
   * Vérifie si une analyse est en cours
   */
  isAnalysisRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Arrête l'analyse en cours
   */
  stopAnalysis(): void {
    this.isRunning = false;
    console.log('⏹️ Analysis stopped by user');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Ferme le modal followers s'il est ouvert
   */
  private async closeFollowersModal(): Promise<void> {
    try {
      // Chercher le bouton de fermeture du modal
      const closeButton = document.querySelector('[role="dialog"] svg[aria-label="Close"], [role="dialog"] button[aria-label="Close"]');
      
      if (closeButton) {
        console.log('✅ Found close button, clicking...');
        (closeButton as HTMLElement).click();
        await this.sleep(1000);
      } else {
        // Essayer d'appuyer sur Escape
        console.log('⌨️ Pressing Escape to close modal...');
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27 }));
        await this.sleep(1000);
      }
      
      console.log('✅ Modal closed');
    } catch (error) {
      console.error('Error closing modal:', error);
    }
  }

  /**
   * Initialise l'état pour la vérification par URL dans localStorage
   */
  private async initializeUrlCheckState(myUsername: string, missingFollowers: string[]): Promise<void> {
    const state = {
      currentIndex: 0,
      myUsername: myUsername,
      missingFollowers: missingFollowers,
      results: {
        unfollowed: [] as string[],
        blocked: [] as string[],
        notFoundOnInstagram: [] as string[]
      }
    };
    localStorage.setItem('unfollowerCheckState', JSON.stringify(state));
    console.log('💾 State initialized in localStorage');
  }

  /**
   * Vérifie la page actuelle pour un unfollower (appelé automatiquement sur chaque page)
   */
  async checkCurrentPageForUnfollower(): Promise<void> {
    const stateStr = localStorage.getItem('unfollowerCheckState');
    if (!stateStr) {
      return; // Pas de vérification en cours
    }

    const state = JSON.parse(stateStr);
    const currentUrl = window.location.href;
    const currentUsername = currentUrl.match(/instagram\.com\/([^\/]+)/)?.[1];

    console.log(`📍 Current page: @${currentUsername}`);

    // Vérifier si on est sur une page système (notifications, explore, etc.)
    const systemPages = ['notifications', 'explore', 'direct', 'accounts', 'settings'];
    const isSystemPage = systemPages.some(page => currentUrl.includes(`/${page}`));
    
    if (isSystemPage) {
      console.log('⚠️ On a system page, redirecting to expected profile...');
      const expectedUsername = state.missingFollowers[state.currentIndex];
      if (expectedUsername) {
        console.log(`➡️ Navigating to @${expectedUsername}...`);
        window.location.href = `https://www.instagram.com/${expectedUsername}/`;
      } else {
        // Si on a fini, retourner au profil
        console.log(`🏠 Returning to profile @${state.myUsername}...`);
        window.location.href = `https://www.instagram.com/${state.myUsername}/`;
      }
      return;
    }

    // Si on est de retour sur notre profil, c'est fini
    if (currentUsername === state.myUsername && state.currentIndex >= state.missingFollowers.length) {
      console.log('\n✅ All checks completed!');
      console.log('📊 Results:');
      console.log(`   - Unfollowed: ${state.results.unfollowed.length}`, state.results.unfollowed);
      console.log(`   - Blocked: ${state.results.blocked.length}`, state.results.blocked);
      console.log(`   - Not found: ${state.results.notFoundOnInstagram.length}`, state.results.notFoundOnInstagram);

      // Envoyer les résultats
      await this.sendResultsToBackend({
        totalMissing: state.missingFollowers.length,
        unfollowed: state.results.unfollowed,
        blocked: state.results.blocked,
        notFoundOnInstagram: state.results.notFoundOnInstagram,
        errors: []
      });

      // Déclencher l'Agent B si nécessaire
      if (state.results.notFoundOnInstagram.length > 0) {
        console.log(`\n🤖 Triggering Agent B for ${state.results.notFoundOnInstagram.length} usernames...`);
        await this.triggerAgentB(state.results.notFoundOnInstagram);
      }

      // Nettoyer
      localStorage.removeItem('unfollowerCheckState');
      await chrome.storage.local.set({ isAnalyzing: false });
      
      // Notifier le popup pour qu'il rafraîchisse les stats
      await chrome.runtime.sendMessage({
        type: 'ANALYSIS_COMPLETED',
        data: {
          unfollowers: state.results.unfollowed.length,
          blocked: state.results.blocked.length,
          notFound: state.results.notFoundOnInstagram.length
        }
      });
      
      console.log('✅ Analysis completed notification sent to popup');
      return;
    }

    // Analyser la page actuelle
    const expectedUsername = state.missingFollowers[state.currentIndex];

    if (currentUsername === expectedUsername) {
      console.log(`\n🔍 [${state.currentIndex + 1}/${state.missingFollowers.length}] Analyzing @${expectedUsername}...`);

      await this.sleep(3000); // Attendre que la page charge

      const pageContent = document.body.textContent || '';
      const pageHTML = document.body.innerHTML || '';

      // Classifier
      if (pageContent.includes('Vous ne pouvez pas accéder') || 
          pageContent.includes("You can't access") ||
          pageContent.includes('This Account is Private')) {
        console.log(`🚫 @${expectedUsername} classified as BLOCKED`);
        state.results.blocked.push(expectedUsername);
      } else if (pageContent.includes('Utilisateur introuvable') || 
                 pageContent.includes('Sorry, this page') ||
                 pageContent.includes("isn't available") ||
                 pageContent.includes('Page not found') ||
                 pageHTML.includes('Page Not Found')) {
        console.log(`❌ @${expectedUsername} classified as DELETED/NOT FOUND`);
        state.results.notFoundOnInstagram.push(expectedUsername);
      } else {
        console.log(`👋 @${expectedUsername} classified as UNFOLLOWED`);
        state.results.unfollowed.push(expectedUsername);
      }

      // Passer au suivant
      state.currentIndex++;
      localStorage.setItem('unfollowerCheckState', JSON.stringify(state));

      // Délai aléatoire
      const delay = 5000 + Math.random() * 5000;
      const delaySec = Math.round(delay / 1000);
      console.log(`⏸️ Waiting ${delaySec} seconds before next check...`);
      await this.sleep(delay);

      // Naviguer vers le prochain ou revenir au profil
      if (state.currentIndex < state.missingFollowers.length) {
        const nextUsername = state.missingFollowers[state.currentIndex];
        console.log(`➡️ Navigating to @${nextUsername}...`);
        window.location.href = `https://www.instagram.com/${nextUsername}/`;
      } else {
        console.log(`🏠 Returning to profile @${state.myUsername}...`);
        window.location.href = `https://www.instagram.com/${state.myUsername}/`;
      }
    } else {
      // On est sur une mauvaise page (pas celle attendue)
      console.log(`⚠️ Wrong page! Expected @${expectedUsername} but on @${currentUsername}`);
      console.log(`➡️ Redirecting to @${expectedUsername}...`);
      window.location.href = `https://www.instagram.com/${expectedUsername}/`;
    }
  }
}
