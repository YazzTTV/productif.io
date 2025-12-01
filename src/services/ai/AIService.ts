import { PrismaClient, User, Task, Habit, NotificationSettings, WhatsAppConversation, WhatsAppMessage } from '@prisma/client';
import { ChatGPTService } from './ChatGPTService';
import { SpecialHabitsHandler } from './SpecialHabitsHandler';
import { randomBytes } from 'crypto';
import OpenAI from 'openai';
import { jwtVerify } from 'jose';
import { TextEncoder } from 'util';

// Utiliser la même clé que celle utilisée pour générer le token
const JWT_SECRET = (process.env.NEXTAUTH_SECRET || "productif_io_secret_key_for_nextauth") as string;

interface UserWithRelations extends User {
    tasks: Task[];
    habits: Habit[];
    notificationSettings: NotificationSettings | null;
}

interface IntentAnalysis {
    type: string;
    data: any;
}

interface AIResponse {
    response: string;
    contextual: boolean;
}

interface JWTPayload {
    tokenId: string;
    userId: string;
    scopes: string[];
    iat?: number;
    exp?: number;
}

interface GPTResponse {
    actions: Array<{
        action: 'voir_taches' | 'voir_habitudes' | 'voir_taches_prioritaires' | 'completer_tache' | 'completer_habitude' | 'completer_toutes_taches' | 'completer_toutes_habitudes' | 'creer_tache' | 'creer_tache_interactive' | 'creer_habitude' | 'reponse_creation_tache' | 'voir_processus' | 'creer_processus' | 'creer_processus_interactif' | 'reponse_creation_processus' | 'creer_rappel' | 'aide' | 'help_request';
        details: {
            nom?: string;
            description?: string;
            priorite?: string;
            energie?: string;
            echeance?: string;
            etapes?: string[];
            date?: string;
            time?: string;
            message?: string;
            date_completion?: string; // Pour les dates de complétion (hier, avant-hier, 15/12/2024)
        };
    }>;
}

interface TaskCreationState {
    title: string;
    dueDate: Date | null;
    startedAt: Date;
}

export class AIService {
    private prisma: PrismaClient;
    private taskCreationStates: Map<string, TaskCreationState> = new Map();
    private deepWorkStates: Map<string, { state: 'awaiting_deepwork_duration' } > = new Map();
    
    // Helper: normalize strings for fuzzy matching (remove accents/punctuation, lowercase)
    private normalizeText(raw: string): string {
        const lower = (raw || '').toLowerCase();
        // Remove accents
        const noAccents = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        // Common synonym mappings before stripping punctuation
        let mapped = noAccents
            .replace(/\bminuit\b/g, '00h')
            .replace(/\ba minuit\b/g, '00h')
            .replace(/\bà minuit\b/g, '00h')
            .replace(/\ba\s*0{1,2}h\b/g, '00h')
            // Convertir "8 heures" -> "8h"
            .replace(/\b(\d{1,2})\s*heures?\b/g, '$1h')
            .replace(/\bdormi[rt]?\b/g, 'dormir');

        // Replace connectors
        mapped = mapped.replace(/[.,;:|]/g, ' ').replace(/\s+/g, ' ').trim();
        return mapped;
    }

