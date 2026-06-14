export class DOMObserver {
    constructor() {
        this.observers = [];
        this.callbacks = {};
    }
    onProfileVisit(callback) {
        this.callbacks.onProfileVisit = callback;
    }
    onFollowerDetected(callback) {
        this.callbacks.onFollowerDetected = callback;
    }
    onUnfollowerDetected(callback) {
        this.callbacks.onUnfollowerDetected = callback;
    }
    onEngagement(callback) {
        this.callbacks.onEngagement = callback;
    }
    start() {
        this.observeDOM();
        this.observeClicks();
        this.observeScrolls();
        console.log('👀 DOM observation started');
    }
    stop() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        console.log('🛑 DOM observation stopped');
    }
    observeDOM() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.processNode(node);
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
    processNode(node) {
        const links = node.querySelectorAll('a[href^="/"]');
        links.forEach((link) => {
            const href = link.getAttribute('href');
            if (href && this.isProfileLink(href)) {
                const username = this.extractUsernameFromLink(href);
                if (username && this.callbacks.onProfileVisit) {
                    this.callbacks.onProfileVisit(username);
                }
            }
        });
        if (this.isFollowerElement(node)) {
            const followerData = this.extractFollowerData(node);
            if (followerData && this.callbacks.onFollowerDetected) {
                this.callbacks.onFollowerDetected(followerData);
            }
        }
    }
    observeClicks() {
        document.addEventListener('click', (event) => {
            const target = event.target;
            if (target.closest('[aria-label*="Like"]') || target.closest('[aria-label*="J\'aime"]')) {
                this.trackEngagement('like', target);
            }
            else if (target.closest('[aria-label*="Comment"]') || target.closest('[aria-label*="Commenter"]')) {
                this.trackEngagement('comment', target);
            }
            else if (target.closest('[aria-label*="Share"]') || target.closest('[aria-label*="Partager"]')) {
                this.trackEngagement('share', target);
            }
            else if (target.closest('[aria-label*="Save"]') || target.closest('[aria-label*="Enregistrer"]')) {
                this.trackEngagement('save', target);
            }
        }, true);
    }
    observeScrolls() {
        let scrollTimeout;
        let scrollStart = Date.now();
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollDuration = Date.now() - scrollStart;
                if (this.callbacks.onEngagement) {
                    this.callbacks.onEngagement({
                        type: 'scroll',
                        duration: scrollDuration,
                        scrollY: window.scrollY,
                    });
                }
                scrollStart = Date.now();
            }, 1000);
        });
    }
    trackEngagement(action, element) {
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
    isProfileLink(href) {
        return /^\/[a-zA-Z0-9._]+\/?$/.test(href) &&
            !href.includes('/explore') &&
            !href.includes('/reels') &&
            !href.includes('/p/');
    }
    extractUsernameFromLink(href) {
        const match = href.match(/^\/([a-zA-Z0-9._]+)/);
        return match ? match[1] : null;
    }
    isFollowerElement(element) {
        return element.querySelector('a[href^="/"]') !== null &&
            element.querySelector('img[alt*="photo"]') !== null;
    }
    extractFollowerData(element) {
        const link = element.querySelector('a[href^="/"]');
        const img = element.querySelector('img');
        if (!link)
            return null;
        const href = link.getAttribute('href');
        const username = href ? this.extractUsernameFromLink(href) : null;
        const avatarUrl = img?.getAttribute('src') || undefined;
        if (!username)
            return null;
        return { username, avatarUrl };
    }
    extractPostId(element) {
        if (!element)
            return null;
        const link = element.querySelector('a[href*="/p/"]');
        if (!link)
            return null;
        const href = link.getAttribute('href');
        const match = href?.match(/\/p\/([^\/]+)/);
        return match ? match[1] : null;
    }
}
