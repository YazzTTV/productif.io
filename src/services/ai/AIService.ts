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
        action: 'voir_taches' | 'voir_habitudes' | 'voir_taches_prioritaires' | 'completer_tache' | 'completer_habitude' | 'completer_toutes_taches' | 'completer_toutes_habitudes' | 'creer_tache' | 'creer_tache_interactive' | 'creer_habitude' | 'reponse_creation_tache' | 'voir_processus' | 'creer_processus' | 'creer_processus_interactif' | 'reponse_creation_processus' | 'creer_rappel';
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

export class AIService {
    private prisma: PrismaClient;
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
            1. Le type d'action (voir_taches, voir_habitudes, voir_taches_prioritaires, completer_tache, completer_habitude, creer_tache, creer_tache_interactive, creer_habitude, reponse_creation_tache, voir_processus, creer_processus, creer_processus_interactif, reponse_creation_processus, creer_rappel)
            2. Les détails pertinents (nom, description, etc.)
            
            RÈGLES CRUCIALES :
            
            1. CRÉATION DE TÂCHES - Quand utiliser creer_tache_interactive :
               - Si le message mentionne seulement le nom de la tâche → utilise 'creer_tache_interactive'
               - Si le message contient priorité ET niveau d'énergie → utilise 'creer_tache'
               - Si le message a des dates relatives (demain, aujourd'hui) → extrait l'échéance
            
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
            
            DISTINCTION CRITIQUE - Tâches normales VS prioritaires :
            
            Message: "mes tâches" → voir_taches (toutes les tâches)
            Message: "quelles sont mes tâches" → voir_taches (toutes les tâches)
            Message: "mes tâches prioritaires" → voir_taches_prioritaires (TOP 3 uniquement)
            Message: "quels sont mes tâches prioritaires" → voir_taches_prioritaires (TOP 3 uniquement)

            DÉTECTION CRITIQUE DES DATES - Complétion avec dates :

            RÈGLE ABSOLUE : Si le message contient "hier", "avant-hier" ou une date (JJ/MM/YYYY), tu DOIS extraire date_completion !

            Message: "j'ai fais toutes mes habitudes hier" → completer_toutes_habitudes + date_completion: "hier"
            Message: "j'ai fait toutes mes tâches avant-hier" → completer_toutes_taches + date_completion: "avant-hier"
            Message: "toutes mes habitudes du 15/12/2024" → completer_toutes_habitudes + date_completion: "15/12/2024"
            
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
                temperature: 0
            });

            const result = JSON.parse(completion.choices[0].message.content || '{"actions": []}') as GPTResponse;
            console.log('Analyse GPT:', result);

            // Traiter chaque action
            let responses: AIResponse[] = [];
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
                    case 'creer_rappel':
                        response = await this.createReminder(user.id, item.details);
                        break;
                    case 'completer_tache':
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
                        if (!item.details.nom) {
                            response = {
                                response: "Je n'ai pas pu identifier quelle habitude vous souhaitez marquer comme complétée. Pouvez-vous préciser ?",
                                contextual: true
                            };
                        } else {
                            response = await this.completeHabit(user.id, item.details.nom, phoneNumber);
                        }
                        break;
                    case 'completer_toutes_taches':
                        response = await this.completeAllTasks(user.id, item.details.date_completion);
                        break;
                    case 'completer_toutes_habitudes':
                        response = await this.completeAllHabits(user.id, item.details.date_completion);
                        break;
                    case 'creer_tache':
                        response = await this.createTask(user.id, item.details.nom || message);
                        break;
                    case 'creer_tache_interactive':
                        // Si on a déjà un nom et éventuellement une échéance, on les affiche
                        let taskInfo = "";
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
                                    break;
                                case 'aujourd\'hui':
                                case 'aujourd\'hui':
                                    echeanceText = `aujourd'hui (${today.toLocaleDateString('fr-FR')})`;
                                    break;
                                case 'cette semaine':
                                    echeanceText = "cette semaine";
                                    break;
                                case 'la semaine prochaine':
                                    echeanceText = "la semaine prochaine";
                                    break;
                            }
                            taskInfo += `\n📅 Échéance : ${echeanceText}`;
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
                        response = await this.createHabit(user.id, item.details.nom || message);
                        break;
                    case 'creer_processus':
                        response = await this.createProcess(user.id, item.details);
                        break;
                    case 'reponse_creation_tache':
                        // DEBUG: Afficher ce que GPT a détecté
                        console.log('🔬 DEBUG reponse_creation_tache:', JSON.stringify(item.details, null, 2));
                        
                        // Si on n'a pas le nom ou l'échéance, essayer de les récupérer du contexte
                        let taskName = item.details.nom;
                        let taskEcheance = item.details.echeance;
                        
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
                responses.push(response);
            }

            // Combiner les réponses
            const finalResponse = {
                response: responses.map(r => r.response).join('\n'),
                contextual: responses.some(r => r.contextual)
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
        const habits = await this.prisma.habit.findMany({
            where: { userId },
            include: {
                entries: {
                    orderBy: { date: 'desc' },
                    take: 5
                }
            }
        });

        if (habits.length === 0) {
            return {
                response: "Vous n'avez pas encore créé d'habitudes. Pour créer une nouvelle habitude, dites par exemple 'Créer une habitude: Méditer 10 minutes chaque matin'.",
                contextual: true
            };
        }

        const habitsList = habits.map(habit => {
            const lastEntry = habit.entries[0];
            const status = lastEntry ? `(Dernière completion: ${new Date(lastEntry.date).toLocaleDateString()})` : '(Pas encore commencé)';
            return `- ${habit.name} ${status}`;
        }).join('\n');

        return {
            response: `Voici vos habitudes :\n${habitsList}\n\nPour marquer une habitude comme complétée, dites par exemple 'Marquer habitude Méditer comme complétée'`,
            contextual: true
        };
    }

    private async createHabit(userId: string, message: string): Promise<AIResponse> {
        // Extraire le nom de l'habitude après "créer une habitude" ou ":"
        const habitName = message.split(/créer une habitude|:/).pop()?.trim();
        
        if (!habitName) {
            return {
                response: "Pour créer une habitude, donnez-moi son nom. Par exemple: 'Créer une habitude: Méditer 10 minutes chaque matin'",
                contextual: true
            };
        }

        const habit = await this.prisma.habit.create({
            data: {
                name: habitName,
                userId,
                frequency: 'DAILY', // Par défaut
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

            if (!analysis.habitName || analysis.habitName === 'null') {
                return {
                    response: "Pour marquer une habitude comme complétée, dites par exemple 'Marquer habitude Méditer comme complétée' ou 'J'ai fait mon habitude de sport'",
                    contextual: true
                };
            }

            // Trouver l'habitude la plus proche du nom donné
            const habits = await this.prisma.habit.findMany({ where: { userId } });
            console.log('Habitudes disponibles:', habits.map(h => h.name));
            
            const habit = habits.find(h => 
                h.name.toLowerCase().includes(analysis.habitName.toLowerCase()) || 
                analysis.habitName.toLowerCase().includes(h.name.toLowerCase())
            );
            
            if (!habit) {
                return {
                    response: `Je ne trouve pas d'habitude correspondant à "${analysis.habitName}". Vérifiez le nom et réessayez.`,
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
                        // Ajouter d'autres cas si nécessaire
                    }
                } else {
                    // Format attendu: JJ/MM/YYYY
                    const [day, month, year] = analysis.date.split('/').map(Number);
                    console.log('📅 Parsing de la date:', { day, month, year });
                    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                        targetDate = new Date(year, month - 1, day);
                        console.log('📅 Date après parsing:', targetDate.toISOString());
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

            // 🎯 VÉRIFICATION HABITUDE SPÉCIALE (NOUVEAU SYSTÈME) avec la date calculée
            if (phoneNumber && this.specialHabitsHandler.isSpecialHabit(habit.name)) {
                console.log('🔥 Habitude spéciale détectée:', habit.name);
                console.log('📅 Date cible pour habitude spéciale:', utcTargetDate.toISOString());
                try {
                    const specialResponse = await this.specialHabitsHandler.startSpecialHabitCompletion(
                        userId,
                        phoneNumber,
                        habit.name,
                        habit.id,
                        utcTargetDate  // 🎯 AJOUT DE LA DATE CIBLE
                    );
                    return {
                        response: specialResponse,
                        contextual: true
                    };
                } catch (error) {
                    console.error('Erreur lors du traitement de l\'habitude spéciale:', error);
                    // Fallback vers le traitement normal
                    console.log('📝 Fallback vers le traitement normal');
                }
            }

            // Utiliser la date UTC calculée plus haut

            try {
                // Créer une entrée pour la date spécifiée
                const habitEntry = await this.prisma.habitEntry.create({
                    data: {
                        habitId: habit.id,
                        date: targetDate,
                        completed: true
                    }
                });
                console.log('📅 Date enregistrée dans la base:', habitEntry.date.toISOString());

                const dateStr = targetDate.toLocaleDateString('fr-FR');
                console.log('📅 Date formatée pour le message:', dateStr);
                return {
                    response: `✅ J'ai marqué l'habitude "${habit.name}" comme complétée pour le ${dateStr} !`,
                    contextual: true
                };
            } catch (error: any) {
                if (error.code === 'P2002') {
                    // Une entrée existe déjà pour cette date
                    return {
                        response: `❌ L'habitude "${habit.name}" a déjà été marquée comme complétée pour le ${targetDate.toLocaleDateString('fr-FR')}.`,
                        contextual: true
                    };
                }
                throw error;
            }
        } catch (error) {
            console.error('Erreur lors de l\'analyse GPT:', error);
            return {
                response: "Désolé, je n'ai pas pu analyser votre demande. Pouvez-vous reformuler ?",
                contextual: true
            };
        }
    }

    private async listTasks(userId: string): Promise<AIResponse> {
        const tasks = await this.prisma.task.findMany({
            where: { userId, completed: false },
            orderBy: { createdAt: 'desc' }
        });

        if (tasks.length === 0) {
            return {
                response: "Vous n'avez pas de tâches en cours. Pour créer une nouvelle tâche, dites par exemple 'Créer une tâche: Appeler le client'",
                contextual: true
            };
        }

        const tasksList = tasks.map(task => `- ${task.title}`).join('\n');

        return {
            response: `Voici vos tâches en cours :\n${tasksList}\n\nPour marquer une tâche comme complétée, dites 'Marquer tâche [nom] comme complétée'`,
            contextual: true
        };
    }

    private async listPriorityTasks(userId: string): Promise<AIResponse> {
        // Récupérer toutes les tâches non complétées de l'utilisateur
        const allTasks = await this.prisma.task.findMany({
            where: { userId, completed: false },
            orderBy: [
                { priority: 'desc' },  // Priorité décroissante (4, 3, 2, 1, 0)
                { dueDate: 'asc' },    // Date d'échéance croissante 
                { createdAt: 'asc' }   // Date de création croissante
            ]
        });

        if (allTasks.length === 0) {
            return {
                response: "🎉 Félicitations ! Vous n'avez aucune tâche en cours.\n\nVoulez-vous :\n• Créer de nouvelles tâches importantes\n• Planifier votre prochaine journée\n• Voir vos tâches complétées",
                contextual: true
            };
        }

        // Filtrer et sélectionner les 3 tâches les plus prioritaires
        // Prioriser par ordre : P4 (Quick Win) > P3 (Urgent) > P2 (Important)
        const priorityTasks = allTasks.filter(task => task.priority && task.priority >= 2);
        
        if (priorityTasks.length === 0) {
            return {
                response: "Vous n'avez pas de tâches avec une priorité élevée (Important, Urgent ou Quick Win).\n\n💡 Conseil : Définissez des priorités pour vos tâches afin de mieux vous organiser !",
                contextual: true
            };
        }

        // Prendre les 3 premières (déjà triées par priorité décroissante)
        const top3Tasks = priorityTasks.slice(0, 3);

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

    private async createTask(userId: string, message: string): Promise<AIResponse> {
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

        // Si ce n'est pas une réponse interactive, continuer avec la logique existante
        const taskTitle = message.split(/créer une tâche|:/).pop()?.trim() || "Nouvelle tâche";
        
        const task = await this.prisma.task.create({
            data: {
                title: taskTitle,
                userId,
                completed: false,
                priority: 2,
                energyLevel: 2
            }
        });

        return {
            response: `✅ J'ai créé la tâche "${task.title}". Vous pouvez la marquer comme complétée en disant "Marquer tâche ${task.title} comme complétée"`,
            contextual: true
        };
    }

    private async completeTask(userId: string, message: string): Promise<AIResponse> {
        const taskTitle = message.split(/marquer|tâche|comme complétée/).filter(Boolean).map(s => s.trim())[0];

        if (!taskTitle) {
            return {
                response: "Pour marquer une tâche comme complétée, dites par exemple 'Marquer tâche Appeler le client comme complétée'",
                contextual: true
            };
        }

        const tasks = await this.prisma.task.findMany({ 
            where: { 
                userId,
                completed: false
            } 
        });
        
        const task = tasks.find(t => t.title.toLowerCase().includes(taskTitle.toLowerCase()));

        if (!task) {
            return {
                response: `Je ne trouve pas de tâche correspondant à "${taskTitle}". Vérifiez le titre et réessayez.`,
                contextual: true
            };
        }

        await this.prisma.task.update({
            where: { id: task.id },
            data: { completed: true }
        });

        return {
            response: `✅ J'ai marqué la tâche "${task.title}" comme complétée !`,
            contextual: true
        };
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

            const dateStr = scheduledFor.toLocaleDateString('fr-FR');
            const timeStr = scheduledFor.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

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