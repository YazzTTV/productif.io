import { prisma } from '../lib/prisma.ts'
import { generateApiToken } from '../lib/api-token.ts'

async function main() {
  const phone = (process.env.WHATSAPP_PHONE || '').replace(/\D/g, '')
  const email = process.env.USER_EMAIL || ''
  if (!phone && !email) {
    console.error('Usage: set WHATSAPP_PHONE=3378... or USER_EMAIL=user@example.com')
    process.exit(1)
  }

  const user = await prisma.user.findFirst({
    where: phone ? { whatsappNumber: { equals: phone } } : { email: { equals: email } },
    select: { id: true, email: true, whatsappNumber: true }
  })

  if (!user) {
    console.error('❌ User not found', { phone, email })
    process.exit(1)
  }

  const scopes = [
    'journal:read','journal:write',
    'deepwork:read','deepwork:write',
    'tasks:read','tasks:write'
  ]

  const { token } = await generateApiToken({
    name: 'Agent Journaling Token',
    userId: user.id,
    scopes
  })

  console.log(JSON.stringify({ user, scopes, token }, null, 2))
}

main().finally(() => prisma.$disconnect())


