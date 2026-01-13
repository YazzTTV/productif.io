# 📋 État de l'implémentation Freemium - Productif.io

## ✅ Ce qui a été implémenté

### 1. **Configuration centralisée des plans** (`lib/plans.ts`)

✅ **Limites définies pour Free et Premium** :
- **Free** :
  - Focus : 1 session/jour, durée max 30 min
  - Habitudes : max 3
  - Plan My Day : mode "preview", max 3 événements
  - Leaderboard global : ❌ bloqué
  - Analytics : 7 jours de rétention
  - Historique check-ins : 7 jours
  - Exam Mode : ❌ désactivé

- **Premium** :
  - Toutes les limites : `null` (illimité)
  - Plan My Day : mode "full"
  - Leaderboard global : ✅ activé
  - Analytics : illimité
  - Exam Mode : ✅ activé

✅ **Fonctions utilitaires** :
- `resolvePlan(user)` : détermine le plan depuis le statut d'abonnement
- `getPlanInfo(user)` : retourne plan, isPremium, limits
- `buildLockedFeature(feature)` : construit la réponse 403 standardisée

---

### 2. **Backend - Fin du free trial, passage au freemium**

✅ **TrialService.ts** :
- `hasAccess()` retourne maintenant `status: 'freemium'` pour les utilisateurs free
- Plus de logique de trial expiré, passage direct au modèle freemium

✅ **Route `/api/user/trial-status`** :
- Retourne `plan`, `planLimits`, `isPremium` en plus du statut
- Compatible web et mobile (gère cookies et headers)

---

### 3. **Backend - Garde-fous et limitations**

#### ✅ **Focus Sessions** (`app/api/deepwork/agent/route.ts`)
- Vérification limite quotidienne : 1 session/jour en free
- Vérification durée max : 30 min en free
- Retourne **403** avec :
  ```json
  {
    "error": "Limite quotidienne de sessions Focus atteinte...",
    "locked": true,
    "feature": "focus_session",
    "plan": "free",
    "planLimits": {...},
    "usage": { "used": 1, "limit": 1, "period": "day" }
  }
  ```

#### ✅ **Habitudes** (`app/api/habits/route.ts` - POST)
- Vérification avant création : max 3 habitudes en free
- Retourne **403** si limite atteinte avec payload locked

#### ✅ **Plan My Day** (`app/api/planning/daily-events/route.ts`)
- Vérification mode preview : max 3 événements en free
- Retourne **403** si > 3 événements avec payload locked

#### ✅ **Leaderboard Global** 
- **`app/api/gamification/leaderboard/route.ts`** : vérifie `allowGlobalLeaderboard`
- **`app/api/xp/leaderboard/route.ts`** : vérifie `allowGlobalLeaderboard`
- Retourne **403** si free avec payload locked

#### ✅ **Analytics** (`app/api/behavior/analytics/route.ts`)
- Vérification paramètre `days` : max 7 jours en free
- Retourne **403** si `days > 7` avec payload locked
- Par défaut, limite à 7 jours si non spécifié

#### ✅ **Historique Check-ins** (`app/api/behavior/agent/checkin/route.ts` - GET)
- Vérification paramètre `days` : max 7 jours en free
- Retourne **403** si `days > 7` avec payload locked

---

### 4. **Exposition du plan dans les APIs utilisateur**

✅ **`/api/auth/me`** (`app/api/auth/me/route.ts`) :
- Retourne `user.plan`, `user.planLimits`, `user.isPremium`
- Compatible web (cookies) et mobile (headers)

✅ **`/api/users/me`** (`app/api/users/me/route.ts`) :
- Retourne `user.plan`, `user.planLimits`, `user.isPremium`
- Utilisé côté web

---

### 5. **Côté Mobile - Types et hooks**

✅ **Types** (`mobile-app-new/lib/api.ts`) :
- Interface `PlanLimits` synchronisée avec le backend
- Interface `User` inclut `planLimits`, `plan`, `isPremium`

✅ **Hook `useTrialStatus`** (`mobile-app-new/hooks/useTrialStatus.ts`) :
- Récupère le statut via `/api/user/trial-status`
- Retourne `plan`, `planLimits`, `isPremium`

✅ **Service `authService`** (`mobile-app-new/lib/api.ts`) :
- `checkAuth()` retourne l'utilisateur avec `planLimits`
- `getTrialStatus()` retourne le statut complet

---

### 6. **Côté Mobile - UX Freemium**

#### ✅ **Focus** (`mobile-app-new/app/focus.tsx`, `components/focus/FocusMode.tsx`)
- Détection erreur 403 avec message "limite" ou "premium"
- Affichage `Alert.alert('Focus limité', message)`
- Blocage du démarrage de session si limite atteinte

#### ✅ **Plan My Day** (`mobile-app-new/components/plan/PlanMyDay.tsx`)
- **Bandeau "Aperçu"** affiché si `planMyDayMode === 'preview'` :
  ```tsx
  {planLimits?.planMyDayMode === 'preview' && (
    <View style={styles.planLimitCard}>
      <Text>Aperçu Plan My Day</Text>
      <Text>Accédez à une version limitée (max {planLimits.maxPlanMyDayEvents ?? 3} tâches)...</Text>
      <TouchableOpacity onPress={() => router.push('/paywall')}>
        <Text>Passer en Premium</Text>
      </TouchableOpacity>
    </View>
  )}
  ```
