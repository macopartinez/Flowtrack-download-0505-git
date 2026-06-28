/**
 * Instagram Modal Scroller
 * 
 * Scroll intelligent et adaptatif pour le modal followers/following d'Instagram.
 * Inspiré d'OpenCLI mais optimisé pour un comportement humain indétectable.
 * 
 * Fonctionnalités :
 * - Scroll progressif avec variation naturelle
 * - Détection automatique de la fin de liste
 * - Attente intelligente du chargement DOM
 * - Extraction en temps réel pendant le scroll
 * - Gestion d'erreurs robuste
 */

export interface ScrollProgress {
    totalFollowers: number;
    newFollowersThisScroll: number;
    scrollPosition: number;
    isEndReached: boolean;
    estimatedRemaining?: number;
}

export interface ScrollOptions {
    maxScrollAttempts?: number;
    scrollDelay?: number;
    waitForLoadTimeout?: number;
    onProgress?: (progress: ScrollProgress) => void;
}

export class InstagramModalScroller {
    private modalSelector = 'div[role="dialog"] div._aano';
    private followerItemSelector = 'div._aano > div > div';
    private scrollContainer: HTMLElement | null = null;
    private lastFollowerCount = 0;
    private stuckCount = 0;
    private maxStuckAttempts: number;
    private scrollDelay: number;
    private waitForLoadTimeout: number;
    private onProgress?: (progress: ScrollProgress) => void;

    constructor(options: ScrollOptions = {}) {
        this.maxStuckAttempts = options.maxScrollAttempts || 10; // 10 tentatives au lieu de 3
        this.scrollDelay = options.scrollDelay || 250;
        this.waitForLoadTimeout = options.waitForLoadTimeout || 5000; // 5s au lieu de 3s
        this.onProgress = options.onProgress;
    }

    /**
     * Scroll jusqu'à la fin du modal et retourne tous les usernames
     */
    async scrollToEnd(): Promise<string[]> {
        this.scrollContainer = this.findScrollContainer();
        if (!this.scrollContainer) {
            throw new Error('Modal followers non trouvé. Assurez-vous que le modal est ouvert.');
        }

        const allFollowers: string[] = [];
        let isEndReached = false;
        let scrollAttempt = 0;

        console.log('🚀 Début du scroll intelligent pour capturer TOUS les followers...');

        while (!isEndReached) {
            scrollAttempt++;

            // 1. Scroll humain avec variation
            const scrolled = await this.humanScroll();
            
            // 2. Attendre le chargement DOM
            await this.waitForNewFollowers();
            
            // 3. Extraire les followers visibles dans cette portion
            const visibleFollowers = this.extractVisibleFollowers();
            let newCount = 0;

            visibleFollowers.forEach(username => {
                if (!allFollowers.includes(username)) {
                    allFollowers.push(username);
                    newCount++;
                }
            });
            
            // 4. Détecter la fin
            isEndReached = this.isEndOfList(allFollowers.length);
            
            // 5. Callback de progression
            if (this.onProgress) {
                this.onProgress({
                    totalFollowers: allFollowers.length,
                    newFollowersThisScroll: newCount,
                    scrollPosition: this.scrollContainer.scrollTop,
                    isEndReached,
                });
            }

            // 6. Log progress
            console.log(
                `📊 Scroll #${scrollAttempt}: ${allFollowers.length} followers capturés ` +
                `(+${newCount} dans cette portion) | Position: ${Math.round(this.scrollContainer.scrollTop)}px`
            );

            // 7. Sécurité : limite de scrolls
            if (scrollAttempt > 100) {
                console.warn('⚠️ Limite de 100 scrolls atteinte. Arrêt.');
                break;
            }
        }

        console.log(`✅ Scroll terminé : ${allFollowers.length} followers capturés`);
        return allFollowers;
    }

