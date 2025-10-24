import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import OpenAI from 'openai'
import whatsappService from '../../src/services/whatsappService.js'

const prisma = new PrismaClient()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function generateDailyInsights(userId, daysToAnalyze = 7) {
  // Essayer d'abord avec la période demandée, puis fallback sur des périodes plus longues
  const periods = [daysToAnalyze, 14, 30]
  let journals = []
  let actualPeriod = daysToAnalyze
  
  for (const period of periods) {
    const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000)
    journals = await prisma.journalEntry.findMany({
      where: { userId, processed: true, date: { gte: since } },
      orderBy: { date: 'desc' }
    })
    
    if (journals.length > 0) {
      actualPeriod = period
      console.log(`📊 Journal généré avec ${journals.length} entrées sur ${period} jours`)
      break
    }
  }
  
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
    response_format: { type: 'json_object' }
  })
  const content = response.choices?.[0]?.message?.content || '{}'
  try {
    const parsed = JSON.parse(content)
    return {
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      focusAreas: Array.isArray(parsed.focusAreas) ? parsed.focusAreas : []
    }
  } catch {
    return { recommendations: [], focusAreas: [] }
  }
}

export class MorningInsightsScheduler {
  constructor() {
    this.cronJob = null
  }

  start() {
    this.cronJob = cron.schedule(
      '*/1 * * * *',
      async () => {
        await this.sendMorningInsights()
      },
      { timezone: 'Europe/Paris' }
    )
    console.log('MorningInsightsScheduler démarré (vérification chaque minute)')
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop()
      console.log('MorningInsightsScheduler arrêté')
    }
  }

  async sendMorningInsights() {
    try {
      const now = new Date()
      const nowParts = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Paris' })
      const [nowH, nowM] = nowParts.split(':')
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const users = await prisma.user.findMany({
        where: {
          notificationSettings: {
            is: {
              isEnabled: true,
              whatsappEnabled: true,
              improvementReminder: true
            }
          },
          OR: [
            { notificationSettings: { is: { whatsappNumber: { not: null } } } },
            { whatsappNumber: { not: null } }
          ]
        },
        include: { notificationSettings: true }
      })

      console.log(`MorningInsights: ${users.length} utilisateurs éligibles à ${nowH}:${nowM} (Europe/Paris)`) 

      for (const user of users) {
        try {
          const settings = user.notificationSettings
          const target = (settings?.improvementTime || '08:30').split(':')
          const [th, tm] = [target[0] || '07', target[1] || '00']
          if (nowH !== th || nowM !== tm) continue

          // Vérifier s'il y a des journaux sur une période plus large si nécessaire
          const periods = [7, 14, 30]
          let recentJournals = 0
          let actualPeriod = 7
          
          for (const period of periods) {
            recentJournals = await prisma.journalEntry.count({
              where: {
                userId: user.id,
                processed: true,
                date: { gte: new Date(Date.now() - period * 24 * 60 * 60 * 1000) }
              }
            })
            if (recentJournals > 0) {
              actualPeriod = period
              break
            }
          }
          
          if (recentJournals === 0) continue

          let insight = await prisma.dailyInsight.findUnique({
            where: { userId_date: { userId: user.id, date: today } }
          })
          if (!insight) {
            const { recommendations, focusAreas } = await generateDailyInsights(user.id, actualPeriod)
            const recent = await prisma.journalEntry.findMany({
              where: { userId: user.id, processed: true, date: { gte: new Date(Date.now() - actualPeriod * 24 * 60 * 60 * 1000) } },
              select: { id: true }
            })
            insight = await prisma.dailyInsight.create({
              data: {
                userId: user.id,
                date: today,
                recommendations,
                focusAreas,
                basedOnDays: actualPeriod,
                journalEntries: recent.map(j => j.id)
              }
            })
          }

          const phone = user.whatsappNumber || (user.notificationSettings && user.notificationSettings.whatsappNumber)
          if (!insight.sent && phone) {
            await this.sendInsightToUser(phone, insight)
            await prisma.dailyInsight.update({ where: { id: insight.id }, data: { sent: true, sentAt: new Date() } })
          }
        } catch (e) {
          console.error(`Erreur envoi insight pour user ${user.id}:`, e)
        }
      }
    } catch (error) {
      console.error('Erreur sendMorningInsights:', error)
    }
  }

  async sendInsightToUser(phoneNumber, insight) {
    let message = `🌅 **Bonjour ! Voici tes insights du jour**\n\n`
    if (Array.isArray(insight.focusAreas) && insight.focusAreas.length > 0) {
      message += `🎯 **Aujourd'hui, concentre-toi sur :**\n`
      for (const area of insight.focusAreas) message += `• ${area}\n`
      message += `\n`
    }
    message += `💡 **Mes recommandations :**\n`
    insight.recommendations.forEach((rec, idx) => { message += `${idx + 1}. ${rec}\n` })
    message += `\n✨ Bonne journée productive ! 💪`
    await whatsappService.sendMessage(phoneNumber, message)
  }
}

export const morningInsightsScheduler = new MorningInsightsScheduler()


