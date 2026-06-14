# Guide de Debug Rapide - Détection des Followers

## 🚀 Utilisation Rapide

### 1. Rebuilder l'extension
```powershell
cd waler-extension
.\BUILD.bat
```

### 2. Recharger l'extension
- Aller sur `chrome://extensions/`
- Cliquer sur le bouton **Recharger** de FlowTrack

### 3. Ouvrir Instagram
- Aller sur votre profil : `https://www.instagram.com/VOTRE_USERNAME`
- Ouvrir la console (F12)

### 4. Exécuter le debug
Dans la console, tapez :
```javascript
debugFollowerDetection()
```

## 📊 Interprétation des Résultats

### ✅ Tout va bien
```
📊 [1/4] DOM...
   ✅ Followers (DOM): 214
📦 [2/4] Storage...
   lastFollowerCount: 214
   Database count: 214
   Database.totalCount: 214
🔌 [3/4] API Interceptor...
   ✅ ACTIF
🔍 [4/4] Synchronisation...
   ✅ Tout est synchronisé!
```

### ⚠️ Problème de synchronisation
```
📊 [1/4] DOM...
   ✅ Followers (DOM): 214
📦 [2/4] Storage...
   lastFollowerCount: 213
   Database count: 213
🔍 [4/4] Synchronisation...
   ⚠️ DÉSYNCHRONISATION:
      DOM: 214
      lastFollowerCount: 213
      Database: 213
```

**Solution** : Un nouveau follower n'a pas été détecté. Vérifiez les logs pour voir si l'API interceptor fonctionne.

### ❌ API Interceptor non actif
```
🔌 [3/4] API Interceptor...
   ⚠️ NON ACTIF
```

**Solution** : L'extension ne s'est pas initialisée correctement. Rechargez la page Instagram.

## 🔧 Commandes Utiles

### Vérifier l'état
```javascript
debugFollowerDetection()
```

### Corriger manuellement le compteur
```javascript
// Synchroniser avec le nombre actuel dans le DOM
fixFollowerCount()

// Ou forcer un nombre spécifique
fixFollowerCount(214)
```

### Vérifier les logs en temps réel
Surveillez la console pour voir :
```
🔍 [DOM] Checking: current=214, last=214, diff=0
🔔 [API] Follower count changed: 213 → 214 (+1)
```

## 🧪 Tester la Détection

### Test 1 : Nouveau Follower
1. Demandez à quelqu'un de vous follow
2. Observez les logs dans la console
3. Vous devriez voir :
   ```
   🔔 [API] Follower count changed: 213 → 214 (+1)
   💾 Updated lastFollowerCount to 214
   📨 Received FOLLOWER_COUNT_CHANGED
   🔄 Synchronized lastFollowerCount to 214 (+1)
   ```

### Test 2 : Vérification après 30 secondes
1. Attendez 30 secondes
2. Le système DOM devrait vérifier :
   ```
   🔍 [DOM] Checking: current=214, last=214, diff=0
   ```
3. Pas de double détection = ✅ Succès !

## 📝 Logs à Surveiller

### Logs Normaux (Bon Fonctionnement)
- `[API] Follower count changed` → Détection via l'API ✅
- `Updated lastFollowerCount` → Synchronisation ✅
- `Received FOLLOWER_COUNT_CHANGED` → Message reçu ✅
- `Synchronized lastFollowerCount` → État local mis à jour ✅
- `[DOM] Checking: diff=0` → Pas de double détection ✅

### Logs Problématiques
- `[DOM] Checking: diff=1` → L'API n'a pas détecté le changement ❌
- `⚠️ [DOM] Follower count element not found` → Problème de sélecteur DOM ❌
- `⚠️ NON ACTIF` → API Interceptor non démarré ❌

## 🔍 Diagnostic Avancé

### Vérifier le Storage Chrome
```javascript
chrome.storage.local.get(['lastFollowerCount', 'followerDatabase'], (result) => {
  console.log('lastFollowerCount:', result.lastFollowerCount);
  console.log('Database count:', Object.keys(result.followerDatabase?.followers || {}).length);
});
```

### Forcer une synchronisation
```javascript
// Récupérer le nombre du DOM
const element = document.querySelector('a[href*="/followers/"] span');
const count = parseInt(element.textContent.replace(/[^0-9]/g, ''));

// Mettre à jour le storage
chrome.storage.local.set({ lastFollowerCount: count }, () => {
  console.log('✅ lastFollowerCount mis à jour:', count);
});
```

### Vérifier l'API Interceptor
```javascript
console.log('Fetch intercepté:', !window.fetch.toString().includes('native code'));
```

## 💡 Conseils

1. **Toujours rebuilder après modification du code**
   ```powershell
   .\BUILD.bat
   ```

2. **Recharger l'extension ET la page Instagram**
   - Extension : `chrome://extensions/` > Recharger
   - Page : F5 ou Ctrl+R

3. **Vérifier les deux consoles**
   - Console de la page Instagram (F12)
   - Console du Service Worker (chrome://extensions/ > Détails > Service Worker)

4. **Attendre quelques secondes**
   - L'API peut mettre 2-3 secondes à se mettre à jour
   - Le DOM se vérifie toutes les 30 secondes

## 🆘 En Cas de Problème

Si `debugFollowerDetection()` retourne `undefined` :
1. Vérifiez que l'extension est bien chargée
2. Rechargez la page Instagram
3. Attendez 2-3 secondes que le content script s'initialise
4. Réessayez

Si la fonction n'existe pas :
```
Uncaught ReferenceError: debugFollowerDetection is not defined
```
→ L'extension ne s'est pas initialisée. Rechargez la page.
