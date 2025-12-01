# Plan d'Action : Amélioration de la Robustesse de Compréhension IA

## 🎯 Objectif
Rendre l'agent IA capable de comprendre les requêtes utilisateur même avec :
- Des fautes d'orthographe
- Des variations de langage
- Des formulations différentes
- Des synonymes
- Du langage informel/sms

## 📋 Analyse du Système Actuel

### Points Faibles Identifiés

1. **Handlers avec patterns simples** (`deepwork.handler.ts`, `task-planning.handler.ts`, etc.)
   - Utilisation de `includes()` très basique
   - Pas de gestion des fautes d'orthographe
   - Peu de variations acceptées

2. **IntentDetectionService** (`lib/ai/IntentDetectionService.ts`)
   - Prompt système basique avec peu d'exemples
   - Pas de gestion explicite des variations
   - Pas de normalisation préalable

3. **Pas de normalisation de texte**
   - Pas de correction d'orthographe
   - Pas de gestion des abréviations SMS
   - Pas de gestion des accents manquants

## 🚀 Plan d'Action Détaillé

### Phase 1 : Service de Normalisation de Texte

**Fichier à créer :** `lib/utils/TextNormalizer.ts`

**Fonctionnalités :**
- Correction d'orthographe basique (dictionnaire français)
- Normalisation des accents
- Gestion des abréviations SMS courantes
- Normalisation de la casse
- Suppression des caractères spéciaux superflus

**Exemples :**
- "j'ai" → "j'ai" (gestion apostrophe)
- "demain" → "demain" (même avec "dem1n", "dem1n", etc.)
- "commence" → "commence" (même avec "kommence", "commance", etc.)

### Phase 2 : Dictionnaire de Variations et Synonymes

**Fichier à créer :** `lib/utils/CommandVariations.ts`

**Structure :**
```typescript
export const COMMAND_VARIATIONS = {
  start_deepwork: {
    keywords: ['commence', 'démarre', 'start', 'lance', 'go'],
    contexts: ['travailler', 'travail', 'deep work', 'deepwork', 'focus', 'concentration'],
    variations: [
      'je commence à travailler',
      'je démarre une session',
      'lance une session de travail',
      'go deep work',
      'je veux travailler',
      'je vais bosser',
      // ... des centaines d'exemples
    ]
  },
  // ... pour chaque commande
}
```

### Phase 3 : Amélioration du Prompt Système IntentDetectionService

**Modifications :**
- Ajouter 200+ exemples de variations pour chaque intention
- Inclure des exemples avec fautes d'orthographe
- Inclure des exemples de langage informel
- Ajouter des instructions explicites sur la tolérance aux erreurs

### Phase 4 : Système de Matching Flexible

**Fichier à créer :** `lib/utils/FlexibleMatcher.ts`

**Fonctionnalités :**
- Matching flou (fuzzy matching)
- Score de similarité
- Matching par synonymes
- Matching par contexte

### Phase 5 : Refactorisation des Handlers

**Modifications :**
- Remplacer les `includes()` simples par le système de matching flexible
- Utiliser le TextNormalizer avant traitement
- Utiliser le dictionnaire de variations

## 📝 Exemples de Variations à Gérer

### Deep Work - Démarrer Session

**Variations acceptées :**
- "je commence à travailler"
- "je démarre une session"
- "lance une session de deep work"
- "go deep work"
- "je veux bosser"
- "je vais travailler"
- "commence le travail"
- "démarre le deep work"
- "start deep work"
- "je commence le travail"
- "je démarre le travail"
- "lance une session"
- "je veux faire du deep work"
- "je vais faire une session"
- "commence une session de travail"
- "démare une session" (faute)
- "kommence à travaiiler" (fautes)
- "je comence a travaiiler" (fautes)
- "c parti pour bosser" (sms)
- "go bosser" (sms)
- "c'est parti" (contexte)
- "allez on y va" (contexte)

### Planification - Demain

**Variations acceptées :**
- "planifie demain"
- "organise ma journée de demain"
- "prépare demain"
- "mes tâches de demain"
- "ce que j'ai à faire demain"
- "ma to-do demain"
- "planning demain"
- "organise demain"
- "préparer demain"
- "planifier demain"
- "organiser demain"
- "je veux planifier demain"
- "aide-moi à organiser demain"
- "qu'est-ce que je dois faire demain"
- "planif demain" (abréviation)
- "planif dem1n" (sms)
- "organise dem1n" (sms)
- "prépare dem1n" (sms)

### Journal

**Variations acceptées :**
- "journal"
- "note de ma journée"
- "raconter ma journée"
- "récap de ma journée"
- "note de journée"
- "journal de la journée"
- "note ma journée"
- "raconte ma journée"
- "résumé de ma journée"
- "note de sa journée"
- "journal de sa journée"
- "note journee" (sans accent)
- "note de journee" (sans accent)
- "raconter journee" (sans accent)
- "note de ma journee" (sans accent)

