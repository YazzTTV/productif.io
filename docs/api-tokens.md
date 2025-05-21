# Tokens API pour Agents IA

Ce document explique comment utiliser les tokens API pour connecter des agents IA à l'application productif.io.

## Introduction

Les tokens API permettent à des applications tierces et des agents IA d'accéder aux ressources de l'application productif.io au nom d'un utilisateur. Cela facilite l'intégration avec des assistants IA qui peuvent aider à gérer les habitudes, tâches, et autres fonctionnalités.

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

Pour authentifier une requête API, incluez le token dans l'en-tête `Authorization` :

```
Authorization: Bearer {votre_token}
```

## Exemples d'utilisation

### Habitudes

#### 1. Récupérer les habitudes

```bash
curl -X GET "https://productif.io/api/habits/agent" \
  -H "Authorization: Bearer {votre_token}"
```

#### 2. Marquer une habitude comme complétée

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

#### 3. Récupérer les habitudes pour une date spécifique

```bash
curl -X GET "https://productif.io/api/habits/date?date=2023-04-15" \
  -H "Authorization: Bearer {votre_token}"
```

#### 4. Enregistrer plusieurs habitudes pour une date

```bash
curl -X POST "https://productif.io/api/habits/date" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2023-04-15",
    "habits": [
      {
        "id": "clg123abc",
        "completed": true,
        "note": "J'ai appris à utiliser les API productif.io",
        "rating": 8
      },
      {
        "id": "clg456def",
        "completed": true,
        "note": "Belle journée productive",
        "rating": 9
      }
    ]
  }'
```

#### 5. Enregistrer une entrée d'habitude individuelle

```bash
curl -X POST "https://productif.io/api/habits/entries/date" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "habitId": "clg123abc",
    "date": "2023-04-15",
    "completed": true,
    "note": "J'ai fait cette habitude",
    "rating": 8
  }'
```

#### 6. Récupérer les entrées d'habitudes sur une période

```bash
curl -X GET "https://productif.io/api/habits/entries/period?startDate=2023-04-01&endDate=2023-04-30" \
  -H "Authorization: Bearer {votre_token}"
```

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

- **Niveau d'énergie** : Échelle de 0-3, où **0 est le niveau d'énergie le plus élevé**
  - 0 : Extrême (niveau d'énergie le plus élevé)
  - 1 : Élevé
  - 2 : Moyen
  - 3 : Faible (niveau d'énergie le plus bas)

**Exemples concrets :**
- Une tâche avec `"priority": 4` dans l'API apparaîtra comme "Quick Win" dans l'interface
- Une tâche avec `"priority": 3` dans l'API apparaîtra comme "Urgent" dans l'interface
- Une tâche avec `"energyLevel": 0` dans l'API apparaîtra comme "Extrême" dans l'interface

### Format Habit

```json
{
  "id": "habit_id_123",
  "name": "Nom de l'habitude",
  "description": "Description de l'habitude",
  "color": "#F5A623",
  "frequency": "daily",
  "daysOfWeek": ["monday", "wednesday", "friday"],
  "entry": {
    "id": "entry_id_123",
    "date": "2023-04-15T12:00:00Z",
    "completed": true,
    "note": "Note pour cette habitude",
    "rating": 8
  }
}
``` 