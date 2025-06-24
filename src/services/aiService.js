const chatGPTService = require('./chatGPTService');
const productifApiService = require('./productifApiService');
const User = require('../models/User');
const Task = require('../models/Task');
const Habit = require('../models/Habit');
const { format } = require('date-fns');

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

            // Si le message ressemble à un token, essayer l'authentification
            if (this.looksLikeToken(message)) {
                return await this.handleTokenAuthentication(user, message);
            }

            // Si l'utilisateur n'est pas authentifié, demander le token
            if (!user.isAuthenticated) {
                return {
                    response: "Pour utiliser ce service, veuillez vous authentifier avec votre token API productif.io.\nVous pouvez le trouver dans vos paramètres sur https://productif.io"
                };
            }

            // Détecter les commandes spéciales avec emojis
            // Pattern pour marquer une tâche comme terminée
            const completeTaskPattern = /^✅\s+(.+)/;
            const completeTaskMatch = message.match(completeTaskPattern);
            
            if (completeTaskMatch) {
                const taskTitle = completeTaskMatch[1].trim();
                return await this.handleMarkTaskComplete(user, taskTitle);
            }

            // Pattern pour créer une nouvelle tâche
            const createTaskPattern = /^📝\s+([^[]+)(?:\[([^\]]+)\])?/;
            const createTaskMatch = message.match(createTaskPattern);

            if (createTaskMatch) {
                const title = createTaskMatch[1].trim();
                const options = createTaskMatch[2] ? this.parseTaskOptions(createTaskMatch[2]) : {};
                return await this.handleCreateTask(user, { title, ...options });
            }

            // Pattern pour créer un nouveau processus
            const createProcessPattern = /^⚙️\s+([^[]+)(?:\[([^\]]+)\])?/;
            const createProcessMatch = message.match(createProcessPattern);

            if (createProcessMatch) {
                const name = createProcessMatch[1].trim();
                const stepsString = createProcessMatch[2] ? createProcessMatch[2].trim() : '';
                return await this.handleCreateProcess(user, name, stepsString);
            }

            // Pattern pour la note avec emoji et commentaire
            const ratingPattern = /^⭐\s*(\d+)(?:\/10)?(?:\s+(.+))?/;
            const ratingMatch = message.match(ratingPattern);
            
            if (ratingMatch) {
                const rating = parseInt(ratingMatch[1]);
                const note = ratingMatch[2] ? ratingMatch[2].trim() : null;
                if (rating >= 0 && rating <= 10) {
                    console.log('⭐ Note détectée:', rating);
                    console.log('📝 Commentaire:', note);
                    return await this.handleMarkComplete(
                        user,
                        ['Note de sa journée'],
                        new Date(),
                        note,
                        rating
                    );
                }
            }

            // Si ce n'est pas un message spécial, analyser l'intention
            const analysis = await this.analyzeIntent(message, user);
            console.log('🎯 Intention détectée:', analysis);

            // Traiter l'intention
            switch (analysis.intent) {
                case 'GET_TASKS':
                    return await this.handleGetTasks(user);
                case 'GET_HABITS':
                    return await this.handleGetHabits(user);
                case 'GET_PROCESSES':
                    return await this.handleGetProcesses(user);
                case 'MARK_COMPLETE':
                    return await this.handleMarkComplete(user, analysis.data.items || [], analysis.data.date, analysis.data.note, analysis.data.rating);
                case 'GET_HABIT_DETAILS':
                    return await this.handleGetHabitDetails(user, analysis.data);
                case 'UPDATE_PREFERENCES':
                    return await this.handleUpdatePreferences(user, analysis.data);
                case 'GET_SUMMARY':
                    return await this.generateSummary(user);
                case 'CHAT':
                default:
                    return {
                        response: "Je ne comprends pas votre demande. Voici ce que je peux faire :\n" +
                                "- Voir vos tâches : 'montre-moi mes tâches'\n" +
                                "- Créer une tâche : '📝 [titre de la tâche] [options]'\n" +
                                "- Marquer une tâche comme terminée : '✅ [titre de la tâche]'\n" +
                                "- Noter votre journée : '⭐ [note/10] [commentaire]'\n" +
                                "- Voir vos processus : 'montre-moi mes processus'\n" +
                                "- Créer un processus : '⚙️ [nom du processus] [étape1, étape2, étape3]'\n" +
                                "- Voir vos habitudes : 'montre-moi mes habitudes'",
                        contextual: true
                    };
            }
        } catch (error) {
            console.error('Erreur lors du traitement du message:', error);
            return {
                response: "Une erreur est survenue lors du traitement de votre message. Veuillez réessayer.",
                error: true
            };
        }
    }

    looksLikeToken(message) {
        // Vérifie si le message ressemble à un JWT token
        const jwtPattern = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;
        return jwtPattern.test(message.trim());
    }

    async handleTokenAuthentication(user, token) {
        try {
            // Vérifier le token avec l'API Productif.io
            const isValid = await this.validateTokenWithAPI(token);
            
            if (isValid) {
                user.token = token;
                user.isAuthenticated = true;
                await user.save();

                return {
                    response: "✅ Token validé avec succès ! Vous pouvez maintenant utiliser toutes les fonctionnalités. Comment puis-je vous aider ?",
                    authenticated: true
                };
            } else {
                return {
                    response: "❌ Le token fourni n'est pas valide. Veuillez vérifier et réessayer.",
                    requiresAuth: true
                };
            }
        } catch (error) {
            console.error('Erreur lors de la validation du token:', error);
            return {
                response: "Une erreur est survenue lors de la validation du token. Veuillez réessayer.",
                error: true
            };
        }
    }

    async validateTokenWithAPI(token) {
        return await productifApiService.validateToken(token);
    }

    async analyzeIntent(message, user) {
        try {
        console.log('📝 Analyse du message:', message);
        
            // Pattern pour détecter "j'ai fait/fais X"
            const completionPattern = /j['']ai\s+fai[ts]\s+(.+)/i;
            const match = message.match(completionPattern);
        
            if (match) {
                const itemsString = match[1].trim();
                // Séparer les items par virgule, "et", ou point-virgule
                const items = itemsString
                    .split(/[,;]\s*|\s+et\s+/)
                    .map(item => item.trim())
                    .filter(item => item.length > 0);
                
                console.log('✏️ Items séparés:', items);

        // Extraire la date du message
        let targetDate = new Date();
        const lowerMessage = message.toLowerCase();
        
        // Détecter les dates spécifiques
        const datePatterns = [
            // Hier
            {
                pattern: /hier/i,
                handler: () => {
                    const date = new Date();
                    date.setDate(date.getDate() - 1);
                    return date;
                }
            },
            // Format: le 16 juin
            {
                pattern: /le (\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i,
                handler: (match) => {
                    const day = parseInt(match[1]);
                    const monthMap = {
                        'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3,
                        'mai': 4, 'juin': 5, 'juillet': 6, 'août': 7,
                        'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
                    };
                    const month = monthMap[match[2].toLowerCase()];
                    const date = new Date();
                    date.setDate(day);
                    date.setMonth(month);
                    return date;
                }
            },
            // Format: dd/mm
            {
                pattern: /(\d{1,2})\/(\d{1,2})/,
                handler: (match) => {
                    const day = parseInt(match[1]);
                    const month = parseInt(match[2]) - 1;
                    const date = new Date();
                    date.setDate(day);
                    date.setMonth(month);
                    return date;
                }
            }
        ];

        // Chercher une date dans le message
        for (const { pattern, handler } of datePatterns) {
            const match = lowerMessage.match(pattern);
            if (match) {
                targetDate = handler(match);
                break;
            }
        }
        
        // Convertir en format YYYY-MM-DD
        const dateStr = targetDate.toISOString().split('T')[0];
                console.log('📅 Date cible:', dateStr);

            return {
                intent: 'MARK_COMPLETE',
                data: {
                        items: items,
                    date: dateStr
                }
            };
        }

            // Si ce n'est pas un message de complétion, utiliser ChatGPT
            const analysis = await chatGPTService.analyzeMessage(message);
            console.log('🤖 Réponse de ChatGPT:', analysis);

            // Si ChatGPT détecte MARK_COMPLETE, extraire les items
            if (analysis === 'MARK_COMPLETE') {
            const itemMatch = message.match(/(?:fait|fais)\s+(.+)/i);
            if (itemMatch) {
                    const itemsString = itemMatch[1].trim();
                    const items = itemsString
                        .split(/[,;]\s*|\s+et\s+/)
                        .map(item => item.trim())
                        .filter(item => item.length > 0);
                    
                return {
                    intent: 'MARK_COMPLETE',
                    data: {
                            items: items,
                            date: new Date().toISOString().split('T')[0]
                    }
                };
            }
        }

        return {
                intent: analysis,
                data: {}
            };
        } catch (error) {
            console.error('Erreur lors de l\'analyse de l\'intention:', error);
            return {
                intent: 'CHAT',
                data: {}
        };
        }
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
            console.log('👤 Utilisateur:', user.whatsappId);
            console.log('🔑 Token disponible:', !!user.token);
            console.log('📝 Données de la tâche:', data);

            // Si un nom de projet est fourni, chercher le projet correspondant
            let projectId = null;
            if (data.projectName) {
                try {
                    const projects = await productifApiService.getUserProjects(user.token);
                    const project = projects.find(p => 
                        p.name.toLowerCase() === data.projectName.toLowerCase()
                    );
                    if (project) {
                        projectId = project.id;
                    }
                } catch (error) {
                    console.error('Erreur lors de la recherche du projet:', error);
                }
            }

            // Valeurs par défaut
            const taskData = {
                title: data.title,
                description: data.description || '',
                priority: data.priority || 2,
                energyLevel: data.energyLevel || 1,
                dueDate: data.dueDate || null,
                projectId: projectId
            };

            const task = await productifApiService.createTask(user.token, taskData);
            
            let response = `✅ J'ai créé la tâche "${task.title}" pour vous.\n`;
            response += `Priorité : ${task.priority}/4\n`;
            response += `Niveau d'énergie : ${task.energyLevel}/3\n`;
            if (task.dueDate) {
                response += `Date d'échéance : ${format(new Date(task.dueDate), 'dd/MM/yyyy')}\n`;
            }
            if (projectId) {
                response += `Projet : ${data.projectName}`;
            }

            return {
                response,
                task: task,
                contextual: true
            };
        } catch (error) {
            console.error('Erreur lors de la création de la tâche:', error);
            return {
                response: "Une erreur est survenue lors de la création de la tâche. Veuillez réessayer.",
                error: true,
                contextual: true
            };
        }
    }

    async handleCreateHabit(user, data) {
        try {
            const habit = await productifApiService.createHabit(user.token, data);
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

    async handleMarkComplete(user, items, date, note = null, rating = null) {
        try {
            console.log('👤 Utilisateur:', user.whatsappId);
            console.log('🔑 Token disponible:', !!user.token);
            console.log('📝 Habitudes à marquer:', items);
            console.log('📝 Note:', note);
            console.log('⭐ Rating:', rating);

            // Récupérer toutes les habitudes de l'utilisateur
            const habits = await productifApiService.getDailyHabits(user.token);
            const completedHabits = [];
            const notFoundHabits = [];

            // Pour chaque item à marquer comme complété
            for (const item of items) {
                // Trouver l'habitude correspondante
                const habit = this.findBestMatchingHabit(habits, item);
                
                if (!habit) {
                    console.log('❌ Aucune habitude trouvée pour:', item);
                    notFoundHabits.push(item);
                    continue;
                }

                try {
                    // Marquer l'habitude comme complétée
                    await productifApiService.markHabitComplete(user.token, habit.id, date, note, rating);
                    console.log('✅ Habitude marquée comme terminée:', habit.name);
                    completedHabits.push(habit.name);
                } catch (error) {
                    console.error('Erreur lors du marquage de l\'habitude:', habit.name, error);
                    return {
                        response: `Une erreur est survenue lors du marquage de l'habitude "${habit.name}". Veuillez réessayer.`,
                        contextual: true
                    };
                }
            }

            // Construire le message de réponse
            let response = '';
            if (completedHabits.length > 0) {
                response += `✅ Habitudes marquées comme terminées :\n${completedHabits.map(h => `• ${h}`).join('\n')}\n`;
            }
            if (notFoundHabits.length > 0) {
                response += `\n❌ Habitudes non trouvées :\n${notFoundHabits.map(h => `• ${h}`).join('\n')}`;
                }

                return {
                response: response || "Aucune habitude n'a été marquée comme terminée.",
                    contextual: true
                };
        } catch (error) {
            console.error('Erreur dans handleMarkComplete:', error);
            return {
                response: "Une erreur est survenue lors du marquage des habitudes. Veuillez réessayer.",
                contextual: true
            };
        }
    }

    findBestMatchingHabit(habits, searchText) {
        // Nettoyer le texte de recherche
        const cleanSearchText = searchText.toLowerCase()
            .replace(/[àáâãäå]/g, 'a')
            .replace(/[èéêë]/g, 'e')
            .replace(/[ìíîï]/g, 'i')
            .replace(/[òóôõö]/g, 'o')
            .replace(/[ùúûü]/g, 'u')
            .replace(/[^a-z0-9\s]/g, '')
            .trim();

        // Trouver la meilleure correspondance
        let bestMatch = null;
        let bestScore = 0;

        for (const habit of habits) {
            const habitName = habit.name.toLowerCase()
                .replace(/[àáâãäå]/g, 'a')
                .replace(/[èéêë]/g, 'e')
                .replace(/[ìíîï]/g, 'i')
                .replace(/[òóôõö]/g, 'o')
                .replace(/[ùúûü]/g, 'u')
                .replace(/[^a-z0-9\s]/g, '')
                .trim();

            // Correspondance exacte
            if (habitName === cleanSearchText) {
                return habit;
            }

            // Correspondance partielle
            const habitWords = habitName.split(' ');
            const searchWords = cleanSearchText.split(' ');
            
            let matchCount = 0;
            let totalWords = Math.max(habitWords.length, searchWords.length);

            // Vérifier chaque mot de l'habitude
            for (const word of habitWords) {
                if (searchWords.some(sw => 
                    sw === word || 
                    sw.includes(word) || 
                    word.includes(sw)
                )) {
                    matchCount++;
                }
            }

            const score = matchCount / totalWords;
            if (score > bestScore) {
                bestScore = score;
                bestMatch = habit;
            }
        }

        // Retourner la correspondance si le score est suffisant
        return bestScore >= 0.7 ? bestMatch : null;
    }

    async generateSummary(user) {
        try {
            const [habits, tasks] = await Promise.all([
                productifApiService.getUserHabits(user.token),
                productifApiService.getUserTasks(user.token)
            ]);

            const summary = `
Voici votre résumé du jour :

🎯 Tâches en cours :
${tasks.filter(t => !t.completed).map(t => `- ${t.title}`).join('\n')}

💪 Habitudes à suivre :
${habits.filter(h => !h.completedToday).map(h => `- ${h.title}`).join('\n')}

Que puis-je faire pour vous aider ?`;

            return {
                response: summary,
                data: { habits, tasks }
            };
        } catch (error) {
            console.error('Erreur lors de la génération du résumé:', error);
            return {
                response: "Désolé, je n'ai pas pu récupérer vos informations. Veuillez réessayer.",
                error: true
            };
        }
    }

    getHelpMessage() {
        return {
            response: `🤖 Voici comment je peux vous aider :\n\n` +
                     `1. Gérer vos habitudes :\n` +
                     `   - "Montre-moi mes habitudes"\n` +
                     `   - "Détails sur [nom de l'habitude]"\n` +
                     `   - "J'ai fait [nom de l'habitude]"\n` +
                     `   - "Nouvelle habitude : [description]"\n\n` +
                     `2. Gérer vos tâches :\n` +
                     `   - "Crée une tâche : [description]"\n` +
                     `   - "Marque la tâche [nom] comme terminée"\n\n` +
                     `3. Voir vos progrès :\n` +
                     `   - "Montre-moi mon résumé"\n` +
                     `   - "Quelles sont mes tâches pour aujourd'hui ?"\n\n` +
                     `4. Modifier vos préférences :\n` +
                     `   - "Je me réveille à [heure]"\n` +
                     `   - "Je préfère faire les tâches importantes le [moment]"\n\n` +
                     `N'hésitez pas à me poser des questions sur vos habitudes, je suis là pour vous aider à maintenir de bonnes habitudes !`
        };
    }

    parseIntent(analysis) {
        try {
            // Si l'analyse est une chaîne de caractères
            if (typeof analysis === 'string') {
                if (analysis.includes('GET_HABITS')) {
                    return { intent: 'GET_HABITS', data: {} };
                }
                if (analysis.includes('GET_HABIT_DETAILS')) {
                    return { intent: 'GET_HABIT_DETAILS', data: {} };
                }
                if (analysis.includes('MARK_COMPLETE')) {
                    return { intent: 'MARK_COMPLETE', data: {} };
                }
            }
            
            // Pour les autres cas, on utilise l'analyse complète
            if (analysis && analysis.type) {
                return {
                    intent: analysis.type,
                    data: analysis.data || {}
                };
            }

            // Par défaut, on retourne CHAT
            return { intent: 'CHAT', data: {} };
        } catch (error) {
            console.error('Erreur lors du parsing de l\'intention:', error);
            return { intent: 'CHAT', data: {} };
        }
    }

    async handleGetHabits(user) {
        try {
            console.log('👤 Utilisateur:', user.whatsappId);
            console.log('🔑 Token disponible:', !!user.token);
            
            const habits = await productifApiService.getDailyHabits(user.token);
            
            if (!habits || habits.length === 0) {
                return {
                    response: "Vous n'avez pas encore d'habitudes programmées. Voulez-vous en créer une ? Je peux vous aider à mettre en place de bonnes habitudes pour atteindre vos objectifs.",
                    contextual: true
                };
            }

            // Organiser les habitudes par catégorie
            const categorizedHabits = habits.reduce((acc, habit) => {
                const category = habit.category || 'Mes Habitudes';
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(habit);
                return acc;
            }, {});

            // Construire une réponse détaillée
            let response = "📋 Voici le détail de vos habitudes :\n\n";

            for (const [category, categoryHabits] of Object.entries(categorizedHabits)) {
                response += `${category}:\n`;
                categoryHabits.forEach(habit => {
                    const status = habit.completed ? '✅' : '⏳';
                    const streak = habit.currentStreak ? ` 🔥 ${habit.currentStreak}j` : '';
                    response += `• ${habit.name} ${status}${streak}\n`;
                    
                    // Afficher les jours spécifiques si définis
                    const daysStr = this.formatDaysOfWeek(habit.daysOfWeek);
                    if (daysStr !== 'Tous les jours') {
                        response += `  ↳ ${daysStr}\n`;
                    } else if (habit.frequency) {
                        response += `  ↳ ${this.formatFrequency(habit.frequency)}\n`;
                    }
                });
                response += '\n';
            }

            response += "Pour marquer une habitude comme terminée, dites-moi simplement 'J'ai fait [nom de l'habitude]'.\n";
            response += "Pour plus de détails sur une habitude spécifique, demandez-moi 'Détails sur [nom de l'habitude]'.";

            return {
                response,
                habits,
                contextual: true
            };
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des habitudes:', error);
            return {
                response: "Désolé, je n'arrive pas à récupérer vos habitudes pour le moment. Pouvez-vous réessayer dans quelques instants ?",
                error: true
            };
        }
    }

    formatFrequency(frequency) {
        if (!frequency) return '';
        
        const frequencyMap = {
            'daily': 'Tous les jours',
            'weekly': 'Chaque semaine',
            'weekdays': 'En semaine',
            'weekends': 'Les weekends',
            'monthly': 'Chaque mois'
        };

        return frequencyMap[frequency] || frequency;
    }

    async getHabitDetails(user, habitTitle) {
        try {
            const habits = await productifApiService.getDailyHabits(user.token);
            const habit = habits.find(h => h.name.toLowerCase() === habitTitle.toLowerCase());

            if (!habit) {
                return {
                    response: `Je ne trouve pas d'habitude nommée "${habitTitle}". Vérifiez le nom et réessayez.`,
                    contextual: true
                };
            }

            let response = `📊 Détails de l'habitude "${habit.name}":\n\n`;
            response += `• Fréquence: ${this.formatFrequency(habit.frequency)}\n`;
            if (habit.preferredTime) response += `• Heure préférée: ${habit.preferredTime}\n`;
            if (habit.currentStreak) response += `• Série actuelle: 🔥 ${habit.currentStreak} jours\n`;
            if (habit.bestStreak) response += `• Meilleure série: ⭐ ${habit.bestStreak} jours\n`;
            if (habit.description) response += `\nDescription:\n${habit.description}\n`;
            
            const daysStr = this.formatDaysOfWeek(habit.daysOfWeek);
            if (daysStr) response += `• Jours: ${daysStr}\n`;
            
            response += `\nStatut aujourd'hui: ${habit.completed ? '✅ Terminée' : '⏳ À faire'}`;

            return {
                response,
                habit,
                contextual: true
            };
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des détails de l\'habitude:', error);
            return {
                response: "Désolé, je n'arrive pas à récupérer les détails de cette habitude pour le moment.",
                error: true
            };
        }
    }

    formatDaysOfWeek(days) {
        if (!days || days.length === 7) return 'Tous les jours';
        
        const dayMap = {
            'monday': 'Lundi',
            'tuesday': 'Mardi',
            'wednesday': 'Mercredi',
            'thursday': 'Jeudi',
            'friday': 'Vendredi',
            'saturday': 'Samedi',
            'sunday': 'Dimanche'
        };

        // Trier les jours dans l'ordre de la semaine
        const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const sortedDays = days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

        return sortedDays.map(day => dayMap[day]).join(', ');
    }

    async handleGetTasks(user) {
        try {
            console.log('👤 Utilisateur:', user.whatsappId);
            console.log('🔑 Token disponible:', !!user.token);
            
            const tasks = await productifApiService.getUserTasks(user.token);
            
            if (!tasks || tasks.length === 0) {
                return {
                    response: "Vous n'avez pas encore de tâches. Voulez-vous en créer une ? Je peux vous aider à organiser vos tâches pour être plus productif.",
                    contextual: true
                };
            }

            // Organiser les tâches par projet
            const tasksByProject = tasks.reduce((acc, task) => {
                const projectName = task.project?.name || 'Sans projet';
                if (!acc[projectName]) {
                    acc[projectName] = [];
                }
                acc[projectName].push(task);
                return acc;
            }, {});

            // Construire la réponse
            let response = "📋 Voici vos tâches :\n\n";

            for (const [projectName, projectTasks] of Object.entries(tasksByProject)) {
                response += `📁 ${projectName} :\n`;
                
                // Trier les tâches : non complétées d'abord, puis par priorité
                const sortedTasks = projectTasks.sort((a, b) => {
                    if (a.completed !== b.completed) {
                        return a.completed ? 1 : -1;
                    }
                    return (b.priority || 0) - (a.priority || 0);
                });

                for (const task of sortedTasks) {
                    const status = task.completed ? "✅" : "⬜";
                    const priority = task.priority ? "🔥".repeat(task.priority) : "";
                    const dueDate = task.dueDate ? ` (📅 ${new Date(task.dueDate).toLocaleDateString()})` : "";
                    
                    response += `${status} ${task.title}${priority}${dueDate}\n`;
                }
                response += "\n";
            }

            return {
                response,
                contextual: true
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des tâches:', error);
            return {
                response: "Désolé, je n'ai pas pu récupérer vos tâches. Veuillez réessayer dans quelques instants.",
                contextual: true
            };
        }
    }

    async handleMarkTaskComplete(user, taskTitle) {
        try {
            console.log('👤 Utilisateur:', user.whatsappId);
            console.log('🔑 Token disponible:', !!user.token);
            
            // Récupérer toutes les tâches de l'utilisateur
            const tasks = await productifApiService.getUserTasks(user.token);
            
            // Trouver la tâche qui correspond le mieux au titre donné
            const task = this.findBestMatchingTask(tasks, taskTitle);
            
            if (!task) {
                return {
                    response: `Je n'ai pas trouvé de tâche correspondant à "${taskTitle}". Voici vos tâches actuelles :\n\n` +
                             tasks.filter(t => !t.completed)
                                  .map(t => `⬜ ${t.title}`)
                                  .join('\n'),
                    contextual: true
                };
            }

            if (task.completed) {
                return {
                    response: `La tâche "${task.title}" est déjà marquée comme terminée ! 🎉`,
                    contextual: true
                };
            }

            // Marquer la tâche comme terminée
            await productifApiService.markTaskComplete(user.token, task.id);
            
            return {
                response: `🎉 Super ! J'ai marqué la tâche "${task.title}" comme terminée.`,
                contextual: true
            };
        } catch (error) {
            console.error('Erreur lors du marquage de la tâche:', error);
            return {
                response: "Une erreur est survenue lors du marquage de la tâche. Veuillez réessayer.",
                contextual: true
            };
        }
    }

    findBestMatchingTask(tasks, searchTitle) {
        // Convertir en minuscules pour la comparaison
        const searchLower = searchTitle.toLowerCase();
        
        // D'abord, chercher une correspondance exacte
        let task = tasks.find(t => t.title.toLowerCase() === searchLower);
        if (task) return task;
        
        // Sinon, chercher une tâche qui contient le titre recherché
        task = tasks.find(t => t.title.toLowerCase().includes(searchLower));
        if (task) return task;
        
        // Sinon, chercher si le titre recherché contient le nom d'une tâche
        task = tasks.find(t => searchLower.includes(t.title.toLowerCase()));
        if (task) return task;
        
        // Si aucune correspondance n'est trouvée
        return null;
    }

    async handleChat(message) {
        return {
            response: "Je ne comprends pas complètement votre demande. Pouvez-vous la reformuler ? Vous pouvez par exemple me demander :\n" +
                     "- Vos tâches\n" +
                     "- Marquer une tâche comme terminée (✅ Nom de la tâche)\n" +
                     "- Vos habitudes du jour\n" +
                     "- Les détails d'une habitude\n" +
                     "- Marquer une habitude comme terminée",
            contextual: true
        };
    }

    parseTaskOptions(optionsString) {
        const options = {};
        const parts = optionsString.split(',').map(part => part.trim());
        
        for (const part of parts) {
            if (part.startsWith('p:')) {
                // Priorité (1-4)
                const priority = parseInt(part.slice(2));
                if (priority >= 1 && priority <= 4) {
                    options.priority = priority;
                }
            } else if (part.startsWith('e:')) {
                // Niveau d'énergie (0-3)
                const energy = parseInt(part.slice(2));
                if (energy >= 0 && energy <= 3) {
                    options.energyLevel = energy;
                }
            } else if (part.startsWith('d:')) {
                // Date d'échéance (format: YYYY-MM-DD)
                const date = part.slice(2);
                if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                    options.dueDate = date;
                }
            } else if (part.startsWith('projet:')) {
                // Nom du projet
                options.projectName = part.slice(7).trim();
            }
        }
        
        return options;
    }

    async handleGetProcesses(user) {
        try {
            console.log('👤 Utilisateur:', user.whatsappId);
            console.log('🔑 Token disponible:', !!user.token);
            
            const processes = await productifApiService.getUserProcesses(user.token);
            
            if (!processes || processes.length === 0) {
                return {
                    response: "Vous n'avez pas encore de processus. Un processus est une série d'étapes ou de tâches qui se répètent régulièrement.",
                    contextual: true
                };
            }

            // Construire la réponse
            let response = "📋 Voici vos processus :\n\n";
            
            for (const process of processes) {
                response += `📌 ${process.name}\n`;
                
                // Essayer de parser la description si c'est un JSON d'étapes
                try {
                    if (process.description) {
                        const steps = JSON.parse(process.description);
                        if (Array.isArray(steps)) {
                            for (const step of steps) {
                                response += `   ${step.completed ? '☑️' : '⬜'} ${step.title}\n`;
                                // Si l'étape a des sous-étapes
                                if (step.subSteps && step.subSteps.length > 0) {
                                    for (const subStep of step.subSteps) {
                                        response += `      ${subStep.completed ? '☑️' : '⬜'} ${subStep.title}\n`;
                                    }
                                }
                            }
                        } else {
                            response += `   ${process.description}\n`;
                        }
                    }
                } catch (e) {
                    // Si ce n'est pas du JSON, afficher la description telle quelle
                    if (process.description) {
                        response += `   ${process.description}\n`;
                    }
                }

                const completionPercentage = process.stats?.completionPercentage || 0;
                const totalTasks = process.stats?.totalTasks || 0;
                const completedTasks = process.stats?.completedTasks || 0;
                
                response += `   Progression : ${completionPercentage}% (${completedTasks}/${totalTasks} tâches)\n\n`;
            }

            return {
                response,
                contextual: true
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des processus:', error);
            return {
                response: "Une erreur est survenue lors de la récupération des processus. Veuillez réessayer.",
                error: true,
                contextual: true
            };
        }
    }

    async handleCreateProcess(user, name, stepsString) {
        try {
            console.log('👤 Utilisateur:', user.whatsappId);
            console.log('🔑 Token disponible:', !!user.token);
            console.log('📝 Nom du processus:', name);
            console.log('📝 Étapes:', stepsString);

            // Convertir la liste d'étapes en JSON
            const steps = stepsString.split(',').map(step => ({
                id: Math.random().toString(36).substr(2, 9),
                title: step.trim(),
                completed: false,
                isExpanded: true,
                subSteps: []
            }));

            const processData = {
                name: name,
                description: JSON.stringify(steps)
            };

            const process = await productifApiService.createProcess(user.token, processData);
            
            let response = `✅ J'ai créé le processus "${process.name}" avec les étapes suivantes :\n\n`;
            for (const step of steps) {
                response += `⬜ ${step.title}\n`;
            }

            return {
                response,
                process: process,
                contextual: true
            };
        } catch (error) {
            console.error('Erreur lors de la création du processus:', error);
            return {
                response: "Une erreur est survenue lors de la création du processus. Veuillez réessayer.",
                error: true,
                contextual: true
            };
        }
    }
}

module.exports = new AIService(); 