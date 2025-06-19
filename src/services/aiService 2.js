const chatGPTService = require('./chatGPTService');
const User = require('../models/User');
const Task = require('../models/Task');
const Habit = require('../models/Habit');

class AIService {
    constructor() {
        this.contextWindow = 5; // Nombre de messages à garder en contexte
    }

    async processMessage(userId, message) {
        try {
            // Récupérer l'utilisateur et son contexte
            const user = await User.findOne({ whatsappId: userId })
                .populate('tasks')
                .populate('habits');

            if (!user) {
                return this.handleNewUser(userId, message);
            }

            // Analyser l'intention du message
            const intent = await this.analyzeIntent(message, user);

            // Traiter le message selon l'intention
            switch (intent.type) {
                case 'CREATE_TASK':
                    return await this.handleCreateTask(user, intent.data);
                case 'CREATE_HABIT':
                    return await this.handleCreateHabit(user, intent.data);
                case 'UPDATE_PREFERENCES':
                    return await this.handleUpdatePreferences(user, intent.data);
                case 'MARK_COMPLETE':
                    return await this.handleMarkComplete(user, intent.data);
                case 'GET_SUMMARY':
                    return await this.generateSummary(user);
                case 'HELP':
                    return this.getHelpMessage();
                default:
                    return await this.generateContextualResponse(user, message);
            }
        } catch (error) {
            console.error('Erreur dans le traitement du message:', error);
            return {
                response: "Désolé, j'ai rencontré une erreur. Pouvez-vous reformuler votre demande ?",
                error: true
            };
        }
    }

    async analyzeIntent(message, user) {
        const prompt = `
        En tant qu'assistant personnel, analyse le message suivant et détermine l'intention de l'utilisateur.
        Message: "${message}"
        Contexte utilisateur: ${JSON.stringify(user.preferences)}
        
        Retourne une des intentions suivantes:
        - CREATE_TASK: Pour créer une nouvelle tâche
        - CREATE_HABIT: Pour créer une nouvelle habitude
        - UPDATE_PREFERENCES: Pour mettre à jour les préférences
        - MARK_COMPLETE: Pour marquer une tâche ou habitude comme terminée
        - GET_SUMMARY: Pour obtenir un résumé
        - HELP: Pour obtenir de l'aide
        - CHAT: Pour une conversation générale
        `;

        const analysis = await chatGPTService.analyzeMessage(prompt);
        return this.parseIntent(analysis);
    }

    async handleNewUser(userId, message) {
        const welcomeMessage = `
        Bonjour ! Je suis votre assistant personnel. Je vais vous aider à gérer vos tâches et habitudes.
        Pour commencer, j'aurais besoin de quelques informations :
        - À quelle heure vous réveillez-vous habituellement ?
        - Quand préférez-vous faire les tâches importantes ?
        - Avez-vous des habitudes particulières à suivre ?
        `;

        // Créer un nouvel utilisateur
        const user = new User({
            whatsappId: userId,
            name: "Nouvel utilisateur",
            preferences: {
                timezone: "Europe/Paris"
            }
        });
        await user.save();

        return {
            response: welcomeMessage,
            newUser: true
        };
    }

    async generateContextualResponse(user, message) {
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

        const analysis = await chatGPTService.analyzeMessage(prompt);
        return {
            response: analysis.analysis,
            contextual: true
        };
    }

    async handleCreateTask(user, data) {
        try {
            const task = new Task({
                userId: user._id,
                title: data.title,
                description: data.description,
                priority: data.priority,
                dueDate: data.dueDate,
                preferredTime: data.preferredTime
            });

            await task.save();
            user.tasks.push(task._id);
            await user.save();

            return {
                response: `✅ J'ai créé la tâche "${task.title}" pour vous.\nPriorité : ${task.priority}\nHeure préférée : ${task.preferredTime}`,
                task: task
            };
        } catch (error) {
            console.error('Erreur lors de la création de la tâche:', error);
            throw error;
        }
    }

    async handleCreateHabit(user, data) {
        try {
            const habit = new Habit({
                userId: user._id,
                title: data.title,
                description: data.description,
                frequency: data.frequency,
                preferredTime: data.preferredTime,
                daysOfWeek: data.daysOfWeek
            });

            await habit.save();
            user.habits.push(habit._id);
            await user.save();

            return {
                response: `✅ J'ai créé l'habitude "${habit.title}" pour vous.\nFréquence : ${habit.frequency}\nHeure préférée : ${habit.preferredTime}`,
                habit: habit
            };
        } catch (error) {
            console.error('Erreur lors de la création de l\'habitude:', error);
            throw error;
        }
    }

    async handleUpdatePreferences(user, data) {
        try {
            user.preferences = {
                ...user.preferences,
                ...data
            };
            await user.save();

            return {
                response: "✅ Vos préférences ont été mises à jour avec succès !",
                preferences: user.preferences
            };
        } catch (error) {
            console.error('Erreur lors de la mise à jour des préférences:', error);
            throw error;
        }
    }

    async handleMarkComplete(user, data) {
        try {
            if (data.type === 'task') {
                const task = await Task.findById(data.id);
                if (!task) throw new Error('Tâche non trouvée');
                
                task.status = 'completed';
                await task.save();

                return {
                    response: `🎉 Félicitations ! La tâche "${task.title}" a été marquée comme terminée.`,
                    task: task
                };
            } else if (data.type === 'habit') {
                const habit = await Habit.findById(data.id);
                if (!habit) throw new Error('Habitude non trouvée');
                
                habit.streak.current += 1;
                habit.streak.longest = Math.max(habit.streak.current, habit.streak.longest);
                habit.streak.lastCompleted = new Date();
                await habit.save();

                return {
                    response: `🎯 Super ! Vous avez maintenu votre habitude "${habit.title}" pendant ${habit.streak.current} jours !`,
                    habit: habit
                };
            }
        } catch (error) {
            console.error('Erreur lors du marquage comme terminé:', error);
            throw error;
        }
    }

    async generateSummary(user) {
        try {
            const tasks = await Task.find({ userId: user._id, status: 'pending' });
            const habits = await Habit.find({ userId: user._id, active: true });

            const tasksSummary = tasks.length > 0 
                ? tasks.map(t => `- ${t.title} (${t.priority})`).join('\n')
                : "Aucune tâche en attente";

            const habitsSummary = habits.length > 0
                ? habits.map(h => `- ${h.title} (${h.streak.current} jours)`).join('\n')
                : "Aucune habitude active";

            return {
                response: `📋 Voici votre résumé :\n\n` +
                         `Tâches en attente :\n${tasksSummary}\n\n` +
                         `Habitudes actives :\n${habitsSummary}`,
                data: { tasks, habits }
            };
        } catch (error) {
            console.error('Erreur lors de la génération du résumé:', error);
            throw error;
        }
    }

    getHelpMessage() {
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

    parseIntent(analysis) {
        try {
            // Exemple de format d'analyse attendu :
            // { type: 'CREATE_TASK', data: { title: '...', priority: '...' } }
            return {
                type: analysis.type || 'CHAT',
                data: analysis.data || {}
            };
        } catch (error) {
            console.error('Erreur lors du parsing de l\'intention:', error);
            return { type: 'CHAT', data: {} };
        }
    }
}

module.exports = new AIService(); 