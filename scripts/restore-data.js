const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Créer les utilisateurs
  const users = [
    {
      email: 'admin@productif.io',
      password: 'admin123',
      name: 'Super Admin',
      role: 'SUPER_ADMIN'
    },
    {
      email: 'user1@productif.io',
      password: 'user123',
      name: 'Utilisateur 1',
      role: 'USER'
    },
    {
      email: 'user2@productif.io',
      password: 'user123',
      name: 'Utilisateur 2',
      role: 'USER'
    }
  ]

  console.log('Création des utilisateurs...')
  const createdUsers = []
  for (const userData of users) {
    const hashedPassword = await hash(userData.password, 10)
    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword
      }
    })
    createdUsers.push(user)
    console.log(`Utilisateur créé: ${user.email}`)
  }

  // Créer les habitudes pour chaque utilisateur
  console.log('\nCréation des habitudes...')
  for (const user of createdUsers) {
    const habits = [
      {
        name: 'Méditation',
        description: 'Méditer 10 minutes par jour',
        frequency: 'DAILY',
        targetDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        targetTime: '08:00',
        reminder: true,
        color: '#4CAF50'
      },
      {
        name: 'Lecture',
        description: 'Lire 30 minutes par jour',
        frequency: 'DAILY',
        targetDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        targetTime: '20:00',
        reminder: true,
        color: '#2196F3'
      },
      {
        name: 'Sport',
        description: 'Faire du sport 3 fois par semaine',
        frequency: 'WEEKLY',
        targetDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
        targetTime: '18:00',
        reminder: true,
        color: '#FF9800'
      },
      {
        name: 'Apprentissage',
        description: 'Apprendre quelque chose de nouveau',
        frequency: 'DAILY',
        targetDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        targetTime: '19:00',
        reminder: true,
        color: '#9C27B0',
        isLearningHabit: true
      }
    ]

    for (const habitData of habits) {
      const habit = await prisma.habit.create({
        data: {
          ...habitData,
          userId: user.id
        }
      })
      console.log(`Habitude créée pour ${user.email}: ${habit.name}`)

      // Créer quelques entrées d'habitudes pour la semaine en cours
      const today = new Date()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Lundi

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)

        // Créer une entrée aléatoire (70% de chance d'être complétée)
        if (Math.random() < 0.7) {
          const entry = await prisma.habitEntry.create({
            data: {
              habitId: habit.id,
              date: date,
              completed: true,
              note: habit.isLearningHabit ? 'Note d\'apprentissage' : null,
              rating: habit.isLearningHabit ? 4 : null
            }
          })
          console.log(`Entrée créée pour ${habit.name} le ${date.toISOString().split('T')[0]}`)
        }
      }
    }
  }

  console.log('\nRestauration des données terminée !')
}

main()
  .catch((e) => {
    console.error('Erreur lors de la restauration:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 