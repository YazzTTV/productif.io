import { PrismaClient } from '@prisma/client'
import whatsappService from '../src/services/whatsappService.js'

async function main() {
  const prisma = new PrismaClient()
  try {
    const userId = process.argv[2]
    if (!userId) {
      console.log('Usage: tsx scripts/force-improvement-reminder.ts <userId>')
      process.exit(1)
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { notificationSettings: true }
    })
    if (!user) {
      console.log('User not found')
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Générer ou récupérer l'insight du jour
    const insight = await prisma.dailyInsight.upsert({
      where: { userId_date: { userId, date: today } },
      update: { sent: false, sentAt: null },
      create: {
        userId,
        date: today,
        recommendations: ['Continue à noter tes journées pour recevoir des recommandations personnalisées'],
        focusAreas: [],
        sent: false
      }
    })

    // Générer les insights avec IA
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const journals = await prisma.journalEntry.findMany({
      where: { userId, processed: true, date: { gte: since } },
      orderBy: { date: 'desc' }
    })

    if (journals.length > 0) {
      const OpenAI = (await import('openai')).default
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      
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
      const parsed = JSON.parse(content)
      
      await prisma.dailyInsight.update({
        where: { id: insight.id },
        data: {
          recommendations: parsed.recommendations || [],
          focusAreas: parsed.focusAreas || []
        }
      })
    }

    // Envoyer le message WhatsApp
    if (user.notificationSettings?.whatsappNumber) {
      const updatedInsight = await prisma.dailyInsight.findUnique({
        where: { id: insight.id }
      })

      let message = `🌅 **Tes axes d'amélioration**\n\n`
      if (updatedInsight?.focusAreas && updatedInsight.focusAreas.length > 0) {
        message += `🎯 **Concentre-toi sur :**\n`
        updatedInsight.focusAreas.forEach((area: string) => {
          message += `• ${area}\n`
        })
        message += `\n`
      }
      message += `💡 **Mes recommandations :**\n`
      updatedInsight?.recommendations?.forEach((rec: string, idx: number) => {
        message += `${idx + 1}. ${rec}\n`
      })

      await whatsappService.sendMessage(user.notificationSettings.whatsappNumber, message)
      
      // Marquer comme envoyé
      await prisma.dailyInsight.update({
        where: { id: insight.id },
        data: { sent: true, sentAt: new Date() }
      })

      console.log('✅ Rappel amélioration envoyé avec succès')
    } else {
      console.log('❌ Pas de numéro WhatsApp configuré')
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
