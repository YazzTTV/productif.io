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

**⚠️ Important pour l'authentification** :
- Utilisez UNIQUEMENT les endpoints `/agent` pour les requêtes avec tokens API
- Les endpoints standards (comme `/habits/date`) utilisent l'authentification par cookies et ne fonctionnent PAS avec les tokens API
- Assurez-vous que votre token a les scopes appropriés pour l'action demandée

## Exemples d'utilisation

### Habitudes

#### 1. Récupérer toutes les habitudes avec historique (RECOMMANDÉ)

**Endpoint** : `/api/habits/agent`
**Méthode** : GET
**Authentification** : Token API avec scope `habits:read`

```bash
curl -X GET "https://productif.io/api/habits/agent" \
  -H "Authorization: Bearer {votre_token}"
```

**Réponse** :
```json
[
  {
    "id": "habit_id",
    "name": "Apprentissage",
    "description": "Notez ce que vous avez appris aujourd'hui",
    "color": "#4338CA",
    "frequency": "daily",
    "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    "order": 0,
    "userId": "user_id",
    "createdAt": "2025-05-01T10:00:00.000Z",
    "updatedAt": "2025-05-26T15:30:00.000Z",
    "entries": [
      {
        "id": "entry_id",
        "habitId": "habit_id",
        "date": "2025-05-26T12:00:00.000Z",
        "completed": true,
        "note": "Appris les APIs REST",
        "rating": 8,
        "createdAt": "2025-05-26T18:00:00.000Z",
        "updatedAt": "2025-05-26T18:00:00.000Z"
      }
      // ... jusqu'à 7 dernières entrées
    ]
  }
]
```

**Caractéristiques** :
- Retourne TOUTES les habitudes de l'utilisateur
- Inclut les 7 dernières entrées pour chaque habitude (optimisé pour un usage quotidien)
- Entrées triées par date décroissante (plus récente en premier)
- Compatible avec l'authentification par token API

#### 2. Créer une nouvelle habitude

**Endpoint** : `/api/webhooks/habits`
**Méthode** : POST
**Authentification** : Token API avec scope `habits:write`

```bash
curl -X POST "https://productif.io/api/webhooks/habits" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create_habit",
    "data": {
      "name": "Ma nouvelle habitude",
      "description": "Description de l'habitude",
      "frequency": "daily",
      "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday"],
      "userId": "user_id_here",
      "color": "#4338CA"
    }
  }'
```

**Paramètres requis** :
- `action` : "create_habit"
- `data.name` : Nom de l'habitude
- `data.frequency` : "daily" ou "weekly"
- `data.userId` : ID de l'utilisateur

**Paramètres optionnels** :
- `data.description` : Description de l'habitude
- `data.daysOfWeek` : Array des jours (par défaut : tous les jours)
- `data.color` : Couleur en hexadécimal

**Réponse** :
```json
{
  "success": true,
  "habit": {
    "id": "new_habit_id",
    "name": "Ma nouvelle habitude",
    "description": "Description de l'habitude",
    "frequency": "daily",
    "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "color": "#4338CA",
    "userId": "user_id_here",
    "createdAt": "2025-05-26T20:00:00.000Z",
    "updatedAt": "2025-05-26T20:00:00.000Z"
  }
}
```

#### 3. Marquer une habitude comme complétée

**Endpoint** : `/api/habits/agent`
**Méthode** : POST
**Authentification** : Token API avec scope `habits:write`

```bash
curl -X POST "https://productif.io/api/habits/agent" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "habitId": "habit_id_here",
    "date": "2025-05-26",
    "completed": true,
    "note": "Appris les APIs productif.io aujourd'hui",
    "rating": 8
  }'
```

**Paramètres** :
- `habitId` (requis) : ID de l'habitude
- `date` (requis) : Date au format YYYY-MM-DD
- `completed` (optionnel) : true/false, défaut true
- `note` (optionnel) : Note textuelle
- `rating` (optionnel) : Note de 0 à 10

