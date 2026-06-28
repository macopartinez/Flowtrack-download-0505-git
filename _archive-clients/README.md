# Archive — Fonctionnalité « Clients » (coaching)

Ce dossier regroupe **tout le code de la fonctionnalité « Clients »** (gestion de
clients de coaching avec suivi de croissance, métriques, milestones et agent de
collecte), extrait de Waler pour être **réutilisé dans un autre projet**.

Le Mode Pro de Waler ne gère désormais plus que les **People** (prospects /
connexions). Aucun code « Clients » ne subsiste dans le projet actif.

## Contenu

```
_archive-clients/
├── frontend/
│   ├── ClientCard.tsx              Carte client (liste)
│   ├── ClientDetailView.tsx        Fiche client détaillée (graphiques, milestones, notes)
│   ├── AddClientModal.tsx          Modale d'ajout de client
│   └── AddFollowerChoiceModal.tsx  Choix Client vs People à l'ajout d'un follower
├── server/
│   ├── client-routes.ts            Routes Express extraites de server/routes.ts
│   ├── agent-trigger.ts            Déclenchement du process Python agent_pro_clients.py
│   └── clients-schema.sql          Tables SQLite (clients, client_metrics, milestones,
│                                   client_advanced_metrics, client_posts)
└── python/
    └── agent_pro_clients.py        Agent de collecte des métriques clients
```

## Réintégration dans un autre projet

### Frontend (React + TypeScript + Tailwind + framer-motion + lucide-react)
1. Copier les fichiers de `frontend/` dans le dossier de composants cible.
2. Le type `Client` / `NewClientData` est défini dans `ClientCard.tsx` /
   `AddClientModal.tsx` (pas dans un `types.ts` partagé).
3. Câbler l'état et les handlers (voir l'historique git de `ProDashboard.tsx`
   pour l'exemple d'origine : `clients` state, `handleAddClient`,
   `handleUpdateClient`, `handleDeleteClient`, vue `viewMode`).
4. Persistance locale d'origine : `localStorage` clé `pro-clients`.

### Backend (Express + better-sqlite3)
1. Exécuter `clients-schema.sql` sur la base (dépend d'une table `users`).
2. Brancher `registerClientRoutes(app, requireAuth, getDb)` depuis
   `client-routes.ts` dans le `registerRoutes()` cible.
3. `agent-trigger.ts` lance `python agent_pro_clients.py` avec
   `RUN_ON_START=true` et `TARGET_CLIENT_ID=<id>`.

### Routes exposées
- `POST /api/pro/clients` — créer un client
- `POST /api/pro/trigger-agent-client/:clientId` — lancer l'agent de collecte
- `GET  /api/pro/clients/:clientId/metrics?period=30` — historique followers/following
- `GET  /api/pro/agents-status` — statut de l'agent

### Agent Python
`agent_pro_clients.py` collecte les métriques (followers, following, posts…) et
écrit dans `client_metrics` / `client_advanced_metrics` / `client_posts`.

## Tables SQLite
`clients`, `client_metrics`, `milestones`, `client_advanced_metrics`,
`client_posts`. Toutes en `FOREIGN KEY … REFERENCES clients(id) ON DELETE CASCADE`
(sauf `clients` qui référence `users(id)`).
