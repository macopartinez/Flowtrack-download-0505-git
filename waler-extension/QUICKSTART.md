# 🚀 Waler Extension - Guide de démarrage rapide

## Installation en 5 minutes

### 1. Installation des dépendances

```bash
cd waler-extension
npm install
```

### 2. Build de l'extension

```bash
npm run build
```

### 3. Charger dans Chrome

1. Ouvrir Chrome et aller à `chrome://extensions/`
2. Activer le **Mode développeur** (en haut à droite)
3. Cliquer sur **Charger l'extension non empaquetée**
4. Sélectionner le dossier `waler-extension/dist/`

### 4. Configuration

L'extension se connecte automatiquement à `http://localhost:5000`.

Si votre serveur Waler tourne sur un autre port, modifiez `API_URL` dans :
- `src/background/sync-manager.ts`

### 5. Authentification

1. Connectez-vous à Waler (`http://localhost:5000`)
2. Cliquez sur l'icône Waler dans Chrome
3. Cliquez sur "Se connecter"
4. Vous serez redirigé vers la page de login

Une fois connecté, l'extension commencera automatiquement à tracker vos données Instagram.

## 📱 Utilisation

### Sur Instagram

1. Allez sur `instagram.com`
2. L'extension détecte automatiquement votre compte
3. Naviguez normalement sur Instagram
4. Les données sont collectées en arrière-plan

### Données trackées

- ✅ **Nouveaux followers** détectés en temps réel
- ❌ **Unfollowers** quand quelqu'un vous unfollow
- 🚫 **Blockers** quand quelqu'un vous bloque
- 💫 **Engagements** (likes, comments, shares, saves)
- 👤 **Profils visités**
- ⏱️ **Temps passé** sur Instagram

### Synchronisation

- **Automatique** : Toutes les 5 minutes
- **Manuelle** : Cliquez sur "Synchroniser maintenant" dans le popup
- **Offline** : Les données sont stockées localement et synchronisées quand vous êtes en ligne

## 🔧 Développement

### Mode watch

Pour développer avec rechargement automatique :

```bash
npm run dev
```

Puis rechargez l'extension dans Chrome après chaque modification.

### Structure du code

```
src/
├── background/          # Service worker
│   ├── service-worker.ts   # Point d'entrée
│   └── sync-manager.ts     # Gestion sync
├── content/            # Scripts injectés
│   ├── instagram-tracker.ts  # Tracker principal
│   ├── dom-observer.ts       # Observer DOM
│   └── data-collector.ts     # Collecte données
└── popup/              # Interface utilisateur
    ├── index.html
    └── popup.ts
```

## 🐛 Debugging

### Console de l'extension

1. Aller à `chrome://extensions/`
2. Trouver "Waler - Instagram Analytics"
3. Cliquer sur "Inspecter les vues : service worker"

### Console du content script

1. Aller sur `instagram.com`
2. Ouvrir DevTools (F12)
3. Aller dans l'onglet Console
4. Chercher les logs préfixés par `📱`, `🔍`, `➕`, `➖`

### Vérifier la synchronisation

```javascript
// Dans la console de l'extension
chrome.storage.local.get(['syncQueue', 'followersCache'], console.log)
```

## 🔐 Sécurité

- Les données sont stockées localement dans Chrome
- Synchronisation chiffrée avec le backend
- Pas de stockage de mots de passe
- Token d'authentification sécurisé

## 📊 API Backend

L'extension communique avec ces endpoints :

- `POST /api/extension/sync` - Synchroniser les données
- `POST /api/extension/auth` - Obtenir un token
- `POST /api/extension/update-user-info` - Mettre à jour les infos utilisateur

## 🚨 Troubleshooting

### L'extension ne détecte pas mon compte

- Vérifiez que vous êtes connecté à Instagram
- Rechargez la page Instagram
- Vérifiez la console pour les erreurs

### La synchronisation échoue

- Vérifiez que le serveur Waler tourne (`http://localhost:5000`)
- Vérifiez que vous êtes authentifié
- Regardez les logs dans la console de l'extension

### Les données ne s'affichent pas

- Attendez quelques minutes pour la première synchronisation
- Cliquez sur "Synchroniser maintenant"
- Vérifiez le dashboard Waler

## 📝 Notes importantes

- L'extension ne fonctionne que sur `instagram.com`
- Nécessite Chrome 88+ ou Edge 88+
- Fonctionne en arrière-plan, pas besoin de garder le popup ouvert
- Les données sont synchronisées même si vous fermez Chrome

## 🎯 Prochaines étapes

1. Tester l'extension sur Instagram
2. Vérifier que les données apparaissent dans le dashboard
3. Configurer les notifications (optionnel)
4. Personnaliser les paramètres de synchronisation

## 💡 Astuces

- Gardez l'extension activée en permanence pour un tracking optimal
- Synchronisez manuellement avant de fermer Chrome
- Consultez régulièrement le dashboard pour voir vos stats
- Utilisez les filtres pour analyser vos données

## 🆘 Support

En cas de problème :
1. Vérifiez les logs dans la console
2. Consultez la documentation complète dans `README.md`
3. Ouvrez une issue sur GitHub
