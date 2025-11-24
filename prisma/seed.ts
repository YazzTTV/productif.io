import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create base achievements
  const achievements = [
    // Streak Achievements
    {
      name: "First Step",
      description: "Complete your first habit",
      type: "STREAK",
      threshold: 1,
      points: 10
    },
    {
      name: "Week on Fire",
      description: "Maintain a 7-day streak",
      type: "STREAK",
      threshold: 7,
      points: 50
    },
    {
      name: "Consistency Master",
      description: "Maintain a 30-day streak",
      type: "STREAK",
      threshold: 30,
      points: 200
    },
    {
      name: "Living Legend",
      description: "Maintain a 100-day streak",
      type: "STREAK",
      threshold: 100,
      points: 1000
    },

    // Completion Achievements
    {
      name: "Motivated Beginner",
      description: "Complete 10 habits in total",
      type: "HABITS",
      threshold: 10,
      points: 25
    },
    {
      name: "Habit Enthusiast",
      description: "Complete 100 habits in total",
      type: "HABITS",
      threshold: 100,
      points: 100
    },
    {
      name: "Habit Machine",
      description: "Complete 500 habits in total",
      type: "HABITS",
      threshold: 500,
      points: 500
    },
    {
      name: "Supreme Master",
      description: "Complete 1000 habits in total",
      type: "HABITS",
      threshold: 1000,
      points: 1500
    },

    // Consistency Achievements
    {
      name: "Perfect Day",
      description: "Complete all your habits in one day",
      type: "PERFECT_DAY",
      threshold: 1,
      points: 30
    },

    // Points Achievements
    {
      name: "Points Collector",
      description: "Reach 100 points",
      type: "POINTS",
      threshold: 100,
      points: 20
    },
    {
      name: "Points Rich",
      description: "Reach 500 points",
      type: "POINTS",
      threshold: 500,
      points: 50
    },
    {
      name: "Points Millionaire",
      description: "Reach 1000 points",
      type: "POINTS",
      threshold: 1000,
      points: 100
    },

    // Tasks Achievements
    {
      name: "First Task",
      description: "Complete your first task",
      type: "TASKS",
      threshold: 1,
      points: 10
    },
    {
      name: "Productive",
      description: "Complete 10 tasks",
      type: "TASKS",
      threshold: 10,
      points: 50
    },
    {
      name: "Super Productive",
      description: "Complete 100 tasks",
      type: "TASKS",
      threshold: 100,
      points: 200
    },

    // Objectives Achievements
    {
      name: "First Objective",
      description: "Create your first objective",
      type: "OBJECTIVES",
      threshold: 1,
      points: 20
    },
    {
      name: "Strategist",
      description: "Complete 5 objectives",
      type: "OBJECTIVES",
      threshold: 5,
      points: 100
    }
  ]

  // Delete all existing achievements to avoid duplicates
  await prisma.achievement.deleteMany({})
  console.log('Existing achievements deleted')

  // Create the new achievements
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