# Capabilities Nécessaires pour Productif.io sur Apple Developer

## 📋 Analyse de l'Application

Après analyse du code de l'application native dans `mobile-app-new`, voici les capabilities que vous **DEVEZ** activer dans votre App ID sur Apple Developer.

## ✅ Capabilities OBLIGATOIRES

### 1. **Push Notifications** ✅ REQUIS

**Pourquoi :**
- L'application utilise un service de notifications push (`notificationService.ts`)
- Les utilisateurs peuvent activer/désactiver les notifications push dans les paramètres
- L'app enregistre des tokens push pour recevoir des notifications

**Fichiers concernés :**
- `src/services/notificationService.ts`
- `app/notifications.tsx`
- `app/(tabs)/settings.tsx`

**Configuration requise :**
- Activez cette capability dans votre App ID
- Configurez les certificats Push Notifications (APNs) dans Apple Developer
- Vous devrez créer un certificat APNs (Apple Push Notification service) séparément

---

### 2. **Sign In with Apple** ✅ REQUIS

**Pourquoi :**
- L'application permet la connexion via Apple (`expo-apple-authentication`)
- Utilisé dans plusieurs écrans : login, onboarding, connection

**Fichiers concernés :**
- `app/login.tsx` (lignes 350-393)
- `app/(onboarding-new)/connection.tsx` (lignes 188-228)
- `app/onboarding/welcome.tsx` (lignes 28-56)
- Package : `expo-apple-authentication@~7.2.4`

**Configuration requise :**
- Activez cette capability dans votre App ID
- Configurez le service dans Apple Developer (bouton "Configure" à côté de la capability)
- Vous devrez accepter l'accord Apple Developer pour Sign In with Apple

---

### 3. **Apple Pay Payment Processing** ✅ REQUIS

**Pourquoi :**
- L'application utilise Apple Pay pour les paiements via Stripe
- Le composant `PaymentButton` implémente Apple Pay pour iOS

**Fichiers concernés :**
- `components/PaymentButton.tsx` (lignes 49-100)
- `app/upgrade.tsx`
- `app/(onboarding-new)/profile-reveal.tsx`
- Package : `@stripe/stripe-react-native@^0.57.0`

**Configuration requise :**
- Activez cette capability dans votre App ID
- Configurez Apple Pay dans Apple Developer (bouton "Configure")
- Vous devrez :
  1. Créer un Merchant ID dans Apple Developer
  2. Configurer les certificats Apple Pay
  3. Lier votre compte Stripe avec Apple Pay
  4. Accepter l'accord Apple Pay

---

### 4. **In-App Purchase** ⚠️ À VÉRIFIER

**Pourquoi :**
- L'application utilise `expo-superwall` qui peut gérer les achats in-app
- Cependant, l'app utilise principalement Stripe pour les paiements
- Superwall est utilisé pour les paywalls mais peut aussi gérer les achats StoreKit

**Fichiers concernés :**
- Package : `expo-superwall@latest`
- `ios/Pods 3/SuperwallKit/` (gestion des achats StoreKit)

**Recommandation :**
- Si vous utilisez uniquement Stripe (Apple Pay) : **NON requis**
- Si vous prévoyez d'utiliser StoreKit pour les abonnements iOS : **REQUIS**

**Configuration requise (si activé) :**
- Activez cette capability dans votre App ID
- Configurez les produits in-app dans App Store Connect
- Créez les abonnements/produits dans App Store Connect

---

## ❌ Capabilities NON NÉCESSAIRES

Basé sur l'analyse du code, ces capabilities **NE SONT PAS** utilisées :

- ❌ **Associated Domains** - Pas de configuration d'Universal Links trouvée
- ❌ **iCloud** - Pas d'utilisation de CloudKit ou iCloud Storage
- ❌ **HealthKit** - Non utilisé
- ❌ **HomeKit** - Non utilisé
- ❌ **Game Center** - Non utilisé
- ❌ **Siri** - Non utilisé
- ❌ **Wallet** - Non utilisé (Apple Pay est différent)
- ❌ **Maps** - Non utilisé
- ❌ **Background Modes** - Non configuré explicitement
- ❌ **App Groups** - Non utilisé
- ❌ **Keychain Sharing** - Non utilisé
- ❌ **Inter-App Audio** - Non utilisé
- ❌ **Personal VPN** - Non utilisé
- ❌ **Network Extensions** - Non utilisé
- ❌ Toutes les autres capabilities listées - Non utilisées

