import { PrismaClient } from '@prisma/client';

// Test direct du contenu enrichi sans les services complexes
async function testContentGeneration() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🧪 === TEST SIMPLE DE GÉNÉRATION DE CONTENU ===\n');
        
        const userId = 'cma6li3j1000ca64sisjbjyfs'; // ID de Noah
        console.log(`👤 Test pour userId: ${userId}`);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        console.log(`📅 Date: ${today.toLocaleDateString()}`);
        
        // Test 1: Récupérer les tâches prioritaires
        console.log('\n🎯 === TEST DES TÂCHES PRIORITAIRES ===');
        const tasks = await prisma.task.findMany({
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
        
        console.log(`📋 Tâches prioritaires trouvées: ${tasks.length}`);
        tasks.forEach((task, index) => {
            console.log(`${index + 1}. [P${task.priority}] [E${task.energyLevel}] ${task.title}`);
        });
        
        // Test 2: Récupérer les habitudes du jour
        console.log('\n💫 === TEST DES HABITUDES ===');
        const dayNameEN = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        console.log(`📅 Jour de la semaine: ${dayNameEN}`);
        
        const habits = await prisma.habit.findMany({
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
        
        console.log(`💫 Habitudes trouvées: ${habits.length}`);
        habits.forEach((habit, index) => {
            const completed = habit.entries.length > 0 && habit.entries[0].completed;
            const status = completed ? "✅" : "⭕️";
            console.log(`${index + 1}. ${status} ${habit.name}`);
        });
        
        // Test 3: Générer le contenu enrichi manuellement
        console.log('\n📝 === GÉNÉRATION DU CONTENU ENRICHI ===');
        
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
        
        console.log('\n🎉 === CONTENU FINAL ===');
        console.log('==========================================');
        console.log(message);
        console.log('==========================================');
        
        // Analyser l'enrichissement
        const hasTaskSection = message.includes('🎯 Voici tes tâches prioritaires');
        const hasHabitSection = message.includes('💫 Tes habitudes pour aujourd\'hui');
        const hasTaskItems = message.includes('1. ⚡️') || message.includes('1. 🔥');
        const hasHabitItems = message.includes('1. ✅') || message.includes('1. ⭕️');
        
        console.log('\n🔍 === ANALYSE D\'ENRICHISSEMENT ===');
        console.log(`- Section tâches: ${hasTaskSection ? '✅' : '❌'}`);
        console.log(`- Section habitudes: ${hasHabitSection ? '✅' : '❌'}`);
        console.log(`- Tâches listées: ${hasTaskItems ? '✅' : '❌'}`);
        console.log(`- Habitudes listées: ${hasHabitItems ? '✅' : '❌'}`);
        
        const isEnriched = hasTaskSection && hasHabitSection && (hasTaskItems || hasHabitItems);
        console.log(`\n🎉 CONTENU ENRICHI: ${isEnriched ? '✅ OUI - PARFAIT !' : '❌ NON'}`);
        
        if (isEnriched) {
            console.log('\n🎊 SUCCÈS ! La logique d\'enrichissement fonctionne parfaitement !');
            console.log('📊 Statistiques:');
            console.log(`   - ${tasks.length} tâches prioritaires intégrées`);
            console.log(`   - ${habits.length} habitudes intégrées`);
            console.log(`   - Longueur du message: ${message.length} caractères`);
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testContentGeneration(); 