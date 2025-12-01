# 📚 Documentation Complète - Application Web Productif.io

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture technique](#architecture-technique)
3. [Modèles de données Prisma](#modèles-de-données-prisma)
4. [Fonctionnalités principales](#fonctionnalités-principales)
5. [Routes API](#routes-api)
6. [Système d'authentification](#système-dauthentification)
7. [Intégrations](#intégrations)
8. [Gamification](#gamification)
9. [Notifications](#notifications)

---

## 🎯 Vue d'ensemble

**Productif.io** est une application web de productivité personnelle qui combine gestion de tâches, suivi d'habitudes, sessions de Deep Work, journaling, et un assistant IA conversationnel. L'application est construite avec **Next.js 14** (App Router), **TypeScript**, **Prisma ORM**, et **PostgreSQL**.

### Stack technique

- **Frontend** : Next.js 14, React, TypeScript, Tailwind CSS, Framer Motion
- **Backend** : Next.js API Routes, Prisma ORM
- **Base de données** : PostgreSQL
- **IA** : OpenAI GPT-4 (pour l'assistant conversationnel et l'analyse de tâches)
- **Authentification** : NextAuth.js (cookies/sessions)
- **Paiements** : Stripe
- **Messagerie** : WhatsApp (via webhooks)

---

## 🏗️ Architecture technique

### Structure des dossiers

```
app/
├── dashboard/          # Pages du dashboard utilisateur
│   ├── page.tsx        # Dashboard principal
│   ├── assistant-ia/   # Assistant IA conversationnel
│   ├── tasks/          # Gestion des tâches
│   ├── habits/         # Gestion des habitudes
│   ├── analytics/      # Statistiques et analytics
│   └── settings/       # Paramètres utilisateur
├── api/                # Routes API Next.js
│   ├── assistant/      # Endpoints de l'assistant IA
│   ├── deepwork/       # Sessions Deep Work
│   ├── tasks/          # CRUD tâches
│   ├── habits/         # CRUD habitudes
│   ├── behavior/       # Check-ins comportementaux
│   └── journal/        # Entrées de journal
└── auth/               # Authentification

lib/
├── ai/                 # Services IA (AIService, TaskAnalysisService, etc.)
├── prisma.ts           # Client Prisma
└── auth.ts             # Utilitaires d'authentification

prisma/
└── schema.prisma       # Schéma de base de données
```

### Flux de données

```
Utilisateur (Frontend)
    ↓
Next.js API Routes
    ↓
Services métier (lib/ai/, lib/services/)
    ↓
Prisma ORM
    ↓
PostgreSQL
```

---

## 🗄️ Modèles de données Prisma

### User (Utilisateur)

Modèle central qui représente un utilisateur de l'application.

```prisma
model User {
  id               String   @id @default(cuid())
  name             String?
  email            String   @unique
  password         String
  whatsappNumber   String?  @unique
  
  // Free Trial
  trialStartDate   DateTime?
  trialEndDate     DateTime?
  trialStatus      String?  @default("active")
  
  // Subscription
  subscriptionStatus   String?
  subscriptionTier     String?
  stripeCustomerId     String?  @unique
  stripeSubscriptionId String?  @unique
  
  // Relations
  tasks              Task[]
  habits             Habit[]
  deepWorkSessions   DeepWorkSession[]
  journalEntries     JournalEntry[]
  behaviorCheckIns   BehaviorCheckIn[]
  apiTokens          ApiToken[]
  // ... autres relations
}
```

**Champs clés** :
- `trialStartDate` / `trialEndDate` : Gestion de la période d'essai gratuite
- `subscriptionStatus` : État de l'abonnement (trial, active, cancelled, expired)
- `stripeCustomerId` : ID client Stripe pour les paiements

---

### Task (Tâche)

Représente une tâche à accomplir par l'utilisateur.

```prisma
model Task {
  id           String      @id @default(cuid())
  title        String
  description  String?
  dueDate      DateTime?
  userId       String
  projectId    String?
  completed    Boolean     @default(false)
  order        Int         @default(500)
  scheduledFor DateTime?
  priority     Int?        // 0-4 (0=optionnelle, 4=critique)
  energyLevel  Int?        // 0-3 (0=très faible, 3=haute)
  
  user         User        @relation(...)
  project      Project?    @relation(...)
  timeEntries  TimeEntry[]
}
```

**Champs importants** :
- `priority` : Priorité de 0 à 4 (0=optionnelle, 4=critique)
- `energyLevel` : Niveau d'énergie requis (0=très faible, 3=haute)
- `scheduledFor` : Date/heure planifiée pour la tâche
- `order` : Ordre d'affichage (pour le tri personnalisé)

---

### Habit (Habitude)

Représente une habitude quotidienne à suivre.

```prisma
model Habit {
  id          String       @id @default(cuid())
  name        String
  description String?
  color       String?
  frequency   String       // "daily", "weekly", "custom"
  daysOfWeek  String[]     // ["monday", "tuesday", ...]
  userId      String
  order       Int          @default(0)
  
  user        User         @relation(...)
  entries     HabitEntry[]
}
```

**Champs importants** :
- `daysOfWeek` : Jours de la semaine où l'habitude doit être effectuée
- `frequency` : Fréquence de l'habitude (daily, weekly, custom)

### HabitEntry (Entrée d'habitude)

Enregistre la complétion d'une habitude pour une date donnée.

```prisma
model HabitEntry {
  id        String   @id @default(cuid())
  habitId   String
  date      DateTime @db.Date
  completed Boolean  @default(false)
  note      String?
  rating    Int?     // Note 1-5 (optionnel)
  
  habit     Habit    @relation(...)
  
  @@unique([habitId, date])  // Une seule entrée par habitude/date
}
```

---

### DeepWorkSession (Session Deep Work)

Représente une session de travail focalisé.

```prisma
model DeepWorkSession {
  id              String    @id @default(cuid())
  userId          String
  timeEntryId     String    @unique
  plannedDuration Int       // Durée planifiée en minutes
  status          String    @default("active")  // active, paused, completed, cancelled
  type            String    @default("deepwork")  // deepwork, focus, pomodoro
  interruptions   Int       @default(0)
  notes           String?
  
  user            User      @relation(...)
  timeEntry       TimeEntry @relation(...)
}
```

**Statuts possibles** :
- `active` : Session en cours
- `paused` : Session mise en pause
- `completed` : Session terminée
- `cancelled` : Session annulée

**Types** :
- `deepwork` : Session Deep Work classique
- `focus` : Session de concentration
- `pomodoro` : Technique Pomodoro (25 min)

---

### JournalEntry (Entrée de journal)

Journal quotidien de l'utilisateur avec transcription audio.

```prisma
model JournalEntry {
  id            String   @id @default(cuid())
  userId        String
  date          DateTime @default(now())
  
  // Contenu / médias
  audioId       String?  // ID média WhatsApp (optionnel)
  audioUrl      String?  // URL de stockage externe
  transcription String? @db.Text
  
  // Analyse IA
  sentiment    String?  // positive, negative, neutral
  themes       Json?    // Thèmes détectés
  highlights   String[] // Points clés
  improvements String[] // Axes d'amélioration
  
  // Statut
  processed       Boolean @default(false)
  processingError String?
  
  user            User    @relation(...)
  
  @@unique([userId, date])  // Une entrée par jour
}
```

---

### BehaviorCheckIn (Check-in comportemental)

Enregistre un check-in sur l'humeur, le focus, la motivation, l'énergie ou le stress.

```prisma
model BehaviorCheckIn {
  id          String   @id @default(cuid())
  userId      String
  timestamp   DateTime @default(now())
  type        String   // mood, focus, motivation, energy, stress
  value       Int      // Score 1-10
  note        String?
  context     Json?    // Contexte (activité en cours, etc.)
  triggeredBy String   // scheduled, manual, event-based
  
  user        User     @relation(...)
}
```

**Types de check-in** :
- `mood` : Humeur (1-10)
- `focus` : Niveau de concentration (1-10)
- `motivation` : Motivation (1-10)
- `energy` : Niveau d'énergie (1-10)
- `stress` : Niveau de stress (1-10)

---

### BehaviorPattern (Pattern comportemental)

Analyse comportementale sur une période donnée.

```prisma
model BehaviorPattern {
  id              String   @id @default(cuid())
  userId          String
  startDate       DateTime
  endDate         DateTime
  patterns        Json     // Patterns détectés
  avgMood         Float?
  avgFocus        Float?
  avgMotivation   Float?
  avgEnergy       Float?
  avgStress       Float?
  insights        String[] // Insights générés par IA
  recommendations String[] // Recommandations personnalisées
  correlations    Json?    // Corrélations entre métriques
  
  user            User     @relation(...)
}
```

---

### UserConversationState (État conversationnel)

Gère l'état des conversations avec l'assistant IA (WhatsApp ou Web).

```prisma
model UserConversationState {
  id        String    @id @default(cuid())
  userId    String    @unique
  state     String    // awaiting_checkin_mood, awaiting_deepwork_duration, etc.
  data      Json?     // Données contextuelles
  expiresAt DateTime?
  
  user      User      @relation(...)
}
```

**États possibles** :
- `awaiting_checkin_mood` : En attente d'une réponse de check-in (humeur)
- `awaiting_checkin_focus` : En attente d'une réponse de check-in (focus)
- `awaiting_deepwork_duration` : En attente de la durée d'une session Deep Work
- `awaiting_task_creation` : En attente de la création d'une tâche
- etc.

---

### ApiToken (Token API)

Token d'API pour les intégrations externes (WhatsApp, etc.).

```prisma
model ApiToken {
  id          String    @id @default(cuid())
  name        String
  token       String    @unique
  userId      String
  description String?
  scopes      String[]  @default([])  // ["tasks:read", "tasks:write", ...]
  lastUsed    DateTime?
  expiresAt   DateTime?
  
  user        User      @relation(...)
}
```

**Scopes disponibles** :
- `tasks:read`, `tasks:write`
- `habits:read`, `habits:write`
- `deepwork:read`, `deepwork:write`
- `journal:read`, `journal:write`
- `behavior:read`, `behavior:write`

---

### Project (Projet)

Projet regroupant plusieurs tâches.

```prisma
model Project {
  id          String        @id @default(cuid())
  name        String
  description String?
  color       String?
  userId      String
  
  user        User          @relation(...)
  tasks       Task[]
  timeEntries TimeEntry[]
}
```

---

### TimeEntry (Entrée de temps)

Enregistre le temps passé sur une tâche ou un projet.

```prisma
model TimeEntry {
  id              String           @id @default(cuid())
  startTime       DateTime
  endTime         DateTime?
  userId          String
  taskId          String?
  projectId       String?
  description     String?
  
  user            User             @relation(...)
  task            Task?            @relation(...)
  project         Project?         @relation(...)
  deepWorkSession DeepWorkSession?
}
```

---

## 🚀 Fonctionnalités principales

### 1. Dashboard Principal (`/dashboard`)

**Composant** : `components/dashboard/new-dashboard.tsx`

**Fonctionnalités** :
- **Métriques du jour** :
  - Progression quotidienne (tâches complétées / total)
  - Heures de Deep Work
  - Série (streak) actuelle
  - Score de productivité
- **Graphique de productivité hebdomadaire** : Visualisation des performances sur 7 jours
- **Liste des habitudes** : Affichage des habitudes avec statut (complétée/en attente)
- **Tâches du jour** : Liste des tâches à faire aujourd'hui
- **Leaderboard** : Classement des utilisateurs (top 3)
- **Statistiques de performance** : Heures totales, tâches accomplies, heure de pic, rang global

**API utilisées** :
- `GET /api/dashboard/metrics` : Métriques du jour
- `GET /api/dashboard/weekly-productivity` : Données hebdomadaires
- `GET /api/habits` : Liste des habitudes
- `GET /api/gamification/leaderboard` : Classement
- `GET /api/tasks/today` : Tâches du jour

---

### 2. Assistant IA (`/dashboard/assistant-ia`)

**Composant** : `app/dashboard/assistant-ia/page.tsx`

**Fonctionnalités principales** :

#### 2.1 Chat conversationnel

- Interface de chat en temps réel avec l'assistant IA
- Messages formatés avec support des sauts de ligne (`\n`)
- Zone de chat scrollable avec hauteur fixe
- Indicateur de frappe ("L'IA écrit...")

#### 2.2 Actions rapides

Boutons d'actions rapides en haut du chat :

1. **Session Focus** (`deepwork`) : Démarrer une session Deep Work
2. **Journaling** (`journal`) : Journal vocal de vos pensées
3. **Apprendre** (`learning`) : Session d'apprentissage IA
4. **Planifier** (`plan`) : Organiser votre emploi du temps
5. **Start a task** (`start-task`) : Commencer à travailler sur une tâche (lance Deep Work avec liste de tâches)
6. **Analyser** (`stats`) : Voir vos insights de productivité

#### 2.3 Deep Work

**Modal de démarrage** :
- Sélection de la durée (15, 25, 45, 60, 90 minutes)
- Type de session : `focus` (session classique) ou `task` (avec liste de tâches)

**Affichage de la session active** :
- Timer en temps réel avec compte à rebours
- Barre de progression visuelle
- Bouton "Terminer la session"
- Liste des tâches (si mode `task`) avec cases à cocher interactives

**API utilisées** :
- `POST /api/deepwork/agent` : Créer une session
- `GET /api/deepwork/agent?status=active` : Récupérer la session active
- `PATCH /api/deepwork/agent/[id]` : Mettre à jour (pause, reprise, complétion)
- `PATCH /api/tasks/[id]` : Marquer une tâche comme complétée

#### 2.4 Journaling

**Modal de journaling** :
- Zone de texte pour saisir ses pensées
- **Entrée vocale** : Utilisation de l'API Web Speech pour la transcription
- Sauvegarde automatique dans l'habitude "Journaling" (créée si nécessaire)

**API utilisées** :
- `POST /api/journal/agent` : Créer une entrée de journal
- `GET /api/habits` : Récupérer l'habitude "Journaling"

#### 2.5 Apprentissage (Learning)

**Modal d'apprentissage** :
- Zone de texte pour noter ce qu'on a appris
- **Entrée vocale** : Transcription via Web Speech API
- Sauvegarde dans l'habitude "Apprentissage"

**API utilisées** :
- `POST /api/habits/agent` : Créer/valider l'habitude "Apprentissage"
- `POST /api/habits/[id]/entries` : Enregistrer l'entrée

#### 2.6 Planification

**Modal de planification** :
- Zone de texte pour décrire ce qu'on veut planifier
- **Entrée vocale** : Transcription via Web Speech API
- L'IA analyse le texte et crée automatiquement des tâches avec priorités et dates

**API utilisées** :
- `POST /api/assistant/chat` : Envoyer le texte à l'IA pour analyse
- `POST /api/tasks/agent/batch-create` : Créer les tâches en lot

#### 2.7 Check-ins comportementaux automatiques

**Fonctionnement** :
- Questions automatiques toutes les 5 minutes (aléatoires)
- Types de questions : humeur, focus, motivation, énergie, stress
- Limite de 5 questions par jour côté UI
- Minimum de 15 minutes entre deux questions

**Détection des réponses** :
- Si l'utilisateur répond par un chiffre (1-10), le système détecte que c'est une réponse à la question en attente
- Enregistrement automatique via `POST /api/behavior/agent/checkin`

**Synchronisation backend** :
- Vérification de l'état conversationnel en base (`UserConversationState`)
- Support des questions déclenchées par le backend (scheduler, scripts)

**API utilisées** :
- `GET /api/behavior/agent/pending-question` : Vérifier s'il y a une question en attente
- `POST /api/behavior/agent/checkin` : Enregistrer un check-in
- `POST /api/behavior/agent/clear-state` : Nettoyer l'état conversationnel

#### 2.8 Commande "analyse"

Quand l'utilisateur tape "analyse" (ou "rapport", "pattern", "comportement"), l'assistant :
1. Récupère les check-ins des 7 derniers jours
2. Calcule les moyennes (humeur, focus, motivation, énergie, stress)
3. Détecte des patterns temporels
4. Calcule des corrélations
5. Génère des insights et recommandations via IA
6. Affiche un rapport formaté dans le chat

**API utilisées** :
- `POST /api/assistant/chat` : Traitement de la commande "analyse"
- `lib/ai/behavior-analysis.service.ts` : Service d'analyse comportementale

#### 2.9 Entrée vocale

**Support Web Speech API** :
- Détection de la disponibilité du navigateur
- Gestion des permissions micro
- Transcription en temps réel
- Gestion d'erreurs (permissions refusées, pas de parole détectée, etc.)

**Modes vocaux** :
- `learning` : Pour l'apprentissage
- `planning` : Pour la planification
- `journaling` : Pour le journaling
- Chat principal : Pour les messages généraux

---

### 3. Gestion des Tâches (`/dashboard/tasks`)

**Composant** : `components/tasks/new-tasks-page.tsx`

**Fonctionnalités** :
- **Liste des tâches** : Affichage par groupe (Aujourd'hui, Demain, Cette semaine, Plus tard)
- **Création de tâche** : Modal avec titre, description, date d'échéance, projet, priorité
- **Édition de tâche** : Modification des propriétés
- **Complétion** : Marquer une tâche comme terminée
- **Filtres** : Par projet, par statut (complétée/en attente)
- **Tri** : Par date, par priorité, par ordre personnalisé

**API utilisées** :
- `GET /api/tasks` : Liste des tâches
- `GET /api/tasks/today` : Tâches du jour
- `POST /api/tasks` : Créer une tâche
- `PATCH /api/tasks/[id]` : Mettre à jour une tâche
- `DELETE /api/tasks/[id]` : Supprimer une tâche

---

### 4. Gestion des Habitudes (`/dashboard/habits`)

**Fonctionnalités** :
- **Liste des habitudes** : Affichage avec statut (complétée/en attente) pour aujourd'hui
- **Création d'habitude** : Nom, description, couleur, fréquence, jours de la semaine
- **Validation quotidienne** : Cocher une habitude comme complétée
- **Historique** : Voir les entrées passées
- **Statistiques** : Série (streak), pourcentage de complétion

**API utilisées** :
- `GET /api/habits` : Liste des habitudes
- `GET /api/habits/date?date=YYYY-MM-DD` : Habitudes pour une date
- `POST /api/habits` : Créer une habitude
- `POST /api/habits/[id]/entries` : Enregistrer une entrée
- `GET /api/habits/stats` : Statistiques des habitudes

---

### 5. Analytics (`/dashboard/analytics`)

**Composant** : `app/dashboard/analytics/page.tsx`

**Fonctionnalités** :
- **KPIs** : Productivité moyenne, habitudes complétées, focus, etc.
- **Graphique de productivité** : Évolution sur 7 jours
- **Temps par projet** : Répartition du temps passé par projet
- **Streaks d'habitudes** : Série actuelle pour chaque habitude
- **Statistiques Deep Work** : Heures totales, nombre de sessions, meilleure session

**API utilisées** :
- `GET /api/dashboard/analytics-stats` : Statistiques générales
- `GET /api/dashboard/deepwork-stats` : Statistiques Deep Work
- `GET /api/dashboard/weekly-productivity` : Données hebdomadaires

---

### 6. Paramètres (`/dashboard/settings`)

**Fonctionnalités** :
- **Profil** : Nom, email, mot de passe
- **Notifications** : Préférences de notifications (email, push, WhatsApp)
- **Tokens API** : Gestion des tokens d'API pour les intégrations
- **Abonnement** : Gestion de l'abonnement Stripe

**API utilisées** :
- `GET /api/auth/me` : Informations utilisateur
- `PATCH /api/user-password` : Changer le mot de passe
- `GET /api/tokens` : Liste des tokens API
- `POST /api/tokens` : Créer un token API

---

## 🔌 Routes API

### Authentification

#### `POST /api/auth/login`
Connexion utilisateur.

**Body** :
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** :
```json
{
  "user": { "id": "...", "email": "..." },
  "token": "session_token"
}
```

#### `POST /api/auth/register`
Inscription d'un nouvel utilisateur.

#### `GET /api/auth/me`
Récupérer l'utilisateur connecté (via cookies).

---

### Assistant IA

#### `POST /api/assistant/chat`
Envoyer un message à l'assistant IA.

**Body** :
```json
{
  "message": "Crée-moi une tâche pour demain"
}
```

**Response** :
```json
{
  "response": "✅ J'ai créé la tâche '...' pour demain.",
  "contextual": true,
  "success": true
}
```

**Fonctionnalités** :
- Détection d'intention via `AIService`
- Création automatique de tâches
- Commande spéciale "analyse" pour l'analyse comportementale
- Formatage des réponses avec sauts de ligne

---

### Deep Work

#### `POST /api/deepwork/agent`
Créer une session Deep Work.

**Body** :
```json
{
  "plannedDuration": 25,
  "type": "deepwork"
}
```

**Response** :
```json
{
  "session": {
    "id": "...",
    "plannedDuration": 25,
    "status": "active",
    "endTimeExpected": "2024-01-01T10:25:00Z"
  }
}
```

#### `GET /api/deepwork/agent?status=active&limit=1`
Récupérer la session active.

#### `PATCH /api/deepwork/agent/[id]`
Mettre à jour une session (pause, reprise, complétion).

**Body** :
```json
{
  "status": "completed"
}
```

---

### Tâches

#### `GET /api/tasks`
Liste des tâches de l'utilisateur.

**Query params** :
- `projectId` : Filtrer par projet
- `completed` : Filtrer par statut (true/false)
- `date` : Filtrer par date (YYYY-MM-DD)

#### `POST /api/tasks`
Créer une tâche.

**Body** :
```json
{
  "title": "Faire les courses",
  "description": "Acheter du lait et du pain",
  "dueDate": "2024-01-02T10:00:00Z",
  "priority": 2,
  "energyLevel": 1
}
```

#### `POST /api/tasks/agent/batch-create`
Créer plusieurs tâches en lot (utilisé par l'IA).

**Body** :
```json
{
  "tasks": [
    {
      "title": "Tâche 1",
      "dueDate": "2024-01-02",
      "priority": 2
    },
    {
      "title": "Tâche 2",
      "dueDate": "2024-01-02",
      "priority": 3
    }
  ]
}
```

#### `PATCH /api/tasks/[id]`
Mettre à jour une tâche.

#### `DELETE /api/tasks/[id]`
Supprimer une tâche.

---

### Habitudes

#### `GET /api/habits`
Liste des habitudes de l'utilisateur.

#### `GET /api/habits/date?date=YYYY-MM-DD`
Habitudes pour une date spécifique avec statut de complétion.

#### `POST /api/habits`
Créer une habitude.

**Body** :
```json
{
  "name": "Méditation",
  "description": "10 minutes de méditation",
  "frequency": "daily",
  "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday"]
}
```

#### `POST /api/habits/[id]/entries`
Enregistrer une entrée d'habitude.

**Body** :
```json
{
  "date": "2024-01-01",
  "completed": true,
  "note": "Bien fait !"
}
```

---

### Journal

#### `POST /api/journal/agent`
Créer une entrée de journal.

**Body** :
```json
{
  "transcription": "Aujourd'hui j'ai appris..."
}
```

#### `GET /api/journal/agent`
Récupérer les entrées de journal récentes.

---

### Check-ins comportementaux

#### `POST /api/behavior/agent/checkin`
Enregistrer un check-in.

**Body** :
```json
{
  "type": "mood",
  "value": 8,
  "note": "Je me sens bien aujourd'hui"
}
```

**Types** : `mood`, `focus`, `motivation`, `energy`, `stress`

#### `GET /api/behavior/agent/pending-question`
Vérifier s'il y a une question de check-in en attente.

**Response** :
```json
{
  "question": "😊 Comment te sens-tu en ce moment ? (1-10)",
  "type": "mood",
  "timestamp": "2024-01-01T10:00:00Z"
}
```

#### `POST /api/behavior/agent/clear-state`
Nettoyer l'état conversationnel de l'utilisateur.

#### `GET /api/behavior/agent/analysis?days=7`
Récupérer l'analyse comportementale.

---

### Dashboard

#### `GET /api/dashboard/metrics`
Métriques du jour (tâches complétées, heures Deep Work, streak, etc.).

#### `GET /api/dashboard/weekly-productivity?period=week`
Données de productivité hebdomadaires.

#### `GET /api/dashboard/deepwork-stats`
Statistiques Deep Work (heures totales, nombre de sessions).

---

## 🔐 Système d'authentification

### Authentification Web (Cookies)

L'application utilise **NextAuth.js** pour gérer l'authentification web via cookies.

**Fichier** : `app/api/auth/[...nextauth]/route.ts`

**Flux** :
1. L'utilisateur se connecte via `POST /api/auth/login`
2. NextAuth crée une session et un cookie HTTP-only
3. Les routes API vérifient l'authentification via `getAuthUser()` ou `getAuthUserFromRequest()`

**Utilitaires** :
- `lib/auth.ts` : Fonctions `getAuthUser()`, `getAuthUserFromRequest()`

### Authentification API (Tokens)

Pour les intégrations externes (WhatsApp, scripts), l'application utilise des **tokens API JWT**.

**Génération** :
```typescript
import { generateApiToken } from '@/lib/api-token'

const { token } = await generateApiToken({
  name: 'WhatsApp Integration',
  userId: user.id,
  scopes: ['tasks:read', 'tasks:write', 'habits:read', 'habits:write']
})
```

**Vérification** :
```typescript
import { verifyApiToken } from '@/lib/api-token'

const payload = await verifyApiToken(token)
if (payload) {
  const userId = payload.userId
  const scopes = payload.scopes
}
```

**Scopes disponibles** :
- `tasks:read`, `tasks:write`
- `habits:read`, `habits:write`
- `deepwork:read`, `deepwork:write`
- `journal:read`, `journal:write`
- `behavior:read`, `behavior:write`

---

## 🔗 Intégrations

### WhatsApp

**Webhook** : `app/api/webhooks/whatsapp/route.ts`

**Fonctionnement** :
1. L'utilisateur envoie un message WhatsApp
2. Le webhook reçoit le message via l'API WhatsApp
3. Le message est traité par `AIService` (même logique que l'assistant web)
4. La réponse est envoyée via WhatsApp

**Authentification** : Token API avec scopes complets

**État conversationnel** : Utilise `UserConversationState` pour gérer les conversations multi-tours (ex: "combien de temps pour Deep Work ?" → attendre la réponse)

### Stripe

**Webhook** : `app/api/stripe/webhook/route.ts`

**Fonctionnalités** :
- Gestion des abonnements (création, renouvellement, annulation)
- Mise à jour du statut d'abonnement dans `User`
- Gestion des périodes d'essai

---

## 🎮 Gamification

### UserGamification

```prisma
model UserGamification {
  id                   String    @id @default(cuid())
  userId               String    @unique
  currentStreak        Int       @default(0)
  longestStreak        Int       @default(0)
  points               Int       @default(0)
  level                Int       @default(1)
  totalHabitsCompleted Int       @default(0)
  totalPoints          Int       @default(0)
  
  user                 User      @relation(...)
}
```

**Calcul du streak** :
- Le streak augmente si l'utilisateur complète au moins une habitude par jour
- Le streak se réinitialise si aucun jour sans activité

**Points** :
- Complétion d'habitude : +10 points
- Complétion de tâche : +5 points
- Session Deep Work complétée : +20 points

### Leaderboard

**API** : `GET /api/gamification/leaderboard?limit=10`

**Classement** : Basé sur les points totaux (`totalPoints`)

### Achievements

```prisma
model Achievement {
  id          String            @id @default(cuid())
  name        String            @unique
  description String
  type        String
  threshold   Int
  points      Int
  
  users       UserAchievement[]
}
```

**Exemples d'achievements** :
- "Premier pas" : Compléter sa première habitude
- "Série de 7" : 7 jours de streak
- "Deep Worker" : 10 sessions Deep Work complétées

---

## 🔔 Notifications

### NotificationSettings

```prisma
model NotificationSettings {
  id                  String                @id @default(cuid())
  userId              String                @unique
  isEnabled           Boolean               @default(true)
  emailEnabled        Boolean               @default(true)
  pushEnabled         Boolean               @default(true)
  whatsappEnabled     Boolean               @default(false)
  morningReminder     Boolean               @default(true)
  taskReminder        Boolean               @default(true)
  habitReminder       Boolean               @default(true)
  dailySummary        Boolean               @default(true)
  
  user                User                  @relation(...)
}
```

### Types de notifications

1. **Rappel matinal** : À 8h00, rappel des tâches du jour
2. **Rappel d'habitude** : Rappel pour compléter les habitudes
3. **Résumé quotidien** : À 22h00, récapitulatif de la journée
4. **Check-in comportemental** : Questions automatiques (humeur, focus, etc.)

### NotificationHistory

```prisma
model NotificationHistory {
  id           String                @id @default(cuid())
  userId       String
  type         String
  content      String
  scheduledFor DateTime
  sentAt       DateTime?
  status       String                @default("pending")
  
  user         User                  @relation(...)
}
```

---

## 📊 Services IA

### AIService

**Fichier** : `src/services/ai/AIService.ts` (ou `lib/ai/` selon la structure)

**Fonctionnalités** :
- **Détection d'intention** : Détecte si l'utilisateur veut créer une tâche, lancer Deep Work, etc.
- **Création de tâches** : Analyse le texte et crée des tâches avec priorités et dates
- **Réponses conversationnelles** : Génère des réponses naturelles aux questions
- **Analyse de contexte** : Utilise les tâches, habitudes, et historique de l'utilisateur

**Méthodes principales** :
- `processMessage(message, userId)` : Traite un message et retourne une réponse
- `detectIntent(message)` : Détecte l'intention (action, question, conversation)
- `createTasksFromText(text, userId)` : Crée des tâches à partir d'un texte

### TaskAnalysisService

**Fichier** : `lib/ai/TaskAnalysisService.ts`

**Fonctionnalités** :
- Analyse un texte en langage naturel et extrait des tâches structurées
- Détermine automatiquement :
  - La priorité (0-4)
  - Le niveau d'énergie requis (0-3)
  - La date d'échéance
  - La durée estimée

**Exemple** :
```
Input: "Je dois finir le rapport avant 16h, c'est urgent, et aussi appeler le client demain matin"

Output: [
  { title: "Finir le rapport", priority: 4, dueDate: "2024-01-01T16:00:00Z", energyLevel: 3 },
  { title: "Appeler le client", priority: 2, dueDate: "2024-01-02T10:00:00Z", energyLevel: 1 }
]
```

### BehaviorAnalysisService

**Fichier** : `lib/ai/behavior-analysis.service.ts`

**Fonctionnalités** :
- Analyse les check-ins comportementaux sur une période
- Calcule les moyennes (humeur, focus, motivation, énergie, stress)
- Détecte des patterns temporels (ex: focus plus élevé le matin)
- Calcule des corrélations (ex: corrélation entre humeur et énergie)
- Génère des insights et recommandations via IA

**Exemple de sortie** :
```json
{
  "averages": {
    "mood": 7.5,
    "focus": 8.0,
    "motivation": 7.0,
    "energy": 6.5,
    "stress": 3.0
  },
  "insights": [
    "Ton focus est plus élevé le matin (8.5/10) qu'en après-midi (7.0/10)",
    "Ta motivation baisse en fin de journée"
  ],
  "recommendations": [
    "Planifie tes tâches importantes le matin pour profiter de ton pic de focus",
    "Fais une pause de 15 minutes en fin d'après-midi pour recharger ta motivation"
  ],
  "correlations": {
    "focus_vs_energy": 0.75,
    "mood_vs_stress": -0.65
  }
}
```

---

## 🎨 Design System

### Couleurs

L'application utilise **Tailwind CSS** avec un système de couleurs personnalisé :

- **Primary** : Gradient purple-indigo (Deep Work)
- **Success** : Green (habitudes complétées)
- **Warning** : Amber (tâches importantes)
- **Error** : Red (erreurs)

### Composants réutilisables

- **Modal** : Modals avec animations Framer Motion
- **Button** : Boutons avec variants (primary, secondary, ghost)
- **Input** : Champs de saisie avec validation
- **Card** : Cartes pour afficher les données

### Animations

**Framer Motion** est utilisé pour :
- Transitions de pages
- Animations de modals
- Effets de hover
- Animations de chargement

---

## 🔧 Configuration

### Variables d'environnement

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/productif"

# Authentification
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="sk-..."

# Stripe
STRIPE_SECRET_KEY="sk_..."
STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# WhatsApp
WHATSAPP_API_TOKEN="..."
WHATSAPP_PHONE_NUMBER_ID="..."
```

---

## 📝 Notes importantes

### Gestion des fuseaux horaires

- Les dates sont stockées en UTC dans la base de données
- L'affichage est converti selon le fuseau horaire de l'utilisateur
- Les habitudes sont filtrées par date normalisée à midi UTC pour éviter les problèmes de fuseaux horaires

### Performance

- **Pagination** : Les listes de tâches/habitudes sont paginées
- **Cache** : Utilisation de `revalidate` dans Next.js pour le cache des données
- **Optimisations** : Requêtes Prisma optimisées avec `select` pour ne récupérer que les champs nécessaires

### Sécurité

- **Validation** : Toutes les entrées utilisateur sont validées (Zod, Prisma)
- **Authentification** : Vérification systématique de l'authentification sur les routes API
- **Scopes API** : Vérification des permissions pour les tokens API
- **HTTPS** : Obligatoire en production

---

## 🚀 Déploiement

### Prérequis

- Node.js 18+
- PostgreSQL 14+
- Variables d'environnement configurées

### Commandes

```bash
# Installation
npm install

# Migration de la base de données
npx prisma migrate dev

# Génération du client Prisma
npx prisma generate

# Démarrage en développement
npm run dev

# Build de production
npm run build

# Démarrage en production
npm start
```

---

## 📞 Support

Pour toute question ou problème, consultez :
- La documentation des API : `/api` endpoints
- Les logs serveur : Console Next.js
- Les logs base de données : Prisma Studio (`npx prisma studio`)

---

**Dernière mise à jour** : Janvier 2024


