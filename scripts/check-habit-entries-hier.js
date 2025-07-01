import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkHierEntries() {
    console.log('📊 Vérification des entrées pour HIER (29/06/2025)');
    console.log('=' * 50);
    
    // Date d'hier en UTC
    const hier = new Date();
    hier.setUTCDate(hier.getUTCDate() - 1);
    hier.setUTCHours(0, 0, 0, 0);
    
    console.log(`📅 Date recherchée: ${hier.toISOString().split('T')[0]}`);
    console.log(`🌍 UTC: ${hier.toISOString()}`);
    
    try {
        // Chercher les entrées d'habitudes pour hier
        const entries = await prisma.habitEntry.findMany({
            where: {
                habit: {
                    userId: 'cm13efqvj0001y1kmnv7b4xqx'
                },
                date: hier
            },
            include: {
                habit: {
                    select: {
                        name: true,
                        id: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        console.log(`\n🔍 Nombre d'entrées trouvées: ${entries.length}`);
        
        entries.forEach((entry, index) => {
            console.log(`\n${index + 1}. 📝 ${entry.habit.name}`);
            console.log(`   🆔 ID: ${entry.id}`);
            console.log(`   📅 Date: ${entry.date.toISOString().split('T')[0]}`);
            console.log(`   ✅ Terminée: ${entry.completed}`);
            console.log(`   ⭐ Note: ${entry.rating || 'Aucune'}`);
            console.log(`   📄 Note: ${entry.note || 'Aucune'}`);
            console.log(`   🕐 Créée: ${entry.createdAt.toLocaleString('fr-FR')}`);
        });
        
        // Chercher spécifiquement "Note de sa journée"
        const noteJourneeEntry = entries.find(e => 
            e.habit.name.toLowerCase().includes('note') && 
            e.habit.name.toLowerCase().includes('journée')
        );
        
        if (noteJourneeEntry) {
            console.log('\n🎯 ANALYSE DE "Note de sa journée" POUR HIER:');
            console.log(`   ⭐ Note: ${noteJourneeEntry.rating}/10`);
            console.log(`   📝 Résumé: "${noteJourneeEntry.note}"`);
            console.log(`   📅 Date: ${noteJourneeEntry.date.toISOString().split('T')[0]}`);
            
            if (noteJourneeEntry.rating === 8 && noteJourneeEntry.note === 'Test hier avec succès') {
                console.log('   ✅ SUCCÈS ! Les données correspondent exactement au test');
            } else {
                console.log('   ❌ Les données ne correspondent pas au test attendu');
            }
        } else {
            console.log('\n❌ Aucune entrée "Note de sa journée" trouvée pour hier');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkHierEntries(); 