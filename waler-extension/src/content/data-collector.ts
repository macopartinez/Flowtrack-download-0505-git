// Using Chrome API

export class DataCollector {
  private profileVisits: Map<string, number> = new Map();
  private engagements: any[] = [];
  private trackedUsername: string | null = null;

  setTrackedUsername(username: string | null) {
    this.trackedUsername = username;
  }

  trackProfileVisit(username: string) {
    const count = this.profileVisits.get(username) || 0;
    this.profileVisits.set(username, count + 1);

    console.log(`👤 Profile visit: @${username} (${count + 1} times)`);
  }

  trackEngagement(engagement: any) {
    this.engagements.push({
      ...engagement,
      timestamp: Date.now(),
    });

    console.log(`💫 Engagement tracked:`, engagement.type);

    if (this.engagements.length >= 20) {
      this.flushEngagements();
    }
  }

  processFollowersData(data: any) {
    console.log('📊 Processing followers data from API');
    
    try {
      if (data?.data?.user?.edge_followed_by?.edges) {
        const followers = data.data.user.edge_followed_by.edges.map((edge: any) => ({
          username: edge.node.username,
          fullName: edge.node.full_name,
          avatarUrl: edge.node.profile_pic_url,
          isVerified: edge.node.is_verified,
        }));

        console.log(`Found ${followers.length} followers in API response`);
      }
    } catch (error) {
      console.error('Error processing followers data:', error);
    }
  }

  processFollowingData(data: any) {
    console.log('📊 Processing following data from API');
    
    try {
      if (data?.data?.user?.edge_follow?.edges) {
        const following = data.data.user.edge_follow.edges.map((edge: any) => ({
          username: edge.node.username,
          fullName: edge.node.full_name,
          avatarUrl: edge.node.profile_pic_url,
          isVerified: edge.node.is_verified,
        }));

        console.log(`Found ${following.length} following in API response`);
      }
    } catch (error) {
      console.error('Error processing following data:', error);
    }
  }

  async processUserInfo(data: any) {
    try {
      const user = data?.data?.user || data?.user;
      if (!user) return;

      // Le nombre de followers peut être dans edge_followed_by.count (web_profile_info)
      // ou directement dans follower_count (API v1)
      const followersCount =
        user.edge_followed_by?.count ??
        user.follower_count ??
        undefined;

      // Ignorer si on n'a pas de nombre de followers valide dans cette réponse
      if (typeof followersCount !== 'number') {
        return;
      }

      const userInfo = {
        username: user.username,
        fullName: user.full_name,
        bio: user.biography,
        followersCount,
        followingCount: user.edge_follow?.count ?? user.following_count ?? 0,
        postsCount: user.edge_owner_to_timeline_media?.count ?? user.media_count ?? 0,
        isPrivate: user.is_private,
        isVerified: user.is_verified,
      };

      // IMPORTANT : ne traiter QUE le compte suivi (connecté).
      // Sinon, visiter le profil d'un autre utilisateur (ex. une célébrité
      // à 29000 followers) polluerait notre compteur et déclencherait de
      // fausses détections d'unfollowers.
      if (this.trackedUsername && userInfo.username && userInfo.username !== this.trackedUsername) {
        return;
      }

      console.log('📊 Processing user info from API:', userInfo.username, '→', followersCount, 'followers');

      // Envoyer les informations utilisateur
      chrome.runtime.sendMessage({
        type: 'UPDATE_USER_INFO',
        data: userInfo,
      });

      // Vérifier si le nombre de followers a changé
      await this.checkFollowerCountChange(followersCount);
    } catch (error) {
      console.error('Error processing user info:', error);
    }
  }

  private async checkFollowerCountChange(newCount: number) {
    try {
      // Récupérer l'ancien nombre de followers depuis le storage
      const stored = await chrome.storage.local.get(['followerDatabase', 'lastFollowerCount']);
      
      // Utiliser lastFollowerCount comme source de vérité, sinon fallback sur la database
      let oldCount = stored.lastFollowerCount || 0;
      
      // Si lastFollowerCount n'existe pas, utiliser la database
      if (oldCount === 0 && stored.followerDatabase) {
        oldCount = Object.keys(stored.followerDatabase.followers || {}).length;
      }
      
      if (newCount !== oldCount && oldCount > 0) {
        const diff = newCount - oldCount;
        console.log(`🔔 [API] Follower count changed: ${oldCount} → ${newCount} (${diff > 0 ? '+' : ''}${diff})`);
        
        // IMPORTANT: Mettre à jour lastFollowerCount ET totalCount pour synchroniser
        await chrome.storage.local.set({ lastFollowerCount: newCount });
        console.log(`💾 Updated lastFollowerCount to ${newCount}`);
        
        // Mettre à jour aussi followerDatabase.totalCount avec le nombre RÉEL
        if (stored.followerDatabase) {
          stored.followerDatabase.totalCount = newCount;
          await chrome.storage.local.set({ followerDatabase: stored.followerDatabase });
          console.log(`💾 Updated followerDatabase.totalCount to ${newCount} (real count)`);
        }
        
        // Notifier le changement
        chrome.runtime.sendMessage({
          type: 'FOLLOWER_COUNT_CHANGED',
          data: {
            oldCount,
            newCount,
            diff,
          }
        });
        
        // Si c'est un nouveau follower, suggérer un scan
        if (diff > 0) {
          console.log(`✨ ${diff} nouveau(x) follower(s) détecté(s) ! Ouvrez le modal des followers pour les identifier.`);
        }
      } else if (oldCount === 0) {
        // Première détection, initialiser lastFollowerCount ET totalCount
        console.log(`📊 [API] Initial follower count detected: ${newCount}`);
        await chrome.storage.local.set({ lastFollowerCount: newCount });
        
        // Initialiser aussi totalCount avec le nombre réel
        if (stored.followerDatabase) {
          stored.followerDatabase.totalCount = newCount;
          await chrome.storage.local.set({ followerDatabase: stored.followerDatabase });
          console.log(`💾 Initialized followerDatabase.totalCount to ${newCount} (real count)`);
        }
      }
    } catch (error) {
      console.error('Error checking follower count change:', error);
    }
  }

  private async flushEngagements() {
    if (this.engagements.length === 0) return;

    console.log(`📤 Flushing ${this.engagements.length} engagements`);

    for (const engagement of this.engagements) {
      await chrome.runtime.sendMessage({
        type: 'TRACK_ENGAGEMENT',
        data: engagement,
      });
    }

    this.engagements = [];
  }

  async getStats() {
    return {
      profileVisits: Object.fromEntries(this.profileVisits),
      pendingEngagements: this.engagements.length,
    };
  }
}


