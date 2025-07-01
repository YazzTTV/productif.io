#!/bin/bash

echo "🔍 Vérification pré-déploiement Railway"
echo "======================================"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
CHECKS_PASSED=0
CHECKS_TOTAL=0

check_file() {
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1 existe"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}❌${NC} $1 manquant"
    fi
}

check_command() {
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✅${NC} $1 installé"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}❌${NC} $1 non installé"
    fi
}

check_env_example() {
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    if grep -q "$1" env.example 2>/dev/null || grep -q "$1" .env.example 2>/dev/null; then
        echo -e "${GREEN}✅${NC} Variable $1 documentée"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${YELLOW}⚠️${NC} Variable $1 non documentée dans env.example"
    fi
}

echo "📁 Vérification des fichiers..."
check_file "Dockerfile.ai"
check_file "Dockerfile.scheduler"
check_file "railway.toml"
check_file "railway.scheduler.toml"
check_file "src/services/ai/start.ts"
check_file "src/services/scheduler-service.js"
check_file "package.json"

echo ""
echo "🛠️ Vérification des outils..."
check_command "node"
check_command "pnpm"
check_command "git"

echo ""
echo "📝 Vérification du package.json..."
CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
if grep -q '"start:ai"' package.json; then
    echo -e "${GREEN}✅${NC} Script start:ai défini"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}❌${NC} Script start:ai manquant"
fi

CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
if grep -q '"start:scheduler"' package.json; then
    echo -e "${GREEN}✅${NC} Script start:scheduler défini"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}❌${NC} Script start:scheduler manquant"
fi

echo ""
echo "🔐 Vérification des variables d'environnement..."
check_env_example "DATABASE_URL"
check_env_example "OPENAI_API_KEY"
check_env_example "WHATSAPP_ACCESS_TOKEN"
check_env_example "WHATSAPP_VERIFY_TOKEN"
check_env_example "WHATSAPP_PHONE_NUMBER_ID"

echo ""
echo "🐳 Vérification des Dockerfiles..."

# Vérifier les ports dans les Dockerfiles
CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
if grep -q "EXPOSE 3001" Dockerfile.ai; then
    echo -e "${GREEN}✅${NC} Port 3001 exposé dans Dockerfile.ai"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}❌${NC} Port incorrect dans Dockerfile.ai"
fi

CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
if grep -q "EXPOSE 3002" Dockerfile.scheduler; then
    echo -e "${GREEN}✅${NC} Port 3002 exposé dans Dockerfile.scheduler"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}❌${NC} Port incorrect dans Dockerfile.scheduler"
fi

# Vérifier les healthchecks
CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
if grep -q "/health" Dockerfile.ai; then
    echo -e "${GREEN}✅${NC} Healthcheck configuré dans Dockerfile.ai"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}❌${NC} Healthcheck manquant dans Dockerfile.ai"
fi

CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
if grep -q "/health" Dockerfile.scheduler; then
    echo -e "${GREEN}✅${NC} Healthcheck configuré dans Dockerfile.scheduler"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}❌${NC} Healthcheck manquant dans Dockerfile.scheduler"
fi

echo ""
echo "⚙️ Vérification des configurations Railway..."
CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
if grep -q "Dockerfile.ai" railway.toml; then
    echo -e "${GREEN}✅${NC} railway.toml utilise Dockerfile.ai"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}❌${NC} railway.toml ne pointe pas vers Dockerfile.ai"
fi

CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
if grep -q "Dockerfile.scheduler" railway.scheduler.toml; then
    echo -e "${GREEN}✅${NC} railway.scheduler.toml utilise Dockerfile.scheduler"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}❌${NC} railway.scheduler.toml ne pointe pas vers Dockerfile.scheduler"
fi

echo ""
echo "🧪 Test des builds locaux..."
echo "Vérification que les Dockerfiles peuvent être buildés..."

# Test de build Docker (si Docker est installé et en marche)
if command -v docker &> /dev/null; then
    if docker info &> /dev/null; then
        echo "🐳 Docker détecté et en marche - Test de build..."
        
        # Test Dockerfile.ai
        if docker build -f Dockerfile.ai -t test-ai . &> /dev/null; then
            echo -e "${GREEN}✅${NC} Dockerfile.ai peut être buildé"
            docker rmi test-ai &> /dev/null
            CHECKS_PASSED=$((CHECKS_PASSED + 1))
        else
            echo -e "${RED}❌${NC} Erreur de build Dockerfile.ai"
        fi
        CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
        
        # Test Dockerfile.scheduler
        if docker build -f Dockerfile.scheduler -t test-scheduler . &> /dev/null; then
            echo -e "${GREEN}✅${NC} Dockerfile.scheduler peut être buildé"
            docker rmi test-scheduler &> /dev/null
            CHECKS_PASSED=$((CHECKS_PASSED + 1))
        else
            echo -e "${RED}❌${NC} Erreur de build Dockerfile.scheduler"
        fi
        CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    else
        echo -e "${YELLOW}⚠️${NC} Docker installé mais non démarré - builds ignorer pour le moment"
        echo -e "${GREEN}ℹ️${NC} Les builds seront testés sur Railway lors du déploiement"
    fi
else
    echo -e "${YELLOW}⚠️${NC} Docker non installé - impossible de tester les builds"
    echo -e "${GREEN}ℹ️${NC} Les builds seront testés sur Railway lors du déploiement"
fi

echo ""
echo "📊 Résultats de la vérification"
echo "==============================="
echo -e "Tests réussis: ${GREEN}$CHECKS_PASSED${NC}/$CHECKS_TOTAL"

PERCENTAGE=$((CHECKS_PASSED * 100 / CHECKS_TOTAL))

if [ $PERCENTAGE -eq 100 ]; then
    echo -e "${GREEN}🎉 Tous les tests sont passés ! Prêt pour le déploiement.${NC}"
    echo ""
    echo "🚀 Étapes suivantes :"
    echo "1. git add . && git commit -m 'Ready for Railway deployment'"
    echo "2. git push"
    echo "3. Suivez le guide docs/DEPLOIEMENT_RAILWAY.md"
    exit 0
elif [ $PERCENTAGE -ge 80 ]; then
    echo -e "${YELLOW}⚠️ $PERCENTAGE% des tests passés. Déploiement possible avec attention.${NC}"
    exit 1
else
    echo -e "${RED}❌ Seulement $PERCENTAGE% des tests passés. Corrigez les erreurs avant le déploiement.${NC}"
    exit 2
fi 