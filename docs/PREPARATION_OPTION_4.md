# 📋 Checklist Complète - Préparation Option 4

## ✅ TOUT CE QUE VOUS DEVEZ FAIRE AVANT DE COMMENCER

---

## 🔐 ÉTAPE 1 : Configuration Google Cloud Console

### 1.1 Accéder à Google Cloud Console
- [ ] Aller sur https://console.cloud.google.com/
- [ ] Se connecter avec votre compte Google
- [ ] Sélectionner ou créer un projet

### 1.2 Vérifier/Créer les OAuth 2.0 Credentials

#### Pour l'App Web (déjà configuré, mais vérifier)
- [ ] Aller dans **APIs & Services** > **Credentials**
- [ ] Vérifier que vous avez un **OAuth 2.0 Client ID** de type **Web application**
- [ ] Vérifier les **Authorized redirect URIs** :
  ```
  http://localhost:3000/api/auth/callback/google
  https://productif-io-1.vercel.app/api/auth/callback/google
  https://www.productif.io/api/auth/callback/google
  ```

#### Pour l'App Mobile iOS (NOUVEAU - À CRÉER)
- [ ] Créer un **nouveau OAuth 2.0 Client ID** de type **iOS**
- [ ] **Bundle ID requis** : `io.productif.app` (déjà configuré dans app.json)
- [ ] **IMPORTANT** : Notez le **Client ID iOS** (différent du web) - vous en aurez besoin

### 1.3 Activer Google Calendar API
- [ ] Aller dans **APIs & Services** > **Library**
- [ ] Rechercher "Google Calendar API"
- [ ] Cliquer sur **Enable** pour activer l'API
- [ ] Vérifier que l'API est activée

### 1.4 Configurer les OAuth Consent Screen
- [ ] Aller dans **APIs & Services** > **OAuth consent screen**
- [ ] Vérifier que le type est **External** (ou **Internal** si vous êtes en G Suite)
- [ ] Remplir les informations requises :
  - [ ] **App name** : Productif.io
  - [ ] **User support email** : Votre email
  - [ ] **Developer contact information** : Votre email
- [ ] Ajouter les **Scopes** nécessaires :
  - [ ] `openid`
  - [ ] `email`
  - [ ] `profile`
  - [ ] `https://www.googleapis.com/auth/calendar` (NOUVEAU)
- [ ] Si en mode **Testing**, ajouter les emails des testeurs
- [ ] Si en **Production**, soumettre pour vérification (peut prendre quelques jours)

### 1.5 Récupérer les Credentials
Notez ces informations (vous en aurez besoin) :
- [ ] **Web Client ID** : `1024769827714-fd4aclog3ui0krb47v0av9bbacu6o727.apps.googleusercontent.com` (déjà noté)
- [ ] **Web Client Secret** : `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` (déjà noté)
- [ ] **Mobile Client ID (iOS)** : `________________________` (À NOTER - OBLIGATOIRE)

---

## 📦 ÉTAPE 2 : Installation des Packages

### 2.1 Packages Backend (déjà installés, vérifier)
- [x] `googleapis` - Déjà dans package.json ✅
- [x] `next-auth` - Déjà installé ✅

### 2.2 Packages Mobile (vérifier)
- [x] `expo-auth-session` - Déjà installé dans mobile-app-new ✅
- [x] `expo-crypto` - Vérifier si installé
- [ ] Installer si manquant :
  ```bash
  cd mobile-app-new
  npx expo install expo-auth-session expo-crypto
  ```

---

## 🗄️ ÉTAPE 3 : Configuration Base de Données (Prisma)

### 3.1 Créer le Modèle pour Google Calendar Tokens
- [ ] Ouvrir `prisma/schema.prisma`
- [ ] Ajouter le modèle suivant :

```prisma
model GoogleCalendarToken {
  id            String   @id @default(cuid())
  userId        String   @unique
  accessToken   String   @db.Text
  refreshToken  String?  @db.Text
  expiresAt     DateTime
  scope         String   // Les scopes accordés (ex: "openid email profile https://www.googleapis.com/auth/calendar")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("google_calendar_tokens")
}
```

- [ ] Ajouter la relation dans le modèle `User` :
```prisma
model User {
  // ... champs existants ...
  googleCalendarToken GoogleCalendarToken?
}
```

### 3.2 Créer et Appliquer la Migration
- [ ] Créer la migration :
  ```bash
  npx prisma migrate dev --name add_google_calendar_tokens
  ```
- [ ] Vérifier que la migration est créée
- [ ] Appliquer la migration :
  ```bash
  npx prisma migrate deploy
  ```
- [ ] Régénérer le client Prisma :
  ```bash
  npx prisma generate
  ```

---

## 🔧 ÉTAPE 4 : Variables d'Environnement

### 4.1 Variables Backend (.env.local)
Ajouter/modifier dans votre fichier `.env.local` :

```env
# Google OAuth - Web (déjà configuré)
GOOGLE_CLIENT_ID="1024769827714-fd4aclog3ui0krb47v0av9bbacu6o727.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"

# Google OAuth - Mobile iOS (NOUVEAU)
GOOGLE_MOBILE_CLIENT_ID_IOS="votre-client-id-ios.apps.googleusercontent.com"

# Base URL de l'API (pour les callbacks)
NEXT_PUBLIC_API_URL="https://www.productif.io" # ou http://localhost:3000 en dev
```

### 4.2 Variables Mobile (app.json ou .env)
Dans `mobile-app-new/app.json` ou créer un fichier `.env` :

```json
{
  "expo": {
    "extra": {
      "googleClientId": "votre-client-id-ios.apps.googleusercontent.com",
      "apiUrl": "https://www.productif.io"
    }
  }
}
```

