import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config } from 'dotenv';

// Configuration de dotenv avec le chemin correct
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config();

import { PrismaClient } from '@prisma/client';
import { AIService } from './AIService';
import { WhatsAppService } from './WhatsAppService';
import { VoiceTranscriptionService } from './VoiceTranscriptionService';
import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 3001;

async function startAIService() {
    const prisma = new PrismaClient();
    const aiService = new AIService();
    const whatsappService = new WhatsAppService();
    const voiceService = new VoiceTranscriptionService();

    try {
        console.log('🚀 Démarrage du service IA...');

        // Connexion à la base de données
        await prisma.$connect();
        console.log('✅ Connecté à la base de données');

        // Configuration du serveur Express
        app.use(express.json());
        
        // Middleware pour logger toutes les requêtes
        app.use((req, res, next) => {
            console.log(`${req.method} ${req.path}`, {
                headers: req.headers,
                query: req.query,
                body: req.body
            });
            next();
        });

        // Route de healthcheck
        app.get('/health', (_req: Request, res: Response) => {
            res.status(200).json({ status: 'ok' });
        });

        // Route pour la vérification du webhook WhatsApp
        app.get('/webhook', (req: Request, res: Response) => {
            console.log('Requête de vérification du webhook reçue:', req.query);
            
            const mode = req.query['hub.mode'];
            const token = req.query['hub.verify_token'];
            const challenge = req.query['hub.challenge'];

            if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
                console.log('Webhook vérifié !');
                res.status(200).send(challenge);
            } else {
                console.error('Échec de la vérification du webhook');
                console.error('Token attendu:', process.env.WHATSAPP_VERIFY_TOKEN);
                console.error('Token reçu:', token);
                res.sendStatus(403);
            }
        });

        // Route pour recevoir les messages WhatsApp
        app.post('/webhook', async (req: Request, res: Response) => {
            console.log('📩 Requête webhook POST reçue:', JSON.stringify(req.body, null, 2));
            
            try {
                // Vérification de la structure de base
                if (!req.body || !req.body.object) {
                    console.log('❌ Corps de requête invalide ou manquant');
                    return res.sendStatus(400);
                }

                if (req.body.object === 'whatsapp_business_account') {
                    const webhookData = req.body.entry?.[0]?.changes?.[0]?.value;
                    
                    // 🛡️ FILTRAGE DES WEBHOOKS DE STATUT (delivered, read, etc.)
                    if (webhookData?.statuses) {
                        console.log('ℹ️ Webhook de statut ignoré (delivered/read/etc.):', JSON.stringify(req.body, null, 2));
                        return res.sendStatus(200);
                    }
                    
                    // Vérification de la présence des messages
                    if (!webhookData?.messages) {
                        console.log('ℹ️ Requête WhatsApp reçue mais pas de message:', JSON.stringify(req.body, null, 2));
                        return res.sendStatus(200);
                    }

                    const message = req.body.entry[0].changes[0].value.messages[0];
                    if (!message) {
                        console.log('❌ Structure de message invalide');
                        return res.sendStatus(200);
                    }

                    const from = message.from;
                    const messageType = message.type;

                    console.log('📱 Message reçu de', from, '- Type:', messageType);

                    let textToProcess = '';

                    if (messageType === 'text') {
                        // Message texte classique
                        textToProcess = message.text?.body || '';
                        console.log('📝 Texte:', textToProcess);
                    } else if (messageType === 'audio') {
                        // Message vocal - transcription nécessaire
                        console.log('🎙️ Message vocal détecté');
                        const audioId = message.audio?.id;

                        if (audioId) {
                            console.log('🎵 ID du fichier audio:', audioId);
                            
                            // Transcrire le message vocal
                            const transcriptionResult = await voiceService.processVoiceMessage(
                                audioId, 
                                process.env.WHATSAPP_ACCESS_TOKEN!
                            );

                            if (transcriptionResult.success) {
                                textToProcess = transcriptionResult.text;
                                console.log('✅ Transcription réussie:', textToProcess);
                                
                                // Envoyer un accusé de réception de la transcription
                                await whatsappService.sendMessage(
                                    from, 
                                    `🎙️ *Message vocal reçu et transcrit :*\n\n"${textToProcess}"\n\n_Traitement en cours..._`
                                );
                            } else {
                                console.error('❌ Erreur de transcription:', transcriptionResult.error);
                                await whatsappService.sendMessage(
                                    from, 
                                    '❌ Désolé, je n\'ai pas pu transcrire votre message vocal. Pouvez-vous rééssayer ou envoyer un message texte ?'
                                );
                                return res.sendStatus(200);
                            }
                        } else {
                            console.error('❌ ID audio manquant');
                            await whatsappService.sendMessage(
                                from, 
                                '❌ Erreur lors de la réception du message vocal. Veuillez réessayer.'
                            );
                            return res.sendStatus(200);
                        }
                    } else {
                        console.log('ℹ️ Type de message non supporté:', messageType);
                        await whatsappService.sendMessage(
                            from, 
                            'Je ne peux traiter que les messages texte et vocaux pour le moment. 😊'
                        );
                        return res.sendStatus(200);
                    }

                    // Traiter le texte (qu'il soit direct ou transcrit)
                    if (textToProcess.trim()) {
                        const response = await aiService.processMessage(from, textToProcess);
                        console.log('🤖 Réponse de l\'IA:', response);

                        if (response && response.response) {
                            await whatsappService.sendMessage(from, response.response);
                            console.log('✅ Réponse envoyée avec succès');
                        }
                    }

                    res.sendStatus(200);
                } else {
                    console.log('❌ Objet non reconnu:', req.body.object);
                    res.sendStatus(404);
                }
            } catch (error: unknown) {
                console.error('❌ Erreur lors du traitement du webhook:', error);
                res.sendStatus(500);
            }
        });

        // Démarrer le serveur
        app.listen(port, () => {
            console.log(`✨ Service IA démarré sur le port ${port}`);
        });

        // Gérer l'arrêt gracieux
        process.on('SIGTERM', async () => {
            console.log('\n📴 Signal d\'arrêt reçu...');
            await prisma.$disconnect();
            process.exit(0);
        });

        process.on('SIGINT', async () => {
            console.log('\n📴 Signal d\'interruption reçu...');
            await prisma.$disconnect();
            process.exit(0);
        });

    } catch (error: unknown) {
        console.error('❌ Erreur lors du démarrage du service:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

startAIService(); 