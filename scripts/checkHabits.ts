import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkHabits() {
  try {
    // Vérifier toutes les habitudes
    const habits = await prisma.habit.findMany({
      include: {
        entries: true,
      },
    });

    console.log(`Nombre total d'habitudes: ${habits.length}`);

    // Vérifier les habitudes avec des données invalides
    const invalidHabits = habits.filter(habit => {
      // Vérifier le format de frequency
      const validFrequencies = ['daily', 'weekly', 'monthly'];
      if (!validFrequencies.includes(habit.frequency)) {
        console.log(`Habitude ${habit.id} a une fréquence invalide: ${habit.frequency}`);
        return true;
      }

      // Vérifier les jours de la semaine
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      if (habit.daysOfWeek.some(day => !validDays.includes(day))) {
        console.log(`Habitude ${habit.id} a des jours de la semaine invalides: ${habit.daysOfWeek.join(', ')}`);
        return true;
      }

      return false;
    });

    // Vérifier les entrées d'habitudes
    const entries = await prisma.habitEntry.findMany();
    console.log(`Nombre total d'entrées d'habitudes: ${entries.length}`);

    // Vérifier les entrées avec des dates invalides
    const invalidEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const today = new Date();
      return entryDate > today;
    });

    if (invalidEntries.length > 0) {
      console.log(`Nombre d'entrées avec des dates futures: ${invalidEntries.length}`);
    }

    // Afficher un résumé
    console.log('\nRésumé de la vérification:');
    console.log(`- Habitudes totales: ${habits.length}`);
    console.log(`- Habitudes invalides: ${invalidHabits.length}`);
    console.log(`- Entrées totales: ${entries.length}`);
    console.log(`- Entrées invalides: ${invalidEntries.length}`);

  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkHabits(); 