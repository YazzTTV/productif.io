import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    const userId = process.argv[2]
    if (!userId) {
      console.log('Usage: npx tsx scripts/reset-insight-sent.ts <userId>')
      process.exit(1)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const result = await prisma.dailyInsight.updateMany({
      where: {
        userId,
        date: today
      },
      data: {
        sent: false,
        sentAt: null
      }
    })

    console.log(`✅ ${result.count} insight(s) réinitialisé(s) pour aujourd'hui`)
    
    // Vérifier
    const insight = await prisma.dailyInsight.findUnique({
      where: { userId_date: { userId, date: today } }
    })
    
    console.log('État actuel:', {
      sent: insight?.sent,
      sentAt: insight?.sentAt
    })
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })

