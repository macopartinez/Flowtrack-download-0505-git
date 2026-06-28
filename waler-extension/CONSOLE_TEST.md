# Test de mise à jour automatique des stats

## Option 1 : Via la console de l'extension (RECOMMANDÉ)

### Étape 1 : Ouvrir la console de l'extension
1. Allez sur `chrome://extensions/`
2. Activez le "Mode développeur" en haut à droite
3. Trouvez l'extension "Waler"
4. Cliquez sur "Service worker" (ou "background page")
5. Une console DevTools s'ouvrira

### Étape 2 : Copier-coller ce code dans la console

```javascript
// Simuler la fin d'une analyse d'unfollowers
(async function testUnfollowerUpdate() {
  console.log('🧪 Test de mise à jour automatique des stats\n');

  // 1. Mettre à jour les stats de session
  const stored = await chrome.storage.local.get('sessionStats');
  const currentStats = stored.sessionStats || {
    followers: 0,
    unfollowers: 0,
    potentialBlockers: 0,
    engagements: 0,
  };

  console.log('📊 Stats actuelles:', currentStats);

  // Ajouter 2 unfollowers
  const newStats = {
    ...currentStats,
    unfollowers: currentStats.unfollowers + 2,
  };

  await chrome.storage.local.set({ sessionStats: newStats });
  console.log('✅ Stats mises à jour:', newStats);

  // 2. Envoyer la notification ANALYSIS_COMPLETED
  // Cela va déclencher le rafraîchissement automatique du popup et du dashboard
  const mockResults = {
    unfollowers: 2,
    blocked: 0,
    notFound: 0,
  };

  console.log('📤 Envoi de ANALYSIS_COMPLETED...');
  
  // Notifier tous les onglets du dashboard
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.url?.includes('localhost:5000/dashboard')) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'REFRESH_DASHBOARD',
          data: mockResults
        });
        console.log(`✅ Dashboard tab ${tab.id} notifié`);
      } catch (error) {
        console.log(`⚠️  Tab ${tab.id} ne peut pas recevoir de message`);
      }
    }
  }

  console.log('\n✅ Test terminé !');
  console.log('📱 Ouvrez le popup - les stats devraient afficher +2 unfollowers');
  console.log('🌐 Le dashboard devrait se rafraîchir automatiquement');
})();
```

### Étape 3 : Vérifier les résultats
1. **Popup** : Cliquez sur l'icône de l'extension - vous devriez voir les unfollowers augmenter de 2
2. **Dashboard** : Si vous avez un onglet dashboard ouvert, il devrait se rafraîchir automatiquement

---

## Option 2 : Via la console d'une page Instagram

### Étape 1 : Ouvrir Instagram
1. Allez sur `https://www.instagram.com/`
2. Ouvrez la console DevTools (F12)

### Étape 2 : Copier-coller ce code

```javascript
// Simuler la fin d'une analyse d'unfollowers depuis une page Instagram
(async function simulateAnalysisComplete() {
  console.log('🧪 Simulation de fin d\'analyse d\'unfollowers\n');

  const mockResults = {
    unfollowers: 2,
    blocked: 0,
    notFound: 0,
  };

  console.log('📊 Résultats simulés:', mockResults);

  // Envoyer le message au service worker
  const response = await chrome.runtime.sendMessage({
    type: 'ANALYSIS_COMPLETED',
    data: mockResults,
  });

  console.log('✅ Message envoyé:', response);
  console.log('📱 Le popup devrait se rafraîchir automatiquement');
  console.log('🌐 Le dashboard devrait se rafraîchir automatiquement');
})();
```

---

## Option 3 : Réinitialiser les stats pour retester

Si vous voulez remettre les stats à zéro pour retester :

```javascript
// Dans la console de l'extension (Service Worker)
(async function resetStats() {
  await chrome.storage.local.set({
    sessionStats: {
      followers: 0,
      unfollowers: 0,
      potentialBlockers: 0,
      engagements: 0,
    }
  });
  console.log('✅ Stats réinitialisées à zéro');
})();
```

---

## Vérification des stats actuelles

Pour voir les stats actuelles :

```javascript
// Dans la console de l'extension (Service Worker)
(async function checkStats() {
  const stored = await chrome.storage.local.get('sessionStats');
  console.log('📊 Stats actuelles:', stored.sessionStats);
})();
```
