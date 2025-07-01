import { PrismaClient } from '@prisma/client';

// Simulation du NotificationContentBuilder corrigé
class TestNotificationContentBuilder {
    constructor() {
        this.prisma = new PrismaClient();
    }

    async buildMorningContent(userId) {
        try {
            console.log('🔍 Test du NotificationContentBuilder corrigé');
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Récupérer les tâches prioritaires (version corrigée)
            const tasks = await this.prisma.task.findMany({
                where: {
                    userId,
                    completed: false,
                    OR: [
                        { dueDate: { equals: today } },
                        { scheduledFor: { equals: today } }
                    ],
                    priority: {
                        not: null,
                        gte: 3
                    }
                },
                orderBy: [
                    { priority: 'desc' },
                    { dueDate: 'asc' }
                ],
                take: 5
            });

            // Récupérer les habitudes du jour (version corrigée)
            const dayNameEN = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const habits = await this.prisma.habit.findMany({
                where: {
                    userId,
                    daysOfWeek: {
                        has: dayNameEN
                    }
                },
                include: {
                    entries: {
                        where: {
                            date: today
                        }
                    }
                }
            });

            // Construire le message
            let message = "🌅 C'est parti pour une nouvelle journée !\n\n";

            if (tasks.length > 0) {
                message += "🎯 Voici tes tâches prioritaires pour le deep work :\n";
                tasks.forEach((task, index) => {
                    const priorityLabel = task.priority === 4 ? "⚡️" :
                                        task.priority === 3 ? "🔥" :
                                        task.priority === 2 ? "⭐️" :
                                        task.priority === 1 ? "📌" : "📝";
                    const energyLabel = task.energyLevel === 3 ? "🔋🔋🔋" :
                                      task.energyLevel === 2 ? "🔋🔋" : "🔋";
                    message += `${index + 1}. ${priorityLabel} ${energyLabel} ${task.title}\n`;
                });
                message += "\n";
            }

            if (habits.length > 0) {
                message += "💫 Tes habitudes pour aujourd'hui :\n";
                habits.forEach((habit, index) => {
                    const completed = habit.entries.length > 0 && habit.entries[0].completed;
                    const status = completed ? "✅" : "⭕️";
                    message += `${index + 1}. ${status} ${habit.name}\n`;
                });
            }

            return {
                message,
                stats: {
                    tasksFound: tasks.length,
                    habitsFound: habits.length,
                    dayName: dayNameEN
                }
            };
        } catch (error) {
            console.error('❌ Erreur:', error);
            throw error;
        }
    }
}

async function testFinalNotification() {
    const builder = new TestNotificationContentBuilder();
    
    try {
        console.log('🎯 === TEST FINAL DES NOTIFICATIONS CORRIGÉES ===\n');
        
        const userId = 'cma6li3j1000ca64sisjbjyfs'; // ID de Noah
        const result = await builder.buildMorningContent(userId);
        
        console.log('📊 Statistiques:');
        console.log(`- Tâches prioritaires trouvées: ${result.stats.tasksFound}`);
        console.log(`- Habitudes trouvées: ${result.stats.habitsFound}`);
        console.log(`- Jour de la semaine: ${result.stats.dayName}`);
        
        console.log('\n📤 Message final de notification:');
        console.log('==========================================');
        console.log(result.message);
        console.log('==========================================');
        
        // Vérifier que tout fonctionne
        if (result.stats.tasksFound > 0 && result.stats.habitsFound > 0) {
            console.log('\n✅ SUCCESS: Les notifications sont maintenant enrichies !');
            console.log('✅ Les tâches prioritaires sont affichées');
            console.log('✅ Les habitudes sont affichées');
            console.log('✅ Le message est complet et formaté');
        } else {
            console.log('\n⚠️ ATTENTION:');
            if (result.stats.tasksFound === 0) console.log('- Aucune tâche prioritaire trouvée');
            if (result.stats.habitsFound === 0) console.log('- Aucune habitude trouvée');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du test final:', error);
    } finally {
        await builder.prisma.$disconnect();
    }
}

testFinalNotification(); 