    /**
     * Trouve le conteneur scrollable du modal
     */
    private findScrollContainer(): HTMLElement | null {
        const modal = document.querySelector('[role="dialog"]');
        if (!modal) {
            console.error('❌ Modal non trouvé');
            return null;
        }

        console.log('🔍 Recherche du conteneur scrollable...');

        // Stratégie 1: Sélecteurs CSS spécifiques
        const selectors = [
            'div[role="dialog"] div._aano',
            'div[role="dialog"] div[style*="overflow"]',
            'div[role="dialog"] > div > div > div:nth-child(2)',
        ];

        for (const selector of selectors) {
            const container = document.querySelector<HTMLElement>(selector);
            if (container && container.scrollHeight > container.clientHeight) {
                console.log(`✅ Conteneur scrollable trouvé (sélecteur) : ${selector}`);
                console.log(`📏 scrollHeight=${container.scrollHeight}, clientHeight=${container.clientHeight}`);
                return container;
            }
        }

        // Stratégie 2: Chercher tous les divs avec overflow dans le modal
        console.log('🔍 Stratégie 2: Recherche par overflow...');
        const allDivs = modal.querySelectorAll('div');
        for (const div of Array.from(allDivs)) {
            const style = window.getComputedStyle(div);
            const hasOverflow = style.overflow === 'auto' || 
                               style.overflow === 'scroll' || 
                               style.overflowY === 'auto' || 
                               style.overflowY === 'scroll';
            
            if (hasOverflow && div.scrollHeight > div.clientHeight) {
                console.log(`✅ Conteneur scrollable trouvé (overflow) : ${div.className}`);
                console.log(`📏 scrollHeight=${div.scrollHeight}, clientHeight=${div.clientHeight}`);
                return div as HTMLElement;
            }
        }

        // Stratégie 3: Utiliser le modal lui-même
        console.log('🔍 Stratégie 3: Utilisation du modal...');
        const modalElement = modal as HTMLElement;
        if (modalElement.scrollHeight > modalElement.clientHeight) {
            console.log(`✅ Utilisation du modal comme conteneur`);
            console.log(`📏 scrollHeight=${modalElement.scrollHeight}, clientHeight=${modalElement.clientHeight}`);
            return modalElement;
        }

        // Stratégie 4: Chercher le premier div avec beaucoup de contenu
        console.log('🔍 Stratégie 4: Recherche par taille...');
        for (const div of Array.from(allDivs)) {
            const htmlDiv = div as HTMLElement;
            if (htmlDiv.scrollHeight > 500) { // Au moins 500px de contenu
                console.log(`✅ Conteneur trouvé par taille : ${htmlDiv.className}`);
                console.log(`📏 scrollHeight=${htmlDiv.scrollHeight}, clientHeight=${htmlDiv.clientHeight}`);
                return htmlDiv;
            }
        }

        console.error('❌ Aucun conteneur scrollable trouvé');
        return null;
    }

    /**
     * Scroll progressif avec variation humaine naturelle
     * Basé sur les patterns observés dans waler-recording-1779454178367.json
     */
    private async humanScroll(): Promise<number> {
        if (!this.scrollContainer) return 0;

        const currentScroll = this.scrollContainer.scrollTop;
        const maxScroll = this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight;

        // Si déjà en bas, ne pas scroller
        if (currentScroll >= maxScroll - 10) {
            return 0;
        }

        // Variation naturelle du scroll (comme dans l'enregistrement)
        // Plus de variation pour éviter la détection
        const baseScroll = 300 + Math.random() * 200; // 300-500px (plus variable)
        const variation = Math.random() * 200 - 100; // ±100px
        const scrollAmount = Math.min(baseScroll + variation, maxScroll - currentScroll);

        // Scroll progressif (pas instantané) — simule le scroll à la molette
        const steps = 5 + Math.floor(Math.random() * 5); // 5-9 micro-scrolls (plus variable)
        const stepSize = scrollAmount / steps;
        const stepDelay = 16 + Math.floor(Math.random() * 20); // 16-36ms (variation plus large)

        for (let i = 0; i < steps; i++) {
            this.scrollContainer.scrollTop += stepSize;
            await this.sleep(stepDelay);
        }

        // Pause aléatoire après scroll (comme un humain qui lit)
        // Variation beaucoup plus large : 400-1000ms
        const pauseTime = this.scrollDelay + Math.random() * 600;
        await this.sleep(pauseTime);

        return scrollAmount;
    }