### Terminer Tâche

**Variations acceptées :**
- "j'ai fini"
- "c'est fait"
- "terminé"
- "fini"
- "validé"
- "check"
- "fait"
- "complété"
- "terminée"
- "finie"
- "validée"
- "complétée"
- "j'ai terminé"
- "j'ai fini la tâche"
- "c'est terminé"
- "c'est fini"
- "c'est validé"
- "j'ai complété"
- "j'ai validé"
- "terminer"
- "finir"
- "valider"
- "compléter"
- "j'ai fait"
- "c'est bon"
- "c'est ok"
- "ok c'est fait"
- "c'est fait" (sms)
- "c fait" (sms)
- "terminé" (sms)
- "fini" (sms)

## 🔧 Implémentation Technique

### 1. TextNormalizer.ts

```typescript
export class TextNormalizer {
  // Dictionnaire d'abréviations SMS
  private static SMS_ABBREVIATIONS = {
    'c': 'c\'est',
    'j': 'je',
    't': 'tu',
    'm': 'me',
    's': 'se',
    'l': 'le',
    'd': 'de',
    'n': 'ne',
    'qu': 'que',
    'pr': 'pour',
    'ds': 'dans',
    'vs': 'vous',
    'tt': 'tout',
    'tts': 'tous',
    'bcp': 'beaucoup',
    'pk': 'pourquoi',
    'pq': 'parce que',
    'pt': 'petit',
    'ptt': 'petite',
    'ptdr': 'pété de rire',
    'mdr': 'mort de rire',
    'lol': 'laughing out loud',
    'stp': 's\'il te plaît',
    'svp': 's\'il vous plaît',
    'rdv': 'rendez-vous',
    'rdv': 'rendez-vous',
    'dem1n': 'demain',
    'dem1': 'demain',
    'dem': 'demain',
    'auj': 'aujourd\'hui',
    'aujdh': 'aujourd\'hui',
    'hier': 'hier',
    'h': 'heure',
    'h': 'heures',
    'min': 'minute',
    'min': 'minutes',
    'sec': 'seconde',
    'sec': 'secondes',
  }

  // Corrections d'orthographe courantes
  private static COMMON_TYPOS = {
    'kommence': 'commence',
    'commance': 'commence',
    'commence': 'commence',
    'démare': 'démarre',
    'demare': 'démarre',
    'demarre': 'démarre',
    'travaiiler': 'travailler',
    'travailler': 'travailler',
    'travailer': 'travailler',
    'journee': 'journée',
    'journe': 'journée',
    'journe': 'journée',
    'planif': 'planifie',
    'planifie': 'planifie',
    'organise': 'organise',
    'organise': 'organise',
    'prepare': 'prépare',
    'prepare': 'prépare',
  }

  static normalize(text: string): string {
    // Normaliser la casse
    let normalized = text.toLowerCase().trim()
    
    // Remplacer les abréviations SMS
    for (const [abbrev, full] of Object.entries(this.SMS_ABBREVIATIONS)) {
      const regex = new RegExp(`\\b${abbrev}\\b`, 'gi')
      normalized = normalized.replace(regex, full)
    }
    
    // Corriger les fautes courantes
    for (const [typo, correct] of Object.entries(this.COMMON_TYPOS)) {
      const regex = new RegExp(`\\b${typo}\\b`, 'gi')
      normalized = normalized.replace(regex, correct)
    }
    
    // Normaliser les espaces multiples
    normalized = normalized.replace(/\s+/g, ' ')
    
    return normalized.trim()
  }
}
```

### 2. CommandVariations.ts

