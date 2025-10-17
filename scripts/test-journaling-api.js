// ESM script (package.json has type: module)

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

async function getJson(path) {
  const res = await fetch(`${APP_URL}${path}`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  return { status: res.status, json }
}

async function main() {
  console.log('🔗 APP_URL =', APP_URL)
  console.log('🔐 JOURNAL_TOKEN =', TOKEN.slice(0, 16) + '...')

  console.log('\n➡️  POST /api/journal/agent')
  const create = await postJson('/api/journal/agent', {
    transcription: "Aujourd'hui j'ai bien travaillé sur mon projet, mais j'ai été interrompu plusieurs fois. J'ai fini mes tâches prioritaires mais je me sens un peu stressé."
  })
  console.log('Status:', create.status)
  console.log('Response:', create.json)

  console.log('\n➡️  GET /api/journal/agent?days=7')
  const list = await getJson('/api/journal/agent?days=7')
  console.log('Status:', list.status)
  console.log('Response entries:', Array.isArray(list.json?.entries) ? list.json.entries.length : list.json)

  console.log('\n➡️  GET /api/journal/insights')
  const insights = await getJson('/api/journal/insights')
  console.log('Status:', insights.status)
  console.log('Response:', insights.json)
}

main().catch((e) => {
  console.error('❌ Test failed:', e)
  process.exit(1)
})


