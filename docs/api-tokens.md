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

## Endpoints compatibles avec les tokens API

### ✅ Endpoints recommandés pour les agents IA

- `/api/habits/agent` - Gestion des habitudes (GET/POST)
- `/api/tasks/agent` - Gestion des tâches
- `/api/test-token` - Test de votre token API

### ❌ Endpoints NON compatibles avec les tokens API

- `/api/habits/date` - Utilise l'authentification par cookies uniquement
- `/api/habits/today` - Utilise l'authentification par cookies uniquement
- Tous les autres endpoints `/habits/*` sauf `/habits/agent`

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

#### 2. Marquer une habitude comme complétée

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

#### 3. Test de votre token API

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