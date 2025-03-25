import { habitService } from '../services/habits';

async function testHabitValidations() {
  console.log('🧪 Début des tests de validation des habitudes\n');

  try {
    // Test 1: Création d'une habitude valide
    console.log('Test 1: Création d\'une habitude valide');
    const validHabit = await habitService.createHabit({
      name: 'Test Habit',
      description: 'Test Description',
      color: '#FF0000',
      frequency: 'daily',
      daysOfWeek: ['monday', 'wednesday', 'friday'],
      userId: 'test-user-id',
    });
    console.log('✅ Succès: Habitude créée\n');

    // Test 2: Création d'une entrée valide
    console.log('Test 2: Création d\'une entrée valide');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const validEntry = await habitService.createHabitEntry({
      habitId: validHabit.id,
      date: today,
      completed: true,
    });
    console.log('✅ Succès: Entrée créée\n');

    // Test 3: Tentative de création d'une habitude avec une fréquence invalide
    console.log('Test 3: Création d\'une habitude avec fréquence invalide');
    try {
      await habitService.createHabit({
        name: 'Invalid Habit',
        frequency: 'invalid' as any,
        daysOfWeek: ['monday'],
        userId: 'test-user-id',
      });
      console.log('❌ Échec: L\'habitude invalide a été créée\n');
    } catch (error: any) {
      console.log('✅ Succès: L\'erreur a été détectée:', error.message, '\n');
    }

    // Test 4: Tentative de création d'une entrée dans le futur
    console.log('Test 4: Création d\'une entrée dans le futur');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    try {
      await habitService.createHabitEntry({
        habitId: validHabit.id,
        date: futureDate,
        completed: true,
      });
      console.log('❌ Échec: L\'entrée future a été créée\n');
    } catch (error: any) {
      console.log('✅ Succès: L\'erreur a été détectée:', error.message, '\n');
    }

    // Test 5: Vérification des statistiques
    console.log('Test 5: Vérification des statistiques');
    const stats = await habitService.getHabitStats(validHabit.id);
    console.log('Statistiques:', stats);
    console.log('✅ Succès: Statistiques récupérées\n');

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }

  console.log('🏁 Fin des tests');
}

testHabitValidations(); 