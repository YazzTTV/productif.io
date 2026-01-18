import { PrismaClient } from '@prisma/client';

async function testNotificationContent() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔍 === DIAGNOSTIC DES NOTIFICATIONS ===\n');
        
        // 1. Récupérer l'utilisateur Noah
        console.log('👤 Recherche de l\'utilisateur...');
        const user = await prisma.user.findUnique({
            where: { email: 'noah.lugagne@free.fr' },
            include: {
                notificationSettings: true
            }
        });
        
        if (!user) {
            console.log('❌ Utilisateur non trouvé');
            return;
        }
        
        console.log('✅ Utilisateur trouvé:', user.email);
        console.log('📱 WhatsApp activé:', user.notificationSettings?.whatsappEnabled);
        console.log('📞 Numéro WhatsApp:', user.notificationSettings?.whatsappNumber);
        
        // 2. Tester la récupération des tâches
        console.log('\n🎯 === TEST DES TÂCHES ===');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        console.log('📅 Date du jour:', today);
        
        // Toutes les tâches de l'utilisateur
        const allTasks = await prisma.task.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });
        
        console.log(`📋 Total des tâches: ${allTasks.length}`);
        allTasks.forEach((task, index) => {
            console.log(`${index + 1}. ${task.title}`);
            console.log(`   - Complétée: ${task.completed}`);
            console.log(`   - Priorité: ${task.priority}`);
            console.log(`   - Énergie: ${task.energyLevel}`);
            console.log(`   - Due: ${task.dueDate}`);
            console.log(`   - Planifiée: ${task.scheduledFor}`);
        });
        
        // Tâches prioritaires (comme dans le code)
        const priorityTasks = await prisma.task.findMany({
            where: {
                userId: user.id,
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
        
        console.log(`\n🔥 Tâches prioritaires trouvées: ${priorityTasks.length}`);
        priorityTasks.forEach((task, index) => {
            console.log(`${index + 1}. ${task.title} (P${task.priority})`);
        });
        
        // 3. Tester la récupération des habitudes
        console.log('\n💫 === TEST DES HABITUDES ===');
        const dayName = today.toLocaleDateString('fr-FR', { weekday: 'long' });
        console.log('📅 Jour de la semaine:', dayName);
        
        const allHabits = await prisma.habit.findMany({
            where: { userId: user.id }
        });
        
        console.log(`📋 Total des habitudes: ${allHabits.length}`);
        allHabits.forEach((habit, index) => {
            console.log(`${index + 1}. ${habit.name}`);
            console.log(`   - Jours: ${habit.daysOfWeek.join(', ')}`);
            console.log(`   - Fréquence: ${habit.frequency}`);
        });
        
        // Habitudes du jour
        const todayHabits = await prisma.habit.findMany({
            where: {
                userId: user.id,
                daysOfWeek: {
                    has: dayName.toLowerCase()
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
        
        console.log(`\n🎯 Habitudes pour ${dayName}: ${todayHabits.length}`);
        todayHabits.forEach((habit, index) => {
            const completed = habit.entries.length > 0 && habit.entries[0].completed;
            console.log(`${index + 1}. ${habit.name} - ${completed ? '✅' : '⭕️'}`);
        });
        
        // 4. Simuler la construction du message
        console.log('\n📝 === SIMULATION DU MESSAGE ===');
        let message = "🌅 C'est parti pour une nouvelle journée !\n\n";
        
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
        
        if (todayHabits.length > 0) {
            message += "💫 Tes habitudes pour aujourd'hui :\n";
            todayHabits.forEach((habit, index) => {
                const completed = habit.entries.length > 0 && habit.entries[0].completed;
                const status = completed ? "✅" : "⭕️";
                message += `${index + 1}. ${status} ${habit.name}\n`;
            });
        }
        
        console.log('📤 Message final:');
        console.log('---');
        console.log(message);
        console.log('---');
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testNotificationContent(); 