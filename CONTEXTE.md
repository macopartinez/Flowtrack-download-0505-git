# Contexte du Projet Waler (Waler)

## Dernière mise à jour : 5 Mai 2026

---

## 🎯 Modifications Récentes

### 1. Système de Vérification par Code (2FA)
**Date**: Mai 2026

#### Fonctionnalité
Vérification obligatoire de l'accès Instagram **AVANT** le paywall pour garantir que l'utilisateur peut utiliser le service.

#### Flux Complet (17 étapes)
```
1-10.  Questionnaire psychologique
11.    Username Instagram
12.    ✅ Vérification que le compte existe
13.    📱 Envoi code + Vérification code 6 chiffres
14.    💰 PAYWALL
15.    Email
16.    Password
17.    → Création compte + Activation agents
```

#### Implémentation Technique
- **Bot Waler** : Compte Instagram `@waler` qui envoie les codes
- **Table `verification_codes`** : Stocke les codes à 6 chiffres
- **Script `generate-6digit.ts`** : Génère les codes de vérification
- **Expiration** : 15 minutes
- **Tentatives** : Maximum 5 par utilisateur

#### Sécurité
- ✅ Code inclut le @username de l'utilisateur
- ✅ Vérification que l'expéditeur correspond au @username
- ✅ Protection contre l'usurpation d'identité
- ✅ Rate limiting sur les tentatives

#### Fichiers Concernés
- `server/verification-codes.ts` - Gestion des codes
- `server/waler-onboarding-bot.ts` - Bot d'envoi de codes
- `scripts/generate-6digit.ts` - Génération de codes
- `client/src/pages/OnboardingPage.tsx` - Interface de vérification
- `CODE_VERIFICATION_AVANT_PAYWALL.md` - Documentation complète

---

### 2. Système d'Authentification Sécurisé
**Date**: Mai 2026

#### Fonctionnalités de Sécurité
- **Hashage bcrypt** - Mots de passe hashés avec 12 rounds
- **Sessions sécurisées** - Cookies HttpOnly + Secure en production
- **Rate limiting** - 5 tentatives/minute sur routes auth
- **Protection CSRF** - Cookies SameSite=lax
- **Validation inputs** - Zod schemas côté client et serveur
- **Ownership checks** - Users ne peuvent accéder qu'à leurs données
- **Session regeneration** - Protection contre session fixation
- **Auto-logout** - Sessions expirent après 7 jours

#### Routes API
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Utilisateur courant
- `POST /api/auth/verification/generate` - Générer code de vérification
- `POST /api/auth/verification/verify` - Vérifier code
- `POST /api/auth/verification/resend` - Renvoyer code

#### Fichiers Concernés
- `server/auth.ts` - Logique d'authentification
- `server/middleware.ts` - Middlewares de sécurité
- `server/verification.ts` - Système de vérification
- `server/routes.ts` - Routes API
- `SECURITY_SETUP.md` - Guide de configuration

---

### 3. Fusion Prospects + Connections → People (Mode Pro)
**Date**: Avril 2026

#### Problème Initial
- Prospects et Connections étaient gérés séparément avec code dupliqué
- Problèmes de persistance des données dans localStorage
- UI incohérente entre les deux sections

#### Solution Implémentée
- **Création du modèle unifié `Person`** (`client/src/components/pro/types.ts`)
  - Type `PersonTag`: `'prospect' | 'vip' | 'keep' | 'watch' | 'client' | 'converted'`
  - Type `ProspectStatus`: `'cold' | 'warm' | 'hot' | 'converted'`
  - Type `Circle`: `'vip' | 'keep' | 'watch'`
  - Fonctions utilitaires: `hasTag()`, `isProspect()`, `isInCircle()`, `getDisplayBadges()`

- **Nouveaux composants créés**:
  - `PersonCard.tsx` - Carte unifiée pour afficher une personne
  - `AddPersonModal.tsx` - Modal unifié pour ajouter prospect/connexion avec texte d'aide
  - `PersonDetailView.tsx` - Vue détaillée avec scores, statuts, signaux et notes
  - `AddFollowerChoiceModal.tsx` - Modal pour choisir d'ajouter un follower comme Client ou People

- **Refactoring ProDashboard**:
  - Migration automatique des données `pro-prospects` et `pro-connections` vers `pro-people`
  - Filtrage par tags (`all`, `prospect`, `vip`, `keep`, `watch`, `client`, `converted`)
  - Suppression des anciens composants après migration

