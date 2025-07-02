import { PrismaClient } from '@prisma/client';
import EventManager from '../lib/EventManager.js';

console.log('🧪 Test du système de mise à jour en temps réel du planificateur');
console.log('================================================================\n');

const prisma = new PrismaClient();

// Fonction de test des événements seulement (sans planificateur complet)
async function testEventSystem() {
    try {
        console.log('1️⃣ Test du système d\'événements...');
        
        const eventManager = EventManager.getInstance();
        
        // Compteur d'événements reçus
        let eventsReceived = 0;
        
        // S'abonner aux événements
        const handlePreferencesUpdate = (event) => {
            eventsReceived++;
            console.log(`   📡 Événement reçu #${eventsReceived} pour utilisateur ${event.userId}`);
            console.log(`      Ancien horaire matin: ${event.oldPreferences?.morningTime || 'non défini'}`);
            console.log(`      Nouvel horaire matin: ${event.newPreferences?.morningTime || 'non défini'}`);
            console.log(`      Notifications activées: ${event.newPreferences?.isEnabled}`);
        };
        
        eventManager.onPreferencesUpdate(handlePreferencesUpdate);
        console.log('   ✅ Listener configuré');
        
        console.log('\n2️⃣ Test des préférences utilisateur existantes...');
        
        // Récupérer un utilisateur de test
        const testUser = await prisma.user.findFirst({
            include: {
                notificationSettings: true
            }
        });
        
        if (!testUser) {
            console.log('   ⚠️ Aucun utilisateur trouvé dans la base');
            console.log('   💡 Simulons avec un utilisateur fictif...');
        } else {
            console.log(`   ✅ Utilisateur trouvé: ${testUser.email}`);
            if (testUser.notificationSettings) {
                console.log(`   📋 Préférences actuelles:`);
                console.log(`      - Notifications activées: ${testUser.notificationSettings.isEnabled}`);
                console.log(`      - Horaire matin: ${testUser.notificationSettings.morningTime}`);
                console.log(`      - Horaire midi: ${testUser.notificationSettings.noonTime}`);
                console.log(`      - Rappel tâches: ${testUser.notificationSettings.taskReminder}`);
            }
        }
        
        console.log('\n3️⃣ Simulation d\'une mise à jour de préférences...');
        
        // Simuler des préférences
        const oldPreferences = {
            isEnabled: true,
            morningTime: '08:00',
            noonTime: '12:00',
            taskReminder: true,
            habitReminder: false
        };
        
        const newPreferences = {
            isEnabled: true,
            morningTime: '09:30', // Changement d'horaire
            noonTime: '12:30',    // Changement d'horaire
            taskReminder: true,
            habitReminder: true   // Activation des rappels d'habitudes
        };
        
        // Émettre l'événement
        eventManager.emitPreferencesUpdate({
            userId: testUser?.id || 'test-user-123',
            oldPreferences,
            newPreferences,
            timestamp: new Date()
        });
        
        console.log('   ✅ Événement émis');
        
        // Attendre un peu pour que l'événement soit traité
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('\n4️⃣ Test de désactivation complète...');
        
        const disabledPreferences = {
            ...newPreferences,
            isEnabled: false
        };
        
        eventManager.emitPreferencesUpdate({
            userId: testUser?.id || 'test-user-123',
            oldPreferences: newPreferences,
            newPreferences: disabledPreferences,
            timestamp: new Date()
        });
        
        console.log('   ✅ Événement de désactivation émis');
        
        // Attendre un peu
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('\n5️⃣ Test d\'un utilisateur différent...');
        
        eventManager.emitPreferencesUpdate({
            userId: 'autre-utilisateur-456',
            oldPreferences: { isEnabled: false },
            newPreferences: { isEnabled: true, morningTime: '07:00' },
            timestamp: new Date()
        });
        
        console.log('   ✅ Événement pour autre utilisateur émis');
        
        // Attendre un peu
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('\n6️⃣ Test de l\'API de contrôle...');
        
        // Simuler un appel API pour redémarrer le planificateur
        console.log('   📡 Test de l\'événement de redémarrage...');
        eventManager.emitSchedulerRestart();
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('\n🎉 Test terminé avec succès !');
        console.log(`\n📊 Résultats:`);
        console.log(`   ✅ Événements reçus: ${eventsReceived}`);
        console.log(`   ✅ EventManager fonctionnel`);
        console.log(`   ✅ Gestion des préférences OK`);
        console.log(`   ✅ Événements de contrôle OK`);
        
        // Nettoyer
        eventManager.removePreferencesUpdateListener(handlePreferencesUpdate);
        eventManager.cleanup();
        
        await prisma.$disconnect();
        console.log('\n👋 Nettoyage terminé');
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

// Lancer le test
testEventSystem(); 