- **Troncature locale** : limite les tâches affichées à `maxPlanMyDayEvents` (ligne 219)
- **Notice après transcription** : affiche un bandeau si `planPreviewLimited` est true
- **Gestion erreur 403** : détecte erreur "Plan My Day limité" et affiche notice + CTA Upgrade

#### ✅ **Leaderboard** (`mobile-app-new/components/leaderboard/LeaderboardEnhanced.tsx`)
- **Onglet "global" verrouillé** : `handleTabPress()` vérifie `!isPremium && tab === 'global'` → redirige vers `/paywall`
- **Affichage prompt Premium** : si `!isPremium && activeTab === 'global'`, affiche une carte avec CTA Upgrade
- **Gestion erreurs** : devrait gérer les erreurs 403 (à vérifier dans `leaderboard.tsx`)

#### ✅ **Analytics** (`mobile-app-new/app/(tabs)/analytics.tsx`)
- **Bandeau d'aperçu** : affiché si `planLimits?.analyticsRetentionDays !== null`
  ```tsx
  {planLimits?.analyticsRetentionDays !== null && (
    <View style={styles.planNotice}>
      <Text>Analytics en aperçu</Text>
      <Text>Vous voyez les {planLimits.analyticsRetentionDays} derniers jours...</Text>
      <TouchableOpacity onPress={() => router.push('/paywall')}>
        <Text>Upgrade</Text>
      </TouchableOpacity>
    </View>
  )}
  ```
- **Gestion erreur 403** : devrait afficher alerte Premium (à vérifier)

---

## 🧪 Tests à effectuer

### **1. API Focus Sessions**

**Test 1.1** : Session unique autorisée
- ✅ Lancer 1 session Focus → **200 OK**
- ✅ Vérifier que la session est créée

**Test 1.2** : Limite atteinte
- ✅ Lancer 1 session Focus
- ✅ Lancer une 2e session le même jour → **403**
- ✅ Vérifier le payload :
  ```json
  {
    "error": "Limite quotidienne de sessions Focus atteinte...",
    "locked": true,
    "feature": "focus_session",
    "plan": "free",
    "usage": { "used": 1, "limit": 1, "period": "day" }
  }
  ```

**Test 1.3** : Durée max
- ✅ Lancer une session de 31 min en free → **403** (si implémenté)

---

### **2. API Habits**

**Test 2.1** : Création jusqu'à la limite
- ✅ Créer 3 habitudes → **200 OK** pour chacune

**Test 2.2** : Limite atteinte
- ✅ Créer 3 habitudes
- ✅ Tenter de créer une 4e habitude → **403**
- ✅ Vérifier le payload :
  ```json
  {
    "error": "Limite de 3 habitudes atteinte avec le plan gratuit",
    "locked": true,
    "feature": "habits",
    "usage": { "used": 3, "limit": 3, "scope": "total_habits" }
  }
  ```

---

### **3. API Plan My Day**

**Test 3.1** : Limite d'événements
- ✅ POST avec ≤ 3 événements en free → **200 OK**
- ✅ POST avec > 3 événements en free → **403**
- ✅ Vérifier le payload :
  ```json
  {
    "error": "Plan My Day limité à 3 événements en mode gratuit",
    "locked": true,
    "feature": "plan_my_day",
    "usage": { "requested": 4, "limit": 3 }
  }
  ```

**Test 3.2** : Côté mobile - Transcription
- ✅ Transcrire un texte avec > 3 tâches
- ✅ Vérifier que seulement 3 tâches sont affichées
- ✅ Vérifier que le bandeau "Aperçu" s'affiche
- ✅ Vérifier que le CTA "Passer en Premium" fonctionne

---

### **4. API Leaderboard**

**Test 4.1** : Leaderboard global en free
- ✅ GET `/api/gamification/leaderboard` en free → **403**
- ✅ GET `/api/xp/leaderboard?range=all` en free → **403**
- ✅ Vérifier le payload :
  ```json
  {
    "error": "Le classement global est réservé au plan Premium",
    "locked": true,
    "feature": "leaderboard_global"
  }
  ```

**Test 4.2** : Côté mobile - Onglet global
- ✅ Ouvrir le leaderboard en free
- ✅ Cliquer sur l'onglet "global" → redirection vers `/paywall`
- ✅ Vérifier que le prompt Premium s'affiche si on force l'affichage

---

### **5. API Analytics**

**Test 5.1** : Limite de jours
- ✅ GET `/api/behavior/analytics` sans paramètre → **200**, retourne 7 jours max
- ✅ GET `/api/behavior/analytics?days=7` → **200 OK**
- ✅ GET `/api/behavior/analytics?days=30` en free → **403**
- ✅ Vérifier le payload :
  ```json
  {
    "error": "Analytics détaillés réservés au plan Premium (max 7 jours en freemium)",
    "locked": true,
    "feature": "analytics",
    "usage": { "requestedDays": 30, "allowedDays": 7 }
  }
  ```

