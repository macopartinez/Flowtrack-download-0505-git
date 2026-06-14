// Version utilisant l'API Chrome native au lieu de webextension-polyfill

async function init() {
  try {
    const loading = document.getElementById('loading')!;
    const notAuthenticated = document.getElementById('not-authenticated')!;
    const authenticated = document.getElementById('authenticated')!;

    const stored = await chrome.storage.local.get(['isAuthenticated', 'userId', 'lastSync']);

    loading.style.display = 'none';

    if (!stored.isAuthenticated) {
      notAuthenticated.style.display = 'block';
      setupLoginButton();
    } else {
      authenticated.style.display = 'block';
      await loadStats();
      await checkInitialScanStatus();
      setupButtons();
      // Démarrer le refresh automatique seulement si authentifié
      setInterval(loadStats, 30000);
    }
  } catch (error) {
    console.error('Init error:', error);
    // Afficher quand même quelque chose en cas d'erreur
    const loading = document.getElementById('loading');
    if (loading) {
      loading.innerHTML = '<div style="color: #ff4444;">Erreur de chargement. Vérifiez la console.</div>';
    }
  }
}

async function checkInitialScanStatus() {
  try {
    const stored = await chrome.storage.local.get(['followerDatabase', 'unfollowerDetected', 'unfollowerCount']);
    const initialScanBtn = document.getElementById('initial-scan-btn')!;
    const unfollowerAnalysisBtn = document.getElementById('unfollower-analysis-btn')!;
    const unfollowerAlert = document.getElementById('unfollower-alert')!;
    const unfollowerCountBadge = document.getElementById('unfollower-count-badge')!;
    
    if (!stored.followerDatabase || !stored.followerDatabase.isInitialized) {
      // Afficher le bouton de scan initial
      initialScanBtn.style.display = 'block';
    } else {
      initialScanBtn.style.display = 'none';
    }

    // Vérifier si des unfollowers ont été détectés
    if (stored.unfollowerDetected && stored.unfollowerCount > 0) {
      unfollowerAlert.style.display = 'block';
      unfollowerAnalysisBtn.style.display = 'block';
      unfollowerCountBadge.textContent = stored.unfollowerCount.toString();
    } else {
      unfollowerAlert.style.display = 'none';
      unfollowerAnalysisBtn.style.display = 'none';
    }
  } catch (error) {
    console.error('Error checking initial scan status:', error);
  }
}

async function loadStats() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATS' }) as any;
    
    if (response && response.success && response.data) {
      const stats = response.data;
      
      document.getElementById('followers-count')!.textContent = (stats.followers || 0).toString();
      document.getElementById('unfollowers-count')!.textContent = (stats.unfollowers || 0).toString();
      document.getElementById('potential-blockers-count')!.textContent = (stats.potentialBlockers || 0).toString();
      document.getElementById('pending-count')!.textContent = (stats.pendingSync || 0).toString();
    } else {
      // Valeurs par défaut si pas de données
      document.getElementById('followers-count')!.textContent = '0';
      document.getElementById('unfollowers-count')!.textContent = '0';
      document.getElementById('potential-blockers-count')!.textContent = '0';
      document.getElementById('pending-count')!.textContent = '0';
    }
  } catch (error) {
    console.error('Error loading stats:', error);
    // Afficher 0 en cas d'erreur
    document.getElementById('followers-count')!.textContent = '0';
    document.getElementById('unfollowers-count')!.textContent = '0';
    document.getElementById('potential-blockers-count')!.textContent = '0';
    document.getElementById('pending-count')!.textContent = '0';
  }

  // Vérifier si une analyse est en cours
  await checkAnalysisStatus();

  const stored = await chrome.storage.local.get('lastSync');
  if (stored.lastSync) {
    const lastSync = new Date(stored.lastSync as number);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSync.getTime()) / 60000);
    
    let syncText = 'Dernière sync: ';
    if (diffMinutes < 1) {
      syncText += 'À l\'instant';
    } else if (diffMinutes < 60) {
      syncText += `Il y a ${diffMinutes} min`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      syncText += `Il y a ${diffHours}h`;
    }
    
    document.getElementById('sync-info')!.textContent = syncText;
  }
}

