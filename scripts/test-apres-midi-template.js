import { PrismaClient } from '@prisma/client';
import whatsappService from '../src/services/whatsappService.js';
import NotificationContentBuilder from '../src/services/NotificationContentBuilder.js';

const prisma = new PrismaClient();

async function testApresMidiTemplate() {
    try {
        console.log('🧪 === TEST TEMPLATE RAPPEL APRÈS-MIDI ===\n');
        
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
                console.log('   node scripts/test-apres-midi-template.js email@example.com');
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
        
        // Construire le contenu (message complet)
        console.log('\n🔧 Génération du message après-midi...');
        const afternoonMessage = await NotificationContentBuilder.buildAfternoonContent(user.id);
        
        console.log('\n📝 === CONTENU DU MESSAGE ===');
        console.log('==========================================');
        console.log(afternoonMessage);
        console.log('==========================================');
        
        console.log('\n📋 Envoi en MESSAGE TEXTE (pas de template pour permettre les sauts de ligne)');
        
        try {
            const result = await whatsappService.sendMessage(
                phoneNumber,
                afternoonMessage,
                null,
                null  // Pas de template
            );
            
            console.log('\n✅ === SUCCÈS ===');
            console.log('📱 Message envoyé avec succès !');
            console.log(`   - Message ID: ${result.messages?.[0]?.id || 'N/A'}`);
            console.log(`   - WA ID: ${result.contacts?.[0]?.wa_id || 'N/A'}`);
            console.log('\n💡 Vérifiez votre WhatsApp pour voir le message avec les listes formatées !');
            
        } catch (error) {
            console.error('\n❌ === ERREUR ===');
            console.error('Erreur:', error.message);
        }
        
        // Enregistrer en base de données pour traçabilité
        console.log('\n💾 Enregistrement en base de données...');
        await prisma.notificationHistory.create({
            data: {
                userId: user.id,
                type: 'AFTERNOON_REMINDER',
                content: afternoonMessage.substring(0, 200) + '...',  // Tronquer si trop long
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
testApresMidiTemplate()
    .then(() => {
        console.log('\n✅ Test terminé');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erreur fatale:', error);
        process.exit(1);
    });

