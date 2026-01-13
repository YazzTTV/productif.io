# 🧪 Guide de Tests Freemium - Productif.io

Ce guide pratique vous permet de tester rapidement toutes les fonctionnalités freemium de l'application.

---

## 📋 Prérequis

1. **Compte Free** : Avoir un compte utilisateur sans abonnement Premium
2. **Compte Premium** (optionnel) : Pour tester les différences
3. **Outils** :
   - Postman / Insomnia pour tester les APIs
   - App mobile ou web pour tester l'UX
   - Console navigateur / logs React Native pour voir les erreurs

---

## 🔍 Tests API Backend

### **1. Test Focus Sessions**

#### Test 1.1 : Session unique autorisée
```bash
POST /api/deepwork/agent
Headers: Authorization: Bearer <token>
Body: {
  "plannedDuration": 25,
  "type": "deepwork",
  "description": "Test session"
}
```
✅ **Attendu** : `200 OK` avec `session.id`

#### Test 1.2 : Limite atteinte (2e session le même jour)
```bash
# Relancer la même requête immédiatement
POST /api/deepwork/agent
```
✅ **Attendu** : `403 Forbidden` avec :
```json
{
  "error": "Limite quotidienne de sessions Focus atteinte...",
  "locked": true,
  "feature": "focus_session",
  "plan": "free",
  "usage": { "used": 1, "limit": 1, "period": "day" }
}
```

#### Test 1.3 : Durée max (31 minutes)
```bash
POST /api/deepwork/agent
Body: {
  "plannedDuration": 31,
  "type": "deepwork"
}
```
✅ **Attendu** : `403 Forbidden` avec message sur la durée max

---

### **2. Test Habitudes**

#### Test 2.1 : Création jusqu'à la limite
```bash
# Créer 3 habitudes successivement
POST /api/habits
Body: {
  "name": "Habitude 1",
  "daysOfWeek": ["monday", "tuesday"],
  "frequency": "daily"
}
```
✅ **Attendu** : `200 OK` pour les 3 premières

#### Test 2.2 : Limite atteinte (4e habitude)
```bash
POST /api/habits
Body: {
  "name": "Habitude 4",
  "daysOfWeek": ["monday"],
  "frequency": "daily"
}
```
✅ **Attendu** : `403 Forbidden` avec :
```json
{
  "error": "Limite de 3 habitudes atteinte avec le plan gratuit",
  "locked": true,
  "feature": "habits",
  "usage": { "used": 3, "limit": 3 }
}
```

---

### **3. Test Plan My Day**

#### Test 3.1 : Limite d'événements (≤ 3)
```bash
POST /api/planning/daily-events
Body: {
  "events": [
    { "title": "Tâche 1", "start": "2024-01-01T09:00:00Z", "durationMinutes": 60 },
    { "title": "Tâche 2", "start": "2024-01-01T10:00:00Z", "durationMinutes": 60 },
    { "title": "Tâche 3", "start": "2024-01-01T11:00:00Z", "durationMinutes": 60 }
  ]
}
```
✅ **Attendu** : `200 OK`

#### Test 3.2 : Limite dépassée (> 3)
```bash
POST /api/planning/daily-events
Body: {
  "events": [
    { "title": "Tâche 1", "start": "2024-01-01T09:00:00Z", "durationMinutes": 60 },
    { "title": "Tâche 2", "start": "2024-01-01T10:00:00Z", "durationMinutes": 60 },
    { "title": "Tâche 3", "start": "2024-01-01T11:00:00Z", "durationMinutes": 60 },
    { "title": "Tâche 4", "start": "2024-01-01T12:00:00Z", "durationMinutes": 60 }
  ]
}
```
✅ **Attendu** : `403 Forbidden` avec :
```json
{
  "error": "Plan My Day limité à 3 événements en mode gratuit",
  "locked": true,
  "feature": "plan_my_day",
  "usage": { "requested": 4, "limit": 3 }
}
```

---

### **4. Test Leaderboard**

#### Test 4.1 : Leaderboard global en free
```bash
GET /api/gamification/leaderboard?limit=50&includeUserRank=true
```
✅ **Attendu** : `403 Forbidden` avec :
```json
{
  "error": "Le classement global est réservé au plan Premium",
  "locked": true,
  "feature": "leaderboard_global",
  "plan": "free"
}
```

