# Productif.io — Vue d’ensemble (pour ChatGPT)

Ce document résume le fonctionnement de Productif.io (web + mobile) pour répondre aux questions ou générer de l’aide contextuelle.

## Périmètre et plateformes
- **Web** : Next.js (app router), TypeScript, Prisma/PostgreSQL, Stripe, NextAuth, API internes sous `/api`.
- **Mobile** : Expo/React Native (dossier `mobile-app-new`), routes Expo Router. Certaines fonctionnalités s’appuient sur les mêmes API (BASE_URL configurable).

## Parcours utilisateur
1. **Onboarding** : écrans d’intro, sélection de langue, connexion/inscription (email, Apple, Google). Onboarding questions/symptômes → profil/productivité et plan personnalisé.
2. **Dashboard** : tâches du jour, habitudes, séries, deep work, analytics, gamification (streaks, XP/levels).
3. **Assistant IA** : chat pour planifier, suivre tâches/habitudes, lancer des sessions deep work, journaling, apprentissage vocal.
4. **Paywall/Trial** : essai gratuit, upgrade Stripe, écrans d’upgrade (web et mobile).

## Fonctionnalités principales (web)
- **Tâches** : CRUD, priorité, énergie, due date, complétion, liste du jour.
- **Habitudes** : fréquences, jours de la semaine, entries quotidiennes, séries/streaks.
- **Deep Work** : sessions (type deepwork/focus), time entries liés, statut (active/paused/completed/cancelled).
- **Analytics** : tâches complétées, habitudes, temps de deep work, tendances hebdo, leaderboard.
- **Notifications** : préférences, envoi (WhatsApp/Push selon implémentation), horaires.
- **Gamification** : streaks, niveaux, XP (voir section XP).

## Fonctionnalités principales (mobile `mobile-app-new`)
- **Onboarding mobile** : écrans `(onboarding-new)` (intro, language, connection, question, plan, social proof, paiement).
- **Tabs** : `index` (accueil), `assistant`, `more` (réglages), `habits` (manager), `tasks` (optionnel), etc.
- **Assistant** : deep work, journal vocal, apprentissage vocal, planification, stats modales, tâches du jour, habitudes.
- **Réglages** : thème, langue, notifications, profil, upgrade.
- **iOS/Android** : icônes dans `assets/images/icon.png`, App Icon iOS dans `ios/Productifio/Images.xcassets`.

## Authentification
- **Web** : NextAuth (cookies/sessions), routes `/api/auth/login`, `/api/auth/register`.
- **Mobile** : appels API via `mobile-app-new/lib/api.ts` (token stocké via `TokenStorage`).

## Backend / API internes (exemples)
- Auth : `/api/auth/login`, `/api/auth/register`.
- Utilisateur : `/api/users/me`.
- Tâches : `/api/tasks/...` (selon implémentation).
- Habitudes : `/api/habits`.
- Deep Work : `/api/deepwork/agent` (POST pour créer, GET `status=active`, PATCH `action=complete|cancel|pause|resume`).
- Analytics : `/api/dashboard/deepwork-stats`, `/api/dashboard/...`.
- XP (ajouté récemment) :
  - `POST /api/xp/events` : enregistrer un événement XP (type, payload) et créditer l’utilisateur.
  - `GET /api/xp/status` : totalXp, level, nextLevelXp, progress.
  - `GET /api/xp/leaderboard?range=weekly|all&limit=10` : leaderboard.
  - `GET /api/xp/weekly-challenge` : progression perso sur 7 jours.

## Modèle de données (extraits Prisma)
- `User` (+ `UserGamification`, `Session`, `TimeEntry`, `DeepWorkSession`, `Task`, `Habit`, `HabitEntry`…).
- `UserGamification` : `totalXp`, `nextLevelXp`, `level`, streaks, points.
- `XpEvent` : userId, type, xpAwarded, metadata, createdAt.
- `DeepWorkSession` : `plannedDuration`, `status`, `timeEntryId`.

## XP / Gamification (résumé)
- Événements possibles : `task_complete`, `task_priority`, `habit_check`, `habit_streak_bonus`, `deepwork_complete`, `journal_entry`, `learning_entry`, `achievement`.
- Barème : ex. tâche 10–20 XP, habitude 8 XP (+ bonus streak), deepwork 1 XP/min + paliers (25/50/90 min), journal 8 XP, learning 10 XP + 1 XP/2 min.
- Niveaux : XP pour prochain niveau = 100 + 30*(n-1) ; progression calculée à chaque event.

## Deep Work (mobile)
- Création : `assistantService.startDeepWorkSession(minutes, type='deepwork', description)`.
- Fin : `assistantService.endDeepWorkSession(id, action='complete')`, fallback `cancel` en cas d’échec.
- L’app tente de récupérer une session active (`getActiveDeepWorkSession`) et de la clôturer si besoin pour éviter les blocages “session déjà en cours”.

## Points d’attention
- **API_BASE_URL mobile** : doit pointer vers le backend qui expose les routes `/api/xp/...` et `/api/deepwork/...`. Si mal configuré, les appels renvoient du HTML (404).
- **Certificats SSL** : lors des push/pull dans certains environnements sandboxés, le CA peut manquer (à faire depuis un poste configuré).
- **Migrations** : migration XP `prisma/migrations/20251208_add_xp_system/` doit être appliquée (Prisma migrate) pour utiliser XP.

## Dossiers utiles
- Web : `app/` (routes Next.js), `components/`, `lib/`.
- Mobile : `mobile-app-new/` (Expo), onglets dans `app/(tabs)/`, onboarding dans `app/(onboarding-new)/`.
- XP : `app/api/xp/`, `lib/xp.ts`, `prisma/schema.prisma`, `prisma/schema.web.prisma`.
- Deep Work backend : `app/api/deepwork/agent/...` (API web), mobile consomme via `assistantService`.

## Ce que ChatGPT peut faire avec ces infos
- Expliquer un flux (onboarding, deep work, tâches/habitudes, assistant).
- Guider l’utilisateur pour résoudre un blocage (ex. session deep work déjà active, config API_BASE_URL).
- Donner les endpoints ou structures de données (UserGamification, XpEvent).
- Suggérer les champs essentiels pour une requête API (type, payload).

Fin du résumé. Pour plus de détail, ouvrir les fichiers correspondants dans le repo. 

