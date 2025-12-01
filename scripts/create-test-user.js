const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestUser() {
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
    
    console.log('✅ Utilisateur de test créé:', user)
    
    // Créer quelques sessions de deep work pour avoir des données
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Session d'aujourd'hui
    const timeEntry1 = await prisma.timeEntry.create({
      data: {
        userId: user.id,
        startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9h
        endTime: new Date(today.getTime() + 11 * 60 * 60 * 1000), // 11h
        description: 'Session de deep work matinale',
      },
    })
    
    await prisma.deepWorkSession.create({
      data: {
        userId: user.id,
        timeEntryId: timeEntry1.id,
        status: 'completed',
        focusScore: 85,
      },
    })
    
    // Session de la semaine
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const timeEntry2 = await prisma.timeEntry.create({
      data: {
        userId: user.id,
        startTime: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000), // 14h
        endTime: new Date(yesterday.getTime() + 16.5 * 60 * 60 * 1000), // 16h30
        description: 'Session de deep work après-midi',
      },
    })
    
    await prisma.deepWorkSession.create({
      data: {
        userId: user.id,
        timeEntryId: timeEntry2.id,
        status: 'completed',
        focusScore: 92,
      },
    })
    
    console.log('✅ Sessions de deep work créées')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
