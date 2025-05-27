#!/usr/bin/env node

/**
 * Script de debug pour analyser le calcul des streaks
 */

const { PrismaClient } = require('@prisma/client');
const { startOfDay, subDays, format } = require('date-fns');
const { toZonedTime } = require('date-fns-tz');

const prisma = new PrismaClient();

// Fuseau horaire utilisateur - TOUJOURS UTC+2 (Europe/Paris)
const USER_TIMEZONE = 'Europe/Paris';

// Obtenir la date du jour dans le fuseau horaire utilisateur (UTC+2)
function getTodayInUserTimezone() {
  const now = new Date();
  const todayInUserTz = toZonedTime(now, USER_TIMEZONE);
  return startOfDay(todayInUserTz);
}

// Convertir une date en date normalisée dans le fuseau horaire utilisateur
function normalizeDate(date) {
  const dateInUserTz = toZonedTime(date, USER_TIMEZONE);
  return startOfDay(dateInUserTz);
}

async function debugStreak(userId) {
  console.log('🔍 Debug du streak pour l\'utilisateur:', userId);
  console.log(`🌍 Fuseau horaire utilisé: ${USER_TIMEZONE}`);
  console.log('=====================================\n');

  try {
    // 1. Vérifier les données de gamification actuelles
    const userGamification = await prisma.userGamification.findUnique({
      where: { userId }
    });

    console.log('📊 Données de gamification actuelles:');
    if (userGamification) {
      console.log(`  - Streak actuel: ${userGamification.currentStreak}`);
      console.log(`  - Streak le plus long: ${userGamification.longestStreak}`);
      console.log(`  - Total habitudes complétées: ${userGamification.totalHabitsCompleted}`);
      console.log(`  - Points totaux: ${userGamification.totalPoints}`);
    } else {
      console.log('  - Aucune donnée de gamification trouvée');
    }

    console.log('\n🗓️  Analyse jour par jour (7 derniers jours):');
    console.log('================================================\n');

    const today = getTodayInUserTimezone();
    console.log(`📅 Aujourd'hui (référence): ${format(today, 'yyyy-MM-dd')}\n`);

    for (let i = 0; i < 7; i++) {
      const checkDate = subDays(today, i);
      const dayName = checkDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      
      console.log(`📅 ${format(checkDate, 'yyyy-MM-dd')} (${dayName}):`);
      
      // Récupérer les habitudes prévues ce jour
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
      
      if (dayHabits.length === 0) {
        console.log('  - ⚪ Aucune habitude prévue ce jour');
      } else {
        const completedHabits = dayHabits.filter(habit => habit.entries.length > 0);
        console.log(`  - Habitudes complétées: ${completedHabits.length}`);
        console.log(`  - Taux de complétion: ${Math.round((completedHabits.length / dayHabits.length) * 100)}%`);
        
        if (completedHabits.length === dayHabits.length) {
          console.log('  - ✅ Jour parfait !');
        } else {
          console.log('  - ❌ Jour incomplet');
          console.log('  - Habitudes manquées:');
          dayHabits.forEach(habit => {
            if (habit.entries.length === 0) {
              console.log(`    • ${habit.name}`);
            }
          });
        }
      }
      console.log('');
    }

    // 2. Calculer le streak manuellement selon la logique actuelle
    console.log('🧮 Calcul manuel du streak:');
    console.log('============================\n');

    let streak = 0;
    let checkDate = today;

    while (true) {
      const dayName = checkDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      
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

      // Si aucune habitude prévue ce jour, on passe au jour précédent
      if (dayHabits.length === 0) {
        console.log(`${format(checkDate, 'yyyy-MM-dd')} - Aucune habitude prévue, on continue...`);
        checkDate = subDays(checkDate, 1);
        continue;
      }

      // Vérifier si toutes les habitudes du jour ont été complétées
      const completedHabits = dayHabits.filter(habit => habit.entries.length > 0);
      
      if (completedHabits.length === dayHabits.length) {
        streak++;
        console.log(`${format(checkDate, 'yyyy-MM-dd')} - ✅ Jour parfait ! Streak = ${streak}`);
        checkDate = subDays(checkDate, 1);
      } else {
        console.log(`${format(checkDate, 'yyyy-MM-dd')} - ❌ Jour incomplet (${completedHabits.length}/${dayHabits.length}). Streak s'arrête.`);
        break;
      }

      // Limite de sécurité
      if (streak > 30) {
        console.log('⚠️  Limite de sécurité atteinte (30 jours)');
        break;
      }
    }

    console.log(`\n🎯 Streak calculé manuellement: ${streak}`);

    // 3. Vérifier l'historique des streaks
    console.log('\n📈 Historique des streaks (7 derniers jours):');
    console.log('=============================================\n');

    const streakHistory = await prisma.streakHistory.findMany({
      where: {
        userId,
        date: {
          gte: subDays(today, 7)
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    if (streakHistory.length > 0) {
      streakHistory.forEach(entry => {
        console.log(`${format(entry.date, 'yyyy-MM-dd')} - Streak: ${entry.streakCount}, Habitudes: ${entry.habitsCompleted}/${entry.totalHabitsForDay}`);
      });
    } else {
      console.log('Aucun historique de streak trouvé');
    }

    // 4. Recommandations
    console.log('\n💡 Recommandations:');
    console.log('===================\n');

    if (userGamification && userGamification.currentStreak !== streak) {
      console.log(`⚠️  Incohérence détectée ! Streak en base: ${userGamification.currentStreak}, Streak calculé: ${streak}`);
      console.log('🔧 Il faut recalculer et mettre à jour le streak en base de données');
    } else {
      console.log('✅ Le streak semble cohérent');
    }

  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer l'ID utilisateur depuis les arguments de ligne de commande
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Veuillez fournir un ID utilisateur');
  console.log('Usage: npm run debug-streak <userId>');
  process.exit(1);
}

debugStreak(userId); 