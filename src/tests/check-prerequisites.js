const { MongoClient } = require('mongodb');

const requiredCollections = [
    'User',
    'Task',
    'Habit',
    'HabitEntry',
    'NotificationHistory',
    'NotificationTemplate',
    'UserNotificationPreference'
];

async function checkPrerequisites() {
    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        console.log('🔍 Vérification des prérequis...');

        // 1. Vérifier la connexion à MongoDB
        await client.connect();
        console.log('✅ Connexion à MongoDB établie');

        const db = client.db('plannificateur');

        // 2. Vérifier les collections requises
        console.log('\n📋 Vérification des collections...');
        for (const collection of requiredCollections) {
            try {
                const count = await db.collection(collection).countDocuments();
                console.log(`✅ Collection ${collection} trouvée (${count} documents)`);
            } catch (error) {
                console.error(`❌ Collection ${collection} non trouvée`);
                console.error('Erreur:', error);
                process.exit(1);
            }
        }

        console.log('\n✨ Tous les prérequis sont satisfaits !');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erreur lors de la vérification des prérequis:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

checkPrerequisites(); 