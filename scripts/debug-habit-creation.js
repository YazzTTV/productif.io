import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugHabitCreation() {
    console.log('🔍 Debug de l\'enregistrement d\'habitudes');
    console.log('=' * 50);
    
    const userId = 'cm13efqvj0001y1kmnv7b4xqx';
    
    try {
        // 1. Vérifier si l'utilisateur existe
        console.log('\n1️⃣ Vérification de l\'utilisateur...');
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        
        if (!user) {
            console.log('❌ Utilisateur non trouvé !');
            return;
        }
        console.log(`✅ Utilisateur trouvé: ${user.email}`);
        
        // 2. Récupérer les habitudes de l'utilisateur
        console.log('\n2️⃣ Récupération des habitudes...');
        const habits = await prisma.habit.findMany({
            where: { userId },
            select: { id: true, name: true }
        });
        
        console.log(`📋 ${habits.length} habitudes trouvées:`);
        habits.forEach((habit, index) => {
            console.log(`   ${index + 1}. ${habit.name} (ID: ${habit.id})`);
        });
        
        // 3. Chercher l'habitude "Note de sa journée"
        const noteJourneeHabit = habits.find(h => 
            h.name.toLowerCase().includes('note') && 
            h.name.toLowerCase().includes('journée')
        );
        
        if (!noteJourneeHabit) {
            console.log('\n❌ Habitude "Note de sa journée" non trouvée !');
            return;
        }
        
        console.log(`\n✅ Habitude trouvée: "${noteJourneeHabit.name}" (ID: ${noteJourneeHabit.id})`);
        
        // 4. Tester la création d'une entrée
        console.log('\n3️⃣ Test de création d\'entrée...');
        
        const today = new Date();
        const utcTargetDate = new Date(Date.UTC(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            0, 0, 0, 0
        ));
        
        console.log(`📅 Date UTC: ${utcTargetDate.toISOString()}`);
        
        // Vérifier si une entrée existe déjà pour aujourd'hui
        const existingEntry = await prisma.habitEntry.findUnique({
            where: {
                habitId_date: {
                    habitId: noteJourneeHabit.id,
                    date: utcTargetDate
                }
            }
        });
        
        if (existingEntry) {
            console.log('⚠️ Une entrée existe déjà pour aujourd\'hui. Suppression...');
            await prisma.habitEntry.delete({
                where: { id: existingEntry.id }
            });
            console.log('✅ Entrée existante supprimée');
        }
        
        // Créer l'entrée de test
        const newEntry = await prisma.habitEntry.create({
            data: {
                habitId: noteJourneeHabit.id,
                date: utcTargetDate,
                completed: true,
                note: 'Test debug création',
                rating: 9
            }
        });
        
        console.log('✅ Entrée créée avec succès !');
        console.log(`   ID: ${newEntry.id}`);
        console.log(`   Date: ${newEntry.date.toISOString()}`);
        console.log(`   Note: ${newEntry.rating}/10`);
        console.log(`   Contenu: "${newEntry.note}"`);
        
        // 5. Vérifier que l'entrée est bien en base
        const verifyEntry = await prisma.habitEntry.findUnique({
            where: { id: newEntry.id },
            include: {
                habit: {
                    select: { name: true }
                }
            }
        });
        
        if (verifyEntry) {
            console.log('\n✅ Vérification réussie - l\'entrée est bien en base !');
            console.log(`   Habitude: ${verifyEntry.habit.name}`);
            console.log(`   Date: ${verifyEntry.date.toLocaleDateString('fr-FR')}`);
        }
        
    } catch (error) {
        console.error('\n❌ ERREUR DÉTECTÉE:');
        console.error('Type:', error.constructor.name);
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

debugHabitCreation(); 