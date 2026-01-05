# 🎨 Implémentation du Nouveau Design - Productif.io Mobile

## Vue d'ensemble

Cette mise à jour implémente le nouveau design de l'application mobile Productif.io, incluant :
- Un nouveau flux d'onboarding complet
- Un dashboard repensé
- Un système de traductions trilingue (FR/EN/ES)
- La connexion aux calendriers Google et Apple
- Un AI Conductor pour les actions système
- Un nouveau mode Focus
- Un leaderboard amélioré
- Une nouvelle navigation à 5 onglets

---

## 📁 Fichiers créés/modifiés

### Backend (Next.js)

| Fichier | Description |
|---------|-------------|
| `prisma/schema.prisma` | Nouveaux champs OnboardingData + AppleCalendarConnection |
| `app/api/onboarding/data/route.ts` | Support des nouveaux champs d'onboarding |
| `app/api/google-calendar/connect-mobile/route.ts` | **NOUVEAU** - Endpoint pour connexion mobile |
| `app/api/apple-calendar/connect/route.ts` | **NOUVEAU** - Endpoint Apple Calendar |

### Mobile App

#### Système de traductions
| Fichier | Description |
|---------|-------------|
| `constants/translations.ts` | **NOUVEAU** - 200+ clés en FR/EN/ES |
| `contexts/LanguageContext.tsx` | Contexte mis à jour avec support ES |

#### Onboarding
| Fichier | Description |
|---------|-------------|
| `app/(onboarding)/_layout.tsx` | **NOUVEAU** - Layout onboarding |
| `app/(onboarding)/index.tsx` | **NOUVEAU** - Flow principal (10 écrans) |
| `components/onboarding/LanguageSelection.tsx` | **NOUVEAU** - Sélection de langue |
| `components/onboarding/Welcome.tsx` | **NOUVEAU** - Écran d'accueil |
| `components/onboarding/Auth.tsx` | **NOUVEAU** - Google/Apple/Email auth |
| `components/onboarding/ValueAwareness.tsx` | **NOUVEAU** - Animation de sensibilisation |
| `components/onboarding/Identity.tsx` | **NOUVEAU** - Prénom + type d'étudiant |
| `components/onboarding/GoalsPressure.tsx` | **NOUVEAU** - Objectifs + niveau de pression |
| `components/onboarding/AcademicContext.tsx` | **NOUVEAU** - Contexte académique |
| `components/onboarding/DailyStruggles.tsx` | **NOUVEAU** - Difficultés quotidiennes |
| `components/onboarding/CalendarSync.tsx` | **NOUVEAU** - Connexion calendriers |
| `components/onboarding/Success.tsx` | **NOUVEAU** - Écran de succès |
| `components/onboarding/index.ts` | **NOUVEAU** - Barrel export |

#### Dashboard & Navigation
| Fichier | Description |
|---------|-------------|
| `app/(tabs)/_layout.tsx` | Nouvelle navigation à 5 onglets |
| `app/(tabs)/index.tsx` | Intégration nouveau Dashboard |
| `app/(tabs)/assistant.tsx` | **NOUVEAU** - AI Conductor |
| `app/(tabs)/mood.tsx` | **NOUVEAU** - Suivi d'humeur |
| `app/(tabs)/leaderboard.tsx` | **NOUVEAU** - Classement |
| `components/dashboard/Dashboard.tsx` | **NOUVEAU** - Dashboard repensé |
| `components/ai/AIConductor.tsx` | **NOUVEAU** - Interface AI |

#### Focus Mode
| Fichier | Description |
|---------|-------------|
| `app/focus.tsx` | **NOUVEAU** - Mode focus plein écran |
| `components/focus/FocusMode.tsx` | **NOUVEAU** - Composant timer |

#### Calendriers
| Fichier | Description |
|---------|-------------|
| `lib/calendarAuth.ts` | **NOUVEAU** - Auth Google/Apple Calendar |
| `lib/api.ts` | Nouveaux services Calendar + types onboarding |

---

## 🔧 Migrations à exécuter

```bash
# Générer le client Prisma (déjà fait)
npx prisma generate

# Créer et appliquer la migration
npx prisma migrate dev --name add_new_onboarding_fields
```

---

## 📱 Nouvelle Navigation

```
┌─────────────────────────────────────────────────────┐
│                     Tab Bar                          │
├──────────┬──────────┬──────────┬──────────┬─────────┤
│  🏠 Home │ 📅 Tasks │ ⚡ Agent │ ❤️ Mood │ 👥 Board│
└──────────┴──────────┴──────────┴──────────┴─────────┘
```

---

## 🔄 Flux d'onboarding

```
1. LanguageSelection (EN/FR/ES)
       ↓
2. Welcome
       ↓
3. Auth (Google / Apple / Email)
       ↓
4. ValueAwareness (animation)
       ↓
5. Identity (prénom + type étudiant)
       ↓
6. GoalsPressure (objectifs + niveau)
       ↓
7. AcademicContext (situation actuelle)
       ↓
8. DailyStruggles (difficultés)
       ↓
9. CalendarSync (Google / Apple)
       ↓
10. Success → Dashboard
```

---

## 🎨 Design System

### Couleurs principales
- Primary: `#16A34A` (vert)
- Background: `#FFFFFF`
- Text: `#000000`
- Secondary text: `rgba(0, 0, 0, 0.6)`
- Borders: `rgba(0, 0, 0, 0.1)`

### Border Radius
- Cards: `24px`
- Buttons: `28px` (CTA), `16px` (secondaire)
- Inputs: `16px`

### Spacing
- Padding horizontal: `24px`
- Gap entre éléments: `12px` - `16px`
- Sections: `24px` - `32px`

---

## 📝 Nouveaux champs OnboardingData

```prisma
model OnboardingData {
  // Identité
  firstName    String?
  studentType  String?  // highSchool, university, medLawPrepa, etc.
  
  // Objectifs
  goals         Json?   // Array de strings
  pressureLevel Int?    // 1-5
  
  // Contexte
  currentSituation String?
  dailyStruggles   Json?
  
  // Style de travail
  mentalLoad     Int?
  focusQuality   Int?
  satisfaction   Int?
  overthinkTasks Boolean?
  shouldDoMore   Boolean?
  
  // Intentions
  wantToChange Json?
  timeHorizon  String?
  
  // Tâches
  rawTasks       String?
  clarifiedTasks Json?
  idealDay       Json?
}
```

---

## ✅ TODO pour finaliser

1. [ ] Exécuter `npx prisma migrate dev`
2. [ ] Tester l'onboarding complet sur iOS/Android
3. [ ] Vérifier la connexion Google Calendar avec les bons Client IDs
4. [ ] Configurer EventKit entitlements pour Apple Calendar
5. [ ] Tester les traductions ES complètes
6. [ ] Ajouter les animations Lottie (optionnel)

---

## 🚀 Lancer l'application

```bash
cd mobile-app-new
npm install
npx expo start
```

Pour iOS:
```bash
npx expo run:ios
```

Pour Android:
```bash
npx expo run:android
```

