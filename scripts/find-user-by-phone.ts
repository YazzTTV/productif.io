import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    const phone = process.argv[2]
    if (!phone) {
      console.log('Usage: npx tsx scripts/find-user-by-phone.ts <phone>')
      process.exit(1)
    }

    // Nettoyer le numéro (enlever les espaces, tirets, etc.)
    const cleanPhone = phone.replace(/\D/g, '')

    // Chercher dans les deux endroits possibles
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { whatsappNumber: { contains: cleanPhone } },
          { notificationSettings: { is: { whatsappNumber: { contains: cleanPhone } } } }
        ]
      },
      include: { notificationSettings: true }
    })

    if (users.length === 0) {
      console.log(`Aucun utilisateur trouvé avec le numéro contenant: ${cleanPhone}`)
      return
    }

    console.log(`Utilisateurs trouvés (${users.length}):`)
    users.forEach(user => {
      console.log('\n---')
      console.log('ID:', user.id)
      console.log('Email:', user.email)
      console.log('WhatsApp (User):', user.whatsappNumber)
      console.log('WhatsApp (Settings):', user.notificationSettings?.whatsappNumber)
      console.log('ImprovementReminder:', (user.notificationSettings as any)?.improvementReminder)
      console.log('ImprovementTime:', (user.notificationSettings as any)?.improvementTime)
    })
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })

