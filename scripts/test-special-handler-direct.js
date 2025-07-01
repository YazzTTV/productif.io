import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSpecialHandlerDirect() {
    console.log('🔍 Test direct du SpecialHabitsHandler');
    console.log('=' * 50);
    
    const userId = 'cma6li3j1000ca64sisjbjyfs';  // Le vrai ID utilisateur
    const phoneNumber = '33783642205';
    
    try {
        // 1. Vérifier que l'utilisateur et ses habitudes existent
        console.log('\n1️⃣ Vérification des données utilisateur...');
        
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, whatsappNumber: true }
        });
        
        if (!user) {
            console.log('❌ Utilisateur non trouvé !');
            return;
        }
        console.log(`✅ Utilisateur: ${user.email}`);
        
        const habits = await prisma.habit.findMany({
            where: { userId },
            select: { id: true, name: true }
        });
        
        console.log(`📋 ${habits.length} habitudes trouvées`);
        
        const noteJourneeHabit = habits.find(h => 
            h.name.toLowerCase().includes('note') && 
            h.name.toLowerCase().includes('journée')
        );
        
        if (!noteJourneeHabit) {
            console.log('❌ Habitude "Note de sa journée" non trouvée !');
            return;
        }
        
        console.log(`✅ Habitude trouvée: "${noteJourneeHabit.name}" (${noteJourneeHabit.id})`);
        
        // 2. Tester la création directe d'une entrée d'habitude
        console.log('\n2️⃣ Test de création directe d\'entrée...');
        
        const today = new Date();
        const utcToday = new Date(Date.UTC(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            0, 0, 0, 0
        ));
        
        console.log(`📅 Date UTC: ${utcToday.toISOString()}`);
        
        // Supprimer l'entrée existante si elle existe
        const existingEntry = await prisma.habitEntry.findUnique({
            where: {
                habitId_date: {
                    habitId: noteJourneeHabit.id,
                    date: utcToday
                }
            }
        });
        
        if (existingEntry) {
            console.log('⚠️ Suppression de l\'entrée existante...');
            await prisma.habitEntry.delete({
                where: { id: existingEntry.id }
            });
        }
        
        // Créer l'entrée avec les données enrichies
        const newEntry = await prisma.habitEntry.create({
            data: {
                habitId: noteJourneeHabit.id,
                date: utcToday,
                completed: true,
                note: 'Note: 9/10\n\nRésumé: Test direct du handler',
                rating: 9
            }
        });
        
        console.log('✅ Entrée créée avec succès !');
        console.log(`   ID: ${newEntry.id}`);
        console.log(`   Date: ${newEntry.date.toISOString()}`);
        console.log(`   Note: ${newEntry.rating}/10`);
        console.log(`   Contenu: "${newEntry.note}"`);
        
        // 3. Vérifier que l'entrée est bien en base
        const verification = await prisma.habitEntry.findUnique({
            where: { id: newEntry.id },
            include: {
                habit: {
                    select: { name: true }
                }
            }
        });
        
        if (verification) {
            console.log('\n✅ SUCCÈS TOTAL !');
            console.log(`   L'entrée existe bien en base`);
            console.log(`   Habitude: ${verification.habit.name}`);
            console.log(`   Date: ${verification.date.toLocaleDateString('fr-FR')}`);
            console.log(`   Note: ${verification.rating}/10`);
            console.log(`   Contenu: "${verification.note}"`);
        }
        
    } catch (error) {
        console.error('\n❌ ERREUR DÉTECTÉE:');
        console.error('Type:', error.constructor.name);
        console.error('Message:', error.message);
        if (error.code) {
            console.error('Code Prisma:', error.code);
        }
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testSpecialHandlerDirect(); 