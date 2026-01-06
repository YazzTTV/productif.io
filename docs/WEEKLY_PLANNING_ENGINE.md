# Weekly Planning Engine - Documentation

## Vue d'ensemble

Le **Weekly Planning Engine** est le système de planification intelligente de Productif.io. Il organise automatiquement la semaine d'un étudiant dans Google Calendar en tenant compte de :

- **Les matières et leurs coefficients** (importance)
- **Les tâches liées aux matières**
- **Les événements existants du calendrier** (cours, rendez-vous, etc.)
- **La logique cognitive** (travailler les matières importantes au bon moment)

## Architecture

### 1. WeeklyPlanningEngine (`lib/planning/WeeklyPlanningEngine.ts`)

Le moteur principal qui orchestre toute la logique de planification.

#### Méthodes principales

- `planWeek(userId, weekStart?)` : Point d'entrée principal
  - Retourne un `WeeklyPlan` avec les sessions planifiées

#### Étapes de planification

1. **Préparation des données** (`prepareData`)
   - Récupère les matières avec leurs tâches non complétées
   - Filtre les tâches pertinentes pour la semaine

2. **Analyse du calendrier** (`analyzeCalendar`)
   - Récupère les événements Google Calendar de la semaine
   - Détecte les cours (heuristique basée sur les mots-clés)
   - Extrait les noms de matières depuis les titres de cours
   - Identifie les périodes occupées

3. **Calcul de la distribution** (`calculateDistribution`)
   - Calcule le temps alloué par matière proportionnellement au coefficient
   - Identifie les jours préférés (jours avec cours de la matière)
   - Limite le temps au minimum entre alloué et requis

4. **Génération des créneaux libres** (`findFreeSlots`)
   - Trouve tous les créneaux libres de la semaine
   - Respecte les horaires de travail (8h-22h)
   - Filtre les créneaux trop courts (< 30 min)

5. **Assignation intelligente** (`assignSessionsToSlots`)
   - Priorise les matières avec coefficients élevés
   - **Règle clé** : Préfère étudier une matière le jour où il y a un cours
   - Assigne les meilleurs créneaux (matin pour matières importantes)
   - Groupe les tâches en sessions raisonnables (max 2h)

### 2. API Endpoint (`app/api/planning/weekly-plan/route.ts`)

#### GET `/api/planning/weekly-plan`
Génère un plan (preview) sans l'appliquer.

**Query params:**
- `weekStart` (optionnel) : Date de début de semaine (ISO string)

**Réponse:**
```json
{
  "success": true,
  "plan": {
    "sessions": [...],
    "summary": {...}
  }
}
```

#### POST `/api/planning/weekly-plan`
Génère et applique le plan (crée les événements dans Google Calendar).

**Body:**
```json
{
  "weekStart": "2025-01-06T00:00:00Z", // optionnel
  "apply": true
}
```

**Réponse:**
```json
{
  "success": true,
  "plan": {...},
  "applied": true,
  "eventsCreated": 12,
  "eventsFailed": 0,
  "message": "12 session(s) créée(s) dans Google Calendar"
}
```

### 3. Google Calendar Service (`lib/calendar/GoogleCalendarService.ts`)

#### Méthode ajoutée

- `createBatchEvents(userId, sessions)` : Crée plusieurs événements en batch
  - Gère les rate limits avec des délais
  - Retourne les résultats pour chaque session

## Logique de priorisation

### 1. Priorité par coefficient

Les matières avec des coefficients élevés reçoivent :
- Plus de temps total
- Les meilleurs créneaux (matin, jours préférés)

**Exemple:**
- Maths (coef 6) → 600 min/semaine
- Anglais (coef 1) → 100 min/semaine

### 2. Intelligence contextuelle (CRITIQUE)

**Règle principale** : Si une matière a un cours un jour donné, préférer étudier cette matière le même jour.

**Score de priorité des créneaux:**
- +100 points : Jour avec cours de la matière
- +50 points : Matin (8h-12h) pour matières importantes (coef ≥ 3)
- +20 points : Avant 20h
- -10 points : Créneau trop grand (gaspillage de temps)

### 3. Distribution proportionnelle

Le temps total disponible (1200 min/semaine) est distribué proportionnellement :

```
Temps matière = (Coefficient matière / Total coefficients) × 1200 min
```

### 4. Respect des contraintes

- **Jamais** d'écrasement d'événements existants
- **Seulement** dans les créneaux libres
- **Maximum** 2h par session
- **Minimum** 30 min par créneau

## Détection des cours

Heuristique simple basée sur les mots-clés dans le titre :
- `cours`, `td`, `tp`, `amphi`, `classe`, `lecture`, `seminar`, `class`, `lesson`

Le nom de la matière est extrait des premiers mots du titre.

## Exemple d'utilisation

### 1. Générer un plan (preview)

```typescript
const plan = await weeklyPlanningService.generatePlan()
console.log(plan.summary)
// {
//   totalSessions: 12,
//   totalMinutes: 1200,
//   subjectsCovered: ["Maths", "Physique", "Anglais"],
//   distribution: {
//     "Maths": 600,
//     "Physique": 400,
//     "Anglais": 200
//   }
// }
```

### 2. Appliquer le plan

```typescript
const result = await weeklyPlanningService.applyPlan()
console.log(result.message)
// "12 session(s) créée(s) dans Google Calendar"
```

## Flux utilisateur

1. **Création des matières** : L'utilisateur crée ses matières avec coefficients
2. **Création des tâches** : L'utilisateur crée des tâches liées aux matières
3. **Clic sur "Plan My Week"** : L'utilisateur déclenche la planification
4. **Preview** : Le système génère et affiche le plan proposé
5. **Confirmation** : L'utilisateur confirme
6. **Application** : Les événements sont créés dans Google Calendar

## Points d'attention

- **Google Calendar doit être connecté** pour utiliser cette fonctionnalité
- **Les événements créés** sont marqués avec `productif: 'true'` dans les extendedProperties
- **Les tâches** sont mises à jour avec `schedulingStatus: 'scheduled'`
- **Les ScheduledTaskEvent** sont créés pour le tracking

## Améliorations futures possibles

- Détection plus intelligente des cours (ML)
- Prise en compte des préférences utilisateur (horaires préférés)
- Réplanification automatique si un événement est déplacé
- Suggestions de créneaux alternatifs si conflit

