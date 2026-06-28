/**
 * Profile Analyzer
 * 
 * Analyse les profils Instagram pour détecter les blocages
 * Un profil vide (0 publications, 0 abonnés, avatar par défaut) = blocage
 */

export interface ProfileStats {
  posts: number;
  followers: number;
  following: number;
  hasCustomAvatar: boolean;
  username: string;
}

export class ProfileAnalyzer {
  /**
   * Extrait les statistiques d'un profil Instagram
   */
  extractProfileStats(): ProfileStats | null {
    try {
      // Extraire le username depuis l'URL
      const username = this.extractUsernameFromUrl();
      if (!username) {
        console.error('❌ Cannot extract username from URL');
        return null;
      }

      // Chercher les statistiques dans le header du profil
      const header = document.querySelector('header');
      if (!header) {
        console.error('❌ Profile header not found');
        return null;
      }

      // Méthode 1: Chercher les spans avec les chiffres
      const statSpans = header.querySelectorAll('span');
      const stats: number[] = [];

      for (const span of Array.from(statSpans)) {
        const text = span.textContent?.trim() || '';
        // Chercher les nombres (avec K, M pour milliers/millions)
        const match = text.match(/^([\d,\.]+)([KMk]?)$/);
        if (match) {
          let value = parseFloat(match[1].replace(/,/g, ''));
          const unit = match[2].toUpperCase();
          
          if (unit === 'K') value *= 1000;
          if (unit === 'M') value *= 1000000;
          
          stats.push(Math.floor(value));
        }
      }

      // Instagram affiche dans l'ordre: posts, followers, following
      let posts = 0;
      let followers = 0;
      let following = 0;

      if (stats.length >= 3) {
        posts = stats[0];
        followers = stats[1];
        following = stats[2];
      } else {
        // Méthode 2: Chercher via les liens et aria-labels
        const links = header.querySelectorAll('a');
        
        for (const link of Array.from(links)) {
          const href = link.getAttribute('href') || '';
          const text = link.textContent?.trim() || '';
          
          if (href.includes('/followers/')) {
            const match = text.match(/([\d,\.]+)([KMk]?)/);
            if (match) {
              followers = this.parseCount(match[1], match[2]);
            }
          } else if (href.includes('/following/')) {
            const match = text.match(/([\d,\.]+)([KMk]?)/);
            if (match) {
              following = this.parseCount(match[1], match[2]);
            }
          }
        }

        // Posts: chercher le texte "X posts" ou "X publications"
        const postsText = Array.from(statSpans).find(span => 
          span.textContent?.includes('post') || span.textContent?.includes('publication')
        );
        if (postsText) {
          const match = postsText.textContent?.match(/([\d,\.]+)([KMk]?)/);
          if (match) {
            posts = this.parseCount(match[1], match[2]);
          }
        }
      }

      // Vérifier l'avatar
      const hasCustomAvatar = this.hasCustomAvatar();

      const profileStats: ProfileStats = {
        posts,
        followers,
        following,
        hasCustomAvatar,
        username,
      };

      console.log('📊 Profile stats extracted:', profileStats);
      return profileStats;

    } catch (error) {
      console.error('Error extracting profile stats:', error);
      return null;
    }
  }

  /**
   * Parse un nombre avec unité (K, M)
   */
  private parseCount(value: string, unit: string): number {
    let num = parseFloat(value.replace(/,/g, ''));
    const upperUnit = unit.toUpperCase();
    
    if (upperUnit === 'K') num *= 1000;
    if (upperUnit === 'M') num *= 1000000;
    
    return Math.floor(num);
  }

  /**
   * Extrait le username depuis l'URL
   */
  private extractUsernameFromUrl(): string | null {
    const match = window.location.pathname.match(/^\/([a-zA-Z0-9._]+)/);
    return match ? match[1] : null;
  }

  /**
   * Vérifie si le profil a un avatar personnalisé (pas l'avatar par défaut)
   */
  private hasCustomAvatar(): boolean {
    try {
      // Chercher l'image de profil dans le header
      const header = document.querySelector('header');
      if (!header) return false;

      const img = header.querySelector('img');
      if (!img) return false;

      const src = img.getAttribute('src') || '';
      
      // L'avatar par défaut Instagram contient généralement "44884218_345707102882519_2446069589734326272_n.jpg"
      // ou est une image très petite (< 150x150)
      
      // Vérifier si c'est l'avatar par défaut connu
      if (src.includes('44884218_345707102882519') || src.includes('default_profile')) {
        return false;
      }

      // Vérifier la taille de l'image
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      // Avatar par défaut est généralement 150x150 ou moins
      // Avatar personnalisé est généralement plus grand
      if (width <= 150 && height <= 150) {
        return false;
      }

      return true;

    } catch (error) {
      console.error('Error checking avatar:', error);
      return true; // En cas d'erreur, on suppose que c'est un avatar personnalisé
    }
  }

  /**
   * Détermine si un profil est bloqué (profil vide)
   * Critères: 0 posts, 0 followers, 0 following, avatar par défaut
   */
  isBlocked(stats: ProfileStats): boolean {
    // Profil complètement vide = blocage
    if (stats.posts === 0 && stats.followers === 0 && stats.following === 0 && !stats.hasCustomAvatar) {
      console.log(`🚫 Profile @${stats.username} is BLOCKED (empty profile)`);
      return true;
    }

    // Profil presque vide (peut-être un nouveau compte ou blocage partiel)
    // On considère comme bloqué si: 0 posts ET 0 followers ET pas d'avatar
    if (stats.posts === 0 && stats.followers === 0 && !stats.hasCustomAvatar) {
      console.log(`🚫 Profile @${stats.username} is likely BLOCKED (no posts, no followers, default avatar)`);
      return true;
    }

    console.log(`✅ Profile @${stats.username} is NORMAL (not blocked)`);
    return false;
  }

  /**
   * Attend que le profil soit complètement chargé
   */
  async waitForProfileLoad(timeout: number = 5000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const header = document.querySelector('header');
      if (header) {
        // Attendre un peu plus pour que les stats se chargent
        await this.sleep(500);
        return true;
      }
      await this.sleep(100);
    }

    console.error('⏱️ Timeout waiting for profile to load');
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
