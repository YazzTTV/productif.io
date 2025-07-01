import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTodayEntries() {
    console.log('🔍 Vérification des entrées d\'aujourd\'hui');
    console.log('=' * 40);
    
    const now = new Date();
    console.log(`📅 Date/heure actuelle: ${now.toLocaleString('fr-FR')}`);
    console.log(`📅 UTC actuelle: ${now.toISOString()}`);
    console.log('');

    try {
        // Trouver l'utilisateur de test
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

        console.log(`🎯 Recherche des entrées entre:`);
        console.log(`   Début: ${todayStart.toISOString()}`);
        console.log(`   Fin: ${todayEnd.toISOString()}`);
        console.log('');

        // Chercher les entrées d'habitudes créées aujourd'hui
        const todayEntries = await prisma.habitEntry.findMany({
            where: {
                habit: {
                    userId: user.id
                },
                date: {
                    gte: todayStart,
                    lte: todayEnd
                }
            },
            include: {
                habit: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`📊 Entrées trouvées pour aujourd'hui: ${todayEntries.length}`);
        console.log('');

        if (todayEntries.length > 0) {
            todayEntries.forEach((entry, index) => {
                console.log(`${index + 1}. 🎯 Habitude: "${entry.habit.name}"`);
                console.log(`   📅 Date: ${entry.date.toLocaleDateString('fr-FR')}`);
                console.log(`   📅 Date UTC: ${entry.date.toISOString()}`);
                console.log(`   ✅ Complétée: ${entry.completed}`);
                
                if (entry.note) {
                    console.log(`   📝 Note: "${entry.note}"`);
                }
                
                if (entry.rating !== null) {
                    console.log(`   ⭐ Rating: ${entry.rating}/10`);
                }
                
                console.log(`   🕐 Créée: ${entry.createdAt.toLocaleString('fr-FR')}`);
                console.log('');
            });

            // Vérifier si la dernière entrée contient notre test
            const testEntry = todayEntries.find(entry => 
                entry.note && entry.note.includes('Test correction timezone')
            );

            if (testEntry) {
                console.log('✅ SUCCESS! L\'entrée de test a bien été enregistrée pour aujourd\'hui !');
                console.log(`📅 Date enregistrée: ${testEntry.date.toLocaleDateString('fr-FR')}`);
                console.log(`🎯 Habitude: ${testEntry.habit.name}`);
                console.log(`📝 Contenu: "${testEntry.note}"`);
            } else {
                console.log('⚠️  L\'entrée de test n\'a pas été trouvée dans les entrées d\'aujourd\'hui');
            }
        } else {
            console.log('ℹ️ Aucune entrée trouvée pour aujourd\'hui');
            
            // Chercher les entrées d'hier pour comparaison
            const yesterdayStart = new Date(Date.UTC(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - 1,
                0, 0, 0, 0
            ));
            
            const yesterdayEnd = new Date(Date.UTC(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - 1,
                23, 59, 59, 999
            ));

            const yesterdayEntries = await prisma.habitEntry.findMany({
                where: {
                    habit: {
                        userId: user.id
                    },
                    date: {
                        gte: yesterdayStart,
                        lte: yesterdayEnd
                    }
                },
                include: {
                    habit: true
                }
            });

            console.log(`📊 Entrées d'hier trouvées: ${yesterdayEntries.length}`);
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTodayEntries(); 