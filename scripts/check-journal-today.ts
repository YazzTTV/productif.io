import { prisma } from '../lib/prisma.ts'

async function main() {
  try {
    const phone = process.env.WHATSAPP_PHONE || '33783642205'
    const user = await prisma.user.findFirst({ where: { whatsappNumber: { equals: phone } } })
    if (!user) {
      console.log(JSON.stringify({ error: 'NO_USER', phone }, null, 2))
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const entries = await prisma.journalEntry.findMany({
      where: { userId: user.id, date: { gte: today } },
      orderBy: { date: 'desc' }
    })

    const insight = await prisma.dailyInsight.findUnique({
      where: { userId_date: { userId: user.id, date: today } }
    })

    console.log(JSON.stringify({
      user: { id: user.id, email: user.email },
      entriesCount: entries.length,
      latestEntry: entries[0] || null,
      insight
    }, null, 2))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error('CHECK_ERROR', e)
  process.exit(1)
})


