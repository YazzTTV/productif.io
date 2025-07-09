import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Créer les achievements de base
  const achievements = [
    // Achievements de Streak
    {
      name: "Premier pas",
      description: "Complétez votre première habitude",
      type: "STREAK",
      threshold: 1,
      points: 10
    },
    {
      name: "Une semaine de feu",
      description: "Maintenez un streak de 7 jours",
      type: "STREAK",
      threshold: 7,
      points: 50
    },
    {
      name: "Maître de la constance",
      description: "Maintenez un streak de 30 jours",
      type: "STREAK",
      threshold: 30,
      points: 200
    },
    {
      name: "Légende vivante",
      description: "Maintenez un streak de 100 jours",
      type: "STREAK",
      threshold: 100,
      points: 1000
    },

    // Achievements de Completion
    {
      name: "Débutant motivé",
      description: "Complétez 10 habitudes au total",
      type: "HABITS",
      threshold: 10,
      points: 25
    },
    {
      name: "Habitué des habitudes",
      description: "Complétez 100 habitudes au total",
      type: "HABITS",
      threshold: 100,
      points: 100
    },
    {
      name: "Machine à habitudes",
      description: "Complétez 500 habitudes au total",
      type: "HABITS",
      threshold: 500,
      points: 500
    },
    {
      name: "Maître suprême",
      description: "Complétez 1000 habitudes au total",
      type: "HABITS",
      threshold: 1000,
      points: 1500
    },

    // Achievements de Consistency
    {
      name: "Journée parfaite",
      description: "Complétez toutes vos habitudes en une journée",
      type: "PERFECT_DAY",
      threshold: 1,
      points: 30
    },

    // Achievements de Points
    {
      name: "Collectionneur de points",
      description: "Atteignez 100 points",
      type: "POINTS",
      threshold: 100,
      points: 20
    },
    {
      name: "Riche en points",
      description: "Atteignez 500 points",
      type: "POINTS",
      threshold: 500,
      points: 50
    },
    {
      name: "Millionnaire des points",
      description: "Atteignez 1000 points",
      type: "POINTS",
      threshold: 1000,
      points: 100
    },

    // Achievements de Tâches
    {
      name: "Première tâche",
      description: "Complétez votre première tâche",
      type: "TASKS",
      threshold: 1,
      points: 10
    },
    {
      name: "Productif",
      description: "Complétez 10 tâches",
      type: "TASKS",
      threshold: 10,
      points: 50
    },
    {
      name: "Super productif",
      description: "Complétez 100 tâches",
      type: "TASKS",
      threshold: 100,
      points: 200
    },

    // Achievements d'Objectifs
    {
      name: "Premier objectif",
      description: "Créez votre premier objectif",
      type: "OBJECTIVES",
      threshold: 1,
      points: 20
    },
    {
      name: "Stratège",
      description: "Complétez 5 objectifs",
      type: "OBJECTIVES",
      threshold: 5,
      points: 100
    }
  ]

  // Supprimer tous les achievements existants pour éviter les doublons
  await prisma.achievement.deleteMany({})
  console.log('Achievements existants supprimés')

  // Créer les nouveaux achievements
  for (const achievement of achievements) {
    await prisma.achievement.create({
      data: achievement
    })
  }

  console.log('Base achievements created!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 