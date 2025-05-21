@echo off
echo 🔄 Migration des priorités et niveaux d'énergie
echo -----------------------------------------------

REM Étape 1: Appliquer la migration pour convertir les données
echo 📊 Application de la migration SQL...
call npx prisma migrate dev --name invert_priority_energy

REM Vérifier si la migration a réussi
if %errorlevel% neq 0 (
  echo ❌ La migration a échoué. Veuillez vérifier les erreurs.
  exit /b 1
)

echo ✅ Migration SQL appliquée avec succès

REM Étape 2: Recalculer les ordres des tâches
echo 🔢 Recalcul des ordres des tâches...
call npx ts-node scripts/recalculate-task-orders.ts

REM Vérifier si le recalcul a réussi
if %errorlevel% neq 0 (
  echo ❌ Le recalcul des ordres a échoué. Veuillez vérifier les erreurs.
  exit /b 1
)

echo ✅ Recalcul des ordres terminé avec succès
echo.
echo 🎉 Toutes les modifications ont été appliquées !
echo La structure des priorités et niveaux d'énergie a été inversée :
echo - Priorité : 0 = Optionnel ^-^> 4 = Quick Win
echo - Énergie : 0 = Faible ^-^> 3 = Extrême 