#### 4. Test de votre token API

```bash
curl -X GET "https://productif.io/api/test-token" \
  -H "Authorization: Bearer {votre_token}"
```

### Habitudes spéciales

#### Habitude "Apprentissage"
L'habitude "Apprentissage" est une habitude par défaut créée automatiquement pour chaque utilisateur :

- **Nom** : "Apprentissage"
- **Description** : "Notez ce que vous avez appris aujourd'hui"
- **Couleur** : `#4338CA` (Indigo)
- **Fréquence** : Quotidienne (tous les jours)
- **Ordre** : 0 (toujours en première position)
- **Protection** : Ne peut pas être supprimée
- **Champs spéciaux** : Supporte les notes et ratings

#### Habitude "Note de sa journée"
- **Nom** : "Note de sa journée"
- **Description** : "Évaluez votre journée sur 10 et expliquez pourquoi"
- **Couleur** : `#0EA5E9` (Sky)
- **Ordre** : 1 (deuxième position)
- **Protection** : Ne peut pas être supprimée

### Tâches

#### 1. Créer une nouvelle tâche

```bash
curl -X POST "https://productif.io/api/tasks/agent" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nouvelle tâche créée par l'IA",
    "description": "Cette tâche a été générée automatiquement",
    "scheduledFor": "2025-05-26",
    "priority": 2,
    "energyLevel": 1,
    "dueDate": "2025-05-30"
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

### Processus

#### 1. Récupérer tous les processus

```bash
curl -X GET "https://productif.io/api/processes/agent" \
  -H "Authorization: Bearer {votre_token}"
```

**Paramètres optionnels** :
- `?includeStats=true` - Inclure les statistiques (nombre de tâches, pourcentage d'achèvement)
- `?includeTasks=true` - Inclure toutes les tâches associées à chaque processus

**Exemple avec statistiques** :
```bash
curl -X GET "https://productif.io/api/processes/agent?includeStats=true" \
  -H "Authorization: Bearer {votre_token}"
```

#### 2. Créer un nouveau processus

```bash
curl -X POST "https://productif.io/api/processes/agent" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Processus de publication d'article",
    "description": "Étapes pour publier un article sur le blog"
  }'
```

#### 3. Mettre à jour un processus

```bash
curl -X PATCH "https://productif.io/api/processes/agent" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "process_id_123",
    "name": "Nouveau nom du processus",
    "description": "Nouvelle description"
  }'
```

#### 4. Supprimer un processus

```bash
curl -X DELETE "https://productif.io/api/processes/agent" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "process_id_123"
  }'
```

#### 5. Assigner un processus à une tâche

```bash
curl -X PATCH "https://productif.io/api/tasks/agent/{task_id}/process" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "processId": "process_id_123"
  }'
```

#### 6. Retirer un processus d'une tâche

```bash
curl -X PATCH "https://productif.io/api/tasks/agent/{task_id}/process" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "processId": null
  }'
```

#### 7. Récupérer le processus assigné à une tâche

```bash
curl -X GET "https://productif.io/api/tasks/agent/{task_id}/process" \
  -H "Authorization: Bearer {votre_token}"
```

### Objectifs (OKR)

#### 1. Récupérer toutes les missions et objectifs

```bash
curl -X GET "https://productif.io/api/objectives/agent" \
  -H "Authorization: Bearer {votre_token}"
```

**Paramètres optionnels** :
- `?current=true` - Récupérer uniquement la mission du trimestre actuel
- `?quarter=1&year=2024` - Filtrer par trimestre et année spécifiques

**Exemple pour le trimestre actuel** :
```bash
curl -X GET "https://productif.io/api/objectives/agent?current=true" \
  -H "Authorization: Bearer {votre_token}"
```

#### 2. Créer une nouvelle mission

```bash
curl -X POST "https://productif.io/api/objectives/agent" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "mission",
    "title": "Développer l'activité commerciale",
    "quarter": 1,
    "year": 2024,
    "target": 100
  }'
