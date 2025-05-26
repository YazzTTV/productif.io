# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

## [2025-05-26] - Améliorations API et Documentation

### 🚀 Nouvelles fonctionnalités
- **API habits/agent optimisée** : Limitation à 7 dernières entrées au lieu de 30 pour de meilleures performances
- **Documentation API complète** : Guide détaillé pour l'utilisation des tokens API avec les agents IA
- **Résolution des problèmes d'authentification** : Clarification des endpoints compatibles avec les tokens API

### 🔧 Améliorations
- **Performance** : Réduction de la charge de données dans l'API `/habits/agent`
- **Documentation** : Ajout d'exemples détaillés et de guides de résolution des problèmes
- **Authentification** : Clarification des différences entre authentification par cookies et tokens API

### 📚 Documentation
- **docs/api-tokens.md** : Documentation complète mise à jour avec :
  - Endpoints compatibles avec les tokens API
  - Exemples de réponses détaillés
  - Guide de résolution des problèmes d'authentification
  - Documentation des habitudes spéciales (Apprentissage, Note de sa journée)
  - Bonnes pratiques pour les intégrations d'IA

### 🐛 Corrections
- **Authentification API** : Résolution du problème d'erreur 401 avec les tokens API
- **Endpoints** : Clarification des endpoints `/agent` vs endpoints standards

### 🔄 Modifications techniques
- **app/api/habits/agent/route.ts** : 
  - Changement de `take: 30` à `take: 7` pour limiter les entrées retournées
  - Optimisation des performances pour un usage quotidien

### 📦 Déploiements
- **Git** : Commit et push des modifications vers le repository principal
- **Vercel** : Déploiement en production des améliorations API
- **Base de données** : Sauvegarde effectuée via le script `backup-database.js`

### 🛠️ Scripts et outils
- **Sauvegarde automatique** : Utilisation du script existant pour sauvegarder la base de données
- **Déploiement CLI** : Utilisation de Vercel CLI pour les déploiements en production

### 📊 Métriques
- **Réduction des données** : ~76% de réduction des données transférées dans l'API habits/agent
- **Performance** : Amélioration du temps de réponse pour les requêtes d'habitudes

---

## Format des versions

Ce projet suit le format [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

### Types de modifications
- **🚀 Nouvelles fonctionnalités** : Ajout de nouvelles fonctionnalités
- **🔧 Améliorations** : Améliorations des fonctionnalités existantes
- **🐛 Corrections** : Corrections de bugs
- **📚 Documentation** : Modifications de la documentation
- **🔄 Modifications techniques** : Changements techniques internes
- **📦 Déploiements** : Informations sur les déploiements
- **🛠️ Scripts et outils** : Modifications des scripts et outils
- **📊 Métriques** : Informations sur les performances et métriques 