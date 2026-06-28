/**
 * Follower Extractor
 * 
 * Extrait les données détaillées de chaque follower depuis le modal Instagram.
 * Complète le scroller en enrichissant les données avec avatar, nom complet, etc.
 */

export interface FollowerData {
    username: string;
    fullName?: string;
    avatarUrl?: string;
    isVerified: boolean;
    isPrivate?: boolean;
    followsYou?: boolean;
    timestamp: number;
}

export interface ExtractionStats {
    total: number;
    withAvatar: number;
    withFullName: number;
    verified: number;
    private: number;
    followsYou: number;
}

export class FollowerExtractor {
    private followerItemSelector = 'div._aano > div > div';
    private cache: Map<string, FollowerData> = new Map();

    /**
     * Extrait les données complètes de tous les followers visibles
     */
    extractAllVisible(): FollowerData[] {
        const elements = document.querySelectorAll(this.followerItemSelector);
        const followers: FollowerData[] = [];

        elements.forEach(el => {
            const data = this.extractFromElement(el as HTMLElement);
            if (data) {
                // Utiliser le cache pour éviter de re-extraire
                const cached = this.cache.get(data.username);
                if (cached) {
                    followers.push(cached);
                } else {
                    this.cache.set(data.username, data);
                    followers.push(data);
                }
            }
        });

        return followers;
    }

    /**
     * Extrait les données d'un seul élément follower
     */
    private extractFromElement(element: HTMLElement): FollowerData | null {
        try {
            // 1. Username (obligatoire)
            const linkEl = element.querySelector('a[href^="/"]');
            if (!linkEl) return null;

            const href = linkEl.getAttribute('href');
            if (!href) return null;

            const username = href.replace(/^\//, '').replace(/\/$/, '');
            if (!username || username.includes('/') || username === 'explore') {
                return null;
            }

            // 2. Avatar URL
            const avatarImg = element.querySelector('img');
            const avatarUrl = avatarImg?.getAttribute('src') || undefined;

            // 3. Full Name
            const fullNameEl = element.querySelector('span > span');
            const fullName = fullNameEl?.textContent?.trim() || undefined;

            // 4. Verified badge
            const verifiedBadge = element.querySelector('svg[aria-label*="Verified"]');
            const isVerified = verifiedBadge !== null;

            // 5. "Follows you" badge
            const followsYouEl = element.querySelector('span');
            const followsYouText = followsYouEl?.textContent?.toLowerCase() || '';
            const followsYou = followsYouText.includes('follows you') || 
                              followsYouText.includes('vous suit');

            // 6. Private account (si visible dans le modal)
            // Note: pas toujours disponible dans le modal followers
            const isPrivate = undefined;

            return {
                username,
                fullName,
                avatarUrl,
                isVerified,
                isPrivate,
                followsYou,
                timestamp: Date.now(),
            };
        } catch (error) {
            console.error('Erreur extraction follower:', error);
            return null;
        }
    }

    /**
     * Extrait uniquement les usernames (rapide)
     */
    extractUsernames(): string[] {
        const elements = document.querySelectorAll(this.followerItemSelector);
        const usernames: string[] = [];

        elements.forEach(el => {
            const linkEl = el.querySelector('a[href^="/"]');
            if (linkEl) {
                const href = linkEl.getAttribute('href');
                if (href) {
                    const username = href.replace(/^\//, '').replace(/\/$/, '');
                    if (username && !username.includes('/') && username !== 'explore') {
                        usernames.push(username);
                    }
                }
            }
        });

        return usernames;
    }

    /**
     * Statistiques d'extraction
     */
    getStats(): ExtractionStats {
        const followers = Array.from(this.cache.values());

        return {
            total: followers.length,
            withAvatar: followers.filter(f => f.avatarUrl).length,
            withFullName: followers.filter(f => f.fullName).length,
            verified: followers.filter(f => f.isVerified).length,
            private: followers.filter(f => f.isPrivate === true).length,
            followsYou: followers.filter(f => f.followsYou === true).length,
        };
    }

    /**
     * Récupère un follower depuis le cache
     */
    getCached(username: string): FollowerData | undefined {
        return this.cache.get(username);
    }

    /**
     * Récupère tous les followers du cache
     */
    getAllCached(): FollowerData[] {
        return Array.from(this.cache.values());
    }

    /**
     * Vide le cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Exporte les données en JSON
     */
    exportJSON(): string {
        const followers = this.getAllCached();
        return JSON.stringify({
            extractedAt: new Date().toISOString(),
            total: followers.length,
            followers,
            stats: this.getStats(),
        }, null, 2);
    }

    /**
     * Compare deux listes de followers pour détecter les changements
     */
    static compareFollowers(
        oldFollowers: string[],
        newFollowers: string[]
    ): {
        added: string[];
        removed: string[];
        unchanged: string[];
    } {
        const oldSet = new Set(oldFollowers);
        const newSet = new Set(newFollowers);

        const added = newFollowers.filter(u => !oldSet.has(u));
        const removed = oldFollowers.filter(u => !newSet.has(u));
        const unchanged = newFollowers.filter(u => oldSet.has(u));

        return { added, removed, unchanged };
    }

    /**
     * Détecte les unfollowers depuis la dernière extraction
     */
    detectUnfollowers(previousUsernames: string[]): string[] {
        const currentUsernames = Array.from(this.cache.keys());
        const comparison = FollowerExtractor.compareFollowers(
            previousUsernames,
            currentUsernames
        );
        return comparison.removed;
    }

    /**
     * Détecte les nouveaux followers depuis la dernière extraction
     */
    detectNewFollowers(previousUsernames: string[]): string[] {
        const currentUsernames = Array.from(this.cache.keys());
        const comparison = FollowerExtractor.compareFollowers(
            previousUsernames,
            currentUsernames
        );
        return comparison.added;
    }

    /**
     * Enrichit une liste de usernames avec les données complètes
     */
    enrichUsernames(usernames: string[]): FollowerData[] {
        return usernames
            .map(username => this.cache.get(username))
            .filter((data): data is FollowerData => data !== undefined);
    }

    /**
     * Filtre les followers selon des critères
     */
    filter(predicate: (follower: FollowerData) => boolean): FollowerData[] {
        return this.getAllCached().filter(predicate);
    }

    /**
     * Exemples de filtres prédéfinis
     */
    getVerifiedFollowers(): FollowerData[] {
        return this.filter(f => f.isVerified);
    }

    getFollowersWhoFollowYou(): FollowerData[] {
        return this.filter(f => f.followsYou === true);
    }

    getFollowersWithoutAvatar(): FollowerData[] {
        return this.filter(f => !f.avatarUrl);
    }

    /**
     * Recherche un follower par username (case-insensitive)
     */
    search(query: string): FollowerData[] {
        const lowerQuery = query.toLowerCase();
        return this.getAllCached().filter(f => 
            f.username.toLowerCase().includes(lowerQuery) ||
            f.fullName?.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Trie les followers par ordre alphabétique
     */
    sortByUsername(ascending = true): FollowerData[] {
        const followers = this.getAllCached();
        return followers.sort((a, b) => {
            const comparison = a.username.localeCompare(b.username);
            return ascending ? comparison : -comparison;
        });
    }

    /**
     * Trie les followers par timestamp (plus récent en premier)
     */
    sortByTimestamp(ascending = false): FollowerData[] {
        const followers = this.getAllCached();
        return followers.sort((a, b) => {
            const comparison = a.timestamp - b.timestamp;
            return ascending ? comparison : -comparison;
        });
    }
}
