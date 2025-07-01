#!/bin/bash

echo "🚀 Déploiement sur Railway - Agent IA et Planificateur"
echo "======================================================"

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

# Commiter les changements actuels
echo "📦 Commit des changements..."
git add .
git commit -m "feat: Déploiement Railway - Agent IA et Planificateur" || echo "Aucun changement à commiter"

# Pousser vers Git
echo "⬆️ Push vers Git..."
git push origin $(git branch --show-current)

echo ""
echo "🎯 Étapes pour déployer sur Railway:"
echo ""
echo "1️⃣ AGENT IA (Port 3001) :"
echo "   - Créez un nouveau service Railway"
echo "   - Connectez ce repository"
echo "   - Utilisez le fichier: railway.toml"
echo "   - Variables d'environnement requises:"
echo "     * DATABASE_URL (depuis votre base Postgres)"
echo "     * OPENAI_API_KEY"
echo "     * WHATSAPP_ACCESS_TOKEN"
echo "     * WHATSAPP_VERIFY_TOKEN"
echo "     * WHATSAPP_PHONE_NUMBER_ID"
echo ""
echo "2️⃣ PLANIFICATEUR (Port 3002) :"
echo "   - Créez un autre service Railway"
echo "   - Connectez le même repository"
echo "   - Utilisez le fichier: railway.scheduler.toml"
echo "   - Même variables d'environnement que l'Agent IA"
echo ""
echo "3️⃣ CONFIGURATION WHATSAPP :"
echo "   - URL Webhook Agent IA: https://[votre-domain-ai].railway.app/webhook"
echo "   - URL Webhook Verify: GET avec WHATSAPP_VERIFY_TOKEN"
echo ""
echo "🔧 Commandes Railway utiles :"
echo "   - railway login                    # Se connecter"
echo "   - railway link                     # Lier un projet"
echo "   - railway up                       # Déployer"
echo "   - railway logs                     # Voir les logs"
echo "   - railway status                   # État du déploiement"
echo ""
echo "✅ Prêt pour le déploiement !" 