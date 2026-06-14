/**
 * Instagram Search Automator
 * 
 * Automatise la recherche de usernames dans Instagram
 * - Tape dans la barre de recherche
 * - Attend les résultats
 * - Clique sur le premier résultat
 * - Délais naturels pour éviter la détection
 */

export interface SearchResult {
  found: boolean;
  username: string;
  profileUrl?: string;
}

export class InstagramSearchAutomator {
  private readonly CHAR_DELAY_MIN = 80;
  private readonly CHAR_DELAY_MAX = 150;
  private readonly SEARCH_DELAY_MIN = 10000; // 10 secondes
  private readonly SEARCH_DELAY_MAX = 15000; // 15 secondes

  /**
   * Navigue vers la page d'accueil Instagram
   */
  async navigateToHome(): Promise<boolean> {
    try {
      if (window.location.pathname === '/') {
        console.log('✅ Already on home page');
        return true;
      }

      console.log('🏠 Navigating to home page...');
      window.location.href = 'https://www.instagram.com/';
      
      // Attendre le chargement
      await this.sleep(3000);
      return true;
    } catch (error) {
      console.error('Error navigating to home:', error);
      return false;
    }
  }

  /**
   * Ouvre la barre de recherche Instagram
   */
  async openSearchBar(): Promise<boolean> {
    try {
      console.log('🔍 Opening search bar...');

      // Chercher la barre de recherche (plusieurs stratégies)
      let searchInput: HTMLInputElement | null = null;

      // Stratégie 1: Input avec placeholder "Search"
      searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      
      if (!searchInput) {
        // Stratégie 2: Input avec aria-label
        searchInput = document.querySelector('input[aria-label*="Search"]') as HTMLInputElement;
      }

      if (!searchInput) {
        // Stratégie 3: Cliquer sur l'icône de recherche pour ouvrir la barre
        const searchIcon = Array.from(document.querySelectorAll('a, span')).find(el => {
          const text = el.textContent?.toLowerCase() || '';
          const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
          return text.includes('search') || ariaLabel.includes('search') || text.includes('recherche');
        });

        if (searchIcon) {
          console.log('🔍 Clicking search icon...');
          (searchIcon as HTMLElement).click();
          await this.sleep(1000);
          
          // Réessayer de trouver l'input
          searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        }
      }

      if (!searchInput) {
        console.error('❌ Search bar not found');
        return false;
      }

      // Cliquer sur l'input pour le focus
      searchInput.focus();
      searchInput.click();
      await this.sleep(500);

      console.log('✅ Search bar opened');
      return true;

    } catch (error) {
      console.error('Error opening search bar:', error);
      return false;
    }
  }

  /**
   * Tape un username dans la barre de recherche avec délai naturel
   */
  async typeUsername(username: string): Promise<boolean> {
    try {
      console.log(`⌨️ Typing username: @${username}`);

      const searchInput = document.querySelector('input[placeholder*="Search"], input[aria-label*="Search"]') as HTMLInputElement;
      
      if (!searchInput) {
        console.error('❌ Search input not found');
        return false;
      }

      // Vider le champ d'abord
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      await this.sleep(200);

      // Taper caractère par caractère avec délai naturel
      for (let i = 0; i < username.length; i++) {
        const char = username[i];
        searchInput.value += char;
        
        // Dispatch input event pour déclencher la recherche
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Délai naturel entre les caractères (80-150ms avec variation)
        const delay = this.CHAR_DELAY_MIN + Math.random() * (this.CHAR_DELAY_MAX - this.CHAR_DELAY_MIN);
        await this.sleep(delay);
      }

      console.log(`✅ Typed: ${username}`);
      return true;

    } catch (error) {
      console.error('Error typing username:', error);
      return false;
    }
  }

