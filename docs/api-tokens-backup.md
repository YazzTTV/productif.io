# Tokens API pour Agents IA

Ce document explique comment utiliser les tokens API pour connecter des agents IA à l'application productif.io.

## Introduction

Les tokens API permettent à des applications tierces et des agents IA d'accéder aux ressources de l'application productif.io au nom d'un utilisateur. Cela facilite l'intégration avec des assistants IA qui peuvent aider à gérer les habitudes, tâches, et autres fonctionnalités.

## Changements récents

### Mise à jour de l'authentification des APIs d'habitudes (Janvier 2024)

**Important**: Toutes les APIs d'habitudes ont été mises à jour pour utiliser l'authentification Bearer token au lieu de l'authentification par session. Cette modification améliore la sécurité et la cohérence avec les autres APIs.

**APIs mises à jour** :
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

**Migration requise** : Si vous utilisiez ces APIs avec l'authentification par session, vous devez maintenant utiliser un token API avec les scopes appropriés (`habits:read` et/ou `habits:write`).

## Obtenir un token API

1. Connectez-vous à votre compte productif.io
2. Accédez à la section Paramètres > Tokens API
3. Cliquez sur "Créer un nouveau token"
4. Donnez un nom descriptif au token (ex: "Assistant IA")
5. Sélectionnez les permissions (scopes) nécessaires
6. Définissez éventuellement une date d'expiration
7. Cliquez sur "Créer"

**Important**: Le token complet ne sera affiché qu'une seule fois à la création. Copiez-le immédiatement et stockez-le de manière sécurisée.

## Scopes disponibles

Les tokens API utilisent un système de permissions (scopes) pour limiter l'accès :

- `habits:read` - Lecture des habitudes
- `habits:write` - Création et mise à jour des habitudes
- `tasks:read` - Lecture des tâches
- `tasks:write` - Création et mise à jour des tâches
- `projects:read` - Lecture des projets
- `projects:write` - Création et mise à jour des projets
- `objectives:read` - Lecture des objectifs OKR
- `objectives:write` - Création et mise à jour des objectifs OKR
- `processes:read` - Lecture des processus
- `processes:write` - Création et mise à jour des processus

## Authentification

**IMPORTANT**: Toutes les APIs d'habitudes utilisent maintenant l'authentification Bearer token. L'authentification par session n'est plus supportée pour les intégrations externes.

Pour authentifier une requête API, incluez le token dans l'en-tête `Authorization` et l'ID utilisateur dans l'en-tête `x-api-user-id` :

```
Authorization: Bearer {votre_token}
x-api-user-id: {votre_user_id}
```

**Note**: L'en-tête `x-api-user-id` est automatiquement ajouté par le middleware d'authentification API lors de la validation du token. Vous n'avez besoin que de fournir l'en-tête `Authorization`.

### Migration depuis l'authentification par session

Si vous utilisiez précédemment des APIs d'habitudes avec l'authentification par session, vous devez maintenant :

1. Créer un token API avec les scopes appropriés (`habits:read` et/ou `habits:write`)
2. Utiliser l'en-tête `Authorization: Bearer {token}` au lieu des cookies de session
3. Toutes les APIs d'habitudes fonctionnent maintenant de manière cohérente avec ce système

## Exemples d'utilisation

### Habitudes

**Toutes les APIs d'habitudes utilisent maintenant l'authentification Bearer token.**

#### 1. Récupérer toutes les habitudes

```bash
curl -X GET "https://productif.io/api/habits" \
  -H "Authorization: Bearer {votre_token}"
```

#### 2. Récupérer les habitudes d'aujourd'hui

```bash
curl -X GET "https://productif.io/api/habits/today" \
  -H "Authorization: Bearer {votre_token}"
```

#### 3. Récupérer les habitudes pour une date spécifique

```bash
curl -X GET "https://productif.io/api/habits/date?date=2023-04-15" \
  -H "Authorization: Bearer {votre_token}"
```

#### 4. Créer une nouvelle habitude

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

#### 5. Mettre à jour l'ordre des habitudes

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

#### 7. Récupérer les habitudes récentes

```bash
curl -X GET "https://productif.io/api/habits/recent" \
  -H "Authorization: Bearer {votre_token}"
```

#### 8. Récupérer l'historique des habitudes

```bash
curl -X GET "https://productif.io/api/habits/history" \
  -H "Authorization: Bearer {votre_token}"
```

#### 9. Récupérer les statistiques des habitudes

```bash
curl -X GET "https://productif.io/api/habits/stats" \
  -H "Authorization: Bearer {votre_token}"
```

#### 10. Récupérer les habitudes les moins suivies

```bash
curl -X GET "https://productif.io/api/habits/least-tracked" \
  -H "Authorization: Bearer {votre_token}"
```

### Entrées d'habitudes

#### 1. Créer ou mettre à jour une entrée d'habitude

