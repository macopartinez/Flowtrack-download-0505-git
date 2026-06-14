// Version utilisant l'API Chrome native au lieu de webextension-polyfill
async function init() {
    try {
        const loading = document.getElementById('loading');
        const notAuthenticated = document.getElementById('not-authenticated');
        const authenticated = document.getElementById('authenticated');
        const stored = await chrome.storage.local.get(['isAuthenticated', 'userId', 'lastSync']);
        loading.style.display = 'none';
        if (!stored.isAuthenticated) {
            notAuthenticated.style.display = 'block';
            setupLoginButton();
        }
        else {
            authenticated.style.display = 'block';
            await loadStats();
            setupButtons();
            // Démarrer le refresh automatique seulement si authentifié
            setInterval(loadStats, 30000);
        }
    }
    catch (error) {
        console.error('Init error:', error);
        // Afficher quand même quelque chose en cas d'erreur
        const loading = document.getElementById('loading');
        if (loading) {
            loading.innerHTML = '<div style="color: #ff4444;">Erreur de chargement. Vérifiez la console.</div>';
        }
    }
}
async function loadStats() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
        if (response && response.success && response.data) {
            const stats = response.data;
            document.getElementById('followers-count').textContent = (stats.followers || 0).toString();
            document.getElementById('unfollowers-count').textContent = (stats.unfollowers || 0).toString();
            document.getElementById('blockers-count').textContent = (stats.blockers || 0).toString();
            document.getElementById('pending-count').textContent = (stats.pendingSync || 0).toString();
        }
        else {
            // Valeurs par défaut si pas de données
            document.getElementById('followers-count').textContent = '0';
            document.getElementById('unfollowers-count').textContent = '0';
            document.getElementById('blockers-count').textContent = '0';
            document.getElementById('pending-count').textContent = '0';
        }
    }
    catch (error) {
        console.error('Error loading stats:', error);
        // Afficher 0 en cas d'erreur
        document.getElementById('followers-count').textContent = '0';
        document.getElementById('unfollowers-count').textContent = '0';
        document.getElementById('blockers-count').textContent = '0';
        document.getElementById('pending-count').textContent = '0';
    }
    const stored = await chrome.storage.local.get('lastSync');
    if (stored.lastSync) {
        const lastSync = new Date(stored.lastSync);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - lastSync.getTime()) / 60000);
        let syncText = 'Dernière sync: ';
        if (diffMinutes < 1) {
            syncText += 'À l\'instant';
        }
        else if (diffMinutes < 60) {
            syncText += `Il y a ${diffMinutes} min`;
        }
        else {
            const diffHours = Math.floor(diffMinutes / 60);
            syncText += `Il y a ${diffHours}h`;
        }
        document.getElementById('sync-info').textContent = syncText;
    }
}
function setupLoginButton() {
    const loginBtn = document.getElementById('login-btn');
    loginBtn.addEventListener('click', () => {
        chrome.tabs.create({
            url: 'http://localhost:5000/extension-auth',
        });
    });
}
function setupButtons() {
    const syncBtn = document.getElementById('sync-btn');
    const dashboardBtn = document.getElementById('dashboard-btn');
    syncBtn.addEventListener('click', async () => {
        syncBtn.textContent = 'Synchronisation...';
        syncBtn.setAttribute('disabled', 'true');
        try {
            await chrome.runtime.sendMessage({ type: 'SYNC_NOW' });
            await loadStats();
            syncBtn.textContent = '✓ Synchronisé';
            setTimeout(() => {
                syncBtn.textContent = 'Synchroniser maintenant';
                syncBtn.removeAttribute('disabled');
            }, 2000);
        }
        catch (error) {
            console.error('Sync error:', error);
            syncBtn.textContent = '✗ Erreur';
            syncBtn.removeAttribute('disabled');
        }
    });
    dashboardBtn.addEventListener('click', async () => {
        const stored = await chrome.storage.local.get('userId');
        chrome.tabs.create({
            url: `http://localhost:5000/dashboard/${stored.userId}`,
        });
    });
}
init();