    /**
     * Attend que plus de followers soient chargés dans le DOM (lazy loading)
     */
    private async waitForNewFollowers(): Promise<void> {
        const maxWait = this.waitForLoadTimeout;
        const startTime = Date.now();
        const initialCount = this.getCurrentFollowerCount();

        while (Date.now() - startTime < maxWait) {
            await this.sleep(100);
            const currentCount = this.getCurrentFollowerCount();
            
            if (currentCount > initialCount) {
                // Plus de followers chargés — attendre un peu plus pour le rendu complet
                await this.sleep(200);
                return;
            }
        }

        // Timeout — probablement la fin de la liste ou problème réseau
        console.log('⏱️ Timeout : aucun follower supplémentaire chargé (fin de liste probable)');
    }

    /**
     * Compte le nombre d'éléments followers actuellement dans le DOM
     * Pattern OpenCLI: compter les liens dans le modal
     */
    private getCurrentFollowerCount(): number {
        const modal = document.querySelector('div[role="dialog"]');
        if (!modal) return 0;
        return modal.querySelectorAll('a[href^="/"]').length;
    }

    /**
     * Extrait les usernames visibles dans le modal
     * Pattern inspiré d'OpenCLI/Playwright agents
     */
    private extractVisibleFollowers(): string[] {
        const followers: string[] = [];
        const seen = new Set<string>(); // Éviter les doublons

        // Pattern OpenCLI: div[role="dialog"] a[href^="/"]
        const modal = document.querySelector('div[role="dialog"]');
        if (!modal) {
            console.warn('⚠️ Modal not found');
            return followers;
        }

        // Chercher tous les liens de profil (pattern OpenCLI)
        const links = modal.querySelectorAll('a[href^="/"]');

        links.forEach(linkEl => {
            const href = linkEl.getAttribute('href');
            if (href) {
                // Pattern OpenCLI: href.strip('/').split('/')[0]
                const username = href
                    .replace(/^\//, '')    // strip('/') initial
                    .replace(/\/$/, '')    // strip('/') final
                    .split('/')[0];        // Prendre le premier segment
                
                // Pattern OpenCLI: filtrer explore, reels, direct
                const invalidPrefixes = ['explore', 'p', 'reel', 'reels', 'stories', 'direct', 'accounts'];
                const isValid = username && 
                               username.length > 0 && 
                               !invalidPrefixes.includes(username) &&
                               !seen.has(username);
                
                if (isValid) {
                    seen.add(username);
                    followers.push(username);
                }
            }
        });

        console.log(`✅ Extracted ${followers.length} unique followers from ${links.length} links`);
        return followers;
    }

    /**
     * Détecte si on a atteint la fin de la liste
     */
    private isEndOfList(currentCount: number): boolean {
        // Si le nombre de followers n'a pas changé après plusieurs scrolls
        if (currentCount === this.lastFollowerCount) {
            this.stuckCount++;
            console.log(`🔄 Aucun follower supplémentaire chargé (${this.stuckCount}/${this.maxStuckAttempts})`);
        } else {
            this.stuckCount = 0;
            this.lastFollowerCount = currentCount;
        }

        return this.stuckCount >= this.maxStuckAttempts;
    }

    /**
     * Vérifie si le modal est toujours ouvert
     */
    isModalOpen(): boolean {
        return document.querySelector('div[role="dialog"]') !== null;
    }

    /**
     * Ferme le modal
     */
    closeModal(): void {
        const closeButton = document.querySelector('div[role="dialog"] button[aria-label*="Close"]');
        if (closeButton instanceof HTMLElement) {
            closeButton.click();
            console.log('✅ Modal fermé');
        }
    }

    /**
     * Utilitaire : sleep
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Reset l'état du scroller
     */
    reset(): void {
        this.scrollContainer = null;
        this.lastFollowerCount = 0;
        this.stuckCount = 0;
    }
}