```bash
curl -X POST "https://productif.io/api/habits/entries" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "habitId": "habit_id_123",
    "date": "2023-04-15",
    "completed": true,
    "note": "J'ai complété cette habitude",
    "rating": 8
  }'
```

#### 2. Traitement en lot des entrées

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

#### 3. Récupérer toutes les entrées d'habitudes

```bash
curl -X GET "https://productif.io/api/habits/entries/all" \
  -H "Authorization: Bearer {votre_token}"
```

#### 4. Récupérer les entrées sur une période

```bash
curl -X GET "https://productif.io/api/habits/entries/period?startDate=2023-04-01&endDate=2023-04-30" \
  -H "Authorization: Bearer {votre_token}"
```

#### 5. Récupérer les entrées pour une date spécifique

```bash
curl -X GET "https://productif.io/api/habits/entries/date?date=2023-04-15" \
  -H "Authorization: Bearer {votre_token}"
```

#### 6. Créer une entrée pour une date spécifique

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

### Compatibilité avec les anciens endpoints

#### Endpoint agent (toujours disponible pour la rétrocompatibilité)

L'endpoint `/api/habits/agent` reste disponible pour la compatibilité avec les intégrations existantes :

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
    "note": "Complété par l'assistant IA"
  }'
```

**Note**: Il est recommandé d'utiliser les nouveaux endpoints listés ci-dessus pour une meilleure cohérence et plus de fonctionnalités.

### Tâches

#### 1. Créer une nouvelle tâche

```bash
curl -X POST "https://productif.io/api/tasks/agent" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nouvelle tâche créée par l'IA",
    "description": "Cette tâche a été générée automatiquement",
    "scheduledFor": "2023-04-16",
    "priority": 2,
    "energyLevel": 1,
    "dueDate": "2023-04-20"
  }'
```

#### 2. Marquer une tâche comme terminée

```bash
curl -X PATCH "https://productif.io/api/tasks/agent/{task_id}" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true
  }'
```

#### 3. Mettre à jour une tâche avec un processus

```bash
curl -X PATCH "https://productif.io/api/tasks/{task_id}/process" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "processId": "process_id_123"
  }'
```

### Processus

#### 1. Récupérer tous les processus

```bash
curl -X GET "https://productif.io/api/processes" \
  -H "Authorization: Bearer {votre_token}"
```

#### 2. Créer un nouveau processus

```bash
curl -X POST "https://productif.io/api/processes" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Processus de publication d'article",
    "description": "Étapes pour publier un article sur le blog"
  }'
```

#### 3. Mettre à jour un processus

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

#### 4. Récupérer un processus spécifique avec ses tâches

```bash
curl -X GET "https://productif.io/api/processes/{process_id}" \
  -H "Authorization: Bearer {votre_token}"
```

#### 5. Récupérer toutes les tâches d'un processus

```bash
curl -X GET "https://productif.io/api/processes/{process_id}/tasks" \
  -H "Authorization: Bearer {votre_token}"
```

#### 6. Récupérer les statistiques de tous les processus

```bash
curl -X GET "https://productif.io/api/processes/stats" \
  -H "Authorization: Bearer {votre_token}"
```

### Tâches avec date spécifique

Le paramètre `date` vous permet de filtrer les tâches selon une date spécifique. Ce paramètre prend en compte le fuseau horaire de l'utilisateur (par défaut Europe/Paris) et retourne les tâches qui correspondent à l'un des critères suivants :

- Tâches dont la date d'échéance (`dueDate`) tombe le jour spécifié
- Tâches planifiées (`scheduledFor`) pour le jour spécifié
- Tâches complétées le jour spécifié
- Tâches en retard par rapport au jour spécifié
- Tâches créées le jour spécifié sans date d'échéance ni date de planification

#### 1. Récupérer les tâches pour une date spécifique

Cette méthode utilise l'endpoint principal des tâches avec un filtrage par date basique.

```bash
curl -X GET "https://productif.io/api/tasks?date=2023-04-15" \
  -H "Authorization: Bearer {votre_token}"
```

#### 2. Récupérer les tâches détaillées pour une date spécifique

Cette méthode utilise un endpoint dédié avec un traitement plus précis des fuseaux horaires et une logique de filtrage plus avancée.

```bash
curl -X GET "https://productif.io/api/tasks/date?date=2023-04-15" \
  -H "Authorization: Bearer {votre_token}"
```

#### 3. Récupérer les tâches pour une date spécifique via un agent IA

Cette méthode utilise un endpoint dédié aux agents IA qui permet d'accéder aux tâches d'une date spécifique avec l'authentification API.

```bash
curl -X GET "https://productif.io/api/tasks/agent/date?date=2023-04-15" \
  -H "Authorization: Bearer {votre_token}"
