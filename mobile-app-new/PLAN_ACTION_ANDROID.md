# Plan d'Action : Adaptation Android pour Productif.io

## 📋 Vue d'ensemble

Ce document détaille les étapes nécessaires pour adapter l'application native iOS (`mobile-app-new/`) pour Android. L'application utilise **Expo** avec **React Native**, ce qui facilite grandement le portage multi-plateforme.

---

## ✅ État actuel

### Ce qui existe déjà
- ✅ Structure Android de base (`android/` folder)
- ✅ Configuration Expo avec support Android dans `app.json`
- ✅ Google Sign-In configuré et fonctionnel sur Android
- ✅ Permissions Android de base dans `AndroidManifest.xml`
- ✅ Build Gradle configuré
- ✅ Package name Android : `io.productif.app`

### Ce qui doit être adapté
- ⚠️ Authentification Apple (iOS uniquement)
- ⚠️ Calendrier Apple (iOS uniquement)
- ⚠️ Notifications Push (Firebase Cloud Messaging pour Android)
- ⚠️ UI/UX spécifiques iOS
- ⚠️ Stripe/Apple Pay → Google Pay
- ⚠️ Permissions Android complètes
- ⚠️ Configuration Google Client ID Android

---

## 🎯 Phase 1 : Configuration Android de base

### 1.1 Vérifier la configuration Google OAuth pour Android

**Fichiers concernés :**
- `app.json`
- `lib/googleAuth.ts`
- `lib/calendarAuth.ts`

**Actions :**
- [ ] Créer un **Android Client ID** dans Google Cloud Console
- [ ] Ajouter le `androidClientId` dans `app.json` (section `android`)
- [ ] Mettre à jour `googleAuth.ts` pour utiliser le bon Client ID selon la plateforme
- [ ] Vérifier que le `webClientId` est correctement configuré

**Configuration requise dans Google Cloud Console :**
```
1. Aller dans Google Cloud Console > APIs & Services > Credentials
2. Créer un OAuth 2.0 Client ID de type "Android"
3. Package name: io.productif.app
4. SHA-1 certificate fingerprint (obtenir avec: keytool -list -v -keystore android/app/debug.keystore)
```

### 1.2 Configurer Firebase Cloud Messaging (FCM) pour Android

**Fichiers concernés :**
- `app.json`
- `android/app/build.gradle`
- `android/app/src/main/AndroidManifest.xml`
- `hooks/usePushNotifications.tsx`