#### Test 4.2 : Leaderboard XP global
```bash
GET /api/xp/leaderboard?range=all&limit=10
```
✅ **Attendu** : `403 Forbidden` (même payload)

---

### **5. Test Analytics**

#### Test 5.1 : Analytics avec limite (7 jours)
```bash
GET /api/behavior/analytics?days=7
```
✅ **Attendu** : `200 OK` avec données des 7 derniers jours

#### Test 5.2 : Analytics dépassant la limite (30 jours)
```bash
GET /api/behavior/analytics?days=30
```
✅ **Attendu** : `403 Forbidden` avec :
```json
{
  "error": "Analytics détaillés réservés au plan Premium (max 7 jours en freemium)",
  "locked": true,
  "feature": "analytics",
  "usage": { "requestedDays": 30, "allowedDays": 7 }
}
```

#### Test 5.3 : Analytics sans paramètre (défaut)
```bash
GET /api/behavior/analytics
```
✅ **Attendu** : `200 OK` avec 7 jours par défaut (limite free)

---

### **6. Test Historique Check-ins**

#### Test 6.1 : Historique avec limite (7 jours)
```bash
GET /api/behavior/agent/checkin?days=7
```
✅ **Attendu** : `200 OK`

#### Test 6.2 : Historique dépassant la limite (30 jours)
```bash
GET /api/behavior/agent/checkin?days=30
```
✅ **Attendu** : `403 Forbidden` avec :
```json
{
  "error": "Historique détaillé réservé au plan Premium (max 7 jours en freemium)",
  "locked": true,
  "feature": "history"
}
```

---

### **7. Test Endpoints Auth**

#### Test 7.1 : `/api/auth/me`
```bash
GET /api/auth/me
Headers: Authorization: Bearer <token>
```
✅ **Attendu** : `200 OK` avec :
```json
{
  "user": {
    "id": "...",
    "email": "...",
    "plan": "free",
    "planLimits": {
      "focusPerDay": 1,
      "maxHabits": 3,
      "planMyDayMode": "preview",
      "maxPlanMyDayEvents": 3,
      "allowGlobalLeaderboard": false,
      "analyticsRetentionDays": 7,
      "historyDepthDays": 7
    },
    "isPremium": false
  }
}
```

#### Test 7.2 : `/api/users/me`
```bash
GET /api/users/me
```
✅ **Attendu** : Même structure que `/api/auth/me`

#### Test 7.3 : `/api/user/trial-status`
```bash
GET /api/user/trial-status
```
✅ **Attendu** : `200 OK` avec :
```json
{
  "status": "freemium",
  "plan": "free",
  "planLimits": {...},
  "isPremium": false,
  "hasAccess": true
}
```

---

## 📱 Tests Mobile (UX)

### **8. Test Focus Mobile**

#### Test 8.1 : Parcours Focus après session gratuite
1. ✅ Ouvrir l'app mobile
2. ✅ Aller dans l'onglet Focus
3. ✅ Lancer une session Focus (25 min)
4. ✅ Attendre la fin ou arrêter la session
5. ✅ Tenter de lancer une 2e session le même jour
6. ✅ **Vérifier** : Alerte "Focus limité" s'affiche avec message "1 session Focus par jour en freemium"
7. ✅ **Vérifier** : Le bouton "Passer en Premium" redirige vers `/paywall`

---

### **9. Test Plan My Day Mobile**

#### Test 9.1 : Bandeau d'aperçu
1. ✅ Ouvrir Plan My Day
2. ✅ **Vérifier** : Bandeau "Aperçu Plan My Day" s'affiche en haut
3. ✅ **Vérifier** : Message "Accédez à une version limitée (max 3 tâches)"
4. ✅ **Vérifier** : Bouton "Passer en Premium" présent

