import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

let lastNotificationCount = 0;

async function monitorNotifications() {
    try {
        // Compter les notifications des 10 dernières minutes
        const recentNotifications = await prisma.notificationHistory.findMany({
            where: {
                userId: 'cma6li3j1000ca64sisjbjyfs',
                scheduledFor: {
                    gte: new Date(Date.now() - 10 * 60 * 1000)
                }
            },
            orderBy: {
                scheduledFor: 'desc'
            }
        });

        if (recentNotifications.length !== lastNotificationCount) {
            console.log(`\n🔔 ${new Date().toISOString()}`);
            console.log(`📊 ${recentNotifications.length} notifications récentes détectées:`);
            
            recentNotifications.forEach((notif, index) => {
                console.log(`   ${index + 1}. Type: ${notif.type}`);
                console.log(`      Status: ${notif.status}`);
                console.log(`      Planifiée: ${notif.scheduledFor.toISOString()}`);
                console.log(`      Envoyée: ${notif.sentAt?.toISOString() || 'Non envoyée'}`);
            });
            
            lastNotificationCount = recentNotifications.length;
        }
        
    } catch (error) {
        console.error('❌ Erreur monitoring:', error);
    }
}

console.log('🔍 MONITORING DES NOTIFICATIONS EN TEMPS RÉEL');
console.log('=' .repeat(60));
console.log('👀 Surveillance active... (Ctrl+C pour arrêter)');
console.log('📱 Modifiez vos préférences maintenant !');
console.log('');

// Surveiller toutes les 2 secondes
const interval = setInterval(monitorNotifications, 2000);

// Arrêter proprement
process.on('SIGINT', async () => {
    console.log('\n🛑 Arrêt du monitoring...');
    clearInterval(interval);
    await prisma.$disconnect();
    process.exit(0);
}); 