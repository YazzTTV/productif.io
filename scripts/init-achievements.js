#!/usr/bin/env node

/**
 * Script d'initialisation des achievements par défaut
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_ACHIEVEMENTS = [
  // Achievements de Streak
  {
    name: "Premier pas",
    description: "Complétez votre première habitude",
    icon: "play",
    category: "streak",
    condition: JSON.stringify({ streakDays: 1 }),
    points: 10,
    rarity: "common"
  },
  {
    name: "Une semaine de feu",
    description: "Maintenez un streak de 7 jours",
    icon: "fire",
    category: "streak",
    condition: JSON.stringify({ streakDays: 7 }),
    points: 50,
    rarity: "common"
  },
  {
    name: "Maître de la constance",
    description: "Maintenez un streak de 30 jours",
    icon: "flame",
    category: "streak",
    condition: JSON.stringify({ streakDays: 30 }),
    points: 200,
    rarity: "rare"
  },
  {
    name: "Légende vivante",
    description: "Maintenez un streak de 100 jours",
    icon: "crown",
    category: "streak",
    condition: JSON.stringify({ streakDays: 100 }),
    points: 1000,
    rarity: "legendary"
  },

  // Achievements de Completion
  {
    name: "Débutant motivé",
    description: "Complétez 10 habitudes au total",
    icon: "target",
    category: "completion",
    condition: JSON.stringify({ totalHabits: 10 }),
    points: 25,
    rarity: "common"
  },
  {
    name: "Habitué des habitudes",
    description: "Complétez 100 habitudes au total",
    icon: "check-circle",
    category: "completion",
    condition: JSON.stringify({ totalHabits: 100 }),
    points: 100,
    rarity: "rare"
  },
  {
    name: "Machine à habitudes",
    description: "Complétez 500 habitudes au total",
    icon: "zap",
    category: "completion",
    condition: JSON.stringify({ totalHabits: 500 }),
    points: 500,
    rarity: "epic"
  },
  {
    name: "Maître suprême",
    description: "Complétez 1000 habitudes au total",
    icon: "trophy",
    category: "completion",
    condition: JSON.stringify({ totalHabits: 1000 }),
    points: 1500,
    rarity: "legendary"
  },

  // Achievements de Consistency
  {
    name: "Journée parfaite",
    description: "Complétez toutes vos habitudes en une journée",
    icon: "star",
    category: "consistency",
    condition: JSON.stringify({ perfectDay: true }),
    points: 30,
    rarity: "common"
  },

  // Achievements de Milestone
  {
    name: "Collectionneur de points",
    description: "Atteignez 100 points",
    icon: "gem",
    category: "milestone",
    condition: JSON.stringify({ points: 100 }),
    points: 20,
    rarity: "common"
  },
  {
    name: "Riche en points",
    description: "Atteignez 500 points",
    icon: "diamond",
    category: "milestone",
    condition: JSON.stringify({ points: 500 }),
    points: 50,
    rarity: "rare"
  },
  {
    name: "Millionnaire des points",
    description: "Atteignez 1000 points",
    icon: "coins",
    category: "milestone",
    condition: JSON.stringify({ points: 1000 }),
    points: 100,
    rarity: "epic"
  }
];

async function initializeAchievements() {
  console.log('🎯 Initialisation des achievements...');

  try {
    // Vérifier si des achievements existent déjà
    const existingCount = await prisma.achievement.count();
    
    if (existingCount > 0) {
      console.log(`ℹ️  ${existingCount} achievements déjà présents dans la base de données.`);
      console.log('🔄 Suppression et recréation des achievements...');
      
      // Supprimer tous les achievements existants (cela supprimera aussi les UserAchievements grâce à onDelete: Cascade)
      await prisma.achievement.deleteMany({});
      console.log('✅ Achievements existants supprimés');
    }

    console.log('📝 Création des achievements par défaut...');
    
    // Créer tous les achievements
    const result = await prisma.achievement.createMany({
      data: DEFAULT_ACHIEVEMENTS,
      skipDuplicates: true
    });

    const finalCount = await prisma.achievement.count();
    console.log(`✅ ${finalCount} achievements créés avec succès !`);

    // Afficher un résumé par catégorie
    const categories = await prisma.achievement.groupBy({
      by: ['category'],
      _count: {
        category: true
      }
    });

    console.log('\n📊 Résumé par catégorie :');
    categories.forEach(cat => {
      console.log(`  - ${cat.category}: ${cat._count.category} achievements`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des achievements:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
if (require.main === module) {
  initializeAchievements();
}

module.exports = { initializeAchievements, DEFAULT_ACHIEVEMENTS }; 