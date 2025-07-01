import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyNoteJournee() {
    console.log('🔍 Vérification de l\'entrée "Note de sa journée"');
    console.log('=' * 50);
    
    const now = new Date();
    console.log(`📅 Date/heure actuelle: ${now.toLocaleString('fr-FR')}`);
    console.log('');

    try {
        // Trouver l'utilisateur
        const user = await prisma.user.findUnique({
            where: { whatsappNumber: '33783642205' }
        });

        if (!user) {
            console.log('❌ Utilisateur non trouvé');
            return;
        }

        // Créer les dates pour aujourd'hui en UTC
        const todayStart = new Date(Date.UTC(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            0, 0, 0, 0
        ));
        
        const todayEnd = new Date(Date.UTC(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            23, 59, 59, 999
        ));

        // Chercher l'habitude "Note de sa journée"
        const noteHabit = await prisma.habit.findFirst({
            where: {
                userId: user.id,
                name: {
                    contains: 'note de sa journée',
                    mode: 'insensitive'
                }
            }
        });

        if (!noteHabit) {
            console.log('❌ Habitude "Note de sa journée" non trouvée');
            return;
        }

        console.log(`🎯 Habitude trouvée: "${noteHabit.name}"`);
        console.log(`   ID: ${noteHabit.id}`);
        console.log('');

        // Chercher les entrées d'aujourd'hui pour cette habitude
        const todayEntries = await prisma.habitEntry.findMany({
            where: {
                habitId: noteHabit.id,
                date: {
                    gte: todayStart,
                    lte: todayEnd
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`📊 Entrées d'aujourd'hui: ${todayEntries.length}`);
        console.log('');

        if (todayEntries.length === 0) {
            console.log('❌ Aucune entrée trouvée pour aujourd\'hui');
            return;
        }

        // Analyser la dernière entrée (plus récente)
        const latestEntry = todayEntries[0];
        
        console.log('📋 DERNIÈRE ENTRÉE ANALYSÉE:');
        console.log(`   📅 Date: ${latestEntry.date.toLocaleDateString('fr-FR')}`);
        console.log(`   📅 Date UTC: ${latestEntry.date.toISOString()}`);
        console.log(`   ✅ Complétée: ${latestEntry.completed}`);
        console.log(`   🕐 Créée le: ${latestEntry.createdAt.toLocaleString('fr-FR')}`);
        console.log('');

        // Vérifier la note (rating)
        if (latestEntry.rating !== null) {
            console.log(`   ⭐ Note: ${latestEntry.rating}/10`);
            if (latestEntry.rating === 7) {
                console.log('   ✅ Note correcte (7/10 comme testé)');
            } else {
                console.log(`   ⚠️  Note inattendue (attendu: 7, reçu: ${latestEntry.rating})`);
            }
        } else {
            console.log('   ❌ Aucune note trouvée');
        }

        // Vérifier le résumé (note field)
        if (latestEntry.note) {
            console.log(`   📝 Contenu note: "${latestEntry.note}"`);
            
            if (latestEntry.note.includes('test timezone')) {
                console.log('   ✅ Résumé correct (contient "test timezone")');
            } else {
                console.log('   ⚠️  Résumé ne contient pas le texte attendu');
            }
            
            if (latestEntry.note.includes('Note: 7/10')) {
                console.log('   ✅ Format note inclus dans le contenu');
            }
        } else {
            console.log('   ❌ Aucun résumé trouvé');
        }

        console.log('');

        // Validation finale
        const isValidEntry = 
            latestEntry.completed === true &&
            latestEntry.rating === 7 &&
            latestEntry.note !== null &&
            latestEntry.note.includes('test timezone') &&
            latestEntry.date.toLocaleDateString('fr-FR') === now.toLocaleDateString('fr-FR');

        if (isValidEntry) {
            console.log('🎉 SUCCESS ! L\'entrée "Note de sa journée" est parfaite !');
            console.log('✅ Toutes les validations passées:');
            console.log('   - Date: aujourd\'hui ✅');
            console.log('   - Complétée: true ✅');
            console.log('   - Note: 7/10 ✅');
            console.log('   - Résumé: présent et correct ✅');
            console.log('   - Timezone: corrigée ✅');
        } else {
            console.log('⚠️  L\'entrée présente quelques anomalies (voir détails ci-dessus)');
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyNoteJournee(); 