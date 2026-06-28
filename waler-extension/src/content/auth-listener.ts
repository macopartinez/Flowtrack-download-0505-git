// Content script qui lit le token d'authentification depuis l'URL

console.log('🔌 Waler Auth Listener loaded');

// Fonction pour extraire les paramètres de l'URL
function checkUrlForAuth() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('waler_token');
  const userId = url.searchParams.get('waler_user_id');

  if (token && userId) {
    console.log('🔐 Found auth token in URL, forwarding to extension...');
    console.log('User ID:', userId);
    
    // Transmettre au service worker de l'extension
    chrome.runtime.sendMessage({
      type: 'WALER_AUTH',
      userId: parseInt(userId),
      apiToken: token,
    }).then((response) => {
      console.log('✅ Auth forwarded to extension successfully');
      console.log('Response from service worker:', response);
      
      // Nettoyer l'URL pour ne pas exposer le token
      url.searchParams.delete('waler_token');
      url.searchParams.delete('waler_user_id');
      window.history.replaceState({}, '', url.toString());
      console.log('🧹 Token removed from URL');
    }).catch((error) => {
      console.error('❌ Error forwarding auth:', error);
    });
  } else {
    console.log('⏳ Waiting for auth token in URL...');
  }
}

// Vérifier l'URL au chargement
checkUrlForAuth();

// Observer les changements d'URL (pour les SPAs)
let lastUrl = window.location.href;
new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    checkUrlForAuth();
  }
}).observe(document, { subtree: true, childList: true });

// Relayer REFRESH_DASHBOARD / REFRESH_PRO_STATS du service worker vers la page
// React via window.postMessage.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REFRESH_DASHBOARD') {
    console.log('🔄 [AuthListener] Relais REFRESH_DASHBOARD → page');
    window.postMessage({ type: 'WALER_REFRESH_DASHBOARD', data: message.data }, '*');
    sendResponse({ success: true });
  } else if (message.type === 'REFRESH_PRO_STATS') {
    console.log('🔄 [AuthListener] Relais REFRESH_PRO_STATS → page');
    window.postMessage({ type: 'WALER_REFRESH_PRO_STATS', data: message.data }, '*');
    sendResponse({ success: true });
  }
  return true;
});
