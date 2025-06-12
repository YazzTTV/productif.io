# Liste complète des API Agent - productif.io

## 📋 Vue d'ensemble

Tous les endpoints API agent utilisent **exclusivement l'authentification JWT** via l'en-tête `Authorization: Bearer <token>`.

## 🎯 Endpoints API Agent disponibles

### 1. **Tasks (Tâches)**

#### `/api/tasks/agent`
- **GET** : Liste toutes les tâches pour un agent IA
- **POST** : Créer une nouvelle tâche via un agent IA
- **Scopes requis** : `tasks:read` (GET), `tasks:write` (POST)
- **Filtres disponibles** :
  - `?completed=true/false` : Filtrer par statut de complétion
  - `?projectId=<id>` : Filtrer par projet
  - `?scheduled=true` : Filtrer les tâches planifiées

#### `/api/tasks/agent/date`
- **GET** : Récupère les tâches pour une date spécifique
- **Paramètres** : `?date=YYYY-MM-DD`
- **Scope requis** : `tasks:read`

#### `/api/tasks/agent/[id]`
- **PATCH** : Mettre à jour une tâche spécifique
- **DELETE** : Supprimer une tâche spécifique
- **Scope requis** : `tasks:write`

#### `/api/tasks/agent/[id]/process`
- **PATCH** : Assigner ou retirer un processus d'une tâche
- **GET** : Récupérer le processus assigné à une tâche
- **Scope requis** : `tasks:write` (PATCH), `tasks:read` (GET)

### 2. **Habits (Habitudes)**

#### `/api/habits/agent`
- **GET** : Liste toutes les habitudes pour un agent IA
- **POST** : Marquer une habitude comme complétée
- **Scope requis** : `habits:read` (GET), `habits:write` (POST)

### 3. **Objectives (Objectifs)**

#### `/api/objectives/agent`
- **GET** : Récupérer toutes les missions et objectifs
- **POST** : Créer une mission, objectif ou action
- **PATCH** : Mettre à jour la progression d'une action
- **Scope requis** : `objectives:read` (GET), `objectives:write` (POST/PATCH)

#### `/api/objectives/agent/actions/[id]/progress`
- **PATCH** : Mettre à jour la progression d'une action spécifique
- **GET** : Récupérer les détails d'une action
- **Scope requis** : `objectives:write` (PATCH), `objectives:read` (GET)

### 4. **Processes (Processus)**

#### `/api/processes/agent`
- **GET** : Récupérer tous les processus
- **POST** : Créer un nouveau processus
- **PATCH** : Mettre à jour un processus
- **DELETE** : Supprimer un processus
- **Scope requis** : `processes:read` (GET), `processes:write` (POST/PATCH/DELETE)

## 🔑 Authentification

Tous ces endpoints utilisent le middleware `apiAuth` qui :

1. **Vérifie exclusivement** l'en-tête `Authorization: Bearer <token>`
2. **Ne consulte jamais** les cookies
3. **Valide** le token JWT avec signature cryptographique
4. **Contrôle** les scopes/permissions requises
5. **Met à jour** la date de dernière utilisation du token

## 📊 Endpoints inexistants (erreurs communes)

- ❌ `/api/agent/tasks/today` (n'existe pas)
- ❌ `/api/agent/habits` (n'existe pas)  
- ❌ `/api/agent/objectives` (n'existe pas)

## ✅ Tests d'authentification

Pour vérifier qu'un endpoint utilise bien JWT :

```powershell
# Test avec token JWT (doit fonctionner)
Invoke-RestMethod -Uri "https://productif.io/api/tasks/agent" -Method GET -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test sans token (doit retourner 401)
Invoke-RestMethod -Uri "https://productif.io/api/tasks/agent" -Method GET -Headers @{
    "Content-Type" = "application/json"
}
```

## 🎯 Scopes disponibles

- `tasks:read` / `tasks:write`
- `habits:read` / `habits:write`  
- `objectives:read` / `objectives:write`
- `processes:read` / `processes:write`
- `projects:read` / `projects:write`

## 📝 Notes importantes

1. **Structure cohérente** : Tous les endpoints agent suivent le pattern `/api/<resource>/agent`
2. **JWT exclusif** : Aucun endpoint agent n'utilise les cookies comme authentification
3. **Scopes granulaires** : Chaque endpoint vérifie les permissions spécifiques
4. **Gestion d'erreurs** : Retourne 401 sans token, 403 sans permissions suffisantes 