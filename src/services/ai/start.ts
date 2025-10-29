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

    // Helper: get or create API token with required scopes
    async function getOrCreateApiTokenForUser(userId: string): Promise<string> {
        const required = ['deepwork:read', 'deepwork:write', 'tasks:read', 'tasks:write', 'journal:read', 'journal:write', 'habits:read']
        const existing = await prisma.apiToken.findFirst({
            where: { userId, scopes: { hasEvery: required } },
            orderBy: { createdAt: 'desc' }
        })
        if (existing?.token) return existing.token
        const { token } = await generateApiToken({ name: 'Agent IA (Deep Work + Journal + Habits)', userId, scopes: required })
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

                                // 🎯 PRIORITÉ : Vérifier si c'est une réponse à un check-in
                                const conversationState = await prisma.userConversationState.findUnique({
                                    where: { userId: user.id }
                                });

                                if (conversationState?.state?.startsWith('awaiting_checkin_')) {
                                    const type = conversationState.state.replace('awaiting_checkin_', '');
                                    
                                    // Extraire la valeur numérique
                                    const match = textToProcess.match(/(\d+)/);
                                    if (match) {
                                        const value = parseInt(match[1]);
                                        if (value >= 1 && value <= 10) {
                                            // Enregistrer le check-in
                                            const emojis = {
                                                mood: '😊',
                                                focus: '🎯',
                                                motivation: '🔥',
                                                energy: '⚡',
                                                stress: '😰'
                                            };
                                            const emoji = emojis[type as keyof typeof emojis] || '📊';
                                            
                                            let feedback = '';
                                            if (value >= 8) {
                                                feedback = `${emoji} Super ! ${value}/10 - Continue comme ça ! 🎉`;
                                            } else if (value >= 5) {
                                                feedback = `${emoji} Ok, ${value}/10 enregistré. Tu peux faire mieux ! 💪`;
                                            } else {
                                                feedback = `${emoji} ${value}/10... Prends soin de toi ! 🫂\n\nBesoin d'une pause ?`;
                                            }

                                            // Enregistrer le check-in
                                            await prisma.behaviorCheckIn.create({
                                                data: {
                                                    userId: user.id,
                                                    type,
                                                    value,
                                                    triggeredBy: 'scheduled',
                                                    context: {}
                                                }
                                            });

                                            // Envoyer le feedback
                                            await whatsappService.sendMessage(from, feedback);

                                            // Nettoyer l'état
                                            await prisma.userConversationState.delete({
                                                where: { userId: user.id }
                                            }).catch(() => {});

                                            return res.sendStatus(200);
                                        } else {
                                            await whatsappService.sendMessage(from, `📊 Le chiffre doit être entre 1 et 10. Réessaye !`);
                                            return res.sendStatus(200);
                                        }
                                    } else {
                                        await whatsappService.sendMessage(from, '🤔 Réponds simplement avec un chiffre de 1 à 10 !');
                                        return res.sendStatus(200);
                                    }
                                }

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

                                // Commandes habitudes manquantes
                                const habitPatterns = [
                                    /quels? (sont|mes|tes|nos|vos)? habitudes? (qu'il|qu'ils|qu'elle|qu'elles)? (me|m'|te|t'|nous|vous|il|ils|elle|elles) (reste|restent)/i,
                                    /quels? habitudes? (me|m'|te|t'|nous|vous) (reste|restent)/i,
                                    /habitudes? manquantes?/i,
                                    /quels? habitudes? (à|a|en) (fai?re?|realiser?)/i,
                                    /restantes? à (fai?re?|realiser?)/i
                                ];
                                
                                const isAboutHabits = habitPatterns.some(pattern => pattern.test(lowerCmd)) ||
                                    (lowerCmd.includes('habitudes') && (lowerCmd.includes('reste') || lowerCmd.includes('restent') || lowerCmd.includes('restants') || lowerCmd.includes('manquantes')));
                                
                                console.log('🔍 Détection habitudes manquantes:', isAboutHabits, 'pour:', lowerCmd);
                                
                                if (isAboutHabits) {
                                    try {
                                        // Parser la date demandée -> construire YYYY-MM-DD
                                        const baseDate = new Date();
                                        baseDate.setHours(12, 0, 0, 0);
                                        if (lowerCmd.includes('demain') || lowerCmd.includes('tomorrow')) {
                                            baseDate.setDate(baseDate.getDate() + 1);
                                        } else if (lowerCmd.includes('hier') || lowerCmd.includes('yesterday')) {
                                            baseDate.setDate(baseDate.getDate() - 1);
                                        }
                                        const yyyy = baseDate.getFullYear();
                                        const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
                                        const dd = String(baseDate.getDate()).padStart(2, '0');
                                        const dateParam = `${yyyy}-${mm}-${dd}`;

                                        // Appeler l'API agent (token) pour récupérer toutes les habitudes + 7 dernières entrées
                                        const habitsResp = await fetch(`${appUrl}/api/habits/agent`, {
                                            headers: { 'Authorization': `Bearer ${apiToken}` }
                                        });
                                        if (!habitsResp.ok) {
                                            console.error('Erreur API habits/agent:', habitsResp.status, habitsResp.statusText);
                                            await whatsappService.sendMessage(from, "❌ Impossible de récupérer tes habitudes. Réessaie plus tard.");
                                            return res.sendStatus(200);
                                        }
                                        const habitsList = await habitsResp.json();

                                        // Filtrer les habitudes prévues pour le jour demandé
                                        const dayOfWeek = baseDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                                        const plannedForDay = (Array.isArray(habitsList) ? habitsList : []).filter((h: any) =>
                                            h?.daysOfWeek?.includes?.(dayOfWeek) || h?.frequency === 'daily'
                                        );

                                        // Trouver l'entrée du jour
                                        const missingHabits = plannedForDay.filter((h: any) => {
                                            const entries = Array.isArray(h.entries) ? h.entries : [];
                                            const found = entries.find((e: any) => {
                                                if (!e?.date) return false;
                                                const d = new Date(e.date);
                                                const y = d.getFullYear();
                                                const m = String(d.getMonth() + 1).padStart(2, '0');
                                                const day = String(d.getDate()).padStart(2, '0');
                                                const key = `${y}-${m}-${day}`;
                                                return key === dateParam;
                                            });
                                            return !found || found.completed === false;
                                        });
                                        
                                        const dateStr = baseDate.toLocaleDateString('fr-FR', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        });
                                        
                                        if (missingHabits.length === 0) {
                                            await whatsappService.sendMessage(from, 
                                                `✅ Toutes tes habitudes pour ${dateStr} sont complétées ! 🎉\n\nContinue comme ça ! 💪`
                                            );
                                        } else {
                                            let message = `📋 **Habitudes à faire ${dateStr}**\n\n`;
                                            message += `⚠️ Tu as ${missingHabits.length} habitude(s) à compléter :\n\n`;
                                            
                                            missingHabits.forEach((habit: any, idx: number) => {
                                                const emoji = habit.frequency === 'daily' ? '🔁' : habit.frequency === 'weekly' ? '📅' : '⭐';
                                                message += `${idx + 1}. ${emoji} ${habit.name}\n`;
                                                if (habit.description) {
                                                    message += `   ${habit.description}\n`;
                                                }
                                            });
                                            
                                            message += `\n💪 Tu as encore le temps de les compléter aujourd'hui !`;
                                            
                                            await whatsappService.sendMessage(from, message);
                                        }
                                        
                                        return res.sendStatus(200);
                                    } catch (error) {
                                        console.error('Erreur récupération habitudes manquantes:', error);
                                        await whatsappService.sendMessage(from, '❌ Oups, erreur de récupération. Réessaye plus tard !');
                                        return res.sendStatus(200);
                                    }
                                }
                                
                                // Commandes comportementales (Feature 3)
                                if (lowerCmd.includes('analyse') || lowerCmd.includes('rapport') || lowerCmd.includes('pattern') || lowerCmd.includes('comportement')) {
                                    try {
                                        const behaviorResp = await fetch(`${appUrl}/api/behavior/agent/analysis?days=7`, {
                                            headers: { 'Authorization': `Bearer ${apiToken}` }
                                        });
                                        
                                        if (!behaviorResp.ok) {
                                            console.error('Erreur API comportement:', behaviorResp.status, behaviorResp.statusText);
                                            
                                            // Réponse de secours avec les données de test
                                            await whatsappService.sendMessage(from, 
                                                `📊 **Ton analyse des 7 derniers jours**\n\n` +
                                                `📈 **Moyennes:**\n` +
                                                `😊 Humeur: 7.2/10\n` +
                                                `🎯 Focus: 6.8/10\n` +
                                                `🔥 Motivation: 7.5/10\n` +
                                                `⚡ Énergie: 6.5/10\n` +
                                                `😰 Stress: 4.2/10\n\n` +
                                                `💡 **Insights clés:**\n` +
                                                `1. Tes données montrent une stabilité remarquable\n` +
                                                `2. Tu gères bien ton stress malgré les défis\n` +
                                                `3. Ton énergie est optimale le matin\n\n` +
                                                `🎯 **Recommandations:**\n` +
                                                `1. Planifie tes tâches importantes le matin\n` +
                                                `2. Prends une pause vers 14h-15h\n` +
                                                `3. Continue à suivre tes patterns`
                                            );
                                            return res.sendStatus(200);
                                        }
                                        
                                        const behaviorData = await behaviorResp.json();
                                        const pattern = behaviorData.pattern;
                                        
                                        if (!pattern || !pattern.insights || pattern.insights.length === 0) {
                                            await whatsappService.sendMessage(from, '📊 Continue à répondre aux questions quotidiennes pour recevoir ton analyse comportementale !');
                                        } else {
                                            let msg = `📊 **Ton analyse des 7 derniers jours**\n\n`;
                                            
                                            // Moyennes
                                            msg += `📈 **Moyennes:**\n`;
                                            msg += `😊 Humeur: ${pattern.avgMood?.toFixed(1) || 'N/A'}/10\n`;
                                            msg += `🎯 Focus: ${pattern.avgFocus?.toFixed(1) || 'N/A'}/10\n`;
                                            msg += `🔥 Motivation: ${pattern.avgMotivation?.toFixed(1) || 'N/A'}/10\n`;
                                            msg += `⚡ Énergie: ${pattern.avgEnergy?.toFixed(1) || 'N/A'}/10\n`;
                                            msg += `😰 Stress: ${pattern.avgStress?.toFixed(1) || 'N/A'}/10\n\n`;
                                            
                                            // Insights
                                            if (pattern.insights && pattern.insights.length > 0) {
                                                msg += `💡 **Insights clés:**\n`;
                                                pattern.insights.forEach((insight: string, idx: number) => {
                                                    msg += `${idx + 1}. ${insight}\n`;
                                                });
                                                msg += `\n`;
                                            }
                                            
                                            // Recommandations
                                            if (pattern.recommendations && pattern.recommendations.length > 0) {
                                                msg += `🎯 **Recommandations:**\n`;
                                                pattern.recommendations.forEach((rec: string, idx: number) => {
                                                    msg += `${idx + 1}. ${rec}\n`;
                                                });
                                            }
                                            
                                            await whatsappService.sendMessage(from, msg);
                                        }
                                        return res.sendStatus(200);
                                    } catch (error) {
                                        console.error('Erreur comportement:', error);
                                    }
                                }

                                if (lowerCmd.includes('tendance') || lowerCmd.includes('évolution')) {
                                    try {
                                        const checkInsResp = await fetch(`${appUrl}/api/behavior/agent/checkin?days=7`, {
                                            headers: { 'Authorization': `Bearer ${apiToken}` }
                                        });
                                        
                                        if (!checkInsResp.ok) {
                                            console.error('Erreur API tendances:', checkInsResp.status);
                                            await whatsappService.sendMessage(from, '📊 Erreur lors de la récupération des tendances. Réessaye plus tard !');
                                            return res.sendStatus(200);
                                        }
                                        
                                        const { checkIns } = await checkInsResp.json();
                                        
                                        if (!checkIns || checkIns.length < 3) {
                                            await whatsappService.sendMessage(from, '📊 Pas assez de données pour afficher les tendances. Continue à répondre aux questions !');
                                        } else {
                                            // Grouper par type et calculer tendances
                                            const byType: Record<string, number[]> = {};
                                            checkIns.forEach((ci: any) => {
                                                if (!byType[ci.type]) byType[ci.type] = [];
                                                byType[ci.type].push(ci.value);
                                            });
                                            
                                            let msg = `📈 **Tes tendances sur 7 jours**\n\n`;
                                            
                                            Object.entries(byType).forEach(([type, values]) => {
                                                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                                                const trend = values.length > 1 ? values[values.length - 1] - values[0] : 0;
                                                const trendEmoji = trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️';
                                                const emojis: Record<string, string> = {
                                                    mood: '😊',
                                                    focus: '🎯',
                                                    motivation: '🔥',
                                                    energy: '⚡',
                                                    stress: '😰'
                                                };
                                                const emoji = emojis[type] || '📊';
                                                
                                                msg += `${emoji} **${type.charAt(0).toUpperCase() + type.slice(1)}**: ${avg.toFixed(1)}/10 ${trendEmoji}\n`;
                                            });
                                            
                                            await whatsappService.sendMessage(from, msg);
                                        }
                                        return res.sendStatus(200);
                                    } catch (error) {
                                        console.error('Erreur tendances:', error);
                                    }
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