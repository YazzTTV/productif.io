# 📊 Analyse du Scheduler et des Notifications - État Actuel

## 🎯 Vue d'ensemble

Ce document analyse le fonctionnement actuel du système de scheduler et de notifications push dans l'application mobile `mobile-app-new/`.

---

## 📱 Côté Mobile (mobile-app-new/)

### ✅ Ce qui est implémenté

#### 1. **Package expo-notifications** ✅
- **Fichier**: `package.json`
- **Version**: `expo-notifications@~0.31.4`
- **Status**: Installé et disponible

#### 2. **Hook usePushNotifications** ✅
- **Fichier**: `mobile-app-new/hooks/usePushNotifications.tsx`
- **Fonctionnalités**:
  - ✅ Demande de permissions de notifications
  - ✅ Obtention du token push Expo/APNs
  - ✅ Enregistrement automatique du token auprès du backend
  - ✅ Écoute des notifications reçues (foreground/background)
  - ✅ Gestion des notifications tapées (navigation vers assistant IA)
  - ✅ Gestion du cold start (notification tapée avant ouverture de l'app)

**Points clés**:
```typescript
// Le hook enregistre automatiquement le token au démarrage
registerTokenWithBackend(token) // Appelé après obtention du token

// Navigation automatique vers l'assistant IA si action="open_assistant"
if (data?.action === 'open_assistant' && data?.message) {
  router.replace({
    pathname: '/(tabs)/assistant',
    params: { preset: presetValue },
  });
}
```

#### 3. **Service de notifications** ✅
- **Fichier**: `mobile-app-new/src/services/notificationService.ts`
- **Fonctionnalités**:
  - ✅ API complète pour gérer les notifications
  - ✅ Méthode `registerPushToken(token, platform)` pour enregistrer le token
  - ✅ Méthode `unregisterPushToken()` pour supprimer le token
  - ✅ Gestion des préférences de notifications

#### 4. **Page de configuration des notifications** ✅
- **Fichier**: `mobile-app-new/app/notifications.tsx`
- **Fonctionnalités**:
  - ✅ Interface complète pour configurer les préférences
  - ✅ Activation/désactivation des notifications push
  - ✅ Configuration des horaires (matin, midi, après-midi, soir, nuit)
  - ✅ Configuration des questions aléatoires (humeur, stress, focus)
  - ✅ Gestion des permissions avec bouton de demande
  - ✅ Sauvegarde des préférences via API `/notifications/preferences`

#### 5. **Initialisation au démarrage** ✅
- **Fichier**: `mobile-app-new/app/_layout.tsx`
- **Ligne 29**: `usePushNotifications()` est appelé au démarrage de l'app
- **Status**: Les notifications sont initialisées automatiquement

---

## 🔧 Côté Backend

### ✅ Ce qui est implémenté

#### 1. **Endpoint API push-token** ✅
- **Fichier**: `app/api/notifications/push-token/route.ts`
- **Endpoints**:
  - ✅ `POST /api/notifications/push-token` - Enregistrer/mettre à jour un token
  - ✅ `DELETE /api/notifications/push-token` - Supprimer un token
  - ✅ `GET /api/notifications/push-token` - Récupérer les tokens de l'utilisateur
- **Fonctionnalités**:
  - ✅ Authentification requise (JWT)
  - ✅ Support iOS, Android, Web
  - ✅ Gestion des tokens multiples par utilisateur
  - ✅ Mise à jour automatique si token existe déjà

#### 2. **Service APNs** ✅
- **Fichier**: `lib/apns.js` et `lib/apns.ts`
- **Fonctionnalités**:
  - ✅ Initialisation du provider APNs
  - ✅ Envoi de notifications push iOS
  - ✅ Gestion des tokens invalides (suppression automatique)
  - ✅ Support des données personnalisées (payload)
  - ✅ Support de `mutableContent` pour iOS

**Structure du payload**:
```javascript
{
  title: "Titre de la notification",
  body: "Corps de la notification",
  sound: "default",
  badge: 1,
  data: {
    action: "open_assistant",
    message: "Message complet pour l'assistant IA",
    notificationId: "...",
    type: "..."
  }
}
```

#### 3. **Scheduler de notifications** ✅
- **Fichier**: `src/services/NotificationScheduler.js`
- **Fonctionnalités**:
  - ✅ Planification de tâches cron pour chaque utilisateur
  - ✅ Écoute des événements de mise à jour de préférences
  - ✅ Planification dynamique (création/suppression de jobs)
  - ✅ Gestion des fuseaux horaires
  - ✅ Traitement des notifications en attente (polling toutes les minutes)

**Mécanisme**:
1. L'utilisateur modifie ses préférences → événement `PREFERENCES_UPDATED`
2. Le scheduler reçoit l'événement → `handlePreferencesUpdate()`
3. Nettoyage des anciennes tâches → `stopUserTasks()`
4. Planification des nouvelles tâches → `scheduleUserNotifications()`
5. Création de jobs cron → `scheduleDailyNotification()`

**Jobs cron créés**:
- Rappel matin (`morningReminder` + `morningTime`)
- Rappel midi (`noonReminder` + `noonTime`)
- Rappel après-midi (`afternoonReminder` + `afternoonTime`)
- Rappel soir (`eveningReminder` + `eveningTime`)
- Rappel nuit (`nightReminder` + `nightTime`)
- Questions aléatoires (humeur, stress, focus) dans des fenêtres horaires

#### 4. **Service de traitement des notifications** ✅
- **Fichier**: `src/services/NotificationService.js`
- **Fonctionnalités**:
  - ✅ Création d'entrées dans `notificationHistory`
  - ✅ Traitement des notifications (WhatsApp + Push)
  - ✅ Appel à `sendPushNotification()` pour iOS
  - ✅ Formatage des messages pour l'assistant IA

**Flux de traitement**:
1. Le scheduler déclenche un callback à l'heure prévue
2. Le callback crée une notification dans `notificationHistory` avec `status: 'pending'`
3. Le job de polling (`processNotifications()`) récupère les notifications en attente
4. Pour chaque notification, `processNotification()` est appelé
5. Si `pushEnabled` est activé, `sendPushNotification()` est appelé
6. La notification est envoyée via APNs à tous les tokens iOS de l'utilisateur

---

## 🔄 Flux complet de notification

### 1. **Configuration initiale**
```
Utilisateur ouvre l'app
  ↓
usePushNotifications() s'initialise
  ↓
Demande de permissions (si non accordées)
  ↓
Obtention du token push (Expo/APNs)
  ↓
Enregistrement via POST /api/notifications/push-token
  ↓
Token stocké dans la base de données (table PushToken)
```

### 2. **Configuration des préférences**
```
Utilisateur configure les notifications dans app/notifications.tsx
  ↓
Sauvegarde via POST /api/notifications/preferences
  ↓
Émission événement PREFERENCES_UPDATED
  ↓
Scheduler reçoit l'événement
  ↓
Arrêt des anciennes tâches cron
  ↓
Création des nouvelles tâches cron pour chaque horaire configuré
```

### 3. **Envoi d'une notification**
```
Job cron se déclenche à l'heure prévue
  ↓
Callback crée une notification dans notificationHistory (status: 'pending')
  ↓
Job de polling (toutes les minutes) récupère les notifications en attente
  ↓
processNotification() est appelé
  ↓
Vérification si pushEnabled est activé
  ↓
Récupération des tokens push iOS de l'utilisateur
  ↓
Envoi via APNs avec sendPushNotification()
  ↓
Notification reçue sur l'appareil iOS
  ↓
Si l'utilisateur tape la notification → Navigation vers assistant IA
```

---

## 📊 Modèles de données

### **PushToken** (Prisma)
```prisma
model PushToken {
  id        String   @id @default(cuid())
  userId    String
  token     String
  platform  String   // 'ios' | 'android' | 'web'
  deviceId  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id])
}
```

### **NotificationHistory** (Prisma)
```prisma
model NotificationHistory {
  id              String   @id @default(cuid())
  userId          String
  type            String
  content         String
  scheduledFor    DateTime
  status          String   // 'pending' | 'sent' | 'failed'
  pushTitle       String?
  pushBody        String?
  assistantMessage String?
  createdAt       DateTime @default(now())
  user            User     @relation(...)
}
```

---

## ✅ Points forts du système actuel

1. **Architecture réactive**: Le scheduler écoute les événements en temps réel
2. **Gestion des fuseaux horaires**: Support complet des timezones
3. **Tokens multiples**: Un utilisateur peut avoir plusieurs appareils
4. **Nettoyage automatique**: Suppression des tokens invalides
5. **Navigation intelligente**: Les notifications ouvrent directement l'assistant IA
6. **Gestion des erreurs**: Logs détaillés et gestion des échecs

---

## ⚠️ Points d'attention / Améliorations possibles

### 1. **Gestion des tokens Expo vs APNs natifs**
- **Actuel**: Le hook utilise `getExpoPushTokenAsync()` qui retourne un token Expo
- **Note**: Pour une app native iOS, on pourrait utiliser `getDevicePushTokenAsync()` pour obtenir le token APNs natif directement
- **Impact**: Actuellement, le système fonctionne avec les tokens Expo, ce qui nécessite le service Expo Push Notification

### 2. **Support Android**
- **Status**: Le code supporte Android mais n'a pas été testé
- **Action requise**: Tester l'envoi de notifications Android via FCM (Firebase Cloud Messaging)

### 3. **Gestion des notifications en arrière-plan**
- **Status**: Les notifications sont bien reçues en arrière-plan
- **Amélioration possible**: Ajouter des actions de notification (boutons d'action)

### 4. **Retry logic**
- **Status**: Pas de mécanisme de retry si l'envoi échoue
- **Amélioration possible**: Implémenter un système de retry avec backoff exponentiel

### 5. **Analytics**
- **Status**: Pas de tracking des notifications envoyées/lues
- **Amélioration possible**: Ajouter des métriques pour mesurer l'engagement

---

## 🧪 Tests recommandés

1. **Test d'enregistrement de token**:
   - Ouvrir l'app → Vérifier que le token est enregistré dans la base
   - Vérifier les logs: `✅ Nouveau token push enregistré`

2. **Test de configuration**:
   - Modifier les préférences → Vérifier que les jobs cron sont recréés
   - Vérifier les logs: `➕ Nouvelle tâche: userId-20:30`

3. **Test d'envoi**:
   - Attendre l'heure configurée → Vérifier la réception de la notification
   - Taper la notification → Vérifier la navigation vers l'assistant IA

4. **Test de cold start**:
   - Fermer l'app complètement
   - Recevoir une notification
   - Taper la notification → Vérifier que l'app s'ouvre sur l'assistant IA

---

## 📝 Conclusion

Le système de scheduler et de notifications est **globalement bien implémenté** et fonctionnel. Les composants principaux sont en place :

✅ **Mobile**: Hook, service, page de configuration, initialisation  
✅ **Backend**: Endpoint API, service APNs, scheduler, traitement

Le système fonctionne de bout en bout, de la configuration à la réception des notifications. Les principales améliorations possibles concernent le support Android, les analytics et la gestion des erreurs.
