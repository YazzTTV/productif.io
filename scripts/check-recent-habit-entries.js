import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecentEntries() {
    console.log('📊 Vérification des entrées récentes d\'habitudes');
    console.log('=' * 50);
    
    try {
        // Chercher toutes les entrées récentes (dernières 24h)
        const since = new Date();
        since.setHours(since.getHours() - 24);
        
        const entries = await prisma.habitEntry.findMany({
            where: {
                habit: {
                    userId: 'cm13efqvj0001y1kmnv7b4xqx'
                },
                createdAt: {
                    gte: since
                }
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
        
        console.log(`🔍 Nombre d'entrées créées dans les dernières 24h: ${entries.length}`);
        
        entries.forEach((entry, index) => {
            console.log(`\n${index + 1}. 📝 ${entry.habit.name}`);
            console.log(`   🆔 ID: ${entry.id}`);
            console.log(`   📅 Date d'habitude: ${entry.date.toISOString().split('T')[0]}`);
            console.log(`   ✅ Terminée: ${entry.completed}`);
            console.log(`   ⭐ Note: ${entry.rating || 'Aucune'}`);
            console.log(`   📄 Note: ${entry.note || 'Aucune'}`);
            console.log(`   🕐 Créée: ${entry.createdAt.toLocaleString('fr-FR')}`);
        });
        
        // Analyser spécifiquement les entrées avec du contenu enrichi
        const enrichedEntries = entries.filter(e => e.note || e.rating);
        
        if (enrichedEntries.length > 0) {
            console.log(`\n🎯 ENTRÉES ENRICHIES TROUVÉES (${enrichedEntries.length}):`);
            enrichedEntries.forEach((entry, index) => {
                console.log(`\n${index + 1}. 📝 ${entry.habit.name}`);
                console.log(`   📅 Date: ${entry.date.toISOString().split('T')[0]}`);
                console.log(`   ⭐ Note: ${entry.rating}/10`);
                console.log(`   📝 Contenu: "${entry.note}"`);
                console.log(`   🕐 Créée: ${entry.createdAt.toLocaleString('fr-FR')}`);
                
                if (entry.note === 'Test hier avec succès' && entry.rating === 8) {
                    console.log(`   ✅ TROUVÉ ! C'est l'entrée de notre test "hier"`);
                }
            });
        } else {
            console.log('\n❌ Aucune entrée enrichie trouvée');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRecentEntries(); 