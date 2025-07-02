const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNewNotificationSystem() {
    try {
        console.log('🧪 TEST: Nouveau système de recréation de notifications');
        console.log('='.repeat(70));

        const testUserId = 'cma6li3j1000ca64sisjbjyfs'; // Votre utilisateur de test

        console.log(`👤 Utilisateur de test: ${testUserId}`);
        console.log('');

        // 1️⃣ Vérifier les préférences actuelles
        console.log('📋 1. Vérification des préférences actuelles...');
        const currentPrefs = await prisma.notificationSettings.findUnique({
            where: { userId: testUserId }
        });

        if (!currentPrefs) {
            console.log('❌ Pas de préférences trouvées pour cet utilisateur');
            return;
        }

        console.log(`   ✅ Préférences trouvées:`);
        console.log(`      🔔 Activées: ${currentPrefs.isEnabled}`);
        console.log(`      🌅 Matin: ${currentPrefs.morningTime}`);
        console.log(`      ☀️ Midi: ${currentPrefs.noonTime}`);
        console.log(`      🌤️ Après-midi: ${currentPrefs.afternoonTime}`);
        console.log(`      🌆 Soir: ${currentPrefs.eveningTime}`);
        console.log(`      🌙 Nuit: ${currentPrefs.nightTime}`);
        console.log('');

        // 2️⃣ Compter les notifications actuelles
        console.log('📊 2. Comptage des notifications actuelles...');
        const currentNotifications = await prisma.notificationHistory.findMany({
            where: {
                userId: testUserId,
                status: 'pending'
            },
            orderBy: {
                scheduledFor: 'asc'
            }
        });

        console.log(`   📋 ${currentNotifications.length} notifications en attente trouvées:`);
        currentNotifications.forEach((notif, index) => {
            const date = notif.scheduledFor.toLocaleString();
            console.log(`      ${index + 1}. ${notif.type} - ${date}`);
        });
        console.log('');

        // 3️⃣ Simuler une mise à jour des préférences via l'API
        console.log('🔄 3. Test de mise à jour via API...');
        
        // Modifier légèrement les horaires pour tester
        const newPrefs = {
            ...currentPrefs,
            afternoonTime: '14:30', // Changement d'horaire
            eveningTime: '18:30'    // Changement d'horaire
        };

        console.log(`   🔄 Simulation d'une requête API POST...`);
        console.log(`   📝 Nouveaux horaires:`);
        console.log(`      🌤️ Après-midi: ${newPrefs.afternoonTime}`);
        console.log(`      🌆 Soir: ${newPrefs.eveningTime}`);

        const response = await fetch('http://localhost:3000/api/notifications/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': 'votre-cookie-session-ici' // Vous devrez ajuster cela
            },
            body: JSON.stringify({
                userId: testUserId,
                isEnabled: newPrefs.isEnabled,
                emailEnabled: newPrefs.emailEnabled,
                pushEnabled: newPrefs.pushEnabled,
                whatsappEnabled: newPrefs.whatsappEnabled,
                whatsappNumber: newPrefs.whatsappNumber,
                startHour: newPrefs.startHour,
                endHour: newPrefs.endHour,
                allowedDays: newPrefs.allowedDays,
                notificationTypes: newPrefs.notificationTypes,
                morningReminder: newPrefs.morningReminder,
                taskReminder: newPrefs.taskReminder,
                habitReminder: newPrefs.habitReminder,
                motivation: newPrefs.motivation,
                dailySummary: newPrefs.dailySummary,
                morningTime: newPrefs.morningTime,
                noonTime: newPrefs.noonTime,
                afternoonTime: newPrefs.afternoonTime,
                eveningTime: newPrefs.eveningTime,
                nightTime: newPrefs.nightTime
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`   ✅ API Response: ${response.status}`);
            
            if (result.updateResult) {
                console.log(`   🎯 Résultat de la mise à jour:`);
                console.log(`      ✅ Succès: ${result.updateResult.success}`);
                console.log(`      🗑️ Supprimées: ${result.updateResult.deleted}`);
                console.log(`      ➕ Créées: ${result.updateResult.created}`);
                console.log(`      💬 Message: ${result.updateResult.message}`);
            }
        } else {
            console.log(`   ❌ Erreur API: ${response.status}`);
            const errorText = await response.text();
            console.log(`   📄 Réponse: ${errorText}`);
        }
        console.log('');

        // 4️⃣ Vérifier les nouvelles notifications
        console.log('📊 4. Vérification après mise à jour...');
        const newNotifications = await prisma.notificationHistory.findMany({
            where: {
                userId: testUserId,
                status: 'pending'
            },
            orderBy: {
                scheduledFor: 'asc'
            }
        });

        console.log(`   📋 ${newNotifications.length} notifications en attente trouvées:`);
        newNotifications.forEach((notif, index) => {
            const date = notif.scheduledFor.toLocaleString();
            console.log(`      ${index + 1}. ${notif.type} - ${date}`);
        });

        // 5️⃣ Vérifier que les horaires ont changé
        console.log('');
        console.log('🔍 5. Vérification des changements d\'horaires...');
        const afternoonNotifs = newNotifications.filter(n => n.type === 'AFTERNOON_REMINDER');
        const eveningNotifs = newNotifications.filter(n => n.type === 'EVENING_PLANNING');
        
        if (afternoonNotifs.length > 0) {
            const firstAfternoonTime = afternoonNotifs[0].scheduledFor.toLocaleTimeString();
            console.log(`   🌤️ Première notification après-midi: ${firstAfternoonTime}`);
            if (firstAfternoonTime.includes('14:30') || firstAfternoonTime.includes('2:30')) {
                console.log(`      ✅ Horaire mis à jour correctement !`);
            } else {
                console.log(`      ⚠️ Horaire peut-être pas encore mis à jour`);
            }
        }

        if (eveningNotifs.length > 0) {
            const firstEveningTime = eveningNotifs[0].scheduledFor.toLocaleTimeString();
            console.log(`   🌆 Première notification soir: ${firstEveningTime}`);
            if (firstEveningTime.includes('18:30') || firstEveningTime.includes('6:30')) {
                console.log(`      ✅ Horaire mis à jour correctement !`);
            } else {
                console.log(`      ⚠️ Horaire peut-être pas encore mis à jour`);
            }
        }

        console.log('');
        console.log('🎉 Test terminé !');

    } catch (error) {
        console.error('❌ Erreur during test:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Lancement du test
testNewNotificationSystem(); 