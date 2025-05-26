# Tokens API pour Agents IA

Ce document explique comment utiliser les tokens API pour connecter des agents IA Ã  l'application productif.io.

## Introduction

Les tokens API permettent Ã  des applications tierces et des agents IA d'accÃ©der aux ressources de l'application productif.io au nom d'un utilisateur. Cela facilite l'intÃ©gration avec des assistants IA qui peuvent aider Ã  gÃ©rer les habitudes, tÃ¢ches, et autres fonctionnalitÃ©s.

## Changements rÃ©cents

### Mise Ã  jour de l'authentification des APIs d'habitudes (Janvier 2024)

**Important**: Toutes les APIs d'habitudes ont Ã©tÃ© mises Ã  jour pour utiliser l'authentification Bearer token au lieu de l'authentification par session. Cette modification amÃ©liore la sÃ©curitÃ© et la cohÃ©rence avec les autres APIs.

**APIs mises Ã  jour** :
- `/api/habits` (GET, POST, PATCH, DELETE)
- `/api/habits/today`
- `/api/habits/date`
- `/api/habits/recent`
- `/api/habits/history`
- `/api/habits/stats`
- `/api/habits/least-tracked`
- `/api/habits/entries` (POST)
- `/api/habits/entries/batch`
- `/api/habits/entries/all`
- `/api/habits/entries/period`
- `/api/habits/entries/date` (GET, POST)

**Migration requise** : Si vous utilisiez ces APIs avec l'authentification par session, vous devez maintenant utiliser un token API avec les scopes appropriÃ©s (`habits:read` et/ou `habits:write`).

## Obtenir un token API

1. Connectez-vous Ã  votre compte productif.io
2. AccÃ©dez Ã  la section ParamÃ¨tres > Tokens API
3. Cliquez sur "CrÃ©er un nouveau token"
4. Donnez un nom descriptif au token (ex: "Assistant IA")
5. SÃ©lectionnez les permissions (scopes) nÃ©cessaires
6. DÃ©finissez Ã©ventuellement une date d'expiration
7. Cliquez sur "CrÃ©er"

**Important**: Le token complet ne sera affichÃ© qu'une seule fois Ã  la crÃ©ation. Copiez-le immÃ©diatement et stockez-le de maniÃ¨re sÃ©curisÃ©e.

## Scopes disponibles

Les tokens API utilisent un systÃ¨me de permissions (scopes) pour limiter l'accÃ¨s :

- `habits:read` - Lecture des habitudes
- `habits:write` - CrÃ©ation et mise Ã  jour des habitudes
- `tasks:read` - Lecture des tÃ¢ches
- `tasks:write` - CrÃ©ation et mise Ã  jour des tÃ¢ches
- `projects:read` - Lecture des projets
- `projects:write` - CrÃ©ation et mise Ã  jour des projets
- `objectives:read` - Lecture des objectifs OKR
- `objectives:write` - CrÃ©ation et mise Ã  jour des objectifs OKR
- `processes:read` - Lecture des processus
- `processes:write` - CrÃ©ation et mise Ã  jour des processus

## Authentification

**IMPORTANT**: Toutes les APIs d'habitudes utilisent maintenant l'authentification Bearer token. L'authentification par session n'est plus supportÃ©e pour les intÃ©grations externes.

Pour authentifier une requÃªte API, incluez le token dans l'en-tÃªte `Authorization` et l'ID utilisateur dans l'en-tÃªte `x-api-user-id` :

```
Authorization: Bearer {votre_token}
x-api-user-id: {votre_user_id}
```

**Note**: L'en-tÃªte `x-api-user-id` est automatiquement ajoutÃ© par le middleware d'authentification API lors de la validation du token. Vous n'avez besoin que de fournir l'en-tÃªte `Authorization`.

### Migration depuis l'authentification par session

Si vous utilisiez prÃ©cÃ©demment des APIs d'habitudes avec l'authentification par session, vous devez maintenant :