```

#### 3. Créer un nouvel objectif

```bash
curl -X POST "https://productif.io/api/objectives/agent" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "objective",
    "title": "Augmenter le nombre de prospects",
    "missionId": "mission_id_123",
    "target": 100
  }'
```

#### 4. Créer une nouvelle action

```bash
curl -X POST "https://productif.io/api/objectives/agent" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "action",
    "title": "Prospecter des entreprises",
    "objectiveId": "objective_id_123",
    "target": 50,
    "current": 0
  }'
```

#### 5. Mettre à jour la progression d'une action (Mode incrémental)

**Exemple : "Aujourd'hui j'ai prospecté 1 personne"**

```bash
curl -X PATCH "https://productif.io/api/objectives/agent/actions/{action_id}/progress" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "increment": 1,
    "note": "Prospecté 1 nouvelle entreprise aujourd'hui"
  }'
```

#### 6. Définir une valeur absolue pour une action

```bash
curl -X PATCH "https://productif.io/api/objectives/agent/actions/{action_id}/progress" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "setValue": 25
  }'
```

#### 7. Récupérer les détails d'une action

```bash
curl -X GET "https://productif.io/api/objectives/agent/actions/{action_id}/progress" \
  -H "Authorization: Bearer {votre_token}"
```

#### 8. Mettre à jour la progression via l'endpoint principal

```bash
curl -X PATCH "https://productif.io/api/objectives/agent" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "actionId": "action_id_123",
    "increment": 5
  }'
```

### Cas d'usage typique pour les OKR

**Scénario** : Vous avez un objectif "Prospecter 50 personnes" et chaque jour vous voulez incrémenter votre progression.

1. **Créer la structure OKR** :
```bash
# 1. Créer une mission pour Q1 2024
curl -X POST "https://productif.io/api/objectives/agent" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "mission",
    "title": "Développer l'activité commerciale Q1",
    "quarter": 1,
    "year": 2024
  }'

# 2. Créer un objectif
curl -X POST "https://productif.io/api/objectives/agent" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "objective",
    "title": "Augmenter la prospection",
    "missionId": "mission_id_from_step_1"
  }'

# 3. Créer une action mesurable
curl -X POST "https://productif.io/api/objectives/agent" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "action",
    "title": "Prospecter des entreprises",
    "objectiveId": "objective_id_from_step_2",
    "target": 50,
    "current": 0
  }'
```

2. **Incrémenter quotidiennement** :
```bash
# Chaque jour, ajouter votre progression
curl -X PATCH "https://productif.io/api/objectives/agent/actions/{action_id}/progress" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "increment": 3,
    "note": "Prospecté 3 entreprises aujourd'hui"
  }'
```

**Réponse typique** :
```json
{
  "success": true,
  "action": {
    "id": "action_id",
    "title": "Prospecter des entreprises",
    "current": 15,
    "target": 50,
    "progress": 30,
    "objective": {
      "id": "objective_id",
      "title": "Augmenter la prospection",
      "progress": 30
    },
    "mission": {
      "id": "mission_id",
      "title": "Développer l'activité commerciale Q1",
      "quarter": 1,
      "year": 2024
    }
  },
  "message": "Progression mise à jour: 15/50 (30.0%)",
  "previousValue": 12,
  "newValue": 15,
  "change": 3,
  "completed": false,
  "note": "Prospecté 3 entreprises aujourd'hui"
}
```

## Endpoints utilitaires pour le développement

### Récupération des IDs

Pour faciliter le développement et les tests, trois endpoints spéciaux permettent de récupérer facilement tous les IDs nécessaires aux requêtes API :

#### 1. Tous les IDs avec détails complets

**Endpoint** : `/api/debug/ids`
**Méthode** : GET
**Authentification** : Token API avec scopes appropriés

```bash
curl -X GET "https://productif.io/api/debug/ids" \
  -H "Authorization: Bearer {votre_token}"
