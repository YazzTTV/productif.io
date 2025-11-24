import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mapping des achievements français vers anglais
const achievementTranslations: Record<string, { name: string; description: string }> = {
  // Streak Achievements
  "Premier pas": {
    name: "First Step",
    description: "Complete your first habit"
  },
  "Une semaine de feu": {
    name: "Week on Fire",
    description: "Maintain a 7-day streak"
  },
  "Maître de la constance": {
    name: "Consistency Master",
    description: "Maintain a 30-day streak"
  },
  "Légende vivante": {
    name: "Living Legend",
    description: "Maintain a 100-day streak"
  },
  
  // Habits Achievements
  "Débutant motivé": {
    name: "Motivated Beginner",
    description: "Complete 10 habits in total"
  },
  "Habitué des habitudes": {
    name: "Habit Enthusiast",
    description: "Complete 100 habits in total"
  },
  "Machine à habitudes": {
    name: "Habit Machine",
    description: "Complete 500 habits in total"
  },
  "Maître suprême": {
    name: "Supreme Master",
    description: "Complete 1000 habits in total"
  },
  
  // Perfect Day
  "Journée parfaite": {
    name: "Perfect Day",
    description: "Complete all your habits in one day"
  },
  
  // Points Achievements
  "Collectionneur de points": {
    name: "Points Collector",
    description: "Reach 100 points"
  },
  "Riche en points": {
    name: "Points Rich",
    description: "Reach 500 points"
  },
  "Millionnaire des points": {
    name: "Points Millionaire",
    description: "Reach 1000 points"
  },
  
  // Tasks Achievements
  "Première tâche": {
    name: "First Task",
    description: "Complete your first task"
  },
  "Productif": {
    name: "Productive",
    description: "Complete 10 tasks"
  },
  "Super productif": {
    name: "Super Productive",
    description: "Complete 100 tasks"
  },
  
  // Objectives Achievements
  "Premier objectif": {
    name: "First Objective",
    description: "Create your first objective"
  },
  "Stratège": {
    name: "Strategist",
    description: "Complete 5 objectives"
  }
}

async function updateAchievementsToEnglish() {
  console.log('🔄 Updating achievements to English...')

  try {
    // Récupérer tous les achievements
    const achievements = await prisma.achievement.findMany()

    let updatedCount = 0

    for (const achievement of achievements) {
      const translation = achievementTranslations[achievement.name]
      
      if (translation) {
        await prisma.achievement.update({
          where: { id: achievement.id },
          data: {
            name: translation.name,
            description: translation.description
          }
        })
        console.log(`✅ Updated: "${achievement.name}" → "${translation.name}"`)
        updatedCount++
      } else {
        console.log(`⚠️  No translation found for: "${achievement.name}"`)
      }
    }

    console.log(`\n✨ Successfully updated ${updatedCount} achievements to English!`)
  } catch (error) {
    console.error('❌ Error updating achievements:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
updateAchievementsToEnglish()

export { updateAchievementsToEnglish }