OU créer `mobile-app-new/.env` :
```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID="votre-client-id-ios.apps.googleusercontent.com"
EXPO_PUBLIC_API_URL="https://www.productif.io"
```

### 4.3 Variables Vercel (Production)
- [ ] Aller sur Vercel Dashboard
- [ ] Projet : `productif-io-1`
- [ ] Settings > Environment Variables
- [ ] Ajouter :
  - [ ] `GOOGLE_MOBILE_CLIENT_ID_IOS` = `votre-client-id-ios`
  - [ ] `NEXT_PUBLIC_API_URL` = `https://www.productif.io`

---

## 📱 ÉTAPE 5 : Configuration Mobile iOS

### 5.1 Vérifier le Bundle ID
Pour iOS, vous devez utiliser le Bundle ID de votre app :

- [ ] Vérifier que `mobile-app-new/app.json` contient le bon Bundle ID :
  ```json
  {
    "expo": {
      "ios": {
        "bundleIdentifier": "io.productif.app"
      }
    }
  }
  ```
- [ ] ✅ Le Bundle ID est déjà configuré : `io.productif.app`

### 5.2 Configurer OAuth Client iOS dans Google Cloud Console
- [ ] Aller dans **APIs & Services** > **Credentials**
- [ ] Créer un **nouveau OAuth 2.0 Client ID**
- [ ] Sélectionner le type **iOS**
- [ ] Entrer le **Bundle ID** : `io.productif.app`
- [ ] **IMPORTANT** : Notez le **Client ID iOS** généré
- [ ] Sauvegarder

### 5.3 Vérifier app.json (Expo)
Vérifier que `mobile-app-new/app.json` contient bien :
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "io.productif.app",
      "usesAppleSignIn": true
    }
  }
}
```

---

## 🔑 ÉTAPE 6 : Vérification des Scopes OAuth

### 6.1 Scopes pour l'Authentification
Les scopes suivants doivent être demandés :
- `openid`
- `email`
- `profile`

### 6.2 Scopes pour Google Calendar
- `https://www.googleapis.com/auth/calendar` (lecture/écriture complète)
- OU `https://www.googleapis.com/auth/calendar.events` (uniquement événements)

### 6.3 Vérifier dans NextAuth
Dans `app/api/auth/[...nextauth]/route.ts`, les scopes doivent inclure Calendar :
```typescript
authorization: {
  params: {
    scope: "openid email profile https://www.googleapis.com/auth/calendar",
    // ...
  },
}
```

---

## 🧪 ÉTAPE 7 : Tests Préliminaires

### 7.1 Tester l'API Google Calendar
- [ ] Créer un script de test pour vérifier l'accès à l'API :
  ```bash
  # Créer scripts/test-google-calendar.js
  ```
- [ ] Vérifier que vous pouvez vous authentifier
- [ ] Vérifier que vous pouvez créer un événement de test

### 7.2 Vérifier les URLs de Callback
- [ ] Web : `http://localhost:3000/api/auth/callback/google`
- [ ] Mobile : L'URL de callback sera gérée par `expo-auth-session`

---

## 📝 ÉTAPE 8 : Documentation et Notes

### 8.1 URLs Importantes à Noter
- [ ] **Google Cloud Console** : https://console.cloud.google.com/
- [ ] **OAuth Consent Screen** : https://console.cloud.google.com/apis/credentials/consent
- [ ] **Credentials** : https://console.cloud.google.com/apis/credentials
- [ ] **Google Calendar API** : https://console.cloud.google.com/apis/library/calendar-json.googleapis.com

### 8.2 Informations de Sécurité
- [ ] ⚠️ **NE JAMAIS** commiter les secrets dans Git
- [ ] ⚠️ Utiliser `.env.local` (déjà dans `.gitignore`)
- [ ] ⚠️ Les refresh tokens sont sensibles, les stocker en base de données sécurisée

---

## ✅ CHECKLIST FINALE

Avant de commencer l'implémentation, vérifiez que :

- [ ] ✅ Google Cloud Console configuré
- [ ] ✅ OAuth 2.0 Credentials créés (Web + Mobile)
- [ ] ✅ Google Calendar API activée
- [ ] ✅ OAuth Consent Screen configuré avec les bons scopes
- [ ] ✅ Packages installés (vérifiés)
- [ ] ✅ Modèle Prisma créé et migration appliquée
- [ ] ✅ Variables d'environnement configurées (local + Vercel)
- [ ] ✅ Bundle ID iOS vérifié et OAuth Client créé
- [ ] ✅ app.json configuré pour iOS

---

## 🚨 PROBLÈMES COURANTS

### Problème : "redirect_uri_mismatch"
**Solution** : Vérifier que toutes les URLs de callback sont bien ajoutées dans Google Cloud Console

### Problème : "access_denied" lors de la demande de scope Calendar
**Solution** : Vérifier que le scope Calendar est bien dans l'OAuth Consent Screen

### Problème : "invalid_client" sur mobile
**Solution** : Vérifier que le Client ID mobile est bien utilisé (pas le web)

### Problème : "insufficient_permissions" pour Calendar
**Solution** : Vérifier que Google Calendar API est activée et que les scopes sont corrects

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifier les logs dans Google Cloud Console > APIs & Services > Credentials
2. Vérifier les logs de votre application
3. Consulter la documentation Google OAuth : https://developers.google.com/identity/protocols/oauth2

---

## 🎯 PROCHAINES ÉTAPES

Une fois cette checklist complétée, vous pourrez :
1. ✅ Implémenter le bouton Google sur la page de login web
2. ✅ Implémenter Google Login sur mobile
3. ✅ Implémenter Google Calendar pour créer des événements

---

**Date de création** : $(date)
**Dernière mise à jour** : $(date)