#### Test 9.2 : Transcription avec > 3 tâches
1. ✅ Lancer l'enregistrement vocal
2. ✅ Dire : "Je dois faire 5 tâches : réviser maths, faire les devoirs, préparer l'examen, lire le chapitre, faire les exercices"
3. ✅ Attendre la transcription
4. ✅ **Vérifier** : Seulement 3 tâches sont affichées
5. ✅ **Vérifier** : Notice "Aperçu: seules 3 tâches sont incluses" s'affiche
6. ✅ **Vérifier** : Bouton "Upgrade" présent dans la notice

#### Test 9.3 : Création d'événements > 3
1. ✅ Essayer de créer 4 événements via l'API
2. ✅ **Vérifier** : Erreur 403 avec message "Plan My Day limité à 3 événements"
3. ✅ **Vérifier** : L'app affiche une alerte Premium

---

### **10. Test Leaderboard Mobile**

#### Test 10.1 : Onglet global verrouillé
1. ✅ Ouvrir Leaderboard
2. ✅ **Vérifier** : L'onglet "global" est visible
3. ✅ Cliquer sur l'onglet "global"
4. ✅ **Vérifier** : Redirection vers `/paywall` OU prompt Premium s'affiche

#### Test 10.2 : Erreur 403 sur leaderboard global
1. ✅ Forcer l'appel API `/api/gamification/leaderboard` (si possible)
2. ✅ **Vérifier** : Alerte "Leaderboard Premium" s'affiche
3. ✅ **Vérifier** : Bouton "Passer en Premium" redirige vers `/paywall`

---

### **11. Test Analytics Mobile**

#### Test 11.1 : Bandeau d'aperçu
1. ✅ Ouvrir Analytics
2. ✅ **Vérifier** : Bandeau "Analytics en aperçu" s'affiche
3. ✅ **Vérifier** : Message "Vous voyez les 7 derniers jours"
4. ✅ **Vérifier** : Bouton "Upgrade" présent

#### Test 11.2 : Erreur 403 sur analytics > 7 jours
1. ✅ Tenter de charger 30 jours (si possible via paramètre)
2. ✅ **Vérifier** : Alerte "Analytics Premium" s'affiche
3. ✅ **Vérifier** : Bouton "Passer en Premium" redirige vers `/paywall`

---

## ✅ Checklist de Validation

### Backend
- [ ] Focus : 1 session/jour → 403
- [ ] Focus : durée > 30 min → 403
- [ ] Habitudes : 3 habitudes OK, 4e → 403
- [ ] Plan My Day : ≤ 3 événements OK, > 3 → 403
- [ ] Leaderboard global : 403 en free
- [ ] Analytics : 7 jours OK, > 7 jours → 403
- [ ] Historique check-ins : 7 jours OK, > 7 jours → 403
- [ ] `/api/auth/me` expose `plan`, `planLimits`, `isPremium`
- [ ] `/api/users/me` expose `plan`, `planLimits`, `isPremium`
- [ ] `/api/user/trial-status` retourne `status: "freemium"` en free

### Mobile UX
- [ ] Focus : alerte après 1 session
- [ ] Plan My Day : bandeau "Aperçu" visible
- [ ] Plan My Day : troncature à 3 tâches
- [ ] Plan My Day : notice après transcription
- [ ] Leaderboard : onglet global verrouillé
- [ ] Leaderboard : alerte Premium sur erreur 403
- [ ] Analytics : bandeau "7 jours" visible
- [ ] Analytics : alerte Premium sur erreur 403
- [ ] Tous les CTAs "Upgrade" / "Passer en Premium" redirigent vers `/paywall`

---

## 🐛 Problèmes Courants

### Erreur 401 au lieu de 403
- **Cause** : Token expiré ou invalide
- **Solution** : Se reconnecter et réessayer

### Bandeaux non affichés
- **Cause** : `planLimits` non chargé
- **Solution** : Vérifier que `authService.checkAuth()` retourne bien `planLimits`

### Erreur 403 sans alerte Premium
- **Cause** : Gestion d'erreur manquante dans le composant
- **Solution** : Vérifier que le catch détecte bien "premium" ou `status === 403`

---

## 📝 Notes de Test

- **Date** : _______________
- **Testeur** : _______________
- **Environnement** : [ ] Dev [ ] Staging [ ] Production
- **Compte testé** : _______________
- **Résultats** : _______________

---

**Dernière mise à jour** : $(date)
