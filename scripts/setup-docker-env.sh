#!/bin/bash

# Script pour configurer l'environnement Docker de développement

echo "🐳 Configuration de l'environnement Docker pour Productif.io"
echo "-----------------------------------------------------------"

# Vérification de Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez l'installer : https://docs.docker.com/get-docker/"
    exit 1
fi

# Vérification de Docker Compose
if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez l'installer : https://docs.docker.com/compose/install/"
    exit 1
fi

# Vérification de Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 Installation de Vercel CLI..."
    npm install -g vercel
fi

# Récupération des variables d'environnement
echo "🔐 Récupération des variables d'environnement depuis Vercel..."
echo "➡️ Si vous n'êtes pas connecté, suivez les instructions pour vous connecter."

vercel env pull .env.local

if [ ! -f .env.local ]; then
    echo "❌ Échec de la récupération des variables d'environnement."
    echo "➡️ Veuillez créer manuellement un fichier .env.local basé sur les informations dans env-for-vercel.txt"
    exit 1
fi

echo "✅ Variables d'environnement récupérées avec succès."

# Construction et démarrage des conteneurs Docker
echo "🚀 Démarrage des conteneurs Docker..."
docker compose up --build -d

echo "✅ Configuration terminée !"
echo "📱 Votre application est accessible à l'adresse : http://localhost:3000"
echo "📋 Logs: docker compose logs -f"
echo "🛑 Arrêter: docker compose down" 