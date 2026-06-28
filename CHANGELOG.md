# Changelog Waler

## 2026-04-14 - Migration Supabase & Système d'Agents

### ✅ Changements Majeurs

#### 1. Migration SQLite → PostgreSQL (Supabase)
- ✅ Changement de `better-sqlite3` vers `postgres` driver
- ✅ Mise à jour du schéma de `sqliteTable` vers `pgTable`
- ✅ Table renommée de `users` vers `app_users` (éviter conflit Supabase Auth)
- ✅ Connexion à Supabase configurée avec SSL
- ✅ Script d'initialisation `reset-account.js` créé

#### 2. Système de Plans & Subscriptions
- ✅ Nouvelle table `plans` avec features JSON
- ✅ Nouvelle table `subscriptions` avec Stripe integration
- ✅ Routes API complètes :
  - `GET /api/plans` - Liste des plans
  - `GET /api/subscription/current` - Plan actuel de l'utilisateur
  - `POST /api/checkout` - Créer session Stripe
  - `POST /api/portal` - Portail client Stripe
  - `POST /api/webhooks/stripe` - Webhooks Stripe

#### 3. Système de Follow Automatique des Agents
- ✅ Fichier `server/instagram-follow.ts` créé
  - Fonction `followNewClient(userId)` - Follow auto par agents A & B
  - Fonction `checkAgentApproval(userId)` - Vérification approval
  - Détection automatique de compte privé
- ✅ Routes API :
  - `POST /api/agents/follow` - Déclencher follow manuellement
  - `POST /api/check-agent-approval` - Vérifier approval
- ✅ Intégration dans webhook Stripe (auto-follow après paiement)

#### 4. Onboarding & Tutoriel
- ✅ Composant `client/src/components/Onboarding.tsx`
  - 4 étapes interactives avec Framer Motion
  - Instructions détaillées pour compte privé
  - Bouton "Vérifier" avec appel API
  - Progress bar et animations
- ✅ Page `client/src/pages/HowItWorks.tsx`
  - Explication complète du concept
  - Détail des agents A et B
  - Processus en 5 étapes
  - Section sécurité & confidentialité

#### 5. Focus Instagram Uniquement
- ✅ Suppression de toutes les références à Facebook
- ✅ `platform` toujours défini à `"instagram"` par défaut
- ✅ Schéma de validation mis à jour (plus de choix Facebook)
- ✅ Fonction `createUser()` simplifiée (plus de paramètre `platform`)
- ✅ Documentation mise à jour

### 📁 Nouveaux Fichiers

```
server/
  ├── instagram-follow.ts          # Système de follow automatique
  └── plans.ts                      # Gestion des plans (existant)

client/src/
  ├── components/
  │   └── Onboarding.tsx           # Tutoriel interactif
  └── pages/
      └── HowItWorks.tsx           # Page explicative

root/
  ├── AGENT_FOLLOW_SYSTEM.md       # Documentation technique agents
  ├── CHANGELOG.md                 # Ce fichier
  ├── reset-account.js             # Script reset compte Supabase
  ├── init-supabase.js             # Script init Supabase
  └── check-schema.js              # Script vérification schéma
```

### 🔧 Fichiers Modifiés

```
shared/schema.ts                   # Migration PostgreSQL, ajout plans/subscriptions
server/db.ts                       # Switch SQLite → PostgreSQL
server/auth.ts                     # Suppression paramètre platform
server/routes.ts                   # Ajout routes plans, agents, webhooks
.env                               # URL Supabase configurée
.env.example                       # Mise à jour variables Instagram
context.md                         # Documentation complète mise à jour
```

### 🗑️ Suppressions

- ❌ Toutes références à Facebook
- ❌ Support multi-plateforme (Instagram/Facebook)
- ❌ SQLite (remplacé par PostgreSQL)
- ❌ Table `users` Supabase Auth (utilise `app_users`)

### 🔐 Variables d'Environnement Requises

```env
# Obligatoires
DATABASE_URL=postgresql://...
AGENT_A_INSTAGRAM_USER=...
AGENT_A_INSTAGRAM_PASS=...
AGENT_B_INSTAGRAM_USER=...
AGENT_B_INSTAGRAM_PASS=...
SESSION_SECRET=...

# Optionnelles (Pro plan)
AGENT_C_INSTAGRAM_USER=...
AGENT_C_INSTAGRAM_PASS=...

# Stripe (à configurer)
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

### 📊 Base de Données

**Tables créées** :
- `app_users` - Utilisateurs (migration de `users`)
- `plans` - Plans d'abonnement
- `subscriptions` - Abonnements Stripe
- `unfollowers` - Historique unfollows
- `followers` - Historique followers
- `blockers` - Historique blocages

### 🚀 Déploiement

**Checklist** :
1. ✅ Créer projet Supabase
2. ✅ Configurer DATABASE_URL
3. ✅ Exécuter `node reset-account.js`
4. ⏳ Créer 2 comptes Instagram agents
5. ⏳ Configurer variables AGENT_A et AGENT_B
6. ⏳ Configurer Stripe (clés + webhooks)
7. ⏳ Tester le flow complet

### 🐛 Bugs Connus

- Aucun pour le moment

### 📝 TODO

- [ ] Intégrer composant `<Onboarding />` dans Dashboard
- [ ] Ajouter route `/how-it-works` dans le router
- [ ] Tester follow automatique avec vrais comptes Instagram
- [ ] Configurer Stripe en production
- [ ] Ajouter banner persistant si agents non approuvés
- [ ] Implémenter retry logic pour follow (rate limits)
- [ ] Ajouter monitoring et alertes

---

**Contributeurs** : Cascade AI
**Date** : 14 avril 2026