```

**Format de date** : Le paramètre date doit être au format YYYY-MM-DD (ISO 8601).

**Exemple de réponse** :

```json
[
  {
    "id": "task_id_123",
    "title": "Réunion client",
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
    "title": "Préparer présentation",
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

**Note** : Les tâches sont triées par ordre de priorité décroissante et par niveau d'énergie.

## Révoquer un token

Pour révoquer un token API :

1. Accédez à la section Paramètres > Tokens API
2. Trouvez le token que vous souhaitez révoquer
3. Cliquez sur "Révoquer"

Une fois révoqué, le token ne pourra plus être utilisé pour authentifier les requêtes.

## Bonnes pratiques de sécurité

- Ne partagez jamais vos tokens API.
- Accordez uniquement les permissions minimales nécessaires.
- Utilisez des dates d'expiration pour limiter la durée de vie des tokens.
- Surveillez régulièrement l'activité des tokens.
- Révoquez immédiatement les tokens compromis.

## Limites d'utilisation

Pour éviter les abus, les API ont des limites de taux :

- 60 requêtes par minute
- 1000 requêtes par heure

Si vous dépassez ces limites, vous recevrez une erreur 429 (Too Many Requests). 

## Formats des données

### Format Task

```json
{
  "id": "task_id_123",
  "title": "Titre de la tâche",
  "description": "Description détaillée",
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
  "description": "Description détaillée",
  "createdAt": "2023-04-10T10:00:00Z",
  "updatedAt": "2023-04-10T10:00:00Z",
  "userId": "user_id_123",
  "tasks": [
    {
      "id": "task_id_123",
      "title": "Titre de la tâche"
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
  "note": "Note pour cette entrée d'habitude",
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

### Exemples de réponses

#### Réponse de `/api/habits/today`

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
    "name": "Note de sa journée",
    "description": "Évaluez votre journée sur 10",
    "color": "#0EA5E9",
    "completed": false,
    "entryId": null
  }
]
```

#### Réponse de `/api/habits/entries/date`

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

## Particularités de l'API et bonnes pratiques d'intégration

### Dates et fuseaux horaires

L'API stocke et renvoie les dates directement dans le fuseau horaire local de l'utilisateur (par défaut Europe/Paris). Cela signifie que les dates affichées dans l'interface correspondent exactement aux dates stockées dans la base de données.

**Exemple concret :**
- Une tâche créée avec `"dueDate": "2025-05-18T00:00:00+02:00"` sera stockée et affichée comme étant due le 18 mai à minuit dans le fuseau horaire Europe/Paris.
- Une tâche créée avec `"dueDate": "2025-05-18T14:00:00+02:00"` sera stockée et affichée comme étant due le 18 mai à 14h00 dans le fuseau horaire Europe/Paris.

Le paramètre `date` des endpoints de tâches utilise également le fuseau horaire local de l'utilisateur. Lorsque vous spécifiez une date (par exemple "2023-04-15"), l'API filtre les tâches pour cette date exacte dans le fuseau horaire local.

**Comportement avec le paramètre date :**
- Date demandée: "2023-04-15"
- Début de la journée: "2023-04-15T00:00:00+02:00" (heure locale)
- Fin de la journée: "2023-04-15T23:59:59+02:00" (heure locale)

Pour une intégration correcte, les agents IA doivent :
1. Utiliser le fuseau horaire local de l'utilisateur (Europe/Paris par défaut)
2. Spécifier les dates avec le fuseau horaire approprié (par exemple "+02:00" pour Europe/Paris)
3. S'assurer que les dates sont au format ISO 8601 avec le fuseau horaire

**Exemple de création de tâche avec date :**
```json
{
  "title": "Réunion importante",
  "dueDate": "2023-04-15T14:00:00+02:00",  // 14h00 heure locale (Europe/Paris)
  "scheduledFor": "2023-04-15T09:00:00+02:00"  // 9h00 heure locale (Europe/Paris)
}
```

### Priorités et niveaux d'énergie

Les champs `priority` et `energyLevel` sont utilisés pour gérer l'importance et l'effort requis pour chaque tâche :

- **Priorité** : Échelle de 0-4, où **0 est la priorité la plus basse** et 4 est la plus urgente
  - 0 : Très basse (affiché comme "Optionnel" dans l'interface)
  - 1 : Basse (affiché comme "À faire" dans l'interface)
  - 2 : Moyenne (affiché comme "Important" dans l'interface)
  - 3 : Élevée (affiché comme "Urgent" dans l'interface)
  - 4 : Très élevée (affiché comme "Quick Win" dans l'interface)

- **Niveau d'énergie** : Échelle de 0-3, où **0 est le niveau d'énergie le plus bas**
  - 0 : Faible (niveau d'énergie le plus bas)
  - 1 : Moyen
  - 2 : Élevé
  - 3 : Extrême (niveau d'énergie le plus élevé)

**Exemples concrets :**
- Une tâche avec `"priority": 4` dans l'API apparaîtra comme "Quick Win" dans l'interface
- Une tâche avec `"priority": 3` dans l'API apparaîtra comme "Urgent" dans l'interface
- Une tâche avec `"energyLevel": 3` dans l'API apparaîtra comme "Extrême" dans l'interface

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