**Actions :**
- [ ] Créer un projet Firebase (ou utiliser l'existant)
- [ ] Télécharger `google-services.json` et le placer dans `android/app/`
- [ ] Ajouter le plugin Firebase dans `android/build.gradle`
- [ ] Configurer FCM dans `AndroidManifest.xml`
- [ ] Mettre à jour `usePushNotifications.tsx` pour gérer les tokens FCM Android
- [ ] Tester l'enregistrement des tokens push sur Android

**Documentation :**
- [Expo Notifications Android](https://docs.expo.dev/versions/latest/sdk/notifications/#android)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

---

## 🎯 Phase 2 : Authentification et Calendrier

### 2.1 Adapter l'authentification Apple pour Android

**Fichiers concernés :**
- `lib/appleAuth.ts`
- `components/onboarding/Auth.tsx`
- `app/login.tsx`
- `app/(onboarding-new)/connection.tsx`
- `app/onboarding/welcome.tsx`

**Actions :**
- [x] ✅ `appleAuth.ts` vérifie déjà `Platform.OS !== 'ios'` - OK
- [ ] Vérifier que tous les composants masquent le bouton Apple Sign-In sur Android
- [ ] Tester que l'authentification Google fonctionne correctement sur Android
- [ ] S'assurer que l'authentification email/password fonctionne sur Android

**Code à vérifier :**
```typescript
// Dans Auth.tsx - déjà fait ✅
{showApple && Platform.OS === 'ios' && (
  <TouchableOpacity onPress={handleAppleAuth}>
    ...
  </TouchableOpacity>
)}
```

### 2.2 Adapter le calendrier Apple pour Android

**Fichiers concernés :**
- `lib/calendarAuth.ts`
- `app/(onboarding-new)/calendar-sync.tsx`
- `components/onboarding/CalendarSync.tsx`

**Actions :**
- [x] ✅ `calendarAuth.ts` vérifie déjà `Platform.OS !== 'ios'` - OK
- [ ] Vérifier que Google Calendar est proposé par défaut sur Android
- [ ] Tester la connexion Google Calendar sur Android
- [ ] S'assurer que les permissions calendrier Android sont demandées correctement
- [ ] Adapter l'UI pour masquer Apple Calendar sur Android

**Permissions Android à vérifier :**
```xml
<!-- Déjà dans AndroidManifest.xml ✅ -->
<uses-permission android:name="android.permission.READ_CALENDAR"/>
<uses-permission android:name="android.permission.WRITE_CALENDAR"/>
```

---

## 🎯 Phase 3 : UI/UX et Composants

### 3.1 Adapter les composants spécifiques iOS

**Fichiers concernés :**
- `components/ui/DatePicker.tsx`
- `components/ui/IconSymbol.tsx` (existe déjà `.ios.tsx`)
- `components/ui/TabBarBackground.tsx` (existe déjà `.ios.tsx`)
- `components/tasks/TasksNew.tsx`
- `app/(tabs)/_layout.tsx`

**Actions :**
- [ ] Vérifier que `DatePicker.tsx` utilise le bon style pour Android (`default` au lieu de `spinner`)
- [ ] Créer `components/ui/IconSymbol.android.tsx` si nécessaire
- [ ] Créer `components/ui/TabBarBackground.android.tsx` si nécessaire
- [ ] Adapter les comportements de clavier (`padding` vs `height`)
- [ ] Tester les animations et transitions sur Android

**Exemples de code à adapter :**
```typescript
// Déjà fait dans plusieurs fichiers ✅
behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
display={Platform.OS === 'ios' ? 'spinner' : 'default'}
```

### 3.2 Adapter les styles et thèmes

**Fichiers concernés :**
- `app/(tabs)/_layout.tsx`
- `constants/Colors.ts`
- Tous les composants avec `Platform.select`

**Actions :**
- [ ] Vérifier que les couleurs fonctionnent bien sur Android
- [ ] Adapter les hauteurs de barre de navigation (iOS: 88px, Android: 70px)
- [ ] Tester le dark mode sur Android
- [ ] Vérifier les safe areas sur Android

---

## 🎯 Phase 4 : Paiements et Stripe

### 4.1 Adapter Apple Pay pour Google Pay

**Fichiers concernés :**
- `components/PaymentButton.tsx` (si existe)
- `app/(onboarding-new)/payment-sheet.tsx`
- `app/(onboarding-new)/stripe-checkout.tsx`
- `app/upgrade.tsx`

**Actions :**
- [ ] Identifier tous les endroits où Apple Pay est utilisé
- [ ] Implémenter Google Pay avec `@stripe/stripe-react-native`
- [ ] Adapter l'UI pour proposer Google Pay sur Android
- [ ] Tester le flux de paiement complet sur Android
- [ ] Vérifier que Stripe est correctement configuré pour Android

**Documentation :**
- [Stripe React Native - Google Pay](https://stripe.dev/stripe-react-native/api-reference/components/google-pay-button)

---

## 🎯 Phase 5 : Permissions et Capacités

### 5.1 Vérifier toutes les permissions Android

**Fichier concerné :**
- `android/app/src/main/AndroidManifest.xml`

**Permissions à vérifier :**
- [x] ✅ INTERNET
- [x] ✅ READ_CALENDAR / WRITE_CALENDAR
- [x] ✅ READ_EXTERNAL_STORAGE / WRITE_EXTERNAL_STORAGE
- [x] ✅ CAMERA (si utilisé)
- [x] ✅ RECORD_AUDIO
- [x] ✅ VIBRATE
- [ ] ⚠️ POST_NOTIFICATIONS (Android 13+) - À ajouter si nécessaire
- [ ] ⚠️ FOREGROUND_SERVICE (si notifications en arrière-plan)

**Actions :**
- [ ] Ajouter `POST_NOTIFICATIONS` pour Android 13+
- [ ] Vérifier que les permissions runtime sont demandées correctement
- [ ] Tester le flux de demande de permissions sur Android

### 5.2 Configurer les permissions runtime

**Fichiers concernés :**
- Code utilisant `expo-image-picker`
- Code utilisant `expo-calendar`
- Code utilisant `expo-notifications`

**Actions :**
- [ ] Vérifier que `expo-image-picker` demande les permissions correctement sur Android
- [ ] Vérifier que `expo-calendar` fonctionne avec Google Calendar sur Android
- [ ] Tester les permissions de notifications sur Android

---

## 🎯 Phase 6 : Configuration Build et Déploiement

### 6.1 Configuration Gradle

**Fichiers concernés :**
- `android/build.gradle`
- `android/app/build.gradle`
- `android/gradle.properties`

**Actions :**
- [ ] Vérifier la version de `compileSdkVersion` (minimum 33 pour Android 13)
- [ ] Vérifier `minSdkVersion` (actuellement 26 dans `app.json`)
- [ ] Vérifier `targetSdkVersion` (recommandé: 34)
- [ ] Configurer ProGuard pour la production
- [ ] Créer un keystore de production (pas le debug.keystore)

### 6.2 Configuration app.json pour Android

**Fichier concerné :**
- `app.json`

**Actions :**
- [ ] Ajouter `androidClientId` dans la section `android`
- [ ] Vérifier `package` (déjà `io.productif.app` ✅)
- [ ] Vérifier `versionCode` (actuellement 8)
- [ ] Configurer les permissions dans `app.json` si nécessaire
- [ ] Ajouter la configuration Firebase si nécessaire

**Exemple de configuration :**
```json
{
  "expo": {
    "android": {
      "package": "io.productif.app",
      "versionCode": 8,
      "googleServicesFile": "./google-services.json",
      "permissions": [
        "CAMERA",
        "RECORD_AUDIO",
        "READ_CALENDAR",
        "WRITE_CALENDAR",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "POST_NOTIFICATIONS"
      ],
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

### 6.3 Configuration de production

**Actions :**
- [ ] Créer un keystore de production
- [ ] Configurer les variables d'environnement pour Android
- [ ] Configurer les signing configs dans `build.gradle`
- [ ] Tester un build de production (`./gradlew assembleRelease`)

---

## 🎯 Phase 7 : Tests et Validation

### 7.1 Tests fonctionnels

**Scénarios à tester :**
- [ ] Authentification Google sur Android
- [ ] Authentification email/password sur Android
- [ ] Connexion Google Calendar sur Android
- [ ] Notifications push sur Android
- [ ] Paiements (Google Pay) sur Android
- [ ] Upload d'images depuis la galerie Android
- [ ] Prise de photo avec la caméra Android
- [ ] Enregistrement audio sur Android
- [ ] Navigation et routing sur Android
- [ ] Dark mode sur Android

### 7.2 Tests sur différents appareils Android

**Appareils à tester :**
- [ ] Android 13+ (permissions runtime)
- [ ] Android 11-12 (permissions legacy)
- [ ] Android 8-10 (compatibilité)
- [ ] Différentes tailles d'écran (phone, tablet)
- [ ] Différents fabricants (Samsung, Google, Xiaomi, etc.)

### 7.3 Tests de performance

**Actions :**
- [ ] Mesurer le temps de démarrage sur Android
- [ ] Vérifier la consommation mémoire
- [ ] Tester les animations et transitions
- [ ] Vérifier la gestion du clavier Android

---

## 🎯 Phase 8 : Documentation et Déploiement

### 8.1 Documentation

**Actions :**
- [ ] Créer un guide de build Android
- [ ] Documenter les différences iOS/Android
- [ ] Créer un guide de configuration Firebase
- [ ] Documenter le processus de release Android

### 8.2 Préparation Google Play Store

**Actions :**
- [ ] Créer un compte développeur Google Play (si pas déjà fait)
- [ ] Préparer les assets (icônes, screenshots, description)
- [ ] Configurer les métadonnées de l'application
- [ ] Préparer la politique de confidentialité
- [ ] Configurer les pricing et disponibilité

---

## 📝 Checklist récapitulative

### Configuration
- [ ] Google OAuth Android Client ID créé et configuré
- [ ] Firebase Cloud Messaging configuré
- [ ] `google-services.json` ajouté
- [ ] Permissions Android complètes
- [ ] `app.json` mis à jour avec config Android

### Code
- [ ] Authentification Apple masquée sur Android
- [ ] Calendrier Apple masqué sur Android
- [ ] Google Pay implémenté (si Apple Pay utilisé)
- [ ] UI adaptée pour Android
- [ ] Notifications push fonctionnelles sur Android

### Build
- [ ] Build debug fonctionne
- [ ] Build release fonctionne
- [ ] Keystore de production créé
- [ ] Signing configuré

### Tests
- [ ] Tests fonctionnels passés
- [ ] Tests sur plusieurs appareils Android
- [ ] Tests de performance OK

### Déploiement
- [ ] Documentation créée
- [ ] Google Play Store préparé
- [ ] Version de production prête

---

## 🔧 Commandes utiles

### Build et test
```bash
# Lancer l'app Android en développement
npm run android
# ou
npx expo run:android

# Build debug
cd android && ./gradlew assembleDebug

# Build release
cd android && ./gradlew assembleRelease

# Nettoyer le build
cd android && ./gradlew clean
```

### Debugging
```bash
# Voir les logs Android
adb logcat | grep ReactNativeJS

# Voir les logs Expo
npx expo start --android

# Installer l'APK sur un appareil
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Certificats
```bash
# Obtenir le SHA-1 pour Google OAuth
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Pour le keystore de production
keytool -list -v -keystore android/app/release.keystore -alias release
```

---

## 📚 Ressources

- [Expo Android Documentation](https://docs.expo.dev/workflow/android/)
- [React Native Android Setup](https://reactnative.dev/docs/environment-setup)
- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)
- [Google Sign-In Android](https://developers.google.com/identity/sign-in/android)
- [Stripe React Native](https://stripe.dev/stripe-react-native/)
- [Android Permissions](https://developer.android.com/guide/topics/permissions/overview)

---

## ⚠️ Points d'attention

1. **Apple Sign-In** : Ne jamais essayer de l'utiliser sur Android, toujours vérifier `Platform.OS === 'ios'`
2. **Calendrier Apple** : Utiliser uniquement Google Calendar sur Android
3. **Notifications** : FCM pour Android vs APNs pour iOS
4. **Permissions** : Android 13+ nécessite `POST_NOTIFICATIONS` explicitement
5. **Paiements** : Google Pay sur Android, Apple Pay sur iOS
6. **UI** : Adapter les hauteurs, paddings, et comportements de clavier
7. **Keystore** : Ne jamais commiter le keystore de production

---

**Date de création :** 25 janvier 2026  
**Dernière mise à jour :** 25 janvier 2026
