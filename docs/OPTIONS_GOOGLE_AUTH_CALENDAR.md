# Options pour Google Login et Google Calendar

## 📋 Objectifs

1. **App Web** : Ajouter la possibilité de se connecter avec Google
2. **App Mobile** : 
   - Ajouter la possibilité de se connecter avec Google
   - Permettre à l'utilisateur de connecter son Google Calendar
   - Créer des événements sur son Google Calendar depuis l'app

---

## 🔍 État Actuel

### App Web
- ✅ NextAuth est déjà configuré avec Google Provider (`app/api/auth/[...nextauth]/route.ts`)
- ✅ Les credentials Google sont configurés (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
- ❌ Le bouton Google n'est pas visible sur la page de login principale (`components/auth/login-form.tsx`)
- ✅ Le bouton Google existe dans l'onboarding (`app/onboarding/page.tsx`)

### App Mobile
- ❌ Pas de connexion Google actuellement
- ❌ Pas d'intégration Google Calendar

---

## 🎯 Options Disponibles

### **OPTION 1 : Utiliser NextAuth (Recommandé pour Web) + API Custom (Mobile)**

#### Description
- **Web** : Utiliser NextAuth existant (déjà configuré)
- **Mobile** : Créer un endpoint API custom pour l'OAuth Google
- **Calendar** : Utiliser Google Calendar API directement

#### Avantages
- ✅ NextAuth déjà en place pour le web
- ✅ Pas besoin de changer l'architecture web
- ✅ Contrôle total sur le flux mobile
- ✅ Compatible avec votre système d'auth actuel

#### Inconvénients
- ⚠️ Nécessite de gérer deux flux OAuth différents (web et mobile)
- ⚠️ Nécessite de stocker les refresh tokens Google pour Calendar

#### Implémentation

**1. Web - Ajouter le bouton Google sur la page de login**
```tsx
// components/auth/login-form.tsx
import { signIn } from "next-auth/react"

// Ajouter un bouton "Continuer avec Google"
<Button 
  variant="outline" 
  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
>
  <GoogleIcon /> Continuer avec Google
</Button>
```

**2. Mobile - Créer endpoint API pour OAuth Google**
```typescript
// app/api/auth/google/mobile/route.ts
// Endpoint qui gère le flow OAuth pour mobile
```

**3. Calendar - Stocker les tokens et créer les événements**
```typescript
// Nouveau modèle Prisma pour stocker les tokens Google
model GoogleCalendarToken {
  id            String   @id @default(cuid())
  userId        String   @unique
  accessToken   String
  refreshToken  String
  expiresAt     DateTime
  // ...
}
```

#### Coût
- **Temps** : ~2-3 jours
- **Complexité** : Moyenne

---

### **OPTION 2 : Utiliser Google OAuth directement (Sans NextAuth pour Mobile)**

#### Description
- **Web** : Garder NextAuth pour le web
- **Mobile** : Utiliser `expo-auth-session` ou `@react-native-google-signin/google-signin`
- **Calendar** : Utiliser Google Calendar API avec les tokens obtenus

#### Avantages
- ✅ Solution native pour mobile (meilleure UX)
- ✅ Pas besoin de passer par votre backend pour l'OAuth mobile
- ✅ NextAuth reste pour le web

#### Inconvénients
- ⚠️ Deux systèmes d'auth différents à maintenir
- ⚠️ Nécessite de synchroniser les utilisateurs entre web et mobile

#### Implémentation

**1. Mobile - Installer les packages**
```bash
npm install @react-native-google-signin/google-signin
# ou
npx expo install expo-auth-session expo-crypto
```

**2. Mobile - Configurer Google Sign-In**
```typescript
// mobile-app-new/lib/googleAuth.ts
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: 'YOUR_GOOGLE_CLIENT_ID',
  scopes: ['https://www.googleapis.com/auth/calendar'],
});
```

**3. Calendar - Créer service pour Calendar API**
```typescript
// mobile-app-new/lib/googleCalendar.ts
// Service pour créer des événements sur Google Calendar
```

#### Coût
- **Temps** : ~3-4 jours
- **Complexité** : Moyenne-Élevée

---

### **OPTION 3 : Migrer vers Neon Auth (Overkill mais complet)**

#### Description
- Utiliser Neon Auth pour gérer toute l'authentification
- Support natif OAuth et sessions
- Nécessite une migration complète

#### Avantages
- ✅ Solution complète et gérée
- ✅ Support OAuth natif
- ✅ Moins de code à maintenir

#### Inconvénients
- ❌ Nécessite une migration complète de votre système d'auth
- ❌ En preview (peut changer)
- ❌ Uniquement AWS pour le moment
- ❌ Pas de support direct pour Google Calendar (il faudra quand même utiliser l'API)

#### Coût
- **Temps** : ~1-2 semaines (migration complète)
- **Complexité** : Élevée

---

### **OPTION 4 : Solution Hybride (Recommandé)**

#### Description
- **Web** : Utiliser NextAuth existant (ajouter juste le bouton)
- **Mobile** : Utiliser `expo-auth-session` pour OAuth Google
- **Calendar** : Créer un service backend qui utilise Google Calendar API

#### Architecture

```
┌─────────────────┐
│   App Web       │
│  NextAuth       │──┐
└─────────────────┘  │
                     ├──> Prisma User
┌─────────────────┐  │
│   App Mobile     │  │
│  expo-auth-session│─┘
└─────────────────┘
         │
         ├──> Google OAuth (Login)
         │
         └──> Google Calendar API (Créer événements)
```

#### Implémentation Détaillée

**1. Web - Ajouter bouton Google (30 min)**
- Modifier `components/auth/login-form.tsx`
- Ajouter le bouton qui appelle `signIn("google")`

**2. Mobile - Google Login (1 jour)**
- Installer `expo-auth-session`
- Créer un hook `useGoogleAuth`
- Créer endpoint API `/api/auth/google/mobile` pour valider le token

**3. Mobile - Google Calendar (2 jours)**
- Demander les scopes Calendar lors de l'OAuth
- Créer service backend `/api/calendar/events` qui utilise Google Calendar API
- Stocker les tokens dans Prisma
- Créer composant mobile pour créer des événements

#### Coût
- **Temps** : ~3-4 jours
- **Complexité** : Moyenne

---

## 📊 Comparaison des Options

| Critère | Option 1 | Option 2 | Option 3 | Option 4 (Recommandé) |
|---------|----------|----------|----------|------------------------|
| **Temps d'implémentation** | 2-3 jours | 3-4 jours | 1-2 semaines | 3-4 jours |
| **Complexité** | Moyenne | Moyenne-Élevée | Élevée | Moyenne |
| **Maintenance** | Moyenne | Moyenne | Faible | Moyenne |
| **UX Mobile** | Bonne | Excellente | Bonne | Excellente |
| **Compatibilité** | ✅ | ✅ | ⚠️ | ✅ |
| **Risque** | Faible | Faible | Moyen | Faible |

---

## 🎯 Recommandation : **OPTION 4 (Solution Hybride)**

### Pourquoi ?
1. ✅ Utilise ce qui existe déjà (NextAuth pour web)
2. ✅ Solution native pour mobile (meilleure UX)
3. ✅ Pas de migration majeure nécessaire
4. ✅ Contrôle total sur le flux Calendar
5. ✅ Temps de développement raisonnable

### Plan d'Action

#### Phase 1 : Google Login Web (30 min)
- [ ] Ajouter bouton Google sur `components/auth/login-form.tsx`
- [ ] Tester le flux de connexion

#### Phase 2 : Google Login Mobile (1 jour)
- [ ] Installer `expo-auth-session`
- [ ] Créer hook `useGoogleAuth`
- [ ] Créer endpoint `/api/auth/google/mobile`
- [ ] Ajouter bouton Google sur écran de login mobile
- [ ] Tester le flux complet

#### Phase 3 : Google Calendar (2 jours)
- [ ] Ajouter scope Calendar dans l'OAuth mobile
- [ ] Créer modèle Prisma `GoogleCalendarToken`
- [ ] Créer service backend pour Google Calendar API
- [ ] Créer endpoint `/api/calendar/events`
- [ ] Créer UI mobile pour créer des événements
- [ ] Tester la création d'événements

---

## 📝 Modèle Prisma pour Google Calendar

```prisma
model GoogleCalendarToken {
  id            String   @id @default(cuid())
  userId        String   @unique
  accessToken   String   @db.Text
  refreshToken  String?  @db.Text
  expiresAt     DateTime
  scope         String   // Les scopes accordés
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("google_calendar_tokens")
}
```

---

## 🔐 Scopes Google Nécessaires

### Pour l'authentification
- `openid`
- `email`
- `profile`

### Pour Google Calendar
- `https://www.googleapis.com/auth/calendar` (lecture/écriture)
- ou `https://www.googleapis.com/auth/calendar.events` (uniquement événements)

---

## 📚 Ressources

- [NextAuth Google Provider](https://next-auth.js.org/providers/google)
- [Expo AuthSession](https://docs.expo.dev/guides/authentication/#google)
- [Google Calendar API](https://developers.google.com/calendar/api/v3/reference)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

---

## ❓ Questions à Clarifier

1. **Souhaitez-vous synchroniser les événements dans les deux sens ?** (Calendar → App et App → Calendar)
2. **Quels types d'événements voulez-vous créer ?** (Tâches, sessions de deep work, habitudes, etc.)
3. **Voulez-vous que la connexion Google soit obligatoire ou optionnelle ?**
4. **Souhaitez-vous permettre la déconnexion de Google Calendar ?**