```

**Réponse** :
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "quickIds": {
    "userId": "user_id",
    "taskId": "task_id_123",
    "habitId": "habit_id_456",
    "projectId": "project_id_789",
    "missionId": "mission_id_abc",
    "objectiveId": "objective_id_def",
    "actionId": "action_id_ghi"
  },
  "tasks": {
    "count": 15,
    "completed": 8,
    "incomplete": 7,
    "ids": ["task_1", "task_2", "..."],
    "items": [
      {
        "id": "task_1",
        "title": "Ma tâche",
        "completed": false,
        "priority": "medium"
      }
    ]
  },
  "habits": {
    "count": 5,
    "ids": ["habit_1", "habit_2", "..."],
    "items": [...]
  },
  "projects": {
    "count": 3,
    "ids": ["project_1", "project_2", "..."],
    "items": [...]
  },
  "gamification": {
    "totalPoints": 1250,
    "level": 5,
    "currentStreak": 7,
    "longestStreak": 15
  }
}
```

#### 2. IDs rapides pour tests

**Endpoint** : `/api/debug/quick-ids`
**Méthode** : GET
**Authentification** : Token API

```bash
curl -X GET "https://productif.io/api/debug/quick-ids" \
  -H "Authorization: Bearer {votre_token}"
```

**Réponse** :
```json
{
  "quickIds": {
    "userId": "user_id",
    "taskId": "task_id_123",
    "habitId": "habit_id_456",
    "projectId": "project_id_789",
    "missionId": "mission_id_abc",
    "objectiveId": "objective_id_def",
    "actionId": "action_id_ghi"
  },
  "entities": {
    "task": {
      "id": "task_id_123",
      "title": "Ma première tâche",
      "completed": false
    },
    "habit": {
      "id": "habit_id_456",
      "name": "Apprentissage",
      "frequency": "daily"
    }
  },
  "examples": {
    "completeTask": "PATCH /api/tasks/agent/task_id_123",
    "markHabit": "POST /api/habits/agent",
    "updateAction": "PATCH /api/objectives/agent/actions/action_id_ghi/progress"
  }
}
```

#### 3. IDs par type spécifique

**Endpoint** : `/api/debug/ids/[type]`
**Méthode** : GET
**Authentification** : Token API

**Types disponibles** :
- `tasks` - Tâches
- `habits` - Habitudes
- `habit-entries` - Entrées d'habitudes
- `projects` - Projets
- `missions` - Missions OKR
- `objectives` - Objectifs OKR
- `actions` - Actions OKR
- `processes` - Processus
- `time-entries` - Entrées de temps
- `achievements` - Réalisations
- `user-achievements` - Réalisations utilisateur

```bash
# Récupérer seulement les IDs des tâches
curl -X GET "https://productif.io/api/debug/ids/tasks" \
  -H "Authorization: Bearer {votre_token}"

# Récupérer seulement les IDs des habitudes
curl -X GET "https://productif.io/api/debug/ids/habits" \
  -H "Authorization: Bearer {votre_token}"

# Récupérer seulement les IDs des actions OKR
curl -X GET "https://productif.io/api/debug/ids/actions" \
  -H "Authorization: Bearer {votre_token}"
```

**Réponse exemple pour `/api/debug/ids/tasks`** :
```json
{
  "type": "tasks",
  "stats": {
    "total": 15,
    "completed": 8,
    "incomplete": 7
  },
  "ids": [
    "task_id_1",
    "task_id_2",
    "task_id_3"
  ],
  "items": [
    {
      "id": "task_id_1",
      "title": "Finaliser le rapport",
      "completed": false,
      "priority": "high",
      "createdAt": "2025-05-26T10:00:00Z"
    },
    {
      "id": "task_id_2",
      "title": "Réunion équipe",
      "completed": true,
      "priority": "medium",
      "completedAt": "2025-05-26T14:30:00Z"
    }
  ]
}
```

### Cas d'usage des endpoints d'IDs

#### Workflow de développement rapide

