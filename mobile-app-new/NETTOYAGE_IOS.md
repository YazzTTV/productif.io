# Guide de Nettoyage des Projets iOS Dupliqués

## 📁 Structure Actuelle

Le dossier `ios/` contient plusieurs projets Xcode dupliqués qui peuvent causer de la confusion. Voici ce qui devrait être conservé et ce qui peut être supprimé.

## ✅ À CONSERVER

- `mobileappnew/` - Dossier principal de l'application
- `mobileappnew.xcodeproj/` - Projet Xcode principal
- `mobileappnew.xcworkspace/` - Workspace Xcode (à utiliser pour ouvrir le projet)
- `Podfile` - Fichier de configuration CocoaPods
- `Podfile.lock` - Verrouillage des versions des pods
- `Pods/` - Dossier des dépendances CocoaPods

## 🗑️ À SUPPRIMER (Projets dupliqués)

Les dossiers suivants sont des copies/versions antérieures et peuvent être supprimés :

- `mobileappnew 2/`
- `mobileappnew 2.xcodeproj/`
- `mobileappnew 2.xcworkspace/`
- `mobileappnew 3/`
- `mobileappnew 3.xcodeproj/`
- `Podfile 2`
- `Podfile 2.lock`
- `Podfile 3`
- `Podfile 3.lock`
- `Podfile.properties 2.json`
- `Podfile.properties 3.json`
- `Pods 2/`
- `Pods 3/`
- `build/` (peut être régénéré)
- `build 2/`
- `build 3/`

## 🧹 Script de Nettoyage

**⚠️ ATTENTION** : Assurez-vous d'avoir sauvegardé votre travail avant d'exécuter ce script !

```bash
cd mobile-app-new/ios

# Supprimer les projets dupliqués
rm -rf "mobileappnew 2"
rm -rf "mobileappnew 2.xcodeproj"
rm -rf "mobileappnew 2.xcworkspace"
rm -rf "mobileappnew 3"
rm -rf "mobileappnew 3.xcodeproj"

# Supprimer les Podfiles dupliqués
rm -f "Podfile 2"
rm -f "Podfile 2.lock"
rm -f "Podfile 3"
rm -f "Podfile 3.lock"
rm -f "Podfile.properties 2.json"
rm -f "Podfile.properties 3.json"

# Supprimer les dossiers Pods dupliqués
rm -rf "Pods 2"
rm -rf "Pods 3"

# Supprimer les dossiers build (seront régénérés)
rm -rf "build"
rm -rf "build 2"
rm -rf "build 3"

# Réinstaller les pods pour s'assurer que tout est propre
pod install
```

## ✅ Vérification Post-Nettoyage

Après le nettoyage, votre structure `ios/` devrait ressembler à ceci :

```
ios/
├── mobileappnew/              # Dossier principal de l'app
│   ├── AppDelegate.swift
│   ├── Info.plist
│   ├── Images.xcassets/
│   └── ...
├── mobileappnew.xcodeproj/     # Projet Xcode
├── mobileappnew.xcworkspace/  # Workspace (à utiliser)
├── Podfile                     # Configuration CocoaPods
├── Podfile.lock                # Verrouillage des versions
└── Pods/                       # Dépendances installées
```

## 🔄 Réinstallation Propre

Si vous voulez repartir de zéro avec une installation propre :

```bash
cd mobile-app-new/ios

# Supprimer tous les pods
rm -rf Pods/
rm -f Podfile.lock

# Réinstaller
pod install

# Ouvrir le workspace
open mobileappnew.xcworkspace
```

## 📝 Notes

- Toujours ouvrir le fichier `.xcworkspace` et non `.xcodeproj` quand vous utilisez CocoaPods
- Le dossier `Pods/` ne doit jamais être commité dans Git (devrait être dans `.gitignore`)
- Le `Podfile.lock` doit être commité pour garantir les mêmes versions pour tous

