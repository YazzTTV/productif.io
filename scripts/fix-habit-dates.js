#!/usr/bin/env node

/**
 * Script pour analyser et corriger les dates des entrées d'habitudes
 */

const { PrismaClient } = require('@prisma/client');
const { startOfDay, format, parseISO } = require('date-fns');

const prisma = new PrismaClient();

async function analyzeHabitDates(userId) {
  try {
    console.log('🔍 Analyse des dates d\'habitudes...\n');

    // Récupérer toutes les entrées d'habitudes récentes
    const entries = await prisma.habitEntry.findMany({
      where: {
        habit: {
          userId
        }
      },
      include: {
        habit: true
      },
      orderBy: {
        date: 'desc'
      },
      take: 50
    });

    console.log(`📊 Trouvé ${entries.length} entrées d'habitudes\n`);

    // Grouper par date
    const entriesByDate = {};
    entries.forEach(entry => {
      const dateKey = format(entry.date, 'yyyy-MM-dd');
      const timeKey = entry.date.toISOString();
      
      if (!entriesByDate[dateKey]) {
        entriesByDate[dateKey] = [];
      }
      entriesByDate[dateKey].push({
        ...entry,
        timeKey
      });
    });

    // Analyser chaque date
    console.log('📅 Analyse par date:');
    console.log('===================\n');

    Object.keys(entriesByDate).sort().reverse().slice(0, 7).forEach(dateKey => {
      const dayEntries = entriesByDate[dateKey];
      const completed = dayEntries.filter(e => e.completed).length;
      const total = dayEntries.length;
      
      console.log(`${dateKey}: ${completed}/${total} habitudes complétées`);
      
      // Vérifier les heures
      const times = [...new Set(dayEntries.map(e => e.timeKey))];
      if (times.length > 1) {
        console.log(`  ⚠️  Plusieurs heures détectées:`);
        times.forEach(time => {
          const count = dayEntries.filter(e => e.timeKey === time).length;
          console.log(`    - ${time}: ${count} entrées`);
        });
      } else {
        console.log(`  ✅ Heure unique: ${times[0]}`);
      }
      
      // Vérifier la normalisation
      const normalizedDate = startOfDay(parseISO(dateKey));
      const isNormalized = times.every(time => {
        const entryDate = new Date(time);
        return entryDate.getTime() === normalizedDate.getTime();
      });
      
      if (!isNormalized) {
        console.log(`  🔧 Normalisation requise vers: ${normalizedDate.toISOString()}`);
      }
      
      console.log('');
    });

    // Proposer une correction
    console.log('💡 Recommandations:');
    console.log('===================\n');

    let needsCorrection = false;
    const corrections = [];

    Object.keys(entriesByDate).forEach(dateKey => {
      const dayEntries = entriesByDate[dateKey];
      const normalizedDate = startOfDay(parseISO(dateKey));
      
      dayEntries.forEach(entry => {
        if (entry.date.getTime() !== normalizedDate.getTime()) {
          needsCorrection = true;
          corrections.push({
            id: entry.id,
            habitName: entry.habit.name,
            currentDate: entry.date.toISOString(),
            correctedDate: normalizedDate.toISOString()
          });
        }
      });
    });

    if (needsCorrection) {
      console.log(`⚠️  ${corrections.length} entrées nécessitent une correction de date`);
      console.log('\nExemples de corrections:');
      corrections.slice(0, 5).forEach(correction => {
        console.log(`  - ${correction.habitName}:`);
        console.log(`    Actuel: ${correction.currentDate}`);
        console.log(`    Corrigé: ${correction.correctedDate}`);
      });
      
      console.log('\n🔧 Pour appliquer les corrections, utilisez:');
      console.log('npm run fix-habit-dates <userId> --apply');
    } else {
      console.log('✅ Toutes les dates sont correctement normalisées');
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function fixHabitDates(userId) {
  try {
    console.log('🔧 Correction des dates d\'habitudes...\n');

    // Récupérer toutes les entrées qui nécessitent une correction
    const entries = await prisma.habitEntry.findMany({
      where: {
        habit: {
          userId
        }
      },
      include: {
        habit: true
      }
    });

    let correctionCount = 0;
    const corrections = [];

    for (const entry of entries) {
      const dateKey = format(entry.date, 'yyyy-MM-dd');
      const normalizedDate = startOfDay(parseISO(dateKey));
      
      if (entry.date.getTime() !== normalizedDate.getTime()) {
        corrections.push({
          id: entry.id,
          habitName: entry.habit.name,
          currentDate: entry.date.toISOString(),
          correctedDate: normalizedDate
        });
      }
    }

    if (corrections.length === 0) {
      console.log('✅ Aucune correction nécessaire');
      return;
    }

    console.log(`🔧 Correction de ${corrections.length} entrées...`);

    // Appliquer les corrections par batch
    for (let i = 0; i < corrections.length; i += 10) {
      const batch = corrections.slice(i, i + 10);
      
      await Promise.all(batch.map(correction => 
        prisma.habitEntry.update({
          where: { id: correction.id },
          data: { date: correction.correctedDate }
        })
      ));
      
      correctionCount += batch.length;
      console.log(`  ✅ ${correctionCount}/${corrections.length} entrées corrigées`);
    }

    console.log('\n🎉 Toutes les corrections ont été appliquées !');
    console.log('\n🔄 Vous pouvez maintenant recalculer le streak avec:');
    console.log('npm run recalculate-streak <userId>');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer les arguments de ligne de commande
const userId = process.argv[2];
const shouldApply = process.argv.includes('--apply');

if (!userId) {
  console.error('❌ Veuillez fournir un ID utilisateur');
  console.log('Usage: npm run fix-habit-dates <userId> [--apply]');
  console.log('  --apply : Applique les corrections (sinon analyse seulement)');
  process.exit(1);
}

if (shouldApply) {
  fixHabitDates(userId);
} else {
  analyzeHabitDates(userId);
} 