1. CrÃ©er un token API avec les scopes appropriÃ©s (`habits:read` et/ou `habits:write`)
2. Utiliser l'en-tÃªte `Authorization: Bearer {token}` au lieu des cookies de session
3. Toutes les APIs d'habitudes fonctionnent maintenant de maniÃ¨re cohÃ©rente avec ce systÃ¨me

## Exemples d'utilisation

### Habitudes

**Toutes les APIs d'habitudes utilisent maintenant l'authentification Bearer token.**

#### 1. RÃ©cupÃ©rer toutes les habitudes

```bash
curl -X GET "https://productif.io/api/habits" \
  -H "Authorization: Bearer {votre_token}"
```

#### 2. RÃ©cupÃ©rer les habitudes d'aujourd'hui

```bash
curl -X GET "https://productif.io/api/habits/today" \
  -H "Authorization: Bearer {votre_token}"
```

#### 3. RÃ©cupÃ©rer les habitudes pour une date spÃ©cifique

```bash
curl -X GET "https://productif.io/api/habits/date?date=2023-04-15" \
  -H "Authorization: Bearer {votre_token}"
```

#### 4. CrÃ©er une nouvelle habitude

```bash
curl -X POST "https://productif.io/api/habits" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nouvelle habitude",
    "description": "Description de l'habitude",
    "color": "#4338CA",
    "frequency": "daily",
    "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday"]
  }'
```

#### 5. Mettre Ã  jour l'ordre des habitudes

```bash
curl -X PATCH "https://productif.io/api/habits" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "habits": [
      {"id": "habit1", "order": 0},
      {"id": "habit2", "order": 1}
    ]
  }'
```

#### 6. Supprimer une habitude

```bash
curl -X DELETE "https://productif.io/api/habits?id=habit_id_123" \
  -H "Authorization: Bearer {votre_token}"
```

#### 7. RÃ©cupÃ©rer les habitudes rÃ©centes

```bash
curl -X GET "https://productif.io/api/habits/recent" \
  -H "Authorization: Bearer {votre_token}"
```

#### 8. RÃ©cupÃ©rer l'historique des habitudes

```bash
curl -X GET "https://productif.io/api/habits/history" \
  -H "Authorization: Bearer {votre_token}"
```

#### 9. RÃ©cupÃ©rer les statistiques des habitudes

```bash
curl -X GET "https://productif.io/api/habits/stats" \
  -H "Authorization: Bearer {votre_token}"
```

#### 10. RÃ©cupÃ©rer les habitudes les moins suivies

```bash
curl -X GET "https://productif.io/api/habits/least-tracked" \
  -H "Authorization: Bearer {votre_token}"
```

### EntrÃ©es d'habitudes

#### 1. CrÃ©er ou mettre Ã  jour une entrÃ©e d'habitude

```bash
curl -X POST "https://productif.io/api/habits/entries" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "habitId": "habit_id_123",
    "date": "2023-04-15",
    "completed": true,
    "note": "J'ai complÃ©tÃ© cette habitude",
    "rating": 8
  }'
```

#### 2. Traitement en lot des entrÃ©es

```bash
curl -X POST "https://productif.io/api/habits/entries/batch" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {
        "habitId": "habit1",
        "date": "2023-04-15",
        "completed": true
      },
      {
        "habitId": "habit2", 
        "date": "2023-04-15",
        "completed": false
      }
    ]
  }'
```

#### 3. RÃ©cupÃ©rer toutes les entrÃ©es d'habitudes

```bash
curl -X GET "https://productif.io/api/habits/entries/all" \
  -H "Authorization: Bearer {votre_token}"
```

#### 4. RÃ©cupÃ©rer les entrÃ©es sur une pÃ©riode

```bash
curl -X GET "https://productif.io/api/habits/entries/period?startDate=2023-04-01&endDate=2023-04-30" \
  -H "Authorization: Bearer {votre_token}"
```

