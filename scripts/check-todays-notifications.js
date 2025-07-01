import { PrismaClient } from '@prisma/client';

async function checkTodaysNotifications() {
    const prisma = new PrismaClient();
    
    try {
        console.log('📊 === VÉRIFICATION DES NOTIFICATIONS D\'AUJOURD\'HUI ===\n');
        
        // Définir le début et la fin de la journée
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        
        console.log(`📅 Période: ${startOfDay.toLocaleString()} à ${endOfDay.toLocaleString()}\n`);
        
        // Récupérer toutes les notifications d'aujourd'hui
        const todaysNotifications = await prisma.notificationHistory.findMany({
            where: {
                OR: [
                    {
                        scheduledFor: {
                            gte: startOfDay,
                            lte: endOfDay
                        }
                    },
                    {
                        sentAt: {
                            gte: startOfDay,
                            lte: endOfDay
                        }
                    }
                ]
            },
            orderBy: {
                scheduledFor: 'asc'
            }
        });
        
        console.log(`📋 Total des notifications d'aujourd'hui: ${todaysNotifications.length}\n`);
        
        if (todaysNotifications.length === 0) {
            console.log('❌ Aucune notification trouvée pour aujourd\'hui');
            return;
        }
        
        // Grouper par statut
        const sent = todaysNotifications.filter(n => n.status === 'sent');
        const pending = todaysNotifications.filter(n => n.status === 'pending');
        const failed = todaysNotifications.filter(n => n.status === 'failed');
        
        console.log('📊 Répartition par statut:');
        console.log(`✅ Envoyées: ${sent.length}`);
        console.log(`⏳ En attente: ${pending.length}`);
        console.log(`❌ Échouées: ${failed.length}\n`);
        
        // Afficher les notifications envoyées en premier
        if (sent.length > 0) {
            console.log('✅ === NOTIFICATIONS ENVOYÉES ===\n');
            sent.forEach((notif, index) => {
                console.log(`${index + 1}. ✅ ${notif.type}`);
                console.log(`   📅 Planifiée: ${notif.scheduledFor.toLocaleString()}`);
                console.log(`   📤 Envoyée: ${notif.sentAt.toLocaleString()}`);
                
                // Pour les notifications matinales, afficher le contenu complet
                if (notif.type === 'MORNING_REMINDER') {
                    console.log(`   📝 CONTENU COMPLET:`);
                    console.log('   ==========================================');
                    console.log(notif.content);
                    console.log('   ==========================================');
                    
                    // Analyser l'enrichissement
                    const hasTaskSection = notif.content.includes('🎯 Voici tes tâches prioritaires');
                    const hasHabitSection = notif.content.includes('💫 Tes habitudes pour aujourd\'hui');
                    const hasTaskItems = notif.content.includes('1. ⚡️') || notif.content.includes('1. 🔥');
                    const hasHabitItems = notif.content.includes('1. ✅') || notif.content.includes('1. ⭕️');
                    
                    console.log(`   🔍 ANALYSE D'ENRICHISSEMENT:`);
                    console.log(`   - Section tâches: ${hasTaskSection ? '✅' : '❌'}`);
                    console.log(`   - Section habitudes: ${hasHabitSection ? '✅' : '❌'}`);
                    console.log(`   - Tâches listées: ${hasTaskItems ? '✅' : '❌'}`);
                    console.log(`   - Habitudes listées: ${hasHabitItems ? '✅' : '❌'}`);
                    console.log(`   - Contenu enrichi: ${hasTaskSection && hasHabitSection && (hasTaskItems || hasHabitItems) ? '🎉 OUI' : '❌ NON'}`);
                }
                console.log('');
            });
        }
        
        // Afficher les notifications en attente
        if (pending.length > 0) {
            console.log('⏳ === NOTIFICATIONS EN ATTENTE ===\n');
            pending.forEach((notif, index) => {
                const now = new Date();
                const isOverdue = notif.scheduledFor < now;
                console.log(`${index + 1}. ${isOverdue ? '🔴' : '⏳'} ${notif.type}`);
                console.log(`   📅 Planifiée: ${notif.scheduledFor.toLocaleString()} ${isOverdue ? '(EN RETARD)' : ''}`);
                console.log('');
            });
        }
        
        // Afficher les notifications échouées
        if (failed.length > 0) {
            console.log('❌ === NOTIFICATIONS ÉCHOUÉES ===\n');
            failed.forEach((notif, index) => {
                console.log(`${index + 1}. ❌ ${notif.type}`);
                console.log(`   📅 Planifiée: ${notif.scheduledFor.toLocaleString()}`);
                console.log(`   📤 Tentative: ${notif.sentAt ? notif.sentAt.toLocaleString() : 'Non tentée'}`);
                console.log(`   ❌ Erreur: ${notif.error || 'Erreur inconnue'}`);
                console.log('');
            });
        }
        
        // Résumé sur les notifications matinales
        const morningNotifs = todaysNotifications.filter(n => n.type === 'MORNING_REMINDER');
        if (morningNotifs.length > 0) {
            console.log('🌅 === RÉSUMÉ DES NOTIFICATIONS MATINALES ===');
            console.log(`📊 Total: ${morningNotifs.length}`);
            console.log(`✅ Envoyées: ${morningNotifs.filter(n => n.status === 'sent').length}`);
            console.log(`⏳ En attente: ${morningNotifs.filter(n => n.status === 'pending').length}`);
            console.log(`❌ Échouées: ${morningNotifs.filter(n => n.status === 'failed').length}`);
            
            const enrichedMorning = morningNotifs.filter(n => 
                n.content.includes('🎯 Voici tes tâches prioritaires') && 
                n.content.includes('💫 Tes habitudes pour aujourd\'hui')
            );
            console.log(`✨ Enrichies: ${enrichedMorning.length}/${morningNotifs.length}`);
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTodaysNotifications(); 