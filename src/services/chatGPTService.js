const OpenAI = require('openai');

class ChatGPTService {
    constructor() {
        try {
            if (!process.env.OPENAI_API_KEY) {
                console.warn('⚠️ OPENAI_API_KEY non configurée. Les fonctionnalités ChatGPT seront désactivées.');
                this.openai = null;
                return;
            }
            
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation de ChatGPT:', error.message);
            this.openai = null;
        }
    }

    async generateResponse(message, context = []) {
        if (!this.openai) {
            console.warn('⚠️ ChatGPT non initialisé. Impossible de générer une réponse.');
            throw new Error('ChatGPT non disponible');
        }

        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    ...context,
                    { role: "user", content: message }
                ],
                temperature: 0.7,
                max_tokens: 150
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('Error generating ChatGPT response:', error.message);
            throw error;
        }
    }

    async analyzeMessage(message) {
        try {
            if (!this.openai) {
                console.warn('⚠️ ChatGPT non initialisé. Retour à l\'intention par défaut CHAT');
                return 'CHAT';
            }

            console.log('🤖 Analyse du message par ChatGPT:', message);
            
            const prompt = `
            En tant qu'assistant personnel, analyse le message suivant et détermine l'intention de l'utilisateur.
            Message: "${message}"
            
            Retourne UNIQUEMENT une des intentions suivantes sans autre texte ou explication:
            MARK_COMPLETE - Pour les messages qui indiquent qu'une tâche ou habitude a été terminée (ex: "j'ai fait X", "j'ai terminé Y")
            GET_TASKS - Pour voir les tâches
            GET_HABITS - Pour voir les habitudes du jour
            GET_PROCESSES - Pour voir les processus
            GET_HABIT_DETAILS - Pour voir les détails d'une habitude
            CREATE_TASK - Pour créer une nouvelle tâche
            CREATE_HABIT - Pour créer une nouvelle habitude
            UPDATE_PREFERENCES - Pour mettre à jour les préférences
            GET_SUMMARY - Pour obtenir un résumé
            HELP - Pour obtenir de l'aide
            CHAT - Pour toute autre conversation

            Exemples de MARK_COMPLETE:
            - "j'ai fait dormir à 00h" -> MARK_COMPLETE
            - "hier j'ai fait du sport" -> MARK_COMPLETE
            - "j'ai terminé ma routine" -> MARK_COMPLETE

            Exemples de GET_TASKS:
            - "quelles sont mes tâches ?" -> GET_TASKS
            - "montre-moi mes tâches" -> GET_TASKS
            - "liste mes tâches" -> GET_TASKS
            `;
            
            const response = await this.generateResponse(prompt);
            console.log('🤖 Réponse de ChatGPT:', response);
            
            // Nettoyer la réponse
            const cleanResponse = response.trim().toUpperCase();
            
            // Vérifier si la réponse est une intention valide
            const validIntents = [
                'MARK_COMPLETE',
                'GET_TASKS',
                'GET_HABITS',
                'GET_PROCESSES',
                'GET_HABIT_DETAILS',
                'CREATE_TASK',
                'CREATE_HABIT',
                'UPDATE_PREFERENCES',
                'GET_SUMMARY',
                'HELP',
                'CHAT'
            ];
            
            if (validIntents.includes(cleanResponse)) {
                return cleanResponse;
            }
            
            // Si la réponse n'est pas une intention valide, retourner CHAT
            return 'CHAT';
            
        } catch (error) {
            console.error('Erreur dans analyzeMessage:', error);
            return 'CHAT';
        }
    }
}

module.exports = new ChatGPTService(); 