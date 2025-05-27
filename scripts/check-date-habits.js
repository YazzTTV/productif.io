#!/usr/bin/env node

/**
 * Script pour vérifier les habitudes d'une date spécifique
 */

const { PrismaClient } = require('@prisma/client');
const { format, parseISO } = require('date-fns');

const prisma = new PrismaClient();

// Normaliser une date comme le frontend (midi UTC)
function normalizeDate(date) {
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  normalized.setHours(12, 0, 0, 0); // Même logique que le frontend
  return normalized;
}

async function checkDateHabits(userId, dateString) {
  try {
    console.log(`🔍 Vérification des habitudes pour l'utilisateur ${userId}`);
    console.log(`📅 Date demandée: ${dateString}\n`);

    // Parser et normaliser la date
    const targetDate = parseISO(dateString);
    const normalizedDate = normalizeDate(targetDate);
    const dayName = normalizedDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

    console.log(`📊 Informations de la date:`);
    console.log(`  - Date normalisée (midi UTC): ${normalizedDate.toISOString()}`);
    console.log(`  - Jour de la semaine: ${dayName}\n`);

    // Récupérer toutes les habitudes prévues ce jour
    const habits = await prisma.habit.findMany({
      where: {
        userId,
        daysOfWeek: {
          has: dayName
        }
      },
      include: {
        entries: {
          where: {
            date: normalizedDate
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`🎯 Habitudes prévues pour ${dayName}: ${habits.length}\n`);

    if (habits.length === 0) {
      console.log('⚪ Aucune habitude prévue pour ce jour');
      return;
    }

    let completedCount = 0;
    let totalCount = habits.length;

    console.log('📋 Détail des habitudes:');
    console.log('========================\n');

    habits.forEach((habit, index) => {
      const entry = habit.entries.length > 0 ? habit.entries[0] : null;
      const isCompleted = entry?.completed || false;
      
      if (isCompleted) completedCount++;

      const status = isCompleted ? '✅' : '❌';
      const note = entry?.note ? ` (Note: "${entry.note}")` : '';
      const rating = entry?.rating ? ` (Note: ${entry.rating}/10)` : '';
      
      console.log(`${index + 1}. ${status} ${habit.name}${note}${rating}`);
      
      if (entry) {
        console.log(`   📝 Entrée créée: ${entry.createdAt.toISOString()}`);
        console.log(`   🔄 Dernière MAJ: ${entry.updatedAt.toISOString()}`);
      } else {
        console.log(`   ⚪ Aucune entrée trouvée`);
      }
      console.log('');
    });

    // Résumé
    const completionRate = Math.round((completedCount / totalCount) * 100);
    console.log('📊 Résumé:');
    console.log('==========');
    console.log(`  - Habitudes complétées: ${completedCount}/${totalCount}`);
    console.log(`  - Taux de complétion: ${completionRate}%`);
    console.log(`  - Jour parfait: ${completedCount === totalCount ? 'OUI ✅' : 'NON ❌'}`);

    // Vérifier s'il y a des entrées avec des dates différentes
    console.log('\n🔍 Vérification des entrées avec dates différentes:');
    const allEntries = await prisma.habitEntry.findMany({
      where: {
        habit: {
          userId
        },
        date: {
          gte: new Date(normalizedDate.getTime() - 24 * 60 * 60 * 1000), // 1 jour avant
          lte: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000)  // 1 jour après
        }
      },
      include: {
        habit: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    const entriesGroupedByDate = {};
    allEntries.forEach(entry => {
      const dateKey = format(entry.date, 'yyyy-MM-dd');
      if (!entriesGroupedByDate[dateKey]) {
        entriesGroupedByDate[dateKey] = [];
      }
      entriesGroupedByDate[dateKey].push(entry);
    });

    Object.keys(entriesGroupedByDate).forEach(dateKey => {
      const entries = entriesGroupedByDate[dateKey];
      const completedEntries = entries.filter(e => e.completed);
      console.log(`  ${dateKey}: ${completedEntries.length}/${entries.length} habitudes complétées`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer les arguments de ligne de commande
const userId = process.argv[2];
const dateString = process.argv[3];

if (!userId || !dateString) {
  console.error('❌ Veuillez fournir un ID utilisateur et une date');
  console.log('Usage: npm run check-date-habits <userId> <date>');
  console.log('Exemple: npm run check-date-habits cma6li3j1000ca64sisjbjyfs 2025-05-26');
  process.exit(1);
}

checkDateHabits(userId, dateString); 