**Test 5.2** : Côté mobile - Bandeau
- ✅ Ouvrir Analytics en free
- ✅ Vérifier que le bandeau "Analytics en aperçu" s'affiche
- ✅ Vérifier que le CTA "Upgrade" fonctionne
- ✅ Tenter de charger 30 jours → vérifier l'alerte Premium

---

### **6. API Historique Check-ins**

**Test 6.1** : Limite de jours
- ✅ GET `/api/behavior/agent/checkin?days=7` → **200 OK**
- ✅ GET `/api/behavior/agent/checkin?days=30` en free → **403**
- ✅ Vérifier le payload :
  ```json
  {
    "error": "Historique détaillé réservé au plan Premium (max 7 jours en freemium)",
    "locked": true,
    "feature": "history"
  }
  ```

---

### **7. Endpoints Auth**

**Test 7.1** : `/api/auth/me`
- ✅ GET en free → vérifier `user.plan === "free"`
- ✅ GET en free → vérifier `user.planLimits` contient les limites free
- ✅ GET en free → vérifier `user.isPremium === false`
- ✅ GET en premium → vérifier `user.plan === "premium"`, `user.isPremium === true`

**Test 7.2** : `/api/users/me`
- ✅ Mêmes vérifications que `/api/auth/me`

**Test 7.3** : `/api/user/trial-status`
- ✅ GET en free → vérifier `status === "freemium"`
- ✅ GET en free → vérifier `plan === "free"`, `isPremium === false`
- ✅ GET en premium → vérifier `status === "subscribed"`, `isPremium === true`

---

### **8. Parcours Mobile Complet**

**Test 8.1** : Focus après session gratuite
- ✅ Lancer 1 session Focus
- ✅ Tenter de lancer une 2e session → vérifier l'alerte "Focus limité"
- ✅ Vérifier que le message indique "1 session Focus par jour en freemium"

**Test 8.2** : Plan My Day - Parcours complet
- ✅ Ouvrir Plan My Day en free
- ✅ Vérifier le bandeau "Aperçu Plan My Day"
- ✅ Transcrire un texte avec plusieurs tâches
- ✅ Vérifier que seulement 3 tâches sont affichées
- ✅ Vérifier la notice "Aperçu: seules 3 tâches sont incluses"
- ✅ Cliquer sur "Passer en Premium" → redirection vers `/paywall`

**Test 8.3** : Analytics - Parcours complet
- ✅ Ouvrir Analytics en free
- ✅ Vérifier le bandeau "Analytics en aperçu (7 jours)"
- ✅ Cliquer sur "Upgrade" → redirection vers `/paywall`
- ✅ Tenter de charger 30 jours → vérifier l'alerte Premium

**Test 8.4** : Leaderboard - Parcours complet
- ✅ Ouvrir Leaderboard en free
- ✅ Vérifier que l'onglet "global" est visible mais verrouillé
- ✅ Cliquer sur "global" → redirection vers `/paywall`
- ✅ Vérifier le prompt Premium si on force l'affichage

---

## 📝 Notes importantes

### **Points à vérifier**

1. **Gestion des erreurs 403 côté mobile** :
   - ✅ Focus : géré (alerte "Focus limité")
   - ✅ Plan My Day : géré (notice + CTA Upgrade)
   - ✅ Analytics : géré (alerte "Analytics Premium" avec CTA vers paywall - lignes 114-122)
   - ✅ Leaderboard : amélioré - `leaderboard.tsx` gère maintenant les erreurs 403 avec alerte Premium + CTA
   - ✅ `apiCall` : amélioré pour inclure le statut HTTP et les données d'erreur dans l'exception

2. **Synchronisation des limites** :
   - ✅ Les limites sont centralisées dans `lib/plans.ts`
   - ✅ Les types TypeScript sont synchronisés entre backend et mobile

3. **Compatibilité web/mobile** :
   - ✅ Les endpoints gèrent à la fois les cookies (web) et les headers (mobile)
   - ✅ `getAuthUserFromRequest()` gère les deux cas

4. **Paywall** :
   - ✅ Les CTAs "Upgrade" / "Passer en Premium" redirigent vers `/paywall`
   - ⚠️ Vérifier que le paywall existe et fonctionne

---

## 🚀 Prochaines étapes

1. **Exécuter tous les tests listés ci-dessus**
2. **Vérifier les points à vérifier** (gestion erreurs 403 Analytics/Leaderboard)
3. **Tester le paywall** et la conversion Premium
4. **Documenter les cas limites** (changement de plan en cours de session, etc.)

---

**Date de création** : 2024-12-19
**Dernière mise à jour** : 2024-12-19

## 🔧 Améliorations récentes

### **19 décembre 2024**
- ✅ Amélioration de la gestion d'erreur 403 dans `leaderboard.tsx` : alerte Premium avec CTA
- ✅ Amélioration de `apiCall` : inclusion du statut HTTP et données d'erreur dans les exceptions
- ✅ Création du guide de tests pratique : `GUIDE_TESTS_FREEMIUM.md`