1. **Récupérer les IDs rapides** :
```bash
curl -X GET "https://productif.io/api/debug/quick-ids" \
  -H "Authorization: Bearer {votre_token}"
```

2. **Utiliser les IDs dans vos requêtes** :
```bash
# Marquer une tâche comme terminée
curl -X PATCH "https://productif.io/api/tasks/agent/{taskId}" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Marquer une habitude
curl -X POST "https://productif.io/api/habits/agent" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "habitId": "{habitId}",
    "date": "2025-05-27",
    "completed": true,
    "note": "Test via API"
  }'

# Incrémenter une action OKR
curl -X PATCH "https://productif.io/api/objectives/agent/actions/{actionId}/progress" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "increment": 1,
    "note": "Progression via API"
  }'
```

#### Tests automatisés

Ces endpoints sont particulièrement utiles pour :
- **Tests d'intégration** : Récupérer des IDs valides pour vos tests
- **Scripts de développement** : Automatiser les tests d'API
- **Débuggage** : Vérifier les données disponibles
- **Documentation** : Générer des exemples avec de vraies données

**⚠️ Note importante** : Ces endpoints sont destinés au développement et aux tests. En production, utilisez les endpoints standards avec authentification appropriée.

## Résolution des problèmes

### Erreur 401 "Non authentifié"

**Causes possibles** :
1. **Mauvais endpoint** : Vous utilisez un endpoint non compatible avec les tokens API
   - ❌ `/api/habits/date` 
   - ✅ `/api/habits/agent`

2. **Format d'en-tête incorrect** :
   - ❌ `Authorization: {votre_token}`
   - ❌ `Authorization: bearer {votre_token}`
   - ✅ `Authorization: Bearer {votre_token}`

3. **Token expiré ou invalide** : Vérifiez votre token dans les paramètres

4. **Scopes insuffisants** : Assurez-vous que votre token a les permissions nécessaires

### Erreur 403 "Permissions insuffisantes"

Votre token n'a pas les scopes requis pour cette action. Vérifiez les scopes de votre token :
- Lecture : `habits:read`, `tasks:read`, etc.
- Écriture : `habits:write`, `tasks:write`, etc.

### Test de connectivité

Utilisez l'endpoint de test pour vérifier votre configuration :

```bash
curl -X GET "https://productif.io/api/test-token" \
  -H "Authorization: Bearer {votre_token}"
```

## Bonnes pratiques

1. **Utilisez les endpoints `/agent`** pour toutes vos intégrations d'IA
2. **Stockez vos tokens de manière sécurisée** et ne les partagez jamais
3. **Définissez des dates d'expiration** appropriées pour vos tokens
4. **Utilisez des scopes minimaux** nécessaires pour votre cas d'usage
5. **Testez vos intégrations** avec l'endpoint `/test-token`
6. **Gérez les erreurs** appropriément dans votre code

## Changelog

### Version 2025-05-27
- ✅ **Nouveaux endpoints utilitaires** : Ajout de 3 endpoints pour récupérer facilement tous les IDs
  - `/api/debug/ids` - Tous les IDs avec détails complets
  - `/api/debug/quick-ids` - IDs rapides pour tests
  - `/api/debug/ids/[type]` - IDs par type spécifique
- ✅ **Documentation des endpoints d'IDs** : Guide complet d'utilisation avec exemples
- ✅ **Workflow de développement** : Documentation des cas d'usage pour tests et développement

### Version 2025-05-26
- ✅ Optimisation de l'API `/habits/agent` : limitation à 7 dernières entrées au lieu de 30
- ✅ Clarification de la compatibilité des endpoints avec les tokens API
- ✅ Ajout de la documentation des habitudes spéciales
- ✅ Amélioration de la section de résolution des problèmes
- ✅ Ajout d'exemples de réponses détaillés

### Version précédente
- Création de la documentation initiale
- Définition des scopes et de l'authentification
- Exemples de base pour les habitudes et tâches 