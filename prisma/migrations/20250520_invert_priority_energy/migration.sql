-- Migration: inverser les valeurs de priorité et niveau d'énergie
-- Cette migration convertit les données existantes pour correspondre à la nouvelle logique

-- Conversion temporaire des priorités existantes dans une colonne temporaire
ALTER TABLE "Task" ADD COLUMN "temp_priority" INT;

-- Convertir les anciennes valeurs de priorité vers les nouvelles
UPDATE "Task" SET "temp_priority" = 
  CASE "priority"
    WHEN 0 THEN 4  -- ancien 0 (Quick Win) -> nouveau 4 (Quick Win)
    WHEN 1 THEN 3  -- ancien 1 (Urgent) -> nouveau 3 (Urgent)
    WHEN 2 THEN 2  -- ancien 2 (Important) -> même valeur
    WHEN 3 THEN 1  -- ancien 3 (À faire) -> nouveau 1 (À faire)
    WHEN 4 THEN 0  -- ancien 4 (Optionnel) -> nouveau 0 (Optionnel)
    ELSE NULL
  END
WHERE "priority" IS NOT NULL;

-- Conversion temporaire des niveaux d'énergie existants dans une colonne temporaire
ALTER TABLE "Task" ADD COLUMN "temp_energyLevel" INT;

-- Convertir les anciennes valeurs de niveau d'énergie vers les nouvelles
UPDATE "Task" SET "temp_energyLevel" = 
  CASE "energyLevel"
    WHEN 0 THEN 3  -- ancien 0 (Extrême) -> nouveau 3 (Extrême)
    WHEN 1 THEN 2  -- ancien 1 (Élevé) -> nouveau 2 (Élevé)
    WHEN 2 THEN 1  -- ancien 2 (Moyen) -> nouveau 1 (Moyen)
    WHEN 3 THEN 0  -- ancien 3 (Faible) -> nouveau 0 (Faible)
    ELSE NULL
  END
WHERE "energyLevel" IS NOT NULL;

-- Remplacer les anciennes valeurs par les nouvelles
UPDATE "Task" SET "priority" = "temp_priority" WHERE "temp_priority" IS NOT NULL;
UPDATE "Task" SET "energyLevel" = "temp_energyLevel" WHERE "temp_energyLevel" IS NOT NULL;

-- Supprimer les colonnes temporaires
ALTER TABLE "Task" DROP COLUMN "temp_priority";
ALTER TABLE "Task" DROP COLUMN "temp_energyLevel";

-- Recalculer l'ordre des tâches selon les nouvelles priorités et niveaux d'énergie
-- Ceci sera géré par l'application lors du démarrage après la migration 