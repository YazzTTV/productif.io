import OpenAI from 'openai'

export interface JournalAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative'
  themes: Record<string, number>
  highlights: string[]
  improvements: string[]
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function analyzeJournalEntry(transcription: string): Promise<JournalAnalysis> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const prompt = `Tu es un coach de productivité bienveillant. Analyse cette entrée de journal quotidien et extrais :

1. Le sentiment général (positive/neutral/negative)
2. Les thèmes abordés avec leur intensité (0-10) : productivité, stress, motivation, satisfaction, énergie, concentration, etc.
3. Les points positifs (ce qui a été aimé ou bien fait)
4. Les axes d'amélioration (formulés de manière constructive)

Entrée de journal :
"""
${transcription}
"""

Réponds UNIQUEMENT au format JSON suivant :
{
  "sentiment": "positive|neutral|negative",
  "themes": {
    "productivité": 7,
    "stress": 3
  },
  "highlights": ["point positif 1", "point positif 2"],
  "improvements": ["amélioration 1", "amélioration 2"]
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: "Tu es un assistant d'analyse de productivité. Tu réponds uniquement en JSON valide."
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' as any }
  })

  const content = response.choices[0].message.content
  if (!content) {
    throw new Error('Empty response from OpenAI')
  }

  const parsed = JSON.parse(content) as JournalAnalysis

  // Validation minimale
  if (!parsed || !parsed.highlights || !parsed.improvements || !parsed.themes || !parsed.sentiment) {
    throw new Error('Invalid analysis JSON')
  }

  return parsed
}


