import { PrismaClient } from '@prisma/client';

async function checkRecentNotifications() {
    const prisma = new PrismaClient();
    
    try {
        console.log('📊 === VÉRIFICATION DES LOGS DE NOTIFICATIONS ===\n');
        
        // Récupérer les notifications des dernières 24h
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const recentNotifications = await prisma.notificationHistory.findMany({
            where: {
                scheduledFor: {
                    gte: yesterday
                }
            },
            orderBy: {
                scheduledFor: 'desc'
            },
            take: 20
        });
        
        console.log(`📋 Notifications trouvées dans les dernières 24h: ${recentNotifications.length}\n`);
        
        if (recentNotifications.length === 0) {
            console.log('❌ Aucune notification récente trouvée');
            return;
        }
        
        // Analyser les notifications par type
        const notificationsByType = {};
        recentNotifications.forEach(notif => {
            if (!notificationsByType[notif.type]) {
                notificationsByType[notif.type] = [];
            }
            notificationsByType[notif.type].push(notif);
        });
        
        console.log('📊 Répartition par type:');
        Object.keys(notificationsByType).forEach(type => {
            console.log(`- ${type}: ${notificationsByType[type].length} notifications`);
        });
        
        console.log('\n🔍 Détail des notifications récentes:\n');
        
        recentNotifications.forEach((notif, index) => {
            const statusIcon = notif.status === 'sent' ? '✅' : 
                              notif.status === 'pending' ? '⏳' : 
                              notif.status === 'failed' ? '❌' : '🔄';
            
            console.log(`${index + 1}. ${statusIcon} ${notif.type}`);
            console.log(`   📅 Planifiée: ${notif.scheduledFor.toLocaleString()}`);
            console.log(`   📤 Envoyée: ${notif.sentAt ? notif.sentAt.toLocaleString() : 'Non envoyée'}`);
            console.log(`   🔄 Status: ${notif.status}`);
            
            if (notif.error) {
                console.log(`   ❌ Erreur: ${notif.error}`);
            }
            
            // Afficher le contenu pour les notifications du matin (pour voir si c'est enrichi)
            if (notif.type === 'MORNING_REMINDER') {
                console.log(`   📝 Contenu (${notif.content.length} caractères):`);
                console.log('   ---');
                console.log(notif.content.substring(0, 500) + (notif.content.length > 500 ? '...' : ''));
                console.log('   ---');
                
                // Vérifier si le contenu est enrichi
                const hasTaskSection = notif.content.includes('🎯 Voici tes tâches prioritaires');
                const hasHabitSection = notif.content.includes('💫 Tes habitudes pour aujourd\'hui');
                
                console.log(`   ✅ Contenu enrichi: ${hasTaskSection && hasHabitSection ? 'OUI' : 'NON'}`);
                if (hasTaskSection) console.log('   ✅ Section tâches présente');
                if (hasHabitSection) console.log('   ✅ Section habitudes présente');
            }
            
            console.log('');
        });
        
        // Statistiques globales
        const sentCount = recentNotifications.filter(n => n.status === 'sent').length;
        const pendingCount = recentNotifications.filter(n => n.status === 'pending').length;
        const failedCount = recentNotifications.filter(n => n.status === 'failed').length;
        
        console.log('📊 Statistiques globales:');
        console.log(`✅ Envoyées: ${sentCount}`);
        console.log(`⏳ En attente: ${pendingCount}`);
        console.log(`❌ Échouées: ${failedCount}`);
        
        // Vérifier les notifications enrichies
        const morningNotifications = recentNotifications.filter(n => n.type === 'MORNING_REMINDER');
        const enrichedCount = morningNotifications.filter(n => 
            n.content.includes('🎯 Voici tes tâches prioritaires') && 
            n.content.includes('💫 Tes habitudes pour aujourd\'hui')
        ).length;
        
        if (morningNotifications.length > 0) {
            console.log(`\n🌅 Notifications matinales: ${morningNotifications.length}`);
            console.log(`✨ Notifications enrichies: ${enrichedCount}/${morningNotifications.length}`);
            
            if (enrichedCount === morningNotifications.length) {
                console.log('🎉 TOUTES les notifications matinales sont enrichies !');
            } else if (enrichedCount > 0) {
                console.log('⚠️ Certaines notifications ne sont pas enrichies');
            } else {
                console.log('❌ Aucune notification enrichie trouvée');
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRecentNotifications(); 