#### 5. RÃ©cupÃ©rer les entrÃ©es pour une date spÃ©cifique

```bash
curl -X GET "https://productif.io/api/habits/entries/date?date=2023-04-15" \
  -H "Authorization: Bearer {votre_token}"
```

#### 6. CrÃ©er une entrÃ©e pour une date spÃ©cifique

```bash
curl -X POST "https://productif.io/api/habits/entries/date" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "habitId": "habit_id_123",
    "date": "2023-04-15",
    "completed": true,
    "note": "Excellente session",
    "rating": 9
  }'
```

### CompatibilitÃ© avec les anciens endpoints

#### Endpoint agent (toujours disponible pour la rÃ©trocompatibilitÃ©)

L'endpoint `/api/habits/agent` reste disponible pour la compatibilitÃ© avec les intÃ©grations existantes :

```bash
curl -X GET "https://productif.io/api/habits/agent" \
  -H "Authorization: Bearer {votre_token}"
```

```bash
curl -X POST "https://productif.io/api/habits/agent" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "habitId": "clg123abc",
    "date": "2023-04-15",
    "completed": true,
    "note": "ComplÃ©tÃ© par l'assistant IA"
  }'
```

**Note**: Il est recommandÃ© d'utiliser les nouveaux endpoints listÃ©s ci-dessus pour une meilleure cohÃ©rence et plus de fonctionnalitÃ©s.

### TÃ¢ches

#### 1. CrÃ©er une nouvelle tÃ¢che

```bash
curl -X POST "https://productif.io/api/tasks/agent" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nouvelle tÃ¢che crÃ©Ã©e par l'IA",
    "description": "Cette tÃ¢che a Ã©tÃ© gÃ©nÃ©rÃ©e automatiquement",
    "scheduledFor": "2023-04-16",
    "priority": 2,
    "energyLevel": 1,
    "dueDate": "2023-04-20"
  }'
```

#### 2. Marquer une tÃ¢che comme terminÃ©e

```bash
curl -X PATCH "https://productif.io/api/tasks/agent/{task_id}" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true
  }'
```

#### 3. Mettre Ã  jour une tÃ¢che avec un processus

```bash
curl -X PATCH "https://productif.io/api/tasks/{task_id}/process" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "processId": "process_id_123"
  }'
```

### Processus

#### 1. RÃ©cupÃ©rer tous les processus

```bash
curl -X GET "https://productif.io/api/processes" \
  -H "Authorization: Bearer {votre_token}"
```

#### 2. CrÃ©er un nouveau processus

```bash
curl -X POST "https://productif.io/api/processes" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Processus de publication d'article",
    "description": "Ã‰tapes pour publier un article sur le blog"
  }'
```

#### 3. Mettre Ã  jour un processus

```bash
curl -X PATCH "https://productif.io/api/processes" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "process_id_123",
    "name": "Nouveau nom du processus",
    "description": "Nouvelle description"
  }'
```

#### 4. RÃ©cupÃ©rer un processus spÃ©cifique avec ses tÃ¢ches

```bash
curl -X GET "https://productif.io/api/processes/{process_id}" \
  -H "Authorization: Bearer {votre_token}"
```

#### 5. RÃ©cupÃ©rer toutes les tÃ¢ches d'un processus

```bash
curl -X GET "https://productif.io/api/processes/{process_id}/tasks" \
  -H "Authorization: Bearer {votre_token}"
```

#### 6. RÃ©cupÃ©rer les statistiques de tous les processus

```bash
curl -X GET "https://productif.io/api/processes/stats" \
  -H "Authorization: Bearer {votre_token}"
```

### TÃ¢ches avec date spÃ©cifique

Le paramÃ¨tre `date` vous permet de filtrer les tÃ¢ches selon une date spÃ©cifique. Ce paramÃ¨tre prend en compte le fuseau horaire de l'utilisateur (par dÃ©faut Europe/Paris) et retourne les tÃ¢ches qui correspondent Ã  l'un des critÃ¨res suivants :

