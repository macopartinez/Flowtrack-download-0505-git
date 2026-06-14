// Using Chrome API
import { SyncManager } from './sync-manager.js';
import { ClassificationManager } from './classification-manager.js';
const syncManager = new SyncManager();
const classificationManager = new ClassificationManager();
chrome.runtime.onInstalled.addListener(async () => {
    console.log('🚀 Waler Extension installed');
    await chrome.storage.local.set({
        isAuthenticated: false,
        userId: null,
        lastSync: null,
    });
    chrome.alarms.create('sync-data', {
        periodInMinutes: 5,
    });
});
// Listen for authentication from the web page
chrome.runtime.onMessageExternal.addListener(async (message, sender) => {
    if (message.type === 'FLOWTRACK_AUTH' && message.userId && message.apiToken) {
        console.log('🔐 Received authentication from FlowTrack');
        await chrome.storage.local.set({
            isAuthenticated: true,
            userId: message.userId,
            apiToken: message.apiToken,
            lastSync: Date.now(),
        });
        console.log('✅ Extension authenticated successfully');
        return { success: true };
    }
});
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'sync-data') {
        console.log('⏰ Syncing data...');
        await syncManager.syncToServer();
    }
});
chrome.runtime.onMessage.addListener(async (message, sender) => {
    console.log('📨 Message received:', message.type);
    switch (message.type) {
        case 'TRACK_FOLLOWER':
            await syncManager.trackFollower(message.data);
            break;
        case 'TRACK_UNFOLLOWER':
            await syncManager.trackUnfollower(message.data);
            break;
        case 'TRACK_BLOCKER':
            await syncManager.trackBlocker(message.data);
            break;
        case 'TRACK_ENGAGEMENT':
            await syncManager.trackEngagement(message.data);
            break;
        case 'SYNC_NOW':
            await syncManager.syncToServer();
            return { success: true };
        case 'GET_STATS':
            const stats = await syncManager.getLocalStats();
            return { success: true, data: stats };
        case 'AUTHENTICATE':
            await chrome.storage.local.set({
                isAuthenticated: true,
                userId: message.userId,
                apiToken: message.token,
            });
            return { success: true };
        // ==================== DM HANDLERS ====================
        case 'NEW_DM':
            // Store DM locally
            await storeDMLocally(message.message);
            console.log(`💬 DM stored: @${message.message.conversationWith}`);
            break;
        case 'SYNC_DMS':
            // Sync DMs to backend
            await syncDMsToBackend(message.messages, message.conversations);
            return { success: true };
        case 'GET_DM_CONVERSATIONS':
            const conversations = await getDMConversations();
            return { success: true, conversations };
        // ==================== CLASSIFICATION HANDLERS ====================
        case 'UPDATE_CONTACT_SCORE':
            // Update contact score in backend
            await updateContactScore(message.username, message.scoreBreakdown);
            return { success: true };
        case 'CREATE_SUGGESTION':
            // Create classification suggestion
            const suggestion = await createSuggestion(message.username, message.transition, message.scoreBreakdown);
            if (suggestion) {
                // Update badge
                await classificationManager.updateBadge();
            }
            return { success: true, suggestion };
        case 'GET_SUGGESTIONS':
            const suggestions = await classificationManager.getPendingSuggestions();
            return { success: true, suggestions };
        case 'ACCEPT_SUGGESTION':
            const accepted = await classificationManager.acceptSuggestion(message.suggestionId);
            if (accepted) {
                await classificationManager.updateBadge();
            }
            return { success: accepted };
        case 'REJECT_SUGGESTION':
            const rejected = await classificationManager.rejectSuggestion(message.suggestionId, message.reason);
            if (rejected) {
                await classificationManager.updateBadge();
            }
            return { success: rejected };
        default:
            console.warn('Unknown message type:', message.type);
    }
});
// ==================== DM FUNCTIONS ====================
/**
 * Store DM locally in storage
 */
async function storeDMLocally(message) {
    const stored = await chrome.storage.local.get('dm_messages');
    const messages = stored.dm_messages || [];
    messages.push({
        ...message,
        storedAt: Date.now()
    });
    // Keep only last 1000 messages
    if (messages.length > 1000) {
        messages.splice(0, messages.length - 1000);
    }
    await chrome.storage.local.set({ dm_messages: messages });
}
/**
 * Sync DMs to backend
 */
async function syncDMsToBackend(messages, conversations) {
    try {
        const stored = await chrome.storage.local.get('apiToken');
        if (!stored.apiToken) {
            console.error('No API token found');
            return;
        }
        const response = await fetch('http://localhost:5000/api/extension/sync-dms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${stored.apiToken}`,
            },
            body: JSON.stringify({
                messages,
                conversations
            }),
        });
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ DMs synced: ${data.insertedMessages} messages, ${data.updatedConversations} conversations`);
        }
        else {
            console.error('Failed to sync DMs:', response.status);
        }
    }
    catch (error) {
        console.error('Error syncing DMs:', error);
    }
}
/**
 * Get DM conversations from backend
 */
async function getDMConversations() {
    try {
        const stored = await chrome.storage.local.get('apiToken');
        if (!stored.apiToken) {
            return [];
        }
        const response = await fetch('http://localhost:5000/api/extension/dm-conversations', {
            headers: {
                'Authorization': `Bearer ${stored.apiToken}`,
            },
        });
        if (response.ok) {
            const data = await response.json();
            return data.conversations || [];
        }
    }
    catch (error) {
        console.error('Error getting DM conversations:', error);
    }
    return [];
}
// ==================== CLASSIFICATION FUNCTIONS ====================
/**
 * Update contact score in backend
 */
async function updateContactScore(username, scoreBreakdown) {
    try {
        const stored = await chrome.storage.local.get(['apiToken', 'userId']);
        if (!stored.apiToken) {
            console.error('No API token found');
            return;
        }
        const response = await fetch('http://localhost:5000/api/extension/analyze-contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${stored.apiToken}`,
            },
            body: JSON.stringify({
                contactUsername: username,
                scoreBreakdown,
                currentCategory: 'lead' // Default, will be updated by suggestions
            }),
        });
        if (response.ok) {
            const data = await response.json();
            console.log(`📊 Score updated for @${username}: ${data.score}/100`);
        }
        else {
            console.error('Failed to update contact score:', response.status);
        }
    }
    catch (error) {
        console.error('Error updating contact score:', error);
    }
}
/**
 * Create classification suggestion
 */
async function createSuggestion(username, transition, scoreBreakdown) {
    try {
        const stored = await chrome.storage.local.get(['apiToken', 'userId']);
        if (!stored.apiToken || !stored.userId) {
            console.error('No API token or user ID found');
            return null;
        }
        const suggestion = await classificationManager.createSuggestion(stored.userId, username, transition.from, transition.to, scoreBreakdown.total, transition.confidence, transition.reason, transition.evidence || []);
        if (suggestion) {
            console.log(`💡 Suggestion created: @${username} ${transition.from} → ${transition.to}`);
        }
        return suggestion;
    }
    catch (error) {
        console.error('Error creating suggestion:', error);
        return null;
    }
}
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url?.includes('instagram.com')) {
        console.log('📱 Instagram tab loaded');
    }
});
console.log('✅ Waler Extension background script loaded');