  /**
   * Attend les résultats de recherche
   */
  async waitForResults(timeout: number = 5000): Promise<boolean> {
    try {
      console.log('⏳ Waiting for search results...');
      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        // Chercher les résultats de recherche
        const results = document.querySelectorAll('a[href^="/"]');
        
        // Vérifier qu'il y a au moins un résultat de profil
        for (const result of Array.from(results)) {
          const href = result.getAttribute('href') || '';
          const match = href.match(/^\/([a-zA-Z0-9._]+)\/?$/);
          
          if (match) {
            console.log('✅ Search results loaded');
            return true;
          }
        }

        await this.sleep(200);
      }

      console.log('⏱️ No results found (timeout)');
      return false;

    } catch (error) {
      console.error('Error waiting for results:', error);
      return false;
    }
  }

  /**
   * Clique sur le premier résultat de recherche
   */
  async clickFirstResult(expectedUsername: string): Promise<boolean> {
    try {
      console.log(`🖱️ Clicking first result for @${expectedUsername}...`);

      // Chercher le résultat correspondant au username
      const links = document.querySelectorAll('a[href^="/"]');
      
      for (const link of Array.from(links)) {
        const href = link.getAttribute('href') || '';
        const match = href.match(/^\/([a-zA-Z0-9._]+)\/?$/);
        
        if (match && match[1].toLowerCase() === expectedUsername.toLowerCase()) {
          console.log(`✅ Found result: ${href}`);
          (link as HTMLElement).click();
          
          // Attendre le chargement du profil
          await this.sleep(3000);
          return true;
        }
      }

      console.log(`❌ No result found for @${expectedUsername}`);
      return false;

    } catch (error) {
      console.error('Error clicking result:', error);
      return false;
    }
  }

  /**
   * Recherche un username complet (toutes les étapes)
   */
  async searchUsername(username: string): Promise<SearchResult> {
    try {
      console.log(`🔍 Searching for @${username}...`);

      // 1. Ouvrir la barre de recherche
      const searchOpened = await this.openSearchBar();
      if (!searchOpened) {
        return { found: false, username };
      }

      // 2. Taper le username
      const typed = await this.typeUsername(username);
      if (!typed) {
        return { found: false, username };
      }

      // 3. Attendre les résultats
      await this.sleep(2000); // 2 secondes pour les résultats
      const hasResults = await this.waitForResults();
      
      if (!hasResults) {
        console.log(`❌ @${username} not found on Instagram`);
        return { found: false, username };
      }

      // 4. Cliquer sur le premier résultat
      const clicked = await this.clickFirstResult(username);
      
      if (clicked) {
        const profileUrl = window.location.href;
        console.log(`✅ @${username} found and opened: ${profileUrl}`);
        return { found: true, username, profileUrl };
      } else {
        console.log(`❌ @${username} not found in results`);
        return { found: false, username };
      }

    } catch (error) {
      console.error(`Error searching for @${username}:`, error);
      return { found: false, username };
    }
  }

  /**
   * Supprime l'historique de recherche Instagram
   */
  async clearSearchHistory(username: string): Promise<boolean> {
    try {
      console.log(`🗑️ Clearing search history for @${username}...`);

      // 1. Ouvrir la barre de recherche
      const searchOpened = await this.openSearchBar();
      if (!searchOpened) {
        console.warn('Cannot open search bar to clear history');
        return false;
      }

      await this.sleep(500);

      // 2. Chercher le bouton "Recent" ou "Récent" pour voir l'historique
      const recentButtons = Array.from(document.querySelectorAll('span, div')).filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        return text === 'recent' || text === 'récent' || text === 'recents' || text === 'récents';
      });

      if (recentButtons.length === 0) {
        console.log('No recent searches found');
        return true;
      }

      // 3. Chercher les éléments de l'historique qui contiennent le username
      const searchHistoryItems = Array.from(document.querySelectorAll('a, div')).filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        const href = (el as HTMLAnchorElement).href || '';
        return text.includes(username.toLowerCase()) || href.includes(`/${username.toLowerCase()}`);
      });

      // 4. Pour chaque élément, chercher le bouton "X" ou "Remove" à proximité
      for (const item of searchHistoryItems) {
        // Chercher le bouton de suppression dans le parent ou les siblings
        const parent = item.closest('div[role="button"], div[tabindex]');
        if (!parent) continue;

        // Chercher le bouton X (généralement un SVG avec un path en forme de X)
        const deleteButton = parent.querySelector('svg[aria-label*="Remove"], svg[aria-label*="Supprimer"], button[aria-label*="Remove"], button[aria-label*="Supprimer"]');
        
        if (deleteButton) {
          console.log(`🗑️ Removing @${username} from search history...`);
          (deleteButton as HTMLElement).click();
          await this.sleep(300);
        } else {
          // Alternative: chercher un bouton avec un X ou une croix
          const buttons = parent.querySelectorAll('button, div[role="button"]');
          for (const btn of Array.from(buttons)) {
            const svg = btn.querySelector('svg');
            if (svg) {
              // Vérifier si c'est un SVG de suppression (généralement contient "line" ou "path" en forme de X)
              const paths = svg.querySelectorAll('path, line');
              if (paths.length > 0) {
                console.log(`🗑️ Removing @${username} from search history (alternative method)...`);
                (btn as HTMLElement).click();
                await this.sleep(300);
                break;
              }
            }
          }
        }
      }

      // 5. Fermer la barre de recherche en cliquant ailleurs
      const main = document.querySelector('main');
      if (main) {
        (main as HTMLElement).click();
        await this.sleep(300);
      }

      console.log(`✅ Search history cleared for @${username}`);
      return true;

    } catch (error) {
      console.error('Error clearing search history:', error);
      return false;
    }
  }

  /**
   * Retourne à la page d'accueil
   */
  async goBack(): Promise<void> {
    try {
      console.log('⬅️ Going back to home...');
      await this.navigateToHome();
    } catch (error) {
      console.error('Error going back:', error);
    }
  }

  /**
   * Délai avant la prochaine recherche (10-15 secondes)
   */
  async delayBeforeNextSearch(): Promise<void> {
    const delay = this.SEARCH_DELAY_MIN + Math.random() * (this.SEARCH_DELAY_MAX - this.SEARCH_DELAY_MIN);
    console.log(`⏳ Waiting ${Math.round(delay / 1000)}s before next search...`);
    await this.sleep(delay);
  }

  /**
   * Pause aléatoire occasionnelle (5% de chance)
   */
  async randomPause(): Promise<void> {
    if (Math.random() < 0.05) {
      const pauseDuration = 500 + Math.random() * 1000; // 500-1500ms
      console.log(`⏸️ Random pause: ${Math.round(pauseDuration)}ms`);
      await this.sleep(pauseDuration);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
