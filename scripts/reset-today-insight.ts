import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    const userId = process.argv[2]
    if (!userId) {
      console.log('Usage: tsx scripts/reset-today-insight.ts <userId>')
      process.exit(1)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const insight = await prisma.dailyInsight.findUnique({
      where: { userId_date: { userId, date: today } }
    })

    if (!insight) {
      console.log('No DailyInsight for today to reset.')
      return
    }

    await prisma.dailyInsight.update({
      where: { id: insight.id },
      data: { sent: false, sentAt: null }
    })
    console.log('DailyInsight reset for today:', { id: insight.id })
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })


