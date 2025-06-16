# 🤖 Documentation API pour Agents IA - productif.io

Cette documentation est spécialement conçue pour les agents IA qui doivent interagir avec l'API productif.io pour envoyer des rappels, récupérer des données et gérer les habitudes/tâches des utilisateurs.

---

## 🔐 SECTION 1 : AUTHENTIFICATION

### Obtenir un Token API
1. L'utilisateur se connecte à productif.io
2. Va dans Paramètres > Tokens API 
3. Crée un nouveau token avec les scopes nécessaires
4. Copie le token (affiché une seule fois)

### ⚡ Caractéristiques des Tokens API

**✅ Durée de validité** (Depuis décembre 2025)
- Quand vous **laissez le champ "Date d'expiration" vide** lors de la création : le token est **permanent**
- Quand vous **spécifiez une date d'expiration** : le token expire à cette date exacte

**🔧 Fonctionnalités**
- Tokens immédiatement fonctionnels après création
- Stockés de manière sécurisée dans la base de données
- Traçabilité complète de l'utilisation

### Utiliser le Token
**En-tête obligatoire pour chaque requête** :
```
Authorization: Bearer {votre_token_api}
```

### Scopes Disponibles
- `habits:read` - Lire les habitudes
- `habits:write` - Créer/modifier les habitudes
- `tasks:read` - Lire les tâches  
- `tasks:write` - Créer/modifier les tâches
- `projects:read` - Lire les projets
- `projects:write` - Créer/modifier les projets
- `objectives:read` - Lire les objectifs OKR
- `objectives:write` - Créer/modifier les objectifs OKR
- `processes:read` - Lire les processus
- `processes:write` - Créer/modifier les processus

### ⚠️ Important pour l'authentification
- **Structure d'URL correcte** : `/api/<resource>/agent` (exemple: `/api/tasks/agent`)
- Utilisez UNIQUEMENT les endpoints contenant `/agent` pour les requêtes avec tokens API
- Les endpoints standards ne fonctionnent pas avec les tokens API
- Assurez-vous que votre token a les scopes appropriés pour l'action demandée

### 📋 Structure des Endpoints Agent
**Pattern correct** : `/api/<resource>/agent[/action]`

**Exemples valides** :
- ✅ `/api/tasks/agent` - Liste toutes les tâches
- ✅ `/api/tasks/agent/date?date=YYYY-MM-DD` - Tâches d'une date
- ✅ `/api/habits/agent` - Liste/marquer habitudes
- ✅ `/api/objectives/agent` - Gestion des objectifs
- ✅ `/api/processes/agent` - Gestion des processus

