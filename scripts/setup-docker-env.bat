@echo off
echo 🐳 Configuration de l'environnement Docker pour Productif.io
echo -----------------------------------------------------------

REM Vérification de Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker n'est pas installé. Veuillez l'installer : https://docs.docker.com/get-docker/
    exit /b 1
)

REM Vérification de Docker Compose
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose n'est pas installé. Veuillez l'installer : https://docs.docker.com/compose/install/
    exit /b 1
)

REM Vérification de Vercel CLI
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installation de Vercel CLI...
    call npm install -g vercel
)

REM Récupération des variables d'environnement
echo 🔐 Récupération des variables d'environnement depuis Vercel...
echo ➡️ Si vous n'êtes pas connecté, suivez les instructions pour vous connecter.

call vercel env pull .env.local

if not exist .env.local (
    echo ❌ Échec de la récupération des variables d'environnement.
    echo ➡️ Veuillez créer manuellement un fichier .env.local basé sur les informations dans env-for-vercel.txt
    exit /b 1
)

echo ✅ Variables d'environnement récupérées avec succès.

REM Construction et démarrage des conteneurs Docker
echo 🚀 Démarrage des conteneurs Docker...
docker compose up --build -d

echo ✅ Configuration terminée !
echo 📱 Votre application est accessible à l'adresse : http://localhost:3000
echo 📋 Logs: docker compose logs -f
echo 🛑 Arrêter: docker compose down 