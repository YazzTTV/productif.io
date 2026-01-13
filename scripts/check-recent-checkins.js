import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecentCheckIns() {
  try {
    const email = process.argv[2] || 'noah.lugagne@free.fr';
    
    console.log('🔍 VÉRIFICATION DES CHECK-INS RÉCENTS');
    console.log('=====================================');
    console.log(`📧 Email: ${email}\n`);

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      console.error(`❌ Utilisateur non trouvé: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé: ${user.name || user.email}`);
    console.log(`🆔 User ID: ${user.id}\n`);

    // Récupérer les check-ins des 7 derniers jours
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const checkIns = await prisma.behaviorCheckIn.findMany({
      where: {
        userId: user.id,
        timestamp: {
          gte: sevenDaysAgo
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    console.log(`📊 Total de check-ins trouvés: ${checkIns.length}\n`);

    if (checkIns.length === 0) {
      console.log('⚠️  Aucun check-in trouvé pour les 7 derniers jours');
    } else {
      console.log('📋 Détails des check-ins:\n');
      
      // Grouper par type
      const byType = {
        mood: [],
        stress: [],
        focus: [],
        motivation: [],
        energy: []
      };

      checkIns.forEach(checkIn => {
        const type = checkIn.type;
        if (byType[type]) {
          byType[type].push(checkIn);
        }
      });

      // Afficher par type
      Object.entries(byType).forEach(([type, entries]) => {
        if (entries.length > 0) {
          const emoji = {
            mood: '🙂',
            stress: '😌',
            focus: '🎯',
            motivation: '🔥',
            energy: '⚡'
          }[type] || '📊';
          
          console.log(`${emoji} ${type.toUpperCase()} (${entries.length} entrée${entries.length > 1 ? 's' : ''}):`);
          
          entries.forEach(entry => {
            const date = new Date(entry.timestamp).toLocaleString('fr-FR', {
              dateStyle: 'short',
              timeStyle: 'short'
            });
            console.log(`   • ${date} - Note: ${entry.value}/10`);
            if (entry.note) {
              console.log(`     Note: "${entry.note}"`);
            }
            if (entry.context) {
              console.log(`     Contexte: ${JSON.stringify(entry.context)}`);
            }
          });
          console.log('');
        }
      });

      // Calculer les moyennes
      console.log('📈 Moyennes sur les 7 derniers jours:');
      Object.entries(byType).forEach(([type, entries]) => {
        if (entries.length > 0) {
          const avg = entries.reduce((sum, e) => sum + e.value, 0) / entries.length;
          console.log(`   ${type}: ${avg.toFixed(1)}/10 (${entries.length} entrée${entries.length > 1 ? 's' : ''})`);
        }
      });
    }

    // Vérifier les check-ins d'aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCheckIns = await prisma.behaviorCheckIn.findMany({
      where: {
        userId: user.id,
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    console.log(`\n📅 Check-ins d'aujourd'hui: ${todayCheckIns.length}`);
    if (todayCheckIns.length > 0) {
      todayCheckIns.forEach(checkIn => {
        const time = new Date(checkIn.timestamp).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });
        const emoji = {
          mood: '🙂',
          stress: '😌',
          focus: '🎯',
          motivation: '🔥',
          energy: '⚡'
        }[checkIn.type] || '📊';
        console.log(`   ${emoji} ${checkIn.type} - ${checkIn.value}/10 à ${time}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentCheckIns();
