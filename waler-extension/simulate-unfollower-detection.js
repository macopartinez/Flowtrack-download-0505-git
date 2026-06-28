/**
 * Script pour simuler la détection d'unfollowers
 * Sans avoir à refaire toute l'analyse
 */

async function simulateUnfollowerDetection() {
  console.log('🎬 Simulation de détection d\'unfollowers...\n');

  // 1. Récupérer les stats actuelles
  const stored = await chrome.storage.local.get(['sessionStats', 'followerDatabase']);
  const currentStats = stored.sessionStats || {
    followers: 0,
    unfollowers: 0,
    potentialBlockers: 0,
    engagements: 0,
  };

  console.log('📊 Stats actuelles:', currentStats);

  // 2. Simuler la détection de 2 unfollowers
  const mockResults = {
    unfollowers: 2,
    potentialBlockers: 0,
  };

  console.log('🔍 Unfollowers détectés:', mockResults);

  // 3. Mettre à jour les stats de session
  const newStats = {
    ...currentStats,
    unfollowers: currentStats.unfollowers + mockResults.unfollowers,
    potentialBlockers: currentStats.potentialBlockers + mockResults.potentialBlockers,
  };

  await chrome.storage.local.set({ sessionStats: newStats });
  console.log('✅ Stats de session mises à jour:', newStats);

  // 4. Envoyer le message UPDATE_UNFOLLOWER_STATS au service worker
  const updateResponse = await chrome.runtime.sendMessage({
    type: 'UPDATE_UNFOLLOWER_STATS',
    data: mockResults,
  });
  console.log('📤 UPDATE_UNFOLLOWER_STATS envoyé:', updateResponse);

  // 5. Envoyer le message ANALYSIS_COMPLETED pour déclencher le rafraîchissement
  const completedResponse = await chrome.runtime.sendMessage({
    type: 'ANALYSIS_COMPLETED',
    data: {
      unfollowers: mockResults.unfollowers,
      blocked: 0,
      notFound: mockResults.potentialBlockers,
    },
  });
  console.log('📤 ANALYSIS_COMPLETED envoyé:', completedResponse);

  console.log('\n✅ Simulation terminée !');
  console.log('📱 Vérifiez le popup - les stats devraient se mettre à jour automatiquement');
  console.log('🌐 Vérifiez le dashboard - il devrait se rafraîchir automatiquement');
  console.log('\n📊 Nouvelles stats:');
  console.log(`   - Unfollowers: ${newStats.unfollowers}`);
  console.log(`   - Potential Blockers: ${newStats.potentialBlockers}`);
}

// Exécuter la simulation
simulateUnfollowerDetection().catch(console.error);
