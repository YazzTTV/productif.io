import { PrismaClient } from '@prisma/client';

    const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Configuration des notifications...');
    
    try {
        const userId = 'cma6li3j1000ca64sisjbjyfs'; // ID de l'utilisateur Noah

        const settings = await prisma.notificationSettings.update({
            where: {
                userId: userId
            },
            data: {
                isEnabled: true,
                emailEnabled: true,
                pushEnabled: true,
                whatsappEnabled: true,
                morningReminder: true,
                taskReminder: true,
                habitReminder: true,
                motivation: true,
                dailySummary: true,
                startHour: 8, // Début à 8h
                endHour: 22, // Fin à 22h
                reminderTime: "08:00", // Rappel matinal à 8h
                notificationTypes: [
                    'MORNING_REMINDER', // 8h
                    'MIDDAY_CHECK', // 12h
                    'AFTERNOON_REMINDER', // 14h
                    'EVENING_PLANNING', // 18h
                    'NIGHT_HABITS_CHECK', // 22h
                    'TASK_DUE',
                    'HABIT_REMINDER',
                    'DAILY_SUMMARY',
                    'OVERDUE_TASKS',
                    'INCOMPLETE_HABITS',
                    'DAILY_MOTIVATION'
                ],
                allowedDays: [1, 2, 3, 4, 5, 6, 7] // Tous les jours de la semaine
            }
        });

        console.log('✅ Notifications configurées avec succès !');
        console.log('📝 Paramètres mis à jour :', settings);
        console.log('\n⏰ Horaires des notifications :');
        console.log('- 08:00 : Rappel matinal');
        console.log('- 12:00 : Vérification de midi');
        console.log('- 14:00 : Rappel de l\'après-midi');
        console.log('- 18:00 : Planification du soir');
        console.log('- 22:00 : Vérification des habitudes de nuit');
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 