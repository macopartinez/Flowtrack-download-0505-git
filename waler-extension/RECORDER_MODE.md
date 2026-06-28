# 🎬 Waler Recorder Mode - Guide d'utilisation

## Concept

Le **Recorder Mode** te permet d'enregistrer tes actions réelles sur Instagram et de générer automatiquement le code de scan optimal basé sur tes gestes naturels.

## Comment ça marche ?

### 1. Activer le Recorder

Sur Instagram, appuie sur **`Ctrl + Alt + R`**

Un panneau violet apparaît en haut à droite :

```
🎬 WALER RECORDER
⏸️ En attente...
📊 0 events  📍 0 checkpoints
👥 0 followers  ⏱️ 0s
[⏺ Démarrer l'enregistrement]
```

### 2. Démarrer l'enregistrement

1. Clique sur **"⏺ Démarrer l'enregistrement"**
2. Le statut passe à **"🔴 ENREGISTREMENT EN COURS"**
3. Deux nouveaux boutons apparaissent :
   - **📍 Ajouter un checkpoint** - Pour marquer les étapes importantes
   - **⏹ Arrêter & Générer le code** - Pour terminer

### 3. Effectuer ton scan manuel

Fais EXACTEMENT ce que tu ferais normalement :

#### Étape 1 : Ouvrir la modal followers
- Va sur ton profil Instagram
- Clique sur "X followers"
- **Clique sur "📍 Ajouter un checkpoint"** → Checkpoint "Modal ouverte"

#### Étape 2 : Scroller naturellement
- Scrolle dans la liste des followers **comme tu le ferais normalement**
- Pas besoin d'aller vite ou lentement - fais juste naturellement
- Le recorder enregistre :
  - ✅ Ta vitesse de scroll
  - ✅ Tes pauses
  - ✅ La distance de chaque scroll
  - ✅ Les nouveaux followers qui apparaissent

#### Étape 3 : Checkpoints intermédiaires (optionnel)
- Toutes les 50-100 followers, clique sur **"📍 Ajouter un checkpoint"**
- Ça aide le système à comprendre la progression

#### Étape 4 : Arriver en bas
- Continue à scroller jusqu'à ce qu'il n'y ait plus de nouveaux followers
- **Clique sur "📍 Ajouter un checkpoint"** → Checkpoint "Fin de liste"

### 4. Arrêter et exporter

Clique sur **"⏹ Arrêter & Générer le code"**

Le système va :
1. ✅ Analyser tous tes gestes
2. ✅ Calculer les patterns de scroll optimaux
3. ✅ Générer le code TypeScript
4. ✅ Télécharger 2 fichiers :

#### Fichier 1 : `waler-recording-XXXXX.json`
Contient toutes les données brutes :
```json
{
  "recorded_at": "2026-05-22T19:07:00Z",
  "duration_ms": 47000,
  "total_events": 234,
  "total_followers": 214,
  "checkpoints": [
    {
      "label": "START",
      "followersCount": 0
    },
    {
      "label": "Modal ouverte",
      "followersCount": 8
    },
    {
      "label": "Checkpoint 1",
      "followersCount": 52
    },
    {
      "label": "Fin de liste",
      "followersCount": 214
    }
  ]
}
```

#### Fichier 2 : `waler-scan-generated-XXXXX.ts`
Le code généré prêt à utiliser :
```typescript
/**
 * Code généré automatiquement par Waler Recorder
 * Followers détectés: 214
 * Pattern de scroll détecté:
 * - Scroll moyen: 450px
 * - Délai moyen: 1200ms
 */

async function performOptimizedScan() {
  // ... code optimisé basé sur tes gestes réels
}
```

### 5. Utiliser le code généré

Le code généré utilise **TES patterns exacts** :
- ✅ Ta vitesse de scroll naturelle
- ✅ Tes délais entre scrolls
- ✅ Ton rythme humain

Tu peux :
1. **Copier le code** dans `instagram-tracker.ts` pour remplacer la méthode `performInitialScan()`
2. **Analyser les stats** pour comprendre ton comportement
3. **Réenregistrer** si tu veux optimiser

## Indicateurs visuels

### Flash vert sur les clics
Chaque fois que tu cliques, un cercle vert apparaît pour confirmer l'enregistrement

### Flash orange sur les checkpoints
Quand tu ajoutes un checkpoint, un message orange apparaît au centre de l'écran

### Stats en temps réel
Le panneau se met à jour en direct :
- **Events** : Nombre d'actions enregistrées
- **Checkpoints** : Nombre d'étapes marquées
- **Followers** : Nombre de followers détectés
- **Durée** : Temps écoulé

## Conseils pour un bon enregistrement

### ✅ À FAIRE
- Scrolle naturellement, comme d'habitude
- Ajoute des checkpoints aux étapes importantes
- Attends que les followers se chargent avant de scroller
- Va jusqu'au bout de la liste

### ❌ À ÉVITER
- Ne scrolle pas trop vite (Instagram ne chargera pas)
- Ne scrolle pas trop lentement (pas naturel)
- N'oublie pas d'ajouter le checkpoint final

## Exemple de session complète

```
1. Ctrl+Alt+R → Activer le recorder
2. Clic "Démarrer" → 🔴 Enregistrement
3. Aller sur ton profil
4. Clic "214 followers"
5. Checkpoint "Modal ouverte" → 8 followers détectés
6. Scroll... scroll... scroll...
7. Checkpoint "50 followers" → 52 followers détectés
8. Scroll... scroll... scroll...
9. Checkpoint "100 followers" → 104 followers détectés
10. Scroll... scroll... scroll...
11. Checkpoint "Fin" → 214 followers détectés
12. Clic "Arrêter & Générer"
13. Récupérer les 2 fichiers téléchargés
```

## Résultat attendu

Le code généré devrait ressembler à :

```typescript
// Pattern de scroll détecté:
// - Scroll moyen: 450px
// - Délai moyen: 1200ms

while (stableCount < maxStableChecks) {
  // Collecter followers...
  
  // Scroll optimisé (basé sur tes gestes réels)
  scrollContainer.scrollTop += 450;
  
  // Délai naturel (basé sur ton rythme)
  await new Promise(resolve => setTimeout(resolve, 1200));
}
```

## Avantages

✅ **Indétectable** - Utilise ton comportement humain réel
✅ **Optimisé** - Basé sur ce qui fonctionne vraiment
✅ **Personnalisé** - Adapté à ton style de navigation
✅ **Reproductible** - Peut être rejoué à l'identique

## Dépannage

### Le panneau n'apparaît pas
- Vérifie que tu es bien sur Instagram
- Recharge la page
- Réessaye `Ctrl+Alt+R`

### Aucun follower détecté
- Assure-toi que la modal followers est ouverte
- Scrolle pour que les followers apparaissent
- Vérifie que tu n'es pas sur une page système

### Le code généré ne fonctionne pas
- Réenregistre une session plus longue
- Ajoute plus de checkpoints
- Assure-toi d'aller jusqu'au bout de la liste

## Support

Si tu as des questions ou des problèmes, vérifie les logs dans la console :
```
🎬 [Recorder] Enregistrement démarré
📍 [Checkpoint] Modal ouverte
✅ [Recorder] Export terminé
```
