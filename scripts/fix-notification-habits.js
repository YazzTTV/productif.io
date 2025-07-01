import { PrismaClient } from '@prisma/client';

async function fixHabitsQuery() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔧 === CORRECTION DU PROBLÈME DES HABITUDES ===\n');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Méthode actuelle (qui ne marche pas)
        const dayNameFR = today.toLocaleDateString('fr-FR', { weekday: 'long' });
        console.log('📅 Jour en français:', dayNameFR);
        
        // Méthode corrigée (qui marche)
        const dayNameEN = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        console.log('📅 Jour en anglais:', dayNameEN);
        
        const userId = 'cma6li3j1000ca64sisjbjyfs'; // ID de Noah
        
        // Test avec la méthode française (actuelle)
        const habitsFR = await prisma.habit.findMany({
            where: {
                userId,
                daysOfWeek: {
                    has: dayNameFR
                }
            }
        });
        
        console.log(`❌ Habitudes trouvées avec "${dayNameFR}": ${habitsFR.length}`);
        
        // Test avec la méthode anglaise (corrigée)
        const habitsEN = await prisma.habit.findMany({
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
        
        console.log(`✅ Habitudes trouvées avec "${dayNameEN}": ${habitsEN.length}`);
        
        if (habitsEN.length > 0) {
            console.log('\n💫 Habitudes du jour (corrigées):');
            habitsEN.forEach((habit, index) => {
                const completed = habit.entries.length > 0 && habit.entries[0].completed;
                console.log(`${index + 1}. ${habit.name} - ${completed ? '✅' : '⭕️'}`);
            });
            
            // Simulation du message corrigé
            console.log('\n📝 === MESSAGE CORRIGÉ ===');
            let message = "🌅 C'est parti pour une nouvelle journée !\n\n";
            
            // Récupérer aussi les tâches prioritaires
            const priorityTasks = await prisma.task.findMany({
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
            
            if (priorityTasks.length > 0) {
                message += "🎯 Voici tes tâches prioritaires pour le deep work :\n";
                priorityTasks.forEach((task, index) => {
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
            
            message += "💫 Tes habitudes pour aujourd'hui :\n";
            habitsEN.forEach((habit, index) => {
                const completed = habit.entries.length > 0 && habit.entries[0].completed;
                const status = completed ? "✅" : "⭕️";
                message += `${index + 1}. ${status} ${habit.name}\n`;
            });
            
            console.log('---');
            console.log(message);
            console.log('---');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixHabitsQuery(); 