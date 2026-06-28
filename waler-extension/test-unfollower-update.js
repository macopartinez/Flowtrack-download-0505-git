/**
 * Script de test pour simuler la fin d'une analyse d'unfollowers
 * et vérifier que les stats se mettent à jour automatiquement
 */

// Simuler des résultats d'analyse
const mockAnalysisResults = {
  unfollowers: 2,
  blocked: 0,
  notFound: 0
};

console.log('🧪 Test de mise à jour automatique des stats après analyse');
console.log('📊 Résultats simulés:', mockAnalysisResults);

// Envoyer le message ANALYSIS_COMPLETED au service worker
chrome.runtime.sendMessage({
  type: 'ANALYSIS_COMPLETED',
  data: mockAnalysisResults
}, (response) => {
  if (chrome.runtime.lastError) {
    console.error('❌ Erreur:', chrome.runtime.lastError);
  } else {
    console.log('✅ Message envoyé avec succès:', response);
    console.log('📱 Le popup devrait se rafraîchir automatiquement');
    console.log('🌐 Le dashboard devrait se rafraîchir automatiquement');
  }
});

console.log('\n📝 Instructions:');
console.log('1. Ouvrez le popup de l\'extension');
console.log('2. Ouvrez le dashboard dans un onglet');
console.log('3. Vérifiez que les stats se mettent à jour automatiquement');
