const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Supprimer l'utilisateur existant
  try {
    await prisma.user.deleteMany({
      where: {
        email: 'admin@productif.io'
      }
    })
    console.log('Utilisateur existant supprimé')
  } catch (error) {
    console.log('Aucun utilisateur existant à supprimer')
  }

  // Créer le nouveau super admin
  const email = 'admin@productif.io'
  const password = 'admin123' // À changer après la première connexion
  const hashedPassword = await hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  })

  console.log('Utilisateur super admin créé:', user)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 