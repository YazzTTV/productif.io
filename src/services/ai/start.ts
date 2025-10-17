import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';
import { config } from 'dotenv';

// Configuration de dotenv avec le chemin correct
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Charger .env par défaut
config();

// Charger .env.local si présent (ne pas écraser les variables déjà définies)
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
    config({ path: envLocalPath });
}

import { PrismaClient } from '@prisma/client';
import { AIService } from './AIService';
import { WhatsAppService } from './WhatsAppService';
import { VoiceTranscriptionService } from './VoiceTranscriptionService';
import express, { Request, Response } from 'express';
import { generateApiToken } from '../../../lib/api-token.ts';

const app = express();
// En prod (Railway), utiliser PORT. En local, AI_PORT (ou 3001)
const port = Number(process.env.PORT || process.env.AI_PORT || '3001');

async function startAIService() {
    const prisma = new PrismaClient();
    const aiService = new AIService();
    const whatsappService = new WhatsAppService();
    const voiceService = new VoiceTranscriptionService();

    // Helper: get or create API token with journaling scopes
    async function getOrCreateApiTokenForUser(userId: string): Promise<string> {
        const required = ['deepwork:read', 'deepwork:write', 'tasks:read', 'tasks:write', 'journal:read', 'journal:write']
        const existing = await prisma.apiToken.findFirst({
            where: { userId, scopes: { hasEvery: required } },
            orderBy: { createdAt: 'desc' }
        })
        if (existing?.token) return existing.token
        const { token } = await generateApiToken({ name: 'Agent IA (Deep Work + Journal)', userId, scopes: required })
        return token
    }

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
                    let userIdForToken: string | null = null;

                    if (messageType === 'text') {
                        // Message texte classique
                        textToProcess = message.text?.body || '';
                        console.log('📝 Texte:', textToProcess);

                        // Commandes journaling (résumé / conseils)
                        try {
                            const lowerCmd = (textToProcess || '').toLowerCase();
                            const phone = String(from).replace(/\D/g, '');
                            const user = await prisma.user.findFirst({ where: { whatsappNumber: { equals: phone } } });
                            if (user?.id) {
                                const apiToken = await getOrCreateApiTokenForUser(user.id);
                                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

                                // Résumé des 7 derniers jours
                                if ((lowerCmd.includes('résumé') || lowerCmd.includes('resume')) && lowerCmd.includes('journal')) {
                                    const resp = await fetch(`${appUrl}/api/journal/agent?days=7`, {
                                        headers: { 'Authorization': `Bearer ${apiToken}` }
                                    });
                                    const data = await resp.json().catch(() => ({}));
                                    const entries = Array.isArray(data.entries) ? data.entries : [];
                                    if (entries.length === 0) {
                                        await whatsappService.sendMessage(from, "📔 Tu n'as pas encore d'entrées de journal.\n\nEnvoie-moi un vocal ce soir pour commencer ! 🎙️");
                                    } else {
                                        let msg = `📊 **Tes 7 derniers jours**\n\n`;
                                        entries.forEach((entry: any) => {
                                            const date = new Date(entry.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
                                            const emoji = entry.sentiment === 'positive' ? '😊' : entry.sentiment === 'negative' ? '😔' : '😐';
                                            msg += `${emoji} **${date}**\n`;
                                            if (entry.highlights?.length > 0) msg += `✨ ${entry.highlights[0]}\n`;
                                            msg += `\n`;
                                        });
                                        await whatsappService.sendMessage(from, msg);
                                    }
                                    return res.sendStatus(200);
                                }

                                // Conseils du jour
                                if (lowerCmd.includes('conseil')) {
                                    const resp = await fetch(`${appUrl}/api/journal/insights`, {
                                        headers: { 'Authorization': `Bearer ${apiToken}` }
                                    });
                                    const data = await resp.json().catch(() => ({}));
                                    const insight = data.insight;
                                    if (!insight || !Array.isArray(insight.recommendations) || insight.recommendations.length === 0) {
                                        await whatsappService.sendMessage(from, "💡 Continue à noter tes journées pendant quelques jours, je pourrai ensuite te donner des conseils personnalisés ! 📈");
                                    } else {
                                        let messageOut = `🌅 **Tes axes d'amélioration**\n\n`;
                                        if (Array.isArray(insight.focusAreas) && insight.focusAreas.length > 0) {
                                            messageOut += `🎯 **Concentre-toi sur :**\n`;
                                            for (const area of insight.focusAreas) messageOut += `• ${area}\n`;
                                            messageOut += `\n`;
                                        }
                                        messageOut += `💡 **Mes recommandations :**\n`;
                                        insight.recommendations.forEach((rec: string, idx: number) => { messageOut += `${idx + 1}. ${rec}\n`; });
                                        await whatsappService.sendMessage(from, messageOut);
                                    }
                                    return res.sendStatus(200);
                                }
                            }
                        } catch (e) {
                            console.error('Erreur commandes journaling (texte):', e);
                        }

                        // Déclencheur explicite pour le journal (sans impacter les autres fonctionnalités)
                        const lower = (textToProcess || '').toLowerCase();
                        const journalTriggers = [
                            'note de sa journée',
                            'note de ma journée',
                            'journal de ma journée',
                            'journal de sa journée',
                            'journal de la journée',
                            'journal de journée',
                            'journal journée',
                            'habitude note de sa journée',
                            'habitude note de ma journée'
                        ];
                        const hasJournalTrigger = journalTriggers.some(t => lower.includes(t));

                        if (hasJournalTrigger) {
                            try {
                                const phone = String(from).replace(/\D/g, '');
                                const user = await prisma.user.findFirst({ where: { whatsappNumber: { equals: phone } } });
                                if (user?.id) {
                                    const apiToken = await getOrCreateApiTokenForUser(user.id);
                                    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                                    const payload = { transcription: textToProcess, date: new Date().toISOString() };
                                    console.log('📔 Journaling (text) POST', { appUrl, path: '/api/journal/agent' });
                                    const resp = await fetch(`${appUrl}/api/journal/agent`, {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': `Bearer ${apiToken}`,
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify(payload)
                                    });
                                    const text = await resp.text();
                                    console.log('📔 Journaling (text) response', { status: resp.status, textLength: text.length });

                                    await whatsappService.sendMessage(
                                        from,
                                        "📔 Journal noté. Je l'analyse et te donnerai des insights demain matin 🌅\n\nTu peux aussi écrire 'résumé journal' ou 'conseils du jour'."
                                    );
                                    return res.sendStatus(200);
                                }
                            } catch (e) {
                                console.error('Erreur journal via texte:', e);
                            }
                        }
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

                                // Tenter d'associer l'utilisateur par numéro WhatsApp
                                const phone = String(from).replace(/\D/g, '');
                                const user = await prisma.user.findFirst({ where: { whatsappNumber: { equals: phone } } });
                                if (user?.id) {
                                    userIdForToken = user.id;
                                    try {
                                        const apiToken = await getOrCreateApiTokenForUser(user.id);
                                        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                                        const payload = {
                                            transcription: textToProcess,
                                            date: new Date().toISOString()
                                        };
                                        console.log('📔 Journaling (audio) POST', { appUrl, path: '/api/journal/agent' });
                                        const resp = await fetch(`${appUrl}/api/journal/agent`, {
                                            method: 'POST',
                                            headers: {
                                                'Authorization': `Bearer ${apiToken}`,
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify(payload)
                                        });
                                        const text = await resp.text();
                                        console.log('📔 Journaling (audio) response', { status: resp.status, textLength: text.length });
                                    } catch (e) {
                                        console.error('Erreur envoi au journal agent (audio):', e);
                                    }
                                }
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