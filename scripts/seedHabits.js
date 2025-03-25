const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function getDayOfWeek(date) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

async function seedHabits() {
  try {
    // Créer un utilisateur de test si nécessaire
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password_here', // Dans un vrai environnement, utiliser un hash sécurisé
      },
    });

    // Créer des habitudes de test
    const habits = [
      {
        name: 'Méditation quotidienne',
        description: '15 minutes de méditation le matin',
        color: '#4CAF50',
        frequency: 'daily',
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        userId: testUser.id,
      },
      {
        name: 'Exercice physique',
        description: '30 minutes d\'exercice',
        color: '#2196F3',
        frequency: 'weekly',
        daysOfWeek: ['monday', 'wednesday', 'friday'],
        userId: testUser.id,
      },
      {
        name: 'Lecture',
        description: 'Lire 20 pages',
        color: '#9C27B0',
        frequency: 'daily',
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        userId: testUser.id,
      },
    ];

    // Supprimer les habitudes existantes
    await prisma.habit.deleteMany({
      where: {
        userId: testUser.id,
      },
    });

    // Créer les habitudes
    for (const habit of habits) {
      const createdHabit = await prisma.habit.create({
        data: habit,
      });

      console.log(`Habitude créée: ${createdHabit.name}`);

      // Créer des entrées pour les 7 derniers jours
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Vérifier si l'habitude doit être effectuée ce jour-là
        const dayOfWeek = getDayOfWeek(date);
        if (createdHabit.daysOfWeek.includes(dayOfWeek)) {
          try {
            await prisma.habitEntry.create({
              data: {
                habitId: createdHabit.id,
                date: date,
                completed: Math.random() > 0.5, // Random completion status
              },
            });
            console.log(`  Entrée créée pour ${createdHabit.name} le ${date.toISOString().split('T')[0]}`);
          } catch (error) {
            console.error(`  Erreur lors de la création de l'entrée pour ${createdHabit.name} le ${date.toISOString().split('T')[0]}:`, error.message);
          }
        }
      }
    }

    console.log('Données de test créées avec succès!');

  } catch (error) {
    console.error('Erreur lors de la création des données de test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedHabits(); 