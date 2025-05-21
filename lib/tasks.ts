import { prisma } from "@/lib/prisma";

// Définition des poids pour les priorités
const priorityWeights = {
  "P0": 100, // Quick Win
  "P1": 80,  // Urgent
  "P2": 60,  // Important
  "P3": 40,  // A faire
  "P4": 20   // Optionnel
};

// Définition des poids pour les niveaux d'énergie
const energyWeights = {
  "Extrême": 100,
  "Élevé": 75,
  "Moyen": 50,
  "Faible": 25
};

// Fonction pour calculer l'ordre des tâches
export function calculateTaskOrder(priority: string, energyLevel: string): number {
  const priorityScores = {
    "P0": 5000, // Quick Win
    "P1": 4000, // Urgent
    "P2": 3000, // Important
    "P3": 2000, // A faire
    "P4": 1000  // Optionnel
  }

  const energyScores = {
    "Extrême": 400,
    "Élevé": 300,
    "Moyen": 200,
    "Faible": 100
  }

  // Calculer le score total en combinant priorité et niveau d'énergie
  const priorityScore = priorityScores[priority as keyof typeof priorityScores] || 0
  const energyScore = energyScores[energyLevel as keyof typeof energyScores] || 0

  // Le score final favorise les tâches P0 (Quick Win) avec un niveau d'énergie élevé
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
    const order = calculateTaskOrder(task.priority, task.energyLevel);
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
  const highEnergyTasks = tasks.filter(task => task.energyLevel === "Extrême" || task.energyLevel === "Élevé");
  const mediumEnergyTasks = tasks.filter(task => task.energyLevel === "Moyen");
  const lowEnergyTasks = tasks.filter(task => task.energyLevel === "Faible");

  // Planifier les tâches en fonction de leur niveau d'énergie
  for (const task of [...highEnergyTasks, ...mediumEnergyTasks, ...lowEnergyTasks]) {
    await prisma.task.update({
      where: { id: task.id },
      data: { scheduledFor: date }
    });
  }
} 