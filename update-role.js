// Script pour mettre à jour le rôle de l'utilisateur
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateUserRole() {
  try {
    // Mettre à jour l'utilisateur (remplacer par votre email)
    const email = 'noah.lugagne@free.fr'
    
    // Exécuter la mise à jour directement via Prisma
    const result = await prisma.$executeRaw`
      UPDATE "User" 
      SET "role" = 'SUPER_ADMIN' 
      WHERE "email" = ${email}
    `
    
    console.log(`✅ Mise à jour réussie ! L'utilisateur avec l'email ${email} est maintenant SUPER_ADMIN.`)
    console.log(`Vous pouvez redémarrer l'application et vous connecter.`)
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour :', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateUserRole() 