async function checkAnalysisStatus() {
  try {
    const stored = await chrome.storage.local.get(['unfollowerCheckState', 'isAnalyzing']);
    const analysisIndicator = document.getElementById('analysis-indicator')!;
    const analysisProgress = document.getElementById('analysis-progress')!;
    const analysisStatus = document.getElementById('analysis-status')!;

    if (stored.isAnalyzing || stored.unfollowerCheckState) {
      // Analyse en cours
      analysisIndicator.style.display = 'block';
      
      if (stored.unfollowerCheckState) {
        const state = stored.unfollowerCheckState;
        const percentage = Math.round((state.currentIndex / state.missingFollowers.length) * 100);
        analysisProgress.textContent = `${percentage}%`;
        analysisStatus.textContent = `Vérification ${state.currentIndex}/${state.missingFollowers.length} comptes...`;
      } else {
        analysisProgress.textContent = '0%';
        analysisStatus.textContent = 'Initialisation...';
      }
    } else {
      // Pas d'analyse en cours
      analysisIndicator.style.display = 'none';
    }
  } catch (error) {
    console.error('Error checking analysis status:', error);
  }
}

function setupLoginButton() {
  const loginBtn = document.getElementById('login-btn')!;
  loginBtn.addEventListener('click', () => {
    chrome.tabs.create({
      url: 'http://localhost:5000/extension-auth',
    });
  });
}

