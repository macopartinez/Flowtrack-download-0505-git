# 🛠️ OpenCLI Development Guide

Guide d'utilisation d'OpenCLI pour le développement et le debug de l'extension Waler.

## 📋 Table des matières

- [Qu'est-ce qu'OpenCLI ?](#quest-ce-quopencli-)
- [Installation](#installation)
- [Cas d'usage pour Waler](#cas-dusage-pour-waler)
- [Commandes utiles](#commandes-utiles)
- [Exemples concrets](#exemples-concrets)
- [Limitations](#limitations)
- [Quand utiliser OpenCLI vs Code custom](#quand-utiliser-opencli-vs-code-custom)

---

## Qu'est-ce qu'OpenCLI ?

OpenCLI est un **hub CLI universel et runtime AI-natif** qui permet d'automatiser des actions sur des sites web via des commandes déclaratives. Il est conçu pour être utilisé par des agents IA (Claude Code, Cursor, Windsurf).

### Avantages pour Waler

✅ **Exploration rapide** : Tester des sélecteurs CSS sans écrire de code  
✅ **Debug interactif** : Comprendre la structure DOM d'Instagram  
✅ **Prototypage** : Valider une approche avant de coder  
✅ **Session réelle** : Utilise ta session Chrome déjà connectée  

### Limitations

❌ **Pas pour la production** : Pas de Worker Pool, pas de proxy  
❌ **Desktop uniquement** : Pas d'émulation mobile  
❌ **Pas de scroll infini** : Commandes ponctuelles uniquement  
❌ **Pas d'intégration extension** : Fonctionne en CLI externe  

---

## Installation

### Prérequis

- Node.js 18+
- Chrome installé
- Windsurf, Cursor ou Claude Code

### Installation dans Windsurf

```bash
# Ajouter les skills OpenCLI
npx skills add jackwener/opencli --skill opencli-browser
npx skills add jackwener/opencli --skill opencli-adapter-author
```

### Vérification

```bash
# Demander à Cascade (IA Windsurf)
"Utilise opencli browser pour ouvrir google.com"
```

---

## Cas d'usage pour Waler

### 1. Explorer la structure du modal followers

**Problème** : Tu ne sais pas quel sélecteur CSS utiliser pour le modal.

**Solution OpenCLI** :

```
Demande à Cascade :
"Utilise opencli browser pour ouvrir instagram.com/username/followers,
attendre 2 secondes, puis extraire la structure HTML du modal"
```

**Résultat** : Tu obtiens la structure DOM exacte et les sélecteurs CSS.

---

### 2. Tester le scroll du modal

**Problème** : Tu veux voir comment Instagram charge les nouveaux followers.

**Solution OpenCLI** :

```
Demande à Cascade :
"Utilise opencli browser pour :
1. Ouvrir instagram.com/pako_mrtz/followers
2. Attendre 3 secondes
3. Scroller 5 fois dans le modal
4. Extraire tous les usernames visibles"
```

**Résultat** : Tu vois combien de followers sont chargés après 5 scrolls.

---

### 3. Débugger un sélecteur CSS qui ne marche pas

**Problème** : Ton sélecteur `div._aano > div > div` ne trouve rien.

**Solution OpenCLI** :

```
Demande à Cascade :
"Utilise opencli browser pour ouvrir instagram.com/username/followers,
puis extraire tous les éléments qui matchent 'div._aano > div > div'"
```

**Résultat** : Tu vois si le sélecteur est correct ou s'il faut l'ajuster.

---

### 4. Comparer desktop vs mobile

**Problème** : Tu veux voir si la structure DOM change entre desktop et mobile.

**Solution OpenCLI** :

```bash
# Desktop
"Utilise opencli browser pour ouvrir instagram.com/username/followers
et extraire le HTML du premier follower"

# Mobile (limitation : OpenCLI est desktop-only)
# → Utiliser Chrome DevTools en mode mobile à la place
```

---

### 5. Générer un adaptateur YAML pour Instagram

**Problème** : Tu veux créer un adaptateur réutilisable pour Instagram.

**Solution OpenCLI** :

```
Demande à Cascade :
"Utilise opencli-adapter-author pour créer un adaptateur Instagram
qui extrait les followers depuis le modal"
```

**Résultat** : Un fichier YAML avec les sélecteurs et actions.

---

## Commandes utiles

### Commandes `browser`

```bash
# Ouvrir une page
opencli browser work open <url>

# Scroller
opencli browser work scroll --direction down --times 5
opencli browser work scroll --distance 500

# Extraire des données
opencli browser work extract <selector>

# Trouver des éléments
opencli browser work find <selector>

# Cliquer
opencli browser work click <selector>

# Screenshot
opencli browser work screenshot --path ./debug.png

# Réseau (voir les requêtes)
opencli browser work network --filter instagram
```

### Commandes combinées

```bash
# Ouvrir + Scroller + Extraire
opencli browser work \
  open instagram.com/username/followers \
  wait 2000 \
  scroll --times 10 \
  extract "div._aano > div > div a[href^='/']"
```

---

## Exemples concrets

### Exemple 1 : Compter les followers visibles

```
Demande à Cascade :
"Utilise opencli browser pour ouvrir instagram.com/pako_mrtz/followers,
attendre 3 secondes, puis compter combien de followers sont visibles
dans le modal"
```

**Résultat attendu** :
```
✅ 20 followers visibles initialement
```

---

### Exemple 2 : Tester le scroll infini

```
Demande à Cascade :
"Utilise opencli browser pour :
1. Ouvrir instagram.com/pako_mrtz/followers
2. Attendre 3 secondes
3. Scroller 20 fois avec pause de 500ms entre chaque
4. Compter les followers après chaque scroll
5. Me donner le nombre final"
```

**Résultat attendu** :
```
Scroll 1  : 20 followers
Scroll 5  : 50 followers
Scroll 10 : 100 followers
Scroll 20 : 200 followers
```

---

### Exemple 3 : Extraire les avatars

```
Demande à Cascade :
"Utilise opencli browser pour ouvrir instagram.com/username/followers,
puis extraire toutes les URLs d'avatar des followers visibles"
```

**Résultat attendu** :
```json
[
  "https://instagram.fcdg1-1.fna.fbcdn.net/v/t51...",
  "https://instagram.fcdg1-1.fna.fbcdn.net/v/t51...",
  ...
]
```

---

### Exemple 4 : Détecter les changements de structure

**Problème** : Instagram a changé sa structure DOM.

```
Demande à Cascade :
"Utilise opencli browser pour ouvrir instagram.com/username/followers,
puis extraire le HTML complet du premier élément follower"
```

**Résultat** : Tu vois la nouvelle structure et peux adapter tes sélecteurs.

---

### Exemple 5 : Tester l'API Instagram

```
Demande à Cascade :
"Utilise opencli browser pour ouvrir instagram.com/username/followers,
puis monitorer les requêtes réseau pendant 10 secondes de scroll"
```

**Résultat** : Tu vois les endpoints API qu'Instagram utilise.

---

## Limitations

### ❌ Ce qu'OpenCLI ne peut PAS faire

1. **Scroll infini automatique**
   - OpenCLI scroll un nombre fixe de fois
   - Pas de détection "fin de liste atteinte"

2. **Émulation mobile**
   - Desktop Chrome uniquement
   - Pas de fingerprint iPhone/Android

3. **Worker Pool parallèle**
   - Une seule instance à la fois
   - Pas de scraping multi-comptes

4. **Proxy résidentiel**
   - Utilise ta connexion directe
   - Pas de rotation d'IP

5. **Intégration extension Chrome**
   - CLI externe uniquement
   - Pas de code partagé avec l'extension

6. **Production 24/7**
   - Conçu pour le debug, pas la prod
   - Pas de retry logic robuste

---

## Quand utiliser OpenCLI vs Code custom

### ✅ Utilise OpenCLI pour :

| Cas d'usage | Pourquoi |
|-------------|----------|
| **Explorer** la structure DOM | Rapide, pas besoin de coder |
| **Tester** des sélecteurs CSS | Feedback immédiat |
| **Débugger** un problème | Voir ce qu'Instagram renvoie |
| **Prototyper** une nouvelle feature | Valider l'approche |
| **Comprendre** l'API Instagram | Monitorer les requêtes réseau |

### ✅ Utilise du code custom pour :

| Cas d'usage | Pourquoi |
|-------------|----------|
| **Production** dans l'extension | Performance + robustesse |
| **Scroll infini** intelligent | Détection fin de liste |
| **Comportement humain** | Variation naturelle |
| **Gestion d'erreurs** | Retry logic + fallbacks |
| **Émulation mobile** | Fingerprint iPhone/Android |

---

## Workflow recommandé

### Phase 1 : Exploration (OpenCLI)

```
1. Ouvrir Instagram avec OpenCLI
2. Explorer la structure DOM
3. Tester les sélecteurs CSS
4. Comprendre le comportement du scroll
5. Noter les patterns observés
```

### Phase 2 : Prototypage (OpenCLI)

```
1. Créer un adaptateur YAML
2. Tester l'extraction de données
3. Valider que ça marche
4. Documenter les sélecteurs
```

### Phase 3 : Implémentation (Code custom)

```
1. Créer instagram-modal-scroller.ts
2. Implémenter le scroll intelligent
3. Ajouter la gestion d'erreurs
4. Intégrer dans l'extension
```

### Phase 4 : Debug (OpenCLI)

```
1. Si un bug apparaît en prod
2. Reproduire avec OpenCLI
3. Identifier la cause
4. Fixer dans le code custom
```

---

## Exemples de prompts pour Cascade

### Debug d'un sélecteur

```
"Utilise opencli browser pour ouvrir instagram.com/pako_mrtz/followers,
puis teste si le sélecteur 'div._aano > div > div' trouve des éléments.
Si oui, montre-moi le HTML du premier élément."
```

### Comparer avant/après un changement Instagram

```
"Utilise opencli browser pour ouvrir instagram.com/username/followers,
puis extraire le HTML complet du modal. Compare avec la structure
documentée dans instagram-modal-scroller.ts"
```

### Tester une nouvelle feature

```
"Utilise opencli browser pour ouvrir instagram.com/username/followers,
puis tester si on peut détecter le badge 'Follows you' avec le sélecteur
'span:contains(\"Follows you\")'"
```

---

## Ressources

- **Documentation OpenCLI** : https://github.com/jackwener/opencli
- **Adaptateurs existants** : https://github.com/jackwener/opencli/tree/main/adapters
- **Skills Windsurf** : https://skills.codeium.com

---

## Conclusion

OpenCLI est un **outil de développement puissant** pour explorer et débugger Instagram, mais **pas une solution de production** pour Waler.

**Utilise-le pour** :
- ✅ Comprendre la structure d'Instagram
- ✅ Tester rapidement des idées
- ✅ Débugger des problèmes

**Mais implémente en production avec** :
- ✅ `instagram-modal-scroller.ts` (scroll intelligent)
- ✅ `follower-extractor.ts` (extraction de données)
- ✅ Code custom dans l'extension Waler

---

**Dernière mise à jour** : 25 mai 2026  
**Auteur** : Waler Team
