import { prisma } from "@/lib/prisma";

// Définition des mappings pour les priorités (INVERSÉS)
// Plus la valeur est élevée, plus la priorité est importante
const priorityMappings = {
  "P0": "Optionnel",
  "P1": "À faire",
  "P2": "Important", 
  "P3": "Urgent",
  "P4": "Quick Win"
};

// Définition des mappings pour les niveaux d'énergie (INVERSÉS)
// Plus la valeur est élevée, plus le niveau d'énergie est élevé
const energyMappings = {
  "0": "Faible",
  "1": "Moyen",
  "2": "Élevé",
  "3": "Extrême"
};

// Fonction pour calculer l'ordre des tâches
export function calculateTaskOrder(priority: string, energyLevel: string): number {
  const priorityScores = {
    "P0": 1000, // Optionnel
    "P1": 2000, // À faire
    "P2": 3000, // Important
    "P3": 4000, // Urgent
    "P4": 5000  // Quick Win
  }

  const energyScores = {
    "Faible": 100,
    "Moyen": 200,
    "Élevé": 300,
    "Extrême": 400
  }

  // Calculer le score total en combinant priorité et niveau d'énergie
  const priorityScore = priorityScores[priority as keyof typeof priorityScores] || 0
  const energyScore = energyScores[energyLevel as keyof typeof energyScores] || 0

  // Le score final favorise les tâches P4 (Quick Win) avec un niveau d'énergie extrême
  return priorityScore + energyScore
}

// Fonction pour mettre à jour l'ordre de toutes les tâches
export async function updateTasksOrder(userId: string) {
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      completed: false
    },
    orderBy: [
      { dueDate: 'asc' },
      { createdAt: 'asc' }
    ]
  });

  // Mise à jour de l'ordre pour chaque tâche
  for (const task of tasks) {
    // Convertir les valeurs numériques en chaînes selon les nouveaux mappings
    const priorityString = task.priority !== null ? `P${task.priority}` : "P2"
    
    let energyString = "Moyen";
    if (task.energyLevel === 0) energyString = "Faible";
    if (task.energyLevel === 1) energyString = "Moyen";
    if (task.energyLevel === 2) energyString = "Élevé";
    if (task.energyLevel === 3) energyString = "Extrême";
    
    const order = calculateTaskOrder(priorityString, energyString);
    await prisma.task.update({
      where: { id: task.id },
      data: { order }
    });
  }
}

// Fonction pour obtenir les tâches triées pour le deep work
export async function getDeepWorkTasks(userId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      completed: false,
      scheduledFor: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    orderBy: [
      { order: 'desc' },
      { dueDate: 'asc' }
    ],
    include: {
      project: true
    }
  });

  return tasks;
}

// Fonction pour planifier les tâches pour le deep work
export async function scheduleTasksForDeepWork(userId: string, date: Date) {
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      completed: false,
      scheduledFor: null
    },
    orderBy: [
      { order: 'desc' },
      { dueDate: 'asc' }
    ]
  });

  // Planifier les tâches en commençant par celles qui demandent le plus d'énergie
  // Nouvelles valeurs: 3=Extrême, 2=Élevé, 1=Moyen, 0=Faible
  const highEnergyTasks = tasks.filter(task => task.energyLevel === 3 || task.energyLevel === 2);
  const mediumEnergyTasks = tasks.filter(task => task.energyLevel === 1);
  const lowEnergyTasks = tasks.filter(task => task.energyLevel === 0);

  // Planifier les tâches en fonction de leur niveau d'énergie
  for (const task of [...highEnergyTasks, ...mediumEnergyTasks, ...lowEnergyTasks]) {
    await prisma.task.update({
      where: { id: task.id },
      data: { scheduledFor: date }
    });
  }
} 