const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addApprentissageHabit() {
  try {
    console.log('🔍 Recherche des utilisateurs sans habitude "Apprentissage"...')
    
    // Trouver tous les utilisateurs qui n'ont pas l'habitude "Apprentissage"
    const usersWithoutApprentissage = await prisma.user.findMany({
      where: {
        habits: {
          none: {
            name: "Apprentissage"
          }
        }
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    console.log(`📊 ${usersWithoutApprentissage.length} utilisateur(s) trouvé(s) sans l'habitude "Apprentissage"`)

    if (usersWithoutApprentissage.length === 0) {
      console.log('✅ Tous les utilisateurs ont déjà l\'habitude "Apprentissage"')
      return
    }

    // Ajouter l'habitude "Apprentissage" pour chaque utilisateur
    for (const user of usersWithoutApprentissage) {
      console.log(`➕ Ajout de l'habitude "Apprentissage" pour ${user.email}...`)
      
      await prisma.habit.create({
        data: {
          name: "Apprentissage",
          description: "Notez ce que vous avez appris aujourd'hui",
          color: "#4338CA", // Indigo
          frequency: "daily",
          daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
          order: 0, // L'apprentissage est toujours en premier
          userId: user.id
        }
      })
      
      console.log(`✅ Habitude "Apprentissage" ajoutée pour ${user.email}`)
    }

    console.log(`🎉 Migration terminée ! ${usersWithoutApprentissage.length} utilisateur(s) mis à jour.`)

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de l\'habitude "Apprentissage":', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
addApprentissageHabit()



