# 🤖 Documentation API pour Agents IA - productif.io

Cette documentation est spécialement conçue pour les agents IA qui doivent interagir avec l'API productif.io pour envoyer des rappels, récupérer des données et gérer les habitudes/tâches des utilisateurs.

---

## 🔐 SECTION 1 : AUTHENTIFICATION

### Obtenir un Token API
1. L'utilisateur se connecte à productif.io
2. Va dans Paramètres > Tokens API 
3. Crée un nouveau token avec les scopes nécessaires
4. Copie le token (affiché une seule fois)

### ⚡ Caractéristiques des Tokens (Mise à jour importante)

**✅ Tokens Permanents par Défaut** (Depuis décembre 2025)
- Quand vous **laissez le champ "Date d'expiration" vide** lors de la création : le token est **permanent** (jamais d'expiration)
- Quand vous **spécifiez une date d'expiration** : le token expire à cette date exacte
- **Headers JWT conformes** avec `"typ": "JWT"` pour une compatibilité optimale

**🔧 Améliorations Techniques**
- Format JWT standard avec tous les headers requis
- Tokens immédiatement fonctionnels après création
- Plus de problème d'expiration inattendue

**⚠️ Important pour les développeurs**
- Les anciens tokens (créés avant décembre 2025) peuvent avoir des durées d'expiration limitées
- Créez de nouveaux tokens pour bénéficier des améliorations
- Utilisez l'interface web `/settings/api-tokens` pour une création optimale

### Utiliser le Token
**En-tête obligatoire pour chaque requête** :
```
Authorization: Bearer {le_token_complet}
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
- Les endpoints standards (comme `/api/habits/date` ou `/api/tasks/today`) utilisent l'authentification par cookies et ne fonctionnent PAS avec les tokens API
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

**Exemple de réponse pour `/api/debug/ids/tasks`** :
```json
{
  "tasks": {
    "count": 15,
    "ids": ["task_1", "task_2", "task_3"],
    "completedIds": ["task_1"],
    "incompleteIds": ["task_2", "task_3"],
    "items": [
      {
        "id": "task_1",
        "title": "Ma tâche",
        "completed": true,
        "projectId": "project_789",
        "createdAt": "2025-05-26T10:00:00.000Z"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-06-09T16:15:45.081Z"
  }
}
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

**Note importante** : Cet endpoint retourne un tableau de tâches, pas un objet avec summary. Pour obtenir un résumé, utilisez l'endpoint `/api/tasks/agent` avec des filtres.
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

---

## 🎯 SECTION 6 : GESTION DES OBJECTIFS (OKR)

### 6.1 - Récupérer Toutes les Missions et Objectifs

**URL** : `/api/objectives/agent`
**Méthode** : GET
**Authentification** : Token API avec scope `objectives:read`

```bash
curl -X GET "https://productif.io/api/objectives/agent" \
  -H "Authorization: Bearer {votre_token}"
```

**Paramètres optionnels** :
- `?current=true` - Récupérer uniquement la mission du trimestre actuel

**Réponse** :
```json
{
  "missions": [
    {
      "id": "mission_id",
      "title": "Développer l'activité commerciale Q1",
    "quarter": 1,
    "year": 2024,
      "progress": 65,
      "objectives": [
        {
          "id": "objective_id",
          "title": "Augmenter la prospection",
          "progress": 30,
          "current": 15,
    "target": 50,
          "actions": [
            {
              "id": "action_id",
              "title": "Prospecter des entreprises",
              "progress": 30,
              "current": 15,
              "target": 50
            }
          ]
        }
      ]
    }
  ]
}
```

### 6.2 - Mettre à Jour le Progrès d'une Action

**URL** : `/api/objectives/agent/actions/{action_id}/progress`
**Méthode** : PATCH
**Authentification** : Token API avec scope `objectives:write`

```bash
curl -X PATCH "https://productif.io/api/objectives/agent/actions/{action_id}/progress" \
  -H "Authorization: Bearer {votre_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "increment": 3,
    "note": "Prospecté 3 entreprises aujourd'hui"
  }'
```

**Paramètres** :
- `increment` (optionnel) : Nombre à ajouter à la valeur actuelle
- `current` (optionnel) : Nouvelle valeur absolue
- `note` (optionnel) : Note explicative de la progression

**Réponse** :
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

---

## 📈 SECTION 7 : OUTILS DE DÉVELOPPEMENT

### 7.1 - Test de Token API

```bash
curl -X GET "https://productif.io/api/test-token" \
  -H "Authorization: Bearer {votre_token}"
```

---

## 💬 SECTION 8 : EXEMPLES D'USAGE POUR AGENT WHATSAPP

### Rappel Matinal (8h00)
```
🌅 Bonjour ! Voici vos tâches du jour :
• ✅ Finir le rapport (P3 - Urgent)
• 📝 Réunion équipe à 14h (P2 - Important)
• 🎯 Review projet Alpha (P1 - À faire)

Habitudes du jour :
• 🏃 Exercice matinal (Streak: 5 jours!)
• 📚 Lecture 20min
• 💧 Boire 2L d'eau

Bonne journée ! 💪
```

**Code exemple pour récupérer ces données** :
```bash
# Récupérer les tâches du jour (remplacez la date)
curl -X GET "https://productif.io/api/tasks/agent/date?date=2025-01-15" \
  -H "Authorization: Bearer {token}"

# Récupérer les habitudes
curl -X GET "https://productif.io/api/habits/agent" \
  -H "Authorization: Bearer {token}"
```

### Rappel Habitudes (Personnalisé)
```
⏰ Il est 8h00 !
C'est l'heure de votre exercice matinal 🏃‍♀️

Votre streak actuel : 5 jours 🔥
Objectif : Continuer cette belle série !

Répondez "Fait" quand c'est terminé 👍
```

### Résumé du Soir (20h00)
```
🌙 Récap de votre journée :

Tâches : 3/5 terminées ✅
Habitudes : 2/4 accomplies 🎯
Score productivité : 75% 📈

Bravo ! Vous avez débloqué :
🏆 "Maître des Habitudes" (+100 pts)

À demain pour une nouvelle journée productive ! 🚀
```

---

## ⚙️ SECTION 9 : GESTION D'ERREURS ET RÉSOLUTION DE PROBLÈMES

### Codes de Retour
- `200` - Succès
- `401` - Token invalide ou manquant
- `403` - Permissions insuffisantes (scope manquant)
- `404` - Ressource non trouvée
- `429` - Trop de requêtes (rate limiting)
- `500` - Erreur serveur

### Erreur 401 "Non authentifié"

**Causes possibles** :
1. **Mauvais endpoint** : Vous utilisez un endpoint non compatible avec les tokens API
   - ❌ `/api/habits/date` (utilise cookies)
   - ❌ `/api/tasks/today` (utilise cookies)
   - ✅ `/api/habits/agent` (utilise JWT)
   - ✅ `/api/tasks/agent` (utilise JWT)
   - ✅ `/api/tasks/agent/date` (utilise JWT)

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

### Exemples d'Erreurs
```json
{
  "error": "Token invalide",
  "code": 401,
  "message": "Le token fourni n'est pas valide"
}
```

```json
{
  "error": "Scope insuffisant", 
  "code": 403,
  "required": "habits:write",
  "provided": ["habits:read"]
}
```

---

## 🔧 SECTION 10 : BONNES PRATIQUES

### Pour un Agent WhatsApp
1. **Récupérer l'ID utilisateur** avec `/api/debug/quick-ids` au début
2. **Stocker les IDs** essentiels pour éviter les requêtes répétées  
3. **Utiliser les endpoints `/agent`** uniquement (pas les endpoints standards)
4. **Gérer les erreurs** gracieusement avec des messages utilisateur amicaux
5. **Respecter les limites** de taux de requêtes
6. **Personnaliser les messages** selon les données utilisateur

### Workflow de Développement Recommandé

#### 1. Découverte initiale
```bash
# Obtenir une vue d'ensemble
curl -X GET "/api/debug/ids" -H "Authorization: Bearer {token}"
```

#### 2. Tests rapides
```bash
# Obtenir les IDs essentiels
curl -X GET "/api/debug/quick-ids" -H "Authorization: Bearer {token}"
```

#### 3. Développement ciblé
```bash
# Focus sur les tâches
curl -X GET "/api/debug/ids/tasks" -H "Authorization: Bearer {token}"

# Focus sur les habitudes  
curl -X GET "/api/debug/ids/habits" -H "Authorization: Bearer {token}"
```

#### 4. Utilisation des IDs récupérés
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

### Fréquence Recommandée
- **Rappel matinal** : 1x par jour (8h00)
- **Rappel habitudes** : Selon préférences utilisateur  
- **Résumé du soir** : 1x par jour (20h00)
- **Vérification données** : Max 1x par heure

### Bonnes Pratiques Générales
1. **Utilisez les endpoints `/agent`** pour toutes vos intégrations d'IA
2. **Stockez vos tokens de manière sécurisée** et ne les partagez jamais
3. **Créez des tokens permanents** en laissant le champ d'expiration vide pour une utilisation durable, ou définissez une date d'expiration spécifique si nécessaire
4. **Utilisez des scopes minimaux** nécessaires pour votre cas d'usage
5. **Testez vos intégrations** avec l'endpoint `/test-token`
6. **Gérez les erreurs** appropriément dans votre code
7. **Utilisez les endpoints debug** pour récupérer facilement les IDs nécessaires
8. **Mettez à jour vos anciens tokens** si vous rencontrez des problèmes d'expiration

---

## 📝 CHANGELOG

### Version 2.1 (Décembre 2025) - CORRECTIONS MAJEURES
- 🔥 **TOKENS PERMANENTS** : Les tokens créés sans date d'expiration sont maintenant permanents (jamais d'expiration)
- ✅ **Headers JWT conformes** : Tous les tokens incluent maintenant `"typ": "JWT"` pour une compatibilité optimale
- ⚡ **Fonctionnement immédiat** : Plus de problème d'expiration prématurée, les tokens fonctionnent dès la création
- 🔧 **Interface web améliorée** : Création de tokens optimisée via `/settings/api-tokens`
- 📚 **Documentation mise à jour** : Nouvelles sections sur les caractéristiques des tokens

### Version 2.0 (Juin 2025)
- ✅ Restructuration complète pour agents IA par sections claires
- ✅ Conservation de TOUTES les fonctionnalités précédentes
- ✅ Sections numérotées pour navigation facile
- ✅ Exemples complets pour WhatsApp
- ✅ Gestion d'erreurs détaillée
- ✅ ID utilisateur disponible dans tous les endpoints debug
- ✅ Workflows de développement détaillés

### Version 2025-06-09
- ✅ **Documentation complètement restructurée** : 
  - Nouvelle section dédiée "🆔 Récupération des IDs - Guide Complet"
  - Tableaux de comparaison des endpoints
  - Exemples détaillés avec structure des réponses
  - Workflow de développement recommandé
  - Cas d'usage pratiques avec scripts
- ✅ **ID Utilisateur clarifié** : Documentation explicite de où trouver l'ID utilisateur dans chaque endpoint
- ✅ **Organisation améliorée** : Sections claires et numérotées pour une navigation facile
- ✅ **Exemples pratiques** : Scripts bash et cas d'usage réels pour les développeurs

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