#### Fichiers Modifiés
- `client/src/components/pro/types.ts` (nouveau)
- `client/src/components/pro/PersonCard.tsx` (nouveau)
- `client/src/components/pro/AddPersonModal.tsx` (nouveau)
- `client/src/components/pro/PersonDetailView.tsx` (nouveau)
- `client/src/components/pro/AddFollowerChoiceModal.tsx` (nouveau)
- `client/src/components/pro/ProDashboard.tsx` (refactoré)

---

### 4. Améliorations UI/UX Mode Pro
**Date**: Avril-Mai 2026

#### Fond d'Animation dans les Cartes People
- Ajout de l'animation `blob` dans `tailwind.config.ts`
- Classes CSS `animation-delay-2000` et `animation-delay-4000` dans `index.css`
- Blobs animés colorés (vert, violet, bleu) avec effet `mix-blend-multiply`

#### Icônes Minimalistes
- Remplacement des émojis par des icônes Lucide
- Exemple: 📂 → `<Folder className="w-3 h-3" />`

#### Bouton Settings Flottant
- Bouton circulaire en bas à gauche (identique au mode Personnel)
- Gradient vert avec rotation de l'icône au hover
- Position: `fixed bottom-6 left-6 z-50`

#### ProSettingsModal Complet
- **Tab Account**: Information du compte et Logout
- **Tab Notifications**: 4 options (New unfollowers, New blockers, Weekly summary, Product updates)
- **Tab Privacy**: 3 options (Make profile private, Hide online status, Data collection)
- **Tab Display**: Désactiver l'animation de fond
- **Tab Data**: Effacer toutes les données locales

#### Fichiers Modifiés
- `tailwind.config.ts` (animation blob)
- `client/src/index.css` (delays animation)
- `client/src/components/pro/PersonCard.tsx` (fond animé + icônes)
- `client/src/components/pro/ProDashboard.tsx` (bouton settings)
- `client/src/components/pro/ProSettingsModal.tsx` (nouveau)

---

### 5. Système de Goals dans les Milestones
**Date**: Mai 2026

#### Fonctionnalité
Ajout d'objectifs automatiques dans les milestones clients que les agents Pro peuvent cocher automatiquement.

#### Types de Goals Disponibles
1. **Followers** - Nombre de followers cible
2. **Views** - Nombre de vues cible
3. **Posts Daily** - Publications quotidiennes (récurrent)
4. **Posts Weekly** - Publications hebdomadaires (récurrent)
5. **Posts Monthly** - Publications mensuelles (récurrent)
6. **Custom** - Objectif personnalisé

#### Milestones Récurrents
Les milestones avec goals quotidiens, hebdomadaires ou mensuels se dupliquent automatiquement :

**Fonctionnement** :
- Le milestone original devient un "template" (modèle)
- À minuit (timezone du client), de nouvelles instances sont créées automatiquement
- Les instances sont regroupées par `recurringGroupId`
- Chaque instance a une `instanceDate` spécifique

**Timezone Client** :
- Propriété `timezone` ajoutée dans `Client` (ex: "Europe/Paris")
- Les milestones se créent à minuit du fuseau horaire du client
- Vérification toutes les heures pour créer les instances manquantes

**Groupement** :
- Les instances récurrentes sont regroupées visuellement
- Tri par date (plus récent en premier)
- Affichage condensé avec expansion possible

#### Implémentation Technique
```typescript
type GoalType = 'followers' | 'views' | 'posts_daily' | 'posts_weekly' | 'posts_monthly' | 'custom';

type Milestone = {
  id: string;
  title: string;
  completed: boolean;
  status: 'success' | 'failed' | null;
  date: Date | null;
  deadline: Date | null;
  deadlineSetAt: Date | null;
  createdAt: Date;
  goalType?: GoalType;
  goalTarget?: number;
  goalCurrent?: number; // Auto-updated by agents
  isRecurring?: boolean; // True if auto-duplicates
  recurringGroupId?: string; // Groups instances together
  recurringPeriod?: 'daily' | 'weekly' | 'monthly';
  instanceDate?: Date; // Specific date for this instance
};

interface Client {
  // ... existing fields
  timezone?: string; // e.g., "Europe/Paris", "America/New_York"
}
```

#### Logique de Création Automatique
1. **Daily** : Crée une instance pour chaque jour à minuit
2. **Weekly** : Crée une instance au début de chaque semaine (dimanche)
3. **Monthly** : Crée une instance au début de chaque mois (1er jour)