```typescript
export const COMMAND_VARIATIONS = {
  start_deepwork: {
    primaryKeywords: ['commence', 'démarre', 'start', 'lance', 'go', 'début', 'débuter'],
    contextKeywords: ['travailler', 'travail', 'deep work', 'deepwork', 'focus', 'concentration', 'session', 'bosser'],
    variations: [
      // Formulations normales
      'je commence à travailler',
      'je démarre une session',
      'lance une session de travail',
      'go deep work',
      'je veux travailler',
      'je vais bosser',
      'commence le travail',
      'démarre le deep work',
      'start deep work',
      'je commence le travail',
      'je démarre le travail',
      'lance une session',
      'je veux faire du deep work',
      'je vais faire une session',
      'commence une session de travail',
      'démarre une session de deep work',
      'je commence une session',
      'je démarre une session de travail',
      'on commence à travailler',
      'on démarre une session',
      'c\'est parti pour travailler',
      'c\'est parti pour le travail',
      'allez on y va',
      'allez on commence',
      'allez on démarre',
      'on y va',
      'c\'est parti',
      // Avec fautes d'orthographe
      'je comence à travaiiler',
      'je démarre une session',
      'kommence le travail',
      'commance à travailler',
      'démare une session',
      'je veux travaiiler',
      // SMS/Informel
      'c parti pour bosser',
      'go bosser',
      'c\'est parti',
      'j\'veux bosser',
      'j\'vais bosser',
      'on y va',
      'allez',
      // Variations avec contexte
      'je veux me concentrer',
      'je veux faire du focus',
      'je veux me mettre au travail',
      'je veux me mettre au boulot',
      'je veux me mettre au travail',
      'je veux me concentrer sur mon travail',
      'je veux faire une session de concentration',
      'je veux faire une session de focus',
      'je veux faire une session de deep work',
      'je veux faire une session de travail',
      'je veux faire une session',
      'je veux commencer à travailler',
      'je veux démarrer une session',
      'je veux lancer une session',
      'je veux commencer une session',
      'je veux démarrer le travail',
      'je veux commencer le travail',
      'je veux lancer le travail',
      'je veux commencer',
      'je veux démarrer',
      'je veux lancer',
      'je veux commencer à bosser',
      'je veux démarrer à bosser',
      'je veux lancer à bosser',
      'je veux commencer à bosser',
      'je veux démarrer à bosser',
      'je veux lancer à bosser',
      // Questions
      'je peux commencer à travailler ?',
      'je peux démarrer une session ?',
      'je peux lancer une session ?',
      'je peux commencer ?',
      'je peux démarrer ?',
      'je peux lancer ?',
      'est-ce que je peux commencer ?',
      'est-ce que je peux démarrer ?',
      'est-ce que je peux lancer ?',
      // Impératif
      'commence',
      'démarre',
      'lance',
      'go',
      'start',
      'commence à travailler',
      'démarre une session',
      'lance une session',
      'commence le travail',
      'démarre le travail',
      'lance le travail',
      'commence une session',
      'démarre une session',
      'lance une session',
      // Avec durée
      'je commence à travailler pour 25 minutes',
      'je démarre une session de 25 minutes',
      'lance une session de 25 minutes',
      'je veux travailler 25 minutes',
      'je vais bosser 25 minutes',
      'commence le travail pour 25 minutes',
      'démarre le deep work pour 25 minutes',
      'start deep work for 25 minutes',
      'je commence le travail pour 25 minutes',
      'je démarre le travail pour 25 minutes',
      'lance une session pour 25 minutes',
      'je veux faire du deep work 25 minutes',
      'je vais faire une session de 25 minutes',
      'commence une session de travail de 25 minutes',
      'démarre une session de deep work de 25 minutes',
    ],
    minConfidence: 0.7
  },
  // ... autres commandes
}
```

### 3. FlexibleMatcher.ts

```typescript
import { TextNormalizer } from './TextNormalizer'
import { COMMAND_VARIATIONS } from './CommandVariations'

export class FlexibleMatcher {
  /**
   * Vérifie si un message correspond à une commande avec tolérance aux erreurs
   */
  static matchesCommand(
    message: string,
    commandKey: keyof typeof COMMAND_VARIATIONS
  ): { matches: boolean; confidence: number; matchedVariation?: string } {
    const normalized = TextNormalizer.normalize(message)
    const command = COMMAND_VARIATIONS[commandKey]
    
    if (!command) {
      return { matches: false, confidence: 0 }
    }

    // Vérifier les variations exactes
    for (const variation of command.variations) {
      const similarity = this.calculateSimilarity(normalized, variation)
      if (similarity >= command.minConfidence) {
        return {
          matches: true,
          confidence: similarity,
          matchedVariation: variation
        }
      }
    }

    // Vérifier par mots-clés
    const hasPrimaryKeyword = command.primaryKeywords.some(kw => 
      normalized.includes(kw)
    )
    const hasContextKeyword = command.contextKeywords.some(kw => 
      normalized.includes(kw)
    )

    if (hasPrimaryKeyword && hasContextKeyword) {
      return {
        matches: true,
        confidence: 0.8
      }
    }

    return { matches: false, confidence: 0 }
  }

  /**
   * Calcule la similarité entre deux chaînes (algorithme de Levenshtein simplifié)
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const distance = this.levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }
}
```

## 📊 Métriques de Succès

- **Taux de compréhension** : > 95% même avec fautes d'orthographe
- **Temps de réponse** : < 500ms pour la normalisation
- **Couverture** : 200+ variations par commande principale

## 🧪 Tests à Effectuer

1. Tests unitaires pour TextNormalizer
2. Tests unitaires pour FlexibleMatcher
3. Tests d'intégration avec des messages réels d'utilisateurs
4. Tests de performance
5. Tests avec différents niveaux de fautes d'orthographe

## 📅 Timeline

- **Semaine 1** : Phase 1 (TextNormalizer) + Phase 2 (CommandVariations)
- **Semaine 2** : Phase 3 (Amélioration IntentDetectionService) + Phase 4 (FlexibleMatcher)
- **Semaine 3** : Phase 5 (Refactorisation handlers) + Tests
- **Semaine 4** : Optimisations + Documentation

