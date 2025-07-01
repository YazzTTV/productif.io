import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkNotifications() {
    try {
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));

        const notifications = await prisma.notificationHistory.findMany({
            where: {
                scheduledFor: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                user: true
            },
            orderBy: {
                scheduledFor: 'asc'
            }
        });

        console.log('\n📊 Notifications d\'aujourd\'hui :');
        for (const notification of notifications) {
            console.log(`\n🔔 Notification ${notification.id}`);
            console.log(`  - Type: ${notification.type}`);
            console.log(`  - Utilisateur: ${notification.user.email}`);
            console.log(`  - Statut: ${notification.status}`);
            console.log(`  - Planifiée pour: ${notification.scheduledFor}`);
            if (notification.sentAt) {
                console.log(`  - Envoyée à: ${notification.sentAt}`);
            }
            if (notification.error) {
                console.log(`  - Erreur: ${notification.error}`);
            }
        }
    } catch (error) {
        console.error('❌ Erreur lors de la vérification des notifications:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkNotifications(); 