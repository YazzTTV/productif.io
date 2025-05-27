#!/usr/bin/env node

/**
 * Script pour analyser le flux des dates entre frontend et backend
 */

const { PrismaClient } = require('@prisma/client');
const { startOfDay, format, parseISO, subDays } = require('date-fns');
const { toZonedTime } = require('date-fns-tz');

const prisma = new PrismaClient();

// Fuseau horaire utilisateur - TOUJOURS UTC+2 (Europe/Paris)
const USER_TIMEZONE = 'Europe/Paris';

// Simuler la normalisation côté frontend (comme dans weekly-habits-table.tsx)
function frontendNormalization(date) {
  const targetDate = new Date(date);
  targetDate.setHours(12, 0, 0, 0); // Frontend définit à midi
  return targetDate;
}

// Simuler la normalisation côté backend (comme dans l'API)
function backendNormalization(date) {
  const parsedDate = parseISO(date.toISOString());
  const dateInUserTz = toZonedTime(parsedDate, USER_TIMEZONE);
  return startOfDay(dateInUserTz);
}

// Simuler la normalisation du service de gamification
function gamificationNormalization(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

async function analyzeDateFlow(userId) {
  try {
    console.log('🔍 Analyse du flux des dates entre frontend et backend');
    console.log('=====================================================\n');

    // Analyser les 3 derniers jours
    const today = new Date();
    const dates = [
      subDays(today, 2), // 25 mai
      subDays(today, 1), // 26 mai  
      today              // 27 mai
    ];

    for (const originalDate of dates) {
      const dateStr = format(originalDate, 'yyyy-MM-dd');
      console.log(`📅 Analyse pour ${dateStr}:`);
      console.log('=====================================');

      // 1. Date originale (comme sélectionnée dans le calendrier)
      console.log(`1. Date originale (calendrier): ${originalDate.toISOString()}`);

      // 2. Normalisation frontend
      const frontendDate = frontendNormalization(originalDate);
      console.log(`2. Frontend (setHours 12:00): ${frontendDate.toISOString()}`);

      // 3. Normalisation backend
      const backendDate = backendNormalization(frontendDate);
      console.log(`3. Backend (UTC+2 → startOfDay): ${backendDate.toISOString()}`);

      // 4. Normalisation gamification
      const gamificationDate = gamificationNormalization(originalDate);
      console.log(`4. Gamification (getTodayAsStored): ${gamificationDate.toISOString()}`);

      // 5. Vérifier ce qui est réellement stocké en base
      const storedEntries = await prisma.habitEntry.findMany({
        where: {
          habit: { userId },
          date: {
            gte: new Date(originalDate.getFullYear(), originalDate.getMonth(), originalDate.getDate()),
            lt: new Date(originalDate.getFullYear(), originalDate.getMonth(), originalDate.getDate() + 1)
          }
        },
        include: { habit: true }
      });

      console.log(`5. Entrées stockées en base: ${storedEntries.length}`);
      storedEntries.forEach(entry => {
        console.log(`   - ${entry.habit.name}: ${entry.date.toISOString()} (completed: ${entry.completed})`);
      });

      // 6. Vérifier les correspondances
      console.log('\n🔍 Analyse des correspondances:');
      
      const backendMatches = storedEntries.filter(entry => 
        entry.date.getTime() === backendDate.getTime()
      );
      console.log(`   - Correspondances avec normalisation backend: ${backendMatches.length}`);

      const gamificationMatches = storedEntries.filter(entry => 
        entry.date.getTime() === gamificationDate.getTime()
      );
      console.log(`   - Correspondances avec normalisation gamification: ${gamificationMatches.length}`);

      // 7. Problèmes potentiels
      const uniqueDates = [...new Set(storedEntries.map(e => e.date.toISOString()))];
      if (uniqueDates.length > 1) {
        console.log(`   ⚠️  Plusieurs dates différentes stockées pour le même jour:`);
        uniqueDates.forEach(date => {
          const count = storedEntries.filter(e => e.date.toISOString() === date).length;
          console.log(`      - ${date}: ${count} entrées`);
        });
      }

      console.log('\n');
    }

    // Analyse globale des problèmes
    console.log('🚨 Analyse globale des problèmes:');
    console.log('==================================\n');

    // Vérifier toutes les entrées récentes
    const allRecentEntries = await prisma.habitEntry.findMany({
      where: {
        habit: { userId },
        date: {
          gte: subDays(today, 7)
        }
      },
      include: { habit: true },
      orderBy: { date: 'desc' }
    });

    // Grouper par jour calendaire
    const entriesByCalendarDay = {};
    allRecentEntries.forEach(entry => {
      const calendarDay = format(entry.date, 'yyyy-MM-dd');
      if (!entriesByCalendarDay[calendarDay]) {
        entriesByCalendarDay[calendarDay] = [];
      }
      entriesByCalendarDay[calendarDay].push(entry);
    });

    // Analyser les incohérences
    Object.keys(entriesByCalendarDay).forEach(day => {
      const entries = entriesByCalendarDay[day];
      const uniqueTimes = [...new Set(entries.map(e => e.date.toISOString()))];
      
      if (uniqueTimes.length > 1) {
        console.log(`⚠️  ${day}: ${uniqueTimes.length} heures différentes stockées`);
        uniqueTimes.forEach(time => {
          const count = entries.filter(e => e.date.toISOString() === time).length;
          console.log(`   - ${time}: ${count} entrées`);
        });
      }
    });

    // Recommandations
    console.log('\n💡 Recommandations:');
    console.log('===================\n');

    console.log('1. 🔧 Problème identifié: Incohérence entre les normalisations');
    console.log('   - Frontend: setHours(12, 0, 0, 0) → 12h00 UTC');
    console.log('   - Backend: toZonedTime + startOfDay → minuit UTC+2 = 22h00 UTC');
    console.log('   - Gamification: new Date(year, month, date) → minuit UTC');

    console.log('\n2. 🎯 Solution recommandée:');
    console.log('   - Uniformiser toutes les normalisations sur minuit UTC');
    console.log('   - Modifier le frontend pour utiliser startOfDay au lieu de setHours(12,0,0,0)');
    console.log('   - Ou modifier le backend pour accepter les dates à midi UTC');

    console.log('\n3. 🔄 Actions à effectuer:');
    console.log('   - Corriger les dates existantes avec fix-habit-dates.js --apply');
    console.log('   - Modifier le code frontend pour cohérence');
    console.log('   - Recalculer les streaks après correction');

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer l'ID utilisateur depuis les arguments de ligne de commande
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Veuillez fournir un ID utilisateur');
  console.log('Usage: npm run analyze-date-flow <userId>');
  process.exit(1);
}

analyzeDateFlow(userId); 