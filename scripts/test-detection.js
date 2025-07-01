import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDetection() {
    console.log('🔍 Test de détection des habitudes spéciales');
    console.log('=' * 50);
    
    try {
        // Trouver l'utilisateur
        const user = await prisma.user.findUnique({
            where: { whatsappNumber: '33783642205' }
        });

        if (!user) {
            console.log('❌ Utilisateur non trouvé');
            return;
        }

        // Chercher toutes les habitudes de l'utilisateur
        const habits = await prisma.habit.findMany({
            where: { userId: user.id },
            select: { id: true, name: true }
        });

        console.log(`📋 Habitudes trouvées: ${habits.length}`);
        console.log('');

        habits.forEach((habit, index) => {
            console.log(`${index + 1}. "${habit.name}" (ID: ${habit.id})`);
            
            // Tester la détection
            const lowerName = habit.name.toLowerCase();
            
            const isApprentissage = lowerName.includes('apprentissage');
            const isNote = lowerName.includes('note de sa journée');
            
            if (isApprentissage) {
                console.log('   🎯 → APPRENTISSAGE détectée !');
            }
            
            if (isNote) {
                console.log('   🎯 → NOTE DE SA JOURNÉE détectée !');
            }
            
            if (!isApprentissage && !isNote) {
                console.log('   ⚪ → Habitude normale');
            }
            console.log('');
        });

        // Test spécifique avec le message exact utilisé
        console.log('🧪 TEST AVEC LE MESSAGE EXACT:');
        console.log('Message: "j\'ai fait l\'habitude note de sa journée"');
        
        const noteHabit = habits.find(h => 
            h.name.toLowerCase().includes('note de sa journée')
        );
        
        if (noteHabit) {
            console.log(`✅ Habitude trouvée: "${noteHabit.name}"`);
            console.log('   La détection devrait fonctionner...');
        } else {
            console.log('❌ Aucune habitude "note de sa journée" trouvée');
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testDetection(); 