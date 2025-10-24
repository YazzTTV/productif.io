import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    const userId = process.argv[2]
    if (!userId) {
      console.log('Usage: tsx scripts/check-daily-insight.ts <userId>')
      process.exit(1)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const insight = await prisma.dailyInsight.findUnique({
      where: { userId_date: { userId, date: today } }
    })

    console.log('DailyInsight du jour:', insight ? {
      id: insight.id,
      sent: insight.sent,
      sentAt: insight.sentAt,
      recommendations: insight.recommendations.length,
      focusAreas: insight.focusAreas.length,
      basedOnDays: insight.basedOnDays
    } : 'Aucun insight trouvé')

    const settings = await prisma.notificationSettings.findUnique({
      where: { userId }
    })

    console.log('\nNotification Settings:', {
      improvementReminder: settings?.improvementReminder,
      improvementTime: settings?.improvementTime,
      whatsappEnabled: settings?.whatsappEnabled,
      whatsappNumber: settings?.whatsappNumber
    })
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })

