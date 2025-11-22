# Guide de Configuration Apple Developer pour Productif.io

Ce guide vous accompagne étape par étape dans la création et la configuration de votre application sur Apple Developer.

## 📋 Prérequis

- Un compte Apple Developer actif (99$/an)
- Xcode installé sur votre Mac
- Votre Mac configuré avec votre compte Apple Developer
- L'application Productif.io configurée avec le bundle identifier : `io.productif.app`

## 🚀 Étape 1 : Accéder à Apple Developer Portal

1. Allez sur [developer.apple.com](https://developer.apple.com)
2. Connectez-vous avec votre compte Apple Developer
3. Cliquez sur **"Certificates, Identifiers & Profiles"** dans le menu de gauche

## 🆔 Étape 2 : Créer l'App ID

1. Dans le menu de gauche, cliquez sur **"Identifiers"**
2. Cliquez sur le bouton **"+"** en haut à gauche
3. Sélectionnez **"App IDs"** et cliquez sur **"Continue"**
4. Sélectionnez **"App"** et cliquez sur **"Continue"**
5. Remplissez les informations :
   - **Description** : `Productif.io`
   - **Bundle ID** : Sélectionnez **"Explicit"** et entrez : `io.productif.app`
6. Dans la section **"Capabilities"**, cochez les fonctionnalités nécessaires :
   - ✅ **Push Notifications** (REQUIS - l'app utilise les notifications push)
   - ✅ **Sign in with Apple** (REQUIS - l'app permet la connexion via Apple)
   - ✅ **Apple Pay Payment Processing** (REQUIS - l'app utilise Apple Pay via Stripe)
   - ⚠️ **In-App Purchase** (OPTIONNEL - seulement si vous utilisez StoreKit en plus de Stripe)
   
   **Note :** Consultez `CAPABILITIES_APPLE_DEVELOPER.md` pour une analyse détaillée des capabilities nécessaires.
7. Cliquez sur **"Continue"** puis **"Register"**

## 🔐 Étape 3 : Créer les Certificats

### 3.1 Certificat de Distribution (App Store)

1. Dans le menu de gauche, cliquez sur **"Certificates"**
2. Cliquez sur le bouton **"+"** en haut à gauche
3. Sous **"Software"**, sélectionnez **"Apple Distribution"**
4. Cliquez sur **"Continue"**
5. Suivez les instructions pour créer une **Certificate Signing Request (CSR)** :
   - Ouvrez **Keychain Access** sur votre Mac
   - Menu : **Keychain Access > Certificate Assistant > Request a Certificate From a Certificate Authority**
   - Entrez votre email Apple Developer
   - Sélectionnez **"Save to disk"**
   - Téléchargez le fichier `.certSigningRequest`
6. Uploadez le fichier CSR sur Apple Developer
7. Téléchargez le certificat et double-cliquez dessus pour l'installer dans Keychain

### 3.2 Certificat de Développement (optionnel, pour tester)

1. Répétez les étapes 3.1 mais sélectionnez **"Apple Development"** au lieu de **"Apple Distribution"**

## 📱 Étape 4 : Créer les Profils de Provisioning

### 4.1 Profil de Distribution (App Store)

1. Dans le menu de gauche, cliquez sur **"Profiles"**
2. Cliquez sur le bouton **"+"** en haut à gauche
3. Sélectionnez **"App Store"** sous **"Distribution"**
4. Cliquez sur **"Continue"**
5. Sélectionnez l'App ID que vous avez créé : `io.productif.app`
6. Cliquez sur **"Continue"**
7. Sélectionnez le certificat de distribution que vous avez créé
8. Cliquez sur **"Continue"**
9. Donnez un nom au profil : `Productif.io App Store`
10. Cliquez sur **"Generate"**
11. Téléchargez le profil et double-cliquez dessus pour l'installer

### 4.2 Profil de Développement (pour tester sur appareils)

1. Répétez les étapes 4.1 mais :
   - Sélectionnez **"Development"** au lieu de **"Distribution"**
   - Sélectionnez **"iOS App Development"**
   - Sélectionnez les appareils de test (vous devrez les enregistrer d'abord si nécessaire)
   - Nommez-le : `Productif.io Development`

## 🏪 Étape 5 : Créer l'Application dans App Store Connect

1. Allez sur [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Connectez-vous avec votre compte Apple Developer
3. Cliquez sur **"My Apps"**
4. Cliquez sur le bouton **"+"** et sélectionnez **"New App"**
5. Remplissez les informations :
   - **Platform** : iOS
   - **Name** : `Productif.io`
   - **Primary Language** : Français (ou votre langue principale)
   - **Bundle ID** : Sélectionnez `io.productif.app`
   - **SKU** : `productif-io` (identifiant unique, peut être n'importe quoi)
   - **User Access** : Sélectionnez **"Full Access"** si vous êtes le seul développeur
6. Cliquez sur **"Create"**

## ⚙️ Étape 6 : Configurer Xcode

### 6.1 Ouvrir le projet dans Xcode

```bash
cd mobile-app-new/ios
open mobileappnew.xcworkspace
```

**Important** : Ouvrez le fichier `.xcworkspace` et non `.xcodeproj` !

### 6.2 Configurer le Signing & Capabilities

1. Dans Xcode, sélectionnez le projet **"mobileappnew"** dans le navigateur de gauche
2. Sélectionnez la cible **"mobileappnew"**
3. Allez dans l'onglet **"Signing & Capabilities"**
4. Cochez **"Automatically manage signing"**
5. Sélectionnez votre **Team** (votre compte Apple Developer)
6. Vérifiez que le **Bundle Identifier** est bien `io.productif.app`
7. Xcode devrait automatiquement :
   - Créer/mettre à jour le profil de provisioning
   - Configurer les certificats nécessaires

### 6.3 Vérifier les Capabilities

Dans l'onglet **"Signing & Capabilities"**, vérifiez que les capabilities nécessaires sont ajoutées :
- ✅ Push Notifications (REQUIS)
- ✅ Sign in with Apple (REQUIS)
- ✅ Apple Pay (REQUIS - apparaît comme "Apple Pay" dans Xcode)
- ⚠️ In-App Purchase (optionnel)

**Note :** Xcode ajoutera automatiquement ces capabilities si elles sont activées dans votre App ID et que vous avez coché "Automatically manage signing".

## 📦 Étape 7 : Préparer l'Archive pour l'App Store

### 7.1 Configurer le schéma de build

1. Dans Xcode, sélectionnez **"Any iOS Device"** dans la barre d'outils (pas un simulateur)
2. Menu : **Product > Scheme > Edit Scheme...**
3. Sélectionnez **"Archive"** dans la liste de gauche
4. Vérifiez que **"Build Configuration"** est sur **"Release"**
5. Cliquez sur **"Close"**

### 7.2 Créer l'Archive

1. Menu : **Product > Archive**
2. Attendez que la compilation se termine
3. L'**Organizer** s'ouvrira automatiquement avec votre archive

### 7.3 Distribuer vers App Store Connect

1. Dans l'Organizer, sélectionnez votre archive
2. Cliquez sur **"Distribute App"**
3. Sélectionnez **"App Store Connect"**
4. Cliquez sur **"Next"**
5. Sélectionnez **"Upload"**
6. Cliquez sur **"Next"**
7. Vérifiez les options :
   - ✅ **"Upload your app's symbols"** (recommandé pour le debugging)
   - ✅ **"Manage Version and Build Number"** (optionnel)
8. Cliquez sur **"Next"**
9. Vérifiez le profil de provisioning et le certificat
10. Cliquez sur **"Upload"**
11. Attendez que l'upload se termine (peut prendre plusieurs minutes)

## 📝 Étape 8 : Compléter les Informations dans App Store Connect

Une fois l'archive uploadée, retournez sur App Store Connect :

1. Allez dans **"My Apps" > Productif.io**
2. Cliquez sur **"1.0 Prepare for Submission"** (ou la version correspondante)
3. Remplissez toutes les sections requises :

### Informations de l'App
- **Name** : `Productif.io`
- **Subtitle** : (optionnel) Une description courte
- **Category** : Sélectionnez les catégories appropriées (ex: Productivity, Business)
- **Privacy Policy URL** : URL de votre politique de confidentialité

### Captures d'écran
- Téléchargez des captures d'écran pour :
  - iPhone 6.7" (iPhone 14 Pro Max, etc.)
  - iPhone 6.5" (iPhone 11 Pro Max, etc.)
  - iPad Pro 12.9" (si votre app supporte iPad)

### Description
- **Description** : Description détaillée de votre app
- **Keywords** : Mots-clés pour la recherche (séparés par des virgules)
- **Support URL** : URL de support
- **Marketing URL** : (optionnel) URL marketing

### Informations de Build
- Sélectionnez le build que vous avez uploadé

### Informations de Version
- **Copyright** : Votre copyright (ex: "© 2024 Productif.io")
- **Version** : `1.0.7` (correspond à votre app.json)

### Informations de Pricing
- Sélectionnez le prix (gratuit ou payant)
- Configurez les achats in-app si nécessaire

### Informations de Review
- **Contact Information** : Vos coordonnées
- **Demo Account** : (si nécessaire) Compte de démonstration pour les reviewers
- **Notes** : Notes pour les reviewers Apple

## ✅ Étape 9 : Soumettre pour Review

1. Une fois toutes les informations complétées, cliquez sur **"Submit for Review"**
2. Répondez aux questions de conformité :
   - Export Compliance
   - Content Rights
   - Advertising Identifier
3. Cliquez sur **"Submit"**

## 🔄 Workflow de Mise à Jour

Pour les futures versions :

1. Mettez à jour la version dans `app.json` :
   ```json
   "version": "1.0.8"
   ```
2. Mettez à jour le build number dans Xcode (ou laissez Xcode le gérer automatiquement)
3. Créez une nouvelle archive
4. Uploadez-la sur App Store Connect
5. Complétez les informations de mise à jour
6. Soumettez pour review

## 🛠️ Commandes Utiles

### Synchroniser Expo avec iOS
```bash
cd mobile-app-new
npx expo prebuild --platform ios
```

### Installer les dépendances CocoaPods
```bash
cd mobile-app-new/ios
pod install
```

### Ouvrir le projet dans Xcode
```bash
cd mobile-app-new/ios
open mobileappnew.xcworkspace
```

### Nettoyer et reconstruire
```bash
cd mobile-app-new/ios
rm -rf build/
rm -rf Pods/
pod install
```

## ⚠️ Points Importants

1. **Bundle Identifier** : Doit être unique et correspondre exactement à celui dans App Store Connect
2. **Version** : La version dans `app.json` doit correspondre à celle dans App Store Connect
3. **Build Number** : Doit être incrémenté à chaque upload
4. **Certificats** : Valides et non expirés
5. **Profils de Provisioning** : Doivent correspondre au bundle identifier et aux certificats

## 📞 Support

Si vous rencontrez des problèmes :
- [Documentation Apple Developer](https://developer.apple.com/documentation)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Expo Documentation](https://docs.expo.dev/)

## ✅ Checklist Finale

Avant de soumettre :
- [ ] App ID créé avec le bundle identifier `io.productif.app`
- [ ] Certificat de distribution créé et installé
- [ ] Profil de provisioning App Store créé et installé
- [ ] Application créée dans App Store Connect
- [ ] Archive créée et uploadée avec succès
- [ ] Toutes les informations complétées dans App Store Connect
- [ ] Captures d'écran uploadées
- [ ] Description et métadonnées complètes
- [ ] Politique de confidentialité accessible
- [ ] Version et build number corrects

---

**Bon courage avec votre soumission ! 🚀**

