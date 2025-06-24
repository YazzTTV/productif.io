const express = require('express');
const { MongoClient } = require('mongodb');
const router = express.Router();

const client = new MongoClient(process.env.MONGODB_URI);

// Middleware pour vérifier les préférences de notification
router.use('/:userId', async (req, res, next) => {
    try {
        await client.connect();
        const db = client.db('plannificateur');

        const preferences = await db.collection('UserNotificationPreference').findOne({
            userId: req.params.userId
        });

        if (!preferences) {
            return res.status(404).json({
                error: 'Préférences de notification non trouvées'
            });
        }

        req.userPreferences = preferences;
        next();
    } catch (error) {
        console.error('Erreur lors de la vérification des préférences:', error);
        res.status(500).json({
            error: 'Erreur serveur'
        });
    } finally {
        await client.close();
    }
});

// Récupérer les préférences de notification
router.get('/:userId/preferences', (req, res) => {
    res.json(req.userPreferences);
});

// Mettre à jour les préférences de notification
router.put('/:userId/preferences', async (req, res) => {
    try {
        await client.connect();
        const db = client.db('plannificateur');

        const preferences = await db.collection('UserNotificationPreference').updateOne(
            { userId: req.params.userId },
            {
                $set: {
                    ...req.body,
                    userId: req.params.userId
                }
            },
            { upsert: true }
        );

        res.json(preferences);
    } catch (error) {
        console.error('Erreur lors de la mise à jour des préférences:', error);
        res.status(500).json({
            error: 'Erreur serveur'
        });
    } finally {
        await client.close();
    }
});

// Planifier une notification
router.post('/:userId/schedule', async (req, res) => {
    try {
        const { message, scheduledFor, type = 'custom' } = req.body;

        if (!message || !scheduledFor) {
            return res.status(400).json({
                error: 'Message et date de planification requis'
            });
        }

        await client.connect();
        const db = client.db('plannificateur');

        const notification = await db.collection('NotificationHistory').insertOne({
            userId: req.params.userId,
            message,
            scheduledFor: new Date(scheduledFor),
            type,
            status: 'pending'
        });

        res.json(notification);
    } catch (error) {
        console.error('Erreur lors de la planification de la notification:', error);
        res.status(500).json({
            error: 'Erreur serveur'
        });
    } finally {
        await client.close();
    }
});

module.exports = router; 