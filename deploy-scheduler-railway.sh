#!/bin/bash

echo "🚀 Déploiement du Scheduler sur Railway"
echo "========================================"

# Vérifier que Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI n'est pas installé. Installez-le avec:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Vérifier que l'utilisateur est connecté
if ! railway whoami &> /dev/null; then
    echo "❌ Vous n'êtes pas connecté à Railway. Connectez-vous avec:"
    echo "railway login"
    exit 1
fi

echo "✅ Railway CLI détecté et utilisateur connecté"

# Sauvegarder le railway.toml actuel s'il existe
if [ -f "railway.toml" ]; then
    echo "📦 Sauvegarde du railway.toml actuel..."
    cp railway.toml railway.toml.backup
    echo "✅ railway.toml sauvegardé"
fi

# Copier railway.toml.scheduler vers railway.toml
if [ -f "railway.toml.scheduler" ]; then
    echo "📋 Utilisation de railway.toml.scheduler pour le déploiement..."
    cp railway.toml.scheduler railway.toml
    echo "✅ Configuration du scheduler appliquée"
else
    echo "❌ railway.toml.scheduler introuvable!"
    exit 1
fi

# Vérifier que le Dockerfile.scheduler existe
if [ ! -f "Dockerfile.scheduler" ]; then
    echo "❌ Dockerfile.scheduler introuvable!"
    exit 1
fi

echo ""
echo "🔨 Déploiement en cours..."
echo ""

# Déployer sur Railway
railway up --detach

# Attendre un peu pour voir le résultat
sleep 3

# Restaurer le railway.toml original
if [ -f "railway.toml.backup" ]; then
    echo ""
    echo "🔄 Restauration du railway.toml original..."
    mv railway.toml.backup railway.toml
    echo "✅ railway.toml restauré"
fi

echo ""
echo "✅ Déploiement terminé!"
echo ""
echo "📊 Pour voir les logs:"
echo "   railway logs"
echo ""
echo "🔍 Pour vérifier le statut:"
echo "   railway status"
echo ""
