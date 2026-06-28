# Waler Extension - Instagram Analytics

Extension Chrome/Safari pour tracker automatiquement vos statistiques Instagram en temps réel.

## 🚀 Fonctionnalités

- **Tracking automatique** des followers/unfollowers
- **Détection des blockers** en temps réel
- **Analytics d'engagement** (likes, comments, shares, saves)
- **Synchronisation automatique** avec le backend Waler
- **Interface popup** avec statistiques en direct
- **Mode offline** avec queue de synchronisation

## 📦 Installation

### Développement

```bash
cd waler-extension
npm install
npm run dev
```

### Build pour production

```bash
npm run build
```

### Charger l'extension dans Chrome

1. Ouvrir Chrome et aller à `chrome://extensions/`
2. Activer le "Mode développeur"
3. Cliquer sur "Charger l'extension non empaquetée"
4. Sélectionner le dossier `dist/`

## 🏗️ Architecture

```
waler-extension/
├── manifest.json              # Configuration de l'extension
├── src/
│   ├── background/
│   │   ├── service-worker.ts  # Service worker principal
│   │   └── sync-manager.ts    # Gestion de la synchronisation
│   ├── content/
│   │   ├── instagram-tracker.ts  # Tracker principal Instagram
│   │   ├── dom-observer.ts       # Observation du DOM
│   │   └── data-collector.ts     # Collecte de données
│   └── popup/
│       ├── index.html         # Interface popup
│       └── popup.ts           # Logique popup
└── icons/                     # Icônes de l'extension
```

## 🔧 Configuration

L'extension se connecte automatiquement à l'API Waler sur `http://localhost:5000`.

Pour changer l'URL de l'API, modifier `API_URL` dans `src/background/sync-manager.ts`.

## 📊 Données collectées

- **Followers** : Nouveaux followers détectés
- **Unfollowers** : Personnes qui vous ont unfollowed
- **Blockers** : Comptes qui vous ont bloqué
- **Engagements** : Likes, comments, shares, saves
- **Visites de profil** : Profils visités
- **Temps passé** : Durée de navigation

## 🔐 Sécurité

- Toutes les données sont chiffrées avant synchronisation
- Authentification via token JWT
- Pas de stockage de mots de passe
- Respect de la vie privée (données stockées localement)

## 🌐 Compatibilité

- Chrome 88+
- Edge 88+
- Safari 14+ (avec adaptations)

## 📝 TODO

- [ ] Ajouter session replay (comme Microsoft Clarity)
- [ ] Heatmaps des interactions
- [ ] Export des données en CSV/JSON
- [ ] Notifications push pour événements importants
- [ ] Support multi-comptes
- [ ] Dark mode

## 🤝 Contribution

Cette extension fait partie du projet Waler. Pour contribuer, voir le README principal.

## 📄 Licence

MIT
