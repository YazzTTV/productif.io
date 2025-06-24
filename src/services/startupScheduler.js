const cron = require('node-cron');
const { MongoClient } = require('mongodb');

class StartupScheduler {
    constructor() {
        this.client = new MongoClient(process.env.MONGODB_URI);
        this.jobs = new Map();
    }

    async start() {
        try {
            console.log('🚀 Démarrage du planificateur de démarrage...');

            // Connexion à MongoDB
            await this.client.connect();
            console.log('✅ Connecté à MongoDB');

            // Planifier les tâches
            this.scheduleJobs();

            console.log('✨ Planificateur de démarrage démarré avec succès !');
        } catch (error) {
            console.error('❌ Erreur lors du démarrage du planificateur:', error);
            throw error;
        }
    }

    scheduleJobs() {
        // Planifier les rappels matinaux tous les jours à 7h
        this.jobs.set('morningReminders', cron.schedule('0 7 * * *', async () => {
            try {
                await this.scheduleMorningReminders();
            } catch (error) {
                console.error('Erreur lors de la planification des rappels matinaux:', error);
            }
        }));

        // Planifier les rappels de tâches toutes les heures
        this.jobs.set('taskReminders', cron.schedule('0 * * * *', async () => {
            try {
                await this.scheduleTaskReminders();
            } catch (error) {
                console.error('Erreur lors de la planification des rappels de tâches:', error);
            }
        }));
    }

    async stop() {
        try {
            // Arrêter tous les jobs
            for (const [name, job] of this.jobs) {
                console.log(`Arrêt du job ${name}...`);
                job.stop();
            }
            this.jobs.clear();

            // Fermer la connexion MongoDB
            await this.client.close();
            console.log('✅ Planificateur de démarrage arrêté avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'arrêt du planificateur:', error);
            throw error;
        }
    }
}

module.exports = new StartupScheduler(); 