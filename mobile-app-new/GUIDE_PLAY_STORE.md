# Guide de publication sur Google Play Store

## 📦 Informations de l'APK

- **Fichier APK** : `android/app/build/outputs/apk/release/app-release.apk`
- **Taille** : ~105 Mo
- **Version** : 1.0.7
- **Version Code** : 8
- **Package** : `io.productif.app`
- **Keystore** : `android/app/productif-upload.keystore` (alias: `productif`)

---

## 🚀 Étapes de publication

### 1. Créer un compte Google Play Console

1. Va sur [Google Play Console](https://play.google.com/console)
2. Connecte-toi avec ton compte Google
3. Accepte les conditions et paie les **25$ de frais d'inscription** (une seule fois)

### 2. Créer l'application

1. Clique sur **"Créer une application"**
2. Remplis les informations :
   - **Nom de l'application** : Productif.io
   - **Langue par défaut** : Français (France)
   - **Type d'application** : Application
   - **Gratuit ou payant** : Gratuit (ou payant selon ton modèle)
   - Accepte les déclarations

### 3. Configurer le profil de l'application

#### 3.1 Informations sur l'application

- **Nom de l'application** : Productif.io
- **Description courte** (80 caractères max) : 
  ```
  Gestion de tâches, habitudes et productivité avec IA
  ```
- **Description complète** (4000 caractères max) :
  ```
  Productif.io est votre assistant personnel pour la productivité et la gestion de vos tâches quotidiennes.

  🎯 FONCTIONNALITÉS PRINCIPALES :
  • Gestion de tâches intelligente avec priorisation automatique
  • Suivi des habitudes avec rappels personnalisés
  • Assistant IA intégré pour optimiser votre productivité
  • Synchronisation avec votre calendrier
  • Notifications push personnalisables
  • Statistiques et analyses de performance
  • Mode focus pour des sessions de travail concentrées

  📱 INTERFACE MODERNE :
  • Design épuré et intuitif
  • Navigation fluide
  • Mode sombre disponible
  • Personnalisation complète

  🔒 SÉCURITÉ :
  • Connexion sécurisée avec Google Sign-In
  • Données chiffrées
  • Respect de votre vie privée

  Commencez dès aujourd'hui à améliorer votre productivité avec Productif.io !
  ```

#### 3.2 Graphismes

**Icône de l'application** :
- Format : PNG, 512x512 px
- Fichier : `assets/images/icon.png` (redimensionner à 512x512 si nécessaire)

**Image de présentation** :
- Format : PNG ou JPG, 1024x500 px minimum
- Crée une image attrayante avec le logo et un slogan

**Capture d'écran** :
- Minimum : 2 captures (téléphone)
- Recommandé : 4-8 captures
- Formats acceptés : PNG ou JPG
- Résolution : 16:9 ou 9:16
- Taille max : 8 Mo par image

**Image bannière** :
- Format : PNG, 1024x500 px
- Optionnel mais recommandé

#### 3.3 Classification du contenu

- **Catégorie** : Productivité
- **Questionnaire de classification** : Réponds aux questions selon ton app

#### 3.4 Public cible

- **Public cible** : Tout le monde (ou 13+ selon le contenu)
- **Nouveautés et événements** : Sélectionne les catégories pertinentes

### 4. Configurer la distribution

#### 4.1 Pays et régions

- Sélectionne les pays où tu veux distribuer l'app
- Par défaut, tous les pays sont sélectionnés

#### 4.2 Programmes et appareils

- **Programme Google Play** : Standard
- **Appareils compatibles** : Laisse par défaut (Android 8.0+)

### 5. Configurer les prix et la distribution

- **Gratuit ou payant** : Gratuit (ou configure les prix si payant)
- **Abonnements** : Configure si tu as des abonnements

### 6. Télécharger l'APK/AAB

⚠️ **IMPORTANT** : Google Play recommande maintenant les **AAB (Android App Bundle)** au lieu des APK.

#### Option A : Générer un AAB (recommandé)

```bash
cd mobile-app-new/android
./gradlew bundleRelease --no-daemon
```

Le fichier AAB sera dans :
```
app/build/outputs/bundle/release/app-release.aab
```

#### Option B : Utiliser l'APK (si nécessaire)

L'APK est déjà généré :
```
android/app/build/outputs/apk/release/app-release.apk
```

#### 6.1 Téléverser sur Play Console

1. Va dans **"Production"** (ou **"Test interne"** pour tester d'abord)
2. Clique sur **"Créer une version"**
3. Téléverse le fichier **AAB** (ou APK)
4. Remplis les **Notes de version** :
   ```
   Version 1.0.7
   
   🎉 Première version Android de Productif.io !
   
   ✨ Fonctionnalités :
   - Gestion de tâches complète
   - Suivi des habitudes
   - Assistant IA intégré
   - Notifications push
   - Synchronisation calendrier
   - Mode focus
   ```

### 7. Remplir les déclarations

#### 7.1 Déclaration de confidentialité

- **URL de la politique de confidentialité** : 
  - Exemple : `https://productif.io/privacy-policy`
  - Assure-toi d'avoir une page de politique de confidentialité sur ton site

#### 7.2 Déclarations sur les données

Réponds aux questions sur :
- Types de données collectées
- Utilisation des données
- Partage des données
- Sécurité des données

#### 7.3 Déclaration sur les pratiques de l'application

- **Contenu de l'application** : Réponds selon ton app
- **Publicité** : Indique si tu affiches des publicités
- **Achats intégrés** : Indique si tu as des achats intégrés

### 8. Tester l'application (recommandé)

#### 8.1 Test interne

1. Crée un **"Test interne"**
2. Téléverse l'AAB/APK
3. Ajoute des testeurs (emails Google)
4. Teste l'app avant la mise en production

#### 8.2 Test en bêta fermée

1. Crée un **"Test en bêta fermée"**
2. Invite des utilisateurs à tester
3. Collecte les retours

### 9. Soumettre pour révision

Une fois tout rempli :

1. Vérifie que tous les onglets sont complétés (coche verte ✅)
2. Clique sur **"Créer une version"** ou **"Soumettre pour révision"**
3. Google va examiner ton app (peut prendre 1-7 jours)
4. Tu recevras un email une fois l'app approuvée

---

## 📋 Checklist avant soumission

- [ ] Compte Google Play Console créé et payé (25$)
- [ ] APK/AAB signé généré avec le bon keystore
- [ ] Informations de l'application complétées
- [ ] Graphismes (icône, captures d'écran) téléversés
- [ ] Politique de confidentialité disponible en ligne
- [ ] Déclarations sur les données complétées
- [ ] Test interne effectué (recommandé)
- [ ] Notes de version rédigées
- [ ] Pays de distribution sélectionnés

---

## 🔐 Gestion du keystore

⚠️ **CRITIQUE** : Garde ton keystore en sécurité !

- **Emplacement** : `android/app/productif-upload.keystore`
- **Mot de passe** : `ProductifStore#2025`
- **Alias** : `productif`

**Sauvegarde** :
1. Fais une copie du keystore dans un endroit sécurisé
2. Sauvegarde aussi `android/gradle.properties` (contient les mots de passe)
3. Si tu perds le keystore, tu ne pourras **PAS** mettre à jour l'app sur le Play Store

---

## 📝 Mises à jour futures

Pour chaque nouvelle version :

1. Incrémente `versionCode` dans `android/app/build.gradle` (actuellement : 8)
2. Mets à jour `versionName` (actuellement : "1.0.7")
3. Génère un nouveau AAB : `./gradlew bundleRelease`
4. Téléverse sur Play Console
5. Rédige les notes de version
6. Soumets pour révision

---

## 🆘 Problèmes courants

### Erreur : "APK signé avec un certificat différent"

➡️ Tu dois toujours utiliser le même keystore (`productif-upload.keystore`)

### Erreur : "Version code déjà utilisé"

➡️ Incrémente `versionCode` dans `build.gradle`

### Erreur : "Taille de l'APK trop grande"

➡️ Utilise un AAB au lieu d'un APK (Google le compresse automatiquement)

### L'app est rejetée

➡️ Vérifie les emails de Google Play Console pour connaître la raison

---

## 📚 Ressources

- [Documentation Google Play Console](https://support.google.com/googleplay/android-developer)
- [Guide de publication](https://developer.android.com/distribute/googleplay/start)
- [Politique de contenu](https://play.google.com/about/developer-content-policy/)

---

**Bon courage pour la publication ! 🚀**
