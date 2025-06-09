const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ENDPOINT_TYPES = [
  'tasks', 'habits', 'habit-entries', 'projects', 'missions', 
  'objectives', 'actions', 'processes', 'time-entries',
  'achievements', 'user-achievements'
];

async function testPrismaModels() {
  console.log('🔍 Test des modèles Prisma utilisés dans l\'endpoint debug...\n');

  const results = {};

  try {
    // Test de chaque modèle
    console.log('📋 Test des modèles individuels:');
    
    // Tasks
    try {
      await prisma.task.findFirst();
      console.log('✅ task - OK');
      results.task = 'OK';
    } catch (error) {
      console.log('❌ task - ERREUR:', error.message);
      results.task = error.message;
    }

    // Habits
    try {
      await prisma.habit.findFirst();
      console.log('✅ habit - OK');
      results.habit = 'OK';
    } catch (error) {
      console.log('❌ habit - ERREUR:', error.message);
      results.habit = error.message;
    }

    // HabitEntry (pour habit-entries)
    try {
      await prisma.habitEntry.findFirst();
      console.log('✅ habitEntry - OK');
      results.habitEntry = 'OK';
    } catch (error) {
      console.log('❌ habitEntry - ERREUR:', error.message);
      results.habitEntry = error.message;
    }

    // Projects
    try {
      await prisma.project.findFirst();
      console.log('✅ project - OK');
      results.project = 'OK';
    } catch (error) {
      console.log('❌ project - ERREUR:', error.message);
      results.project = error.message;
    }

    // Missions
    try {
      await prisma.mission.findFirst();
      console.log('✅ mission - OK');
      results.mission = 'OK';
    } catch (error) {
      console.log('❌ mission - ERREUR:', error.message);
      results.mission = error.message;
    }

    // Objectives
    try {
      await prisma.objective.findFirst();
      console.log('✅ objective - OK');
      results.objective = 'OK';
    } catch (error) {
      console.log('❌ objective - ERREUR:', error.message);
      results.objective = error.message;
    }

    // ObjectiveAction (pour actions)
    try {
      await prisma.objectiveAction.findFirst();
      console.log('✅ objectiveAction - OK');
      results.objectiveAction = 'OK';
    } catch (error) {
      console.log('❌ objectiveAction - ERREUR:', error.message);
      results.objectiveAction = error.message;
    }

    // Processes
    try {
      await prisma.process.findFirst();
      console.log('✅ process - OK');
      results.process = 'OK';
    } catch (error) {
      console.log('❌ process - ERREUR:', error.message);
      results.process = error.message;
    }

    // TimeEntry (pour time-entries)
    try {
      await prisma.timeEntry.findFirst();
      console.log('✅ timeEntry - OK');
      results.timeEntry = 'OK';
    } catch (error) {
      console.log('❌ timeEntry - ERREUR:', error.message);
      results.timeEntry = error.message;
    }

    // Achievement
    try {
      await prisma.achievement.findFirst();
      console.log('✅ achievement - OK');
      results.achievement = 'OK';
    } catch (error) {
      console.log('❌ achievement - ERREUR:', error.message);
      results.achievement = error.message;
    }

    // UserAchievement (pour user-achievements)
    try {
      await prisma.userAchievement.findFirst();
      console.log('✅ userAchievement - OK');
      results.userAchievement = 'OK';
    } catch (error) {
      console.log('❌ userAchievement - ERREUR:', error.message);
      results.userAchievement = error.message;
    }

  } catch (globalError) {
    console.error('❌ Erreur globale:', globalError);
  }

  console.log('\n📊 Résumé des tests:');
  console.log('==================');
  
  const problems = [];
  Object.entries(results).forEach(([model, status]) => {
    if (status !== 'OK') {
      problems.push({ model, error: status });
    }
  });

  if (problems.length === 0) {
    console.log('✅ Tous les modèles Prisma sont accessibles');
  } else {
    console.log(`❌ ${problems.length} problème(s) détecté(s):`);
    problems.forEach(({ model, error }) => {
      console.log(`   - ${model}: ${error}`);
    });
  }

  return { results, problems };
}

async function checkSchemaModels() {
  console.log('\n🔍 Vérification des modèles dans le client Prisma généré...\n');
  
  // Lister tous les modèles disponibles dans le client Prisma
  const prismaModels = Object.keys(prisma).filter(key => 
    !key.startsWith('$') && 
    typeof prisma[key] === 'object' && 
    prisma[key].findFirst
  );

  console.log('📋 Modèles disponibles dans Prisma:');
  prismaModels.forEach((model, index) => {
    console.log(`   ${index + 1}. ${model}`);
  });

  console.log('\n🔗 Mapping types endpoint → modèles Prisma:');
  const mapping = {
    'tasks': 'task',
    'habits': 'habit', 
    'habit-entries': 'habitEntry',
    'projects': 'project',
    'missions': 'mission',
    'objectives': 'objective',
    'actions': 'objectiveAction',
    'processes': 'process',
    'time-entries': 'timeEntry',
    'achievements': 'achievement',
    'user-achievements': 'userAchievement'
  };

  Object.entries(mapping).forEach(([endpoint, model]) => {
    const exists = prismaModels.includes(model);
    console.log(`   ${endpoint} → ${model} ${exists ? '✅' : '❌'}`);
  });
}

async function main() {
  console.log('🔧 === TEST ENDPOINT DEBUG/IDS/[TYPE] ===\n');
  
  const { problems } = await testPrismaModels();
  await checkSchemaModels();
  
  if (problems.length > 0) {
    console.log('\n🔧 Actions correctives recommandées:');
    console.log('=====================================');
    problems.forEach(({ model, error }) => {
      if (error.includes('Unknown arg')) {
        console.log(`   - ${model}: Problème de requête, vérifier les champs sélectionnés`);
      } else if (error.includes('does not exist')) {
        console.log(`   - ${model}: Modèle n'existe pas, vérifier le schéma Prisma`);
      } else {
        console.log(`   - ${model}: ${error}`);
      }
    });
  }

  await prisma.$disconnect();
}

if (require.main === module) {
  main();
}

module.exports = { testPrismaModels, checkSchemaModels }; 