# 📱 Nouveaux Scénarios de Notifications - Intégration Mobile

## 📋 Vue d'ensemble

Ce document décrit l'intégration des **8 nouveaux scénarios de notifications** ajoutés côté backend et leur compatibilité avec l'application mobile existante.

---

## 🆕 Nouveaux Scénarios Ajoutés

### 1. **MORNING_ANCHOR** 🌅
- **Quand** : Au moment du rappel matin (`morningTime`)
- **Condition** : Utilisateur actif (≥30 min d'activité sur 3 jours) + tâches/événements planifiés
- **Contenu** : Résumé de la journée avec top 3 tâches et événements calendrier
- **Titre push** : `🌅 Ta journée est prête`
- **Action** : `open_assistant` avec message complet

### 2. **FOCUS_WINDOW** 🎯
- **Quand** : Scan automatique toutes les 10 minutes entre 9h-18h
- **Condition** : Fenêtre libre de ≥25 min détectée + tâches planifiées + pas de session deep work active
- **Contenu** : "Tu as un créneau libre. Moment parfait pour te concentrer sur une tâche planifiée."
- **Titre push** : `🎯 Tu as du temps pour te concentrer`
- **Action** : `open_assistant` avec message complet
- **Limite** : Maximum 1 notification par jour

### 3. **FOCUS_END** ⏱️
- **Quand** : Auto-complétion d'une session deep work (quand le temps planifié est écoulé)
- **Condition** : Session deep work terminée automatiquement
- **Contenu** : "Bien joué. Un pas de plus vers tes objectifs." + durée planifiée vs réelle
- **Titre push** : `⏱️ Session terminée`
- **Action** : `open_assistant` avec message complet

### 4. **LUNCH_BREAK** 🍽️
- **Quand** : Au moment du rappel midi (`noonTime`)
- **Condition** : Matin dense (≥25 min d'activité OU ≥1 événement) + matin chargé (≥2 événements OU ≥3 tâches OU ≥60 min d'activité)
- **Contenu** : "Prends une pause. La récupération fait partie de la performance."
- **Titre push** : `🍽️ Temps de faire une pause`
- **Action** : `open_assistant` avec message complet
- **Suivi** : Déclenche automatiquement `POST_LUNCH_RESTART` 30-90 min après

### 5. **POST_LUNCH_RESTART** 🔁
- **Quand** : 30-90 minutes après `LUNCH_BREAK` (délai aléatoire)
- **Condition** : Fenêtre libre de ≥20 min détectée + tâches restantes dans l'après-midi
- **Contenu** : "Un peu de concentration maintenant vaut mieux qu'un stress intense plus tard."
- **Titre push** : `🔁 Prêt à reprendre ?`
- **Action** : `open_assistant` avec message complet

### 6. **STRESS_CHECK_PREMIUM** 🧠
- **Quand** : Fenêtre de stress configurée (par défaut 17:00)
- **Condition** : 
  - Utilisateur Premium uniquement
  - Journée dense (≥60 min d'activité OU ≥3 événements)
  - Pas de check-in stress déjà effectué aujourd'hui
- **Contenu** : "Check-in rapide. À quel point te sens-tu stressé(e) en ce moment ?"
- **Titre push** : `🧠 Stress check`
- **Action** : `open_assistant` avec message complet

### 7. **MOOD_CHECK_PREMIUM** 🙂
- **Quand** : Fenêtre d'humeur configurée (par défaut 19:00)
- **Condition** :
  - Utilisateur Premium uniquement
  - Pas de check-in humeur déjà effectué aujourd'hui
- **Contenu** : "Comment s'est passée ta journée dans l'ensemble ?"
- **Titre push** : `🙂 Mood check`
- **Action** : `open_assistant` avec message complet

### 8. **EVENING_PLAN** 🌙
- **Quand** : Au moment du rappel soir (`eveningTime`)
- **Condition** : Aucune tâche planifiée pour demain
- **Contenu** : "Planifier demain prend 2 minutes. Ton esprit te remerciera."
- **Titre push** : `🌙 Planifie demain`
- **Action** : `open_assistant` avec message complet

---

## 🔧 Intégration Backend

### Scheduler (`NotificationScheduler.js`)

#### Injection dans les créneaux existants

**Matin** (`morningTime`) :
```javascript
callback: async (date) => {
    await this.notificationService.scheduleMorningAnchor(userId, date);
    await this.notificationService.scheduleMorningNotification(userId, date);
}
```

**Midi** (`noonTime`) :
```javascript
callback: async (date) => {
    await this.notificationService.scheduleNoonNotification(userId, date);
    await this.notificationService.scheduleLunchBreak(userId, date);
}
```

**Soir** (`eveningTime`) :
```javascript
callback: async (date) => {
    await this.notificationService.scheduleEveningNotification(userId, date);
    await this.notificationService.scheduleEveningPlan(userId, date);
}
```

#### Scan automatique des fenêtres de focus

**Cron job** : `*/10 9-18 * * *` (toutes les 10 minutes entre 9h et 18h)
```javascript
scheduleFocusWindowScan() {
    const job = cron.schedule('*/10 9-18 * * *', async () => {
        // Scan tous les utilisateurs avec notifications activées
        // Appelle scheduleFocusWindow() pour chaque utilisateur
    });
}
```

#### IDs de jobs uniques

Chaque job cron utilise un `label` unique pour éviter les doublons :
- `morning` (MORNING_ANCHOR + MORNING_REMINDER)
- `noon` (NOON_CHECK + LUNCH_BREAK)
- `afternoon` (AFTERNOON_REMINDER)
- `evening` (EVENING_PLANNING + EVENING_PLAN)
- `stress-premium` (STRESS_CHECK_PREMIUM)
- `mood-premium` (MOOD_CHECK_PREMIUM)

### Notification de fin de session Deep Work

**Fichier** : `lib/deepwork/DeepWorkScheduler.js`

Lors de l'auto-complétion d'une session (quand le temps planifié est écoulé) :
```javascript
async completeSession(session) {
    // ... mise à jour de la session ...
    
    // Création de la notification FOCUS_END
    await NotificationService.createNotification(
        session.user.id,
        'FOCUS_END',
        content,
        now,
        {
            pushTitle: '⏱️ Session terminée',
            pushBody: 'Bien joué. Un pas de plus vers tes objectifs.',
            assistantMessage: content
        }
    );
}
```

### Titres de notifications

**Fichier** : `src/services/notification-titles.js`

Tous les nouveaux types ont été ajoutés avec leurs titres :
```javascript
'MORNING_ANCHOR': '🌅 Your day is ready',
'FOCUS_WINDOW': '🎯 You have time to focus',
'FOCUS_END': '⏱️ Session terminée',
'LUNCH_BREAK': '🍽️ Time to pause',
'POST_LUNCH_RESTART': '🔁 Ready to restart ?',
'STRESS_CHECK_PREMIUM': '🧠 Check-in stress',
'MOOD_CHECK_PREMIUM': '🙂 Check-in humeur',
'EVENING_PLAN': '🌙 Plan tomorrow'
```

### Fallback push-only

Si WhatsApp est indisponible, les notifications sont envoyées uniquement en push (pas de message WhatsApp).

---

## 📱 Compatibilité Application Mobile

### ✅ Aucun changement UI requis

Les nouveaux scénarios utilisent **exactement les mêmes préférences existantes** :

- `isEnabled` : Activation générale des notifications
- `pushEnabled` : Activation des notifications push
- `morningTime`, `noonTime`, `eveningTime` : Horaires existants
- `stressWindows`, `moodWindows` : Fenêtres existantes pour les check-ins Premium
- `focusEnabled` : Activation des notifications de focus (utilisé pour FOCUS_WINDOW)

### ✅ Gestion automatique des notifications

Le hook `usePushNotifications` gère déjà tous les nouveaux types via le système générique :

**Format de payload** (identique pour tous les nouveaux scénarios) :
```json
{
  "action": "open_assistant",
  "message": "Contenu complet du message",
  "type": "MORNING_ANCHOR|FOCUS_WINDOW|...",
  "notificationId": "..."
}
```

**Comportement** :
1. Notification reçue → affichée dans le système de notifications
2. Utilisateur tape sur la notification → `handleNotificationResponse()` est appelé
3. Détection de `action: "open_assistant"` → navigation vers `/(tabs)/assistant`
4. Message complet passé en paramètre `preset` → pré-rempli dans l'assistant IA

### ✅ Check-ins Premium

Les notifications `STRESS_CHECK_PREMIUM` et `MOOD_CHECK_PREMIUM` utilisent le même système que les check-ins existants :
- Navigation vers l'assistant IA avec le message
- L'assistant peut ensuite rediriger vers Analytics si nécessaire

---

## 🔍 Points d'attention

### 1. Scan des fenêtres de focus

Le scan automatique (`FOCUS_WINDOW`) :
- ✅ Fonctionne uniquement si `focusEnabled: true` dans les préférences
- ✅ Ne se déclenche pas si une session deep work est active
- ✅ Limité à 1 notification par jour (évite le spam)
- ✅ Détecte des fenêtres libres de ≥25 minutes

### 2. Notifications Premium

`STRESS_CHECK_PREMIUM` et `MOOD_CHECK_PREMIUM` :
- ✅ Vérifient automatiquement le statut Premium côté backend
- ✅ Ne sont pas envoyées aux utilisateurs Freemium
- ✅ Utilisent les fenêtres `stressWindows` et `moodWindows` existantes

### 3. Fin de session Deep Work

La notification `FOCUS_END` :
- ✅ Créée automatiquement lors de l'auto-complétion
- ✅ Respecte les préférences `isEnabled` et `pushEnabled`
- ✅ Contient la durée planifiée vs réelle

### 4. Post-Lunch Restart

La notification `POST_LUNCH_RESTART` :
- ✅ Déclenchée automatiquement 30-90 minutes après `LUNCH_BREAK`
- ✅ Délai aléatoire pour éviter la routine
- ✅ Nécessite une fenêtre libre de ≥20 minutes

---

## 📊 Résumé des préférences utilisées

| Scénario | Préférences utilisées |
|----------|----------------------|
| MORNING_ANCHOR | `morningReminder`, `morningTime`, `isEnabled`, `pushEnabled` |
| FOCUS_WINDOW | `isEnabled`, `pushEnabled`, `focusEnabled` |
| FOCUS_END | `isEnabled`, `pushEnabled` |
| LUNCH_BREAK | `noonReminder`, `noonTime`, `isEnabled`, `pushEnabled` |
| POST_LUNCH_RESTART | `isEnabled`, `pushEnabled` |
| STRESS_CHECK_PREMIUM | `stressWindows`, `isEnabled`, `pushEnabled` |
| MOOD_CHECK_PREMIUM | `moodWindows`, `isEnabled`, `pushEnabled` |
| EVENING_PLAN | `eveningReminder`, `eveningTime`, `isEnabled`, `pushEnabled` |

---

## ✅ Validation

### Tests à effectuer

1. **MORNING_ANCHOR** : Vérifier que la notification arrive au `morningTime` avec le résumé de la journée
2. **FOCUS_WINDOW** : Vérifier qu'une notification arrive quand une fenêtre libre est détectée (entre 9h-18h)
3. **FOCUS_END** : Démarrer une session deep work, attendre la fin automatique, vérifier la notification
4. **LUNCH_BREAK** : Vérifier la notification au `noonTime` si le matin était dense
5. **POST_LUNCH_RESTART** : Vérifier la notification 30-90 min après `LUNCH_BREAK`
6. **STRESS_CHECK_PREMIUM** : Vérifier la notification à l'heure configurée (utilisateur Premium uniquement)
7. **MOOD_CHECK_PREMIUM** : Vérifier la notification à l'heure configurée (utilisateur Premium uniquement)
8. **EVENING_PLAN** : Vérifier la notification au `eveningTime` si aucune tâche n'est planifiée pour demain

### Vérifications côté mobile

- ✅ Les notifications s'affichent correctement
- ✅ Le tap sur une notification ouvre l'assistant IA
- ✅ Le message est pré-rempli dans l'assistant
- ✅ Les permissions push sont respectées
- ✅ Les préférences `isEnabled` et `pushEnabled` sont respectées

---

## 📝 Notes

- **Aucun changement UI mobile requis** : Les nouveaux scénarios s'appuient sur les préférences existantes
- **Titres en anglais** : Les nouveaux scénarios utilisent des titres en anglais (à traduire si nécessaire)
- **Compatibilité totale** : Le système de notifications mobile existant gère automatiquement tous les nouveaux types
- **Fallback push-only** : Si WhatsApp est indisponible, les notifications sont envoyées uniquement en push

---

**Date de création** : 2024
**Dernière mise à jour** : 2024
