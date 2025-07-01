import { PrismaClient } from '@prisma/client';

// Import des services compilés
import NotificationContentBuilder from '../src/services/NotificationContentBuilder.js';
import WhatsAppService from '../src/services/WhatsAppService.js';

async function testEnrichedMorning() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🧪 === TEST DE NOTIFICATION MATINALE ENRICHIE ===\n');
        
        // Récupérer l'utilisateur Noah
        const user = await prisma.user.findUnique({
            where: { email: 'noah.lugagne@free.fr' },
            include: {
                notificationSettings: true
            }
        });
        
        if (!user) {
            console.log('❌ Utilisateur non trouvé');
            return;
        }
        
        console.log(`👤 Utilisateur: ${user.email}`);
        console.log(`📱 WhatsApp activé: ${user.notificationSettings?.whatsappEnabled}`);
        
        if (!user.notificationSettings?.whatsappEnabled) {
            console.log('❌ WhatsApp non activé pour cet utilisateur');
            return;
        }
        
        // Utiliser le NotificationContentBuilder compilé
        console.log('\n🔧 Génération du contenu enrichi avec le nouveau builder...');
        const enrichedContent = await NotificationContentBuilder.buildMorningContent(user.id);
        
        console.log('\n📝 === CONTENU ENRICHI GÉNÉRÉ ===');
        console.log('==========================================');
        console.log(enrichedContent);
        console.log('==========================================');
        
        // Analyser l'enrichissement
        const hasTaskSection = enrichedContent.includes('🎯 Voici tes tâches prioritaires');
        const hasHabitSection = enrichedContent.includes('💫 Tes habitudes pour aujourd\'hui');
        const hasTaskItems = enrichedContent.includes('1. ⚡️') || enrichedContent.includes('1. 🔥');
        const hasHabitItems = enrichedContent.includes('1. ✅') || enrichedContent.includes('1. ⭕️');
        
        console.log('\n🔍 === ANALYSE D\'ENRICHISSEMENT ===');
        console.log(`- Section tâches: ${hasTaskSection ? '✅' : '❌'}`);
        console.log(`- Section habitudes: ${hasHabitSection ? '✅' : '❌'}`);
        console.log(`- Tâches listées: ${hasTaskItems ? '✅' : '❌'}`);
        console.log(`- Habitudes listées: ${hasHabitItems ? '✅' : '❌'}`);
        
        const isEnriched = hasTaskSection && hasHabitSection && (hasTaskItems || hasHabitItems);
        console.log(`\n🎉 CONTENU ENRICHI: ${isEnriched ? '✅ OUI' : '❌ NON'}`);
        
        if (isEnriched) {
            console.log('\n🎊 SUCCÈS ! Le système d\'enrichissement fonctionne !');
            
            // Envoyer la notification enrichie via WhatsApp
            console.log('\n🚀 Envoi de la notification enrichie via WhatsApp...');
            
            const formattedMessage = `🌅 Bonjour et bonne journée !\n\n${enrichedContent}\n\n_Envoyé via Productif.io_`;
            
            await WhatsAppService.sendMessage(user.whatsappNumber, formattedMessage);
            
            console.log('✅ Notification enrichie envoyée sur WhatsApp !');
            
            // Enregistrer en base de données
            await prisma.notificationHistory.create({
                data: {
                    userId: user.id,
                    type: 'MORNING_REMINDER',
                    content: enrichedContent,
                    scheduledFor: new Date(),
                    status: 'sent',
                    sentAt: new Date()
                }
            });
            
            console.log('✅ Notification enregistrée en base de données !');
            
        } else {
            console.log('\n⚠️ Le contenu n\'est pas enrichi.');
            
            // Analyser plus en détail
            if (enrichedContent.includes('🌅 Bonjour')) {
                console.log('🔍 DIAGNOSTIC: Nouveau contenu détecté mais pas complètement enrichi.');
            } else if (enrichedContent.includes('C\'est parti pour une nouvelle journée !')) {
                console.log('🔍 DIAGNOSTIC: Ancien contenu encore utilisé.');
            } else {
                console.log('🔍 DIAGNOSTIC: Format de contenu non reconnu.');
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testEnrichedMorning(); 