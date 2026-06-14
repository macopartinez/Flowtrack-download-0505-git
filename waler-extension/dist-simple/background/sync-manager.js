// Using Chrome API
export class SyncManager {
    constructor() {
        this.API_URL = 'http://localhost:5000/api';
        this.syncQueue = [];
        this.isSyncing = false;
    }
    async trackFollower(data) {
        await this.addToQueue({
            type: 'follower',
            username: data.username,
            avatarUrl: data.avatarUrl,
            timestamp: Date.now(),
            metadata: data.metadata,
        });
    }
    async trackUnfollower(data) {
        await this.addToQueue({
            type: 'unfollower',
            username: data.username,
            avatarUrl: data.avatarUrl,
            timestamp: Date.now(),
            metadata: data.metadata,
        });
    }
    async trackBlocker(data) {
        await this.addToQueue({
            type: 'blocker',
            username: data.username,
            avatarUrl: data.avatarUrl,
            timestamp: Date.now(),
            metadata: data.metadata,
        });
    }
    async trackEngagement(data) {
        await this.addToQueue({
            type: 'engagement',
            username: data.username,
            timestamp: Date.now(),
            metadata: {
                action: data.action,
                postId: data.postId,
                duration: data.duration,
            },
        });
    }
    async addToQueue(data) {
        const stored = await chrome.storage.local.get('syncQueue');
        const queue = stored.syncQueue || [];
        queue.push(data);
        await chrome.storage.local.set({ syncQueue: queue });
        this.syncQueue = queue;
        if (queue.length >= 10) {
            await this.syncToServer();
        }
    }
    async syncToServer() {
        if (this.isSyncing) {
            console.log('⏳ Sync already in progress');
            return;
        }
        const stored = await chrome.storage.local.get(['syncQueue', 'userId', 'apiToken', 'isAuthenticated']);
        if (!stored.isAuthenticated || !stored.userId) {
            console.log('❌ Not authenticated, skipping sync');
            return;
        }
        const queue = stored.syncQueue || [];
        if (queue.length === 0) {
            console.log('✅ Nothing to sync');
            return;
        }
        this.isSyncing = true;
        try {
            console.log(`📤 Syncing ${queue.length} items...`);
            const response = await fetch(`${this.API_URL}/extension/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${stored.apiToken}`,
                },
                body: JSON.stringify({
                    userId: stored.userId,
                    data: queue,
                }),
            });
            if (response.ok) {
                await chrome.storage.local.set({
                    syncQueue: [],
                    lastSync: Date.now(),
                });
                this.syncQueue = [];
                console.log('✅ Sync successful');
                await chrome.notifications.create({
                    type: 'basic',
                    iconUrl: '../icons/icon-48.png',
                    title: 'Waler',
                    message: `${queue.length} événements synchronisés`,
                });
            }
            else {
                console.error('❌ Sync failed:', response.status);
            }
        }
        catch (error) {
            console.error('❌ Sync error:', error);
        }
        finally {
            this.isSyncing = false;
        }
    }
    async getLocalStats() {
        const stored = await chrome.storage.local.get('syncQueue');
        const queue = stored.syncQueue || [];
        const stats = {
            pendingSync: queue.length,
            followers: queue.filter((d) => d.type === 'follower').length,
            unfollowers: queue.filter((d) => d.type === 'unfollower').length,
            blockers: queue.filter((d) => d.type === 'blocker').length,
            engagements: queue.filter((d) => d.type === 'engagement').length,
        };
        return stats;
    }
}