function setupButtons() {
  const initialScanBtn = document.getElementById('initial-scan-btn')!;
  const unfollowerAnalysisBtn = document.getElementById('unfollower-analysis-btn')!;
  const syncBtn = document.getElementById('sync-btn')!;
  const syncFullBtn = document.getElementById('sync-full-btn')!;
  const dashboardBtn = document.getElementById('dashboard-btn')!;
  const resetStatsBtn = document.getElementById('reset-stats-btn')!;
  const fixCountBtn = document.getElementById('fix-count-btn')!;
  let isSyncing = false;
  let isAnalyzing = false;
  let isFullSyncing = false;

  // Bouton fix compteur (Debug)
  fixCountBtn.addEventListener('click', async () => {
    const originalText = fixCountBtn.textContent;
    fixCountBtn.textContent = '⏳ Correction...';
    fixCountBtn.setAttribute('disabled', 'true');
    
    try {
      // Demander à l'utilisateur le nombre correct
      const targetCountStr = prompt('Entrez le nombre de followers affiché sur Instagram:', '213');
      
      if (!targetCountStr) {
        fixCountBtn.textContent = originalText;
        fixCountBtn.removeAttribute('disabled');
        return;
      }
      
      const targetCount = parseInt(targetCountStr);
      
      if (isNaN(targetCount) || targetCount < 0) {
        fixCountBtn.textContent = '❌ Nombre invalide';
        setTimeout(() => {
          fixCountBtn.textContent = originalText;
          fixCountBtn.removeAttribute('disabled');
        }, 2000);
        return;
      }
      
      const stored = await chrome.storage.local.get('followerDatabase');
      if (!stored.followerDatabase) {
        fixCountBtn.textContent = '❌ DB non trouvée';
        setTimeout(() => {
          fixCountBtn.textContent = originalText;
          fixCountBtn.removeAttribute('disabled');
        }, 2000);
        return;
      }
      
      const db = stored.followerDatabase;
      const actualCount = Object.keys(db.followers).length;
      const oldCount = db.totalCount;
      
      // Forcer à la valeur cible
      db.totalCount = targetCount;
      
      await chrome.storage.local.set({ 
        followerDatabase: db,
        lastFollowerCount: targetCount
      });
      
      fixCountBtn.textContent = `✅ ${oldCount} → ${targetCount}`;
      console.log(`🔧 Compteur corrigé: ${oldCount} → ${targetCount}`);
      console.log(`📊 Followers en DB: ${actualCount}, Nouveau total: ${targetCount}`);
      
      // Recharger les stats
      setTimeout(async () => {
        await loadStats();
        await checkInitialScanStatus();
        fixCountBtn.textContent = originalText;
        fixCountBtn.removeAttribute('disabled');
      }, 2000);
    } catch (error) {
      console.error('Error fixing count:', error);
      fixCountBtn.textContent = '❌ Erreur';
      setTimeout(() => {
        fixCountBtn.textContent = originalText;
        fixCountBtn.removeAttribute('disabled');
      }, 2000);
    }
  });

  // Bouton réinitialiser les stats
  resetStatsBtn.addEventListener('click', async () => {
    if (confirm('Voulez-vous vraiment réinitialiser les statistiques de session ?')) {
      try {
        await chrome.runtime.sendMessage({ type: 'RESET_STATS' });
        await loadStats();
        console.log('✅ Stats réinitialisées');
      } catch (error) {
        console.error('Error resetting stats:', error);
      }
    }
  });

  // Bouton synchronisation complète
  syncFullBtn.addEventListener('click', async () => {
    if (isFullSyncing) {
      console.log('⏳ Synchronisation complète déjà en cours...');
      return;
    }

    isFullSyncing = true;
    const originalText = syncFullBtn.textContent;
    syncFullBtn.textContent = '⏳ Synchronisation en cours...';
    syncFullBtn.setAttribute('disabled', 'true');
    syncFullBtn.style.opacity = '0.6';

    try {
      const response = await chrome.runtime.sendMessage({ type: 'SYNC_FULL_DATABASE' });
      
      if (response.success) {
        syncFullBtn.textContent = `✅ ${response.synced} followers synchronisés !`;
        console.log('✅ Full sync successful:', response);
        
        setTimeout(() => {
          syncFullBtn.textContent = originalText;
          syncFullBtn.removeAttribute('disabled');
          syncFullBtn.style.opacity = '1';
          isFullSyncing = false;
        }, 3000);
      } else {
        syncFullBtn.textContent = '❌ Erreur de synchronisation';
        console.error('❌ Full sync failed:', response.error);
        
        setTimeout(() => {
          syncFullBtn.textContent = originalText;
          syncFullBtn.removeAttribute('disabled');
          syncFullBtn.style.opacity = '1';
          isFullSyncing = false;
        }, 3000);
      }
    } catch (error) {
      console.error('Error during full sync:', error);
      syncFullBtn.textContent = '❌ Erreur';
      
      setTimeout(() => {
        syncFullBtn.textContent = originalText;
        syncFullBtn.removeAttribute('disabled');
        syncFullBtn.style.opacity = '1';
        isFullSyncing = false;
      }, 3000);
    }
  });

  // Bouton scan initial
  initialScanBtn.addEventListener('click', async () => {
    initialScanBtn.textContent = '⏳ Scan en cours...';
    initialScanBtn.setAttribute('disabled', 'true');
    initialScanBtn.style.opacity = '0.6';

    try {
      // Envoyer un message au content script pour lancer le scan
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        await chrome.tabs.sendMessage(tabs[0].id, { type: 'START_INITIAL_SCAN' });
      }
      
      initialScanBtn.textContent = '✓ Scan lancé !';
      
      setTimeout(() => {
        initialScanBtn.style.display = 'none';
      }, 2000);
    } catch (error) {
      console.error('Error starting initial scan:', error);
      initialScanBtn.textContent = '✗ Erreur';
      initialScanBtn.removeAttribute('disabled');
      initialScanBtn.style.opacity = '1';
    }
  });

  // Bouton analyse des unfollowers
  unfollowerAnalysisBtn.addEventListener('click', async () => {
    if (isAnalyzing) {
      console.log('⏳ Analyse déjà en cours...');
      return;
    }

    isAnalyzing = true;
    unfollowerAnalysisBtn.textContent = '⏳ Analyse en cours...';
    unfollowerAnalysisBtn.setAttribute('disabled', 'true');
    unfollowerAnalysisBtn.style.opacity = '0.6';

    try {
      // Vérifier que l'utilisateur est sur Instagram
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];
      
      if (!currentTab?.url?.includes('instagram.com')) {
        alert('Veuillez ouvrir Instagram dans l\'onglet actif pour lancer l\'analyse.');
        unfollowerAnalysisBtn.textContent = '🔍 Analyser les unfollowers';
        unfollowerAnalysisBtn.removeAttribute('disabled');
        unfollowerAnalysisBtn.style.opacity = '1';
        isAnalyzing = false;
        return;
      }

      // Envoyer un message au content script pour lancer l'analyse
      if (currentTab.id) {
        await chrome.tabs.sendMessage(currentTab.id, { type: 'START_UNFOLLOWER_ANALYSIS' });
      }
      
      unfollowerAnalysisBtn.textContent = '✓ Analyse lancée !';
      
      setTimeout(() => {
        unfollowerAnalysisBtn.style.display = 'none';
        document.getElementById('unfollower-alert')!.style.display = 'none';
        isAnalyzing = false;
      }, 2000);
    } catch (error) {
      console.error('Error starting unfollower analysis:', error);
      unfollowerAnalysisBtn.textContent = '✗ Erreur';
      unfollowerAnalysisBtn.removeAttribute('disabled');
      unfollowerAnalysisBtn.style.opacity = '1';
      isAnalyzing = false;
    }
  });

  syncBtn.addEventListener('click', async () => {
    // Empêcher les clics multiples
    if (isSyncing) {
      console.log('⏳ Synchronisation déjà en cours...');
      return;
    }

    isSyncing = true;
    syncBtn.textContent = 'Synchronisation...';
    syncBtn.setAttribute('disabled', 'true');
    syncBtn.style.opacity = '0.6';
    syncBtn.style.cursor = 'not-allowed';

    try {
      // 1. Vérifier les notifications pour détecter les unfollowers cachés
      syncBtn.textContent = '🔔 Vérification notifications...';
      await chrome.runtime.sendMessage({ type: 'CHECK_NOTIFICATIONS' });
      
      // 2. Synchroniser normalement
      syncBtn.textContent = '📤 Synchronisation...';
      await chrome.runtime.sendMessage({ type: 'SYNC_NOW' });
      await loadStats();
      syncBtn.textContent = '✓ Synchronisé';
      
      setTimeout(() => {
        syncBtn.textContent = 'Synchroniser maintenant';
        syncBtn.removeAttribute('disabled');
        syncBtn.style.opacity = '1';
        syncBtn.style.cursor = 'pointer';
        isSyncing = false;
      }, 3000);
    } catch (error) {
      console.error('Sync error:', error);
      syncBtn.textContent = '✗ Erreur';
      
      setTimeout(() => {
        syncBtn.textContent = 'Synchroniser maintenant';
        syncBtn.removeAttribute('disabled');
        syncBtn.style.opacity = '1';
        syncBtn.style.cursor = 'pointer';
        isSyncing = false;
      }, 2000);
    }
  });

  dashboardBtn.addEventListener('click', async () => {
    const stored = await chrome.storage.local.get('userId');
    chrome.tabs.create({
      url: `http://localhost:5000/dashboard/${stored.userId}`,
    });
  });
}

// Écouter les messages du background script pour rafraîchir automatiquement
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ANALYSIS_COMPLETED') {
    console.log('✅ Analysis completed, refreshing stats...', message.data);
    
    // Rafraîchir les stats immédiatement
    loadStats().then(() => {
      console.log('📊 Stats refreshed after analysis completion');
    });
    
    // Afficher une notification visuelle
    const analysisIndicator = document.getElementById('analysis-indicator');
    if (analysisIndicator) {
      analysisIndicator.style.display = 'none';
    }
    
    sendResponse({ success: true });
  }
  return true; // Keep the message channel open for async response
});

init();


