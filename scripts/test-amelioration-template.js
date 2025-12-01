import { PrismaClient } from '@prisma/client';
import whatsappService from '../src/services/whatsappService.js';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Fonction pour générer les insights quotidiens (copiée depuis MorningInsightsScheduler.js)
async function generateDailyInsights(userId, daysToAnalyze = 7) {
    const prisma = new PrismaClient();
    try {
        // Essayer d'abord avec la période demandée, puis fallback sur des périodes plus longues
        const periods = [daysToAnalyze, 14, 30];
        let journals = [];
        let actualPeriod = daysToAnalyze;
        
        for (const period of periods) {
            const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000);
            journals = await prisma.journalEntry.findMany({
                where: { userId, processed: true, date: { gte: since } },
                orderBy: { date: 'desc' }
            });
            
            if (journals.length > 0) {
                actualPeriod = period;
                console.log(`📊 Journal généré avec ${journals.length} entrées sur ${period} jours`);
                break;
            }
        }
        
        if (journals.length === 0) {
            return {
                recommendations: [
                    'Continue à noter tes journées pour recevoir des recommandations personnalisées'
                ],
                focusAreas: []
            };
        }
        
        const summary = journals
            .map((j, idx) => {
                const highlights = (j.highlights || []).join(', ');
                const improvements = (j.improvements || []).join(', ');
                return `Jour ${idx + 1} : ${highlights} | Améliorations : ${improvements}`;
            })
            .join('\n');

        const prompt = `En tant que coach productivité, analyse ces ${journals.length} dernières entrées de journal et génère :
1. 3-5 recommandations concrètes et actionnables pour améliorer la productivité
2. 2-3 domaines clés sur lesquels se concentrer

Historique :
"""
${summary}
"""

Réponds UNIQUEMENT avec un JSON valide de cette forme :
{
  "recommendations": ["reco1", "reco2", ...],
  "focusAreas": ["domaine1", "domaine2", ...]
}`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'Tu es un coach en productivité. Réponds UNIQUEMENT en JSON valide.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
        });

        const response = JSON.parse(completion.choices[0].message.content);
        return {
            recommendations: response.recommendations || [],
            focusAreas: response.focusAreas || []
        };
    } finally {
        await prisma.$disconnect();
    }
}

const prisma = new PrismaClient();

