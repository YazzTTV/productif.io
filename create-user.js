const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  try {
    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash('test123', 12)
    
    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@productif.io',
        password: hashedPassword,
        isVerified: true,
      },
    })
    
    console.log('✅ Utilisateur créé:', user)
    
    // Créer quelques habitudes
    const habits = await prisma.habit.createMany({
      data: [
        {
          userId: user.id,
          name: 'Boire de l\'eau',
          description: 'Boire 8 verres d\'eau par jour',
          icon: '💧',
          category: 'Santé',
          frequency: 'daily',
          targetValue: 8,
          unit: 'verres',
          isActive: true,
        },
        {
          userId: user.id,
          name: 'Exercice',
          description: 'Faire 30 minutes d\'exercice',
          icon: '🏃',
          category: 'Santé',
          frequency: 'daily',
          targetValue: 30,
          unit: 'minutes',
          isActive: true,
        }
      ]
    })
    
    console.log('✅ Habitudes créées:', habits)
    
    // Créer quelques tâches
    const tasks = await prisma.task.createMany({
      data: [
        {
          userId: user.id,
          title: 'Tâche test 1',
          description: 'Description de la tâche 1',
          status: 'TODO',
          priority: 'MEDIUM',
        },
        {
          userId: user.id,
          title: 'Tâche test 2',
          description: 'Description de la tâche 2',
          status: 'COMPLETED',
          priority: 'HIGH',
        }
      ]
    })
    
    console.log('✅ Tâches créées:', tasks)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
