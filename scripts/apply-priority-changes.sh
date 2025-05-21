#!/bin/bash

# Script pour appliquer les changements de priorité et niveau d'énergie

echo "🔄 Migration des priorités et niveaux d'énergie"
echo "-----------------------------------------------"

# Étape 1: Appliquer la migration pour convertir les données
echo "📊 Application de la migration SQL..."
npx prisma migrate dev --name invert_priority_energy

# Vérifier si la migration a réussi
if [ $? -ne 0 ]; then
  echo "❌ La migration a échoué. Veuillez vérifier les erreurs."
  exit 1
fi

echo "✅ Migration SQL appliquée avec succès"

# Étape 2: Recalculer les ordres des tâches
echo "🔢 Recalcul des ordres des tâches..."
npx ts-node scripts/recalculate-task-orders.ts

# Vérifier si le recalcul a réussi
if [ $? -ne 0 ]; then
  echo "❌ Le recalcul des ordres a échoué. Veuillez vérifier les erreurs."
  exit 1
fi

echo "✅ Recalcul des ordres terminé avec succès"
echo ""
echo "🎉 Toutes les modifications ont été appliquées !"
echo "La structure des priorités et niveaux d'énergie a été inversée :"
echo "- Priorité : 0 = Optionnel → 4 = Quick Win"
echo "- Énergie : 0 = Faible → 3 = Extrême" 