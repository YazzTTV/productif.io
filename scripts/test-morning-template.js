import { PrismaClient } from '@prisma/client';
import whatsappService from '../src/services/whatsappService.js';
import NotificationContentBuilder from '../src/services/NotificationContentBuilder.js';

const prisma = new PrismaClient();

async function testMorningTemplate() {
    try {
        console.log('🧪 === TEST DE NOTIFICATION MATINALE AVEC TEMPLATE ===\n');
        
        // Vérifier la configuration
        console.log('📋 Configuration des templates:');
        console.log(`   - WHATSAPP_USE_TEMPLATES: ${process.env.WHATSAPP_USE_TEMPLATES || 'non défini'}`);
        console.log(`   - WHATSAPP_TEMPLATE_LANGUAGE: ${process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'fr'}`);
        console.log('');
        
        // Option 1 : Utiliser un email spécifique (modifiez-le)
        const userEmail = process.argv[2] || null;
        
        let user;
        if (userEmail) {
            console.log(`🔍 Recherche de l'utilisateur: ${userEmail}`);
            user = await prisma.user.findUnique({
                where: { email: userEmail },
                include: {
                    notificationSettings: true
                }
            });
        } else {
            // Option 2 : Prendre le premier utilisateur avec WhatsApp activé
            console.log('🔍 Recherche du premier utilisateur avec WhatsApp activé...');
            const users = await prisma.user.findMany({
                where: {
                    notificationSettings: {
                        whatsappEnabled: true,
                        whatsappNumber: { not: null }
                    }
                },
                include: {
                    notificationSettings: true
                },
                take: 1
            });
            
            if (users.length === 0) {
                console.log('❌ Aucun utilisateur avec WhatsApp activé trouvé');
                console.log('\n💡 Utilisation:');
                console.log('   node scripts/test-morning-template.js email@example.com');
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
        console.log(`   - Numéro WhatsApp: ${user.notificationSettings?.whatsappNumber || user.whatsappNumber || 'Non configuré'}`);
        
        if (!user.notificationSettings?.whatsappEnabled) {
            console.log('\n❌ WhatsApp non activé pour cet utilisateur');
            return;
        }
        
        const phoneNumber = user.notificationSettings?.whatsappNumber || user.whatsappNumber;
        if (!phoneNumber) {
            console.log('\n❌ Aucun numéro WhatsApp configuré');
            return;
        }
        
        // Construire le contenu (variable {{1}} du template)
        console.log('\n🔧 Génération du contenu des habitudes...');
        const habitsContent = await NotificationContentBuilder.buildMorningContent(user.id);
        
        console.log('\n📝 === CONTENU DE LA VARIABLE {{1}} ===');
        console.log('==========================================');
        console.log(habitsContent);
        console.log('==========================================');
        
        // Vérifier si les templates sont activés
        const useTemplates = process.env.WHATSAPP_USE_TEMPLATES === 'true';
        
        if (useTemplates) {
            console.log('\n📋 Envoi via TEMPLATE WhatsApp...');
            console.log(`   - Template: productif_rappel_matin`);
            console.log(`   - Variable {{1}}: ${habitsContent.substring(0, 50)}...`);
            
            try {
                const result = await whatsappService.sendMessage(
                    phoneNumber,
                    habitsContent,
                    null, // notificationId
                    'productif_rappel_matin' // templateName
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
                const fallbackMessage = `🌅 Bonjour et bonne journée !\n\n🌅 C'est parti pour une nouvelle journée !\n\n${habitsContent}\n\nBonne journée ! 💙`;
                
                try {
                    const fallbackResult = await whatsappService.sendMessage(
                        phoneNumber,
                        fallbackMessage,
                        null,
                        null // Pas de template
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
            
            const textMessage = `🌅 Bonjour et bonne journée !\n\n🌅 C'est parti pour une nouvelle journée !\n\n${habitsContent}\n\nBonne journée ! 💙`;
            
            try {
                const result = await whatsappService.sendMessage(
                    phoneNumber,
                    textMessage,
                    null,
                    null // Pas de template
                );
                
                console.log('\n✅ Message texte envoyé avec succès');
                console.log(`   - Message ID: ${result.messages?.[0]?.id || 'N/A'}`);
            } catch (error) {
                console.error('\n❌ Erreur lors de l\'envoi:', error.message);
            }
        }
        
        // Enregistrer en base de données pour traçabilité
        console.log('\n💾 Enregistrement en base de données...');
        await prisma.notificationHistory.create({
            data: {
                userId: user.id,
                type: 'MORNING_REMINDER',
                content: habitsContent,
                scheduledFor: new Date(),
                status: 'sent',
                sentAt: new Date()
            }
        });
        console.log('✅ Notification enregistrée en base de données');
        
    } catch (error) {
        console.error('\n❌ Erreur lors du test:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le test
testMorningTemplate()
    .then(() => {
        console.log('\n✅ Test terminé');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erreur fatale:', error);
        process.exit(1);
    });

