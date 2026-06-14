// Using Chrome API

interface TrackedData {
  type: 'follower' | 'unfollower' | 'potential_blocker' | 'engagement';
  username: string;
  avatarUrl?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class SyncManager {
  private readonly API_URL = 'http://localhost:5000/api';
  private syncQueue: TrackedData[] = [];
  private isSyncing = false;

  async trackFollower(data: any) {
    await this.addToQueue({
      type: 'follower',
      username: data.username,
      avatarUrl: data.avatarUrl,
      timestamp: Date.now(),
      metadata: data.metadata,
    });
    
    // Incrémenter les stats de session
    await this.incrementStat('follower');
    
    // Synchroniser immédiatement les nouveaux followers
    console.log('🚀 New follower detected, syncing immediately...');
    await this.syncToServer();
  }

  async trackUnfollower(data: any) {
    await this.addToQueue({
      type: 'unfollower',
      username: data.username,
      avatarUrl: data.avatarUrl,
      timestamp: Date.now(),
      metadata: data.metadata,
    });
    
    // Incrémenter les stats de session
    await this.incrementStat('unfollower');
    
    // Synchroniser immédiatement les unfollowers
    console.log('🚀 Unfollower detected, syncing immediately...');
    await this.syncToServer();
  }

  async trackPotentialBlocker(data: any) {
    await this.addToQueue({
      type: 'potential_blocker',
      username: data.username,
      avatarUrl: data.avatarUrl,
      timestamp: Date.now(),
      metadata: data.metadata,
    });
    
    // Incrémenter les stats de session
    await this.incrementStat('potential_blocker');
  }

  async trackEngagement(data: any) {
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
    
    // Incrémenter les stats de session
    await this.incrementStat('engagement');
  }

  private async addToQueue(data: TrackedData) {
    const stored = await chrome.storage.local.get('syncQueue');
    const queue: TrackedData[] = (stored.syncQueue as TrackedData[]) || [];
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

    const stored = await chrome.storage.local.get(['syncQueue', 'userId', 'apiToken', 'isAuthenticated', 'userInfo']);
    
    if (!stored.isAuthenticated || !stored.userId) {
      console.log('❌ Not authenticated, skipping sync');
      return;
    }

    const queue: TrackedData[] = (stored.syncQueue as TrackedData[]) || [];
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

        // Mettre à jour le nombre de followers si disponible
        if (stored.userInfo) {
          console.log('📊 Updating user info after sync...');
          await this.updateUserInfo(stored.userInfo, stored.userId, stored.apiToken);
        }

        await chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: 'Waler',
          message: `${queue.length} événements synchronisés`,
        });
      } else {
        console.error('❌ Sync failed:', response.status);
      }
    } catch (error) {
      console.error('❌ Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async updateUserInfo(userInfo: any, userId: string, token: string) {
    try {
      const response = await fetch(`${this.API_URL}/users/instagram-stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          followersCount: userInfo.followersCount || 0,
          followingCount: userInfo.followingCount || 0,
          postsCount: userInfo.postsCount || 0,
          bio: userInfo.bio || '',
          isPrivate: userInfo.isPrivate || false,
        }),
      });

      if (response.ok) {
        console.log('✅ User info updated successfully');
      } else {
        console.error('❌ Failed to update user info:', response.status);
      }
    } catch (error) {
      console.error('❌ Error updating user info:', error);
    }
  }

  async getLocalStats() {
    const stored = await chrome.storage.local.get(['syncQueue', 'sessionStats']);
    const queue: TrackedData[] = (stored.syncQueue as TrackedData[]) || [];
    const sessionStats = stored.sessionStats || {
      followers: 0,
      unfollowers: 0,
      potentialBlockers: 0,
      engagements: 0,
    };

    const stats = {
      pendingSync: queue.length,
      followers: sessionStats.followers,
      unfollowers: sessionStats.unfollowers,
      potentialBlockers: sessionStats.potentialBlockers,
      engagements: sessionStats.engagements,
    };

    return stats;
  }

  async incrementStat(type: 'follower' | 'unfollower' | 'potential_blocker' | 'engagement') {
    const stored = await chrome.storage.local.get('sessionStats');
    const sessionStats = stored.sessionStats || {
      followers: 0,
      unfollowers: 0,
      potentialBlockers: 0,
      engagements: 0,
    };

    if (type === 'follower') sessionStats.followers++;
    else if (type === 'unfollower') sessionStats.unfollowers++;
    else if (type === 'potential_blocker') sessionStats.potentialBlockers++;
    else if (type === 'engagement') sessionStats.engagements++;

    await chrome.storage.local.set({ sessionStats });
  }

  async resetStats() {
    await chrome.storage.local.set({
      sessionStats: {
        followers: 0,
        unfollowers: 0,
        potentialBlockers: 0,
        engagements: 0,
      }
    });
  }

  async syncFullDatabase() {
    try {
      console.log('🔄 Starting full database sync...');

      const stored = await chrome.storage.local.get(['followerDatabase', 'userId', 'apiToken', 'isAuthenticated']);
      
      if (!stored.isAuthenticated || !stored.userId) {
        console.log('❌ Not authenticated, cannot sync');
        return { success: false, error: 'Not authenticated' };
      }

      const db = stored.followerDatabase;
      if (!db || !db.followers) {
        console.log('❌ No follower database found');
        return { success: false, error: 'No database' };
      }

      const followers = Object.entries(db.followers).map(([username, data]: [string, any]) => ({
        type: 'follower',
        username,
        avatarUrl: data.avatarUrl,
        timestamp: new Date(data.addedAt).getTime(),
        metadata: {
          position: data.position,
          isInitialScan: true
        }
      }));

      console.log(`📤 Syncing ${followers.length} followers from local database...`);

      const response = await fetch(`${this.API_URL}/extension/sync-full`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${stored.apiToken}`,
        },
        body: JSON.stringify({
          userId: stored.userId,
          followers: followers,
          totalCount: db.totalCount,
          lastScanDate: db.lastScanDate,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Full database sync successful:', result);
        
        await chrome.storage.local.set({ 
          lastFullSync: Date.now(),
        });

        return { success: true, synced: followers.length };
      } else {
        const error = await response.text();
        console.error('❌ Full sync failed:', response.status, error);
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error: any) {
      console.error('❌ Full sync error:', error);
      return { success: false, error: error.message };
    }
  }
}


