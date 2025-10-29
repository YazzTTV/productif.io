import prisma from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface BehaviorAnalysis {
  patterns: Record<string, any>
  insights: string[]
  recommendations: string[]
  correlations: Record<string, number>
  averages: {
    mood: number
    focus: number
    motivation: number
    energy: number
    stress: number
  }
}

export async function analyzeBehaviorPatterns(
  userId: string,
  days: number = 7
): Promise<BehaviorAnalysis> {
  // Récupérer tous les check-ins de la période
  const checkIns = await prisma.behaviorCheckIn.findMany({
    where: {
      userId,
      timestamp: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      }
    },
    orderBy: { timestamp: 'asc' }
  })

  if (checkIns.length < 5) {
    return {
      patterns: {},
      insights: ['Continue à renseigner tes états pour recevoir une analyse'],
      recommendations: [],
      correlations: {},
      averages: { mood: 0, focus: 0, motivation: 0, energy: 0, stress: 0 }
    }
  }

  // Calculer les moyennes par type
  const averages = calculateAverages(checkIns)

  // Détecter des patterns temporels
  const patterns = detectTimePatterns(checkIns)

  // Calculer les corrélations
  const correlations = calculateCorrelations(checkIns)

  // Générer insights via IA
  const aiAnalysis = await generateAIInsights(checkIns, averages, patterns, correlations)

  return {
    patterns,
    insights: aiAnalysis.insights,
    recommendations: aiAnalysis.recommendations,
    correlations,
    averages
  }
}

function calculateAverages(checkIns: any[]) {
  const byType = {
    mood: [] as number[],
    focus: [] as number[],
    motivation: [] as number[],
    energy: [] as number[],
    stress: [] as number[]
  }

  checkIns.forEach(ci => {
    if (byType[ci.type as keyof typeof byType]) {
      byType[ci.type as keyof typeof byType].push(ci.value)
    }
  })

  return {
    mood: avg(byType.mood),
    focus: avg(byType.focus),
    motivation: avg(byType.motivation),
    energy: avg(byType.energy),
    stress: avg(byType.stress)
  }
}

function detectTimePatterns(checkIns: any[]) {
  const byHour: Record<number, { values: number[]; types: string[] }> = {}

  checkIns.forEach(ci => {
    const hour = new Date(ci.timestamp).getHours()
    if (!byHour[hour]) byHour[hour] = { values: [], types: [] }
    byHour[hour].values.push(ci.value)
    byHour[hour].types.push(ci.type)
  })

  // Identifier les pics et creux
  const hourlyAvg = Object.entries(byHour).map(([hour, data]) => ({
    hour: parseInt(hour),
    avg: avg(data.values)
  }))

  const peakHours = hourlyAvg
    .filter(h => h.avg >= 7)
    .map(h => h.hour)

  const lowHours = hourlyAvg
    .filter(h => h.avg <= 4)
    .map(h => h.hour)

  return {
    peakHours,
    lowHours,
    morningAvg: avg(hourlyAvg.filter(h => h.hour >= 6 && h.hour < 12).map(h => h.avg)),
    afternoonAvg: avg(hourlyAvg.filter(h => h.hour >= 12 && h.hour < 18).map(h => h.avg)),
    eveningAvg: avg(hourlyAvg.filter(h => h.hour >= 18).map(h => h.avg))
  }
}

function calculateCorrelations(checkIns: any[]) {
  // Simplification : corrélation entre focus et energy
  const focusValues = checkIns.filter(ci => ci.type === 'focus').map(ci => ci.value)
  const energyValues = checkIns.filter(ci => ci.type === 'energy').map(ci => ci.value)

  const correlations: Record<string, number> = {}

  if (focusValues.length > 3 && energyValues.length > 3) {
    // Calculer corrélation de Pearson (simplifiée)
    const minLength = Math.min(focusValues.length, energyValues.length)
    const focus = focusValues.slice(0, minLength)
    const energy = energyValues.slice(0, minLength)
    correlations.focus_energy = pearsonCorrelation(focus, energy)
  }

  // Autres corrélations possibles
  const moodValues = checkIns.filter(ci => ci.type === 'mood').map(ci => ci.value)
  const stressValues = checkIns.filter(ci => ci.type === 'stress').map(ci => ci.value)

  if (moodValues.length > 3 && stressValues.length > 3) {
    const minLength = Math.min(moodValues.length, stressValues.length)
    correlations.mood_stress = pearsonCorrelation(
      moodValues.slice(0, minLength),
      stressValues.slice(0, minLength)
    )
  }

  return correlations
}

async function generateAIInsights(
  checkIns: any[],
  averages: any,
  patterns: any,
  correlations: any
): Promise<{ insights: string[]; recommendations: string[] }> {
  const summary = `
Données utilisateur sur ${checkIns.length} check-ins:
- Moyennes: Humeur ${averages.mood.toFixed(1)}/10, Focus ${averages.focus.toFixed(1)}/10, Motivation ${averages.motivation.toFixed(1)}/10, Énergie ${averages.energy.toFixed(1)}/10, Stress ${averages.stress.toFixed(1)}/10
- Pics de performance: ${patterns.peakHours.join(', ')}h
- Baisses: ${patterns.lowHours.join(', ')}h
- Matin: ${patterns.morningAvg.toFixed(1)}, Après-midi: ${patterns.afternoonAvg.toFixed(1)}, Soir: ${patterns.eveningAvg.toFixed(1)}
- Corrélations: ${JSON.stringify(correlations)}
`

  const prompt = `En tant qu'expert en productivité et bien-être, analyse ces données comportementales et génère:

1. 3-5 insights clés sur les patterns de l'utilisateur
2. 3-5 recommandations concrètes et actionnables

${summary}

Réponds au format JSON:
{
  "insights": ["insight 1", "insight 2", ...],
  "recommendations": ["recommandation 1", "recommandation 2", ...]
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: 'Tu es un expert en psychologie de la productivité. Réponds en JSON.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.5,
    response_format: { type: 'json_object' }
  })

  return JSON.parse(response.choices[0].message.content!)
}

// Utils
function avg(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  return denominator === 0 ? 0 : numerator / denominator
}
