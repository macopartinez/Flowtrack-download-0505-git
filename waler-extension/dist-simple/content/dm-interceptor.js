/**
 * Intercepteur de DMs Instagram
 * Capture et analyse les conversations en temps réel
 */
export class DMInterceptor {
    constructor() {
        this.conversations = new Map();
        this.messageObserver = null;
    }
    /**
     * Démarre l'interception des DMs
     */
    start(callbacks) {
        console.log('🔍 Starting DM interceptor...');
        this.onNewMessageCallback = callbacks.onNewMessage;
        this.onConversationUpdateCallback = callbacks.onConversationUpdate;
        // Intercepter les requêtes API Instagram pour les DMs
        this.interceptAPIRequests();
        // Observer les changements DOM dans la section messages
        this.observeMessagesDOM();
        // Charger les conversations existantes
        this.loadExistingConversations();
    }
    /**
     * Arrête l'interception
     */
    stop() {
        if (this.messageObserver) {
            this.messageObserver.disconnect();
            this.messageObserver = null;
        }
        console.log('🛑 DM interceptor stopped');
    }
    /**
     * Intercepte les requêtes API Instagram
     */
    interceptAPIRequests() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const response = await originalFetch(...args);
            const url = args[0].toString();
            // Intercepter les endpoints de messages
            if (url.includes('/api/v1/direct_v2/') || url.includes('/direct_v2/inbox/')) {
                this.handleAPIResponse(url, response.clone());
            }
            return response;
        };
        console.log('✅ API interceptor installed');
    }
    /**
     * Gère les réponses API Instagram
     */
    async handleAPIResponse(url, response) {
        try {
            const data = await response.json();
            // Inbox threads (liste des conversations)
            if (url.includes('/inbox/')) {
                this.parseInboxThreads(data);
            }
            // Thread messages (messages d'une conversation)
            if (url.includes('/thread/')) {
                this.parseThreadMessages(data);
            }
            // Pending inbox (demandes de messages)
            if (url.includes('/pending/')) {
                this.parsePendingMessages(data);
            }
        }
        catch (error) {
            // Ignorer les erreurs de parsing (certaines réponses ne sont pas JSON)
        }
    }
    /**
     * Parse les threads de l'inbox
     */
    parseInboxThreads(data) {
        if (!data.inbox || !data.inbox.threads)
            return;
        data.inbox.threads.forEach((thread) => {
            const conversation = this.parseThread(thread);
            if (conversation) {
                this.conversations.set(conversation.username, conversation);
                this.onConversationUpdateCallback?.(conversation);
            }
        });
        console.log(`📬 Loaded ${data.inbox.threads.length} conversations`);
    }
    /**
     * Parse les messages d'un thread
     */
    parseThreadMessages(data) {
        if (!data.thread)
            return;
        const conversation = this.parseThread(data.thread);
        if (conversation) {
            this.conversations.set(conversation.username, conversation);
            this.onConversationUpdateCallback?.(conversation);
            // Notifier pour chaque nouveau message
            conversation.messages.forEach(msg => {
                const dmMessage = this.convertToDMMessage(conversation.username, msg);
                this.onNewMessageCallback?.(dmMessage);
            });
        }
    }
    /**
     * Parse les messages en attente
     */
    parsePendingMessages(data) {
        if (!data.inbox || !data.inbox.threads)
            return;
        data.inbox.threads.forEach((thread) => {
            const conversation = this.parseThread(thread);
            if (conversation) {
                this.conversations.set(conversation.username, conversation);
            }
        });
        console.log(`📥 Loaded ${data.inbox.threads.length} pending conversations`);
    }
    /**
     * Parse un thread Instagram en Conversation
     */
    parseThread(thread) {
        try {
            // Obtenir l'utilisateur (premier utilisateur qui n'est pas nous)
            const currentUserId = this.getCurrentUserId();
            const otherUser = thread.users?.find((u) => u.pk !== currentUserId);
            if (!otherUser)
                return null;
            const username = otherUser.username;
            const messages = [];
            // Parser les messages
            if (thread.items) {
                thread.items.forEach((item) => {
                    const message = this.parseMessageItem(item, currentUserId);
                    if (message) {
                        messages.push(message);
                    }
                });
            }
            // Trier par timestamp (plus ancien en premier)
            messages.sort((a, b) => a.timestamp - b.timestamp);
            return {
                username,
                messages,
                lastMessageAt: messages.length > 0 ? messages[messages.length - 1].timestamp : Date.now(),
                messageCount: messages.length
            };
        }
        catch (error) {
            console.error('Error parsing thread:', error);
            return null;
        }
    }
    /**
     * Parse un item de message Instagram
     */
    parseMessageItem(item, currentUserId) {
        try {
            // Texte du message
            let text = '';
            if (item.item_type === 'text' && item.text) {
                text = item.text;
            }
            else if (item.item_type === 'link' && item.link?.text) {
                text = item.link.text;
            }
            else if (item.item_type === 'media' && item.media?.caption?.text) {
                text = item.media.caption.text;
            }
            else if (item.item_type === 'reel_share' && item.reel_share?.text) {
                text = item.reel_share.text;
            }
            else if (item.item_type === 'voice_media') {
                text = '[Message vocal]';
            }
            else if (item.item_type === 'media_share') {
                text = '[Partage de média]';
            }
            else {
                // Autres types de messages
                text = `[${item.item_type}]`;
            }
            return {
                text,
                timestamp: parseInt(item.timestamp) / 1000, // Convertir microsecondes en millisecondes
                isSent: item.user_id === currentUserId
            };
        }
        catch (error) {
            console.error('Error parsing message item:', error);
            return null;
        }
    }
    /**
     * Convertit un Message en DMMessage
     */
    convertToDMMessage(username, message) {
        return {
            conversationId: username,
            conversationWith: username,
            messageId: `${username}_${message.timestamp}`,
            text: message.text,
            timestamp: message.timestamp,
            isSent: message.isSent,
            mediaUrls: [],
            reactions: [],
            isRead: true
        };
    }
    /**
     * Observe les changements DOM dans la section messages
     */
    observeMessagesDOM() {
        // Attendre que la section messages soit chargée
        const checkMessagesSection = setInterval(() => {
            const messagesSection = document.querySelector('[role="main"]');
            if (messagesSection) {
                clearInterval(checkMessagesSection);
                this.messageObserver = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                this.handleNewMessageNode(node);
                            }
                        });
                    });
                });
                this.messageObserver.observe(messagesSection, {
                    childList: true,
                    subtree: true
                });
                console.log('✅ DOM observer installed');
            }
        }, 1000);
        // Timeout après 30 secondes
        setTimeout(() => clearInterval(checkMessagesSection), 30000);
    }
    /**
     * Gère un nouveau nœud de message dans le DOM
     */
    handleNewMessageNode(node) {
        // Détecter les nouveaux messages
        const messageText = node.textContent?.trim();
        if (messageText && messageText.length > 0) {
            // Essayer de déterminer l'expéditeur
            const username = this.extractUsernameFromDOM(node);
            if (username) {
                const message = {
                    text: messageText,
                    timestamp: Date.now(),
                    isSent: this.isMessageSentByMe(node)
                };
                // Ajouter à la conversation
                let conversation = this.conversations.get(username);
                if (!conversation) {
                    conversation = {
                        username,
                        messages: [],
                        lastMessageAt: Date.now(),
                        messageCount: 0
                    };
                    this.conversations.set(username, conversation);
                }
                conversation.messages.push(message);
                conversation.lastMessageAt = message.timestamp;
                conversation.messageCount++;
                // Notifier
                const dmMessage = this.convertToDMMessage(username, message);
                this.onNewMessageCallback?.(dmMessage);
                this.onConversationUpdateCallback?.(conversation);
            }
        }
    }
    /**
     * Extrait le username depuis le DOM
     */
    extractUsernameFromDOM(node) {
        // Chercher dans les parents pour trouver le username
        let current = node;
        while (current) {
            const usernameLink = current.querySelector('a[href*="/"]');
            if (usernameLink) {
                const href = usernameLink.getAttribute('href');
                if (href) {
                    const match = href.match(/\/([^\/]+)\/?$/);
                    if (match) {
                        return match[1];
                    }
                }
            }
            current = current.parentElement;
        }
        return null;
    }
    /**
     * Détermine si un message a été envoyé par l'utilisateur
     */
    isMessageSentByMe(node) {
        // Instagram ajoute des classes spécifiques pour les messages envoyés
        // Chercher dans les parents
        let current = node;
        while (current) {
            const classList = current.classList;
            // Les messages envoyés ont généralement une classe contenant "outgoing" ou similaire
            if (classList.contains('outgoing') ||
                classList.contains('sent') ||
                current.getAttribute('data-direction') === 'outgoing') {
                return true;
            }
            current = current.parentElement;
        }
        return false;
    }
    /**
     * Charge les conversations existantes depuis le stockage local
     */
    async loadExistingConversations() {
        try {
            const stored = localStorage.getItem('waler_conversations');
            if (stored) {
                const data = JSON.parse(stored);
                Object.entries(data).forEach(([username, conversation]) => {
                    this.conversations.set(username, conversation);
                });
                console.log(`💾 Loaded ${this.conversations.size} conversations from storage`);
            }
        }
        catch (error) {
            console.error('Error loading conversations:', error);
        }
    }
    /**
     * Sauvegarde les conversations dans le stockage local
     */
    async saveConversations() {
        try {
            const data = {};
            this.conversations.forEach((conversation, username) => {
                data[username] = conversation;
            });
            localStorage.setItem('waler_conversations', JSON.stringify(data));
            console.log(`💾 Saved ${this.conversations.size} conversations`);
        }
        catch (error) {
            console.error('Error saving conversations:', error);
        }
    }
    /**
     * Obtient l'ID de l'utilisateur actuel
     */
    getCurrentUserId() {
        // Instagram stocke l'ID utilisateur dans window._sharedData
        try {
            const sharedData = window._sharedData;
            if (sharedData?.config?.viewer?.id) {
                return sharedData.config.viewer.id;
            }
            // Fallback: chercher dans les cookies
            const cookies = document.cookie.split(';');
            for (const cookie of cookies) {
                if (cookie.trim().startsWith('ds_user_id=')) {
                    return cookie.split('=')[1];
                }
            }
        }
        catch (error) {
            console.error('Error getting current user ID:', error);
        }
        return '';
    }
    /**
     * Obtient toutes les conversations
     */
    getConversations() {
        return Array.from(this.conversations.values());
    }
    /**
     * Obtient une conversation spécifique
     */
    getConversation(username) {
        return this.conversations.get(username);
    }
    /**
     * Nettoie les anciennes conversations (> 30 jours)
     */
    cleanOldConversations() {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        let cleaned = 0;
        this.conversations.forEach((conversation, username) => {
            if (conversation.lastMessageAt < thirtyDaysAgo) {
                this.conversations.delete(username);
                cleaned++;
            }
        });
        console.log(`🧹 Cleaned ${cleaned} old conversations`);
    }
}
