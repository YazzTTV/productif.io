// ESM compatible (package.json has type: module)

const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const TOKEN = process.env.JOURNAL_TOKEN || ''

if (!TOKEN) {
  console.error('❌ Missing JOURNAL_TOKEN env var')
  process.exit(1)
}

async function postJson(path, body) {
  const res = await fetch(`${APP_URL}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  return { status: res.status, json }
}

async function seed() {
  const now = new Date()
  const d1 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() // J-1
  const d2 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() // J-2

  console.log('➡️  POST J-1')
  const r1 = await postJson('/api/journal/agent', {
    transcription: 'Hier: bonne concentration, quelques interruptions, satisfaction élevée.',
    date: d1
  })
  console.log('Status:', r1.status)
  console.log('Entry id:', r1.json?.entry?.id)

  console.log('➡️  POST J-2')
  const r2 = await postJson('/api/journal/agent', {
    transcription: "Avant-hier: énergie moyenne, stress modéré, objectif principal atteint.",
    date: d2
  })
  console.log('Status:', r2.status)
  console.log('Entry id:', r2.json?.entry?.id)

  console.log('➡️  POST insights (force)')
  const r3 = await postJson('/api/journal/insights', {})
  console.log('Status:', r3.status)
  console.log('Insight id:', r3.json?.insight?.id)
  console.log('Recommendations:', r3.json?.insight?.recommendations)
  console.log('FocusAreas:', r3.json?.insight?.focusAreas)
}

seed().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})


