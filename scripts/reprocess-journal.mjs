import { PrismaClient } from '@prisma/client'
import OpenAI from 'openai'

const prisma = new PrismaClient()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function analyzeJournalEntry(transcription) {
  const prompt = `Analyse cette entrée de journal quotidien et extrait :
1. Le sentiment général (positif/neutre/négatif)
2. Les thèmes principaux (productivité, bien-être, relations, etc.)
3. Les points forts / highlights de la journée
4. Les axes d'amélioration

Transcription :
"""
${transcription}
"""

Réponds au format JSON :
{
  "sentiment": "positif|neutre|négatif",
  "themes": ["thème 1", "thème 2"],
  "highlights": ["point fort 1", "point fort 2"],
  "improvements": ["amélioration 1", "amélioration 2"]
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Tu es un coach productivité expert. Réponds en JSON.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.5,
    response_format: { type: 'json_object' }
  })

  const content = response.choices?.[0]?.message?.content || '{}'
  try {
    const parsed = JSON.parse(content)
    return {
      sentiment: parsed.sentiment || 'neutre',
      themes: Array.isArray(parsed.themes) ? parsed.themes : [],
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : []
    }
  } catch {
    return {
      sentiment: 'neutre',
      themes: [],
      highlights: [],
      improvements: []
    }
  }
}

async function processPendingJournals(userId) {
  try {
    const where = {
      processed: false,
      transcription: { not: null }
    }
    
    if (userId) {
      where.userId = userId
    }

    const pendingJournals = await prisma.journalEntry.findMany({
      where,
      orderBy: { date: 'desc' }
    })

    console.log(`📊 ${pendingJournals.length} journaux non traités trouvés`)

    for (const journal of pendingJournals) {
      try {
        console.log(`\n🔄 Traitement du journal ${journal.id}...`)
        console.log(`   📅 Date: ${journal.date.toISOString()}`)
        console.log(`   👤 User: ${journal.userId}`)
        console.log(`   📝 Transcription: ${journal.transcription?.substring(0, 100)}...`)

        const analysis = await analyzeJournalEntry(journal.transcription)

        await prisma.journalEntry.update({
          where: { id: journal.id },
          data: {
            sentiment: analysis.sentiment,
            themes: analysis.themes,
            highlights: analysis.highlights,
            improvements: analysis.improvements,
            processed: true,
            processingError: null
          }
        })

        console.log(`   ✅ Journal traité avec succès`)
        console.log(`      Sentiment: ${analysis.sentiment}`)
        console.log(`      Themes: ${analysis.themes.join(', ')}`)
        console.log(`      Highlights: ${analysis.highlights.length}`)
        console.log(`      Improvements: ${analysis.improvements.length}`)
      } catch (error) {
        console.error(`   ❌ Erreur pour le journal ${journal.id}:`, error.message)
        await prisma.journalEntry.update({
          where: { id: journal.id },
          data: {
            processed: false,
            processingError: error?.message || 'Erreur inconnue'
          }
        })
      }
    }

    console.log(`\n✅ Traitement terminé !`)
  } catch (error) {
    console.error('❌ Erreur globale:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Récupérer le userId depuis les arguments de ligne de commande
const userId = process.argv[2]

if (userId) {
  console.log(`🎯 Traitement des journaux pour l'utilisateur: ${userId}\n`)
} else {
  console.log(`🎯 Traitement de tous les journaux non traités\n`)
}

processPendingJournals(userId)

