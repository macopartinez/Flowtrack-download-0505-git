export class DOMObserver {
  private observers: MutationObserver[] = [];
  private callbacks: {
    onProfileVisit?: (username: string) => void;
    onFollowerDetected?: (follower: { username: string; avatarUrl?: string }) => void;
    onUnfollowerDetected?: (unfollower: { username: string; avatarUrl?: string }) => void;
    onEngagement?: (engagement: any) => void;
  } = {};

  onProfileVisit(callback: (username: string) => void) {
    this.callbacks.onProfileVisit = callback;
  }

  onFollowerDetected(callback: (follower: { username: string; avatarUrl?: string }) => void) {
    this.callbacks.onFollowerDetected = callback;
  }

  onUnfollowerDetected(callback: (unfollower: { username: string; avatarUrl?: string }) => void) {
    this.callbacks.onUnfollowerDetected = callback;
  }

  onEngagement(callback: (engagement: any) => void) {
    this.callbacks.onEngagement = callback;
  }

  start() {
    this.observeDOM();
    this.observeClicks();
    this.observeURLChanges();
    this.observeFollowersModal();
    console.log('👀 DOM observation started');
  }

  stop() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    console.log('🛑 DOM observation stopped');
  }

  private observeDOM() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.processNode(node as Element);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.observers.push(observer);
  }

  private processNode(node: Element) {
    // Ne plus détecter les visites de profil ici (trop de faux positifs)
    // Les visites seront détectées via les clics et les changements d'URL
    
    if (this.isFollowerElement(node)) {
      console.log('👤 Follower element detected in DOM');
      const followerData = this.extractFollowerData(node);
      if (followerData) {
        console.log(`📦 Follower data extracted: @${followerData.username}`);
        if (this.callbacks.onFollowerDetected) {
          this.callbacks.onFollowerDetected(followerData);
        }
      } else {
        console.log('❌ Failed to extract follower data');
      }
    }
  }

  private observeClicks() {
    document.addEventListener('click', (event) => {
      const target = event.target as Element;
      
      // Détecter les clics sur les liens de profil
      const link = target.closest('a[href^="/"]') as HTMLAnchorElement;
      if (link) {
        const href = link.getAttribute('href');
        
        // Vérifier si c'est un lien vers une conversation DM
        if (href && href.startsWith('/direct/t/')) {
          console.log('🔍 DM conversation link clicked');
          // Attendre un peu que la page charge pour extraire le username
          setTimeout(() => {
            const headerLink = document.querySelector('header a[href^="/"]');
            if (headerLink) {
              const profileHref = headerLink.getAttribute('href');
              const username = profileHref?.match(/^\/([a-zA-Z0-9._]+)\/?$/)?.[1];
              if (username && this.callbacks.onProfileVisit) {
                console.log('✅ DM username extracted:', username);
                this.callbacks.onProfileVisit(username);
              }
            }
          }, 600);
        }
        // Vérifier si c'est un profil classique
        else if (href && this.isProfileLink(href)) {
          const username = this.extractUsernameFromLink(href);
          if (username && this.callbacks.onProfileVisit) {
            this.callbacks.onProfileVisit(username);
          }
        }
      }
      
      // Détecter les engagements
      if (target.closest('[aria-label*="Like"]') || target.closest('[aria-label*="J\'aime"]')) {
        this.trackEngagement('like', target);
      } else if (target.closest('[aria-label*="Comment"]') || target.closest('[aria-label*="Commenter"]')) {
        this.trackEngagement('comment', target);
      } else if (target.closest('[aria-label*="Share"]') || target.closest('[aria-label*="Partager"]')) {
        this.trackEngagement('share', target);
      } else if (target.closest('[aria-label*="Save"]') || target.closest('[aria-label*="Enregistrer"]')) {
        this.trackEngagement('save', target);
      }
    }, true);
  }

  private observeFollowersModal() {
    let scanTimeout: NodeJS.Timeout | null = null;
    
    // Observer l'apparition de la modal followers
    const modalObserver = new MutationObserver(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (modal) {
        // Vérifier qu'on est sur une PAGE PROFIL (pas une publication)
        const currentPath = window.location.pathname;
        const isProfilePage = /^\/[a-zA-Z0-9._]+\/?$/.test(currentPath);
        
        if (!isProfilePage) {
          console.log('🚫 Ignoring modal: not on profile page (path: ' + currentPath + ')');
          return;
        }
        
        // Vérifier que c'est bien un modal FOLLOWERS en comptant les liens de profil
        // Un modal followers contient plusieurs liens vers des profils utilisateurs
        const profileLinks = modal.querySelectorAll('a[href^="/"]');
        
        if (profileLinks.length < 3) {
          console.log('🚫 Ignoring modal: not enough profile links (' + profileLinks.length + ')');
          return;
        }
        
        console.log('📋 Followers modal detected, waiting for content to load...');
        
        // Annuler le scan précédent si la modal change
        if (scanTimeout) {
          clearTimeout(scanTimeout);
        }
        
        // Attendre que le contenu charge complètement (2 secondes)
        scanTimeout = setTimeout(() => {
          console.log('🔍 Modal content should be loaded, scanning now...');
          this.scanFollowersInModal(modal);
        }, 2000);
      }
    });

    modalObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.observers.push(modalObserver);
  }

  private scanFollowersInModal(modal: Element) {
    try {
      console.log(`🔍 Scanning followers modal...`);
      
      // Chercher TOUS les liens dans la modal
      const allLinks = modal.querySelectorAll('a[href^="/"]');
      console.log(`📊 Total links found: ${allLinks.length}`);
      
      if (allLinks.length === 0) {
        console.warn('⚠️ No links found in modal, aborting scan');
        return;
      }
      
      let profileCount = 0;
      const maxProfiles = 1; // On veut juste le PREMIER
      
      // Scanner tous les liens et compter les profils valides
      for (const link of Array.from(allLinks)) {
        try {
          const href = link.getAttribute('href');
          
          if (href) {
            // Extraire le username du lien (avec ou sans paramètres comme ?hl=en)
            const usernameMatch = href.match(/^\/([a-zA-Z0-9._]+)\/?(\?.*)?$/);
            
            if (usernameMatch) {
              const username = usernameMatch[1];
              
              // Ignorer les pages système
              const systemPages = ['explore', 'reels', 'direct', 'p', 'stories', 'tv', 'accounts'];
              
              if (!systemPages.includes(username)) {
                profileCount++;
                console.log(`👤 Profile #${profileCount}: @${username}`);
                
                // Si c'est le premier profil, on le prend !
                if (profileCount === maxProfiles) {
                  console.log(`✅ First follower in list: @${username}`);
                  
                  // Chercher l'avatar
                  const parent = link.closest('div');
                  const img = parent?.querySelector('img');
                  const avatarUrl = img?.getAttribute('src') || undefined;
                  
                  if (this.callbacks.onFollowerDetected) {
                    this.callbacks.onFollowerDetected({ username, avatarUrl });
                  }
                  
                  return; // Terminé !
                }
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ Could not extract username from element:', error);
          continue; // Continuer avec le prochain lien
        }
      }
      
      if (profileCount === 0) {
        console.log(`🚫 No valid profiles found in modal`);
      } else {
        console.log(`⚠️ Only found ${profileCount} profile(s), expected at least ${maxProfiles}`);
      }
    } catch (error) {
      console.error('❌ Failed to scan followers modal:', error);
    }
  }

  private observeURLChanges() {
    let lastUrl = window.location.href;
    
    // Observer les changements d'URL (pour les SPAs comme Instagram)
    const urlObserver = new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        
        // Vérifier si c'est une conversation DM
        if (currentUrl.includes('/direct/t/')) {
          setTimeout(() => {
            const headerLink = document.querySelector('header a[href^="/"]');
            if (headerLink) {
              const href = headerLink.getAttribute('href');
              const username = href?.match(/^\/([a-zA-Z0-9._]+)\/?$/)?.[1];
              if (username && this.callbacks.onProfileVisit) {
                this.callbacks.onProfileVisit(username);
              }
            }
          }, 500);
        }
        // Vérifier si c'est une page de profil
        else {
          const match = currentUrl.match(/instagram\.com\/([a-zA-Z0-9._]+)\/?$/);
          if (match && this.callbacks.onProfileVisit) {
            const username = match[1];
            if (username !== 'explore' && username !== 'reels' && username !== 'direct') {
              this.callbacks.onProfileVisit(username);
            }
          }
        }
      }
    });
    
    urlObserver.observe(document, { subtree: true, childList: true });
    this.observers.push(urlObserver);
  }

  private trackEngagement(action: string, element: Element) {
    const postElement = element.closest('article');
    const postId = this.extractPostId(postElement);

    if (this.callbacks.onEngagement) {
      this.callbacks.onEngagement({
        type: action,
        postId,
        timestamp: Date.now(),
      });
    }
  }

  private isProfileLink(href: string): boolean {
    return /^\/[a-zA-Z0-9._]+\/?$/.test(href) && 
           !href.includes('/explore') && 
           !href.includes('/reels') &&
           !href.includes('/p/');
  }

  private extractUsernameFromLink(href: string): string | null {
    const match = href.match(/^\/([a-zA-Z0-9._]+)/);
    return match ? match[1] : null;
  }

  private isFollowerElement(element: Element): boolean {
    return element.querySelector('a[href^="/"]') !== null &&
           element.querySelector('img[alt*="photo"]') !== null;
  }

  private extractFollowerData(element: Element): { username: string; avatarUrl?: string } | null {
    // Méthode 1: Chercher le lien de profil principal
    const links = element.querySelectorAll('a[href^="/"]');
    let username: string | null = null;
    let avatarUrl: string | undefined = undefined;

    // Trouver le premier lien qui pointe vers un profil (pas vers /p/, /reel/, etc.)
    for (const link of Array.from(links)) {
      const href = link.getAttribute('href');
      if (href && this.isProfileLink(href)) {
        username = this.extractUsernameFromLink(href);
        if (username) break;
      }
    }

    // Méthode 2: Si pas trouvé, chercher dans les spans (nom d'utilisateur en texte)
    if (!username) {
      const spans = element.querySelectorAll('span');
      for (const span of Array.from(spans)) {
        const text = span.textContent?.trim();
        // Username Instagram: lettres, chiffres, points, underscores
        if (text && /^[a-zA-Z0-9._]+$/.test(text) && text.length > 0 && text.length < 30) {
          username = text;
          break;
        }
      }
    }

    // Extraire l'avatar
    const img = element.querySelector('img');
    if (img) {
      avatarUrl = img.getAttribute('src') || undefined;
    }

    if (!username) {
      console.log('⚠️ Could not extract username from element:', element.innerHTML.substring(0, 200));
      return null;
    }

    return { username, avatarUrl };
  }

  private extractPostId(element: Element | null): string | null {
    if (!element) return null;
    
    const link = element.querySelector('a[href*="/p/"]');
    if (!link) return null;

    const href = link.getAttribute('href');
    const match = href?.match(/\/p\/([^\/]+)/);
    return match ? match[1] : null;
  }
}


