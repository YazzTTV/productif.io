# Système de mise à jour en temps réel du planificateur de notifications

## 🎯 Objectif

Ce système permet au planificateur de notifications de prendre en compte immédiatement les changements de préférences utilisateur sans nécessiter un redémarrage complet.

## 🏗️ Architecture

```
Frontend (Préférences) → API Update → EventManager → NotificationScheduler → Mise à jour des tâches cron
```

### Composants principaux

1. **EventManager** (`lib/EventManager.ts`)
   - Système d'événements basé sur EventEmitter
   - Gère la communication entre l'API et le planificateur
   - Pattern Singleton pour garantir une instance unique

2. **NotificationScheduler modifié** (`src/services/NotificationScheduler.ts`)
   - Écoute les événements de mise à jour
   - Gère l'arrêt/redémarrage sélectif des tâches
   - Supporte la mise à jour utilisateur par utilisateur

3. **API Preferences** (`app/api/notifications/preferences/route.ts`)
   - Émet des événements lors des mises à jour
   - Compare anciennes et nouvelles préférences

4. **API Scheduler** (`app/api/notifications/scheduler/route.ts`)
   - Permet de contrôler le planificateur manuellement
   - Actions : restart, update_user, status

## 🚀 Fonctionnalités

### ✅ Mise à jour automatique
- Changement d'horaires → Reprogrammation immédiate des tâches cron
- Activation/désactivation de types de notifications → Création/arrêt des tâches
- Désactivation complète → Arrêt de toutes les tâches utilisateur

### ✅ Gestion sélective
- Arrêt uniquement des tâches de l'utilisateur modifié
- Conservation des autres tâches actives
- Optimisé pour les performances

### ✅ Contrôle manuel
- Redémarrage complet du planificateur
- Mise à jour forcée d'un utilisateur spécifique
- Vérification du statut

## 🔧 Utilisation

### API Endpoints

#### Mettre à jour les préférences
```javascript
POST /api/notifications/preferences
{
  "userId": "user-id",
  "isEnabled": true,
  "morningTime": "09:30",
  "taskReminder": true,
  ...
}
```
→ Déclenche automatiquement la mise à jour du planificateur

#### Contrôler le planificateur
```javascript
// Redémarrer complètement
POST /api/notifications/scheduler
{
  "action": "restart"
}

// Forcer la mise à jour d'un utilisateur
POST /api/notifications/scheduler
{
  "action": "update_user",
  "userId": "user-id"
}

// Vérifier le statut
GET /api/notifications/scheduler
```

### Programmation

#### Écouter des événements
```typescript
import EventManager from '@/lib/EventManager';

const eventManager = EventManager.getInstance();

eventManager.onPreferencesUpdate((event) => {
  console.log(`Préférences mises à jour pour ${event.userId}`);
});
```

#### Émettre des événements
```typescript
const eventManager = EventManager.getInstance();

eventManager.emitPreferencesUpdate({
  userId: 'user-id',
  oldPreferences: {...},
  newPreferences: {...},
  timestamp: new Date()
});
```

## 🧪 Tests

### Script de test automatisé
```bash
node scripts/test-notification-scheduler-update.js
```

Ce script teste :
- ✅ Démarrage du planificateur
- ✅ Mise à jour des préférences en temps réel
- ✅ Changement d'horaires
- ✅ Activation/désactivation de notifications
- ✅ Désactivation complète
- ✅ Arrêt propre

### Test manuel via API
```bash
# 1. Vérifier le statut
curl -X GET http://localhost:3000/api/notifications/scheduler

# 2. Mettre à jour des préférences utilisateur
curl -X POST http://localhost:3000/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -d '{"userId":"your-user-id","morningTime":"10:00",...}'

# 3. Forcer une mise à jour
curl -X POST http://localhost:3000/api/notifications/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action":"update_user","userId":"your-user-id"}'
```

## 🔍 Monitoring

### Logs à surveiller
```
📡 Émission événement: PREFERENCES_UPDATED pour utilisateur xxx
🔄 Mise à jour des préférences pour l'utilisateur xxx
🛑 Arrêt des tâches pour l'utilisateur xxx
✅ Notifications planifiées pour l'utilisateur xxx
```

### Statuts possibles
- `isStarted: boolean` - Le planificateur est-il démarré
- `activeJobs: number` - Nombre de tâches cron actives
- `jobIds: string[]` - Liste des IDs de tâches actives

## ⚠️ Points d'attention

1. **Instance unique** : Le planificateur doit être une instance unique partagée
2. **Gestion d'erreurs** : Les erreurs dans un utilisateur n'affectent pas les autres
3. **Performance** : Optimisé pour ne modifier que les tâches nécessaires
4. **Logs** : Surveillance des événements pour débogage

## 🔄 Workflow typique

1. **Utilisateur change ses préférences** dans l'interface
2. **Frontend appelle** `POST /api/notifications/preferences`
3. **API sauvegarde** en base et émet un événement
4. **EventManager propage** l'événement
5. **NotificationScheduler reçoit** l'événement
6. **Planificateur arrête** les anciennes tâches de cet utilisateur
7. **Planificateur crée** les nouvelles tâches avec les nouveaux horaires
8. **Utilisateur reçoit** ses notifications aux nouveaux horaires

## 🚀 Avantages

- ✅ **Temps réel** : Changements appliqués immédiatement
- ✅ **Performance** : Mise à jour sélective par utilisateur
- ✅ **Robustesse** : Isolation des erreurs utilisateur
- ✅ **Flexibilité** : Contrôle manuel disponible
- ✅ **Observabilité** : Logs détaillés pour le debugging 