#### Modal "Ajouter un Milestone"
- Champ titre (obligatoire)
- Sélecteur de type d'objectif (optionnel)
- Champ valeur cible (conditionnel)
- Message: "Les agents Pro cocheront automatiquement ce milestone quand l'objectif sera atteint"
- Style sombre pour le sélecteur (`colorScheme: 'dark'`)
- Détection automatique si le goal est récurrent (posts_daily/weekly/monthly)

#### Fichiers Modifiés
- `client/src/components/pro/ClientDetailView.tsx`
- `client/src/components/pro/ClientCard.tsx` (ajout timezone)

---

## 🏗️ Architecture Actuelle

### Mode Personnel
- Dashboard avec sphère interactive
- Sections: Followers, Unfollowers, Blockers
- Graphiques et statistiques Instagram
- SettingsModal avec 4 tabs

### Mode Pro
- **Clients**: Gestion des clients payants avec milestones et goals
- **People**: Gestion unifiée des prospects et connexions
  - Filtres: All, Prospect, VIP, Keep, Watch, Client, Converted
  - Cartes avec fond animé
  - Vue détaillée avec scores et signaux
- **Settings**: Modal complet avec 5 tabs

---

## 📦 Agents

### Agent A (Unfollowers)
- Détection des unfollows via snapshots Instagram
- Base de données PostgreSQL
- Planification cron
- Stockage dans table `unfollowers`

### Agent B (Follow Automatique)
- Follow automatique avec Playwright
- Gestion des cookies et sessions
- Follow des nouveaux clients après paiement
- Système de retry et gestion d'erreurs

### Agent C (Tracking Clients Pro)
- Métriques et milestones
- Comportement humain
- Intégration dashboard
- Auto-complétion des goals
- Tracking des posts quotidiens/hebdomadaires/mensuels

### Agent Connections (Pro)
- Analyse qualité relationnelle
- Scraping avec Playwright
- Calcul des scores de santé (0-100)
- Génération du contexte relationnel
- **Connexions mutuelles** : Détecte les followers en commun
- **Corrélation Follow/Unfollow** : Analyse les patterns de likes
- Table `mutual_connections` pour stocker les connexions

### Agent Prospects (Pro)
- Détection nouveaux followers
- Scoring automatique basé sur engagement
- Intégration avec People
- Signaux d'opportunité (nouveau follower, engagement élevé, etc.)

### Agent Waler (Onboarding)
- Bot Instagram `@waler` pour envoi de codes de vérification
- Écoute des messages entrants
- Génération et envoi de codes à 6 chiffres
- Vérification de l'identité de l'expéditeur
- Gestion des sessions Playwright

---

## 🗄️ Stockage des Données

### Base de Données PostgreSQL

#### Tables Principales
- `users` - Utilisateurs avec authentification sécurisée
- `unfollowers` - Historique des unfollows
- `blockers` - Comptes bloquants détectés
- `followers` - Nouveaux followers
- `verification_codes` - Codes de vérification 2FA
- `subscriptions` - Abonnements Stripe
- `plans` - Plans tarifaires (Free, Premium, Pro)
- `plan_change_history` - Historique des changements de plan

#### Tables Pro (Mode Pro)
- `pro_clients` - Clients payants
- `pro_people` - Personnes (prospects + connexions)
- `pro_milestones` - Objectifs clients
- `pro_notes` - Notes sur clients/personnes
- `circle_members` - Membres du cercle (VIP/Keep/Watch)
- `mutual_connections` - Connexions mutuelles détectées
- `follow_like_correlations` - Corrélations follow/like

### localStorage Keys (Cache Frontend)
- `pro-clients` - Cache clients payants
- `pro-people` - Cache personnes
- `client-{id}-milestones` - Cache milestones
- `client-{id}-notes` - Cache notes
- `disableBackgroundAnimation` - Préférence d'animation

### Migration
- Anciennes clés `pro-prospects` et `pro-connections` migrées vers `pro-people`
- Système de migration automatique au démarrage
- Préservation des données lors des changements de plan

---

## 🎨 Design System

### Couleurs
- Primary: `#02c950` (vert Waler)
- Gradients: `from-green-500 to-emerald-500`
- Backgrounds: `bg-black/80`, `bg-white/5`
- Borders: `border-white/10`, `border-white/20`

