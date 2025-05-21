import { PrismaClient } from "@prisma/client";
import { calculateTaskOrder } from "../lib/tasks";

// Initialiser le client Prisma
const prisma = new PrismaClient();

/**
 * Script pour recalculer les valeurs d'ordre de toutes les tâches
 * à exécuter après la migration pour inverser les priorités et niveaux d'énergie
 */
async function recalculateTaskOrders() {
  console.log("Début du recalcul des ordres de tâches...");

  try {
    // Récupérer toutes les tâches
    const tasks = await prisma.task.findMany();
    console.log(`${tasks.length} tâches trouvées`);

    // Définir les niveaux d'énergie pour le mapping
    const energyLevels: { [key: number]: string } = {
      0: "Faible",
      1: "Moyen",
      2: "Élevé",
      3: "Extrême"
    };

    // Compteur des tâches mises à jour
    let updatedCount = 0;

    // Mettre à jour l'ordre de chaque tâche
    for (const task of tasks) {
      // Convertir les valeurs numériques en chaînes
      const priorityString = task.priority !== null ? `P${task.priority}` : "P2";
      const energyString = task.energyLevel !== null && typeof task.energyLevel === 'number'
        ? energyLevels[task.energyLevel] || "Moyen"
        : "Moyen";

      // Calculer le nouvel ordre
      const newOrder = calculateTaskOrder(priorityString, energyString);

      // Mettre à jour la tâche si l'ordre a changé
      if (newOrder !== task.order) {
        await prisma.task.update({
          where: { id: task.id },
          data: { order: newOrder }
        });
        updatedCount++;
      }
    }

    console.log(`${updatedCount} tâches mises à jour avec succès`);
  } catch (error) {
    console.error("Erreur lors du recalcul des ordres de tâches:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
recalculateTaskOrders()
  .then(() => console.log("Terminé !"))
  .catch(e => {
    console.error("Erreur d'exécution:", e);
    process.exit(1);
  }); 