- TÃ¢ches dont la date d'Ã©chÃ©ance (`dueDate`) tombe le jour spÃ©cifiÃ©
- TÃ¢ches planifiÃ©es (`scheduledFor`) pour le jour spÃ©cifiÃ©
- TÃ¢ches complÃ©tÃ©es le jour spÃ©cifiÃ©
- TÃ¢ches en retard par rapport au jour spÃ©cifiÃ©
- TÃ¢ches crÃ©Ã©es le jour spÃ©cifiÃ© sans date d'Ã©chÃ©ance ni date de planification

#### 1. RÃ©cupÃ©rer les tÃ¢ches pour une date spÃ©cifique

Cette mÃ©thode utilise l'endpoint principal des tÃ¢ches avec un filtrage par date basique.

```bash
curl -X GET "https://productif.io/api/tasks?date=2023-04-15" \
  -H "Authorization: Bearer {votre_token}"
```

#### 2. RÃ©cupÃ©rer les tÃ¢ches dÃ©taillÃ©es pour une date spÃ©cifique

Cette mÃ©thode utilise un endpoint dÃ©diÃ© avec un traitement plus prÃ©cis des fuseaux horaires et une logique de filtrage plus avancÃ©e.

```bash
curl -X GET "https://productif.io/api/tasks/date?date=2023-04-15" \
  -H "Authorization: Bearer {votre_token}"
```

#### 3. RÃ©cupÃ©rer les tÃ¢ches pour une date spÃ©cifique via un agent IA

Cette mÃ©thode utilise un endpoint dÃ©diÃ© aux agents IA qui permet d'accÃ©der aux tÃ¢ches d'une date spÃ©cifique avec l'authentification API.

```bash
curl -X GET "https://productif.io/api/tasks/agent/date?date=2023-04-15" \
  -H "Authorization: Bearer {votre_token}"
```

**Format de date** : Le paramÃ¨tre date doit Ãªtre au format YYYY-MM-DD (ISO 8601).

**Exemple de rÃ©ponse** :

```json
[
  {
    "id": "task_id_123",
    "title": "RÃ©union client",
    "completed": false,
    "dueDate": "2023-04-15T10:00:00.000Z",
    "priority": 1,
    "energyLevel": 2,
    "project": {
      "id": "project_id_123",
      "name": "Client ABC"
    }
  },
  {
    "id": "task_id_456",
    "title": "PrÃ©parer prÃ©sentation",
    "completed": true,
    "dueDate": "2023-04-15T14:00:00.000Z",
    "priority": 0,
    "energyLevel": 3,
    "project": {
      "id": "project_id_123",
      "name": "Client ABC"
    }
  }
]
```

**Note** : Les tÃ¢ches sont triÃ©es par ordre de prioritÃ© dÃ©croissante et par niveau d'Ã©nergie.

## RÃ©voquer un token

Pour rÃ©voquer un token API :

1. AccÃ©dez Ã  la section ParamÃ¨tres > Tokens API
2. Trouvez le token que vous souhaitez rÃ©voquer
3. Cliquez sur "RÃ©voquer"

Une fois rÃ©voquÃ©, le token ne pourra plus Ãªtre utilisÃ© pour authentifier les requÃªtes.

## Bonnes pratiques de sÃ©curitÃ©

- Ne partagez jamais vos tokens API.
- Accordez uniquement les permissions minimales nÃ©cessaires.
- Utilisez des dates d'expiration pour limiter la durÃ©e de vie des tokens.
- Surveillez rÃ©guliÃ¨rement l'activitÃ© des tokens.
- RÃ©voquez immÃ©diatement les tokens compromis.

## Limites d'utilisation

Pour Ã©viter les abus, les API ont des limites de taux :

- 60 requÃªtes par minute
- 1000 requÃªtes par heure

Si vous dÃ©passez ces limites, vous recevrez une erreur 429 (Too Many Requests). 

