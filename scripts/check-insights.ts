import { prisma } from '../lib/prisma.ts'
import { generateApiToken } from '../lib/api-token.ts'

async function fetchJson(url: string, token: string) {
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const text = await res.text()
  try { return { status: res.status, json: JSON.parse(text) } } catch { return { status: res.status, json: { raw: text } } }
}

async function main() {
  const phone = (process.env.WHATSAPP_PHONE || '').replace(/\D/g, '')
  const email = process.env.USER_EMAIL || ''
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const providedToken = process.env.JOURNAL_TOKEN || ''

  if (!phone && !email) {
    console.error('Usage: set WHATSAPP_PHONE=3378... or USER_EMAIL=user@example.com')
    process.exit(1)
  }

  const user = await prisma.user.findFirst({
    where: phone ? { whatsappNumber: { equals: phone } } : { email: { equals: email } },
    select: { id: true, email: true, whatsappNumber: true }
  })

  if (!user) {
    console.log(JSON.stringify({ error: 'NO_USER', phone, email }, null, 2))
    return
  }

  const required = ['deepwork:read','deepwork:write','tasks:read','tasks:write','journal:read','journal:write']
  let token = providedToken
  if (!token) {
    const existing = await prisma.apiToken.findFirst({ where: { userId: user.id, scopes: { hasEvery: required } }, orderBy: { createdAt: 'desc' } })
    token = existing?.token || (await generateApiToken({ name: 'Check Insights Script', userId: user.id, scopes: required })).token
  }

  const url = `${baseUrl}/api/journal/insights`
  const result = await fetchJson(url, token)

  const out = {
    baseUrl,
    user,
    httpStatus: result.status,
    insight: result.json?.insight || null
  }

  console.log(JSON.stringify(out, null, 2))
}

main().finally(() => prisma.$disconnect())


