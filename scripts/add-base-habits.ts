import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Habitudes de base à ajouter
const BASE_HABITS = [
  {
    name: "Apprentissage",
    description: "Notez ce que vous avez appris aujourd'hui",
    color: "#4338CA", // Indigo
    frequency: "daily",
    daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    order: 0,
  },
  {
    name: "Note de sa journée",
    description: "Évaluez votre journée sur 10 et expliquez pourquoi",
    color: "#0EA5E9", // Sky
    frequency: "daily",
    daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    order: 1,
  },
]

async function addBaseHabits() {
  try {
    const usernames = ['djahid', 'théophile']
    
    console.log('Recherche des utilisateurs...')
    
    for (const username of usernames) {
      // Rechercher l'utilisateur par nom (insensible à la casse)
      const user = await prisma.user.findFirst({
        where: {
          name: {
            contains: username,
            mode: 'insensitive',
          },
        },
      })

      if (!user) {
        console.log(`❌ Utilisateur "${username}" non trouvé`)
        continue
      }

      console.log(`\n✅ Utilisateur trouvé: ${user.name} (${user.email})`)

      // Vérifier les habitudes existantes
      const existingHabits = await prisma.habit.findMany({
        where: {
          userId: user.id,
        },
      })

      console.log(`   Habitudes existantes: ${existingHabits.length}`)

      // Pour chaque habitude de base
      for (const habitData of BASE_HABITS) {
        // Vérifier si l'habitude existe déjà
        const existingHabit = existingHabits.find(
          h => h.name.toLowerCase() === habitData.name.toLowerCase()
        )

        if (existingHabit) {
          console.log(`   ⏭️  Habitude "${habitData.name}" existe déjà, ignorée`)
        } else {
          // Trouver l'ordre maximum actuel
          const maxOrderHabit = await prisma.habit.findFirst({
            where: { userId: user.id },
            orderBy: { order: 'desc' },
            select: { order: true },
          })

          const maxOrder = maxOrderHabit ? maxOrderHabit.order + 1 : habitData.order

          // Créer l'habitude
          const habit = await prisma.habit.create({
            data: {
              ...habitData,
              userId: user.id,
              order: maxOrder,
            },
          })

          console.log(`   ✅ Habitude "${habit.name}" créée (ordre: ${habit.order})`)
        }
      }
    }

    console.log('\n✅ Terminé!')
  } catch (error) {
    console.error('❌ Erreur:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addBaseHabits()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

