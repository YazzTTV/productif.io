import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    const userId = process.argv[2]
    if (!userId) {
      console.log('Usage: tsx scripts/debug-improvement-reminder.ts <userId>')
      process.exit(1)
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { notificationSettings: true }
    })
    if (!user) {
      console.log('User not found')
      return
    }

    const s = user.notificationSettings
    console.log('Settings:', {
      isEnabled: s?.isEnabled,
      whatsappEnabled: s?.whatsappEnabled,
      whatsappNumber: s?.whatsappNumber,
      morningReminder: s?.morningReminder,
      morningTime: s?.morningTime,
      improvementReminder: (s as any)?.improvementReminder,
      improvementTime: (s as any)?.improvementTime,
    })

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentJournals = await prisma.journalEntry.count({
      where: { userId, processed: true, date: { gte: since } }
    })
    console.log('Recent processed journals (7d):', recentJournals)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const insight = await prisma.dailyInsight.findUnique({
      where: { userId_date: { userId, date: today } }
    })
    console.log('Today insight:', insight ? { id: insight.id, sent: insight.sent, sentAt: insight.sentAt } : null)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })

