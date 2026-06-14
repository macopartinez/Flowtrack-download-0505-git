// Using Chrome API
import { DOMObserver } from './dom-observer.js';
import { DataCollector } from './data-collector.js';
import { DMInterceptor } from './dm-interceptor.js';
import { DMAnalyzer } from './dm-analyzer.js';
import { ScoringEngine } from './scoring-engine.js';
class InstagramTracker {
    constructor() {
        this.currentUsername = null;
        this.dmSyncInterval = null;
        this.followersCache = new Set();
        this.isInitialized = false;
        this.observer = new DOMObserver();
        this.collector = new DataCollector();
        this.dmInterceptor = new DMInterceptor();
        this.dmAnalyzer = new DMAnalyzer();
        this.scoringEngine = new ScoringEngine();
    }
    async init() {
        if (this.isInitialized)
            return;
        console.log('🔍 Waler Instagram Tracker initializing...');
        this.currentUsername = this.extractUsername();
        if (!this.currentUsername) {
            console.log('❌ Could not detect Instagram username');
            return;
        }
        console.log(`✅ Tracking account: @${this.currentUsername}`);
        await this.loadFollowersCache();
        this.observer.onProfileVisit((username) => {
            this.collector.trackProfileVisit(username);
        });
        this.observer.onFollowerDetected((follower) => {
            this.handleFollowerDetected(follower);
        });
        this.observer.onUnfollowerDetected((unfollower) => {
            this.handleUnfollowerDetected(unfollower);
        });
        this.observer.onEngagement((engagement) => {
            this.collector.trackEngagement(engagement);
        });
        this.interceptAPIRequests();
        this.observer.start();
        // Start DM interceptor
        this.startDMInterceptor();
        // Start DM sync (every 5 minutes)
        this.dmSyncInterval = setInterval(() => {
            this.syncDMs();
        }, 5 * 60 * 1000);
        this.isInitialized = true;
        console.log('✅ Waler Instagram Tracker ready');
    }
    /**
     * Start DM interceptor
     */
    startDMInterceptor() {
        this.dmInterceptor.start({
            onNewMessage: (message) => {
                this.handleNewDM(message);
            },
            onConversationUpdate: (conversation) => {
                this.handleConversationUpdate(conversation);
            }
        });
        console.log('💬 DM interceptor started');
    }
    /**
     * Handle new DM message
     */
    async handleNewDM(message) {
        console.log(`💬 New DM from @${message.conversationWith}: ${message.text.substring(0, 50)}...`);
        // Analyze message with DMAnalyzer
        const analysis = this.dmAnalyzer.analyzeMessage(message.text);
        if (analysis.keywords.length > 0) {
            console.log(`🔍 Keywords detected: ${analysis.keywords.join(', ')} (${analysis.category})`);
            // If significant keywords detected, trigger scoring
            if (analysis.confidence > 0.5) {
                await this.triggerContactScoring(message.conversationWith);
            }
        }
        // Send to background for storage
        await chrome.runtime.sendMessage({
            type: 'NEW_DM',
            message
        });
    }
    /**
     * Handle conversation update
     */
    async handleConversationUpdate(conversation) {
        console.log(`📬 Conversation updated: @${conversation.username} (${conversation.messageCount} messages)`);
        // Calculate DM score
        const dmScore = this.dmAnalyzer.calculateDMScore(conversation);
        if (dmScore.total >= 15) {
            // High DM score, trigger full scoring
            await this.triggerContactScoring(conversation.username);
        }
    }
    /**
     * Trigger contact scoring and classification
     */
    async triggerContactScoring(username) {
        try {
            // Get conversation
            const conversation = this.dmInterceptor.getConversation(username);
            if (!conversation)
                return;
            // Build contact data
            const contact = {
                username,
                conversation,
                likesGiven: 0, // TODO: Get from collector
                commentsGiven: 0,
                storiesViewed: 0,
                sharesReceived: 0,
                profileVisits: 0,
                timeSpentMinutes: 0,
                linkClicks: 0,
                firstInteractionDate: Date.now() - (30 * 24 * 60 * 60 * 1000), // Default 30 days ago
                lastInteractionDate: Date.now(),
                isFollowingBack: false,
                mutualEngagementCount: 0,
                mutualConnectionsCount: 0
            };
            // Calculate score
            const scoreBreakdown = this.scoringEngine.calculateTotalScore(contact);
            console.log(`📊 Score for @${username}: ${scoreBreakdown.total}/100`, scoreBreakdown);
            // Detect transition
            const transition = this.scoringEngine.detectTransition(contact, scoreBreakdown);
            if (transition.shouldTransition) {
                console.log(`💡 Transition detected: @${username} ${transition.from} → ${transition.to}`);
                // Send to background to create suggestion
                await chrome.runtime.sendMessage({
                    type: 'CREATE_SUGGESTION',
                    username,
                    transition,
                    scoreBreakdown
                });
            }
            // Send score to backend
            await chrome.runtime.sendMessage({
                type: 'UPDATE_CONTACT_SCORE',
                username,
                scoreBreakdown
            });
        }
        catch (error) {
            console.error('Error triggering contact scoring:', error);
        }
    }
    /**
     * Sync DMs to backend
     */
    async syncDMs() {
        try {
            const conversations = this.dmInterceptor.getConversations();
            if (conversations.length === 0) {
                console.log('💬 No DMs to sync');
                return;
            }
            // Collect all messages
            const allMessages = [];
            conversations.forEach(conv => {
                conv.messages.forEach(msg => {
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
            // Send to background
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
            // Save conversations locally
            await this.dmInterceptor.saveConversations();
        }
        catch (error) {
            console.error('Error syncing DMs:', error);
        }
    }
    extractUsername() {
        const metaTag = document.querySelector('meta[property="og:title"]');
        if (metaTag) {
            const content = metaTag.getAttribute('content');
            const match = content?.match(/@(\w+)/);
            if (match)
                return match[1];
        }
        const pathMatch = window.location.pathname.match(/^\/([^\/]+)/);
        if (pathMatch && pathMatch[1] !== 'explore' && pathMatch[1] !== 'reels') {
            return pathMatch[1];
        }
        return null;
    }
    async loadFollowersCache() {
        const stored = await chrome.storage.local.get('followersCache');
        if (stored.followersCache) {
            this.followersCache = new Set(stored.followersCache);
            console.log(`📦 Loaded ${this.followersCache.size} followers from cache`);
        }
    }
    async saveFollowersCache() {
        await chrome.storage.local.set({
            followersCache: Array.from(this.followersCache),
        });
    }
    async handleFollowerDetected(follower) {
        if (!this.followersCache.has(follower.username)) {
            console.log(`➕ New follower detected: @${follower.username}`);
            this.followersCache.add(follower.username);
            await this.saveFollowersCache();
            await chrome.runtime.sendMessage({
                type: 'TRACK_FOLLOWER',
                data: {
                    username: follower.username,
                    avatarUrl: follower.avatarUrl,
                    metadata: {
                        detectedAt: new Date().toISOString(),
                    },
                },
            });
        }
    }
    async handleUnfollowerDetected(unfollower) {
        if (this.followersCache.has(unfollower.username)) {
            console.log(`➖ Unfollower detected: @${unfollower.username}`);
            this.followersCache.delete(unfollower.username);
            await this.saveFollowersCache();
            await chrome.runtime.sendMessage({
                type: 'TRACK_UNFOLLOWER',
                data: {
                    username: unfollower.username,
                    avatarUrl: unfollower.avatarUrl,
                    metadata: {
                        detectedAt: new Date().toISOString(),
                    },
                },
            });
        }
    }
    interceptAPIRequests() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const response = await originalFetch(...args);
            const url = args[0].toString();
            if (url.includes('/graphql') || url.includes('/api/v1/')) {
                const clonedResponse = response.clone();
                try {
                    const data = await clonedResponse.json();
                    this.processAPIResponse(url, data);
                }
                catch (e) {
                }
            }
            return response;
        };
        console.log('🔌 API interception enabled');
    }
    processAPIResponse(url, data) {
        if (url.includes('followers')) {
            this.collector.processFollowersData(data);
        }
        else if (url.includes('following')) {
            this.collector.processFollowingData(data);
        }
        else if (url.includes('user_info')) {
            this.collector.processUserInfo(data);
        }
    }
}
const tracker = new InstagramTracker();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => tracker.init());
}
else {
    tracker.init();
}
console.log('📱 Waler content script loaded');
