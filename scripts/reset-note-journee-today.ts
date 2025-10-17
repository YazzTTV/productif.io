import { prisma } from '../lib/prisma.ts'

async function main() {
  const phoneArg = process.argv[2]
  const phone = phoneArg || process.env.WHATSAPP_PHONE || ''
  if (!phone) {
    console.error('Missing phone. Pass as arg: npx tsx scripts/reset-note-journee-today.ts <PHONE>')
    process.exit(1)
  }

  try {
    const cleanPhone = phone.replace(/\D/g, '')
    const user = await prisma.user.findFirst({ where: { whatsappNumber: { equals: cleanPhone } } })
    if (!user) {
      console.log(JSON.stringify({ status: 'NO_USER', phone: cleanPhone }, null, 2))
      return
    }

    // Find the habit "Note de sa journée" for this user (case-insensitive)
    const habit = await prisma.habit.findFirst({
      where: {
        userId: user.id,
        name: { contains: 'note de sa journée', mode: 'insensitive' }
      }
    })
    if (!habit) {
      console.log(JSON.stringify({ status: 'NO_HABIT', userId: user.id }, null, 2))
      return
    }

    // Compute UTC midnight for today
    const now = new Date()
    const utcDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0))

    const entry = await prisma.habitEntry.findUnique({
      where: { habitId_date: { habitId: habit.id, date: utcDate } }
    })

    if (!entry) {
      console.log(JSON.stringify({ status: 'NO_ENTRY_TODAY', userId: user.id, habitId: habit.id, date: utcDate.toISOString() }, null, 2))
      return
    }

    await prisma.habitEntry.delete({ where: { id: entry.id } })

    console.log(JSON.stringify({ status: 'DELETED', userId: user.id, habitId: habit.id, entryId: entry.id, date: utcDate.toISOString() }, null, 2))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error('RESET_ERROR', e)
  process.exit(1)
})


