import { MongoClient } from 'mongodb';
import { PrismaClient } from '@prisma/client';

const MONGODB_URI = 'mongodb://mongo:BNWcsOVckHnMvSQtljpUYzaLqlSgbZSa@tramway.proxy.rlwy.net:42059/plannificateur?authSource=admin';
const TEST_USER_ID = 'cma6li3j1000ca64sisjbjyfs'; // ID de l'utilisateur de test

async function main() {
    console.log('🔍 Démarrage du test de synchronisation...');

    // 1. Connexion à PostgreSQL via Prisma
    console.log('\n📊 Connexion à PostgreSQL...');
    const prisma = new PrismaClient();
    try {
        await prisma.$connect();
        console.log('✅ Connecté à PostgreSQL');
    } catch (error) {
        console.error('❌ Erreur de connexion à PostgreSQL:', error);
        process.exit(1);
    }

    // 2. Lecture des préférences dans PostgreSQL
    console.log('\n🔍 Lecture des préférences dans PostgreSQL...');
    let preferences;
    try {
        preferences = await prisma.notificationSettings.findUnique({
            where: { userId: TEST_USER_ID }
        });
        console.log('✅ Préférences trouvées dans PostgreSQL:', preferences);
    } catch (error) {
        console.error('❌ Erreur lors de la lecture des préférences PostgreSQL:', error);
        process.exit(1);
    }

    // 3. Connexion à MongoDB
    console.log('\n📊 Connexion à MongoDB...');
    let mongoClient;
    try {
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
        console.log('✅ Connecté à MongoDB');
    } catch (error) {
        console.error('❌ Erreur de connexion à MongoDB:', error);
        await prisma.$disconnect();
        process.exit(1);
    }

    // 4. Tentative de synchronisation avec MongoDB
    console.log('\n🔄 Synchronisation avec MongoDB...');
    try {
        const db = mongoClient.db('plannificateur');
        
        // Mapper les préférences pour MongoDB
        const mongoPreferences = {
            userId: TEST_USER_ID,
            whatsappEnabled: preferences.whatsappEnabled,
            whatsappNumber: preferences.whatsappNumber,
            morningReminder: preferences.morningReminder,
            taskReminder: preferences.taskReminder,
            habitReminder: preferences.habitReminder,
            motivation: preferences.motivation,
            dailySummary: preferences.dailySummary
        };

        // Mettre à jour ou créer les préférences dans MongoDB
        const result = await db.collection('UserNotificationPreference').updateOne(
            { userId: TEST_USER_ID },
            { $set: mongoPreferences },
            { upsert: true }
        );

        console.log('✅ Synchronisation réussie:', result);

        // 5. Vérifier que les données ont bien été synchronisées
        console.log('\n🔍 Vérification des données synchronisées...');
        const syncedPreferences = await db.collection('UserNotificationPreference').findOne({
            userId: TEST_USER_ID
        });
        console.log('📋 Données dans MongoDB:', syncedPreferences);

    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation avec MongoDB:', error);
    }

    // 6. Nettoyage
    console.log('\n🧹 Nettoyage des connexions...');
    await mongoClient.close();
    await prisma.$disconnect();
    console.log('✅ Test terminé');
}

main().catch(console.error); 