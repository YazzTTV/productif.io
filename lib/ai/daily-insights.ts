import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateDailyInsights(
  userId: string,
  daysToAnalyze: number = 7
): Promise<{ recommendations: string[]; focusAreas: string[] }> {
  // Récupérer les journaux récents déjà traités
  const since = new Date(Date.now() - daysToAnalyze * 24 * 60 * 60 * 1000)
  const journals = await prisma.journalEntry.findMany({
    where: { userId, processed: true, date: { gte: since } },
    orderBy: { date: 'desc' }
  })

  if (journals.length === 0) {
    return {
      recommendations: [
        'Continue à noter tes journées pour recevoir des recommandations personnalisées'
      ],
      focusAreas: []
    }
  }

  const summary = journals
    .map((j, idx) => {
      const highlights = (j.highlights || []).join(', ')
      const improvements = (j.improvements || []).join(', ')
      return `Jour ${idx + 1} : ${highlights} | Améliorations : ${improvements}`
    })
    .join('\n')

  const prompt = `En tant que coach productivité, analyse ces ${journals.length} dernières entrées de journal et génère :
1. 3-5 recommandations concrètes et actionnables pour améliorer la productivité
2. 2-3 domaines clés sur lesquels se concentrer

Historique :
"""
${summary}
"""

Réponds au format JSON :
{
  "recommendations": ["recommandation 1", "recommandation 2"],
  "focusAreas": ["domaine 1", "domaine 2"]
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Tu es un coach productivité expert. Réponds en JSON.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.5,
    response_format: { type: 'json_object' as any }
  })

  const content = response.choices[0].message.content
  if (!content) {
    return { recommendations: [], focusAreas: [] }
  }

  const parsed = JSON.parse(content) as { recommendations: string[]; focusAreas: string[] }
  return {
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    focusAreas: Array.isArray(parsed.focusAreas) ? parsed.focusAreas : []
  }
}


