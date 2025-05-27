#!/usr/bin/env node

/**
 * Script pour recalculer et mettre à jour le streak d'un utilisateur
 */

const { PrismaClient } = require('@prisma/client');
const { subDays, format } = require('date-fns');

const prisma = new PrismaClient();

// Obtenir la date du jour comme le frontend (midi UTC)
function getTodayAsStored() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  today.setHours(12, 0, 0, 0); // Même logique que le frontend
  return today;
}

// Normaliser une date comme le frontend (midi UTC)
function normalizeDate(date) {
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  normalized.setHours(12, 0, 0, 0); // Même logique que le frontend
  return normalized;
}

// Calculer le streak actuel d'un utilisateur
async function calculateCurrentStreak(userId) {
  const today = getTodayAsStored();
  let streak = 0;
  let checkDate = today;

  console.log(`🧮 Calcul du streak pour l'utilisateur ${userId}...`);
  console.log(`📅 Date de référence: ${format(today, 'yyyy-MM-dd')}\n`);

  while (true) {
    const dayName = checkDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    
    console.log(`📅 Vérification du ${format(checkDate, 'yyyy-MM-dd')} (${dayName})`);
    
    const dayHabits = await prisma.habit.findMany({
      where: {
        userId,
        daysOfWeek: {
          has: dayName
        }
      },
      include: {
        entries: {
          where: {
            date: checkDate,
            completed: true
          }
        }
      }
    });

    console.log(`  - Habitudes prévues: ${dayHabits.length}`);

    // Si aucune habitude prévue ce jour, on passe au jour précédent
    if (dayHabits.length === 0) {
      console.log(`  - Aucune habitude prévue, on continue...`);
      checkDate = subDays(checkDate, 1);
      continue;
    }

    // Vérifier si toutes les habitudes du jour ont été complétées
    const completedHabits = dayHabits.filter(habit => habit.entries.length > 0);
    console.log(`  - Habitudes complétées: ${completedHabits.length}`);
    
    if (completedHabits.length === dayHabits.length) {
      streak++;
      console.log(`  - ✅ Jour parfait ! Streak = ${streak}`);
      checkDate = subDays(checkDate, 1);
    } else {
      console.log(`  - ❌ Jour incomplet. Streak s'arrête.`);
      
      // Debug: afficher les habitudes manquées
      const missedHabits = dayHabits.filter(habit => habit.entries.length === 0);
      if (missedHabits.length > 0) {
        console.log(`  - Habitudes manquées:`);
        missedHabits.forEach(habit => {
          console.log(`    • ${habit.name}`);
        });
      }
      break;
    }

    // Limite de sécurité
    if (streak > 365) {
      console.log('⚠️  Limite de sécurité atteinte (365 jours)');
      break;
    }
  }

  return streak;
}

async function recalculateStreak(userId) {
  try {
    console.log('🔄 Recalcul du streak...\n');

    // 1. Vérifier les données actuelles
    const userGamification = await prisma.userGamification.findUnique({
      where: { userId }
    });

    if (!userGamification) {
      console.log('❌ Aucune donnée de gamification trouvée pour cet utilisateur');
      return;
    }

    console.log('📊 Données actuelles:');
    console.log(`  - Streak actuel: ${userGamification.currentStreak}`);
    console.log(`  - Streak le plus long: ${userGamification.longestStreak}`);
    console.log(`  - Points totaux: ${userGamification.totalPoints}\n`);

    // 2. Debug: Afficher les entrées récentes pour comprendre le problème
    console.log('🔍 Debug - Entrées récentes:');
    const recentEntries = await prisma.habitEntry.findMany({
      where: {
        habit: {
          userId
        },
        date: {
          gte: subDays(getTodayAsStored(), 5)
        }
      },
      include: {
        habit: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    const entriesByDate = {};
    recentEntries.forEach(entry => {
      const dateKey = format(entry.date, 'yyyy-MM-dd');
      if (!entriesByDate[dateKey]) {
        entriesByDate[dateKey] = { total: 0, completed: 0 };
      }
      entriesByDate[dateKey].total++;
      if (entry.completed) {
        entriesByDate[dateKey].completed++;
      }
    });

    Object.keys(entriesByDate).sort().reverse().forEach(dateKey => {
      const stats = entriesByDate[dateKey];
      const percentage = Math.round((stats.completed / stats.total) * 100);
      console.log(`  ${dateKey}: ${stats.completed}/${stats.total} (${percentage}%)`);
    });

    console.log('');

    // 3. Calculer le nouveau streak
    const newStreak = await calculateCurrentStreak(userId);

    console.log(`\n🎯 Nouveau streak calculé: ${newStreak}`);

    // 4. Mettre à jour la base de données
    if (newStreak !== userGamification.currentStreak) {
      console.log('\n🔧 Mise à jour de la base de données...');
      
      await prisma.userGamification.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(userGamification.longestStreak, newStreak)
        }
      });

      console.log('✅ Streak mis à jour avec succès !');
      console.log(`  - Ancien streak: ${userGamification.currentStreak}`);
      console.log(`  - Nouveau streak: ${newStreak}`);
      console.log(`  - Streak le plus long: ${Math.max(userGamification.longestStreak, newStreak)}`);
    } else {
      console.log('\n✅ Le streak était déjà correct, aucune mise à jour nécessaire');
    }

  } catch (error) {
    console.error('❌ Erreur lors du recalcul:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer l'ID utilisateur depuis les arguments de ligne de commande
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Veuillez fournir un ID utilisateur');
  console.log('Usage: npm run recalculate-streak <userId>');
  process.exit(1);
}

recalculateStreak(userId); 