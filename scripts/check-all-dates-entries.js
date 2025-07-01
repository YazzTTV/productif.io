import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllDatesEntries() {
    console.log('📊 Vérification de toutes les entrées avec dates');
    console.log('=' * 50);
    
    const userId = 'cma6li3j1000ca64sisjbjyfs';
    
    try {
        // Calculer les dates de test
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const dayBeforeYesterday = new Date(today);
        dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
        const specificDate = new Date(2025, 5, 28); // 28/06/2025
        
        const dates = [
            { name: 'Aujourd\'hui', date: today },
            { name: 'Hier', date: yesterday },
            { name: 'Avant-hier', date: dayBeforeYesterday },
            { name: '28/06/2025', date: specificDate }
        ];
        
        console.log('\n📅 Dates à vérifier:');
        dates.forEach(d => {
            const utc = new Date(Date.UTC(d.date.getFullYear(), d.date.getMonth(), d.date.getDate()));
            console.log(`   ${d.name}: ${utc.toISOString().split('T')[0]} (UTC: ${utc.toISOString()})`);
        });
        
        // Chercher toutes les entrées récentes
        const since = new Date();
        since.setHours(since.getHours() - 2); // Dernières 2 heures
        
        const entries = await prisma.habitEntry.findMany({
            where: {
                habit: {
                    userId: userId
                },
                createdAt: {
                    gte: since
                }
            },
            include: {
                habit: {
                    select: { name: true }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });
        
        console.log(`\n🔍 ${entries.length} entrées trouvées dans les dernières 2h:`);
        
        if (entries.length === 0) {
            console.log('❌ Aucune entrée trouvée !');
            return;
        }
        
        // Grouper par date
        const entriesByDate = {};
        
        entries.forEach(entry => {
            const dateKey = entry.date.toISOString().split('T')[0];
            if (!entriesByDate[dateKey]) {
                entriesByDate[dateKey] = [];
            }
            entriesByDate[dateKey].push(entry);
        });
        
        console.log('\n📋 ENTRÉES PAR DATE:');
        Object.keys(entriesByDate).sort().forEach(dateKey => {
            console.log(`\n📅 ${dateKey}:`);
            entriesByDate[dateKey].forEach(entry => {
                console.log(`   📝 ${entry.habit.name}`);
                console.log(`      ✅ Terminée: ${entry.completed}`);
                console.log(`      ⭐ Note: ${entry.rating || 'Aucune'}`);
                console.log(`      📄 Contenu: ${entry.note ? `"${entry.note.substring(0, 50)}..."` : 'Aucun'}`);
                console.log(`      🕐 Créée: ${entry.createdAt.toLocaleString('fr-FR')}`);
            });
        });
        
        // Vérifier spécifiquement les tests attendus
        console.log('\n🎯 VÉRIFICATION DES TESTS ATTENDUS:');
        
        // Test 1: Note de journée HIER (note 8)
        const hierDate = new Date(Date.UTC(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()));
        const noteHier = entries.find(e => 
            e.habit.name.includes('Note de sa journée') && 
            e.date.getTime() === hierDate.getTime() &&
            e.rating === 8
        );
        
        if (noteHier) {
            console.log('✅ Test HIER trouvé: Note de sa journée avec rating 8');
            console.log(`   Date: ${noteHier.date.toISOString().split('T')[0]}`);
            console.log(`   Contenu: "${noteHier.note}"`);
        } else {
            console.log('❌ Test HIER non trouvé');
        }
        
        // Test 2: Apprentissage AVANT-HIER
        const avantHierDate = new Date(Date.UTC(dayBeforeYesterday.getFullYear(), dayBeforeYesterday.getMonth(), dayBeforeYesterday.getDate()));
        const apprentissageAvantHier = entries.find(e => 
            e.habit.name.includes('Apprentissage') && 
            e.date.getTime() === avantHierDate.getTime()
        );
        
        if (apprentissageAvantHier) {
            console.log('✅ Test AVANT-HIER trouvé: Apprentissage');
            console.log(`   Date: ${apprentissageAvantHier.date.toISOString().split('T')[0]}`);
            console.log(`   Contenu: "${apprentissageAvantHier.note}"`);
        } else {
            console.log('❌ Test AVANT-HIER non trouvé');
        }
        
        // Test 3: Note de journée 28/06/2025 (note 7)
        const specificDateUTC = new Date(Date.UTC(2025, 5, 28));
        const noteSpecific = entries.find(e => 
            e.habit.name.includes('Note de sa journée') && 
            e.date.getTime() === specificDateUTC.getTime() &&
            e.rating === 7
        );
        
        if (noteSpecific) {
            console.log('✅ Test 28/06/2025 trouvé: Note de sa journée avec rating 7');
            console.log(`   Date: ${noteSpecific.date.toISOString().split('T')[0]}`);
            console.log(`   Contenu: "${noteSpecific.note}"`);
        } else {
            console.log('❌ Test 28/06/2025 non trouvé');
        }
        
        const successCount = [noteHier, apprentissageAvantHier, noteSpecific].filter(Boolean).length;
        console.log(`\n🎯 RÉSULTAT FINAL: ${successCount}/3 tests réussis`);
        
        if (successCount === 3) {
            console.log('🎉 SUCCÈS TOTAL ! Le système de dates avec habitudes spéciales fonctionne parfaitement !');
        } else {
            console.log('⚠️ Certains tests ont échoué. Vérifiez les logs de l\'agent IA.');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAllDatesEntries(); 