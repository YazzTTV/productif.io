# 📱 Configuration Capacitor pour Productif.io

Ce guide explique comment utiliser Capacitor pour créer des applications mobiles à partir de votre application Next.js.

## 🚀 Installation

Capacitor a déjà été installé et configuré dans ce projet avec les commandes suivantes :

```bash
npm install @capacitor/core @capacitor/cli --save-dev
npm install @capacitor/ios @capacitor/android
npx cap init
npx cap add android
npx cap add ios
```

## 🛠️ Configuration

### Fichiers de configuration

- `capacitor.config.ts` - Configuration de développement (utilise localhost:3000)
- `capacitor.config.prod.ts` - Configuration de production (utilise les fichiers statiques)

### Structure des répertoires

```
project/
├── android/          # Projet Android natif
├── ios/              # Projet iOS natif  
├── out/              # Fichiers statiques générés par Next.js
└── capacitor.config.ts
```

## 🔧 Scripts disponibles

### Développement

```bash
# Démarrer le serveur Next.js
npm run dev

# Développement mobile avec live reload (nécessite Android Studio)
npm run dev:mobile

# Synchroniser les changements avec les apps natives
npm run mobile:sync
```

### Ouverture des projets natifs

```bash
# Ouvrir le projet Android dans Android Studio
npm run mobile:android

# Ouvrir le projet iOS dans Xcode (macOS uniquement)
npm run mobile:ios
```

### Build de production

```bash
# Build standard Next.js
npm run build

# Build pour mobile (avec sync automatique)
npm run build:mobile
```

## 📱 Développement mobile

### Mode développement

1. Démarrez votre serveur Next.js :
   ```bash
   npm run dev
   ```

2. L'application mobile se connectera à `http://localhost:3000`

3. Synchronisez les changements :
   ```bash
   npm run mobile:sync
   ```

### Prérequis pour le développement

#### Android
- [Android Studio](https://developer.android.com/studio)
- Android SDK
- Émulateur Android ou appareil physique

#### iOS (macOS uniquement)
- [Xcode](https://developer.apple.com/xcode/)
- Simulateur iOS ou appareil physique
- Compte développeur Apple (pour le déploiement sur appareil)

## 🚨 Limitations actuelles

### Routes API
Les routes API Next.js (`/api/*`) ne peuvent pas être exportées statiquement. Pour la production mobile, vous devrez :

1. **Option 1** : Utiliser un serveur externe pour les API
2. **Option 2** : Créer une version mobile simplifiée sans certaines fonctionnalités
3. **Option 3** : Utiliser une approche hybride avec un serveur distant

### Pages dynamiques
Certaines pages avec des paramètres dynamiques nécessitent `generateStaticParams()` pour l'export statique.

## 🔄 Workflow recommandé

1. **Développement** : Utilisez `npm run dev` et testez sur `http://localhost:3000`
2. **Test mobile** : Utilisez `npm run mobile:sync` et testez dans l'émulateur
3. **Production** : Adaptez l'application pour l'export statique ou utilisez un serveur distant

## 📚 Ressources

- [Documentation Capacitor](https://capacitorjs.com/docs)
- [Guide Next.js + Capacitor](https://capacitorjs.com/docs/guides/nextjs)
- [Configuration Android](https://capacitorjs.com/docs/android/configuration)
- [Configuration iOS](https://capacitorjs.com/docs/ios/configuration)

## 🆘 Dépannage

### Erreur "missing out directory"
Exécutez `npm run build` pour générer le répertoire `out`.

### Android Studio non trouvé
Installez Android Studio et configurez la variable d'environnement `CAPACITOR_ANDROID_STUDIO_PATH`.

### Erreurs de synchronisation
Vérifiez que le serveur Next.js fonctionne sur le port 3000 et relancez `npm run mobile:sync`. 