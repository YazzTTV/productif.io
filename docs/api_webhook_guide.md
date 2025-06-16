# Productif.io API Webhook Guide

Ce guide décrit comment utiliser les webhooks de l'API Productif.io pour l'intégration avec n8n et d'autres outils d'automatisation.

## Authentification

Tous les endpoints webhook supportent l'authentification par token Bearer :

```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Important** : Pour les intégrations en production, l'authentification est obligatoire. Les tokens doivent être créés via l'interface `/settings/api-tokens` avec les scopes appropriés.

## URL de Base

L'URL de base pour tous les endpoints webhook est :

```
https://your-productif-instance.com/api/webhooks
```

## Webhooks Disponibles

### Endpoint Webhook Général

**Endpoint :** `/api/webhooks/agent`

Cet endpoint supporte les opérations de base sur les tâches.

#### Actions Supportées :

1. **Créer une Tâche**

```json
{
  "action": "create_task",
  "data": {
    "title": "Compléter le rapport projet",
    "description": "Finir le rapport trimestriel pour le Projet XYZ",
    "userId": "user_id_here",
    "projectId": "optional_project_id",
    "dueDate": "2025-07-15T23:59:59Z"
  }
}
```

2. **Mettre à Jour une Tâche**

```json
{
  "action": "update_task",
  "data": {
    "id": "task_id_here",
    "title": "Titre de tâche mis à jour",
    "description": "Description mise à jour",
    "dueDate": "2025-07-20T23:59:59Z"
  }
}
```

3. **Compléter une Tâche**

```json
{
  "action": "complete_task",
  "data": {
    "id": "task_id_here"
  }
}
```

### Endpoint Webhook Objectifs

**Endpoint :** `/api/webhooks/objectives/agent`

Cet endpoint supporte la gestion des OKR et objectifs.

#### Actions Supportées :

1. **Créer une Mission**

```json
{
  "action": "create_mission",
  "data": {
    "title": "Objectifs Q3 2025",
    "quarter": 3,
    "year": 2025,
    "userId": "user_id_here",
    "target": 100
  }
}
```

2. **Créer un Objectif**

```json
{
  "action": "create_objective",
  "data": {
    "title": "Augmenter l'engagement utilisateur",
    "missionId": "mission_id_here",
    "target": 85
  }
}
```

3. **Mettre à Jour le Progrès d'un Objectif**

```json
{
  "action": "update_objective_progress",
  "data": {
    "id": "objective_id_here",
    "current": 65
  }
}
```

### Endpoint Webhook Habitudes

**Endpoint :** `/api/webhooks/habits/agent`

Cet endpoint supporte le suivi et la gestion des habitudes.

#### Actions Supportées :

1. **Créer une Habitude**

```json
{
  "action": "create_habit",
  "data": {
    "name": "Méditation Matinale",
    "description": "15 minutes de méditation le matin",
    "frequency": "daily",
    "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "userId": "user_id_here",
    "color": "#4A90E2"
  }
}
```

2. **Enregistrer une Entrée d'Habitude**

```json
{
  "action": "log_habit_entry",
  "data": {
    "habitId": "habit_id_here",
    "date": "2025-07-12",
    "completed": true,
    "note": "Super séance aujourd'hui !",
    "rating": 5
  }
}
```

3. **Obtenir les Statistiques d'Habitude**

```json
{
  "action": "get_habit_stats",
  "data": {
    "userId": "user_id_here",
    "startDate": "2025-07-01",
    "endDate": "2025-07-31"
  }
}
```

## Intégration avec n8n

### Configuration d'un Nœud Webhook dans n8n

1. Ajoutez un nœud "Webhook" à votre workflow
2. Configurez-le pour faire des requêtes HTTP vers l'endpoint Productif.io approprié
3. Configurez la charge utile comme décrit dans les exemples ci-dessus
4. **Important** : Ajoutez l'en-tête d'authentification avec votre token Bearer

### Exemple de Workflow n8n : Créer une Tâche depuis un Email

1. Utilisez le nœud trigger "Email" pour écouter les emails entrants
2. Ajoutez un nœud "Function" pour extraire les détails de la tâche de l'email
3. Ajoutez un nœud "HTTP Request" pour envoyer les données au webhook Productif :
   - Méthode : POST
   - URL : https://your-productif-instance.com/api/webhooks/agent
   - Corps : JSON contenant l'action et les données de la tâche
   - En-têtes : Inclure le token Bearer

### Exemple de Workflow n8n : Mise à Jour du Progrès OKR

1. Utilisez un trigger "Schedule" pour une exécution hebdomadaire
2. Ajoutez un nœud "HTTP Request" pour récupérer les données de votre plateforme d'analytics
3. Ajoutez un nœud "Function" pour calculer les métriques de progrès
4. Envoyez la mise à jour via le webhook :
   ```json
   {
     "action": "update_objective_progress",
     "data": {
       "id": "objective_id",
       "current": 75,
       "lastUpdated": "2025-07-15T10:00:00Z"
     }
   }
   ```

## Bonnes Pratiques

1. **Authentification**
   - Utilisez toujours des tokens API pour l'authentification en production
   - Stockez les tokens de manière sécurisée
   - Utilisez des tokens différents pour chaque intégration

2. **Gestion des Erreurs**
   - Implémentez une gestion robuste des erreurs
   - Vérifiez les codes de statut HTTP
   - Mettez en place des retries pour les échecs temporaires

3. **Rate Limiting**
   - Respectez les limites de taux : 60 requêtes/minute
   - Implémentez un backoff exponentiel pour les retries
   - Surveillez votre utilisation de l'API

4. **Sécurité**
   - Utilisez HTTPS uniquement
   - Validez toutes les entrées
   - Limitez les permissions des tokens au minimum nécessaire

## Codes d'Erreur

- `200` : Succès
- `400` : Requête invalide
- `401` : Non authentifié
- `403` : Non autorisé
- `404` : Ressource non trouvée
- `429` : Trop de requêtes
- `500` : Erreur serveur

## Changelog

### Version 2.1 (Décembre 2025)
- Ajout du support des tokens permanents
- Amélioration de la compatibilité des headers JWT
- Nouveaux endpoints `/agent` pour les webhooks
- Documentation mise à jour pour les intégrations IA

### Version 2.0 (Juin 2025)
- Migration vers l'authentification Bearer token
- Nouveaux endpoints pour les webhooks
- Support amélioré pour n8n
- Ajout de nouveaux types d'actions 