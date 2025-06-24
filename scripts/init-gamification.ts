import { PrismaClient } from '@prisma/client'
import { startOfDay, endOfDay, subDays, differenceInDays } from 'date-fns'

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
})

// Calculer le streak actuel d'un utilisateur
async function calculateCurrentStreak(userId: string): Promise<number> {
  try {
    const now = new Date()
    let streak = 0
    let checkDate = startOfDay(now)
    const limitDate = subDays(now, 30) // Limite de 30 jours

    console.log(`  🔍 Calcul du streak pour l'utilisateur ${userId}`)
    console.log(`    📅 Date de départ: ${checkDate.toISOString()}`)
    console.log(`    📅 Date limite: ${limitDate.toISOString()}`)

    while (true) {
      // Arrêter si on dépasse la limite de 30 jours
      if (differenceInDays(checkDate, limitDate) < 0) {
        console.log(`    ⚠️  Limite de 30 jours atteinte`)
        break
      }

      const dayName = checkDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
      console.log(`    📆 Vérification du ${checkDate.toISOString().split('T')[0]} (${dayName})`)
      
      // Trouver les habitudes pour ce jour
      const dayHabits = await prisma.habit.findMany({
        where: {
          userId,
          daysOfWeek: {
            has: dayName
          }
        },
        include: {
          entries: {
            where: {
              date: {
                gte: startOfDay(checkDate),
                lt: endOfDay(checkDate)
              },
              completed: true
            }
          }
        }
      })

      console.log(`      📋 ${dayHabits.length} habitudes trouvées pour ce jour`)

      // Si aucune habitude prévue ce jour, on passe au jour précédent
      if (dayHabits.length === 0) {
        console.log(`      ➡️  Aucune habitude prévue, on continue`)
        checkDate = subDays(checkDate, 1)
        continue
      }

      // Vérifier si toutes les habitudes du jour ont été complétées
      const completedHabits = dayHabits.filter(habit => habit.entries.length > 0)
      console.log(`      ✅ ${completedHabits.length}/${dayHabits.length} habitudes complétées`)
      
      if (completedHabits.length === dayHabits.length) {
        streak++
        console.log(`      🎯 Jour parfait ! Streak = ${streak}`)
        checkDate = subDays(checkDate, 1)
      } else {
        console.log(`      ❌ Jour incomplet, fin du streak`)
        break
      }
    }

    console.log(`  🏆 Streak final: ${streak} jours`)
    return streak
  } catch (error) {
    console.error(`  ❌ Erreur lors du calcul du streak:`, error)
    return 0
  }
}

async function initializeGamification() {
  try {
    console.log("🎮 Initialisation des données de gamification...")

    // Récupérer tous les utilisateurs
    const users = await prisma.user.findMany()
    console.log(`📊 ${users.length} utilisateurs trouvés`)

    // Initialiser la gamification pour chaque utilisateur
    for (const user of users) {
      try {
        console.log(`\n👤 Traitement de l'utilisateur ${user.email}...`)
        
        // Vérifier si l'utilisateur a déjà des données de gamification
        const existingGamification = await prisma.userGamification.findUnique({
          where: { userId: user.id }
        })

        if (existingGamification) {
          console.log("  ✓ Données de gamification déjà existantes")
          continue
        }

        // Calculer le streak actuel
        const currentStreak = await calculateCurrentStreak(user.id)
        console.log(`  📈 Streak calculé: ${currentStreak} jours`)

        // Compter le nombre total d'habitudes complétées
        const completedHabits = await prisma.habitEntry.count({
          where: {
            habit: {
              userId: user.id
            },
            completed: true
          }
        })
        console.log(`  🎯 Total des habitudes complétées: ${completedHabits}`)

        // Calculer les points initiaux
        const basePoints = completedHabits * 10 // 10 points par habitude complétée
        const streakBonus = Math.floor(basePoints * 0.1 * currentStreak) // 10% bonus par jour de streak
        const points = basePoints + streakBonus
        
        // Créer les données de gamification
        await prisma.userGamification.create({
          data: {
            userId: user.id,
            points,
            level: Math.max(1, Math.floor(Math.log(points / 100 + 1) / Math.log(1.5)) + 1),
            currentStreak,
            longestStreak: currentStreak,
            lastActivityDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })

        console.log(`  ✅ Données de gamification initialisées:`)
        console.log(`    - Points: ${points}`)
        console.log(`    - Streak: ${currentStreak}`)
        console.log(`    - Habitudes complétées: ${completedHabits}`)
      } catch (error) {
        console.error(`  ❌ Erreur lors du traitement de l'utilisateur ${user.email}:`, error)
      }
    }

    console.log("\n✨ Initialisation terminée avec succès!")
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
initializeGamification() 