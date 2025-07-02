const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testReactiveSystem() {
    console.log('🧪 TEST: Système Réactif Complet');
    console.log('='.repeat(60));

    try {
        // Test 1: Créer un utilisateur avec des préférences
        console.log('\n📋 Test 1: Création d\'un utilisateur avec préférences...');
        
        const testUser = await prisma.user.create({
            data: {
                email: `test-reactive-${Date.now()}@example.com`,
                name: 'Test Reactive User',
                password: 'fake-password',
                notificationSettings: {
                    create: {
                        isEnabled: true,
                        morningTime: '08:30',
                        noonTime: '12:30',
                        afternoonTime: '15:30',
                        eveningTime: '18:30',
                        nightTime: '21:30',
                        whatsappEnabled: true,
                        whatsappNumber: '+33612345678'
                    }
                }
            },
            include: {
                notificationSettings: true
            }
        });

        console.log(`✅ Utilisateur créé: ${testUser.email}`);
        console.log(`📝 ID: ${testUser.id}`);
        
        // Attendre un peu pour que le système réactif détecte le changement
        console.log('\n⏳ Attente de 8 secondes pour la détection automatique...');
        await sleep(8000);

        // Test 2: Modifier les préférences
        console.log('\n📋 Test 2: Modification des préférences...');
        
        const updatedSettings = await prisma.notificationSettings.update({
            where: { userId: testUser.id },
            data: {
                morningTime: '09:00',
                noonTime: '13:00',
                isEnabled: false
            }
        });

        console.log('✅ Préférences modifiées');
        console.log(`🌅 Nouveau matin: ${updatedSettings.morningTime}`);
        console.log(`☀️ Nouveau midi: ${updatedSettings.noonTime}`);
        console.log(`🔔 Notifications: ${updatedSettings.isEnabled ? 'Activées' : 'Désactivées'}`);

        // Attendre la détection
        console.log('\n⏳ Attente de 8 secondes pour la détection de modification...');
        await sleep(8000);

        // Test 3: Réactiver les notifications
        console.log('\n📋 Test 3: Réactivation des notifications...');
        
        await prisma.notificationSettings.update({
            where: { userId: testUser.id },
            data: {
                isEnabled: true,
                afternoonTime: '16:00',
                eveningTime: '19:00'
            }
        });

        console.log('✅ Notifications réactivées avec nouveaux horaires');

        // Attendre la détection
        console.log('\n⏳ Attente de 8 secondes pour la détection de réactivation...');
        await sleep(8000);

        // Test 4: Suppression de l'utilisateur
        console.log('\n📋 Test 4: Suppression de l\'utilisateur...');
        
        await prisma.user.delete({
            where: { id: testUser.id }
        });

        console.log('✅ Utilisateur supprimé');

        // Attendre la détection
        console.log('\n⏳ Attente de 8 secondes pour la détection de suppression...');
        await sleep(8000);

        console.log('\n🎉 TESTS TERMINÉS !');
        console.log('═'.repeat(60));
        console.log('📊 Résultats attendus:');
        console.log('   1. ✅ Détection de création d\'utilisateur');
        console.log('   2. ✅ Détection de modification de préférences');
        console.log('   3. ✅ Détection de désactivation/réactivation');
        console.log('   4. ✅ Détection de suppression d\'utilisateur');
        console.log('');
        console.log('💡 Vérifiez les logs du scheduler pour voir les réactions automatiques !');

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    } finally {
        await prisma.$disconnect();
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Exécuter le test
testReactiveSystem(); 