**Exemples incorrects** :
- ❌ `/api/agent/tasks/today` (n'existe pas)
- ❌ `/api/agent/habits` (n'existe pas)

---

## 📊 SECTION 2 : RÉCUPÉRER LES IDS

### 2.1 - Endpoint : IDs par Type

**URL** : `/api/debug/ids/[type]`
**Méthode** : GET
**Usage** : Pour récupérer les IDs d'un type spécifique

**Types disponibles** :
- `user-team` : Récupère les IDs utilisateur et entreprise
- `tasks` : Récupère tous les IDs des tâches
- `habits` : Récupère tous les IDs des habitudes
- `projects` : Récupère tous les IDs des projets
- `missions` : Récupère tous les IDs des missions
- `objectives` : Récupère tous les IDs des objectifs
- `processes` : Récupère tous les IDs des processus

**Exemple de réponse pour `/api/debug/ids/user-team`** :
```json
{
  "user": {
    "id": "cm8vqf9xk0001a6kh6y7z8w9x",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER"
  },
  "company": {
    "id": "company_xyz",
    "name": "Ma Société",
    "role": "MEMBER"
  },
  "meta": {
    "timestamp": "2025-06-09T16:15:45.081Z"
  }
}
```

### 2.2 - Exemples d'utilisation des IDs

#### 1. Récupérer les IDs nécessaires
```bash
# Focus sur les tâches
curl -X GET "/api/debug/ids/tasks" -H "Authorization: Bearer {token}"

# Focus sur les habitudes  
curl -X GET "/api/debug/ids/habits" -H "Authorization: Bearer {token}"
```

#### 2. Utilisation des IDs récupérés
```bash
# Utiliser l'ID utilisateur et les IDs d'entités
userId="user_123"                      # De l'endpoint user-team
companyId="company_1"                  # De l'endpoint user-team
taskId="task_id_123"                   # De l'endpoint tasks
habitId="habit_id_456"                 # De l'endpoint habits

# Marquer une tâche comme terminée
curl -X PATCH "/api/tasks/agent/$taskId" \
  -H "Authorization: Bearer {token}" \
  -d '{"completed": true}'

# Marquer une habitude
curl -X POST "/api/habits/agent" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "habitId": "'$habitId'",
    "date": "2025-06-09",
    "completed": true,
    "note": "Test via API"
  }'
```

---

## 📋 SECTION 3 : GESTION DES TÂCHES

### 3.1 - Récupérer les Tâches d'une Date Spécifique

**URL** : `/api/tasks/agent/date`
**Méthode** : GET
**Authentification** : Token API avec scope `tasks:read`
**Usage** : Pour récupérer les tâches d'une date précise (aujourd'hui ou n'importe quelle date)

**Paramètres requis** :
- `date` : Date au format YYYY-MM-DD

**Exemples d'utilisation** :

```bash
# Tâches d'aujourd'hui (remplacez par la date actuelle)
curl -X GET "https://productif.io/api/tasks/agent/date?date=2025-01-15" \
  -H "Authorization: Bearer {votre_token}"

# Tâches d'une date spécifique
curl -X GET "https://productif.io/api/tasks/agent/date?date=2025-01-20" \
  -H "Authorization: Bearer {votre_token}"
```

**Réponse** :
```json
[
  {
    "id": "task_123",
    "title": "Finir le rapport",
    "completed": false,
    "dueDate": "2025-01-15T00:00:00.000Z",
    "scheduledFor": "2025-01-15T09:00:00.000Z",
    "priority": 3,
    "energyLevel": 2,
    "project": {
      "id": "project_456", 
      "name": "Projet Alpha",
      "color": "#3B82F6"
    },
    "createdAt": "2025-01-10T10:00:00.000Z",
    "updatedAt": "2025-01-14T15:30:00.000Z"
  }
]
```

### 3.2 - Créer une Nouvelle Tâche

**URL** : `/api/tasks/agent`
**Méthode** : POST
**Authentification** : Token API avec scope `tasks:write`

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

### 3.3 - Niveaux de Priorité et d'Énergie

#### Niveaux de Priorité
**Échelle : 0 à 4** (Plus la valeur est élevée, plus la priorité est importante)

| Valeur | Libellé    | Description                               | Affichage Interface |
|--------|------------|-------------------------------------------|-------------------|
| 0      | Optionnel  | Tâches qui peuvent être reportées        | P0 - Optionnel    |
| 1      | À faire    | Tâches importantes mais pas urgentes      | P1 - À faire      |
| 2      | Important  | Tâches qui méritent de l'attention        | P2 - Important    |
| 3      | Urgent     | Tâches qui requièrent une action rapide   | P3 - Urgent       |
| 4      | Quick Win  | Priorité maximale, gains rapides          | P4 - Quick Win    |

#### Niveaux d'Énergie
**Échelle : 0 à 3** (Plus la valeur est élevée, plus l'énergie requise est importante)

| Valeur | Libellé  | Description                               |
|--------|----------|-------------------------------------------|
| 0      | Faible   | Tâches simples, peu d'effort mental       |
| 1      | Moyen    | Tâches de complexité moyenne              |
| 2      | Élevé    | Tâches complexes, besoin de concentration |
| 3      | Extrême  | Tâches très exigeantes mentalement        |

#### Exemples Pratiques
```json
{
  "title": "Répondre aux emails",
  "priority": 1,     // P1 - À faire
  "energyLevel": 0   // Faible effort
}

{
  "title": "Présentation importante client",
  "priority": 4,     // P4 - Quick Win
  "energyLevel": 3   // Effort extrême
}

{
  "title": "Mise à jour documentation",
  "priority": 2,     // P2 - Important  
  "energyLevel": 2   // Effort élevé
}
```

### 3.4 - Marquer une Tâche comme Terminée

**URL** : `/api/tasks/agent/{task_id}`
**Méthode** : PATCH
**Authentification** : Token API avec scope `tasks:write`

```bash
curl -X PATCH "https://productif.io/api/tasks/agent/{task_id}" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true
  }'
```

---

## 🎯 SECTION 4 : GESTION DES HABITUDES

### 4.1 - Récupérer Toutes les Habitudes avec Historique (RECOMMANDÉ)

**URL** : `/api/habits/agent`
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

### 4.2 - Créer une Nouvelle Habitude

**URL** : `/api/webhooks/habits`
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

### 4.3 - Marquer une Habitude comme Complétée

**URL** : `/api/habits/agent`
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

### 4.4 - Habitudes Spéciales

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

---

## ⚙️ SECTION 5 : GESTION DES PROCESSUS

### 5.1 - Récupérer Tous les Processus

**URL** : `/api/processes/agent`
**Méthode** : GET
**Authentification** : Token API avec scope `processes:read`

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

### 5.2 - Créer un Nouveau Processus

**URL** : `/api/processes/agent`
**Méthode** : POST
**Authentification** : Token API avec scope `processes:write`

```bash
curl -X POST "https://productif.io/api/processes/agent" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Processus de publication d'article",
    "description": "Étapes pour publier un article sur le blog"
  }'
```

### 5.3 - Mettre à Jour un Processus

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

### 5.4 - Supprimer un Processus

```bash
curl -X DELETE "https://productif.io/api/processes/agent" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "process_id_123"
  }'
```

### 5.5 - Assigner un Processus à une Tâche

```bash
curl -X PATCH "https://productif.io/api/tasks/agent/{task_id}/process" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "processId": "process_id_123"
  }'
```

### 5.6 - Retirer un Processus d'une Tâche

```bash
curl -X PATCH "https://productif.io/api/tasks/agent/{task_id}/process" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "processId": null
  }'
```

### 5.7 - Récupérer le Processus Assigné à une Tâche

```bash
curl -X GET "https://productif.io/api/tasks/agent/{task_id}/process" \
  -H "Authorization: Bearer {votre_token}"
```