## Formats des donnÃ©es

### Format Task

```json
{
  "id": "task_id_123",
  "title": "Titre de la tÃ¢che",
  "description": "Description dÃ©taillÃ©e",
  "completed": false,
  "priority": 4,
  "energyLevel": 0,
  "dueDate": "2023-04-15T12:00:00Z",
  "scheduledFor": "2023-04-15T12:00:00Z",
  "projectId": "project_id_123",
  "processId": "process_id_123",
  "project": {
    "id": "project_id_123",
    "name": "Nom du projet",
    "color": "#4A90E2"
  },
  "process": {
    "id": "process_id_123",
    "name": "Nom du processus",
    "description": "Description du processus"
  }
}
```

### Format Process

```json
{
  "id": "process_id_123",
  "name": "Nom du processus",
  "description": "Description dÃ©taillÃ©e",
  "createdAt": "2023-04-10T10:00:00Z",
  "updatedAt": "2023-04-10T10:00:00Z",
  "userId": "user_id_123",
  "tasks": [
    {
      "id": "task_id_123",
      "title": "Titre de la tÃ¢che"
    }
  ]
}
```

### Format Habit

```json
{
  "id": "habit_id_123",
  "name": "Nom de l'habitude",
  "description": "Description de l'habitude",
  "color": "#F5A623",
  "frequency": "daily",
  "daysOfWeek": ["monday", "wednesday", "friday"],
  "order": 0,
  "createdAt": "2023-04-10T10:00:00Z",
  "updatedAt": "2023-04-10T10:00:00Z",
  "userId": "user_id_123",
  "entries": [
    {
      "id": "entry_id_123",
      "habitId": "habit_id_123",
      "date": "2023-04-15T12:00:00Z",
      "completed": true,
      "note": "Note pour cette habitude",
      "rating": 8,
      "createdAt": "2023-04-15T12:00:00Z",
      "updatedAt": "2023-04-15T12:00:00Z"
    }
  ]
}
```

### Format Habit Entry

```json
{
  "id": "entry_id_123",
  "habitId": "habit_id_123",
  "date": "2023-04-15T12:00:00Z",
  "completed": true,
  "note": "Note pour cette entrÃ©e d'habitude",
  "rating": 8,
  "createdAt": "2023-04-15T12:00:00Z",
  "updatedAt": "2023-04-15T12:00:00Z",
  "habit": {
    "id": "habit_id_123",
    "name": "Nom de l'habitude",
    "color": "#F5A623"
  }
}
```

### Format Habit Stats

```json
{
  "totalHabits": 5,
  "completedHabits": 3,
  "completionRate": 60,
  "dailyStats": [
    {
      "date": "2023-04-15",
      "formattedDate": "15/04",
      "total": 5,
      "completed": 3,
      "completionRate": 60
    }
  ]
}
```

### Exemples de rÃ©ponses

#### RÃ©ponse de `/api/habits/today`

```json
[
  {
    "id": "habit_id_123",
    "name": "Apprentissage",
    "description": "Notez ce que vous avez appris aujourd'hui",
    "color": "#4338CA",
    "completed": true,
    "entryId": "entry_id_123"
  },
  {
    "id": "habit_id_456",
    "name": "Note de sa journÃ©e",
    "description": "Ã‰valuez votre journÃ©e sur 10",
    "color": "#0EA5E9",
    "completed": false,
    "entryId": null
  }
]
```

#### RÃ©ponse de `/api/habits/entries/date`

```json
{
  "date": "2023-04-15T12:00:00.000Z",
  "entries": [
    {
      "id": "entry_id_123",
      "habitId": "habit_id_123",
      "habitName": "Apprentissage",
      "habitColor": "#4338CA",
      "completed": true,
      "note": "J'ai appris les APIs productif.io",
      "rating": 9,
      "date": "2023-04-15T12:00:00.000Z"
    }
  ]
}
```

## ParticularitÃ©s de l'API et bonnes pratiques d'intÃ©gration