async function testAmeliorationTemplate() {
    try {
        console.log('🧪 === TEST TEMPLATE RAPPEL AMÉLIORATION ===\n');
        
        // Vérifier la configuration
        console.log('📋 Configuration des templates:');
        console.log(`   - WHATSAPP_USE_TEMPLATES: ${process.env.WHATSAPP_USE_TEMPLATES || 'non défini'}`);
        console.log(`   - WHATSAPP_TEMPLATE_LANGUAGE: ${process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'fr'}`);
        console.log('');
        
        // Récupérer l'utilisateur
        const userEmail = process.argv[2] || null;
        
        let user;
        if (userEmail) {
            console.log(`🔍 Recherche de l'utilisateur: ${userEmail}`);
            user = await prisma.user.findUnique({
                where: { email: userEmail },
                include: { notificationSettings: true }
            });
        } else {
            console.log('🔍 Recherche du premier utilisateur avec WhatsApp activé...');
            const users = await prisma.user.findMany({
                where: {
                    notificationSettings: {
                        whatsappEnabled: true,
                        whatsappNumber: { not: null }
                    }
                },
                include: { notificationSettings: true },
                take: 1
            });
            
            if (users.length === 0) {
                console.log('❌ Aucun utilisateur avec WhatsApp activé trouvé');
                console.log('\n💡 Utilisation:');
                console.log('   node scripts/test-amelioration-template.js email@example.com');
                return;
            }
            
            user = users[0];
        }
        
        if (!user) {
            console.log('❌ Utilisateur non trouvé');
            return;
        }
        
        console.log(`\n👤 Utilisateur trouvé:`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - WhatsApp activé: ${user.notificationSettings?.whatsappEnabled ? '✅' : '❌'}`);
        
        const phoneNumber = user.notificationSettings?.whatsappNumber || user.whatsappNumber;
        if (!phoneNumber) {
            console.log('\n❌ Aucun numéro WhatsApp configuré');
            return;
        }
        
        // Récupérer ou générer l'insight
        console.log('\n🔧 Récupération ou génération des insights...');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let insight = await prisma.dailyInsight.findUnique({
            where: {
                userId_date: {
                    userId: user.id,
                    date: today
                }
            }
        });
        
        if (!insight) {
            console.log('   📊 Aucun insight existant, génération...');
            
            // Vérifier s'il y a des journaux récents
            const recentJournals = await prisma.journalEntry.findMany({
                where: {
                    userId: user.id,
                    processed: true,
                    date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                },
                select: { id: true }
            });
            
            if (recentJournals.length > 0) {
                const { recommendations, focusAreas } = await generateDailyInsights(user.id, 7);
                
                insight = await prisma.dailyInsight.create({
                    data: {
                        userId: user.id,
                        date: today,
                        recommendations,
                        focusAreas,
                        basedOnDays: 7,
                        journalEntries: recentJournals.map(j => j.id)
                    }
                });
                
                console.log('   ✅ Insights générés avec IA');
            } else {
                console.log('   ⚠️ Aucun journal récent, création d\'insights par défaut');
                
                insight = await prisma.dailyInsight.create({
                    data: {
                        userId: user.id,
                        date: today,
                        recommendations: [
                            'Établir un calendrier hebdomadaire pour planifier des sessions de travail dédiées',
                            'Utiliser des outils de gestion de projet pour suivre les progrès',
                            'Mettre en place des rappels quotidiens pour prioriser les tâches importantes',
                            'Allouer des plages horaires spécifiques pour les tâches importantes',
                            'Intégrer des pauses actives dans la journée de travail'
                        ],
                        focusAreas: [
                            'Gestion du temps et des priorités',
                            'Amélioration continue des processus de travail'
                        ],
                        basedOnDays: 7,
                        journalEntries: []
                    }
                });
            }
        }
        
        console.log('\n📝 === CONTENU DES INSIGHTS ===');
        console.log('==========================================');
        console.log('\n🎯 FOCUS AREAS (Variable {{1}}):');
        if (insight.focusAreas && insight.focusAreas.length > 0) {
            insight.focusAreas.forEach(area => {
                console.log(`   • ${area}`);
            });
        } else {
            console.log('   • Continuer sur ta lancée');
        }
        
        console.log('\n💡 RECOMMENDATIONS (Variable {{2}}):');
        if (insight.recommendations && insight.recommendations.length > 0) {
            insight.recommendations.forEach((rec, idx) => {
                console.log(`   ${idx + 1}. ${rec}`);
            });
        } else {
            console.log('   1. Continue à noter tes journées');
        }
        console.log('==========================================');
        
        // Construire les variables du template
        const focusAreasText = insight.focusAreas && insight.focusAreas.length > 0
            ? insight.focusAreas.map(area => `• ${area}`).join('\n')
            : '• Continuer sur ta lancée';
        
        const recommendationsText = insight.recommendations && insight.recommendations.length > 0
            ? insight.recommendations.map((rec, idx) => `${idx + 1}. ${rec}`).join('\n')
            : '1. Continue à noter tes journées pour recevoir des recommandations personnalisées';
        
        // Vérifier si les templates sont activés
        const useTemplates = process.env.WHATSAPP_USE_TEMPLATES === 'true';
        
        if (useTemplates) {
            console.log('\n📋 Envoi via TEMPLATE WhatsApp...');
            console.log(`   - Template: productif_rappel_amelioration`);
            console.log(`   - Variable {{1}}: ${focusAreasText.substring(0, 50)}...`);
            console.log(`   - Variable {{2}}: ${recommendationsText.substring(0, 50)}...`);
            
            try {
                const result = await whatsappService.sendMessage(
                    phoneNumber,
                    {
                        var1: focusAreasText,
                        var2: recommendationsText
                    },
                    null,
                    'productif_rappel_amelioration'
                );
                
                console.log('\n✅ === SUCCÈS ===');
                console.log('📱 Message envoyé via template avec succès !');
                console.log(`   - Message ID: ${result.messages?.[0]?.id || 'N/A'}`);
                console.log(`   - WA ID: ${result.contacts?.[0]?.wa_id || 'N/A'}`);
                console.log('\n💡 Vérifiez votre WhatsApp pour voir le message avec le template !');
                
            } catch (templateError) {
                console.log('\n❌ === ERREUR AVEC TEMPLATE ===');
                console.error('Erreur:', templateError.message);
                console.log('\n🔄 Tentative de fallback sur message texte...');
                
                // Fallback sur message texte
                let fallbackMessage = `🌅 *Bonjour ! Voici tes insights du jour*\n\n`;
                fallbackMessage += `🎯 *Aujourd'hui, concentre-toi sur :*\n${focusAreasText}\n\n`;
                fallbackMessage += `💡 *Mes recommandations :*\n${recommendationsText}\n\n`;
                fallbackMessage += `✨ Bonne journée productive ! 💪`;
                
                try {
                    const fallbackResult = await whatsappService.sendMessage(
                        phoneNumber,
                        fallbackMessage,
                        null,
                        null
                    );
                    
                    console.log('✅ Message texte envoyé en fallback');
                    console.log(`   - Message ID: ${fallbackResult.messages?.[0]?.id || 'N/A'}`);
                } catch (fallbackError) {
                    console.error('❌ Erreur même en fallback:', fallbackError.message);
                }
            }
        } else {
            console.log('\n⚠️ Templates désactivés - Envoi en message texte classique');
            console.log('💡 Pour activer les templates, ajoutez dans .env:');
            console.log('   WHATSAPP_USE_TEMPLATES=true');
            
            let textMessage = `🌅 *Bonjour ! Voici tes insights du jour*\n\n`;
            textMessage += `🎯 *Aujourd'hui, concentre-toi sur :*\n${focusAreasText}\n\n`;
            textMessage += `💡 *Mes recommandations :*\n${recommendationsText}\n\n`;
            textMessage += `✨ Bonne journée productive ! 💪`;
            
            try {
                const result = await whatsappService.sendMessage(
                    phoneNumber,
                    textMessage,
                    null,
                    null
                );
                
                console.log('\n✅ Message texte envoyé avec succès');
                console.log(`   - Message ID: ${result.messages?.[0]?.id || 'N/A'}`);
            } catch (error) {
                console.error('\n❌ Erreur lors de l\'envoi:', error.message);
            }
        }
        
        // Marquer comme envoyé
        await prisma.dailyInsight.update({
            where: { id: insight.id },
            data: { sent: true, sentAt: new Date() }
        });
        console.log('\n💾 Insight marqué comme envoyé en base de données');
        
    } catch (error) {
        console.error('\n❌ Erreur lors du test:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le test
testAmeliorationTemplate()
    .then(() => {
        console.log('\n✅ Test terminé');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erreur fatale:', error);
        process.exit(1);
    });

