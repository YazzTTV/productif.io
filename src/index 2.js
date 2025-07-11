require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const whatsappService = require('./services/whatsappService');

const app = express();
app.use(express.json());

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/productif-io', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connecté à MongoDB');
}).catch((error) => {
    console.error('Erreur de connexion à MongoDB:', error);
});

// Webhook pour recevoir les messages WhatsApp
app.post('/webhook', async (req, res) => {
    try {
        console.log('Webhook reçu:', JSON.stringify(req.body, null, 2));
        
        const { entry } = req.body;
        
        if (!entry || !Array.isArray(entry)) {
            return res.sendStatus(200);
        }

        for (const e of entry) {
            if (e.changes && Array.isArray(e.changes)) {
                for (const change of e.changes) {
                    if (change.value && change.value.messages && Array.isArray(change.value.messages)) {
                        for (const message of change.value.messages) {
                            if (message.type === 'text') {
                                await whatsappService.handleIncomingMessage(message);
                            }
                        }
                    }
                }
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Erreur dans le webhook:', error);
        res.sendStatus(500);
    }
});

// Vérification du webhook WhatsApp
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
            console.log('Webhook vérifié !');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// Route de test
app.get('/test', async (req, res) => {
    try {
        const profile = await whatsappService.getBusinessProfile();
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
    console.log(`Webhook URL: ${process.env.WEBHOOK_URL || 'http://localhost:' + port}/webhook`);
}); 