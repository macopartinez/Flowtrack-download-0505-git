// Using Chrome API
export class DataCollector {
    constructor() {
        this.profileVisits = new Map();
        this.engagements = [];
    }
    trackProfileVisit(username) {
        const count = this.profileVisits.get(username) || 0;
        this.profileVisits.set(username, count + 1);
        console.log(`👤 Profile visit: @${username} (${count + 1} times)`);
    }
    trackEngagement(engagement) {
        this.engagements.push({
            ...engagement,
            timestamp: Date.now(),
        });
        console.log(`💫 Engagement tracked:`, engagement.type);
        if (this.engagements.length >= 20) {
            this.flushEngagements();
        }
    }
    processFollowersData(data) {
        console.log('📊 Processing followers data from API');
        try {
            if (data?.data?.user?.edge_followed_by?.edges) {
                const followers = data.data.user.edge_followed_by.edges.map((edge) => ({
                    username: edge.node.username,
                    fullName: edge.node.full_name,
                    avatarUrl: edge.node.profile_pic_url,
                    isVerified: edge.node.is_verified,
                }));
                console.log(`Found ${followers.length} followers in API response`);
            }
        }
        catch (error) {
            console.error('Error processing followers data:', error);
        }
    }
    processFollowingData(data) {
        console.log('📊 Processing following data from API');
        try {
            if (data?.data?.user?.edge_follow?.edges) {
                const following = data.data.user.edge_follow.edges.map((edge) => ({
                    username: edge.node.username,
                    fullName: edge.node.full_name,
                    avatarUrl: edge.node.profile_pic_url,
                    isVerified: edge.node.is_verified,
                }));
                console.log(`Found ${following.length} following in API response`);
            }
        }
        catch (error) {
            console.error('Error processing following data:', error);
        }
    }
    processUserInfo(data) {
        console.log('📊 Processing user info from API');
        try {
            if (data?.data?.user) {
                const userInfo = {
                    username: data.data.user.username,
                    fullName: data.data.user.full_name,
                    bio: data.data.user.biography,
                    followersCount: data.data.user.edge_followed_by?.count,
                    followingCount: data.data.user.edge_follow?.count,
                    postsCount: data.data.user.edge_owner_to_timeline_media?.count,
                    isPrivate: data.data.user.is_private,
                    isVerified: data.data.user.is_verified,
                };
                console.log('User info:', userInfo);
                chrome.runtime.sendMessage({
                    type: 'UPDATE_USER_INFO',
                    data: userInfo,
                });
            }
        }
        catch (error) {
            console.error('Error processing user info:', error);
        }
    }
    async flushEngagements() {
        if (this.engagements.length === 0)
            return;
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
