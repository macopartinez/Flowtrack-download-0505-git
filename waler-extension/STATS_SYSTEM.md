# Système de Statistiques de Session

## 📊 Vue d'ensemble

Les statistiques affichées dans le popup de l'extension Waler sont des **statistiques de session** qui persistent même après synchronisation avec le backend.

## 🔧 Fonctionnement

### Avant (Problème)
```
Nouveau follower détecté
    ↓
Ajouté à la syncQueue
    ↓
Synchronisation immédiate
    ↓
syncQueue vidée
    ↓
Stats affichent 0 ❌
```

### Après (Solution)
```
Nouveau follower détecté
    ↓
Ajouté à la syncQueue
    ↓
Incrémentation de sessionStats.followers
    ↓
Synchronisation immédiate
    ↓
syncQueue vidée
    ↓
Stats affichent le nombre correct ✅
```

## 📦 Structure des Données

### sessionStats (chrome.storage.local)
```typescript
{
  followers: number,        // Nouveaux followers de cette session
  unfollowers: number,      // Unfollowers de cette session
  potentialBlockers: number, // Blockers potentiels de cette session
  engagements: number       // Engagements de cette session
}
```

### syncQueue (chrome.storage.local)
```typescript
[
  {
    type: 'follower' | 'unfollower' | 'potential_blocker' | 'engagement',
    username: string,
    avatarUrl?: string,
    timestamp: number,
    metadata?: Record<string, any>
  },
  ...
]
```

## 🎯 Méthodes Principales

### 1. `incrementStat(type)`
Incrémente le compteur de session pour un type donné.

```typescript
await syncManager.incrementStat('follower');
// sessionStats.followers++
```

### 2. `getLocalStats()`
Retourne les statistiques actuelles de la session.

```typescript
const stats = await syncManager.getLocalStats();
// {
//   pendingSync: 0,
//   followers: 5,
//   unfollowers: 2,
//   potentialBlockers: 0,
//   engagements: 12
// }
```

### 3. `resetStats()`
Réinitialise toutes les statistiques de session à 0.

```typescript
await syncManager.resetStats();
// Tous les compteurs remis à 0
```

## 🔄 Flux de Tracking

### Nouveau Follower
```typescript
// 1. Ajout à la queue
await this.addToQueue({
  type: 'follower',
  username: 'john_doe',
  timestamp: Date.now()
});

// 2. Incrémentation des stats
await this.incrementStat('follower');

// 3. Synchronisation immédiate
await this.syncToServer();

// Résultat: 
// - syncQueue vidée
// - sessionStats.followers = 1 ✅
```

### Unfollower
```typescript
// 1. Ajout à la queue
await this.addToQueue({
  type: 'unfollower',
  username: 'jane_doe',
  timestamp: Date.now()
});

// 2. Incrémentation des stats
await this.incrementStat('unfollower');

// 3. Synchronisation immédiate
await this.syncToServer();

// Résultat:
// - syncQueue vidée
// - sessionStats.unfollowers = 1 ✅
```

## 🎨 Interface Utilisateur

### Affichage dans le Popup
```html
<div style="display: flex; justify-content: space-between;">
  <div>📊 Stats de session</div>
  <button id="reset-stats-btn">🔄 Réinitialiser</button>
</div>

<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-value">5</div>
    <div class="stat-label">Nouveaux followers</div>
  </div>
  <!-- ... -->
</div>
```

### Bouton de Réinitialisation
- Affiche une confirmation avant de réinitialiser
- Remet tous les compteurs à 0
- Rafraîchit l'affichage immédiatement

```typescript
resetStatsBtn.addEventListener('click', async () => {
  if (confirm('Voulez-vous vraiment réinitialiser les statistiques de session ?')) {
    await chrome.runtime.sendMessage({ type: 'RESET_STATS' });
    await loadStats();
  }
});
```

## 📈 Cas d'Usage

### Scénario 1: Session de Tracking
```
Début de journée
    ↓
3 nouveaux followers → Stats: 3 followers
    ↓
1 unfollower → Stats: 3 followers, 1 unfollower
    ↓
5 engagements → Stats: 3 followers, 1 unfollower, 5 engagements
    ↓
Fin de journée → Clic sur "Réinitialiser"
    ↓
Stats: 0, 0, 0
```

### Scénario 2: Synchronisation Continue
```
Nouveau follower détecté
    ↓
Stats: 1 follower
    ↓
Sync automatique (toutes les 5 min)
    ↓
Stats: toujours 1 follower ✅
    ↓
Autre follower détecté
    ↓
Stats: 2 followers ✅
```

## 🐛 Debugging

### Vérifier les Stats dans la Console
```javascript
// Dans le service worker
chrome.storage.local.get('sessionStats', (result) => {
  console.log('Session stats:', result.sessionStats);
});

// Résultat:
// {
//   followers: 3,
//   unfollowers: 1,
//   potentialBlockers: 0,
//   engagements: 5
// }
```

### Vérifier la Queue
```javascript
chrome.storage.local.get('syncQueue', (result) => {
  console.log('Sync queue:', result.syncQueue);
});

// Résultat:
// [] (vide après sync)
```

### Logs de Tracking
```javascript
console.log('🚀 New follower detected, syncing immediately...');
console.log('📊 Session stats incremented: followers = 3');
console.log('✅ Sync completed, queue cleared');
```

## ⚙️ Configuration

### Réinitialisation Automatique
Pour réinitialiser automatiquement les stats chaque jour :

```typescript
// Dans service-worker.ts
chrome.alarms.create('reset-daily-stats', {
  when: Date.now() + (24 * 60 * 60 * 1000), // Dans 24h
  periodInMinutes: 24 * 60 // Toutes les 24h
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'reset-daily-stats') {
    await syncManager.resetStats();
    console.log('🔄 Daily stats reset');
  }
});
```

### Sauvegarde des Stats
Pour sauvegarder les stats avant réinitialisation :

```typescript
async function saveStatsHistory() {
  const stats = await syncManager.getLocalStats();
  const stored = await chrome.storage.local.get('statsHistory');
  const history = stored.statsHistory || [];
  
  history.push({
    date: new Date().toISOString(),
    stats: stats
  });
  
  await chrome.storage.local.set({ statsHistory: history });
}
```

## 🔒 Persistance

### Données Persistantes
- ✅ `sessionStats` - Persiste jusqu'à réinitialisation manuelle
- ✅ `followerDatabase` - Persiste indéfiniment
- ❌ `syncQueue` - Vidée après chaque sync

### Données Temporaires
- `scanProgress` - Uniquement pendant un scan
- `unfollowerAnalysisProgress` - Uniquement pendant une analyse

## 📝 Notes Importantes

1. **Les stats de session ne sont PAS synchronisées avec le backend**
   - Elles sont locales à l'extension
   - Utilisées uniquement pour l'affichage dans le popup

2. **Les données réelles sont dans le backend**
   - Consultables via le dashboard Waler
   - Historique complet des followers/unfollowers

3. **Réinitialisation manuelle recommandée**
   - Après chaque session de tracking
   - Pour avoir des stats précises par période

4. **Les stats persistent même après fermeture du navigateur**
   - Stockées dans `chrome.storage.local`
   - Pas de limite de temps

## 🚀 Améliorations Futures

- [ ] Graphiques de tendances dans le popup
- [ ] Export des stats en CSV
- [ ] Comparaison avec les stats du backend
- [ ] Alertes quand seuils dépassés
- [ ] Historique des stats par jour/semaine/mois
