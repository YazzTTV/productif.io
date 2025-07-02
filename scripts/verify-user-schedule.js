import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyUserSchedule(email = 'noah.lugagne@free.fr') {
    try {
        console.log(`🔍 Vérification du planning pour: ${email}`);
        console.log('================================================\n');

        // Récupérer l'utilisateur et ses préférences
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                notificationSettings: true,
                notificationHistory: {
                    where: {
                        scheduledFor: {
                            gte: new Date(), // Notifications futures
                        }
                    },
                    orderBy: {
                        scheduledFor: 'asc'
                    },
                    take: 10 // Prochaines 10 notifications
                }
            }
        });

        if (!user) {
            console.log('❌ Utilisateur non trouvé');
            return;
        }

        console.log(`✅ Utilisateur: ${user.email}`);
        
        if (!user.notificationSettings) {
            console.log('❌ Aucune préférence de notification configurée');
            return;
        }

        const settings = user.notificationSettings;
        console.log('\n📋 Préférences actuelles:');
        console.log(`   🔔 Notifications activées: ${settings.isEnabled ? '✅' : '❌'}`);
        console.log(`   🌅 Horaire matin: ${settings.morningTime}`);
        console.log(`   🌞 Horaire midi: ${settings.noonTime}`);
        console.log(`   🌇 Horaire après-midi: ${settings.afternoonTime}`);
        console.log(`   🌆 Horaire soir: ${settings.eveningTime}`);
        console.log(`   🌃 Horaire nuit: ${settings.nightTime}`);
        
        console.log('\n🎯 Types de rappels activés:');
        console.log(`   ☀️ Rappel matinal: ${settings.morningReminder ? '✅' : '❌'}`);
        console.log(`   📋 Rappel tâches: ${settings.taskReminder ? '✅' : '❌'}`);
        console.log(`   🎯 Rappel habitudes: ${settings.habitReminder ? '✅' : '❌'}`);
        console.log(`   💪 Messages motivation: ${settings.motivation ? '✅' : '❌'}`);
        console.log(`   📊 Résumé quotidien: ${settings.dailySummary ? '✅' : '❌'}`);

        // Calculer les prochaines notifications basées sur les préférences
        console.log('\n⏰ Planification théorique (basée sur les préférences):');
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        const scheduleItems = [];
        
        if (settings.morningReminder) {
            const [h, m] = settings.morningTime.split(':').map(Number);
            const morningTime = new Date(today);
            morningTime.setHours(h, m, 0, 0);
            if (morningTime < now) morningTime.setDate(morningTime.getDate() + 1);
            scheduleItems.push({ time: morningTime, type: 'Rappel matinal' });
        }
        
        if (settings.taskReminder) {
            const [h, m] = settings.noonTime.split(':').map(Number);
            const noonTime = new Date(today);
            noonTime.setHours(h, m, 0, 0);
            if (noonTime < now) noonTime.setDate(noonTime.getDate() + 1);
            scheduleItems.push({ time: noonTime, type: 'Rappel tâches' });
        }

        if (settings.habitReminder) {
            const [h, m] = settings.afternoonTime.split(':').map(Number);
            const afternoonTime = new Date(today);
            afternoonTime.setHours(h, m, 0, 0);
            if (afternoonTime < now) afternoonTime.setDate(afternoonTime.getDate() + 1);
            scheduleItems.push({ time: afternoonTime, type: 'Rappel habitudes' });
        }

        if (settings.motivation) {
            const [h, m] = settings.eveningTime.split(':').map(Number);
            const eveningTime = new Date(today);
            eveningTime.setHours(h, m, 0, 0);
            if (eveningTime < now) eveningTime.setDate(eveningTime.getDate() + 1);
            scheduleItems.push({ time: eveningTime, type: 'Message motivation' });
        }

        if (settings.dailySummary) {
            const [h, m] = settings.nightTime.split(':').map(Number);
            const nightTime = new Date(today);
            nightTime.setHours(h, m, 0, 0);
            if (nightTime < now) nightTime.setDate(nightTime.getDate() + 1);
            scheduleItems.push({ time: nightTime, type: 'Résumé quotidien' });
        }

        scheduleItems.sort((a, b) => a.time - b.time);
        
        scheduleItems.forEach(item => {
            const timeStr = item.time.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const dateStr = item.time.toLocaleDateString('fr-FR');
            const isToday = item.time.toDateString() === now.toDateString();
            console.log(`   ${isToday ? '🔥' : '📅'} ${timeStr} (${isToday ? 'aujourd\'hui' : dateStr}) - ${item.type}`);
        });

        // Afficher les notifications réellement programmées
        console.log('\n📅 Notifications programmées en base:');
        if (user.notificationHistory.length === 0) {
            console.log('   ❌ Aucune notification programmée');
            console.log('   💡 Le planificateur n\'est peut-être pas démarré ou');
            console.log('      les tâches n\'ont pas encore été créées');
        } else {
            user.notificationHistory.forEach(notif => {
                const timeStr = notif.scheduledFor.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const dateStr = notif.scheduledFor.toLocaleDateString('fr-FR');
                const status = notif.status === 'pending' ? '⏳' : 
                             notif.status === 'sent' ? '✅' : '❌';
                console.log(`   ${status} ${timeStr} (${dateStr}) - ${notif.type}`);
            });
        }

        console.log('\n🎯 Prochaine action:');
        console.log('   1. Modifie tes préférences sur /dashboard/settings/notifications');
        console.log('   2. Lance ce script à nouveau pour voir les changements');
        console.log('   3. Vérifie que les horaires correspondent !');

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Utiliser l'email passé en argument ou celui par défaut
const email = process.argv[2] || 'noah.lugagne@free.fr';
verifyUserSchedule(email); 