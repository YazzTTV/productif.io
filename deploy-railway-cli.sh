#!/bin/bash

echo "🚀 Déploiement automatisé Railway - Agent IA et Planificateur"
echo "============================================================="

# Couleurs pour l'affichage
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction d'erreur
error_exit() {
    echo -e "${RED}❌ Erreur: $1${NC}"
    exit 1
}

# Fonction de succès
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Fonction d'info
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Fonction d'avertissement
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Vérifier que Railway CLI est installé
if ! command -v railway &> /dev/null; then
    error_exit "Railway CLI n'est pas installé. Installez-le avec: npm install -g @railway/cli"
fi

# Vérifier que l'utilisateur est connecté
if ! railway whoami &> /dev/null; then
    error_exit "Vous n'êtes pas connecté à Railway. Connectez-vous avec: railway login"
fi

success "Railway CLI détecté et utilisateur connecté"

# Fonction pour déployer un service
deploy_service() {
    local service_name=$1
    local config_file=$2
    local description=$3
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    info "Déploiement: $description"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Copier le fichier de configuration
    if [[ -f "$config_file" ]]; then
        cp "$config_file" railway.toml
        success "Configuration copiée: $config_file → railway.toml"
    else
        error_exit "Fichier de configuration non trouvé: $config_file"
    fi
    
    # Déployer avec railway up
    info "Exécution de 'railway up' pour $service_name..."
    echo ""
    railway up
    
    if [[ $? -eq 0 ]]; then
        success "✨ Déploiement réussi pour $service_name"
    else
        error_exit "Échec du déploiement pour $service_name"
    fi
    
    # Afficher les logs pour vérification
    info "Affichage des logs récents..."
    railway logs --tail 20
    
    # Pause entre les déploiements
    echo ""
    warning "Appuyez sur Entrée pour continuer vers le service suivant..."
    read -r
}

# Commit et push des changements
echo ""
info "📦 Préparation du code..."
git add .
git commit -m "feat: Deploy Railway services - AI Agent and Scheduler" || warning "Aucun changement à commiter"
git push origin $(git branch --show-current) || warning "Erreur lors du push"

# Menu de sélection
echo ""
echo "🎯 Choisissez le mode de déploiement:"
echo "1) Déployer l'Agent IA uniquement"
echo "2) Déployer le Planificateur uniquement" 
echo "3) Déployer les deux services séquentiellement"
echo "4) Afficher les commandes manuelles"
echo ""
read -p "Votre choix (1-4): " choice

case $choice in
    1)
        deploy_service "ai-agent" "railway.ai.toml" "🤖 Agent IA (Port 3001)"
        ;;
    2)
        deploy_service "scheduler" "railway.scheduler.toml" "⏰ Planificateur (Port 3002)"
        ;;
    3)
        warning "Déploiement séquentiel des deux services"
        deploy_service "ai-agent" "railway.ai.toml" "🤖 Agent IA (Port 3001)"
        echo ""
        warning "Service suivant dans 5 secondes..."
        sleep 5
        deploy_service "scheduler" "railway.scheduler.toml" "⏰ Planificateur (Port 3002)"
        ;;
    4)
        echo ""
        info "🔧 Commandes manuelles Railway:"
        echo ""
        echo "Pour l'Agent IA:"
        echo "  cp railway.ai.toml railway.toml && railway up"
        echo ""
        echo "Pour le Planificateur:"
        echo "  cp railway.scheduler.toml railway.toml && railway up"
        echo ""
        echo "Variables d'environnement requises:"
        echo "  - DATABASE_URL"
        echo "  - OPENAI_API_KEY"
        echo "  - WHATSAPP_ACCESS_TOKEN"
        echo "  - WHATSAPP_VERIFY_TOKEN"
        echo "  - WHATSAPP_PHONE_NUMBER_ID"
        echo ""
        echo "Commandes utiles:"
        echo "  - railway logs           # Voir les logs"
        echo "  - railway status         # État du service"
        echo "  - railway variables      # Variables d'environnement"
        echo "  - railway domain         # Gérer les domaines"
        ;;
    *)
        error_exit "Choix invalide"
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "🎉 Déploiement terminé !"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "Vérifiez vos services sur: https://railway.app/dashboard"
echo "" 