---

## 📝 Résumé des Capabilities à Activer

Dans Apple Developer Portal, lorsque vous créez/modifiez votre App ID (`io.productif.app`), cochez **UNIQUEMENT** :

1. ✅ **Push Notifications**
2. ✅ **Sign In with Apple** (cliquez sur "Configure" pour accepter l'accord)
3. ✅ **Apple Pay Payment Processing** (cliquez sur "Configure" pour configurer le Merchant ID)

### Optionnel (selon vos besoins) :
4. ⚠️ **In-App Purchase** (seulement si vous utilisez StoreKit en plus de Stripe)

---

## 🔧 Étapes de Configuration Détaillées

### Étape 1 : Push Notifications

1. Dans Apple Developer Portal > **Certificates, Identifiers & Profiles**
2. Allez dans **Identifiers** > Sélectionnez votre App ID
3. Cochez **Push Notifications**
4. Cliquez sur **"Save"**
5. Ensuite, créez un certificat APNs :
   - Allez dans **Certificates**
   - Créez un nouveau certificat **"Apple Push Notification service SSL (Sandbox & Production)"**
   - Sélectionnez votre App ID
   - Suivez les instructions pour créer et télécharger le certificat

### Étape 2 : Sign In with Apple

1. Dans votre App ID, cochez **Sign In with Apple**
2. Cliquez sur **"Configure"** à côté de Sign In with Apple
3. Acceptez l'accord Apple Developer pour Sign In with Apple
4. **Configurez le Server-to-Server Notification Endpoint** :
   - Dans le champ **"Server-to-Server Notification Endpoint"**, entrez :
     ```
     https://www.productif.io/api/auth/oauth/apple/notifications
     ```
   - Cet endpoint recevra des notifications d'Apple concernant les changements de compte utilisateur
   - **Important** : L'endpoint doit être accessible en HTTPS avec TLS 1.2+
5. Cliquez sur **"Save"**

**Note** : Consultez `APPLE_SIGNIN_NOTIFICATIONS.md` pour plus de détails sur la configuration et l'implémentation de cet endpoint.

### Étape 3 : Apple Pay Payment Processing

1. Dans votre App ID, cochez **Apple Pay Payment Processing**
2. Cliquez sur **"Configure"** à côté d'Apple Pay
3. Créez ou sélectionnez un **Merchant ID** :
   - Si vous n'en avez pas, créez-en un dans **Identifiers** > **Merchant IDs**
   - Format recommandé : `merchant.io.productif.app`
4. Acceptez l'accord Apple Pay
5. Configurez votre compte Stripe avec ce Merchant ID
6. Cliquez sur **"Save"**

### Étape 4 : In-App Purchase (Optionnel)

1. Dans votre App ID, cochez **In-App Purchase**
2. Cliquez sur **"Save"**
3. Dans App Store Connect, créez vos produits/abonnements

---

## ⚠️ Notes Importantes

1. **Ne cochez QUE les capabilities que vous utilisez** - Cocher des capabilities inutiles peut compliquer la configuration et la review Apple

2. **Push Notifications nécessite des certificats séparés** - Vous devrez créer des certificats APNs en plus des certificats de distribution

3. **Apple Pay nécessite un Merchant ID** - C'est différent de votre App ID, créez-le séparément

4. **Sign In with Apple nécessite un accord** - Vous devrez accepter l'accord Apple Developer spécifique

5. **Après modification de l'App ID** - Vous devrez régénérer vos profils de provisioning pour inclure les nouvelles capabilities

---

## ✅ Checklist Finale

Avant de soumettre votre app :

- [ ] Push Notifications activé dans App ID
- [ ] Certificat APNs créé et installé
- [ ] Sign In with Apple activé et configuré
- [ ] Accord Sign In with Apple accepté
- [ ] Apple Pay activé dans App ID
- [ ] Merchant ID créé pour Apple Pay
- [ ] Accord Apple Pay accepté
- [ ] Profils de provisioning mis à jour avec les nouvelles capabilities
- [ ] Testé sur un appareil réel (les capabilities ne fonctionnent pas sur simulateur)

---

**Dernière mise à jour :** Analyse basée sur le code du `mobile-app-new` au moment de la création de ce document.

