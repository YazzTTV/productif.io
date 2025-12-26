# 🎯 Résumé Rapide - Préparation Option 4

## ⚡ Actions Immédiates Requises

### 1️⃣ Google Cloud Console (30-45 min)

#### A. Créer OAuth Client pour Mobile iOS
```
1. Aller sur https://console.cloud.google.com/
2. APIs & Services > Credentials
3. Créer OAuth 2.0 Client ID
   - Type: iOS
   - Bundle ID: io.productif.app
   - Noter le Client ID généré
```

#### B. Activer Google Calendar API
```
1. APIs & Services > Library
2. Rechercher "Google Calendar API"
3. Cliquer "Enable"
```

#### C. Configurer OAuth Consent Screen
```
1. APIs & Services > OAuth consent screen
2. Ajouter scope: https://www.googleapis.com/auth/calendar
3. Sauvegarder
```

### 2️⃣ Base de Données (10 min)

#### A. Ajouter le Modèle Prisma
```prisma
// Dans prisma/schema.prisma
model GoogleCalendarToken {
  id            String   @id @default(cuid())
  userId        String   @unique
  accessToken   String   @db.Text
  refreshToken  String?  @db.Text
  expiresAt     DateTime
  scope         String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("google_calendar_tokens")
}
```

#### B. Ajouter Relation dans User
```prisma
model User {
  // ... existant ...
  googleCalendarToken GoogleCalendarToken?
}
```

#### C. Créer Migration
```bash
npx prisma migrate dev --name add_google_calendar_tokens
npx prisma generate
```

### 3️⃣ Variables d'Environnement (5 min)

#### A. Backend (.env.local)
```env
# Ajouter ces lignes
GOOGLE_MOBILE_CLIENT_ID_IOS="votre-client-id-ios.apps.googleusercontent.com"
NEXT_PUBLIC_API_URL="https://www.productif.io"
```

#### B. Vercel (Production)
```
Settings > Environment Variables > Ajouter:
- GOOGLE_MOBILE_CLIENT_ID_IOS
- NEXT_PUBLIC_API_URL
```

### 4️⃣ iOS Bundle ID (5 min)

#### Vérifier le Bundle ID
Le Bundle ID est déjà configuré dans `app.json` : `io.productif.app`

#### Configurer dans Google Cloud Console
```
1. APIs & Services > Credentials
2. Créer OAuth 2.0 Client ID > Type: iOS
3. Entrer Bundle ID: io.productif.app
4. Noter le Client ID généré
5. Sauvegarder
```

---

## ✅ Checklist Rapide

- [ ] Google Cloud Console : OAuth Client Mobile créé
- [ ] Google Cloud Console : Calendar API activée
- [ ] Google Cloud Console : Scope Calendar ajouté
- [ ] Prisma : Modèle GoogleCalendarToken ajouté
- [ ] Prisma : Migration créée et appliquée
- [ ] .env.local : Variables ajoutées
- [ ] Vercel : Variables ajoutées
- [ ] iOS : Bundle ID vérifié et OAuth Client créé

---

## 📦 Packages (Déjà Installés ✅)

- ✅ `googleapis` - Backend
- ✅ `next-auth` - Backend
- ✅ `expo-auth-session` - Mobile
- ✅ `expo-crypto` - Mobile (via expo-auth-session)

---

## 🔑 Informations à Noter

### Google Cloud Console
- **Web Client ID** : `1024769827714-fd4aclog3ui0krb47v0av9bbacu6o727.apps.googleusercontent.com` ✅
- **Web Client Secret** : `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` ✅
- **Mobile Client ID (iOS)** : `________________________` ⚠️ À CRÉER
- **Bundle ID iOS** : `io.productif.app` ✅

### URLs de Callback
- **Web** : `https://www.productif.io/api/auth/callback/google` ✅
- **Mobile** : Géré automatiquement par expo-auth-session ✅

---

## ⚠️ Points d'Attention

1. **Scopes OAuth** : Assurez-vous d'inclure `https://www.googleapis.com/auth/calendar`
2. **Bundle ID iOS** : Doit correspondre exactement à celui dans app.json (`io.productif.app`)
3. **Client IDs** : Ne pas mélanger Web et Mobile (utiliser le Client ID iOS pour mobile)
4. **Refresh Tokens** : Stocker en base de données de manière sécurisée

---

## 🚀 Une Fois Terminé

Vous pourrez commencer l'implémentation :
1. Phase 1 : Bouton Google sur login web (30 min)
2. Phase 2 : Google Login mobile (1 jour)
3. Phase 3 : Google Calendar intégration (2 jours)

---

**📖 Pour plus de détails, voir : `docs/PREPARATION_OPTION_4.md`**

