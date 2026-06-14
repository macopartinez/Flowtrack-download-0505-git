// Using Chrome API
import { SyncManager } from './sync-manager.js';
import { ClassificationManager } from './classification-manager.js';

const syncManager = new SyncManager();
const classificationManager = new ClassificationManager();

// Réinitialiser les stats à minuit chaque jour
async function scheduleNextMidnightReset() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const timeUntilMidnight = tomorrow.getTime() - now.getTime();
  
  console.log(`⏰ Next stats reset scheduled in ${Math.round(timeUntilMidnight / 1000 / 60)} minutes (at midnight)`);
  
  setTimeout(async () => {
    console.log('🌙 Midnight! Resetting daily stats...');
    await syncManager.resetStats();
    
    // Notifier le popup si ouvert
    chrome.runtime.sendMessage({ type: 'STATS_RESET_MIDNIGHT' }).catch(() => {});
    
    // Programmer le prochain reset
    scheduleNextMidnightReset();
  }, timeUntilMidnight);
}

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
  
  // Démarrer le scheduler de reset à minuit
  scheduleNextMidnightReset();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'sync-data') {
    console.log('⏰ Syncing data...');
    await syncManager.syncToServer();
  }
});

// Écouter les messages depuis la page web (externe)
chrome.runtime.onMessageExternal.addListener((message: any, sender: any, sendResponse: any) => {
  console.log('📨 External message received:', message.type, 'from:', sender.url);

  if (message.type === 'FLOWTRACK_AUTH' && message.userId && message.token) {
    console.log('🔐 Received authentication token from FlowTrack website');
    
    // Valider le token auprès du backend
    fetch('http://localhost:5000/api/extension/validate-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: message.token }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.valid && data.userId === message.userId) {
          console.log('✅ Token validated, storing authentication...');
          return chrome.storage.local.set({
            isAuthenticated: true,
            userId: message.userId,
            apiToken: message.token,
            lastSync: Date.now(),
          });
        } else {
          throw new Error('Token validation failed');
        }
      })
      .then(() => {
        console.log('✅ Extension authenticated successfully');
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('❌ Authentication error:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Indique que sendResponse sera appelé de manière asynchrone
  }
});

chrome.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
  console.log('📨 Message received:', message.type);

  // Fonction async pour gérer les opérations asynchrones
  (async () => {
    switch (message.type) {
      case 'FLOWTRACK_AUTH':
        console.log('🔐 Received authentication from FlowTrack');
        
        // Valider le token auprès du backend
        try {
          const validateResponse = await fetch('http://localhost:5000/api/extension/validate-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: message.apiToken }),
          });
          
          const validateData = await validateResponse.json();
          
          if (validateData.valid && validateData.userId === message.userId) {
            console.log('✅ Token validated, storing authentication...');
            await chrome.storage.local.set({
              isAuthenticated: true,
              userId: message.userId,
              apiToken: message.apiToken,
              lastSync: Date.now(),
            });
            console.log('✅ Extension authenticated successfully');
            sendResponse({ success: true });
          } else {
            console.error('❌ Token validation failed');
            sendResponse({ success: false, error: 'Token validation failed' });
          }
        } catch (error: any) {
          console.error('❌ Authentication error:', error);
          sendResponse({ success: false, error: error.message });
        }
        break;

      case 'TRACK_FOLLOWER':
        await syncManager.trackFollower(message.data);
        sendResponse({ success: true });
        break;

      case 'TRACK_UNFOLLOWER':
        await syncManager.trackUnfollower(message.data);
        sendResponse({ success: true });
        break;

      case 'TRACK_POTENTIAL_BLOCKER':
        await syncManager.trackPotentialBlocker(message.data);
        sendResponse({ success: true });
        break;

      case 'TRACK_ENGAGEMENT':
        await syncManager.trackEngagement(message.data);
        sendResponse({ success: true });
        break;

      case 'SYNC_NOW':
        await syncManager.syncToServer();
        sendResponse({ success: true });
        break;

      case 'GET_STATS':
        const stats = await syncManager.getLocalStats();
        sendResponse({ success: true, data: stats });
        break;

      case 'AUTHENTICATE':
        await chrome.storage.local.set({
          isAuthenticated: true,
          userId: message.userId,
          apiToken: message.token,
        });
        sendResponse({ success: true });
        break;

    // ==================== DM HANDLERS ====================

      case 'NEW_DM':
        // Store DM locally
        await storeDMLocally(message.message);
        console.log(`💬 DM stored: @${message.message.conversationWith}`);
        sendResponse({ success: true });
        break;

      case 'SYNC_DMS':
        // Sync DMs to backend
        await syncDMsToBackend(message.messages, message.conversations);
        sendResponse({ success: true });
        break;

      case 'GET_DM_CONVERSATIONS':
        const conversations = await getDMConversations();
        sendResponse({ success: true, conversations });
        break;

    // ==================== CLASSIFICATION HANDLERS ====================

      case 'UPDATE_CONTACT_SCORE':
        // Update contact score in backend
        await updateContactScore(message.username, message.scoreBreakdown);
        sendResponse({ success: true });
        break;

      case 'CREATE_SUGGESTION':
        // Create classification suggestion
        const suggestion = await createSuggestion(
          message.username,
          message.transition,
          message.scoreBreakdown
        );
        
        if (suggestion) {
          // Update badge
          await classificationManager.updateBadge();
        }
        
        sendResponse({ success: true, suggestion });
        break;

      case 'GET_SUGGESTIONS':
        const suggestions = await classificationManager.getPendingSuggestions();
        sendResponse({ success: true, suggestions });
        break;

      case 'ACCEPT_SUGGESTION':
        const accepted = await classificationManager.acceptSuggestion(message.suggestionId);
        if (accepted) {
          await classificationManager.updateBadge();
        }
        sendResponse({ success: accepted });
        break;

      case 'REJECT_SUGGESTION':
        const rejected = await classificationManager.rejectSuggestion(
          message.suggestionId,
          message.reason
        );
        if (rejected) {
          await classificationManager.updateBadge();
        }
        sendResponse({ success: rejected });
        break;

    // ==================== FOLLOWER MONITORING ====================

      case 'FOLLOWER_CHANGE_DETECTED':
        // Create notification for follower change
        const changeType = message.changeType === 'follower' ? 'nouveau(x) follower(s)' : 'unfollower(s)';
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: `${message.count} ${changeType} détecté(s) !`,
          message: 'Cliquez sur l\'icône Waler pour synchroniser.',
          priority: 2
        });
        sendResponse({ success: true });
        break;

      case 'UPDATE_BADGE':
        // Update extension badge
        chrome.action.setBadgeText({ text: message.text });
        chrome.action.setBadgeBackgroundColor({ color: '#00FF00' });
        sendResponse({ success: true });
        break;

      case 'CHECK_NOTIFICATIONS':
        // Vérifier les notifications pour détecter les unfollowers cachés
        (async () => {
          try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]?.id) {
              await chrome.tabs.sendMessage(tabs[0].id, { 
                type: 'START_NOTIFICATION_CHECK' 
              });
              sendResponse({ success: true });
            } else {
              sendResponse({ success: false, error: 'No active tab' });
            }
          } catch (error) {
            console.error('Error checking notifications:', error);
            sendResponse({ success: false, error: String(error) });
          }
        })();
        return true; // Keep channel open for async response
      
      case 'INITIAL_SCAN_REQUIRED':
        // Notification pour scan initial requis
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: 'Scan initial requis',
          message: 'Cliquez sur l\'icône Waler pour lancer le scan de vos followers.',
          priority: 2
        });
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#FF6B00' });
        sendResponse({ success: true });
        break;

      case 'SCAN_PROGRESS':
        // Mettre à jour le badge avec la progression
        const progress = Math.floor((message.current / message.total) * 100);
        chrome.action.setBadgeText({ text: `${progress}%` });
        chrome.action.setBadgeBackgroundColor({ color: '#0095F6' });
        
        // Stocker la progression pour le popup
        await chrome.storage.local.set({
          scanProgress: {
            current: message.current,
            total: message.total,
            percentage: progress
          }
        });
        sendResponse({ success: true });
        break;

      case 'CLEAR_STORAGE':
        // Réinitialiser complètement l'extension (pour tests)
        await chrome.storage.local.clear();
        chrome.action.setBadgeText({ text: '' });
        console.log('🔄 Extension storage cleared - Reset to first use');
        sendResponse({ success: true });
        break;

      case 'SEND_UNFOLLOWER_RESULTS':
        // Envoyer les résultats de l'analyse des unfollowers au backend
        try {
          const stored = await chrome.storage.local.get('apiToken');
          
          if (!stored.apiToken) {
            console.error('No API token found');
            sendResponse({ success: false, error: 'Not authenticated' });
            break;
          }

          const response = await fetch('http://localhost:5000/api/extension/verify-missing-followers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${stored.apiToken}`,
            },
            body: JSON.stringify(message.data),
          });

          const result = await response.json();
          
          if (response.ok) {
            console.log('✅ Unfollower results sent to backend:', result);
            sendResponse({ success: true, data: result });
          } else {
            console.error('❌ Failed to send unfollower results:', result);
            sendResponse({ success: false, error: result.message });
          }
        } catch (error: any) {
          console.error('Error sending unfollower results:', error);
          sendResponse({ success: false, error: error.message });
        }
        break;

      case 'UNFOLLOWER_ANALYSIS_PROGRESS':
        // Mettre à jour la progression de l'analyse des unfollowers
        const analysisProgress = message.data;
        chrome.action.setBadgeText({ text: `${analysisProgress.percentage}%` });
        chrome.action.setBadgeBackgroundColor({ color: '#FF6B00' });
        
        // Stocker la progression
        await chrome.storage.local.set({
          unfollowerAnalysisProgress: analysisProgress
        });
        sendResponse({ success: true });
        break;

      case 'RESET_STATS':
        // Réinitialiser les statistiques de session
        await syncManager.resetStats();
        console.log('🔄 Session stats reset');
        sendResponse({ success: true });
        break;

      case 'UPDATE_UNFOLLOWER_STATS':
        // Mettre à jour les stats après l'analyse des unfollowers
        try {
          const stored = await chrome.storage.local.get('sessionStats');
          const sessionStats = stored.sessionStats || {
            followers: 0,
            unfollowers: 0,
            potentialBlockers: 0,
            engagements: 0,
          };

          // Ajouter les résultats de l'analyse aux stats existantes
          sessionStats.unfollowers += message.data.unfollowers || 0;
          sessionStats.potentialBlockers += message.data.potentialBlockers || 0;

          await chrome.storage.local.set({ sessionStats });
          console.log('📊 Session stats updated:', sessionStats);
          sendResponse({ success: true });
        } catch (error: any) {
          console.error('Error updating stats:', error);
          sendResponse({ success: false, error: error.message });
        }
        break;

      case 'SYNC_FULL_DATABASE':
        // Synchroniser toute la base de données locale avec le backend
        console.log('🔄 Starting full database sync...');
        const syncResult = await syncManager.syncFullDatabase();
        sendResponse(syncResult);
        break;

      case 'TRIGGER_AGENT_B':
        // Déclencher l'Agent B pour vérifier les unfollowers via Google
        try {
          const stored = await chrome.storage.local.get('apiToken');
          
          if (!stored.apiToken) {
            console.error('No API token found');
            sendResponse({ success: false, error: 'Not authenticated' });
            break;
          }

          const response = await fetch('http://localhost:5000/api/extension/trigger-agent-b', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${stored.apiToken}`,
            },
            body: JSON.stringify(message.data),
          });

          const result = await response.json();
          
          if (response.ok) {
            console.log('✅ Agent B triggered successfully:', result);
            sendResponse({ success: true, data: result });
          } else {
            console.error('❌ Failed to trigger Agent B:', result);
            sendResponse({ success: false, error: result.message });
          }
        } catch (error: any) {
          console.error('Error triggering Agent B:', error);
          sendResponse({ success: false, error: error.message });
        }
        break;

      case 'ANALYSIS_COMPLETED':
        // L'analyse des unfollowers est terminée
        console.log('✅ Analysis completed:', message.data);
        
        // Notifier tous les onglets du dashboard pour qu'ils se rafraîchissent
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          if (tab.url?.includes('localhost:5000/dashboard')) {
            try {
              await chrome.tabs.sendMessage(tab.id!, {
                type: 'REFRESH_DASHBOARD',
                data: message.data
              });
              console.log(`📤 Sent refresh notification to dashboard tab ${tab.id}`);
            } catch (error) {
              // L'onglet n'a peut-être pas de content script
              console.log(`Could not send message to tab ${tab.id}`);
            }
          }
        }
        
        sendResponse({ success: true });
        break;

      case 'FOLLOWER_COUNT_CHANGED':
        // Le nombre de followers a changé
        console.log('🔔 Follower count changed:', message.data);
        
        const { oldCount, newCount, diff } = message.data;
        
        // Créer une notification
        await chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: 'FlowTrack - Followers Changed',
          message: diff > 0 
            ? `+${diff} nouveau(x) follower(s) ! (${oldCount} → ${newCount})`
            : `${Math.abs(diff)} unfollower(s) détecté(s) (${oldCount} → ${newCount})`,
          priority: 2,
        });
        
        // Mettre à jour le badge
        chrome.action.setBadgeText({ text: diff > 0 ? `+${diff}` : `${diff}` });
        chrome.action.setBadgeBackgroundColor({ color: diff > 0 ? '#02c950' : '#f59e0b' });
        
        console.log(`📊 Badge updated: ${diff > 0 ? '+' : ''}${diff}`);
        
        // Transmettre le message aux content scripts Instagram pour synchroniser lastFollowerCount
        const instagramTabs = await chrome.tabs.query({ url: '*://www.instagram.com/*' });
        for (const tab of instagramTabs) {
          if (tab.id) {
            try {
              await chrome.tabs.sendMessage(tab.id, {
                type: 'FOLLOWER_COUNT_CHANGED',
                data: message.data
              });
              console.log(`📤 Sent FOLLOWER_COUNT_CHANGED to Instagram tab ${tab.id}`);
            } catch (error) {
              console.log(`Could not send message to tab ${tab.id}:`, error);
            }
          }
        }
        
        sendResponse({ success: true });
        break;

      case 'UPDATE_USER_INFO':
        // Mettre à jour les informations utilisateur (followers, following, etc.)
        console.log('📊 Updating user info:', message.data);
        
        try {
          // Toujours stocker les informations localement
          await chrome.storage.local.set({ userInfo: message.data });
          console.log('💾 User info stored locally');
          
          const { userId, apiToken: token } = await chrome.storage.local.get(['userId', 'apiToken']);
          
          if (!userId || !token) {
            console.warn('⚠️ No authentication found - data stored locally only');
            console.log('ℹ️ Will be sent to backend on next sync when authenticated');
            sendResponse({ success: true, stored: true, sent: false });
            break;
          }
          
          console.log('🔐 Authentication found, sending to backend...');
          
          // Envoyer au backend immédiatement
          const response = await fetch('http://localhost:5000/api/users/instagram-stats', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              followersCount: message.data.followersCount || 0,
              followingCount: message.data.followingCount || 0,
              postsCount: message.data.postsCount || 0,
              bio: message.data.bio || '',
              isPrivate: message.data.isPrivate || false,
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ User info updated successfully:', data);
            
            // Notifier le dashboard pour qu'il se rafraîchisse
            const dashboardTabs = await chrome.tabs.query({});
            for (const tab of dashboardTabs) {
              if (tab.url?.includes('localhost:5000/dashboard')) {
                try {
                  await chrome.tabs.sendMessage(tab.id!, {
                    type: 'REFRESH_DASHBOARD',
                    data: { userInfoUpdated: true }
                  });
                  console.log(`📤 Sent refresh notification to dashboard tab ${tab.id}`);
                } catch (error) {
                  console.log(`Could not send message to tab ${tab.id}`);
                }
              }
            }
            
            sendResponse({ success: true, data });
          } else {
            const error = await response.text();
            console.error('❌ Failed to update user info:', error);
            sendResponse({ success: false, error });
          }
        } catch (error) {
          console.error('❌ Error updating user info:', error);
          sendResponse({ success: false, error: String(error) });
        }
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  })();

  // Retourner true pour indiquer que sendResponse sera appelé de manière asynchrone
  return true;
});

// ==================== DM FUNCTIONS ====================

/**
 * Store DM locally in storage
 */
async function storeDMLocally(message: any) {
  const stored = await chrome.storage.local.get('dm_messages');
  const messages: any[] = (stored.dm_messages as any[]) || [];
  
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
async function syncDMsToBackend(messages: any[], conversations: any[]) {
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
    } else {
      console.error('Failed to sync DMs:', response.status);
    }
  } catch (error) {
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
  } catch (error) {
    console.error('Error getting DM conversations:', error);
  }
  
  return [];
}

// ==================== CLASSIFICATION FUNCTIONS ====================

/**
 * Update contact score in backend
 */
async function updateContactScore(username: string, scoreBreakdown: any) {
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
    } else {
      console.error('Failed to update contact score:', response.status);
    }
  } catch (error) {
    console.error('Error updating contact score:', error);
  }
}

/**
 * Create classification suggestion
 */
async function createSuggestion(username: string, transition: any, scoreBreakdown: any) {
  try {
    const stored = await chrome.storage.local.get(['apiToken', 'userId']);
    
    if (!stored.apiToken || !stored.userId) {
      console.error('No API token or user ID found');
      return null;
    }

    const suggestion = await classificationManager.createSuggestion(
      stored.userId as number,
      username,
      transition.from,
      transition.to,
      scoreBreakdown.total,
      transition.confidence,
      transition.reason,
      transition.evidence || []
    );

    if (suggestion) {
      console.log(`💡 Suggestion created: @${username} ${transition.from} → ${transition.to}`);
    }

    return suggestion;
  } catch (error) {
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


