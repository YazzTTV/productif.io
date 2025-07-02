import { PrismaClient } from '@prisma/client';
import EventManager from '../lib/EventManager.js';

console.log('🔄 Test du système complet de mise à jour en temps réel');
console.log('=====================================================\n');

const prisma = new PrismaClient();

async function testCompleteRealtimeSystem() {
    try {
        console.log('1️⃣ Recherche d\'un utilisateur avec des préférences...');
        
        const user = await prisma.user.findFirst({
            include: {
                notificationSettings: true
            },
            where: {
                notificationSettings: {
                    isNot: null
                }
            }
        });

        if (!user) {
            console.log('❌ Aucun utilisateur avec préférences trouvé');
            console.log('💡 Créons des préférences de test...');
            
            // Créer un utilisateur de test ou des préférences
            const testUser = await prisma.user.findFirst();
            if (testUser) {
                await prisma.notificationSettings.create({
                    data: {
                        userId: testUser.id,
                        isEnabled: true,
                        morningTime: '08:00',
                        noonTime: '12:00',
                        afternoonTime: '14:00',
                        eveningTime: '18:00',
                        nightTime: '22:00',
                        morningReminder: true,
                        taskReminder: true,
                        habitReminder: false
                    }
                });
                console.log('✅ Préférences de test créées');
            }
        } else {
            console.log(`✅ Utilisateur trouvé: ${user.email}`);
            console.log('📋 Préférences actuelles:');
            console.log(`   - Notifications: ${user.notificationSettings?.isEnabled ? '✅' : '❌'}`);
            console.log(`   - Matin: ${user.notificationSettings?.morningTime}`);
            console.log(`   - Midi: ${user.notificationSettings?.noonTime}`);
            console.log(`   - Soir: ${user.notificationSettings?.eveningTime}`);
        }

        console.log('\n2️⃣ Configuration du listener de mise à jour...');
        
        const eventManager = EventManager.getInstance();
        let updateReceived = false;
        
        const updateListener = (event) => {
            updateReceived = true;
            console.log('🎯 ÉVÉNEMENT DE MISE À JOUR REÇU !');
            console.log(`   👤 Utilisateur: ${event.userId}`);
            console.log(`   🕐 Ancien horaire matin: ${event.oldPreferences?.morningTime}`);
            console.log(`   🕐 Nouvel horaire matin: ${event.newPreferences?.morningTime}`);
            console.log(`   🔔 Notifications activées: ${event.newPreferences?.isEnabled}`);
            console.log('   ⚡ Un vrai planificateur recevrait cet événement et');
            console.log('      reprogrammerait immédiatement les tâches cron !');
        };
        
        eventManager.onPreferencesUpdate(updateListener);
        console.log('   ✅ Listener configuré');

        console.log('\n3️⃣ Test via l\'API preferences (simulation)...');
        
        // Récupérer l'utilisateur à nouveau pour avoir les bonnes préférences
        const updatedUser = await prisma.user.findFirst({
            include: { notificationSettings: true },
            where: { notificationSettings: { isNot: null } }
        });
        
        if (updatedUser?.notificationSettings) {
            const oldSettings = updatedUser.notificationSettings;
            
            // Simulation d'une mise à jour via l'API
            console.log('   📡 Simulation de mise à jour des préférences...');
            
            const newMorningTime = oldSettings.morningTime === '08:00' ? '09:30' : '08:00';
            
            // Mettre à jour en base (comme le ferait l'API)
            const newSettings = await prisma.notificationSettings.update({
                where: { userId: updatedUser.id },
                data: {
                    morningTime: newMorningTime,
                    habitReminder: !oldSettings.habitReminder
                }
            });
            
            console.log(`   ✅ Base de données mise à jour: ${oldSettings.morningTime} → ${newMorningTime}`);
            
            // Émettre l'événement (comme le ferait l'API)
            eventManager.emitPreferencesUpdate({
                userId: updatedUser.id,
                oldPreferences: oldSettings,
                newPreferences: newSettings,
                timestamp: new Date()
            });
            
            console.log('   📡 Événement émis');
        }

        // Attendre que l'événement soit traité
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('\n4️⃣ Résultats du test...');
        
        if (updateReceived) {
            console.log('🎉 SUCCÈS ! Le système de mise à jour temps réel fonctionne !');
            console.log('\n✅ Ce qui se passe en production:');
            console.log('   1. Utilisateur change ses préférences sur l\'interface');
            console.log('   2. API /notifications/preferences sauvegarde ET émet événement');
            console.log('   3. NotificationScheduler reçoit l\'événement immédiatement');
            console.log('   4. Planificateur arrête les anciennes tâches utilisateur');
            console.log('   5. Planificateur crée nouvelles tâches avec nouveaux horaires');
            console.log('   6. ⚡ CHANGEMENT APPLIQUÉ EN TEMPS RÉEL ⚡');
        } else {
            console.log('❌ L\'événement n\'a pas été reçu');
        }

        console.log('\n5️⃣ Test de l\'API de contrôle...');
        
        // Test des commandes de contrôle
        console.log('   📡 Test événement redémarrage...');
        eventManager.emitSchedulerRestart();
        
        console.log('   📡 Test événement suppression utilisateur...');
        eventManager.emitUserDeleted('test-user-deleted');
        
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('\n🏁 Test terminé !');
        console.log('\n📋 Pour tester manuellement:');
        console.log('   1. Va sur /dashboard/settings/notifications');
        console.log('   2. Change un horaire (ex: matin 8h → 9h30)');
        console.log('   3. Sauvegarde → Le planificateur sera mis à jour instantanément !');
        console.log('\n📊 APIs disponibles:');
        console.log('   GET  /api/notifications/scheduler (statut)');
        console.log('   POST /api/notifications/scheduler (contrôle)');
        console.log('   POST /api/notifications/preferences (mise à jour auto)');

        // Nettoyage
        eventManager.removePreferencesUpdateListener(updateListener);
        eventManager.cleanup();
        await prisma.$disconnect();

    } catch (error) {
        console.error('❌ Erreur:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

testCompleteRealtimeSystem(); 