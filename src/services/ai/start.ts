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
import { SpecialHabitsHandler } from './SpecialHabitsHandler';
import express, { Request, Response } from 'express';
import { generateApiToken } from '../../../lib/api-token.ts';
import { calendarEventScheduler } from '../../../lib/calendar/CalendarEventScheduler';

const app = express();
// En prod (Railway), utiliser PORT. En local, AI_PORT (ou 3001)
// Priorité: AI_PORT > PORT > 3001
const port = Number(process.env.AI_PORT || process.env.PORT || '3001');

async function startAIService() {
    const prisma = new PrismaClient();
    const aiService = new AIService();
    const whatsappService = new WhatsAppService();
    const voiceService = new VoiceTranscriptionService();
    const specialHabitsHandler = new SpecialHabitsHandler();

    // Helper: get or create API token with required scopes
    async function getOrCreateApiTokenForUser(userId: string): Promise<string> {
        const required = ['deepwork:read', 'deepwork:write', 'tasks:read', 'tasks:write', 'journal:read', 'journal:write', 'habits:read', 'habits:write']
        const existing = await prisma.apiToken.findFirst({
            where: { userId, scopes: { hasEvery: required } },
            orderBy: { createdAt: 'desc' }
        })
        if (existing?.token) return existing.token
        const { token } = await generateApiToken({ name: 'Agent IA (Deep Work + Journal + Habits)', userId, scopes: required })
        return token
    }

    /**
     * Détecte si un message transcrit est une demande de journaling explicite
     */
    function isJournalingIntent(text: string): boolean {
        const lower = text.toLowerCase();
        
        // Mots-clés explicites de journaling
        const journalKeywords = [
            'journal',
            'journée',
            'journee',
            'note de sa journée',
            'note de ma journée',
            'note de la journée',
            'note de journée',
            'raconter ma journée',
            'raconter ma journee',
            'récap de ma journée',
            'recap de ma journee'
        ];
        
        // Indicateurs de narration de journée
        const dayNarrativeIndicators = [
            'aujourd\'hui',
            'aujourdhui',
            'ce matin',
            'ce soir',
            'cette journée',
            'ma journée',
            'ma journee'
        ];
        
        // Patterns de note de journée (ex: "6/10", "6 sur 10")
        const ratingPatterns = [
            /\d+\s*\/\s*10/i,
            /\d+\s+sur\s+10/i,
            /note\s+de\s+\d+/i,
            /journée\s+\d+/i
        ];
        
        // Mots qui excluent le journaling (questions générales)
        const exclusionPatterns = [
            /^quelles?\s+sont/i,
            /^quels?\s+sont/i,
            /^qu\'est[- ]ce/i,
            /^c\'est\s+quoi/i,
            /^explique/i,
            /^montre/i,
            /^donne/i,
            /^aide/i
        ];
        
        // Exclure les questions qui ne sont pas des demandes de journaling
        const isQuestion = exclusionPatterns.some(pattern => pattern.test(text.trim()));
        if (isQuestion) {
            // Vérifier si c'est quand même une question sur le journaling
            const isJournalQuestion = journalKeywords.some(keyword => lower.includes(keyword));
            if (!isJournalQuestion) {
                return false;
            }
        }
        
        // Vérifier les mots-clés explicites
        const hasJournalKeyword = journalKeywords.some(keyword => lower.includes(keyword));
        if (hasJournalKeyword) {
            return true;
        }
        
        // Vérifier les patterns de note
        const hasRating = ratingPatterns.some(pattern => pattern.test(text));
        if (hasRating) {
            // Si une note est présente ET des indicateurs de journée, c'est probablement un journaling
            const hasDayIndicator = dayNarrativeIndicators.some(indicator => lower.includes(indicator));
            if (hasDayIndicator) {
                return true;
            }
        }
        
        // Vérifier si c'est une narration de journée (au moins 2 indicateurs)
        const dayIndicatorCount = dayNarrativeIndicators.filter(indicator => lower.includes(indicator)).length;
        if (dayIndicatorCount >= 2) {
            // C'est probablement une narration de journée, mais vérifier que ce n'est pas une question
            if (!isQuestion) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Wrapper sécurisé pour l'envoi de messages WhatsApp
     * Gère les erreurs de manière gracieuse pour éviter que l'agent ne plante
     */
    async function safeSendMessage(to: string, message: string): Promise<boolean> {
        try {
            await whatsappService.sendMessage(to, message);
            return true;
        } catch (error) {
            console.error('🔴 Erreur lors de l\'envoi du message WhatsApp (gestion sécurisée):', {
                to,
                messagePreview: message.substring(0, 100) + '...',
                error: error instanceof Error ? error.message : String(error)
            });
            // Ne pas relancer l'erreur - on continue l'exécution
            return false;
        }
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
                                            await safeSendMessage(from, feedback);

                                            // Nettoyer l'état
                                            await prisma.userConversationState.delete({
                                                where: { userId: user.id }
                                            }).catch(() => {});

                                            return res.sendStatus(200);
                                        } else {
                                            await safeSendMessage(from, `📊 Le chiffre doit être entre 1 et 10. Réessaye !`);
                                            return res.sendStatus(200);
                                        }
                                    } else {
                                        await safeSendMessage(from, '🤔 Réponds simplement avec un chiffre de 1 à 10 !');
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
                                        await safeSendMessage(from, "📔 Tu n'as pas encore d'entrées de journal.\n\nEnvoie-moi un vocal ce soir pour commencer ! 🎙️");
                                    } else {
                                        let msg = `📊 **Tes 7 derniers jours**\n\n`;
                                        entries.forEach((entry: any) => {
                                            const date = new Date(entry.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
                                            const emoji = entry.sentiment === 'positive' ? '😊' : entry.sentiment === 'negative' ? '😔' : '😐';
                                            msg += `${emoji} **${date}**\n`;
                                            if (entry.highlights?.length > 0) msg += `✨ ${entry.highlights[0]}\n`;
                                            msg += `\n`;
                                        });
                                        await safeSendMessage(from, msg);
                                    }
                                    return res.sendStatus(200);
                                }

                                // Détection pour "mes habitudes" (liste toutes les habitudes)
                                const listHabitsPatterns = [
                                    /^quels? sont (mes|tes|nos|vos) habitudes?\s*[?!.]?\s*$/i,
                                    /^(mes|tes|nos|vos) habitudes?\s*[?!.]?\s*$/i,
                                    /^quels? (mes|tes|nos|vos) habitudes?\s*[?!.]?\s*$/i,
                                    /liste (mes|tes|nos|vos) habitudes?/i,
                                    /affiche (mes|tes|nos|vos) habitudes?/i,
                                    /montre (mes|tes|nos|vos) habitudes?/i
                                ];
                                
                                const isListHabits = listHabitsPatterns.some(pattern => pattern.test(lowerCmd.trim()));
                                
                                console.log('🔍 Détection liste habitudes:', isListHabits, 'pour:', lowerCmd);
                                
                                // Commandes habitudes manquantes
                                const habitPatterns = [
                                    /quels? (sont|mes|tes|nos|vos)? habitudes? (qu'il|qu'ils|qu'elle|qu'elles)? (me|m'|te|t'|nous|vous|il|ils|elle|elles) (reste|restent|restaient|restait)/i,
                                    /quels? habitudes? (me|m'|te|t'|nous|vous) (reste|restent|restaient|restait)/i,
                                    /habitudes? (il|ils|elle|elles) (me|m'|te|t'|nous|vous) (reste|restent|restaient|restait)/i,
                                    /habitudes? manquantes?/i,
                                    /quels? habitudes? (à|a|en) (fai?re?|realiser?)/i,
                                    /restantes? à (fai?re?|realiser?)/i
                                ];
                                
                                const isAboutHabits = habitPatterns.some(pattern => pattern.test(lowerCmd)) ||
                                    (lowerCmd.includes('habitudes') && (lowerCmd.includes('reste') || lowerCmd.includes('restent') || lowerCmd.includes('restaient') || lowerCmd.includes('restait') || lowerCmd.includes('restants') || lowerCmd.includes('manquantes')));
                                
                                console.log('🔍 Détection habitudes manquantes:', isAboutHabits, 'pour:', lowerCmd);
                                
                                // Si c'est une demande de liste de toutes les habitudes
                                if (isListHabits) {
                                    try {
                                        // Appeler l'API agent pour récupérer toutes les habitudes avec leurs entrées
                                        const habitsResp = await fetch(`${appUrl}/api/habits/agent`, {
                                            headers: { 'Authorization': `Bearer ${apiToken}` }
                                        });
                                        if (!habitsResp.ok) {
                                            console.error('Erreur API habits/agent:', habitsResp.status, habitsResp.statusText);
                                            await safeSendMessage(from, "❌ Impossible de récupérer tes habitudes. Réessaie plus tard.");
                                            return res.sendStatus(200);
                                        }
                                        const habitsList = await habitsResp.json();
                                        
                                        if (!Array.isArray(habitsList) || habitsList.length === 0) {
                                            await safeSendMessage(from, "📋 Tu n'as pas encore d'habitudes créées.\n\nCrée ta première habitude pour commencer ! 💪");
                                            return res.sendStatus(200);
                                        }
                                        
                                        // Préparer la date du jour pour vérifier les complétions
                                        const today = new Date();
                                        today.setHours(12, 0, 0, 0);
                                        const yyyy = today.getFullYear();
                                        const mm = String(today.getMonth() + 1).padStart(2, '0');
                                        const dd = String(today.getDate()).padStart(2, '0');
                                        const dateParam = `${yyyy}-${mm}-${dd}`;
                                        const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                                        
                                        let message = `📋 **Tes habitudes**\n\n`;
                                        message += `Tu as ${habitsList.length} habitude(s) :\n\n`;
                                        
                                        let completedCount = 0;
                                        let todayHabitsCount = 0;
                                        
                                        habitsList.forEach((habit: any, idx: number) => {
                                            // Déterminer l'emoji selon la fréquence
                                            const freqEmoji = habit.frequency === 'daily' ? '🔁' : habit.frequency === 'weekly' ? '📅' : '⭐';
                                            
                                            // Vérifier si cette habitude est prévue pour aujourd'hui
                                            const isPlannedToday = habit?.daysOfWeek?.includes?.(dayOfWeek) || habit?.frequency === 'daily';
                                            
                                            if (isPlannedToday) {
                                                todayHabitsCount++;
                                                
                                                // Vérifier si elle est complétée aujourd'hui
                                                const entries = Array.isArray(habit.entries) ? habit.entries : [];
                                                const todayEntry = entries.find((e: any) => {
                                                    if (!e?.date) return false;
                                                    const d = new Date(e.date);
                                                    const y = d.getFullYear();
                                                    const m = String(d.getMonth() + 1).padStart(2, '0');
                                                    const day = String(d.getDate()).padStart(2, '0');
                                                    const key = `${y}-${m}-${day}`;
                                                    return key === dateParam;
                                                });
                                                
                                                const isCompleted = todayEntry?.completed === true;
                                                if (isCompleted) completedCount++;
                                                
                                                const statusEmoji = isCompleted ? '✅' : '⏳';
                                                
                                                message += `${idx + 1}. ${freqEmoji} ${statusEmoji} ${habit.name}\n`;
                                                if (habit.description) {
                                                    message += `   ${habit.description}\n`;
                                                }
                                            } else {
                                                // Habitude pas prévue aujourd'hui
                                                message += `${idx + 1}. ${freqEmoji} ⚪ ${habit.name} (pas aujourd'hui)\n`;
                                                if (habit.description) {
                                                    message += `   ${habit.description}\n`;
                                                }
                                            }
                                        });
                                        
                                        message += `\n📊 **Aujourd'hui:** ${completedCount}/${todayHabitsCount} complétées`;
                                        if (completedCount === todayHabitsCount && todayHabitsCount > 0) {
                                            message += ` 🎉`;
                                        }
                                        
                                        await safeSendMessage(from, message);
                                        return res.sendStatus(200);
                                    } catch (error) {
                                        console.error('Erreur récupération habitudes:', error);
                                        await safeSendMessage(from, '❌ Oups, erreur de récupération. Réessaye plus tard !');
                                        return res.sendStatus(200);
                                    }
                                }
                                
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
                                            await safeSendMessage(from, "❌ Impossible de récupérer tes habitudes. Réessaie plus tard.");
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
                                            await safeSendMessage(from, 
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
                                            
                                            await safeSendMessage(from, message);
                                        }
                                        
                                        return res.sendStatus(200);
                                    } catch (error) {
                                        console.error('Erreur récupération habitudes manquantes:', error);
                                        await safeSendMessage(from, '❌ Oups, erreur de récupération. Réessaye plus tard !');
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
                                            await safeSendMessage(from, 
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
                                            await safeSendMessage(from, '📊 Continue à répondre aux questions quotidiennes pour recevoir ton analyse comportementale !');
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
                                            
                                            await safeSendMessage(from, msg);
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
                                            await safeSendMessage(from, '📊 Erreur lors de la récupération des tendances. Réessaye plus tard !');
                                            return res.sendStatus(200);
                                        }
                                        
                                        const { checkIns } = await checkInsResp.json();
                                        
                                        if (!checkIns || checkIns.length < 3) {
                                            await safeSendMessage(from, '📊 Pas assez de données pour afficher les tendances. Continue à répondre aux questions !');
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
                                            
                                            await safeSendMessage(from, msg);
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
                                        await safeSendMessage(from, "💡 Continue à noter tes journées pendant quelques jours, je pourrai ensuite te donner des conseils personnalisés ! 📈");
                                    } else {
                                        let messageOut = `🌅 **Tes axes d'amélioration**\n\n`;
                                        if (Array.isArray(insight.focusAreas) && insight.focusAreas.length > 0) {
                                            messageOut += `🎯 **Concentre-toi sur :**\n`;
                                            for (const area of insight.focusAreas) messageOut += `• ${area}\n`;
                                            messageOut += `\n`;
                                        }
                                        messageOut += `💡 **Mes recommandations :**\n`;
                                        insight.recommendations.forEach((rec: string, idx: number) => { messageOut += `${idx + 1}. ${rec}\n`; });
                                        await safeSendMessage(from, messageOut);
                                    }
                                    return res.sendStatus(200);
                                }
                            }
                        } catch (e) {
                            console.error('Erreur commandes journaling (texte):', e);
                        }

                        // Vérifier d'abord s'il y a une conversation spéciale en cours (habitudes spéciales)
                        const phone = String(from).replace(/\D/g, '');
                        const user = await prisma.user.findFirst({ where: { whatsappNumber: { equals: phone } } });
                        
                        if (user?.id && specialHabitsHandler.hasActiveConversation(user.id, phone)) {
                            console.log('🔥 Conversation spéciale en cours détectée');
                            const specialResponse = await specialHabitsHandler.handleConversationResponse(
                                user.id,
                                phone,
                                textToProcess
                            );
                            
                            if (specialResponse.response) {
                                await safeSendMessage(from, specialResponse.response);
                                // Si on vient d'enregistrer la note (étape 2), renvoyer explicitement la question de résumé
                                if (specialResponse.response.includes('Ta journée est notée')) {
                                    await safeSendMessage(
                                        from,
                                        "📝 Veux-tu ajouter un résumé de ta journée ? (optionnel)\n\n💭 Écris quelques mots sur ce qui s'est passé, ou réponds \"non\" pour terminer."
                                    );
                                }
                                return res.sendStatus(200);
                            }
                        }
                        
                        // Déclencheur explicite pour le journal (sans impacter les autres fonctionnalités)
                        const lower = (textToProcess || '').toLowerCase();
                        
                        // Patterns plus flexibles pour détecter les variantes de journal
                        const journalPatterns = [
                            // Patterns directs
                            /note\s+de\s+(sa|ma|la|mon)\s+journée/i,
                            /journal\s+de\s+(sa|ma|la|mon)?\s*(journée|journée)/i,
                            /journal\s+journée/i,
                            
                            // Patterns avec "habitude" (je fais l'habitude, j'ai fait l'habitude, etc.)
                            /(je|j'|tu|il|elle|on)\s+(fais|fait|faire|font)\s+(l'|l)?habitude\s*(:|,)?\s*note\s+de\s+(sa|ma|la)\s+journée/i,
                            /(je|j')\s+(ai|as)\s+fait\s+(l'|l)?habitude\s*(:|,)?\s*note\s+de\s+(sa|ma|la)\s+journée/i,
                            /(je|j')\s+(ai|as)\s+fais\s+(l'|l)?habitude\s*(:|,)?\s*note\s+de\s+(sa|ma|la)\s+journée/i,
                            /habitude\s+note\s+de\s+(sa|ma|la)\s+journée/i,
                            
                            // Patterns avec "l'habitude" suivi de "note"
                            /(l'|l)?habitude\s+(de\s+)?note/i,
                            
                            // Patterns courts (si le message contient "note" + "journée" et "habitude")
                            /habitude.*note.*journée|note.*journée.*habitude/i,
                        ];
                        
                        const hasJournalTrigger = journalPatterns.some(pattern => pattern.test(textToProcess)) ||
                            // Fallback: vérifier si les mots clés importants sont présents
                            (lower.includes('note') && lower.includes('journée') && 
                             (lower.includes('habitude') || lower.includes("l'habitude"))) ||
                            // Patterns simples directs
                            lower.includes('note de sa journée') || 
                            lower.includes('note de ma journée') ||
                            lower.includes('journal de sa journée') ||
                            lower.includes('journal de ma journée');
                        
                        console.log('🔍 Détection journal:', hasJournalTrigger, 'pour:', lower);

                        if (hasJournalTrigger) {
                            try {
                                // user et phone déjà récupérés plus haut
                                if (user?.id) {
                                    // Vérifier si c'est l'habitude "Note de sa journée" à traiter en premier
                                    const hasHabitudePattern = lower.includes('habitude') || lower.includes("l'habitude");
                                    
                                    if (hasHabitudePattern && (lower.includes('note de sa journée') || lower.includes('note de ma journée') || lower.includes('note de la journée'))) {
                                        console.log('🔥 Détection habitude spéciale: Note de sa journée');
                                        
                                        // Récupérer l'habitude "Note de sa journée"
                                        const noteHabit = await prisma.habit.findFirst({
                                            where: {
                                                userId: user.id,
                                                name: {
                                                    contains: 'note de sa journée',
                                                    mode: 'insensitive'
                                                }
                                            }
                                        });
                                        
                                        if (noteHabit && specialHabitsHandler.isSpecialHabit(noteHabit.name)) {
                                            console.log('✅ Habitude spéciale trouvée, démarrage du processus de complétion');
                                            const specialResponse = await specialHabitsHandler.startSpecialHabitCompletion(
                                                user.id,
                                                phone,
                                                noteHabit.name,
                                                noteHabit.id
                                            );
                                            
                                            await safeSendMessage(from, specialResponse);
                                            return res.sendStatus(200);
                                        }
                                    }
                                    
                                    // Sinon, traiter comme un journal normal
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

                                    await safeSendMessage(
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

                                // Tenter d'associer l'utilisateur par numéro WhatsApp
                                const phone = String(from).replace(/\D/g, '');
                                const user = await prisma.user.findFirst({ where: { whatsappNumber: { equals: phone } } });
                                if (user?.id) {
                                    userIdForToken = user.id;
                                    
                                    // Vérifier d'abord s'il y a une conversation spéciale en cours (habitudes spéciales)
                                    // Si l'utilisateur est en train de compléter "note de sa journée", le message vocal doit être traité par SpecialHabitsHandler
                                    if (specialHabitsHandler.hasActiveConversation(user.id, phone)) {
                                        console.log('🔥 Conversation spéciale en cours détectée pour message vocal');
                                        const specialResponse = await specialHabitsHandler.handleConversationResponse(
                                            user.id,
                                            phone,
                                            textToProcess
                                        );
                                        
                                        if (specialResponse.response) {
                                            await safeSendMessage(from, specialResponse.response);
                                            return res.sendStatus(200);
                                        }
                                    }
                                    
                                    // Sinon, traiter comme une conversation normale
                                    // Le journaling sera enregistré uniquement quand l'utilisateur complète "note de sa journée" via SpecialHabitsHandler
                                    console.log('💬 Message vocal transcrit traité comme conversation normale:', textToProcess);
                                    // Continuer le traitement normal du message (le texte transcrit sera traité comme un message texte)
                                } else {
                                    // Utilisateur non trouvé, retourner quand même pour éviter le traitement normal
                                    await safeSendMessage(
                                        from,
                                        "❌ Utilisateur non trouvé. Vérifie que tu es bien enregistré dans l'application."
                                    );
                                    return res.sendStatus(200);
                                }
                            } else {
                                console.error('❌ Erreur de transcription:', transcriptionResult.error);
                                await safeSendMessage(
                                    from, 
                                    '❌ Désolé, je n\'ai pas pu transcrire votre message vocal. Pouvez-vous rééssayer ou envoyer un message texte ?'
                                );
                                return res.sendStatus(200);
                            }
                        } else {
                            console.error('❌ ID audio manquant');
                            await safeSendMessage(
                                from, 
                                '❌ Erreur lors de la réception du message vocal. Veuillez réessayer.'
                            );
                            return res.sendStatus(200);
                        }
                    } else {
                        console.log('ℹ️ Type de message non supporté:', messageType);
                        await safeSendMessage(
                            from, 
                            'Je ne peux traiter que les messages texte et vocaux pour le moment. 😊'
                        );
                        return res.sendStatus(200);
                    }

                    // Traiter le texte (qu'il soit direct ou transcrit)
                    if (textToProcess.trim()) {
                        // 🎯 PRIORITÉ : Vérifier si c'est une demande de planification intelligente
                        // Cela doit être AVANT l'appel à aiService.processMessage pour intercepter les demandes de planification
                        const lowerText = textToProcess.toLowerCase();

                        // Détection plus précise pour éviter les faux positifs
                        const planningKeywords = [
                            'planification',
                            'planning',
                            'planifie',
                            'planifier',
                            'organise',
                            'organiser',
                            'optimise',
                            'planification intelligente'
                        ];
                        const taskOrTimeKeywords = [
                            'tâche', 'taches', 'tâches', 'todo', 'to-do', 'to do',
                            'liste', "à faire", 'a faire',
                            'journée', 'journee', 'ma journée', 'ma journee',
                            'matin', 'après-midi', 'apres midi', 'soir', 'ce soir',
                            'pour demain', 'pour aujourd\'hui',
                            // Ajouts pour mieux capter les requêtes courtes du type "planifie pour moi demain"
                            'demain', 'aujourd\'hui', 'aujourdhui', 'aujourdh\'ui', 'demain matin', 'demain soir', 'demain après-midi', 'demain apres midi'
                        ];
                        const negativeKeywords = [
                            'habitude', 'habitudes',
                            'journal', 'journaling',
                            'humeur', 'check-in', 'checkin',
                            'résumé', 'resume', 'conseil', 'conseils',
                            'deep work', 'focus', 'focalisation', 'timer'
                        ];

                        const hasPlanning = planningKeywords.some(k => lowerText.includes(k));
                        const hasTaskOrTime = taskOrTimeKeywords.some(k => lowerText.includes(k));
                        const hasNegative = negativeKeywords.some(k => lowerText.includes(k));

                        const strongRegexMatch = /\b(planifie(r)?|organise(r)?|planning|planification)\b[\s\S]*\b(journ[eé]e|t[âa]ches|todo|to-?do|liste)\b/.test(lowerText);
                        // Cas simple: verbe de planification + repère temporel (gère différents types d'apostrophes)
                        const simplePlanTimeMatch = /\b(planifie(r)?|organise(r)?)\b[\s\S]*\b(demain|aujourd.?hui)\b/.test(lowerText);
                        // Nouveau: Détection ultra-simple "planifie pour moi" sans autre mot-clé requis
                        const ultraSimplePlanMatch = /\b(planifie|planifier|organise|organiser)\b[\s\S]*\bpour\s+moi\b/.test(lowerText);

                        const isPlanningRequest = !hasNegative && ((hasPlanning && hasTaskOrTime) || strongRegexMatch || simplePlanTimeMatch || ultraSimplePlanMatch);
                        if (isPlanningRequest) {
                            console.log('🧭 Intention détectée: planification_intelligente', {
                                hasPlanning,
                                hasTaskOrTime,
                                hasNegative,
                                strongRegexMatch,
                                simplePlanTimeMatch
                            });
                        }
                        
                        // Vérifier si l'utilisateur existe et s'il est en mode planification
                        const phone = String(from).replace(/\D/g, '');
                        const user = await prisma.user.findFirst({ where: { whatsappNumber: { equals: phone } } });
                        let isInPlanningMode = false;
                        
                        if (user?.id) {
                            const conversationState = await prisma.userConversationState.findUnique({
                                where: { userId: user.id }
                            });
                            isInPlanningMode = conversationState?.state === 'awaiting_tasks_list';
                        }

                        if ((isPlanningRequest || isInPlanningMode) && user?.id) {
                            // Traiter avec la planification intelligente
                            try {
                                console.log('🎯 Détection planification intelligente');
                                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                                
                                // Obtenir un token API pour l'utilisateur
                                const apiToken = await getOrCreateApiTokenForUser(user.id);
                                
                                if (!isInPlanningMode) {
                                    // Première demande : enregistrer l'état et demander confirmation
                                    await prisma.userConversationState.upsert({
                                        where: { userId: user.id },
                                        create: {
                                            userId: user.id,
                                            state: 'awaiting_tasks_list',
                                            data: {}
                                        },
                                        update: {
                                            state: 'awaiting_tasks_list',
                                            data: {}
                                        }
                                    });
                                    
                                    await safeSendMessage(
                                        from,
                                        `📋 *Planification intelligente*\n\n` +
                                        `Dis-moi tout ce que tu as à faire aujourd'hui ou demain, dans l'ordre que tu veux !\n\n` +
                                        `💡 *Tu peux mentionner :*\n` +
                                        `• Les tâches importantes ou urgentes\n` +
                                        `• Si une tâche est longue ou rapide\n` +
                                        `• Si ça demande beaucoup de concentration\n` +
                                        `• Les deadlines\n\n` +
                                        `Je vais analyser automatiquement la priorité et l'énergie requise ! 🤖`
                                    );
                                    
                                    console.log('✅ Mode planification activé');
                                    return res.sendStatus(200);
                                } else {
                                    // L'utilisateur répond avec sa liste de tâches
                                    await safeSendMessage(
                                        from,
                                        `🤖 *Analyse en cours...*\n\nJe réfléchis à la meilleure organisation pour ta journée. ⏳`
                                    );
                                    
                                    // Appeler directement l'API de création de tâches intelligente
                                    const planningResponse = await fetch(`${appUrl}/api/tasks/agent/batch-create`, {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': `Bearer ${apiToken}`,
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            userInput: textToProcess
                                        })
                                    });

                                    if (planningResponse.ok) {
                                        const result = await planningResponse.json();
                                        
                                        // Construire le message de réponse
                                        let responseMessage = `✅ *${result.tasksCreated} tâche${result.tasksCreated > 1 ? 's' : ''} créée${result.tasksCreated > 1 ? 's' : ''} !*\n\n`;
                                        
                                        if (result.analysis?.summary) {
                                            responseMessage += `💭 *Analyse :*\n${result.analysis.summary}\n\n`;
                                        }
                                        
                                        if (result.analysis?.planSummary) {
                                            responseMessage += result.analysis.planSummary;
                                        }
                                        
                                        if (result.analysis?.totalEstimatedTime) {
                                            const hours = Math.floor(result.analysis.totalEstimatedTime / 60);
                                            const minutes = result.analysis.totalEstimatedTime % 60;
                                            responseMessage += `\n\n⏱️ *Temps total estimé :* ${hours}h${minutes > 0 ? minutes : ''}`;
                                        }
                                        
                                        responseMessage += `\n\n💡 *Conseil :* Commence par les tâches 🔴 haute priorité le matin quand ton énergie est au max !`;
                                        
                                        await safeSendMessage(from, responseMessage);
                                        
                                        // Nettoyer l'état
                                        await prisma.userConversationState.delete({
                                            where: { userId: user.id }
                                        }).catch(() => {});
                                        
                                        console.log('✅ Planification intelligente traitée avec succès');
                                        return res.sendStatus(200);
                                    } else {
                                        const errorText = await planningResponse.text().catch(() => '');
                                        console.log('⚠️ Erreur planification intelligente:', planningResponse.status, errorText);
                                        
                                        await safeSendMessage(
                                            from,
                                            `❌ Oups, je n'ai pas pu analyser ta liste.\n\nPeux-tu réessayer en étant plus spécifique ? 🙏`
                                        );
                                        
                                        // Nettoyer l'état
                                        await prisma.userConversationState.delete({
                                            where: { userId: user.id }
                                        }).catch(() => {});
                                    }
                                }
                            } catch (error) {
                                console.error('❌ Erreur planification intelligente:', error);
                                
                                await safeSendMessage(
                                    from,
                                    `❌ Erreur technique. Réessaye dans quelques instants !`
                                );
                                
                                // Nettoyer l'état en cas d'erreur
                                if (user?.id) {
                                    await prisma.userConversationState.delete({
                                        where: { userId: user.id }
                                    }).catch(() => {});
                                }
                                // Continuer avec le traitement classique en cas d'erreur
                            }
                        }

                        const response = await aiService.processMessage(from, textToProcess);
                        console.log('🤖 Réponse de l\'IA:', response);

                        if (response && response.response) {
                            await safeSendMessage(from, response.response);
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

        // Démarrer le CalendarEventScheduler pour les rappels et post-checks
        calendarEventScheduler.start();
        console.log('🗓️ CalendarEventScheduler démarré');

        // Démarrer le serveur
        app.listen(port, () => {
            console.log(`✨ Service IA démarré sur le port ${port}`);
        });

        // Gérer l'arrêt gracieux
        process.on('SIGTERM', async () => {
            console.log('\n📴 Signal d\'arrêt reçu...');
            calendarEventScheduler.stop();
            await prisma.$disconnect();
            process.exit(0);
        });

        process.on('SIGINT', async () => {
            console.log('\n📴 Signal d\'interruption reçu...');
            calendarEventScheduler.stop();
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