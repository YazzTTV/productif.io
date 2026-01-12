#!/bin/bash
# Script pour appliquer la migration studyLevel

# Lire DATABASE_URL depuis .env
export $(grep -v '^#' .env | grep DATABASE_URL | xargs)

# Extraire les composants de l'URL
DB_URL="${DATABASE_URL}"

echo "Application de la migration studyLevel..."

# Exécuter le SQL directement
psql "$DB_URL" <<EOF
ALTER TABLE "OnboardingData" 
ADD COLUMN IF NOT EXISTS "studyLevel" INTEGER;
EOF

echo "Migration appliquée avec succès !"