### Dates et fuseaux horaires

L'API stocke et renvoie les dates directement dans le fuseau horaire local de l'utilisateur (par dÃ©faut Europe/Paris). Cela signifie que les dates affichÃ©es dans l'interface correspondent exactement aux dates stockÃ©es dans la base de donnÃ©es.

**Exemple concret :**
- Une tÃ¢che crÃ©Ã©e avec `"dueDate": "2025-05-18T00:00:00+02:00"` sera stockÃ©e et affichÃ©e comme Ã©tant due le 18 mai Ã  minuit dans le fuseau horaire Europe/Paris.
- Une tÃ¢che crÃ©Ã©e avec `"dueDate": "2025-05-18T14:00:00+02:00"` sera stockÃ©e et affichÃ©e comme Ã©tant due le 18 mai Ã  14h00 dans le fuseau horaire Europe/Paris.

Le paramÃ¨tre `date` des endpoints de tÃ¢ches utilise Ã©galement le fuseau horaire local de l'utilisateur. Lorsque vous spÃ©cifiez une date (par exemple "2023-04-15"), l'API filtre les tÃ¢ches pour cette date exacte dans le fuseau horaire local.

**Comportement avec le paramÃ¨tre date :**
- Date demandÃ©e: "2023-04-15"
- DÃ©but de la journÃ©e: "2023-04-15T00:00:00+02:00" (heure locale)
- Fin de la journÃ©e: "2023-04-15T23:59:59+02:00" (heure locale)

Pour une intÃ©gration correcte, les agents IA doivent :
1. Utiliser le fuseau horaire local de l'utilisateur (Europe/Paris par dÃ©faut)
2. SpÃ©cifier les dates avec le fuseau horaire appropriÃ© (par exemple "+02:00" pour Europe/Paris)
3. S'assurer que les dates sont au format ISO 8601 avec le fuseau horaire

**Exemple de crÃ©ation de tÃ¢che avec date :**
```json
{
  "title": "RÃ©union importante",
  "dueDate": "2023-04-15T14:00:00+02:00",  // 14h00 heure locale (Europe/Paris)
  "scheduledFor": "2023-04-15T09:00:00+02:00"  // 9h00 heure locale (Europe/Paris)
}
```

### PrioritÃ©s et niveaux d'Ã©nergie

Les champs `priority` et `energyLevel` sont utilisÃ©s pour gÃ©rer l'importance et l'effort requis pour chaque tÃ¢che :

- **PrioritÃ©** : Ã‰chelle de 0-4, oÃ¹ **0 est la prioritÃ© la plus basse** et 4 est la plus urgente
  - 0 : TrÃ¨s basse (affichÃ© comme "Optionnel" dans l'interface)
  - 1 : Basse (affichÃ© comme "Ã€ faire" dans l'interface)
  - 2 : Moyenne (affichÃ© comme "Important" dans l'interface)
  - 3 : Ã‰levÃ©e (affichÃ© comme "Urgent" dans l'interface)
  - 4 : TrÃ¨s Ã©levÃ©e (affichÃ© comme "Quick Win" dans l'interface)

- **Niveau d'Ã©nergie** : Ã‰chelle de 0-3, oÃ¹ **0 est le niveau d'Ã©nergie le plus bas**
  - 0 : Faible (niveau d'Ã©nergie le plus bas)
  - 1 : Moyen
  - 2 : Ã‰levÃ©
  - 3 : ExtrÃªme (niveau d'Ã©nergie le plus Ã©levÃ©)

**Exemples concrets :**
- Une tÃ¢che avec `"priority": 4` dans l'API apparaÃ®tra comme "Quick Win" dans l'interface
- Une tÃ¢che avec `"priority": 3` dans l'API apparaÃ®tra comme "Urgent" dans l'interface
- Une tÃ¢che avec `"energyLevel": 3` dans l'API apparaÃ®tra comme "ExtrÃªme" dans l'interface