    // Helper: basic Levenshtein distance for fuzzy similarity
    private levenshteinDistance(a: string, b: string): number {
        const m = a.length;
        const n = b.length;
        if (m === 0) return n;
        if (n === 0) return m;
        const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,      // deletion
                    dp[i][j - 1] + 1,      // insertion
                    dp[i - 1][j - 1] + cost // substitution
                );
            }
        }
        return dp[m][n];
    }

	// Parse French dates like "10 octobre 2025" or "10 octobre" (year optional)
	private parseFrenchDate(raw: string): Date | null {
		const text = (raw || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
		const months: Record<string, number> = {
			'janvier': 0, 'jan': 0,
			'fevrier': 1, 'fev': 1, 'février': 1,
			'mars': 2,
			'avril': 3, 'avr': 3,
			'mai': 4,
			'juin': 5,
			'juillet': 6, 'juil': 6,
			'aout': 7, 'août': 7,
			'septembre': 8, 'sept': 8,
			'octobre': 9, 'oct': 9,
			'novembre': 10, 'nov': 10,
			'decembre': 11, 'dec': 11, 'décembre': 11
		};
		const m = text.match(/\b(\d{1,2})\s+(janvier|jan|fevrier|février|fev|mars|avril|avr|mai|juin|juillet|juil|aout|août|septembre|sept|octobre|oct|novembre|nov|decembre|décembre|dec)(?:\s+(\d{4}))?\b/);
		if (!m) return null;
		const day = parseInt(m[1], 10);
		const monthName = m[2];
		const month = months[monthName];
		if (isNaN(day) || month == null) return null;
		let year: number;
		if (m[3]) {
			year = parseInt(m[3], 10);
			if (isNaN(year)) return null;
		} else {
			const now = new Date();
			year = now.getFullYear();
			const candidate = new Date(year, month, day);
			// If the date without year is already past this year, assume next year
			const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			if (candidate < startOfToday) {
				year = year + 1;
			}
		}
		return new Date(year, month, day);
	}

    // Parse numeric French dates like "10/10/2025" or "10/10" (year optional)
    private parseNumericDateFlexible(raw: string): Date | null {
        const text = (raw || '').toLowerCase();
        const m = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
        if (!m) return null;
        const day = parseInt(m[1], 10);
        const month = parseInt(m[2], 10) - 1;
        if (isNaN(day) || isNaN(month) || month < 0 || month > 11) return null;
        let year: number;
        if (m[3]) {
            year = parseInt(m[3], 10);
            if (year < 100) year += 2000;
            if (isNaN(year)) return null;
        } else {
            const now = new Date();
            year = now.getFullYear();
            const candidate = new Date(year, month, day);
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (candidate < startOfToday) year = year + 1;
        }
        return new Date(year, month, day);
    }

    // Parse French days of week from free text, returns array of Prisma-compatible day strings
    private parseDaysOfWeekFromText(raw: string): string[] {
        const text = this.normalizeText(raw);
        const allDays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
        const frToEn: Record<string,string> = {
            'lundi': 'monday',
            'mardi': 'tuesday',
            'mercredi': 'wednesday',
            'jeudi': 'thursday',
            'vendredi': 'friday',
            'samedi': 'saturday',
            'dimanche': 'sunday'
        };
        const enOrder = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];

        const selected = new Set<string>();

        // Tous les jours
        if (/tous\s+les\s+jours|chaque\s+jour|quotidien(ne)?/i.test(raw)) {
            return [...allDays];
        }

        // Semaine (du lundi au vendredi)
        if (/semaine|jours?\s+de\s+semaine/i.test(raw)) {
            return ['monday','tuesday','wednesday','thursday','friday'];
        }

        // Week-end
        if (/week\s*-?\s*end|weekend/i.test(raw)) {
            return ['saturday','sunday'];
        }

        // Plage: du lundi au vendredi, etc.
        const range = text.match(/du\s+(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+au\s+(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/);
        if (range) {
            const startFr = range[1];
            const endFr = range[2];
            const startIdx = enOrder.indexOf(startFr);
            const endIdx = enOrder.indexOf(endFr);
            if (startIdx !== -1 && endIdx !== -1) {
                if (startIdx <= endIdx) {
                    for (let i = startIdx; i <= endIdx; i++) selected.add(frToEn[enOrder[i]]);
                } else {
                    for (let i = startIdx; i < enOrder.length; i++) selected.add(frToEn[enOrder[i]]);
                    for (let i = 0; i <= endIdx; i++) selected.add(frToEn[enOrder[i]]);
                }
            }
        }

        // Individuels: capturer par mots entiers, insensible à la casse
        const dayPattern = new RegExp(`\\b(?:le\\s+)?(${enOrder.join('|')})\\b`, 'gi');
        let m: RegExpExecArray | null;
        while ((m = dayPattern.exec(text)) !== null) {
            const fr = m[1].toLowerCase();
            const en = frToEn[fr];
            if (en) selected.add(en);
        }

        return [...selected];
    }

    private similarityScore(aRaw: string, bRaw: string): number {
        const a = this.normalizeText(aRaw);
        const b = this.normalizeText(bRaw);
        if (!a || !b) return 0;
        if (a === b) return 1;
        const maxLen = Math.max(a.length, b.length);
        const dist = this.levenshteinDistance(a, b);
        return 1 - dist / maxLen;
    }

    // Find best matching habit by fuzzy score and substring checks
    private findBestHabitMatch(habits: { id: string; name: string }[], candidateRaw: string) {
        const candidate = this.normalizeText(candidateRaw);
        let best = null as null | { habit: { id: string; name: string }; score: number };
        
        for (const h of habits) {
            const hn = this.normalizeText(h.name);
            let score = this.similarityScore(hn, candidate);
            
            // Boost if one contains the other
            if (hn.includes(candidate) || candidate.includes(hn)) {
                score = Math.max(score, 0.9);
            }
            
            // Special handling for "Tâche 1", "Tâche 2", "Tâche 3"
            const taskMatch = candidate.match(/^(tache|tâche)\s*([123])$/i);
            if (taskMatch) {
                const taskNumber = taskMatch[2].trim();
                if (hn.includes(`tâche ${taskNumber}`) || hn.includes(`tache ${taskNumber}`)) {
                    score = 1.0; // Perfect match
                }
            }
            
            // Handle "mes trois tâches" -> match all "Tâche 1", "Tâche 2", "Tâche 3"
            if (candidate.includes('trois') && candidate.includes('tache') && 
                (hn.includes('tâche 1') || hn.includes('tâche 2') || hn.includes('tâche 3'))) {
                score = 1.0;
            }
            
            // Handle variations like "dormir minuit" -> "Dormir 00h"
            if (candidate.includes('dormir') && candidate.includes('minuit') && 
                hn.includes('dormir') && hn.includes('00h')) {
                score = 1.0;
            }
            
            if (!best || score > best.score) best = { habit: h, score };
        }
        
        if (best && best.score >= 0.6) return best.habit;
        return null;
    }

    private splitHabitNames(raw: string): string[] {
        if (!raw) return [];
        const normalized = this.normalizeText(raw);
        // Split on commas, semicolons, pipes, and French "et"
        const parts = normalized.split(/\bet\b|[,;|]+/g).map(s => s.trim()).filter(Boolean);
        return parts;
    }
    private chatGPT: ChatGPTService;
    private contextWindow: number;
    private openai: OpenAI;
    private specialHabitsHandler: SpecialHabitsHandler;

    constructor() {
        this.prisma = new PrismaClient();
        this.chatGPT = new ChatGPTService();
        this.contextWindow = 5;
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.specialHabitsHandler = new SpecialHabitsHandler();
    }

    private async decodeToken(message: string): Promise<string | null> {
        try {
            console.log('🔍 Tentative de décodage du token...');
            console.log('📝 Message reçu:', message);

            // Vérifier si le message ressemble à un JWT
            if (message.split('.').length === 3) {
                console.log('✅ Format JWT détecté (3 parties séparées par des points)');
                console.log('✅ JWT_SECRET utilisé:', JWT_SECRET.substring(0, 10) + '...');

                const secretBytes = new TextEncoder().encode(JWT_SECRET);
                const { payload } = await jwtVerify(message, secretBytes) as { payload: JWTPayload };
                
                console.log('✅ Token décodé avec succès:', {
                    userId: payload.userId,
                    tokenId: payload.tokenId,
                    scopes: payload.scopes
                });
                return payload.userId;
            }
            console.log('❌ Le message ne ressemble pas à un token JWT');
            return null;
        } catch (error: any) {
            console.error('❌ Erreur lors du décodage du token:', error);
            if (error.code) {
                console.error('   Code d\'erreur:', error.code);
                console.error('   Message:', error.message);
            }
            return null;
        }
    }

    async processMessage(phoneNumber: string, message: string): Promise<AIResponse> {
        try {
            console.log('\n📱 Traitement du message...');
            console.log('   De:', phoneNumber);
            console.log('   Message:', message);

            // Chercher l'utilisateur par numéro WhatsApp
            let user = await this.prisma.user.findUnique({
                where: { whatsappNumber: phoneNumber }
            });

            if (user) {
                console.log('✅ Utilisateur trouvé:', {
                    id: user.id,
                    name: user.name,
                    email: user.email
                });
            } else {
                console.log('ℹ️ Aucun utilisateur trouvé avec ce numéro WhatsApp');
            }

            // Si pas d'utilisateur trouvé, vérifier si c'est un token
            if (!user) {
                console.log('🔑 Tentative d\'authentification avec le message comme token...');
                const userId = await this.decodeToken(message);
                
                if (userId) {
                    console.log('✅ Token valide, mise à jour de l\'utilisateur...');
                    // Mettre à jour l'utilisateur avec le numéro WhatsApp
                    user = await this.prisma.user.update({
                        where: { id: userId },
                        data: { whatsappNumber: phoneNumber }
                    });
                    console.log('✅ Numéro WhatsApp associé à l\'utilisateur:', {
                        id: user.id,
                        whatsappNumber: phoneNumber
                    });

                    // Créer une nouvelle conversation
                    const conversation = await this.prisma.whatsAppConversation.create({
                        data: {
                            userId: userId,
                            phoneNumber: phoneNumber,
                            messages: {
                                create: {
                                    content: message,
                                    isFromUser: true
                                }
                            }
                        }
                    });
                    console.log('✅ Nouvelle conversation créée:', {
                        id: conversation.id,
                        userId: conversation.userId
                    });

                    return {
                        response: "✅ Authentification réussie ! Vous pouvez maintenant me demander vos tâches, habitudes et processus.",
                        contextual: true
                    };
                }
                console.log('❌ Token invalide ou message non reconnu comme token');
                return {
                    response: "Je ne vous reconnais pas. Veuillez d'abord vous authentifier en envoyant votre token API.",
                    contextual: true
                };
            }

            // Enregistrer le message dans la conversation existante ou en créer une nouvelle
            let existingConversation = await this.prisma.whatsAppConversation.findFirst({
                where: {
                    userId: user.id,
                    phoneNumber: phoneNumber
                }
            });

            if (existingConversation) {
                await this.prisma.whatsAppMessage.create({
                    data: {
                        conversationId: existingConversation.id,
                        content: message,
                        isFromUser: true
                    }
                });
            } else {
                existingConversation = await this.prisma.whatsAppConversation.create({
                    data: {
                        userId: user.id,
                        phoneNumber: phoneNumber,
                        messages: {
                            create: {
                                content: message,
                                isFromUser: true
                            }
                        }
                    }
                });
            }

            // 🎯 GESTION DEEP WORK (interception avant autres traitements)
            {
                const key = `${user.id}_${phoneNumber}`;
                const lower = message.toLowerCase();

                // Réponse attendue pour la durée
                if (this.deepWorkStates.get(key)?.state === 'awaiting_deepwork_duration') {
                    const state = this.deepWorkStates.get(key) as any;
                    const taskId = state.taskId || null;
                    const taskTitle = state.taskTitle || null;
                    
                    // Vérifier si l'utilisateur dit "pas de temps" ou similaire
                    const noTimePattern = /(?:pas\s+de\s+temps?|sans\s+temps?|libre|illimité|indéfini)/i;
                    const noTimeMatch = message.match(noTimePattern);
                    
                    let duration: number;
                    
                    if (noTimeMatch) {
                        // Session libre : utiliser une durée par défaut de 90 minutes (mais sans limite stricte)
                        duration = 90;
                    } else {
                        const match = message.match(/(\d+)/);
                        if (!match) {
                            return { 
                                response: `🤔 Je n'ai pas compris... Réponds avec :\n• Un nombre de minutes (ex: 25, 90, 120)\n• "pas de temps" pour une session libre\n\nExemples : 25, 90, 120, ou "pas de temps"`, 
                                contextual: true 
                            };
                        }
                        duration = parseInt(match[1], 10);
                        if (duration < 5) {
                            return { response: `⚠️ Minimum 5 minutes pour une session Deep Work !\n\nRéessaye avec une durée plus longue.`, contextual: true };
                        }
                        if (duration > 240) {
                            return { response: `⚠️ Maximum 240 minutes (4h) !\n\nAu-delà, tu risques de perdre en concentration. Réessaye avec une durée plus courte.`, contextual: true };
                        }
                    }

                    // Vérifier session active
                    const active = await this.prisma.deepWorkSession.findFirst({
                        where: { userId: user.id, status: 'active' },
                        include: { timeEntry: true }
                    });
                    if (active) {
                        const elapsed = Math.floor((Date.now() - active.timeEntry.startTime.getTime()) / 60000);
                        this.deepWorkStates.delete(key);
                        return { response: `⚠️ Tu as déjà une session en cours !\n\n⏱️ Temps écoulé : ${elapsed}/${active.plannedDuration} minutes\n\nÉcris "termine session" pour la terminer ou "je fais une pause" pour faire une pause.`, contextual: true };
                    }

                    // Créer TimeEntry + DeepWorkSession avec taskId si présent
                    const startTime = new Date();
                    const timeEntry = await this.prisma.timeEntry.create({
                        data: { 
                            userId: user.id, 
                            startTime, 
                            taskId: taskId || null,
                            description: taskTitle ? undefined : `Session Deep Work (${duration}min)`
                        }
                    });
                    await this.prisma.deepWorkSession.create({
                        data: { userId: user.id, timeEntryId: timeEntry.id, plannedDuration: duration, type: 'deepwork', status: 'active' }
                    });

                    this.deepWorkStates.delete(key);
                    const endTime = new Date(startTime.getTime() + duration * 60000);
                    
                    let response = `✅ *Session Deep Work lancée !*\n\n`;
                    if (taskTitle) {
                        response += `📝 Tâche : **${taskTitle}**\n`;
                    }
                    response += `⏱️ Durée : ${duration} minutes`;
                    if (noTimeMatch) {
                        response += ` (session libre)`;
                    }
                    response += `\n🎯 Fin prévue : ${endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n\n`;
                    response += `🔥 Reste concentré, tu peux le faire ! 💪\n\n`;
                    if (!noTimeMatch) {
                        response += `_Je te préviendrai 5 minutes avant la fin._`;
                    } else {
                        response += `💡 _Tu peux dire "j'ai fini la tâche" quand tu as terminé !_`;
                    }
                    
                    return { response, contextual: true };
                }

                // 🎯 DÉTECTION : "je vais commencer la tâche X" ou "je vais commencer [nom tâche]"
                const taskStartPattern = /(?:je\s+vais\s+)?(?:commencer|démarre?r?|faire|travailler?\s+sur)\s+(?:la\s+)?(?:tâche|tache)\s*(\d+)|(?:je\s+vais\s+)?(?:commencer|démarre?r?|faire|travailler?\s+sur)\s+(.+)/i;
                const taskStartMatch = message.match(taskStartPattern);
                
                if (taskStartMatch) {
                    // Vérifier session active
                    const active = await this.prisma.deepWorkSession.findFirst({ 
                        where: { userId: user.id, status: 'active' }, 
                        include: { timeEntry: true } 
                    });
                    if (active) {
                        const elapsed = Math.floor((Date.now() - active.timeEntry.startTime.getTime()) / 60000);
                        return { 
                            response: `⚠️ Tu as déjà une session en cours !\n\n⏱️ Temps écoulé : ${elapsed}/${active.plannedDuration} minutes\n\nÉcris "termine session" pour la terminer ou "je fais une pause" pour faire une pause.`, 
                            contextual: true 
                        };
                    }

                    let task = null;
                    
                    // Si c'est un numéro (tâche 1, tâche 2, etc.)
                    if (taskStartMatch[1]) {
                        const taskNumber = parseInt(taskStartMatch[1], 10);
                        const allTasks = await this.prisma.task.findMany({
                            where: { userId: user.id, completed: false },
                            orderBy: [
                                { priority: 'desc' },
                                { dueDate: 'asc' },
                                { createdAt: 'asc' }
                            ]
                        });
                        if (taskNumber > 0 && taskNumber <= allTasks.length) {
                            task = allTasks[taskNumber - 1]; // Index 0-based
                        }
                    } 
                    // Sinon, chercher par nom (matching flexible)
                    else if (taskStartMatch[2]) {
                        const taskName = taskStartMatch[2].trim();
                        const allTasks = await this.prisma.task.findMany({
                            where: { userId: user.id, completed: false }
                        });
                        // Matching flexible : cherche dans le titre
                        task = allTasks.find(t => 
                            this.normalizeText(t.title).includes(this.normalizeText(taskName)) ||
                            this.normalizeText(taskName).includes(this.normalizeText(t.title))
                        );
                        // Si plusieurs matches, prendre le premier par priorité
                        if (!task) {
                            const matches = allTasks.filter(t => 
                                this.levenshteinDistance(this.normalizeText(t.title), this.normalizeText(taskName)) < 5
                            );
                            if (matches.length > 0) {
                                matches.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
                                task = matches[0];
                            }
                        }
                    }

                    if (!task) {
                        return { 
                            response: `❌ Je n'ai pas trouvé de tâche correspondante.\n\n💡 Tu peux dire :\n• "je vais commencer la tâche 1" (par numéro)\n• "je vais commencer [nom de la tâche]" (par nom)\n\nDis "mes tâches" pour voir tes tâches en cours !`, 
                            contextual: true 
                        };
                    }

                    // Stocker la tâche dans l'état pour la prochaine réponse (durée)
                    this.deepWorkStates.set(key, { 
                        state: 'awaiting_deepwork_duration',
                        taskId: task.id,
                        taskTitle: task.title
                    } as any);
                    
                    return { 
                        response: `🚀 *C'est parti pour travailler sur :*\n📝 **${task.title}**\n\n⏱️ Combien de temps veux-tu y consacrer ?\n\n💡 Choix rapides :\n• 25 (Pomodoro)\n• 50 (Session courte)\n• 90 (Deep Work classique)\n• 120 (Session intensive)\n\n💬 Ou réponds avec un nombre de minutes !\n\n💡 _Tu peux aussi répondre "pas de temps" pour une session libre._`, 
                        contextual: true 
                    };
                }

                // 🎯 DÉTECTION : "j'ai fini la tâche" (termine la session Deep Work associée)
                const taskFinishPattern = /(?:j'?ai\s+)?(?:fini|terminé|complété)\s+(?:la\s+)?(?:tâche|tache)(?:\s+(\d+))?/i;
                const taskFinishMatch = message.match(taskFinishPattern);
                
                if (taskFinishMatch) {
                    const active = await this.prisma.deepWorkSession.findFirst({ 
                        where: { userId: user.id, status: { in: ['active', 'paused'] } }, 
                        include: { timeEntry: { include: { task: true } } } 
                    });
                    
                    if (!active) {
                        return { 
                            response: `ℹ️ Aucune session Deep Work en cours.\n\nÉcris "je vais commencer la tâche X" pour démarrer une session !`, 
                            contextual: true 
                        };
                    }

                    // Si une tâche est mentionnée, vérifier qu'elle correspond
                    if (taskFinishMatch[1]) {
                        const taskNumber = parseInt(taskFinishMatch[1], 10);
                        const allTasks = await this.prisma.task.findMany({
                            where: { userId: user.id, completed: false },
                            orderBy: [
                                { priority: 'desc' },
                                { dueDate: 'asc' },
                                { createdAt: 'asc' }
                            ]
                        });
                        if (taskNumber > 0 && taskNumber <= allTasks.length) {
                            const expectedTask = allTasks[taskNumber - 1];
                            if (active.timeEntry.taskId !== expectedTask.id) {
                                return { 
                                    response: `⚠️ La session en cours n'est pas associée à la tâche ${taskNumber}.\n\nLa session actuelle est pour : ${active.timeEntry.task?.title || 'une tâche non spécifiée'}`, 
                                    contextual: true 
                                };
                            }
                        }
                    }

                    // Terminer la session
                    const now = new Date();
                    const actualDuration = Math.floor((now.getTime() - active.timeEntry.startTime.getTime()) / 60000);
                    await this.prisma.deepWorkSession.update({ 
                        where: { id: active.id }, 
                        data: { status: 'completed', updatedAt: now } 
                    });
                    await this.prisma.timeEntry.update({ 
                        where: { id: active.timeEntry.id }, 
                        data: { endTime: now } 
                    });

                    // Marquer la tâche comme complétée si elle est associée
                    if (active.timeEntry.taskId) {
                        await this.prisma.task.update({
                            where: { id: active.timeEntry.taskId },
                            data: { completed: true, updatedAt: now }
                        });
                    }

                    const wasOnTime = actualDuration <= active.plannedDuration + 2;
                    let response = `✅ *Tâche terminée !*\n\n`;
                    if (active.timeEntry.task) {
                        response += `📝 Tâche : ${active.timeEntry.task.title}\n`;
                    }
                    response += `⏱️ Durée prévue : ${active.plannedDuration} min\n`;
                    response += `⏱️ Durée réelle : ${actualDuration} min\n\n`;
                    if (wasOnTime) {
                        response += `🎉 Parfait ! Tu as tenu ton objectif !\n\n`;
                    } else {
                        const diff = actualDuration - active.plannedDuration;
                        response += `Tu as ${diff > 0 ? 'dépassé de' : 'terminé'} ${Math.abs(diff)} minutes ${diff > 0 ? 'plus tard' : 'plus tôt'}.\n\n`;
                    }
                    response += `💪 Bien joué ! Profite d'une pause bien méritée !`;
                    return { response, contextual: true };
                }

                // Commandes Deep Work (générales)
                const isStart = (lower.includes('commence') || lower.includes('démarre')) && (lower.includes('travailler') || lower.includes('travail') || lower.includes('deep work') || lower.includes('deepwork'));
                const isEnd = (lower.includes('termine') || lower.includes('fini') || lower.includes('stop')) && (lower.includes('session') || lower.includes('deep work') || lower.includes('travail'));
                const isStatus = (lower.includes('session') || lower.includes('deep work')) && (lower.includes('en cours') || lower.includes('active') || lower.includes('statut'));
                const isPause = (lower.includes('pause') || lower.includes('je fais une pause')) && (lower.includes('session') || lower.includes('deep work') || lower.match(/^pause$/i));
                const isResume = (lower.includes('reprend') || lower.includes('continue') || lower.includes('reprise') || lower.match(/^reprends?$/i)) && (lower.includes('session') || lower.includes('deep work') || lower.match(/^reprends?$/i));
                const isHistory = (lower.includes('historique') || lower.includes('sessions')) && (lower.includes('deep work') || lower.includes('travail'));

                if (isStart) {
                    // Vérifier active
                    const active = await this.prisma.deepWorkSession.findFirst({ where: { userId: user.id, status: 'active' }, include: { timeEntry: true } });
                    if (active) {
                        const elapsed = Math.floor((Date.now() - active.timeEntry.startTime.getTime()) / 60000);
                        return { response: `⚠️ Tu as déjà une session en cours !\n\n⏱️ Temps écoulé : ${elapsed}/${active.plannedDuration} minutes\n\nÉcris "termine session" pour la terminer ou "pause session" pour faire une pause.`, contextual: true };
                    }
                    this.deepWorkStates.set(key, { state: 'awaiting_deepwork_duration' });
                    return { response: `🚀 *C'est parti pour une session Deep Work !*\n\nCombien de temps veux-tu travailler ?\n\n💡 Choix rapides :\n• 25 (Pomodoro)\n• 50 (Session courte)\n• 90 (Deep Work classique)\n• 120 (Session intensive)\n\nOu réponds avec n'importe quel nombre de minutes !`, contextual: true };
                }

                if (isEnd) {
                    const active = await this.prisma.deepWorkSession.findFirst({ where: { userId: user.id, status: 'active' }, include: { timeEntry: true } });
                    if (!active) {
                        return { response: `ℹ️ Aucune session en cours.\n\nÉcris "je commence à travailler" pour démarrer une nouvelle session !`, contextual: true };
                    }
                    const now = new Date();
                    const actualDuration = Math.floor((now.getTime() - active.timeEntry.startTime.getTime()) / 60000);
                    await this.prisma.deepWorkSession.update({ where: { id: active.id }, data: { status: 'completed', updatedAt: now } });
                    await this.prisma.timeEntry.update({ where: { id: active.timeEntry.id }, data: { endTime: now } });
                    const wasOnTime = actualDuration <= active.plannedDuration + 2;
                    let response = `✅ *Session terminée !*\n\n`;
                    response += `⏱️ Durée prévue : ${active.plannedDuration} min\n`;
                    response += `⏱️ Durée réelle : ${actualDuration} min\n\n`;
                    if (wasOnTime) {
                        response += `🎉 Parfait ! Tu as tenu ton objectif !\n\n`;
                    } else {
                        const diff = actualDuration - active.plannedDuration;
                        response += `Tu as ${diff > 0 ? 'dépassé de' : 'terminé'} ${Math.abs(diff)} minutes ${diff > 0 ? 'plus tard' : 'plus tôt'}.\n\n`;
                    }
                    response += `💪 Bien joué ! Profite d'une pause bien méritée !`;
                    return { response, contextual: true };
                }

                if (isPause) {
                    const active = await this.prisma.deepWorkSession.findFirst({ 
                        where: { userId: user.id, status: 'active' }, 
                        include: { timeEntry: { include: { task: true } } } 
                    });
                    if (!active) {
                        return { response: `ℹ️ Aucune session active à mettre en pause.`, contextual: true };
                    }
                    
                    // Calculer le temps écoulé avant la pause
                    const elapsedBeforePause = Math.floor((Date.now() - active.timeEntry.startTime.getTime()) / 60000);
                    
                    // Stocker le temps écoulé dans notes (format JSON simple)
                    const pauseData = {
                        elapsedAtPause: elapsedBeforePause,
                        pausedAt: new Date().toISOString()
                    };
                    
                    await this.prisma.deepWorkSession.update({ 
                        where: { id: active.id }, 
                        data: { 
                            status: 'paused',
                            notes: JSON.stringify(pauseData),
                            interruptions: active.interruptions + 1
                        } 
                    });
                    
                    let response = `⏸️ *Session mise en pause*\n\n`;
                    if (active.timeEntry.task) {
                        response += `📝 Tâche : ${active.timeEntry.task.title}\n`;
                    }
                    response += `⏱️ Temps écoulé : ${elapsedBeforePause} min\n`;
                    response += `⏱️ Temps restant : ${active.plannedDuration - elapsedBeforePause} min\n\n`;
                    response += `💬 Écris "je reprends" ou "reprendre" quand tu es prêt(e) à continuer !`;
                    return { response, contextual: true };
                }

                if (isResume) {
                    const paused = await this.prisma.deepWorkSession.findFirst({ 
                        where: { userId: user.id, status: 'paused' }, 
                        include: { timeEntry: { include: { task: true } } } 
                    });
                    if (!paused) {
                        return { response: `ℹ️ Aucune session en pause.\n\nTu veux démarrer une nouvelle session ?`, contextual: true };
                    }
                    
                    // Récupérer le temps écoulé au moment de la pause
                    let elapsedBeforePause = 0;
                    if (paused.notes) {
                        try {
                            const pauseData = JSON.parse(paused.notes);
                            elapsedBeforePause = pauseData.elapsedAtPause || 0;
                        } catch (e) {
                            // Si le parsing échoue, calculer depuis le début
                            elapsedBeforePause = Math.floor((Date.now() - paused.timeEntry.startTime.getTime()) / 60000);
                        }
                    } else {
                        // Fallback : calculer depuis le début
                        elapsedBeforePause = Math.floor((Date.now() - paused.timeEntry.startTime.getTime()) / 60000);
                    }
                    
                    // Ajuster le startTime virtuellement en soustrayant le temps de pause
                    // On met à jour le startTime pour que le temps écoulé soit correct
                    const now = new Date();
                    const adjustedStartTime = new Date(now.getTime() - elapsedBeforePause * 60000);
                    await this.prisma.timeEntry.update({
                        where: { id: paused.timeEntry.id },
                        data: { startTime: adjustedStartTime }
                    });
                    
                    await this.prisma.deepWorkSession.update({ 
                        where: { id: paused.id }, 
                        data: { 
                            status: 'active',
                            notes: null // Nettoyer les données de pause
                        } 
                    });
                    
                    const remaining = paused.plannedDuration - elapsedBeforePause;
                    let response = `▶️ *Session reprise !*\n\n`;
                    if (paused.timeEntry.task) {
                        response += `📝 Tâche : ${paused.timeEntry.task.title}\n`;
                    }
                    response += `⏱️ Temps écoulé : ${elapsedBeforePause} min\n`;
                    response += `⏱️ Temps restant : ${remaining} min\n\n`;
                    response += `🔥 Allez, on y retourne ! 💪`;
                    return { response, contextual: true };
                }

                if (isStatus) {
                    const active = await this.prisma.deepWorkSession.findFirst({ where: { userId: user.id, status: 'active' }, include: { timeEntry: true } });
                    if (!active) {
                        return { response: `ℹ️ Aucune session en cours.\n\nÉcris "je commence à travailler" pour démarrer une nouvelle session !`, contextual: true };
                    }
                    const elapsed = Math.floor((Date.now() - active.timeEntry.startTime.getTime()) / 60000);
                    const remainingMinutes = active.plannedDuration - elapsed;
                    const progressPercent = Math.round((elapsed / active.plannedDuration) * 100);
                    let response = `⏱️ *Session Deep Work en cours*\n\n`;
                    response += `🎯 Type : ${active.type}\n`;
                    response += `⏳ Temps écoulé : ${elapsed} min\n`;
                    response += `⏱️ Temps restant : ${remainingMinutes} min\n`;
                    response += `📊 Progression : ${progressPercent}%\n\n`;
                    response += remainingMinutes > 0 ? `💪 Continue, tu es sur la bonne voie !` : `⚠️ Le temps est écoulé ! La session va se terminer automatiquement.`;
                    return { response, contextual: true };
                }

                if (isHistory) {
                    const sessions = await this.prisma.deepWorkSession.findMany({
                        where: { userId: user.id, status: 'completed' },
                        include: { timeEntry: true },
                        orderBy: { createdAt: 'desc' },
                        take: 5
                    });
                    if (!sessions || sessions.length === 0) {
                        return { response: `📊 Aucune session terminée pour le moment.\n\nCommence ta première session Deep Work maintenant !`, contextual: true };
                    }
                    let msg = `📊 *Tes 5 dernières sessions*\n\n`;
                    for (const s of sessions) {
                        const date = new Date(s.timeEntry.startTime);
                        const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                        const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                        const actualDuration = s.timeEntry.endTime ? Math.floor((new Date(s.timeEntry.endTime).getTime() - date.getTime()) / 60000) : s.plannedDuration;
                        const wasOnTime = actualDuration <= s.plannedDuration + 2;
                        const emoji = wasOnTime ? '✅' : '⚠️';
                        msg += `${emoji} *${dateStr} à ${timeStr}*\n ${actualDuration}/${s.plannedDuration} min`;
                        if (s.interruptions > 0) msg += ` • ${s.interruptions} interruption(s)`;
                        msg += `\n\n`;
                    }
                    const totalSessions = sessions.length;
                    const totalMinutes = sessions.reduce((sum, s) => sum + (s.timeEntry.endTime ? Math.floor((new Date(s.timeEntry.endTime).getTime() - new Date(s.timeEntry.startTime).getTime()) / 60000) : 0), 0);
                    const avgMinutes = Math.round(totalMinutes / totalSessions);
                    msg += `📈 *Stats :* ${totalMinutes} min totales • Moyenne ${avgMinutes} min/session`;
                    return { response: msg, contextual: true };
                }
            }

            // 🎯 GESTION DES HABITUDES SPÉCIALES (NOUVEAU SYSTÈME)
            // Vérifier s'il y a une conversation spéciale en cours
            if (this.specialHabitsHandler.hasActiveConversation(user.id, phoneNumber)) {
                console.log('🔥 Conversation spéciale en cours détectée');
                const specialResponse = await this.specialHabitsHandler.handleConversationResponse(
                    user.id, 
                    phoneNumber, 
                    message
                );
                
                if (specialResponse.response) {
                    // Enregistrer la réponse de l'IA dans la conversation
                    await this.prisma.whatsAppMessage.create({
                        data: {
                            conversationId: existingConversation.id,
                            content: specialResponse.response,
                            isFromUser: false
                        }
                    });
                    
                    return {
                        response: specialResponse.response,
                        contextual: true
                    };
                }
            }

            // 🧩 RÉPONSE À UNE CRÉATION DE TÂCHE EN COURS (priorité/énergie)
            // Si un état de création de tâche est en attente, traiter ce message en priorité
            {
                const key = `${user.id}_${phoneNumber}`;
                const pending = this.taskCreationStates.get(key);
                if (pending) {
                    const txt = (message || '').trim();
                    // Détection des 2 chiffres ou des mots-clés
                    let p: number | null = null;
                    let e: number | null = null;
                    const numMatch = txt.match(/priorit[ée]?\s*(\d)/i) || txt.match(/(\d+)\s*(?:\n|et)\s*(\d+)/);
                    if (numMatch) {
                        if (numMatch.length >= 2) p = parseInt(numMatch[1], 10);
                        if (numMatch.length >= 3 && numMatch[2]) e = parseInt(numMatch[2], 10);
                    }
                    // Capture explicite de "énergie X"
                    if (e == null) {
                        const energyNumMatch = txt.match(/(?:énergie|energie)\s*(\d)/i);
                        if (energyNumMatch && energyNumMatch[1]) {
                            e = parseInt(energyNumMatch[1], 10);
                        }
                    }
                    // Fallback: capturer deux nombres isolés (0-4 et 0-3) dans l'ordre
                    if (p == null || e == null) {
                        const isolatedNums = txt.match(/\b\d\b/g);
                        if (isolatedNums && isolatedNums.length >= 2) {
                            const first = parseInt(isolatedNums[0], 10);
                            const second = parseInt(isolatedNums[1], 10);
                            if (p == null) p = first;
                            if (e == null) e = p === first ? second : first;
                        }
                    }
                    if (p == null) {
                        if (/urgent|urgence/i.test(txt)) p = 4;
                        else if (/important/i.test(txt)) p = 3;
                        else if (/normal/i.test(txt)) p = 2;
                        else if (/faible/i.test(txt)) p = 1;
                        else if (/someday|un jour/i.test(txt)) p = 0;
                    }
                    if (e == null) {
                        if (/extr[êe]me|extreme/i.test(txt)) e = 3;
                        else if (/[ée]lev[ée]|eleve/i.test(txt)) e = 2;
                        else if (/moyen/i.test(txt)) e = 1;
                        else if (/faible/i.test(txt)) e = 0;
                    }

                    if (p != null && e != null) {
                        const task = await this.prisma.task.create({
                            data: {
                                title: pending.title,
                                userId: user.id,
                                completed: false,
                                priority: p,
                                energyLevel: e,
                                dueDate: pending.dueDate ?? null
                            }
                        });
                        this.taskCreationStates.delete(key);
                        // Enregistrer la réponse IA
                        const reply = `✅ J'ai créé la tâche "${task.title}". Vous pouvez la marquer comme complétée en disant "Marquer tâche ${task.title} comme complétée"`;
                        await this.prisma.whatsAppMessage.create({
                            data: {
                                conversationId: existingConversation.id,
                                content: reply,
                                isFromUser: false
                            }
                        });
                        return { response: reply, contextual: true };
                    } else if (/priorit|énergie|energie|\d/.test(txt)) {
                        // Réponse partielle -> reposer clairement la question avec le contexte
                        let taskInfo = `\n📝 Tâche : "${pending.title}"`;
                        if (pending.dueDate) taskInfo += `\n📅 Échéance : ${pending.dueDate.toLocaleDateString('fr-FR')}`;
                        const reply = `Pour créer votre tâche, j'ai besoin de quelques informations :${taskInfo}\n\n` +
                            "1️⃣ Quelle est la priorité (0-4, où 4 est la plus urgente) ?\n" +
                            "   • 4 = Urgent (à faire immédiatement)\n" +
                            "   • 3 = Important (priorité élevée)\n" +
                            "   • 2 = Normal (priorité moyenne)\n" +
                            "   • 1 = Faible (peut attendre)\n" +
                            "   • 0 = Someday (un jour peut-être)\n\n" +
                            "2️⃣ Quel est le niveau d'énergie requis (0-3) ?\n" +
                            "   • 3 = Extrême (tâche très difficile)\n" +
                            "   • 2 = Élevé (tâche moyennement difficile)\n" +
                            "   • 1 = Moyen (tâche facile)\n" +
                            "   • 0 = Faible (tâche très facile)\n\n" +
                            "💡 Répondez avec ces 2 chiffres, un par ligne.\n" +
                            "Exemple :\n3\n2";
                        await this.prisma.whatsAppMessage.create({
                            data: {
                                conversationId: existingConversation.id,
                                content: reply,
                                isFromUser: false
                            }
                        });
                        return { response: reply, contextual: true };
                    }
                    // Sinon, laisser passer au moteur GPT
                }
            }

            // 🎯 DÉTECTION DIRECTE DES HABITUDES SPÉCIALES
            // Si le message correspond à "j'ai fait l'habitude X [date]", vérifier directement si X est spéciale
            console.log('🔍 Test de détection directe pour:', message);
            
            // Regex améliorée pour capturer séparément l'habitude et la date optionnelle
            const habitPattern = /j'ai\s+(fait|terminé|complété)\s+l'habitude\s+(.+?)(?:\s+(hier|avant-hier|le\s+\d{1,2}\/\d{1,2}\/\d{4}))?$/i;
            const match = message.match(habitPattern);
            
            console.log('🔍 Résultat du match regex:', match);
            
            if (match) {
                const habitNameFromMessage = match[2].trim();
                const dateFromMessage = match[3] ? match[3].trim() : null;
                console.log('🎯 Nom d\'habitude extrait directement:', habitNameFromMessage);
                console.log('📅 Date extraite:', dateFromMessage || 'aucune (aujourd\'hui)');
                
                // Chercher cette habitude dans la base
                const habits = await this.prisma.habit.findMany({ where: { userId: user.id } });
                console.log('📋 Habitudes de l\'utilisateur:', habits.map(h => h.name));
                
                const foundHabit = habits.find(h => 
                    h.name.toLowerCase().includes(habitNameFromMessage.toLowerCase()) || 
                    habitNameFromMessage.toLowerCase().includes(h.name.toLowerCase())
                );
                
                console.log('🔍 Habitude trouvée:', foundHabit?.name || 'AUCUNE');
                
                if (foundHabit) {
                    const isSpecial = this.specialHabitsHandler.isSpecialHabit(foundHabit.name);
                    console.log('🔍 Est une habitude spéciale:', isSpecial);
                    
                    if (isSpecial) {
                        console.log('🔥 Habitude spéciale détectée directement:', foundHabit.name);
                        
                        // Calculer la date cible
                        let targetDate = new Date();
                        if (dateFromMessage) {
                            console.log('📅 Calcul de la date cible pour:', dateFromMessage);
                            
                            if (dateFromMessage.toLowerCase() === 'hier') {
                                targetDate.setDate(targetDate.getDate() - 1);
                            } else if (dateFromMessage.toLowerCase() === 'avant-hier') {
                                targetDate.setDate(targetDate.getDate() - 2);
                            } else if (dateFromMessage.startsWith('le ')) {
                                // Format "le DD/MM/YYYY"
                                const dateStr = dateFromMessage.substring(3); // Enlever "le "
                                const [day, month, year] = dateStr.split('/').map(Number);
                                if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                                    targetDate = new Date(year, month - 1, day);
                                }
                            }
                        }
                        
                        // Convertir en UTC pour éviter les problèmes de timezone
                        const utcTargetDate = new Date(Date.UTC(
                            targetDate.getFullYear(),
                            targetDate.getMonth(),
                            targetDate.getDate(),
                            0, 0, 0, 0
                        ));
                        
                        console.log('📅 Date cible calculée:', utcTargetDate.toISOString());
                        console.log('📅 Date cible locale:', utcTargetDate.toLocaleDateString('fr-FR'));
                        
                        try {
                            const specialResponse = await this.specialHabitsHandler.startSpecialHabitCompletion(
                                user.id,
                                phoneNumber,
                                foundHabit.name,
                                foundHabit.id,
                                utcTargetDate
                            );
                            
                            console.log('✅ Réponse spéciale générée:', specialResponse.substring(0, 100) + '...');
                            
                            // Enregistrer la réponse de l'IA dans la conversation
                            await this.prisma.whatsAppMessage.create({
                                data: {
                                    conversationId: existingConversation.id,
                                    content: specialResponse,
                                    isFromUser: false
                                }
                            });
                            
                            return {
                                response: specialResponse,
                                contextual: true
                            };
                        } catch (error) {
                            console.error('❌ Erreur lors du traitement de l\'habitude spéciale:', error);
                            // Continuer avec le traitement normal
                        }
                    } else {
                        console.log('📝 Habitude normale, traitement GPT normal');
                    }
                } else {
                    console.log('❌ Aucune habitude correspondante trouvée');
                }
            } else {
                console.log('❌ Pas de match regex pour la détection directe');
            }

            // Détection spéciale pour les habitudes particulières
            const messageLower = message.toLowerCase();
            
            // Récupérer les habitudes de l'utilisateur
            const userWithHabits = await this.prisma.user.findUnique({
                where: { id: user.id },
                include: { habits: true }
            });
            
            if (userWithHabits?.habits) {
                // Détection "j'ai appris" pour l'habitude apprentissage
                if (messageLower.includes('j\'ai appris') || messageLower.includes('jai appris')) {
                    console.log('🔍 Détection spéciale: phrase d\'apprentissage trouvée');
                    const apprentissageHabit = userWithHabits.habits.find((h: any) => 
                        h.name.toLowerCase() === 'apprentissage'
                    );
                    
                    if (apprentissageHabit) {
                        console.log('🔥 Habitude apprentissage trouvée, traitement spécial');
                        try {
                            const specialResponse = await this.specialHabitsHandler.startSpecialHabitCompletion(
                                user.id,
                                phoneNumber,
                                apprentissageHabit.name,
                                apprentissageHabit.id
                            );
                            
                            return {
                                response: specialResponse,
                                contextual: true
                            };
                        } catch (error) {
                            console.error('❌ Erreur lors du traitement de l\'apprentissage:', error);
                        }
                    }
                }
                
                // Détection "note de la journée" ou "note de sa journée"
                if (messageLower.includes('note de la journée') || messageLower.includes('note de sa journée')) {
                    console.log('🔍 Détection spéciale: phrase de note de journée trouvée');
                    const noteHabit = userWithHabits.habits.find((h: any) => 
                        h.name.toLowerCase() === 'note de sa journée'
                    );
                    
                    if (noteHabit) {
                        console.log('🔥 Habitude note de sa journée trouvée, traitement spécial');
                        try {
                            const specialResponse = await this.specialHabitsHandler.startSpecialHabitCompletion(
                                user.id,
                                phoneNumber,
                                noteHabit.name,
                                noteHabit.id
                            );
                            
                            return {
                                response: specialResponse,
                                contextual: true
                            };
                        } catch (error) {
                            console.error('❌ Erreur lors du traitement de la note de journée:', error);
                        }
                    }
                }
            }

            console.log('🔍 Analyse du message avec GPT');
            
            const prompt = `
            Tu es un assistant qui aide à comprendre les intentions des utilisateurs concernant leurs tâches, habitudes et processus.
            Analyse le message suivant et détermine :
            1. Le type d'action (voir_taches, voir_habitudes, voir_taches_prioritaires, completer_tache, completer_habitude, creer_tache, creer_tache_interactive, creer_habitude, reponse_creation_tache, voir_processus, creer_processus, creer_processus_interactif, reponse_creation_processus, creer_rappel, aide, help_request)
            2. Les détails pertinents (nom, description, etc.)
            
            RÈGLES CRUCIALES :
            
            0. DEMANDES D'AIDE - PRIORITÉ ABSOLUE :
               - Si le message contient "comment", "aide", "processus", "process", "étapes", "explique", "guide", "tutoriel", "je ne sais pas", "je comprends pas" → utilise 'aide' ou 'help_request'
               - EXEMPLES : "comment faire la tâche X", "aide-moi à faire X", "c'est quoi le processus pour X", "comment je peux faire X", "explique-moi comment", "je ne sais pas comment faire"
               - IMPORTANT : Ne confonds PAS une demande d'aide avec une création de tâche. Si l'utilisateur demande COMMENT faire quelque chose, c'est une demande d'aide, pas une création de tâche.
            
            1. CRÉATION DE TÂCHES - Quand utiliser creer_tache_interactive :
               - Si le message mentionne seulement le nom de la tâche SANS demander comment faire → utilise 'creer_tache_interactive'
               - Si le message contient priorité ET niveau d'énergie → utilise 'creer_tache'
               - Si le message a des dates relatives (demain, aujourd'hui) → extrait l'échéance
               - ATTENTION : Si le message contient "comment faire" ou "aide-moi à faire", c'est une demande d'aide, PAS une création de tâche !
            
            2. DATES RELATIVES pour les tâches :
               - "demain" → echeance: "demain"
               - "aujourd'hui" → echeance: "aujourd'hui"
               - "ce soir" → echeance: "aujourd'hui"
               - "cette semaine" → echeance: "cette semaine"
               - "la semaine prochaine" → echeance: "la semaine prochaine"
            
            3. EXTRACTION DES DATES pour complétion :
               - "hier", "avant-hier" ou date (JJ/MM/YYYY) → details.date_completion
            
            4. HABITUDES : 
               - TOUJOURS extraire le nom dans details.nom, même avec "l'habitude" ou "habitude"
            
            5. TÂCHES PRIORITAIRES :
               - Si PRIORITAIRES, IMPORTANTES, URGENTES, TOP X → 'voir_taches_prioritaires'
            
            Message: "${message}"
            
            Réponds au format JSON uniquement.
            
            EXEMPLES CRITIQUES - DEMANDES D'AIDE (PRIORITÉ ABSOLUE) :
            
            Message: "comment je peux faire la tâche Finaliser l'UX de l'application mobile ?"
            {
                "actions": [{
                    "action": "aide",
                    "details": {}
                }]
            }
            
            Message: "aide moi à faire finaliser l'ux de l'application mobile je dois faire comment ?"
            {
                "actions": [{
                    "action": "aide",
                    "details": {}
                }]
            }
            
            Message: "c'est quoi le processus pour finaliser l'UX de l'application mobile"
            {
                "actions": [{
                    "action": "aide",
                    "details": {}
                }]
            }
            
            Message: "cest quoi le process pour finaliser l'uc de l'application mobile"
            {
                "actions": [{
                    "action": "aide",
                    "details": {}
                }]
            }
            
            Message: "comment faire la tâche X"
            {
                "actions": [{
                    "action": "aide",
                    "details": {}
                }]
            }
            
            Message: "explique-moi comment faire X"
            {
                "actions": [{
                    "action": "aide",
                    "details": {}
                }]
            }
            
            Message: "je ne sais pas comment faire X"
            {
                "actions": [{
                    "action": "aide",
                    "details": {}
                }]
            }
            
            Message: "processus pour faire X"
            {
                "actions": [{
                    "action": "aide",
                    "details": {}
                }]
            }
            
            Message: "étapes pour faire X"
            {
                "actions": [{
                    "action": "aide",
                    "details": {}
                }]
            }
            
            DISTINCTION CRITIQUE - Tâches normales VS prioritaires :
            
            Message: "mes tâches" → voir_taches (toutes les tâches)
            Message: "quelles sont mes tâches" → voir_taches (toutes les tâches)
            Message: "mes tâches prioritaires" → voir_taches_prioritaires (TOP 3 uniquement)
            Message: "quels sont mes tâches prioritaires" → voir_taches_prioritaires (TOP 3 uniquement)

            DÉTECTION CRITIQUE DES DATES - Complétion avec dates :

            RÈGLE ABSOLUE : Si le message contient "hier", "avant-hier" ou une date (JJ/MM/YYYY), tu DOIS extraire date_completion !

            DISTINCTION CRITIQUE - Questions VS Actions pour les habitudes :
            
            QUESTIONS (lecture seule - ne PAS compléter) :
            - "quels habitudes me restaient hier ?" → voir_habitudes (juste lister, NE PAS compléter)
            - "quelles habitudes il me reste ?" → voir_habitudes (juste lister, NE PAS compléter)
            - "quels habitudes ils me restaient ?" → voir_habitudes (juste lister, NE PAS compléter)
            
            ACTIONS (complétion) :
            - "j'ai fais toutes mes habitudes hier" → completer_toutes_habitudes + date_completion: "hier"
            - "j'ai fait toutes mes tâches avant-hier" → completer_toutes_taches + date_completion: "avant-hier"
            - "toutes mes habitudes du 15/12/2024" → completer_toutes_habitudes + date_completion: "15/12/2024"
            
            RÈGLE : Si le message contient "quels", "quelles", "quelles" + "restaient", "restaient", "reste", "restent" → C'EST UNE QUESTION (voir_habitudes), PAS une action de complétion !
            
            Exemples TRÈS IMPORTANTS pour les habitudes :
            
            Message: "j'ai fait l'habitude note de sa journée"
            {
                "actions": [{
                    "action": "completer_habitude",
                    "details": {
                        "nom": "note de sa journée"
                    }
                }]
            }

            Message: "j'ai fait l'habitude apprentissage"
            {
                "actions": [{
                    "action": "completer_habitude",
                    "details": {
                        "nom": "apprentissage"
                    }
                }]
            }

            Message: "j'ai terminé l'habitude sport"
            {
                "actions": [{
                    "action": "completer_habitude",
                    "details": {
                        "nom": "sport"
                    }
                }]
            }

            Message: "j'ai complété l'habitude méditation"
            {
                "actions": [{
                    "action": "completer_habitude",
                    "details": {
                        "nom": "méditation"
                    }
                }]
            }

            Message: "marquer habitude lecture comme complétée"
            {
                "actions": [{
                    "action": "completer_habitude",
                    "details": {
                        "nom": "lecture"
                    }
                }]
            }

            RÈGLES SPÉCIALES POUR L'HABITUDE APPRENTISSAGE :
            Si le message contient "j'ai appris" ou "appris" dans n'importe quelle position, c'est TOUJOURS l'habitude "apprentissage"

            Message: "j'ai appris à faire du React aujourd'hui"
            {
                "actions": [{
                    "action": "completer_habitude",
                    "details": {
                        "nom": "apprentissage"
                    }
                }]
            }

            Message: "aujourd'hui j'ai appris à faire du React et du Python"
            {
                "actions": [{
                    "action": "completer_habitude",
                    "details": {
                        "nom": "apprentissage"
                    }
                }]
            }

            Message: "j'ai appris le Python"
            {
                "actions": [{
                    "action": "completer_habitude",
                    "details": {
                        "nom": "apprentissage"
                    }
                }]
            }

            Message: "j'ai appris les bases de la photographie"
            {
                "actions": [{
                    "action": "completer_habitude",
                    "details": {
                        "nom": "apprentissage"
                    }
                }]
            }

            Message: "j'ai appris comment utiliser Git"
            {
                "actions": [{
                    "action": "completer_habitude",
                    "details": {
                        "nom": "apprentissage"
                    }
                }]
            }

            Message: "j'ai appris de nouvelles techniques"
            {
                "actions": [{
                    "action": "completer_habitude",
                    "details": {
                        "nom": "apprentissage"
                    }
                }]
            }

            Message: "hier j'ai appris JavaScript"
            {
                "actions": [{
                    "action": "completer_habitude",
                    "details": {
                        "nom": "apprentissage"
                    }
                }]
            }

            Message: "ce matin j'ai appris la guitare"
            {
                "actions": [{
                    "action": "completer_habitude",
                    "details": {
                        "nom": "apprentissage"
                    }
                }]
            }

            RÈGLES SPÉCIALES POUR L'HABITUDE NOTE DE SA JOURNÉE :
            Si le message contient "note de la journée" ou "note de sa journée", c'est TOUJOURS l'habitude "note de sa journée"

            Message: "note de la journée, 7 sur 10, c'était vraiment un putain de banger"
            {
                "actions": [{
                    "action": "completer_habitude",
                    "details": {
                        "nom": "note de sa journée"
                    }
                }]
            }

            Message: "note de sa journée, 8/10, super journée"
            {
                "actions": [{
                    "action": "completer_habitude",
                    "details": {
                        "nom": "note de sa journée"
                    }
                }]
            }

            Message: "aujourd'hui note de la journée 5 sur 10"
            {
                "actions": [{
                    "action": "completer_habitude",
                    "details": {
                        "nom": "note de sa journée"
                    }
                }]
            }

            Message: "note de sa journée 9/10 excellente journée"
            {
                "actions": [{
                    "action": "completer_habitude",
                    "details": {
                        "nom": "note de sa journée"
                    }
                }]
            }

            Message: "note de la journée : 6 sur 10"
            {
                "actions": [{
                    "action": "completer_habitude",
                    "details": {
                        "nom": "note de sa journée"
                    }
                }]
            }
            
            Exemples TRÈS IMPORTANTS pour les tâches prioritaires :
            
            Message: "quels sont mes tâches prioritaires"
            {
                "actions": [{
                    "action": "voir_taches_prioritaires",
                    "details": {}
                }]
            }

            Message: "mes tâches les plus importantes"
            {
                "actions": [{
                    "action": "voir_taches_prioritaires",
                    "details": {}
                }]
            }

            Message: "top 3 tâches"
            {
                "actions": [{
                    "action": "voir_taches_prioritaires",
                    "details": {}
                }]
            }

            Message: "mes tâches urgentes"
            {
                "actions": [{
                    "action": "voir_taches_prioritaires",
                    "details": {}
                }]
            }

            Message: "priorités du jour"
            {
                "actions": [{
                    "action": "voir_taches_prioritaires",
                    "details": {}
                }]
            }

            Message: "tâches importantes à faire"
            {
                "actions": [{
                    "action": "voir_taches_prioritaires",
                    "details": {}
                }]
            }
            
            Exemples TRÈS IMPORTANTS pour compléter TOUTES les tâches/habitudes :

            Message: "j'ai fais toutes mes habitudes hier"
            {
                "actions": [{
                    "action": "completer_toutes_habitudes",
                    "details": {
                        "date_completion": "hier"
                    }
                }]
            }
            
            Message: "j'ai fait toutes mes tâches"
            {
                "actions": [{
                    "action": "completer_toutes_taches",
                    "details": {}
                }]
            }

            Message: "toutes mes tâches sont terminées"
            {
                "actions": [{
                    "action": "completer_toutes_taches",
                    "details": {}
                }]
            }

            Message: "j'ai terminé toutes mes tâches"
            {
                "actions": [{
                    "action": "completer_toutes_taches",
                    "details": {}
                }]
            }

            Message: "j'ai fait toutes mes habitudes"
            {
                "actions": [{
                    "action": "completer_toutes_habitudes",
                    "details": {}
                }]
            }

            Message: "toutes mes habitudes du jour"
            {
                "actions": [{
                    "action": "completer_toutes_habitudes",
                    "details": {}
                }]
            }

            Message: "j'ai terminé toutes mes habitudes"
            {
                "actions": [{
                    "action": "completer_toutes_habitudes",
                    "details": {}
                }]
            }

            Message: "j'ai fait toutes mes tâches hier"
            {
                "actions": [{
                    "action": "completer_toutes_taches",
                    "details": {
                        "date_completion": "hier"
                    }
                }]
            }

            Message: "j'ai fait toutes mes habitudes avant-hier"
            {
                "actions": [{
                    "action": "completer_toutes_habitudes",
                    "details": {
                        "date_completion": "avant-hier"
                    }
                }]
            }

            Message: "j'ai terminé toutes mes tâches le 15/12/2024"
            {
                "actions": [{
                    "action": "completer_toutes_taches",
                    "details": {
                        "date_completion": "15/12/2024"
                    }
                }]
            }

            Message: "toutes mes habitudes du 20/12/2024"
            {
                "actions": [{
                    "action": "completer_toutes_habitudes",
                    "details": {
                        "date_completion": "20/12/2024"
                    }
                }]
            }

            Message: "j'ai terminé toutes mes tâches hier soir"
            {
                "actions": [{
                    "action": "completer_toutes_taches",
                    "details": {
                        "date_completion": "hier"
                    }
                }]
            }
            
            Exemples supplémentaires pour les rappels:
            Message: "rappelle moi de faire les courses le 25/12/2024 à 14:30"
            {
                "actions": [{
                    "action": "creer_rappel",
                    "details": {
                        "date": "25/12/2024",
                        "time": "14:30",
                        "message": "Faire les courses"
                    }
                }]
            }

            Message: "crée un rappel pour demain 10h pour appeler le client"
            {
                "actions": [{
                    "action": "creer_rappel",
                    "details": {
                        "date": "20/03/2024",
                        "time": "10:00",
                        "message": "Appeler le client"
                    }
                }]
            }

            Message: "rappelle moi dans 5 minutes de faire une pause"
            {
                "actions": [{
                    "action": "creer_rappel",
                    "details": {
                        "minutes": 5,
                        "message": "Faire une pause"
                    }
                }]
            }

            Message: "rappelle moi dans 2 heures de faire une pause"
            {
                "actions": [{
                    "action": "creer_rappel",
                    "details": {
                        "minutes": 120,
                        "message": "Faire une pause"
                    }
                }]
            }

            Exemples supplémentaires pour les processus:
            Message: "montre moi mes processus"
            {
                "actions": [{
                    "action": "voir_processus",
                    "details": {}
                }]
            }
            
            Message: "je veux créer un processus"
            {
                "actions": [{
                    "action": "creer_processus_interactif",
                    "details": {}
                }]
            }

            Message: "créer un processus: Onboarding client\nDescription: Processus d'accueil des nouveaux clients\n1. Appel de découverte\n2. Envoi du devis\n3. Signature du contrat"
            {
                "actions": [{
                    "action": "creer_processus",
                    "details": {
                        "nom": "Onboarding client",
                        "description": "Processus d'accueil des nouveaux clients",
                        "etapes": [
                            "Appel de découverte",
                            "Envoi du devis",
                            "Signature du contrat"
                        ]
                    }
                }]
            }

            Exemples TRÈS IMPORTANTS pour la création de tâches :

            Message: "demain faudrait que je fasse l'application mobile"
            {
                "actions": [{
                    "action": "creer_tache_interactive",
                    "details": {
                        "nom": "faire l'application mobile",
                        "echeance": "demain"
                    }
                }]
            }

            Message: "aujourd'hui je dois appeler le client"
            {
                "actions": [{
                    "action": "creer_tache_interactive",
                    "details": {
                        "nom": "appeler le client",
                        "echeance": "aujourd'hui"
                    }
                }]
            }

            Message: "créer une tâche pour demain : réviser la présentation"
            {
                "actions": [{
                    "action": "creer_tache_interactive",
                    "details": {
                        "nom": "réviser la présentation",
                        "echeance": "demain"
                    }
                }]
            }

            Message: "il faut que je finisse le rapport cette semaine"
            {
                "actions": [{
                    "action": "creer_tache_interactive",
                    "details": {
                        "nom": "finir le rapport",
                        "echeance": "cette semaine"
                    }
                }]
            }

            Message: "créer une tâche : acheter du lait"
            {
                "actions": [{
                    "action": "creer_tache_interactive",
                    "details": {
                        "nom": "acheter du lait"
                    }
                }]
            }

            Message: "je veux créer une tâche"
            {
                "actions": [{
                    "action": "creer_tache_interactive",
                    "details": {}
                }]
            }

            Message: "créer tâche: Réunion équipe, priorité 3, énergie 2"
            {
                "actions": [{
                    "action": "creer_tache",
                    "details": {
                        "nom": "Réunion équipe",
                        "priorite": "3",
                        "energie": "2"
                    }
                }]
            }

            Exemples CRITIQUES pour les réponses à la création interactive :

            Message: "3\\n2" (quand l'utilisateur répond aux questions priorité/énergie)
            {
                "actions": [{
                    "action": "reponse_creation_tache",
                    "details": {
                        "priorite": "3",
                        "energie": "2"
                    }
                }]
            }

            Message: "alors priorité 4 et niveau d'énergie 2" (format conversationnel)
            {
                "actions": [{
                    "action": "reponse_creation_tache",
                    "details": {
                        "priorite": "4",
                        "energie": "2"
                    }
                }]
            }

            Message: "priorité 3 et énergie 1" (format conversationnel court)
            {
                "actions": [{
                    "action": "reponse_creation_tache",
                    "details": {
                        "priorite": "3",
                        "energie": "1"
                    }
                }]
            }

            Message: "donc priorité 2 et niveau d'énergie 3" (variante avec donc)
            {
                "actions": [{
                    "action": "reponse_creation_tache",
                    "details": {
                        "priorite": "2",
                        "energie": "3"
                    }
                }]
            }

            Message: "ok priorité 4 et énergie 2" (variante avec ok)
            {
                "actions": [{
                    "action": "reponse_creation_tache",
                    "details": {
                        "priorite": "4",
                        "energie": "2"
                    }
                }]
            }

            Message: "4 et 2" (format ultra-court)
            {
                "actions": [{
                    "action": "reponse_creation_tache",
                    "details": {
                        "priorite": "4",
                        "energie": "2"
                    }
                }]
            }

            Message: "du coup pour l'échéance ça serait pour demain priorité importante et niveau d'énergie moyen"
            {
                "actions": [{
                    "action": "reponse_creation_tache",
                    "details": {
                        "priorite": "3",
                        "energie": "2",
                        "echeance": "demain",
                        "nom": "boire 2 litres d'eau"
                    }
                }]
            }

            Message: "donc priorité importante, niveau d'énergie élevé pour demain"
            {
                "actions": [{
                    "action": "reponse_creation_tache",
                    "details": {
                        "priorite": "3",
                        "energie": "3",
                        "echeance": "demain"
                    }
                }]
            }

            IMPORTANT : Quand le message contient des mots comme "priorité importante", "niveau normal", "énergie faible", etc., convertis-les :
            - "priorité importante" / "important" → priorite: "3"
            - "priorité normale" / "normal" → priorite: "2"  
            - "priorité faible" / "faible" → priorite: "1"
            - "priorité urgente" / "urgent" → priorite: "4"
            - "priorité élevée" / "élevé" → priorite: "4"
            
            - "énergie élevée" / "énergie élevé" / "niveau élevé" → energie: "3"
            - "énergie moyen" / "niveau moyen" / "moyen" → energie: "2"
            - "énergie faible" / "niveau faible" / "faible" → energie: "1"
            - "énergie extrême" / "niveau extrême" / "extrême" → energie: "3"

            Message: "Application mobile\\n3\\n2\\ndemain" (format complet)
            {
                "actions": [{
                    "action": "reponse_creation_tache",
                    "details": {
                        "nom": "Application mobile",
                        "priorite": "3",
                        "energie": "2",
                        "echeance": "demain"
                    }
                }]
            }

            Message: "2\\n1" (priorité 2, énergie 1)
            {
                "actions": [{
                    "action": "reponse_creation_tache",
                    "details": {
                        "priorite": "2",
                        "energie": "1"
                    }
                }]
            }
            `;

            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: prompt },
                    { role: "user", content: message }
                ],
                temperature: 0,
                // Forcer une réponse JSON valide
                response_format: { type: 'json_object' as any }
            });

            let parsed: any = { actions: [] };
            try {
                const content = completion.choices?.[0]?.message?.content;
                parsed = content ? JSON.parse(content) : { actions: [] };
            } catch (e) {
                console.error('JSON parse error in AIService.processMessage:', e);
                parsed = { actions: [] };
            }

            const result = parsed as GPTResponse;
            console.log('Analyse GPT:', result);

            // Traiter chaque action
            let responses: AIResponse[] = [];
            let hasHandledHabitCompletion = false;
            for (const item of result.actions) {
                let response: AIResponse;
                
                switch (item.action) {
                    case 'voir_taches':
                        response = await this.listTasks(user.id);
                        break;
                    case 'voir_taches_prioritaires':
                        response = await this.listPriorityTasks(user.id);
                        break;
                    case 'voir_habitudes':
                        response = await this.listHabits(user.id);
                        break;
                    case 'voir_processus':
                        response = await this.listProcesses(user.id);
                        break;
                    case 'aide':
                    case 'help_request':
                        // Détection d'une demande d'aide - générer une réponse contextuelle avec GPT
                        response = await this.generateHelpResponse(message, user.id);
                        break;
                    case 'creer_rappel':
                        response = await this.createReminder(user.id, item.details);
                        break;
                    case 'completer_tache':
                        // Règle stricte: si le message contient "habitude(s)", on ignore TOUTE complétion de tâche
                        {
                            const lowerMsg = (message || '').toLowerCase();
                            if (lowerMsg.includes('habitude')) {
                                console.log('⏭️ Action completer_tache ignorée (contexte habitudes prioritaire)');
                                break;
                            }
                        }
                        if (!item.details.nom) {
                            response = {
                                response: "Je n'ai pas pu identifier quelle tâche vous souhaitez marquer comme complétée. Pouvez-vous préciser ?",
                                contextual: true
                            };
                        } else {
                            response = await this.completeTask(user.id, item.details.nom as string);
                        }
                        break;
                    case 'completer_habitude':
                        if (hasHandledHabitCompletion) {
                            console.log('⏭️ completer_habitude déjà traité pour ce message, on ignore le doublon');
                            break;
                        }
                        if (!item.details.nom) {
                            response = {
                                response: "Je n'ai pas pu identifier quelle habitude vous souhaitez marquer comme complétée. Pouvez-vous préciser ?",
                                contextual: true
                            };
                        } else {
                            // Passer le message complet pour permettre le parsing de la date (hier/demain/10 octobre, etc.)
                            response = await this.completeHabit(user.id, message, phoneNumber);
                            hasHandledHabitCompletion = true;
                        }
                        break;
                    case 'completer_toutes_taches':
                        response = await this.completeAllTasks(user.id, item.details.date_completion);
                        break;
                    case 'completer_toutes_habitudes':
                        response = await this.completeAllHabits(user.id, item.details.date_completion);
                        break;
                    case 'creer_tache':
                        {
                            // Si le message ne contient PAS explicitement priorité/énergie, basculer en mode interactif
                            const rawText = (item.details.nom || message || '').toString();
                            const hasPriorityEnergy = /priorit[ée]?|énergie|energie|\d+\s*(?:\n|et)\s*\d+/i.test(rawText);
                            if (!hasPriorityEnergy) {
                                // Préparer infos et enregistrer l'état pour la prochaine réponse
                                let taskInfo = "";
                                let pendingTitle = item.details.nom || 'Nouvelle tâche';
                                let pendingDue: Date | null = null;
                                if (item.details.nom) {
                                    taskInfo += `\n📝 Tâche : "${item.details.nom}"`;
                                }
                                if (item.details.echeance) {
                                    let echeanceText = item.details.echeance;
                                    const today = new Date();
                                    const tomorrow = new Date(today);
                                    tomorrow.setDate(today.getDate() + 1);
                                    switch ((echeanceText || '').toLowerCase()) {
                                        case 'demain':
                                            echeanceText = `demain (${tomorrow.toLocaleDateString('fr-FR')})`;
                                            pendingDue = tomorrow;
                                            break;
                                        case 'aujourd\'hui':
                                            echeanceText = `aujourd'hui (${today.toLocaleDateString('fr-FR')})`;
                                            pendingDue = today;
                                            break;
                                        case 'cette semaine':
                                            echeanceText = 'cette semaine';
                                            break;
                                        case 'la semaine prochaine':
                                            echeanceText = 'la semaine prochaine';
                                            break;
                                        default: {
                                            // JJ/MM/AAAA
                                            const m = echeanceText.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
                                            if (m) {
                                                const d = parseInt(m[1], 10);
                                                const mo = parseInt(m[2], 10) - 1;
                                                let y = parseInt(m[3], 10);
                                                if (y < 100) y += 2000;
                                                pendingDue = new Date(y, mo, d);
                                            } else {
                                                // Format français “10 octobre 2025”, “1 jan 2026”, “15 déc 2025”, etc.
                                                const fr = this.parseFrenchDate(echeanceText);
                                                if (fr) pendingDue = fr;
                                            }
                                        }
                                    }
                                    taskInfo += `\n📅 Échéance : ${echeanceText}`;
                                }
                                if (existingConversation) {
                                    const key = `${user.id}_${phoneNumber}`;
                                    this.taskCreationStates.set(key, { title: pendingTitle, dueDate: pendingDue, startedAt: new Date() });
                                }
                                response = {
                                    response: `Pour créer votre tâche, j'ai besoin de quelques informations :${taskInfo}\n\n` +
                                        "1️⃣ Quelle est la priorité (0-4, où 4 est la plus urgente) ?\n" +
                                        "   • 4 = Urgent (à faire immédiatement)\n" +
                                        "   • 3 = Important (priorité élevée)\n" +
                                        "   • 2 = Normal (priorité moyenne)\n" +
                                        "   • 1 = Faible (peut attendre)\n" +
                                        "   • 0 = Someday (un jour peut-être)\n\n" +
                                        "2️⃣ Quel est le niveau d'énergie requis (0-3) ?\n" +
                                        "   • 3 = Extrême (tâche très difficile)\n" +
                                        "   • 2 = Élevé (tâche moyennement difficile)\n" +
                                        "   • 1 = Moyen (tâche facile)\n" +
                                        "   • 0 = Faible (tâche très facile)\n\n" +
                                        "💡 Répondez avec ces 2 chiffres, un par ligne.\n" +
                                        "Exemple :\n3\n2",
                                    contextual: true
                                };
                            } else {
                                response = await this.createTask(user.id, rawText, phoneNumber);
                            }
                        }
                        break;
                    case 'creer_tache_interactive':
                        // Si on a déjà un nom et éventuellement une échéance, on les affiche
                        let taskInfo = "";
                        // État temporaire pour création de tâche
                        let pendingTitle = item.details.nom || 'Nouvelle tâche';
                        let pendingDue: Date | null = null;
                        if (item.details.nom) {
                            taskInfo += `\n📝 Tâche : "${item.details.nom}"`;
                        }
                        if (item.details.echeance) {
                            // Convertir les dates relatives en format compréhensible
                            let echeanceText = item.details.echeance;
                            const today = new Date();
                            const tomorrow = new Date(today);
                            tomorrow.setDate(today.getDate() + 1);
                            
                            switch (echeanceText.toLowerCase()) {
                                case 'demain':
                                    echeanceText = `demain (${tomorrow.toLocaleDateString('fr-FR')})`;
                                    pendingDue = tomorrow;
                                    break;
                                case 'aujourd\'hui':
                                case 'aujourd\'hui':
                                    echeanceText = `aujourd'hui (${today.toLocaleDateString('fr-FR')})`;
                                    pendingDue = today;
                                    break;
                                case 'cette semaine':
                                    echeanceText = "cette semaine";
                                    break;
                                case 'la semaine prochaine':
                                    echeanceText = "la semaine prochaine";
                                    break;
                                default: {
                                    // Essayer JJ/MM/AAAA
                                    const m = echeanceText.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
                                    if (m) {
                                        const d = parseInt(m[1], 10);
                                        const mo = parseInt(m[2], 10) - 1;
                                        let y = parseInt(m[3], 10);
                                        if (y < 100) y += 2000;
                                        pendingDue = new Date(y, mo, d);
                                    } else {
                                        // Essayer format français clair
                                        const fr = this.parseFrenchDate(echeanceText);
                                        if (fr) pendingDue = fr;
                                    }
                                }
                            }
                            taskInfo += `\n📅 Échéance : ${echeanceText}`;
                        }
                        // Enregistrer l'état en mémoire pour la réponse suivante
                        if (existingConversation) {
                            const key = `${user.id}_${phoneNumber}`;
                            this.taskCreationStates.set(key, {
                                title: pendingTitle,
                                dueDate: pendingDue,
                                startedAt: new Date()
                            });
                        }
                        
                        response = {
                            response: `Pour créer votre tâche, j'ai besoin de quelques informations :${taskInfo}\n\n` +
                                    "1️⃣ Quelle est la priorité (0-4, où 4 est la plus urgente) ?\n" +
                                    "   • 4 = Urgent (à faire immédiatement)\n" +
                                    "   • 3 = Important (priorité élevée)\n" +
                                    "   • 2 = Normal (priorité moyenne)\n" +
                                    "   • 1 = Faible (peut attendre)\n" +
                                    "   • 0 = Someday (un jour peut-être)\n\n" +
                                    "2️⃣ Quel est le niveau d'énergie requis (0-3) ?\n" +
                                    "   • 3 = Extrême (tâche très difficile)\n" +
                                    "   • 2 = Élevé (tâche moyennement difficile)\n" +
                                    "   • 1 = Moyen (tâche facile)\n" +
                                    "   • 0 = Faible (tâche très facile)\n\n" +
                                    "💡 Répondez avec ces 2 chiffres, un par ligne.\n" +
                                    "Exemple :\n3\n2",
                            contextual: true
                        };
                        break;
                    case 'creer_processus_interactif':
                        response = {
                            response: "Pour créer votre processus, j'ai besoin de quelques informations :\n\n" +
                                    "1️⃣ Quel est le nom du processus ?\n" +
                                    "2️⃣ Quelle est sa description ?\n" +
                                    "3️⃣ Listez les étapes du processus (une par ligne)\n\n" +
                                    "Par exemple :\n" +
                                    "Onboarding client\n" +
                                    "Processus d'accueil des nouveaux clients\n" +
                                    "1. Appel de découverte\n" +
                                    "2. Envoi du devis\n" +
                                    "3. Signature du contrat",
                            contextual: true
                        };
                        break;
                    case 'creer_habitude':
                        response = await this.createHabit(user.id, message, item.details.nom);
                        break;
                    case 'creer_processus':
                        response = await this.createProcess(user.id, item.details);
                        break;
                    case 'reponse_creation_tache':
                        // DEBUG: Afficher ce que GPT a détecté
                        console.log('🔬 DEBUG reponse_creation_tache:', JSON.stringify(item.details, null, 2));
                        // Vérifier s'il y a une création en attente pour cet utilisateur
                        if (existingConversation) {
                            const key = `${user.id}_${phoneNumber}`;
                            const pending = this.taskCreationStates.get(key);
                            if (pending) {
                                const txt = (message || '').trim();
                                let p: number | null = null;
                                let e: number | null = null;
                                const numMatch = txt.match(/priorit[ée]?\s*(\d)/i) || txt.match(/(\d+)\s*(?:\n|et)\s*(\d+)/);
                                if (numMatch) {
                                    if (numMatch.length >= 2) p = parseInt(numMatch[1], 10);
                                    if (numMatch.length >= 3 && numMatch[2]) e = parseInt(numMatch[2], 10);
                                }
                                if (p == null) {
                                    if (/urgent/i.test(txt)) p = 4;
                                    else if (/important/i.test(txt)) p = 3;
                                    else if (/normal/i.test(txt)) p = 2;
                                    else if (/faible/i.test(txt)) p = 1;
                                    else if (/someday|un jour/i.test(txt)) p = 0;
                                }
                                if (e == null) {
                                    if (/extr[êe]me|extreme/i.test(txt)) e = 3;
                                    else if (/[ée]lev[ée]|eleve/i.test(txt)) e = 2;
                                    else if (/moyen/i.test(txt)) e = 1;
                                    else if (/faible/i.test(txt)) e = 0;
                                }

                                if (p == null || e == null) {
                                    let taskInfo2 = `\n📝 Tâche : "${pending.title}"`;
                                    if (pending.dueDate) taskInfo2 += `\n📅 Échéance : ${pending.dueDate.toLocaleDateString('fr-FR')}`;
                                    response = {
                                        response: `Pour créer votre tâche, j'ai besoin de quelques informations :${taskInfo2}\n\n` +
                                                "1️⃣ Quelle est la priorité (0-4, où 4 est la plus urgente) ?\n" +
                                                "   • 4 = Urgent (à faire immédiatement)\n" +
                                                "   • 3 = Important (priorité élevée)\n" +
                                                "   • 2 = Normal (priorité moyenne)\n" +
                                                "   • 1 = Faible (peut attendre)\n" +
                                                "   • 0 = Someday (un jour peut-être)\n\n" +
                                                "2️⃣ Quel est le niveau d'énergie requis (0-3) ?\n" +
                                                "   • 3 = Extrême (tâche très difficile)\n" +
                                                "   • 2 = Élevé (tâche moyennement difficile)\n" +
                                                "   • 1 = Moyen (tâche facile)\n" +
                                                "   • 0 = Faible (tâche très facile)\n\n" +
                                                "💡 Répondez avec ces 2 chiffres, un par ligne.\n" +
                                                "Exemple :\n3\n2",
                                        contextual: true
                                    };
                                } else {
                                    const task = await this.prisma.task.create({
                                        data: {
                                            title: pending.title,
                                            userId: user.id,
                                            completed: false,
                                            priority: p,
                                            energyLevel: e,
                                            dueDate: pending.dueDate
                                        }
                                    });
                                    this.taskCreationStates.delete(key);
                                    response = {
                                        response: `✅ J'ai créé la tâche "${task.title}". Vous pouvez la marquer comme complétée en disant "Marquer tâche ${task.title} comme complétée"`,
                                        contextual: true
                                    };
                                }
                                break;
                            }
                        }
                        
                        // Si on n'a pas le nom ou l'échéance, essayer de les récupérer du contexte
                        let taskName = item.details.nom;
                        let taskEcheance = item.details.echeance;
                        
                        console.log('🔍 TaskName from GPT:', taskName);
                        console.log('🔍 TaskEcheance from GPT:', taskEcheance);
                        
                        if ((!taskName || !taskEcheance) && existingConversation) {
                            // Récupérer les derniers messages pour trouver le contexte
                            const recentMessages = await this.prisma.whatsAppMessage.findMany({
                                where: { conversationId: existingConversation.id },
                                orderBy: { createdAt: 'desc' },
                                take: 5 // Regarder les 5 derniers messages
                            });
                            
                            // Chercher dans les messages récents pour extraire nom et échéance
                            for (const msg of recentMessages) {
                                if (msg.isFromUser && msg.content) {
                                    const content = msg.content.toLowerCase();
                                    
                                    // Chercher des patterns de tâche avec date
                                    if (!taskName && content.includes('faudrait') || content.includes('dois') || content.includes('faire')) {
                                        // Extraire le nom de la tâche
                                        const patterns = [
                                            /(?:demain|aujourd'hui|ce soir|cette semaine).*(?:faudrait que je|dois|il faut que je)\s+(.+)/,
                                            /(?:faudrait que je|dois|il faut que je)\s+(.+?)(?:\s+(?:demain|aujourd'hui|ce soir|cette semaine))?/,
                                            /(?:créer.*tâche.*:?\s*)(.+?)(?:\s*pour\s+(?:demain|aujourd'hui))?$/
                                        ];
                                        
                                        for (const pattern of patterns) {
                                            const match = content.match(pattern);
                                            if (match && match[1]) {
                                                taskName = match[1].trim();
                                                break;
                                            }
                                        }
                                    }
                                    
                                    // Chercher l'échéance
                                    if (!taskEcheance) {
                                        if (content.includes('demain')) taskEcheance = 'demain';
                                        else if (content.includes('aujourd\'hui') || content.includes('aujourd\'hui')) taskEcheance = 'aujourd\'hui';
                                        else if (content.includes('ce soir')) taskEcheance = 'aujourd\'hui';
                                        else if (content.includes('cette semaine')) taskEcheance = 'cette semaine';
                                        else if (content.includes('la semaine prochaine')) taskEcheance = 'la semaine prochaine';
                                    }
                                    
                                    if (taskName && taskEcheance) break;
                                }
                            }
                        }
                        
                        if (!taskName || !item.details.priorite || !item.details.energie) {
                            response = {
                                response: "Je n'ai pas pu comprendre tous les détails de la tâche. Veuillez réessayer avec le format :\nPriorité (0-4)\nNiveau d'énergie (0-3)\n\nOu précisez le nom de la tâche si elle n'a pas été mentionnée.",
                                contextual: true
                            };
                        } else {
                            const priorityNum = parseInt(item.details.priorite);
                            const energyLevelNum = parseInt(item.details.energie);
                            let parsedDueDate: Date | null = null;

                            // Gérer les dates relatives et absolues
                            if (taskEcheance) {
                                const echeance = taskEcheance.toLowerCase();
                                const today = new Date();
                                const tomorrow = new Date(today);
                                tomorrow.setDate(today.getDate() + 1);
                                
                                switch (echeance) {
                                    case 'demain':
                                        parsedDueDate = tomorrow;
                                        break;
                                    case 'aujourd\'hui':
                                    case 'aujourd\'hui':
                                        parsedDueDate = today;
                                        break;
                                    case 'cette semaine':
                                        // Dimanche de cette semaine
                                        const thisWeekEnd = new Date(today);
                                        thisWeekEnd.setDate(today.getDate() + (7 - today.getDay()));
                                        parsedDueDate = thisWeekEnd;
                                        break;
                                    case 'la semaine prochaine':
                                        // Dimanche de la semaine prochaine
                                        const nextWeekEnd = new Date(today);
                                        nextWeekEnd.setDate(today.getDate() + (14 - today.getDay()));
                                        parsedDueDate = nextWeekEnd;
                                        break;
                                    default:
                                        // Essayer de parser au format JJ/MM/YYYY
                                        const dateParts = item.details.echeance?.split('/').map(Number) || [];
                                        if (dateParts.length === 3 && !dateParts.some(isNaN)) {
                                            const [day, month, year] = dateParts;
                                            parsedDueDate = new Date(year, month - 1, day);
                                        }
                                        break;
                                }
                            }

                            const task = await this.prisma.task.create({
                                data: {
                                    title: taskName,
                                    userId: user.id,
                                    priority: priorityNum,
                                    energyLevel: energyLevelNum,
                                    dueDate: parsedDueDate || undefined,
                                    completed: false
                                }
                            });

                            let responseText = `✅ Tâche créée avec succès !\n\n` +
                                           `📝 Titre : ${task.title}\n` +
                                           `⭐ Priorité : ${this.getPriorityLabel(task.priority)} (${task.priority}/4)\n` +
                                           `⚡ Niveau d'énergie : ${this.getEnergyLabel(task.energyLevel)} (${task.energyLevel}/3)\n`;
                            
                            if (parsedDueDate) {
                                responseText += `📅 Échéance : ${this.formatDueDate(parsedDueDate)}\n`;
                            } else {
                                responseText += `📅 Pas d'échéance définie\n`;
                            }

                            responseText += `\n🎯 Votre tâche est maintenant dans votre liste ! Dites "mes tâches prioritaires" pour voir vos prochaines actions.`;

                            response = {
                                response: responseText,
                                contextual: true
                            };
                        }
                        break;
                    case 'reponse_creation_processus':
                        if (!item.details.nom || !item.details.description || !item.details.etapes || item.details.etapes.length === 0) {
                            response = {
                                response: "Je n'ai pas pu comprendre tous les détails du processus. Veuillez réessayer avec le format :\nNom du processus\nDescription\nÉtape 1\nÉtape 2\n...",
                                contextual: true
                            };
                        } else {
                            response = await this.createProcess(user.id, item.details);
                        }
                        break;
                    default:
                        response = {
                            response: "Je n'ai pas bien compris votre demande. Pouvez-vous reformuler ?",
                            contextual: false
                        };
                }
                if (response && typeof (response as any).response === 'string') {
                responses.push(response);
                } else {
                    console.log('ℹ️ Aucune réponse poussée pour cette action (ignorée ou sans contenu)');
                }
            }

            // Combiner les réponses
            const finalResponse = responses.length > 0 ? {
                response: responses.map(r => r.response).join('\n'),
                contextual: responses.some(r => r.contextual)
            } : {
                response: "D'accord, c'est noté.",
                contextual: true
            };

            // Enregistrer la réponse de l'IA dans la conversation
            await this.prisma.whatsAppMessage.create({
                data: {
                    conversationId: existingConversation.id,
                    content: finalResponse.response,
                    isFromUser: false
                }
            });

            return finalResponse;
        } catch (error) {
            console.error('❌ Erreur lors du traitement du message:', error);
            if (error instanceof Error) {
                console.error('   Type d\'erreur:', error.constructor.name);
                console.error('   Message:', error.message);
                console.error('   Stack:', error.stack);
            }
            return {
                response: "Désolé, une erreur s'est produite lors du traitement de votre demande. Veuillez réessayer.",
                contextual: true
            };
        }
    }

    private async handleNewUser(userId: string, message: string) {
        const welcomeMessage = `
        Bonjour ! Je suis votre assistant personnel. Je vais vous aider à gérer vos tâches et habitudes.
        Pour commencer, j'aurais besoin de quelques informations :
        - À quelle heure vous réveillez-vous habituellement ?
        - Quand préférez-vous faire les tâches importantes ?
        - Avez-vous des habitudes particulières à suivre ?
        `;

        const tempPassword = randomBytes(16).toString('hex');

        // Créer un nouvel utilisateur
        await this.prisma.user.create({
            data: {
                id: userId,
                name: "Nouvel utilisateur",
                email: `${userId}@temp.com`,
                password: tempPassword,
                notificationSettings: {
                    create: {
                        isEnabled: true,
                        emailEnabled: true,
                        pushEnabled: true,
                        whatsappEnabled: false,
                        startHour: 9,
                        endHour: 18
                    }
                }
            }
        });

        return {
            response: welcomeMessage,
            newUser: true
        };
    }

    private async handleCreateTask(user: UserWithRelations, data: any) {
        // Implémenter la création de tâche
        return { response: "Fonctionnalité en cours de développement" };
    }

    private async handleCreateHabit(user: UserWithRelations, data: any) {
        // Implémenter la création d'habitude
        return { response: "Fonctionnalité en cours de développement" };
    }

    private async handleUpdatePreferences(user: UserWithRelations, data: any) {
        // Implémenter la mise à jour des préférences
        return { response: "Fonctionnalité en cours de développement" };
    }

    private async handleMarkComplete(user: UserWithRelations, data: any) {
        // Implémenter le marquage comme terminé
        return { response: "Fonctionnalité en cours de développement" };
    }

    private async generateSummary(user: UserWithRelations) {
        // Implémenter la génération de résumé
        return { response: "Fonctionnalité en cours de développement" };
    }

    private async analyzeIntent(message: string, user: UserWithRelations): Promise<IntentAnalysis> {
        const prompt = `
        En tant qu'assistant personnel, analyse le message suivant et détermine l'intention de l'utilisateur.
        Message: "${message}"
        Contexte utilisateur: ${JSON.stringify(user.notificationSettings)}
        
        Retourne une des intentions suivantes:
        - CREATE_TASK: Pour créer une nouvelle tâche
        - CREATE_HABIT: Pour créer une nouvelle habitude
        - UPDATE_PREFERENCES: Pour mettre à jour les préférences
        - MARK_COMPLETE: Pour marquer une tâche ou habitude comme terminée
        - GET_SUMMARY: Pour obtenir un résumé
        - HELP: Pour obtenir de l'aide
        - CHAT: Pour une conversation générale
        `;

        const analysis = await this.chatGPT.analyzeMessage(prompt);
        return this.parseIntent(analysis);
    }

    private async generateContextualResponse(user: UserWithRelations, message: string) {
        const prompt = `
        En tant qu'assistant personnel, génère une réponse appropriée au message suivant.
        Message: "${message}"
        Contexte utilisateur: ${JSON.stringify(user)}
        
        La réponse doit être:
        - Personnalisée selon le contexte de l'utilisateur
        - En français
        - Utile et actionnable
        - Encourageante et positive
        `;

        const analysis = await this.chatGPT.analyzeMessage(prompt);
        return {
            response: analysis.analysis,
            contextual: true
        };
    }

    private getHelpMessage() {
        return {
            response: `🤖 Voici comment je peux vous aider :\n\n` +
                     `1. Gérer vos tâches :\n` +
                     `   - "Crée une tâche : [description]"\n` +
                     `   - "Marque la tâche [nom] comme terminée"\n\n` +
                     `2. Gérer vos habitudes :\n` +
                     `   - "Nouvelle habitude : [description]"\n` +
                     `   - "J'ai fait [habitude] aujourd'hui"\n\n` +
                     `3. Voir vos progrès :\n` +
                     `   - "Montre-moi mon résumé"\n` +
                     `   - "Quelles sont mes tâches pour aujourd'hui ?"\n\n` +
                     `4. Modifier vos préférences :\n` +
                     `   - "Je me réveille à [heure]"\n` +
                     `   - "Je préfère faire les tâches importantes le [moment]"`
        };
    }

    private parseIntent(analysis: any): IntentAnalysis {
        try {
            return {
                type: analysis.type || 'CHAT',
                data: analysis.data || {}
            };
        } catch (error) {
            console.error('Erreur lors du parsing de l\'intention:', error);
            return { type: 'CHAT', data: {} };
        }
    }

    private async listHabits(userId: string): Promise<AIResponse> {
        // On aligne la logique avec l'API web `/api/habits/date` pour éviter les bugs de fuseau horaire
        // et avoir exactement le même résultat que sur la page Habitudes.
        const today = new Date();
        // Normaliser à midi pour éviter les décalages de fuseau
        today.setHours(12, 0, 0, 0);
        const dayOfWeek = today
            .toLocaleDateString('en-US', { weekday: 'long' })
            .toLowerCase();

        const habits = await this.prisma.habit.findMany({
            where: {
                userId,
                // Ne garder que les habitudes prévues pour ce jour de la semaine
                daysOfWeek: {
                    has: dayOfWeek
                }
            },
            include: {
                entries: {
                    where: {
                        // Les entrées sont stockées avec la date normalisée (midi)
                        date: today
                    },
                    take: 1
                }
            },
            orderBy: { order: 'asc' }
        });

        if (habits.length === 0) {
            return {
                response: "Vous n'avez pas encore créé d'habitudes. Pour créer une nouvelle habitude, dites par exemple 'Créer une habitude: Méditer 10 minutes chaque matin'.",
                contextual: true
            };
        }

        // Formater la date
        const dateStr = today.toLocaleDateString('fr-FR', { 
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        let message = `📋 **Tes habitudes ${dateStr}**\n\n`;
        
        habits.forEach((habit, idx) => {
            const emoji = habit.frequency === 'daily' ? '🔁' : habit.frequency === 'weekly' ? '📅' : '⭐';
            const isCompleted = habit.entries.length > 0 && habit.entries[0].completed;
            const statusEmoji = isCompleted ? '✅' : '⏳';
            
            message += `${idx + 1}. ${emoji} ${habit.name} ${statusEmoji}\n`;
            
            if (habit.description) {
                message += `   ${habit.description}\n`;
            }
        });

        message += `\n💪 Continue tes efforts !`;

        return {
            response: message,
            contextual: true
        };
    }

    private async createHabit(userId: string, rawMessage: string, extractedName?: string): Promise<AIResponse> {
        // Préférer le nom extrait par GPT si disponible, sinon tenter d'extraire depuis le message brut
        const habitName = (extractedName && extractedName.trim()) || rawMessage.split(/créer une habitude|:/i).pop()?.trim();
        
        if (!habitName) {
            return {
                response: "Pour créer une habitude, donnez-moi son nom. Par exemple: 'Créer une habitude: Méditer 10 minutes chaque matin'",
                contextual: true
            };
        }

        // Détecter les jours mentionnés dans le message BRUT (pour capter "lundi, samedi, dimanche", "week-end", etc.)
        const days = this.parseDaysOfWeekFromText(rawMessage);
        const daysOfWeek = days.length > 0
            ? days
            : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        console.log('🗓️ Jours détectés pour la nouvelle habitude:', daysOfWeek);
        const frequency = daysOfWeek.length === 7 ? 'DAILY' : 'WEEKLY';

        const habit = await this.prisma.habit.create({
            data: {
                name: habitName,
                userId,
                frequency, // DAILY si 7 jours, sinon WEEKLY
                daysOfWeek, // Utiliser les jours détectés si fournis
                order: 0
            }
        });

        return {
            response: `✅ J'ai créé l'habitude "${habit.name}". Vous pouvez la marquer comme complétée en disant "Marquer habitude ${habit.name} comme complétée"`,
            contextual: true
        };
    }

    private async completeHabit(userId: string, message: string, phoneNumber?: string): Promise<AIResponse> {
        console.log('🔍 Analyse de la demande avec GPT');
        
        const prompt = `
        Tu es un assistant qui aide à comprendre les commandes liées aux habitudes.
        Analyse le message suivant et extrait :
        1. Le nom de l'habitude que l'utilisateur veut marquer comme complétée
        2. La date mentionnée (si présente)
        
        RÈGLES STRICTES pour la détection des dates :
        - Tu DOIS TOUJOURS détecter et extraire les mots-clés temporels suivants :
          * "hier" -> date: "hier", isRelative: true
          * "avant-hier" -> date: "avant-hier", isRelative: true
          * "demain" -> date: "demain", isRelative: true
          * Dates au format JJ/MM/YYYY -> date: "JJ/MM/YYYY", isRelative: false
        - La position du mot temporel dans la phrase n'a pas d'importance
        - Si le message contient "hier", tu DOIS ABSOLUMENT retourner date: "hier" et isRelative: true
        - Si aucun mot temporel n'est présent, utilise date: null
        
        Message: "${message}"
        
        Réponds au format JSON uniquement, avec cette structure :
        {
            "habitName": "nom de l'habitude (ou null si non trouvé)",
            "date": "date mentionnée (ou null si non mentionnée)",
            "isRelative": true/false (true si la date est relative comme "hier", "avant-hier", etc.)
        }
        
        Exemples :
        Message: "j'ai l'habitude deep work hier"
        {
            "habitName": "deep work",
            "date": "hier",
            "isRelative": true
        }

        Message: "hier j'ai fais l'habitude dormir 00h"
        {
            "habitName": "dormir 00h",
            "date": "hier",
            "isRelative": true
        }
        
        Message: "j'ai fait mon sport hier soir"
        {
            "habitName": "sport",
            "date": "hier",
            "isRelative": true
        }

        Message: "demain je fais deep work"
        {
            "habitName": "deep work",
            "date": "demain",
            "isRelative": true
        }

        Message: "avant-hier j'ai complété ma routine du soir"
        {
            "habitName": "routine du soir",
            "date": "avant-hier",
            "isRelative": true
        }

        Message: "Le 20/06/2024 j'ai fait ma routine du matin"
        {
            "habitName": "routine du matin",
            "date": "20/06/2024",
            "isRelative": false
        }

        Message: "Marquer habitude Méditation comme complétée"
        {
            "habitName": "méditation",
            "date": null,
            "isRelative": false
        }

        Message: "j'ai fait tâche 1"
        {
            "habitName": "Tâche 1",
            "date": null,
            "isRelative": false
        }

        Message: "j'ai terminé tâche 2 et tâche 3"
        {
            "habitName": "Tâche 2, Tâche 3",
            "date": null,
            "isRelative": false
        }

        Message: "Aujourd'hui j'ai fait les habitudes de dormir minuit, deep work, tâche 1, tâche 2, tâche 3"
        {
            "habitName": "Dormir 00h, Deep Work, Tâche 1, Tâche 2, Tâche 3",
            "date": null,
            "isRelative": false
        }

        Message: "hier j'ai fait tâche 1"
        {
            "habitName": "Tâche 1",
            "date": "hier",
            "isRelative": true
        }

        Message: "j'ai complété l'habitude Tâche 1"
        {
            "habitName": "Tâche 1",
            "date": null,
            "isRelative": false
        }

        Message: "j'ai fait mes trois tâches"
        {
            "habitName": "Tâche 1, Tâche 2, Tâche 3",
            "date": null,
            "isRelative": false
        }
        `;

        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "system",
                    content: prompt
                }],
                temperature: 0.1
            });

            const analysis = JSON.parse(completion.choices[0]?.message?.content || "{}");
            console.log('Analyse GPT:', analysis);

            // Support multi-habits: allow array or CSV in habitName
            let candidateNames: string[] = [];
            if (Array.isArray((analysis as any).habitNames)) {
                candidateNames = (analysis as any).habitNames as string[];
            } else if (analysis.habitName && analysis.habitName !== 'null') {
                candidateNames = this.splitHabitNames(analysis.habitName);
                if (candidateNames.length === 0) candidateNames = [analysis.habitName];
            }

            // Charger les habitudes de l'utilisateur pour enrichir la détection
            const habits = await this.prisma.habit.findMany({ where: { userId } });
            console.log('Habitudes disponibles:', habits.map(h => h.name));

            // Enrichir: détection par balayage du message (substring fuzzy simple)
            const normalizedMessage = this.normalizeText(message);
            for (const habit of habits) {
                const hn = this.normalizeText(habit.name);
                if (hn.length < 3) continue;
                if (normalizedMessage.includes(hn) || hn.includes(normalizedMessage)) {
                    if (!candidateNames.some(n => this.normalizeText(n) === hn)) {
                        candidateNames.push(habit.name);
                    }
                }
            }

            if (candidateNames.length === 0) {
                return {
                    response: "Pour marquer une ou plusieurs habitudes comme complétées, citez leurs noms. Exemple: 'j'ai fait sport, lecture et dormir à minuit'",
                    contextual: true
                };
            }

            // Mappages rapides pour alias courants
            const quickAlias: Record<string, string> = {
                'tracking': 'Tracking',
                'planifier': 'Planifier Journée',
                'reveil': 'Réveil 8h',
                'réveil': 'Réveil 8h',
                'deepwork': 'Deep Work',
            };

            // Map candidate names to best matching habits
            const matchedHabits: { id: string; name: string }[] = [];
            for (const candidate of candidateNames) {
                let match = this.findBestHabitMatch(habits, candidate);
                if (!match) {
                    const norm = this.normalizeText(candidate);
                    const aliasName = quickAlias[norm];
                    if (aliasName) {
                        const aliasMatch = habits.find(h => this.normalizeText(h.name) === this.normalizeText(aliasName));
                        if (aliasMatch) match = { id: aliasMatch.id, name: aliasMatch.name };
                    }
                }
                if (match && !matchedHabits.some(h => h.id === match.id)) {
                    matchedHabits.push(match);
                } else {
                    console.log(`Aucun match solide pour: ${candidate}`);
                }
            }

            if (matchedHabits.length === 0) {
                return {
                    response: `Je ne trouve pas d'habitudes correspondant à: ${candidateNames.join(', ')}. Vérifiez les noms et réessayez.`,
                    contextual: true
                };
            }

            // Déterminer la date AVANT de vérifier les habitudes spéciales
            let targetDate = new Date();
            console.log('📅 Date initiale:', targetDate.toISOString());
            
            if (analysis.date) {
                console.log('📅 Date détectée dans le message:', analysis.date);
                console.log('📅 Est une date relative:', analysis.isRelative);
                
                if (analysis.isRelative) {
                    switch (analysis.date.toLowerCase()) {
                        case 'hier':
                            targetDate.setDate(targetDate.getDate() - 1);
                            console.log('📅 Date après ajustement pour "hier":', targetDate.toISOString());
                            break;
                        case 'avant-hier':
                            targetDate.setDate(targetDate.getDate() - 2);
                            console.log('📅 Date après ajustement pour "avant-hier":', targetDate.toISOString());
                            break;
                        case 'demain':
                            targetDate.setDate(targetDate.getDate() + 1);
                            console.log('📅 Date après ajustement pour "demain":', targetDate.toISOString());
                            break;
                        // Ajouter d'autres cas si nécessaire
                    }
                } else {
                    // Formats pris en charge: JJ/MM(/AAAA) et "10 octobre"(/"10 octobre 2025")
                    let parsed: Date | null = null;
                    parsed = this.parseNumericDateFlexible(analysis.date) || this.parseFrenchDate(analysis.date);
                    if (parsed) {
                        targetDate = parsed;
                        console.log('📅 Date appliquée (flex):', targetDate.toISOString());
                    }
                }
            }

            // Créer une date UTC pour éviter les problèmes de fuseau horaire
            const utcTargetDate = new Date(Date.UTC(
                targetDate.getFullYear(),
                targetDate.getMonth(),
                targetDate.getDate(),
                0, 0, 0, 0
            ));
            console.log('📅 Date finale après conversion UTC:', utcTargetDate.toISOString());

            // For each matched habit: special handler OR create/check entry
            const confirmations: string[] = [];
            for (const habit of matchedHabits) {
                // 🎯 VÉRIFICATION HABITUDE SPÉCIALE (NOUVEAU SYSTÈME)
                // Éviter d'interpréter "journée" comme "Note de sa journée" si le message parle de planifier
                const originalMessage = (message || '').toLowerCase();
                const isPlanifierContext = originalMessage.includes('planifier');
                const isNoteJournee = this.normalizeText(habit.name).includes(this.normalizeText('Note de sa journée'));

                if (phoneNumber && this.specialHabitsHandler.isSpecialHabit(habit.name) && !(isPlanifierContext && isNoteJournee)) {
                console.log('🔥 Habitude spéciale détectée:', habit.name);
                console.log('📅 Date cible pour habitude spéciale:', utcTargetDate.toISOString());
                try {
                    const specialResponse = await this.specialHabitsHandler.startSpecialHabitCompletion(
                        userId,
                        phoneNumber,
                        habit.name,
                        habit.id,
                            utcTargetDate
                        );
                        confirmations.push(`✅ ${habit.name} → ${specialResponse}`);
                        // On continue les autres habitudes non-spéciales
                        continue;
                } catch (error) {
                    console.error('Erreur lors du traitement de l\'habitude spéciale:', error);
                    console.log('📝 Fallback vers le traitement normal');
                }
            }

                try {
                    // Vérifier si déjà complété pour cette date (clé unique habitId_date)
                    const existing = await this.prisma.habitEntry.findUnique({
                        where: {
                            habitId_date: {
                                habitId: habit.id,
                                date: utcTargetDate
                            }
                        }
                    });

                    if (existing) {
                        if (!existing.completed) {
                            await this.prisma.habitEntry.update({
                                where: {
                                    habitId_date: {
                                        habitId: habit.id,
                                        date: utcTargetDate
                                    }
                                },
                                data: { completed: true }
                            });
                            confirmations.push(`✅ ${habit.name}`);
                        } else {
                            confirmations.push(`ℹ️ ${habit.name} déjà complétée pour le ${utcTargetDate.toLocaleDateString('fr-FR')}`);
                        }
                    } else {
                        const created = await this.prisma.habitEntry.create({
                    data: {
                        habitId: habit.id,
                                date: utcTargetDate,
                        completed: true
                    }
                });
                        console.log('📅 Date enregistrée dans la base:', created.date.toISOString());
                        confirmations.push(`✅ ${habit.name}`);
                    }
                } catch (error: any) {
                    // En dernier recours, si conflit de clé unique
                    if (error.code === 'P2002') {
                        confirmations.push(`ℹ️ ${habit.name} déjà complétée pour le ${utcTargetDate.toLocaleDateString('fr-FR')}`);
                    } else {
                        throw error;
                    }
                }
            }

                const dateStr = targetDate.toLocaleDateString('fr-FR');
                return {
                response: `Traitement du ${dateStr}:
${confirmations.map(c => `• ${c}`).join('\n')}`,
                    contextual: true
                };
        } catch (error) {
            console.error('Erreur lors de l\'analyse GPT:', error);
            return {
                response: "Désolé, je n'ai pas pu analyser votre demande. Pouvez-vous reformuler ?",
                contextual: true
            };
        }
    }

    private async listTasks(userId: string): Promise<AIResponse> {
        // Récupérer toutes les tâches non complétées de l'utilisateur
        const allTasks = await this.prisma.task.findMany({
            where: { userId, completed: false },
            orderBy: [
                { priority: 'desc' },
                { dueDate: 'asc' },
                { createdAt: 'asc' }
            ]
        });

        if (allTasks.length === 0) {
            return {
                response: "🎉 Félicitations ! Vous n'avez aucune tâche en cours.\n\nVoulez-vous :\n• Créer de nouvelles tâches importantes\n• Planifier votre prochaine journée\n• Voir vos tâches complétées",
                contextual: true
            };
        }

        // Trier les tâches : date (en retard/aujourd'hui/demain) > priorité > énergie > dueDate croissante
        const today = new Date();
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const tomorrowOnly = new Date(todayOnly);
        tomorrowOnly.setDate(tomorrowOnly.getDate() + 1);

        const dateScore = (d: Date | null): number => {
            if (!d) return 0; // sans date
            const due = new Date(d);
            const dueOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
            if (dueOnly < todayOnly) return 5;      // en retard
            if (dueOnly.getTime() === todayOnly.getTime()) return 4; // aujourd'hui
            if (dueOnly.getTime() === tomorrowOnly.getTime()) return 3; // demain
            return 1; // plus tard
        };

        allTasks.sort((a, b) => {
            const da = dateScore(a.dueDate as any);
            const db = dateScore(b.dueDate as any);
            if (da !== db) return db - da;

            const pa = (a.priority ?? -1);
            const pb = (b.priority ?? -1);
            if (pa !== pb) return pb - pa;

            const ea = (a.energyLevel ?? -1);
            const eb = (b.energyLevel ?? -1);
            if (ea !== eb) return eb - ea;

            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate as any).getTime() - new Date(b.dueDate as any).getTime();
            }
            if (a.createdAt && b.createdAt) {
                return new Date(a.createdAt as any).getTime() - new Date(b.createdAt as any).getTime();
            }
            return 0;
        });

        // Formatter la réponse avec le même style que les tâches prioritaires
        let response = `📋 VOS ${allTasks.length} TÂCHE${allTasks.length > 1 ? 'S' : ''} EN COURS :\n\n`;

        allTasks.forEach((task, index) => {
            const priorityEmoji = this.getPriorityEmoji(task.priority);
            const priorityLabel = this.getPriorityLabel(task.priority);
            const energyLabel = this.getEnergyLabel(task.energyLevel);
            const dueDateText = task.dueDate 
                ? this.formatDueDate(task.dueDate)
                : "Pas d'échéance";

            response += `${index + 1}. ${priorityEmoji} ${task.title} (${priorityLabel})\n`;
            response += `   📅 Échéance : ${dueDateText} | ⚡ Énergie : ${energyLabel}\n\n`;
        });

        // Ajouter un conseil personnalisé basé sur la première tâche
        if (allTasks.length > 0) {
            const advice = this.getPriorityAdvice(allTasks[0].priority);
            response += `💡 ${advice}`;
        }

        return {
            response,
            contextual: true
        };
    }

    private async listPriorityTasks(userId: string): Promise<AIResponse> {
        // Récupérer toutes les tâches non complétées de l'utilisateur
        const allTasks = await this.prisma.task.findMany({
            where: { userId, completed: false },
            orderBy: [
                { priority: 'desc' },  // L'ordre DB est un filet de sécurité; on re-triera côté app
                { dueDate: 'asc' },
                { createdAt: 'asc' }
            ]
        });

        if (allTasks.length === 0) {
            return {
                response: "🎉 Félicitations ! Vous n'avez aucune tâche en cours.\n\nVoulez-vous :\n• Créer de nouvelles tâches importantes\n• Planifier votre prochaine journée\n• Voir vos tâches complétées",
                contextual: true
            };
        }

        // Filtrer et trier en prenant en compte la date AVANT la priorité
        // Groupes de date: En retard > Aujourd'hui > Demain > Plus tard > Sans date
        const today = new Date();
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const tomorrowOnly = new Date(todayOnly);
        tomorrowOnly.setDate(tomorrowOnly.getDate() + 1);

        const dateScore = (d: Date | null): number => {
            if (!d) return 0; // sans date
            const due = new Date(d);
            const dueOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
            if (dueOnly < todayOnly) return 5;      // en retard
            if (dueOnly.getTime() === todayOnly.getTime()) return 4; // aujourd'hui
            if (dueOnly.getTime() === tomorrowOnly.getTime()) return 3; // demain
            return 1; // plus tard
        };

        // Ne garder que Important et au-delà (>=2)
        const candidateTasks = allTasks.filter(task => (task.priority ?? -1) >= 2);

        if (candidateTasks.length === 0) {
            return {
                response: "Vous n'avez pas de tâches avec une priorité élevée (Important, Urgent ou Quick Win).\n\n💡 Conseil : Définissez des priorités pour vos tâches afin de mieux vous organiser !",
                contextual: true
            };
        }

        // Trier: date (overdue/aujourd'hui/demain) > priorité > énergie > dueDate croissante > createdAt
        candidateTasks.sort((a, b) => {
            const da = dateScore(a.dueDate as any);
            const db = dateScore(b.dueDate as any);
            if (da !== db) return db - da;

            const pa = (a.priority ?? -1);
            const pb = (b.priority ?? -1);
            if (pa !== pb) return pb - pa;

            const ea = (a.energyLevel ?? -1);
            const eb = (b.energyLevel ?? -1);
            if (ea !== eb) return eb - ea;

            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate as any).getTime() - new Date(b.dueDate as any).getTime();
            }
            if (a.createdAt && b.createdAt) {
                return new Date(a.createdAt as any).getTime() - new Date(b.createdAt as any).getTime();
            }
            return 0;
        });

        // Prendre les 3 premières après tri
        const top3Tasks = candidateTasks.slice(0, 3);

        // Formatter la réponse
        let response = "🔥 VOS 3 TÂCHES PRIORITAIRES :\n\n";

        top3Tasks.forEach((task, index) => {
            const priorityEmoji = this.getPriorityEmoji(task.priority);
            const priorityLabel = this.getPriorityLabel(task.priority);
            const energyLabel = this.getEnergyLabel(task.energyLevel);
            const dueDateText = task.dueDate 
                ? this.formatDueDate(task.dueDate)
                : "Pas d'échéance";

            response += `${index + 1}. ${priorityEmoji} ${task.title} (${priorityLabel})\n`;
            response += `   📅 Échéance : ${dueDateText} | ⚡ Énergie : ${energyLabel}\n\n`;
        });

        // Ajouter un conseil personnalisé
        const advice = this.getPriorityAdvice(top3Tasks[0].priority);
        response += `💡 ${advice}`;

        return {
            response,
            contextual: true
        };
    }

    private getPriorityEmoji(priority: number | null): string {
        switch (priority) {
            case 4: return "🚀";  // Quick Win
            case 3: return "⚡";  // Urgent
            case 2: return "📈";  // Important
            case 1: return "📝";  // À faire
            case 0: return "📋";  // Optionnel
            default: return "📝";
        }
    }

    private getPriorityLabel(priority: number | null): string {
        switch (priority) {
            case 4: return "Quick Win";
            case 3: return "Urgent";
            case 2: return "Important";
            case 1: return "À faire";
            case 0: return "Optionnel";
            default: return "Non définie";
        }
    }

    private getEnergyLabel(energyLevel: number | null): string {
        switch (energyLevel) {
            case 3: return "Extrême";
            case 2: return "Élevé";
            case 1: return "Moyen";
            case 0: return "Faible";
            default: return "Non défini";
        }
    }

    private formatDueDate(dueDate: Date): string {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Normaliser les dates pour comparaison (ignorer l'heure)
        const dueDateNormalized = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const tomorrowNormalized = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

        if (dueDateNormalized.getTime() === todayNormalized.getTime()) {
            return "Aujourd'hui";
        } else if (dueDateNormalized.getTime() === tomorrowNormalized.getTime()) {
            return "Demain";
        } else if (dueDateNormalized < todayNormalized) {
            return "⚠️ En retard";
        } else {
            return dueDate.toLocaleDateString('fr-FR');
        }
    }

    private getPriorityAdvice(topPriority: number | null): string {
        switch (topPriority) {
            case 4:
                return "Conseil : Commencez par la première pour un maximum d'impact ! Les Quick Wins boostent la motivation.";
            case 3:
                return "Conseil : Concentrez-vous sur l'urgent en premier pour éviter le stress.";
            case 2:
                return "Conseil : Planifiez du temps dédié pour ces tâches importantes avant qu'elles deviennent urgentes.";
            default:
                return "Conseil : Organisez ces tâches selon votre niveau d'énergie du moment.";
        }
    }

    private async createTask(userId: string, message: string, phoneNumber?: string): Promise<AIResponse> {
        // Vérifier si c'est une réponse à la création interactive
        const lines = message.split('\n').map(line => line.trim()).filter(line => line !== '');
        
        // Si nous avons au moins 3 lignes, c'est une création interactive
        if (lines.length >= 3) {
            try {
                const [title, priority, energyLevel, dueDate] = lines;
                
                // Valider les entrées
                const priorityNum = parseInt(priority);
                const energyLevelNum = parseInt(energyLevel);
                if (isNaN(priorityNum) || priorityNum < 0 || priorityNum > 4) {
                    return {
                        response: "La priorité doit être un nombre entre 0 et 4. Veuillez réessayer.",
                        contextual: true
                    };
                }
                if (isNaN(energyLevelNum) || energyLevelNum < 0 || energyLevelNum > 3) {
                    return {
                        response: "Le niveau d'énergie doit être un nombre entre 0 et 3. Veuillez réessayer.",
                        contextual: true
                    };
                }

                // Traiter la date d'échéance si fournie
                let parsedDueDate: Date | null = null;
                if (dueDate) {
                    const [day, month, year] = dueDate.split('/').map(Number);
                    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                        parsedDueDate = new Date(year, month - 1, day);
                    }
                }

                const task = await this.prisma.task.create({
                    data: {
                        title,
                        userId,
                        priority: priorityNum,
                        energyLevel: energyLevelNum,
                        dueDate: parsedDueDate,
                        completed: false
                    }
                });

                let response = `✅ Tâche créée avec succès !\n\n` +
                             `📝 Titre : ${task.title}\n` +
                             `⭐ Priorité : ${task.priority}/4\n` +
                             `⚡ Niveau d'énergie : ${task.energyLevel}/3\n`;
                
                if (parsedDueDate) {
                    response += `📅 Échéance : ${parsedDueDate.toLocaleDateString('fr-FR')}\n`;
                }

                return {
                    response,
                    contextual: true
                };
            } catch (error) {
                console.error('Erreur lors de la création de la tâche:', error);
                return {
                    response: "Une erreur est survenue lors de la création de la tâche. Veuillez réessayer.",
                    contextual: true
                };
            }
        }

        // Si ce n'est pas une réponse interactive, tenter de récupérer le contexte récent (titre/échéance)
        let taskTitle = message.split(/créer une tâche|:/i).pop()?.trim() || "Nouvelle tâche";
        let parsedDueDate: Date | null = null;
        let priorityNum: number | null = null;
        let energyLevelNum: number | null = null;

        if (phoneNumber) {
            try {
                // Récupérer la conversation et quelques derniers messages pour contexte
                const conversation = await this.prisma.whatsAppConversation.findFirst({
                    where: { userId, phoneNumber },
                });
                if (conversation) {
                    const recentMessages = await this.prisma.whatsAppMessage.findMany({
                        where: { conversationId: conversation.id },
                        orderBy: { createdAt: 'desc' },
                        take: 10
                    });

                    console.log('🔍 Messages récents pour contexte:', recentMessages.map(m => ({ 
                        isFromUser: m.isFromUser, 
                        content: m.content?.substring(0, 100) + '...',
                        createdAt: m.createdAt 
                    })));

                    // Chercher un prompt IA précédent qui listait les champs
                    const lastBotPrompt = recentMessages.find(m => !m.isFromUser && m.content && m.content.includes('Pour créer votre tâche'));
                    console.log('🤖 Dernier prompt bot trouvé:', lastBotPrompt?.content?.substring(0, 200));
                    // Extraire le titre depuis le prompt bot si présent
                    let titleFromPrompt: string | null = null;
                    if (lastBotPrompt?.content) {
                        const mTitle = lastBotPrompt.content.match(/Tâche\s*:\s*"([^"]+)"/i);
                        if (mTitle && mTitle[1]) {
                            titleFromPrompt = mTitle[1].trim();
                            console.log('🧠 Titre extrait du prompt:', titleFromPrompt);
                        }
                    }

                    // Chercher la dernière mention utilisateur d'une date relative ou absolue (JJ/MM/YYYY ou '10 octobre 2025')
                    const lastUserWithDate = recentMessages.find(m => m.isFromUser && ( /\b(demain|aujourd'hui|ce soir|cette semaine|la semaine prochaine|\d{1,2}\/\d{1,2}\/\d{2,4})\b/i.test(m.content || '') || this.parseFrenchDate(m.content || '') ));
                    console.log('📅 Message avec date trouvé:', lastUserWithDate?.content);

                    // Chercher un titre proposé précédemment (plus large recherche)
                    const lastUserTaskMention = recentMessages.find(m => m.isFromUser && 
                        (m.content?.toLowerCase().includes('créer une tâche') || 
                         m.content?.toLowerCase().includes('finaliser') ||
                         m.content?.toLowerCase().includes('agent ia') ||
                         m.content?.toLowerCase().includes('tâche')));
                    
                    console.log('📝 Message avec tâche trouvé:', lastUserTaskMention?.content);

                    const isPriorityReply = /priorit|énergie|energie|urgent|extrême|extreme|élevé|eleve|moyen|faible|^\d+\s*(\n|et)\s*\d+/i.test(message);
                    if (lastUserTaskMention && (taskTitle === "Nouvelle tâche" || isPriorityReply || /priorit|énergie|energie/.test(taskTitle))) {
                        const content = lastUserTaskMention.content || '';
                        // Extraire le titre après "créer une tâche" ou chercher des mots-clés
                        let extracted = content.split(/créer une tâche|:/i).pop()?.trim();
                        if (!extracted || extracted.length < 3) {
                            // Si pas trouvé, chercher des patterns spécifiques
                            if (content.toLowerCase().includes('finaliser l\'agent ia')) {
                                extracted = 'finaliser l\'agent IA';
                            } else if (content.toLowerCase().includes('finaliser')) {
                                extracted = content.match(/finaliser[^.]*/i)?.[0]?.trim();
                            }
                        }
                        if (!extracted && titleFromPrompt) {
                            extracted = titleFromPrompt;
                        }
                        if (extracted && extracted.length > 2) {
                            taskTitle = extracted;
                            console.log('✅ Titre extrait du contexte:', taskTitle);
                        }
                    }

                    if (lastUserWithDate) {
                        const content = lastUserWithDate.content || '';
                        console.log('📅 Traitement de la date:', content);
                        if (/demain/i.test(content)) {
                            const t = new Date();
                            t.setDate(t.getDate() + 1);
                            parsedDueDate = t;
                            console.log('✅ Date demain appliquée:', parsedDueDate);
                        } else if (/aujourd'hui|ce soir/i.test(content)) {
                            parsedDueDate = new Date();
                            console.log('✅ Date aujourd\'hui appliquée:', parsedDueDate);
                        } else if (/cette semaine/i.test(content)) {
                            // laisser null, info trop vague
                        } else if (/la semaine prochaine/i.test(content)) {
                            // laisser null, info trop vague
                        } else {
                            const m = content.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
                            if (m) {
                                const [_, d, mo, y] = m;
                                const day = parseInt(d, 10);
                                const month = parseInt(mo, 10) - 1;
                                let year = parseInt(y, 10);
                                if (year < 100) year += 2000;
                                parsedDueDate = new Date(year, month, day);
                                console.log('✅ Date absolue appliquée:', parsedDueDate);
                            } else {
                                const fr = this.parseFrenchDate(content);
                                if (fr) {
                                    parsedDueDate = fr;
                                    console.log('✅ Date française appliquée:', parsedDueDate);
                                }
                            }
                        }
                    }

                    // Chercher une réponse utilisateur contenant deux chiffres (priorité/énergie)
                    const lastUserNumbers = recentMessages.find(m => m.isFromUser && (m.content?.match(/^\d+\s*\n\s*\d+$/m) || /priorit|énergie|energie|urgent|extrême|extreme|élevé|eleve|moyen|faible/.test(m.content || '')));
                    if (lastUserNumbers) {
                        console.log('🔢 Message avec chiffres/texte trouvé:', lastUserNumbers.content);
                        const txt = lastUserNumbers.content || '';
                        // Extraire chiffres si présents
                        const numMatch = txt.match(/priorit[ée]?\s*(\d)/i) || txt.match(/(\d+)\s*(?:\n|et)\s*(\d+)/);
                        if (numMatch) {
                            if (numMatch.length >= 2) priorityNum = parseInt(numMatch[1], 10);
                            if (numMatch.length >= 3 && numMatch[2]) energyLevelNum = parseInt(numMatch[2], 10);
                        }
                        // Mapper mots-clés si pas de chiffres pour énergie/priorité
                        if (priorityNum == null) {
                            if (/urgent/i.test(txt)) priorityNum = 4;
                            else if (/important/i.test(txt)) priorityNum = 3;
                            else if (/normal/i.test(txt)) priorityNum = 2;
                            else if (/faible/i.test(txt)) priorityNum = 1;
                            else if (/someday|un jour/i.test(txt)) priorityNum = 0;
                        }
                        if (energyLevelNum == null) {
                            if (/extr[êe]me|extreme/i.test(txt)) energyLevelNum = 3;
                            else if (/[ée]lev[ée]|eleve/i.test(txt)) energyLevelNum = 2;
                            else if (/moyen/i.test(txt)) energyLevelNum = 1;
                            else if (/faible/i.test(txt)) energyLevelNum = 0;
                        }
                        console.log('✅ Priorité/Énergie après mapping:', priorityNum, energyLevelNum);
                        // Si on répond à un prompt et qu'on a un titre du prompt, l'utiliser
                        if (titleFromPrompt && (isPriorityReply || /priorit|énergie|energie/.test(message))) {
                            taskTitle = titleFromPrompt;
                            console.log('✅ Titre défini depuis prompt (réponse priorités):', taskTitle);
                        }
                    }
                }
            } catch (e) {
                console.warn('Contexte conversation non disponible pour createTask:', e);
            }
        }
        
        const task = await this.prisma.task.create({
            data: {
                title: taskTitle,
                userId,
                completed: false,
                priority: priorityNum ?? 2,
                energyLevel: energyLevelNum ?? 2,
                dueDate: parsedDueDate ?? null
            }
        });

        return {
            response: `✅ J'ai créé la tâche "${task.title}". Vous pouvez la marquer comme complétée en disant "Marquer tâche ${task.title} comme complétée"`,
            contextual: true
        };
    }

    private async completeTask(userId: string, message: string): Promise<AIResponse> {
        // Charger toutes les tâches non complétées de l'utilisateur
        const tasks = await this.prisma.task.findMany({ 
            where: { 
                userId,
                completed: false
            } 
        });
        
        const prompt = `
            Analyse le message suivant et trouve la ou les tâche(s) qui correspondent le mieux.
            Message: "${message}"
            
            Tâches disponibles (non complétées):
            ${tasks.map((t, i) => `${i + 1}. "${t.title}"`).join('\n')}
            
            Réponds au format JSON uniquement avec cette structure :
            {
                "matchedTasks": [["numéro_de_la_tâche", "confiance"]],
                "message": "description courte"
            }
            
            Exemples :
            
            Message: "j'ai fait la tâche faire un ticket billing"
            {
                "matchedTasks": [["Faire un ticket billing pour Superwall", "0.95"]],
                "message": "ticket billing détecté"
            }
            
            Message: "j'ai terminé setup superwall"
            {
                "matchedTasks": [["Set up compéltement superwall", "0.90"]],
                "message": "setup superwall détecté"
            }
            
            Message: "j'ai fait toutes mes tâches"
            {
                "matchedTasks": [["Tâche 1", "0.85"], ["Tâche 2", "0.85"], ["Tâche 3", "0.85"]],
                "message": "toutes les tâches"
            }
            
            Message: "j'ai fini de créer l'app pour playstore"
            {
                "matchedTasks": [["Créer nouvelle abb pour playstore", "0.95"]],
                "message": "app playstore détectée"
            }
            
            Utilise une confidence >= 0.70 pour valider un match. Si aucun match suffisant, réponds :
            {
                "matchedTasks": [],
                "message": "aucune tâche correspondante trouvée"
            }
        `;

        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "system",
                    content: prompt
                }],
                temperature: 0.1
            });

            const analysis = JSON.parse(completion.choices[0]?.message?.content || "{}");
            console.log('🔍 Analyse IA des tâches:', analysis);

            if (analysis.matchedTasks?.length === 0) {
            return {
                    response: "Je ne trouve pas de tâche correspondante dans votre liste. Voici vos tâches actuelles :\n" + 
                              tasks.slice(0, 5).map(t => `• ${t.title}`).join('\n'),
                contextual: true
            };
        }

            // Marquage des tâches trouvées
            const completedTasks = [];
            for (const [taskTitle, confidence] of analysis.matchedTasks) {
                const task = tasks.find(t => t.title === taskTitle);
                if (task) {
        await this.prisma.task.update({
            where: { id: task.id },
            data: { completed: true }
        });
                    completedTasks.push(task.title);
                }
            }

            if (completedTasks.length === 0) {
        return {
                    response: "Aucune tâche trouvée avec ce nom.",
            contextual: true
        };
            }

            const tasksList = completedTasks.length === 1 
                ? `"${completedTasks[0]}"`
                : completedTasks.map(t => `"${t}"`).join(', ');

            return {
                response: `✅ Parfait ! J'ai marqué ${completedTasks.length === 1 ? 'la tâche' : 'les tâches'} ${tasksList} comme complétée${completedTasks.length > 1 ? 's' : ''} !`,
                contextual: true
            };

        } catch (error) {
            console.error('❌ Erreur lors de l\'analyse des tâches:', error);
            return {
                response: "Désolé, une erreur s'est produite lors du traitement. Réessayez.",
                contextual: true
            };
        }
    }

    private async completeAllTasks(userId: string, dateString?: string): Promise<AIResponse> {
        // Déterminer la date cible
        const targetDate = this.parseTargetDate(dateString);
        
        // Récupérer toutes les tâches non complétées
        const pendingTasks = await this.prisma.task.findMany({
            where: { userId, completed: false }
        });

        if (pendingTasks.length === 0) {
            const dateLabel = this.formatDateLabel(targetDate, dateString);
            return {
                response: `🎉 Incroyable ! Vous n'avez aucune tâche en cours${dateLabel ? ` ${dateLabel}` : ''}.\n\nVous êtes déjà au top de votre productivité ! 🚀\n\nVoulez-vous créer de nouvelles tâches pour continuer sur cette lancée ?`,
                contextual: true
            };
        }

        // Marquer toutes les tâches comme complétées avec la date spécifiée
        const result = await this.prisma.task.updateMany({
            where: { userId, completed: false },
            data: { 
                completed: true,
                // Note: On pourrait aussi ajouter un champ completedAt si nécessaire
            }
        });

        // Créer une réponse de félicitations avec statistiques
        const priorityStats = this.calculateTaskPriorityStats(pendingTasks);
        const energyStats = this.calculateTaskEnergyStats(pendingTasks);

        const dateLabel = this.formatDateLabel(targetDate, dateString);
        const dateTitle = dateString ? dateLabel.replace('pour ', '') : '';
        
        let response = `🎉 FÉLICITATIONS ! Toutes vos tâches${dateTitle ? ` ${dateTitle}` : ''} sont terminées !\n\n`;
        response += `📊 STATISTIQUES DE VOTRE SESSION${dateTitle ? ` ${dateLabel.replace('pour ', '').toUpperCase()}` : ''} :\n`;
        response += `✅ ${result.count} tâches complétées\n`;
        
        if (priorityStats.quickWins > 0) {
            response += `🚀 ${priorityStats.quickWins} Quick Win${priorityStats.quickWins > 1 ? 's' : ''}\n`;
        }
        if (priorityStats.urgent > 0) {
            response += `⚡ ${priorityStats.urgent} tâche${priorityStats.urgent > 1 ? 's' : ''} urgente${priorityStats.urgent > 1 ? 's' : ''}\n`;
        }
        if (priorityStats.important > 0) {
            response += `📈 ${priorityStats.important} tâche${priorityStats.important > 1 ? 's' : ''} importante${priorityStats.important > 1 ? 's' : ''}\n`;
        }

        response += `\n⚡ NIVEAU D'ÉNERGIE INVESTI :\n`;
        response += `• Élevé/Extrême : ${energyStats.high}\n`;
        response += `• Moyen/Faible : ${energyStats.low}\n`;

        response += `\n🏆 VOUS ÊTES UNE MACHINE À PRODUCTIVITÉ !\n`;
        response += `💡 Conseil : Prenez un moment pour célébrer ce succès avant de planifier la suite !`;

        return {
            response,
            contextual: true
        };
    }

    private async completeAllHabits(userId: string, dateString?: string): Promise<AIResponse> {
        // Déterminer la date cible
        const targetDate = this.parseTargetDate(dateString);
        
        // Récupérer toutes les habitudes de l'utilisateur
        const habits = await this.prisma.habit.findMany({
            where: { userId }
        });

        if (habits.length === 0) {
            const dateLabel = this.formatDateLabel(targetDate, dateString);
            return {
                response: `Vous n'avez pas encore créé d'habitudes${dateLabel ? ` ${dateLabel}` : ''}. Voulez-vous commencer par définir de bonnes habitudes à suivre ?`,
                contextual: true
            };
        }

        // Convertir la date cible en UTC
        const targetDateUTC = new Date(Date.UTC(
            targetDate.getFullYear(),
            targetDate.getMonth(),
            targetDate.getDate(),
            0, 0, 0, 0
        ));

        let completedCount = 0;
        let alreadyCompletedCount = 0;

        // Traiter chaque habitude
        for (const habit of habits) {
            // Vérifier si l'habitude a déjà une entrée pour la date cible
            const existingEntry = await this.prisma.habitEntry.findFirst({
                where: {
                    habitId: habit.id,
                    date: targetDateUTC
                }
            });

            if (existingEntry) {
                if (!existingEntry.completed) {
                    // Marquer comme complétée
                    await this.prisma.habitEntry.update({
                        where: { id: existingEntry.id },
                        data: { completed: true }
                    });
                    completedCount++;
                } else {
                    alreadyCompletedCount++;
                }
            } else {
                // Créer une nouvelle entrée complétée
                await this.prisma.habitEntry.create({
                    data: {
                        habitId: habit.id,
                        date: targetDateUTC,
                        completed: true
                    }
                });
                completedCount++;
            }
        }

        // Créer la réponse avec la date
        const dateLabel = this.formatDateLabel(targetDate, dateString);
        const dateTitle = dateString ? dateLabel.replace('pour ', '') : 'du jour';
        
        let response = `🎉 BRAVO ! Toutes vos habitudes ${dateTitle} sont validées !\n\n`;
        response += `📊 RÉSUMÉ ${dateString ? dateLabel.replace('pour ', '').toUpperCase() : 'DU JOUR'} :\n`;
        response += `✅ ${completedCount} habitude${completedCount > 1 ? 's' : ''} complétée${completedCount > 1 ? 's' : ''}\n`;
        
        if (alreadyCompletedCount > 0) {
            response += `✔️ ${alreadyCompletedCount} déjà terminée${alreadyCompletedCount > 1 ? 's' : ''}\n`;
        }

        response += `🎯 Total : ${habits.length} habitude${habits.length > 1 ? 's' : ''} de votre routine\n\n`;

        // Ajouter des encouragements selon le nombre d'habitudes
        if (habits.length >= 5) {
            response += `🏆 INCROYABLE ! Maintenir ${habits.length} habitudes quotidiennes, c'est du niveau expert !\n`;
        } else if (habits.length >= 3) {
            response += `🌟 EXCELLENT ! Vous maîtrisez parfaitement votre routine quotidienne !\n`;
        } else {
            response += `💪 SUPER ! Continuez comme ça, la régularité est la clé du succès !\n`;
        }

        response += `💡 Conseil : Les habitudes créent l'excellence. Vous êtes sur la bonne voie !`;

        return {
            response,
            contextual: true
        };
    }

    private calculateTaskPriorityStats(tasks: any[]) {
        return {
            quickWins: tasks.filter(t => t.priority === 4).length,
            urgent: tasks.filter(t => t.priority === 3).length,
            important: tasks.filter(t => t.priority === 2).length,
            regular: tasks.filter(t => t.priority === 1).length,
            optional: tasks.filter(t => t.priority === 0).length
        };
    }

    private calculateTaskEnergyStats(tasks: any[]) {
        return {
            high: tasks.filter(t => t.energyLevel >= 2).length,
            low: tasks.filter(t => t.energyLevel < 2).length
        };
    }

    private parseTargetDate(dateString?: string): Date {
        const today = new Date();
        
        if (!dateString) {
            return today;
        }

        const lowerDateString = dateString.toLowerCase().trim();
        
        if (lowerDateString === 'hier') {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return yesterday;
        }
        
        if (lowerDateString === 'avant-hier') {
            const dayBeforeYesterday = new Date(today);
            dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
            return dayBeforeYesterday;
        }

        // Tenter de parser une date au format JJ/MM/YYYY ou JJ/MM/YY
        const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
        const match = dateString.match(dateRegex);
        
        if (match) {
            const [, day, month, year] = match;
            const parsedDay = parseInt(day, 10);
            const parsedMonth = parseInt(month, 10) - 1; // Les mois sont 0-indexés en JS
            let parsedYear = parseInt(year, 10);
            
            // Si l'année est sur 2 chiffres, ajouter 2000
            if (parsedYear < 100) {
                parsedYear += 2000;
            }
            
            const parsedDate = new Date(parsedYear, parsedMonth, parsedDay);
            
            // Vérifier que la date est valide
            if (parsedDate.getDate() === parsedDay && 
                parsedDate.getMonth() === parsedMonth && 
                parsedDate.getFullYear() === parsedYear) {
                return parsedDate;
            }
        }

        // Si le parsing échoue, retourner aujourd'hui
        return today;
    }

    private formatDateLabel(targetDate: Date, originalDateString?: string): string {
        if (!originalDateString) {
            return '';
        }

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const dayBeforeYesterday = new Date(today);
        dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

        // Comparer les dates (ignorer l'heure)
        const isSameDay = (date1: Date, date2: Date) => {
            return date1.getDate() === date2.getDate() &&
                   date1.getMonth() === date2.getMonth() &&
                   date1.getFullYear() === date2.getFullYear();
        };

        if (isSameDay(targetDate, today)) {
            return 'pour aujourd\'hui';
        } else if (isSameDay(targetDate, yesterday)) {
            return 'pour hier';
        } else if (isSameDay(targetDate, dayBeforeYesterday)) {
            return 'pour avant-hier';
        } else {
            return `pour le ${targetDate.toLocaleDateString('fr-FR')}`;
        }
    }

    private async listProcesses(userId: string): Promise<AIResponse> {
        const processes = await this.prisma.process.findMany({
            where: { userId },
            include: {
                steps: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (processes.length === 0) {
            return {
                response: "Vous n'avez pas encore créé de processus. Pour créer un nouveau processus, dites par exemple 'Créer un processus: Onboarding client'",
                contextual: true
            };
        }

        const processList = processes.map(process => {
            let response = `\n📋 ${process.name}\n`;
            
            // Essayer de parser la description si c'est du JSON
            let description = process.description;
            try {
                const parsedDesc = JSON.parse(process.description);
                if (Array.isArray(parsedDesc)) {
                    description = parsedDesc.map(step => step.title).join(', ');
                }
            } catch (e) {
                // Si ce n'est pas du JSON valide, utiliser la description telle quelle
            }
            
            response += `📝 ${description}\n`;
            
            if (process.steps && process.steps.length > 0) {
                response += `Étapes:\n`;
                process.steps.forEach((step, index) => {
                    response += `   ${index + 1}. ${step.title}\n`;
                });
            } else {
                response += `Aucune étape définie\n`;
            }
            return response;
        }).join('\n');

        return {
            response: `Voici vos processus :${processList}`,
            contextual: true
        };
    }

    private async createProcess(userId: string, details: { nom?: string, description?: string, etapes?: string[] }): Promise<AIResponse> {
        if (!details.nom || !details.description) {
            return {
                response: "Pour créer un processus, j'ai besoin d'un nom et d'une description. Par exemple:\nCréer un processus: Onboarding client\nDescription: Processus d'accueil des nouveaux clients\n1. Appel de découverte\n2. Envoi du devis\n3. Signature du contrat",
                contextual: true
            };
        }

        try {
            const process = await this.prisma.process.create({
                data: {
                    name: details.nom,
                    description: details.description,
                    userId,
                    steps: {
                        create: (details.etapes || []).map((step, index) => ({
                            title: step,
                            order: index
                        }))
                    }
                },
                include: {
                    steps: {
                        orderBy: { order: 'asc' }
                    }
                }
            });

            const steps = process.steps.map((step, index) => `   ${index + 1}. ${step.title}`).join('\n');
            return {
                response: `✅ Processus créé avec succès !\n\n📋 ${process.name}\n📝 ${process.description}\nÉtapes:\n${steps}`,
                contextual: true
            };
        } catch (error) {
            console.error('Erreur lors de la création du processus:', error);
            return {
                response: "Une erreur est survenue lors de la création du processus. Veuillez réessayer.",
                contextual: true
            };
        }
    }

    private async generateHelpResponse(message: string, userId: string): Promise<AIResponse> {
        try {
            // Récupérer le contexte utilisateur
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const [pendingTasks, completedToday, activeSession] = await Promise.all([
                this.prisma.task.count({
                    where: {
                        userId,
                        completed: false
                    }
                }),
                this.prisma.task.count({
                    where: {
                        userId,
                        dueDate: { gte: today, lt: tomorrow },
                        completed: true
                    }
                }),
                this.prisma.deepWorkSession.findFirst({
                    where: {
                        userId,
                        status: 'active'
                    }
                })
            ]);

            // Estimer le niveau d'énergie
            const hour = new Date().getHours();
            let energyLevel = 'moyen';
            if (hour >= 8 && hour < 12) energyLevel = 'élevé';
            else if (hour >= 20 || hour < 7) energyLevel = 'faible';

            const systemPrompt = `Tu es l'assistant IA personnel de productivité Productif.io.

Ton rôle : Aider l'utilisateur à comprendre comment faire quelque chose, lui expliquer un processus, ou le guider dans la réalisation d'une tâche.

**STYLE DE RÉPONSE** :
- Sois clair, concis et actionnable
- Utilise des emojis pertinents pour rendre la réponse agréable
- Structure ta réponse avec des étapes numérotées si c'est un processus
- Donne des exemples concrets quand c'est pertinent
- Sois encourageant et bienveillant
- Limite-toi à 300 mots maximum

**CONTEXTE UTILISATEUR** :
- ${pendingTasks} tâche(s) en attente
- ${completedToday} tâche(s) complétée(s) aujourd'hui
- Session Deep Work active : ${activeSession ? 'Oui' : 'Non'}
- Niveau d'énergie : ${energyLevel}

**FONCTIONNALITÉS DISPONIBLES DANS PRODUCTIF.IO** :
1. **Création de tâches** : L'utilisateur peut dire "j'ai à faire X" ou "créer une tâche X"
2. **Planification intelligente** : "planifie demain" ou "organise ma journée"
3. **Deep Work** : "je commence à travailler" pour démarrer une session de concentration
4. **Journaling** : "note de ma journée" pour enregistrer sa journée
5. **Habitudes** : Suivi des habitudes quotidiennes
6. **Statistiques** : Voir ses performances et progrès
7. **Processus** : Créer et suivre des processus étape par étape

**TYPES D'AIDE COURANTS** :
- Comment planifier efficacement sa journée
- Comment utiliser le Deep Work pour se concentrer
- Comment créer et gérer des tâches
- Comment être plus productif
- Comment organiser son temps
- Comment gérer ses priorités
- Comment suivre ses habitudes
- Comment utiliser les fonctionnalités de Productif.io
- Comment réaliser une tâche spécifique (ex: "comment faire la tâche X")

Si la demande est vague, pose des questions pour clarifier ou donne des exemples de ce que tu peux aider.

Réponds de manière naturelle et conversationnelle, comme un ami bienveillant qui veut vraiment aider.`;

            const userPrompt = `Demande de l'utilisateur : "${message}"

Génère une réponse d'aide utile, claire et actionnable. Si c'est un processus, décompose-le en étapes. Si c'est vague, propose des options ou pose des questions pour clarifier.`;

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 500
            });

            const helpText = completion.choices[0]?.message?.content || 
                "Je suis là pour t'aider ! Peux-tu préciser ce sur quoi tu as besoin d'aide ? 🤔"

            // Ajouter une suggestion de suivi si pertinent
            let followUpSuggestion = "";
            const lowerMessage = message.toLowerCase();
            
            if (lowerMessage.includes('planif') || lowerMessage.includes('organis')) {
                followUpSuggestion = "\n\n💡 *Astuce :* Tu peux me dire \"planifie demain\" et je t'aiderai à organiser ta journée !";
            } else if (lowerMessage.includes('tâche') || lowerMessage.includes('tache') || lowerMessage.includes('todo')) {
                if (pendingTasks > 0) {
                    followUpSuggestion = `\n\n📋 Tu as ${pendingTasks} tâche(s) en attente. Dis-moi \"mes tâches\" pour les voir !`;
                } else {
                    followUpSuggestion = "\n\n💡 *Astuce :* Dis-moi simplement \"j'ai à faire X\" et je créerai la tâche pour toi !";
                }
            } else if (lowerMessage.includes('concentr') || lowerMessage.includes('travail') || lowerMessage.includes('productif')) {
                if (!activeSession) {
                    followUpSuggestion = "\n\n🚀 *Astuce :* Dis-moi \"je commence à travailler\" pour démarrer une session Deep Work !";
                }
            }

            return {
                response: helpText + followUpSuggestion,
                contextual: true
            };
        } catch (error) {
            console.error('Erreur lors de la génération de réponse d\'aide:', error);
            return {
                response: "Je suis là pour t'aider ! Peux-tu préciser ce sur quoi tu as besoin d'aide ? 🤔\n\nPar exemple :\n• Comment planifier ma journée ?\n• Comment utiliser le Deep Work ?\n• Comment créer une tâche ?",
                contextual: true
            };
        }
    }

    private async generateGenericResponse(message: string): Promise<AIResponse> {
        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "system",
                    content: "Tu es un assistant personnel qui aide à la gestion des tâches, habitudes et processus. Réponds de manière concise et utile."
                }, {
                    role: "user",
                    content: message
                }]
            });

            return {
                response: completion.choices[0]?.message?.content || "Je ne comprends pas votre demande. Pouvez-vous reformuler ?",
                contextual: false
            };
        } catch (error) {
            console.error('Erreur lors de la génération de réponse:', error);
            return {
                response: "Je ne suis pas sûr de comprendre. Pouvez-vous reformuler votre demande ?",
                contextual: false
            };
        }
    }

    private async createReminder(userId: string, details: { date?: string; time?: string; message?: string; minutes?: number }): Promise<AIResponse> {
        try {
            if (!details.message) {
                return {
                    response: "Je n'ai pas pu comprendre le message du rappel. Pouvez-vous préciser ?",
                    contextual: true
                };
            }

            let scheduledFor: Date;

            // Si on a un nombre de minutes, calculer la date relative
            if (details.minutes !== undefined && details.minutes > 0) {
                scheduledFor = new Date();
                scheduledFor.setMinutes(scheduledFor.getMinutes() + details.minutes);
            }
            // Sinon utiliser la date et l'heure spécifiées
            else if (details.date && details.time) {
                const [day, month, year] = details.date.split('/').map(Number);
                const [hour, minute] = details.time.split(':').map(Number);
                
                if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hour) || isNaN(minute)) {
                    return {
                        response: "Le format de la date ou de l'heure n'est pas valide. Utilisez JJ/MM/AAAA pour la date et HH:mm pour l'heure.",
                        contextual: true
                    };
                }

                scheduledFor = new Date(year, month - 1, day, hour, minute);
            } else {
                return {
                    response: "Je n'ai pas pu comprendre quand programmer le rappel. Pouvez-vous préciser la date et l'heure ou le délai en minutes ?",
                    contextual: true
                };
            }

            // Créer la notification
            await this.prisma.notificationHistory.create({
                data: {
                    userId,
                    type: 'CUSTOM_REMINDER',
                    content: details.message,
                    scheduledFor,
                    status: 'pending'
                }
            });

            // Affichage en timezone locale (par défaut Europe/Paris)
            const displayTimeZone = process.env.DEFAULT_TIMEZONE || 'Europe/Paris';
            const dateStr = new Intl.DateTimeFormat('fr-FR', { timeZone: displayTimeZone }).format(scheduledFor);
            const timeStr = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: displayTimeZone }).format(scheduledFor);

            return {
                response: `✅ Rappel créé avec succès !\n📅 Date : ${dateStr}\n⏰ Heure : ${timeStr}\n📝 Message : ${details.message}`,
                contextual: true
            };
        } catch (error) {
            console.error('Erreur lors de la création du rappel:', error instanceof Error ? error.message : 'Unknown error');
            return {
                response: "Une erreur s'est produite lors de la création du rappel. Veuillez réessayer.",
                contextual: true
            };
        }
    }
} 