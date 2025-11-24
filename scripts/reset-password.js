import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2] || 'admin@productif.io'
  const password = process.argv[3] || 'admin123'
  
  console.log(`Réinitialisation du mot de passe pour: ${email}`)
  
  // Vérifier si l'utilisateur existe
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    console.error(`Utilisateur avec l'email ${email} non trouvé`)
    process.exit(1)
  }

  // Hasher le nouveau mot de passe
  const hashedPassword = await hash(password, 10)

  // Mettre à jour le mot de passe
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  })

  console.log(`✅ Mot de passe réinitialisé pour ${email}`)
  console.log(`   Nouveau mot de passe: ${password}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