### Animations
- `animate-blob` - Blobs de fond (7s infinite)
- `animation-delay-2000` - Delay 2s
- `animation-delay-4000` - Delay 4s
- Hover effects: `hover:y-4`, `hover:scale-105`

### Typographie
- Display: Outfit
- Body: Plus Jakarta Sans
- Doppio: Doppio One

---

## 🔧 Stack Technique

### Frontend
- React + TypeScript
- Vite
- TailwindCSS
- Framer Motion
- Lucide Icons
- Recharts

### Backend
- Node.js + Express
- PostgreSQL
- Playwright (scraping)

---

## 📝 Prochaines Étapes

1. **Amélioration Agent Waler**
   - Gestion automatique des codes expirés
   - Notifications push pour nouveaux codes
   - Interface admin pour monitoring

2. **Tableau de Bord Agents**
   - Vue d'ensemble de tous les agents actifs
   - Logs en temps réel
   - Statistiques de performance
   - Contrôles start/stop/restart

3. **Notifications Push**
   - Implémenter les préférences de notifications
   - Webhooks pour événements importants
   - Alertes pour milestones atteints

4. **Analytics Avancés**
   - Graphiques de croissance détaillés
   - Prédictions basées sur l'historique
   - Rapports hebdomadaires automatiques

5. **Mode Pro - Fonctionnalités Avancées**
   - Export des données en CSV/PDF
   - Intégration calendrier pour milestones
   - Templates de notes prédéfinis

---

## 🐛 Bugs Connus

### Aucun bug critique connu

✅ Tous les systèmes principaux sont fonctionnels :
- Authentification et sécurité
- Vérification 2FA par code
- Agents A, B, C
- Mode Pro complet
- Système de paiement Stripe
- Milestones et goals

### Améliorations Futures
- Optimisation des performances de scraping
- Réduction de la consommation mémoire des agents
- Amélioration de la gestion des erreurs réseau

---

## 📚 Documentation Associée

### Guides Principaux
- `README.md` - Vue d'ensemble du projet
- `QUICKSTART.md` - Démarrage rapide
- `DEMARRAGE_RAPIDE.md` - Guide de démarrage en français

### Sécurité & Authentification
- `SECURITY_SETUP.md` - Configuration sécurité complète
- `2FA_SETUP.md` - Configuration 2FA
- `CODE_VERIFICATION_AVANT_PAYWALL.md` - Système de vérification par code
- `IMPLEMENTATION_SUPABASE_VERIFICATION.md` - Implémentation Supabase

### Agents
- `AGENT_CONNECTIONS_GUIDE.md` - Guide Agent Connections
- `AGENT_C_GUIDE.md` - Guide Agent C
- `AGENT_PROSPECTS_GUIDE.md` - Guide Agent Prospects
- `AGENT_PRO_GUIDE.md` - Guide complet Mode Pro
- `AGENT_FOLLOW_SYSTEM.md` - Système de follow automatique
- `AGENT_WALER_README.md` - Bot Waler pour onboarding
- `AGENTS_PRO_COMPLETE.md` - Fonctionnalités complètes agents Pro
- `AUTO_TRIGGER_AGENTS_README.md` - Déclenchement automatique

### Monétisation
- `STRIPE_SETUP.md` - Configuration Stripe
- `PREMIUM_SETUP.md` - Configuration Premium
- `GUIDE_CHANGEMENT_PLAN.md` - Changement de plan
- `PLAN_CHANGE_DATA_PRESERVATION.md` - Préservation des données
- `TUNNEL_DE_VENTE.md` - Tunnel de conversion

### Flux & UX
- `NOUVEAU_FLUX_ONBOARDING.md` - Nouveau flux d'onboarding
- `FLUX_FINAL_COMPLET.md` - Flux complet de l'application
- `AMELIORATIONS_UX.md` - Améliorations UX
- `VERIFICATION_AVANT_PAYWALL.md` - Vérification avant paiement

### Historique & Fixes
- `CHANGELOG.md` - Historique des modifications
- `FIX_SAUVEGARDE_PROSPECTS_CONNECTIONS.md` - Historique des fixes
- `IMPLEMENTATION_COMPLETE.md` - Résumé implémentation
- `INTEGRATION_COMPLETE.md` - Intégration complète

---

## 👥 Contributeurs

- Développement principal: Cascade AI + User
- Design: Basé sur Figma mockups
- Architecture: Évolution itérative basée sur feedback utilisateur
