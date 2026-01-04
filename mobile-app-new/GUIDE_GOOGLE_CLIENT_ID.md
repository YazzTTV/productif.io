# Guide : Créer un Web Client ID dans le projet iOS

## 🎯 Objectif

Créer un **Web Client ID** dans le même projet Google Cloud que votre **iOS Client ID** pour résoudre l'erreur `invalid_audience`.

## 📋 Prérequis

- Accès à [Google Cloud Console](https://console.cloud.google.com/)
- Projet Google Cloud : `productifio-482307` (ID: `738789952398`)
- iOS Client ID existant : `738789952398-m6risp9hae6ao11n7s4178nig64largu.apps.googleusercontent.com`

---

## 🔧 Étapes détaillées

### Étape 1 : Accéder au bon projet

1. Ouvrez [Google Cloud Console](https://console.cloud.google.com/)
2. Dans le sélecteur de projet (en haut à gauche), sélectionnez **`productifio-482307`**
   - Vérifiez que l'ID du projet est `738789952398`

### Étape 2 : Vérifier le Client ID iOS existant

1. Allez dans **APIs & Services** > **Credentials**
2. Cherchez votre **iOS Client ID** :
   - Nom : probablement "iOS Client" ou similaire
   - ID : `738789952398-m6risp9hae6ao11n7s4178nig64largu.apps.googleusercontent.com`
   - Type : iOS
3. ✅ Notez-le pour référence

### Étape 3 : Créer le Web Client ID

1. Toujours dans **APIs & Services** > **Credentials**
2. Cliquez sur **+ CREATE CREDENTIALS** (en haut de la page)
3. Sélectionnez **OAuth client ID**

#### 3.1 Configuration de l'écran de consentement (si première fois)

Si vous voyez un message demandant de configurer l'écran de consentement :

1. **User Type** : Sélectionnez **External** (ou Internal si vous êtes sur Google Workspace)
2. Cliquez sur **CREATE**

3. **App information** :
   - **App name** : `Productif.io`
   - **User support email** : Votre email
   - **App logo** : (optionnel) Logo de l'app
   - **App domain** : `productif.io`
   - **Developer contact information** : Votre email
   - Cliquez sur **SAVE AND CONTINUE**

4. **Scopes** :
   - Cliquez sur **ADD OR REMOVE SCOPES**
   - Sélectionnez :
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
     - `https://www.googleapis.com/auth/calendar.events` (pour Calendar)
   - Cliquez sur **UPDATE**
   - Cliquez sur **SAVE AND CONTINUE**

5. **Test users** (si app en mode Testing) :
   - Ajoutez votre email de test
   - Cliquez sur **SAVE AND CONTINUE**

6. **Summary** :
   - Vérifiez les informations
   - Cliquez sur **BACK TO DASHBOARD**

#### 3.2 Créer le Client ID Web

1. **Application type** : Sélectionnez **Web application**
2. **Name** : `Productif.io Web Client` (ou un nom clair)
3. **Authorized JavaScript origins** : Ajoutez :
   ```
   https://www.productif.io
   https://productif.io
   ```
4. **Authorized redirect URIs** : Ajoutez :
   ```
   https://www.productif.io/api/auth/callback/google
   https://www.productif.io/api/auth/google/callback
   ```
5. Cliquez sur **CREATE**

### Étape 4 : Copier le nouveau Web Client ID

1. Une popup s'affiche avec votre nouveau **Client ID**
2. **Format attendu** : `738789952398-XXXXXXXXXX.apps.googleusercontent.com`
   - ⚠️ **IMPORTANT** : Il doit commencer par `738789952398-` (même préfixe que l'iOS Client ID)
3. **Copiez ce Client ID** et gardez-le précieusement

---

## ✅ Vérification

Vérifiez que les deux Client IDs sont dans le même projet :

- ✅ **iOS Client ID** : `738789952398-...` 
- ✅ **Web Client ID** : `738789952398-...` (nouveau)

Les deux doivent commencer par **`738789952398-`** (même projet).

---

## 🔄 Mise à jour de la configuration

Une fois le Web Client ID créé, mettez à jour :

### 1. `mobile-app-new/app.json`

```json
{
  "expo": {
    "extra": {
      "googleClientId": "738789952398-m6risp9hae6ao11n7s4178nig64largu.apps.googleusercontent.com",
      "googleWebClientId": "738789952398-VOTRE_NOUVEAU_WEB_CLIENT_ID.apps.googleusercontent.com",
      "apiUrl": "https://www.productif.io"
    }
  }
}
```

### 2. Variables d'environnement Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com/)
2. Projet : `productif-io-1`
3. **Settings** > **Environment Variables**
4. Mettez à jour `GOOGLE_CLIENT_ID` avec le nouveau Web Client ID
5. Ajoutez `GOOGLE_MOBILE_CLIENT_ID_IOS` = `738789952398-m6risp9hae6ao11n7s4178nig64largu.apps.googleusercontent.com`
6. **Save** et **Redeploy**

### 3. Variables d'environnement locale (`.env.local`)

```env
GOOGLE_CLIENT_ID=738789952398-VOTRE_NOUVEAU_WEB_CLIENT_ID.apps.googleusercontent.com
GOOGLE_MOBILE_CLIENT_ID_IOS=738789952398-m6risp9hae6ao11n7s4178nig64largu.apps.googleusercontent.com
```

---

## 🧪 Test

1. Rebuild l'app mobile :
   ```bash
   cd mobile-app-new
   npx expo prebuild --clean --platform ios
   npx expo run:ios
   ```

2. Testez la connexion Google :
   - L'erreur `invalid_audience` ne doit plus apparaître
   - L'idToken doit être généré avec l'audience = Web Client ID
   - La connexion doit fonctionner

3. Vérifiez les logs :
   - Dans la console mobile, vous devriez voir :
     ```
     ✅ [GoogleAuth] Les deux Client IDs sont dans le même projet: 738789952398
     ✅ [GoogleAuth] Audience vérifiée: 738789952398-...
     ```

---

## 🆘 Dépannage

### Erreur : "Les Client IDs ne sont pas dans le même projet"

- Vérifiez que les deux IDs commencent par `738789952398-`
- Si non, vous avez créé le Web Client ID dans le mauvais projet
- Solution : Supprimez-le et recréez-le dans le bon projet

### Erreur : "idToken manquant"

- Vérifiez que `webClientId` est bien configuré dans `GoogleSignin.configure()`
- Vérifiez que `offlineAccess: true` est activé
- Vérifiez les logs pour voir la réponse complète de Google Sign-In

### Erreur : "invalid_audience" persiste

- Vérifiez que le backend accepte le bon audience
- Vérifiez les logs backend pour voir l'audience du token reçu
- Assurez-vous que `GOOGLE_CLIENT_ID` sur Vercel = nouveau Web Client ID

---

## 📝 Notes importantes

- ⚠️ **Ne mélangez jamais** des Client IDs de projets différents
- ✅ **Toujours vérifier** que les préfixes correspondent (738789952398)
- 🔄 **Rebuild nécessaire** après modification de `app.json`
- 🚀 **Redeploy nécessaire** après modification des variables Vercel

