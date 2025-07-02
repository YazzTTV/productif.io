import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

async function testSingleNotification() {
    try {
        console.log('🧪 TEST DE NOTIFICATION UNIQUE');
        console.log('=' .repeat(50));

        const userId = 'cma6li3j1000ca64sisjbjyfs';
        const testTime = new Date();
        testTime.setMinutes(testTime.getMinutes() + 1); // Dans 1 minute

        console.log(`📅 Heure de test: ${testTime.toISOString()}`);
        console.log('⏰ Comptage initial des notifications...\n');

        // Compter les notifications existantes
        const initialCount = await prisma.notificationHistory.count({
            where: {
                userId,
                scheduledFor: {
                    gte: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes dans le passé
                }
            }
        });

        console.log(`📊 Notifications existantes: ${initialCount}`);
        
        // Attendre et surveiller
        console.log('\n👀 Surveillance des nouvelles notifications...');
        console.log('(Le planificateur va créer une notification à la prochaine heure programmée)');
        
        let lastCount = initialCount;
        let checkCount = 0;
        const maxChecks = 30; // 30 vérifications = 1 minute

        const interval = setInterval(async () => {
            checkCount++;
            
            const currentCount = await prisma.notificationHistory.count({
                where: {
                    userId,
                    scheduledFor: {
                        gte: new Date(Date.now() - 2 * 60 * 1000)
                    }
                }
            });

            if (currentCount > lastCount) {
                console.log(`\n🔔 NOUVELLE NOTIFICATION DÉTECTÉE ! (${currentCount - lastCount} ajoutée(s))`);
                
                // Récupérer les détails des nouvelles notifications
                const newNotifications = await prisma.notificationHistory.findMany({
                    where: {
                        userId,
                        scheduledFor: {
                            gte: new Date(Date.now() - 2 * 60 * 1000)
                        }
                    },
                    orderBy: {
                        scheduledFor: 'desc'
                    },
                    take: currentCount - lastCount
                });

                newNotifications.forEach((notif, index) => {
                    console.log(`   ${index + 1}. ID: ${notif.id}`);
                    console.log(`      Type: ${notif.type}`);
                    console.log(`      Status: ${notif.status}`);
                    console.log(`      Planifiée: ${notif.scheduledFor.toISOString()}`);
                    console.log(`      Envoyée: ${notif.sentAt?.toISOString() || 'Non envoyée'}`);
                });

                if (currentCount - lastCount === 1) {
                    console.log('\n✅ SUCCÈS : Une seule notification créée !');
                } else {
                    console.log(`\n❌ PROBLÈME : ${currentCount - lastCount} notifications créées !`);
                }

                clearInterval(interval);
                await prisma.$disconnect();
                process.exit(0);
            }

            process.stdout.write(`.`);
            
            if (checkCount >= maxChecks) {
                console.log('\n⏰ Timeout atteint - aucune nouvelle notification détectée');
                clearInterval(interval);
                await prisma.$disconnect();
                process.exit(0);
            }
        }, 2000); // Vérifier toutes les 2 secondes

    } catch (error) {
        console.error('❌ Erreur:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

testSingleNotification(); 