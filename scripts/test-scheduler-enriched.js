import { PrismaClient } from '@prisma/client';
import NotificationService from '../src/services/NotificationService.js';

async function testSchedulerEnriched() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🧪 === TEST DU PLANIFICATEUR ENRICHI ===\n');
        
        const userId = 'cma6li3j1000ca64sisjbjyfs'; // ID de Noah
        console.log(`👤 Test pour userId: ${userId}`);
        
        // Instancier le service de notifications mis à jour
        const notificationService = new NotificationService();
        
        // Planifier une notification matinale pour maintenant
        console.log('\n🔧 Planification d\'une notification matinale enrichie...');
        const now = new Date();
        
        const notification = await notificationService.scheduleMorningNotification(userId, now);
        
        if (notification) {
            console.log('✅ Notification planifiée avec succès !');
            console.log(`📅 ID: ${notification.id}`);
            console.log(`🕒 Planifiée pour: ${notification.scheduledFor.toLocaleString()}`);
            
            // Attendre un moment
            console.log('\n⏳ Attente de 2 secondes...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Traiter la notification
            console.log('\n🚀 Traitement de la notification...');
            await notificationService.processNotifications();
            
            // Vérifier le résultat
            console.log('\n🔍 Vérification du résultat...');
            const updatedNotification = await prisma.notificationHistory.findUnique({
                where: { id: notification.id }
            });
            
            if (updatedNotification) {
                console.log('\n📋 === RÉSULTAT DE LA NOTIFICATION ===');
                console.log(`🔄 Status: ${updatedNotification.status}`);
                console.log(`📱 Envoyée: ${updatedNotification.sentAt ? updatedNotification.sentAt.toLocaleString() : 'Non'}`);
                console.log(`📝 Longueur: ${updatedNotification.content.length} caractères`);
                
                if (updatedNotification.error) {
                    console.log(`❌ Erreur: ${updatedNotification.error}`);
                }
                
                console.log('\n📝 === CONTENU DE LA NOTIFICATION ===');
                console.log('==========================================');
                console.log(updatedNotification.content);
                console.log('==========================================');
                
                // Analyser l'enrichissement
                const hasTaskSection = updatedNotification.content.includes('🎯 Voici tes tâches prioritaires');
                const hasHabitSection = updatedNotification.content.includes('💫 Tes habitudes pour aujourd\'hui');
                const hasTaskItems = updatedNotification.content.includes('1. ⚡️') || updatedNotification.content.includes('1. 🔥');
                const hasHabitItems = updatedNotification.content.includes('1. ✅') || updatedNotification.content.includes('1. ⭕️');
                
                console.log('\n🔍 === ANALYSE D\'ENRICHISSEMENT ===');
                console.log(`- Section tâches: ${hasTaskSection ? '✅' : '❌'}`);
                console.log(`- Section habitudes: ${hasHabitSection ? '✅' : '❌'}`);
                console.log(`- Tâches listées: ${hasTaskItems ? '✅' : '❌'}`);
                console.log(`- Habitudes listées: ${hasHabitItems ? '✅' : '❌'}`);
                
                const isEnriched = hasTaskSection && hasHabitSection && (hasTaskItems || hasHabitItems);
                console.log(`\n🎉 NOTIFICATION ENRICHIE: ${isEnriched ? '✅ OUI - PARFAIT !' : '❌ NON'}`);
                
                if (isEnriched) {
                    console.log('\n🎊 SUCCÈS COMPLET !');
                    console.log('✅ Le planificateur utilise maintenant le contenu enrichi !');
                    console.log('✅ Les futures notifications seront automatiquement enrichies !');
                    
                    if (updatedNotification.status === 'sent') {
                        console.log('✅ Notification envoyée avec succès sur WhatsApp !');
                    }
                } else {
                    console.log('\n⚠️ Le contenu n\'est pas enrichi. Problème à résoudre.');
                    
                    if (updatedNotification.content.includes('C\'est parti pour une nouvelle journée !') && updatedNotification.content.length < 100) {
                        console.log('🔍 DIAGNOSTIC: Le planificateur utilise encore l\'ancien code.');
                    }
                }
            } else {
                console.log('❌ Notification non trouvée après traitement');
            }
        } else {
            console.log('❌ Échec de la planification de la notification');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testSchedulerEnriched(); 