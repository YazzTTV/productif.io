import { PrismaClient } from '@prisma/client';
import NotificationLogger from './NotificationLogger.js';
class NotificationContentBuilder {
    constructor() {
        this.prisma = new PrismaClient();
    }
    async buildMorningContent(userId) {
        try {
            console.log('🔍 Début de buildMorningContent pour userId:', userId);
            const now = new Date();
            // Créer une date pour aujourd'hui en heure locale, puis l'ajuster pour UTC
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            // Ajuster pour que la date soit cohérente avec l'heure locale
            const offset = today.getTimezoneOffset() * 60000;
            const todayUTC = new Date(today.getTime() - offset);
            console.log('📅 Date du jour (UTC ajustée):', todayUTC);
            console.log('📅 Date locale (pour debug):', now.toLocaleDateString());
            // Récupérer les tâches prioritaires
            console.log('🎯 Recherche des tâches prioritaires avec les critères:');
            console.log({
                userId,
                completed: false,
                OR: [
                    { dueDate: { equals: todayUTC } },
                    { scheduledFor: { equals: todayUTC } }
                ],
                priority: {
                    not: null,
                    gte: 3
                }
            });
            const tasks = await this.prisma.task.findMany({
                where: {
                    userId,
                    completed: false,
                    OR: [
                        { dueDate: { equals: today } },
                        { scheduledFor: { equals: today } }
                    ],
                    priority: {
                        not: null,
                        gte: 3
                    }
                },
                orderBy: [
                    { priority: 'desc' },
                    { dueDate: 'asc' }
                ],
                take: 5
            });
            console.log('📋 Tâches trouvées:', tasks);
            // Récupérer les habitudes du jour
            console.log('💫 Recherche des habitudes du jour');
            const dayNameEN = todayUTC.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            console.log('📅 Jour de la semaine (EN):', dayNameEN);
            const habits = await this.prisma.habit.findMany({
                where: {
                    userId,
                    daysOfWeek: {
                        has: dayNameEN
                    }
                },
                include: {
                    entries: {
                        where: {
                            date: todayUTC
                        }
                    }
                }
            });
            console.log('📋 Habitudes trouvées:', habits);
            // Construire le message
            let message = "🌅 C'est parti pour une nouvelle journée !\n\n";
            if (tasks.length > 0) {
                message += "🎯 Voici tes tâches prioritaires pour le deep work :\n";
                tasks.forEach((task, index) => {
                    const priorityLabel = task.priority === 4 ? "⚡️" :
                        task.priority === 3 ? "🔥" :
                            task.priority === 2 ? "⭐️" :
                                task.priority === 1 ? "📌" : "📝";
                    const energyLabel = task.energyLevel === 3 ? "🔋🔋🔋" :
                        task.energyLevel === 2 ? "🔋🔋" : "🔋";
                    message += `${index + 1}. ${priorityLabel} ${energyLabel} ${task.title}\n`;
                });
                message += "\n";
            }
            if (habits.length > 0) {
                message += "💫 Tes habitudes pour aujourd'hui :\n";
                habits.forEach((habit, index) => {
                    const completed = habit.entries.length > 0 && habit.entries[0].completed;
                    const status = completed ? "✅" : "⭕️";
                    message += `${index + 1}. ${status} ${habit.name}\n`;
                });
            }
            console.log('📤 Message final:', message);
            return message;
        }
        catch (error) {
            console.error('❌ Erreur dans buildMorningContent:', error);
            NotificationLogger.logError('Construction du contenu du matin', error);
            return "🌅 C'est parti pour une nouvelle journée !";
        }
    }
    async buildNoonContent(userId) {
        try {
            const now = new Date();
            // Créer une date pour aujourd'hui en heure locale, puis l'ajuster pour UTC
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            // Ajuster pour que la date soit cohérente avec l'heure locale
            const offset = today.getTimezoneOffset() * 60000;
            const todayUTC = new Date(today.getTime() - offset);
            const noon = new Date(todayUTC);
            noon.setHours(12, 0, 0, 0);
            // Récupérer toutes les tâches prioritaires (complétées et non complétées pour le bilan)
            // Utiliser une date simple pour aujourd'hui sans décalage horaire
            const todaySimple = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            const morningTasks = await this.prisma.task.findMany({
                where: {
                    userId,
                    OR: [
                        { dueDate: { equals: todaySimple } },
                        { scheduledFor: { equals: todaySimple } }
                    ],
                    priority: {
                        not: null,
                        gte: 3
                    }
                },
                orderBy: [
                    { completed: 'asc' },
                    { priority: 'desc' },
                    { energyLevel: 'desc' }
                ]
            });
            // Récupérer le temps total passé ce matin
            const timeEntries = await this.prisma.timeEntry.findMany({
                where: {
                    userId,
                    startTime: {
                        gte: todayUTC,
                        lt: noon
                    }
                }
            });
            let totalMinutes = 0;
            timeEntries.forEach(entry => {
                if (entry.endTime) {
                    const duration = entry.endTime.getTime() - entry.startTime.getTime();
                    totalMinutes += Math.floor(duration / 1000 / 60);
                }
            });
            // Construire le message
            let message = "🕛 C'est l'heure de la pause déjeuner !\n\n";
            
            const completedTasks = morningTasks.filter(t => t.completed);
            const pendingTasks = morningTasks.filter(t => !t.completed);
            
            message += `📊 Bilan de la matinée :\n`;
            message += `✅ ${completedTasks.length}/${morningTasks.length} tâches accomplies\n`;
            message += `⏱ ${Math.floor(totalMinutes / 60)}h${totalMinutes % 60}min de travail\n\n`;
            
            if (pendingTasks.length > 0) {
                message += "📝 Tâches restantes :\n";
                pendingTasks.forEach((task, index) => {
                    const priorityLabel = task.priority === 4 ? "⚡️" :
                        task.priority === 3 ? "🔥" :
                            task.priority === 2 ? "⭐️" :
                                task.priority === 1 ? "📌" : "📝";
                    message += `${index + 1}. ${priorityLabel} ${task.title}\n`;
                });
                message += "\n";
            }
            message += "\n💭 Comment s'est passée ta matinée ?\n";
            message += "🍽 Bonne pause déjeuner ! On se retrouve après manger 😊";
            return message;
        }
        catch (error) {
            NotificationLogger.logError('Construction du contenu du midi', error);
            return "🕛 C'est l'heure de la pause déjeuner !";
        }
    }
    async buildAfternoonContent(userId) {
        try {
            const now = new Date();
            // Créer une date pour aujourd'hui en heure locale, puis l'ajuster pour UTC
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            // Ajuster pour que la date soit cohérente avec l'heure locale
            const offset = today.getTimezoneOffset() * 60000;
            const startOfDay = new Date(today.getTime() - offset);
            // Récupérer les tâches restantes
            const remainingTasks = await this.prisma.task.findMany({
                where: {
                    userId,
                    completed: false,
                    OR: [
                        { dueDate: { equals: startOfDay } },
                        { scheduledFor: { equals: startOfDay } }
                    ]
                },
                orderBy: [
                    { priority: 'desc' },
                    { dueDate: 'asc' }
                ]
            });
            // Récupérer les habitudes non complétées
            const dayNameEN = startOfDay.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const uncompletedHabits = await this.prisma.habit.findMany({
                where: {
                    userId,
                    daysOfWeek: {
                        has: dayNameEN
                    },
                    entries: {
                        none: {
                            date: startOfDay,
                            completed: true
                        }
                    }
                }
            });
            // Construire le message
            let message = "💪 Allez, c'est reparti !\n\n";
            if (remainingTasks.length > 0) {
                message += "📝 Voici ce qu'il te reste à faire :\n";
                remainingTasks.forEach((task, index) => {
                    const priorityLabel = task.priority === 4 ? "⚡️" :
                        task.priority === 3 ? "🔥" :
                            task.priority === 2 ? "⭐️" :
                                task.priority === 1 ? "📌" : "📝";
                    message += `${index + 1}. ${priorityLabel} ${task.title}\n`;
                });
                message += "\n";
            }
            if (uncompletedHabits.length > 0) {
                message += "💫 N'oublie pas tes habitudes :\n";
                uncompletedHabits.forEach((habit, index) => {
                    message += `${index + 1}. ⭕️ ${habit.name}\n`;
                });
                message += "\n";
            }
            message += "🎯 On se retrouve quand tu as fini ! 🚀";
            return message;
        }
        catch (error) {
            NotificationLogger.logError('Construction du contenu de l\'après-midi', error);
            return "💪 Allez, c'est reparti !";
        }
    }
    async buildEveningContent(userId) {
        try {
            const now = new Date();
            // Créer une date pour aujourd'hui en heure locale, puis l'ajuster pour UTC
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            // Ajuster pour que la date soit cohérente avec l'heure locale
            const offset = today.getTimezoneOffset() * 60000;
            const todayUTC = new Date(today.getTime() - offset);
            const tomorrow = new Date(todayUTC);
            tomorrow.setDate(tomorrow.getDate() + 1);
            // Récupérer les tâches d'aujourd'hui (utiliser date simple comme pour noon)
            const todaySimple = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const todayTasks = await this.prisma.task.findMany({
                where: {
                    userId,
                    OR: [
                        { dueDate: { equals: todaySimple } },
                        { scheduledFor: { equals: todaySimple } }
                    ],
                    priority: {
                        not: null,
                        gte: 3
                    }
                }
            });
            // Récupérer les tâches prioritaires pour demain
            const tomorrowTasks = await this.prisma.task.findMany({
                where: {
                    userId,
                    completed: false,
                    OR: [
                        { dueDate: { equals: tomorrow } },
                        { scheduledFor: { equals: tomorrow } }
                    ]
                },
                orderBy: [
                    { priority: 'desc' },
                    { dueDate: 'asc' }
                ],
                take: 5
            });
            // Récupérer les objectifs en cours
            const objectives = await this.prisma.objective.findMany({
                where: {
                    mission: {
                        userId,
                        quarter: Math.floor(todayUTC.getMonth() / 3) + 1,
                        year: todayUTC.getFullYear()
                    },
                    progress: {
                        lt: 100
                    }
                },
                orderBy: {
                    progress: 'asc'
                },
                take: 3
            });
            // Construire le message
            let message = "🌙 C'est l'heure du bilan et de préparer demain !\n\n";
            // Bilan du jour
            const completedTasks = todayTasks.filter(t => t.completed);
            message += `📊 Bilan du jour :\n`;
            message += `✅ ${completedTasks.length}/${todayTasks.length} tâches accomplies\n\n`;
            // Objectifs en cours
            if (objectives.length > 0) {
                message += "🎯 Objectifs en cours :\n";
                objectives.forEach((objective, index) => {
                    const progressBar = this.generateProgressBar(objective.progress);
                    message += `${index + 1}. ${objective.title}\n   ${progressBar} ${Math.round(objective.progress)}%\n`;
                });
                message += "\n";
            }
            // Tâches pour demain
            if (tomorrowTasks.length > 0) {
                message += "📝 Suggestions pour demain :\n";
                tomorrowTasks.forEach((task, index) => {
                    const priorityLabel = task.priority === 4 ? "⚡️" :
                        task.priority === 3 ? "🔥" :
                            task.priority === 2 ? "⭐️" :
                                task.priority === 1 ? "📌" : "📝";
                    message += `${index + 1}. ${priorityLabel} ${task.title}\n`;
                });
            }
            message += "\n📱 Pour créer une tâche, réponds avec ce format :\n";
            message += "📌 titre: [Titre de la tâche]\n";
            message += "⚡️ priorité: 1-4 (1:basse, 4:urgente)\n";
            message += "🔋 énergie: 1-3 (1:faible, 3:élevée)\n";
            message += "📅 date: JJ/MM (optionnel)";
            return message;
        }
        catch (error) {
            NotificationLogger.logError('Construction du contenu du soir', error);
            return "🌙 C'est l'heure du bilan et de préparer demain !";
        }
    }
    async buildNightContent(userId) {
        try {
            const now = new Date();
            // Créer une date pour aujourd'hui en heure locale, puis l'ajuster pour UTC
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            // Ajuster pour que la date soit cohérente avec l'heure locale
            const offset = today.getTimezoneOffset() * 60000;
            const todayUTC = new Date(today.getTime() - offset);
            // Récupérer les habitudes du jour
            const dayNameEN = todayUTC.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const habits = await this.prisma.habit.findMany({
                where: {
                    userId,
                    daysOfWeek: {
                        has: dayNameEN
                    }
                },
                include: {
                    entries: {
                        where: {
                            date: todayUTC
                        }
                    }
                }
            });
            // Récupérer les statistiques de la journée
            const timeEntries = await this.prisma.timeEntry.findMany({
                where: {
                    userId,
                    startTime: {
                        gte: todayUTC
                    },
                    endTime: {
                        not: null
                    }
                },
                select: {
                    startTime: true,
                    endTime: true
                }
            });
            // Calculer la durée totale en minutes
            const totalDuration = timeEntries.reduce((sum, entry) => {
                if (entry.endTime) {
                    const durationMs = entry.endTime.getTime() - entry.startTime.getTime();
                    const durationMin = Math.floor(durationMs / (1000 * 60));
                    return sum + durationMin;
                }
                return sum;
            }, 0);
            // Construire le message
            let message = "🌙 Dernière étape avant d'aller dormir !\n\n";
            if (habits.length > 0) {
                const completedHabits = habits.filter(h => h.entries.length > 0 && h.entries[0].completed);
                message += `📊 Habitudes du jour : ${completedHabits.length}/${habits.length}\n\n`;
                message += "💫 État des habitudes :\n";
                habits.forEach((habit, index) => {
                    const completed = habit.entries.length > 0 && habit.entries[0].completed;
                    const status = completed ? "✅" : "⭕️";
                    message += `${index + 1}. ${status} ${habit.name}\n`;
                });
                message += "\n";
            }
            if (totalDuration > 0) {
                const hours = Math.floor(totalDuration / 60);
                const minutes = totalDuration % 60;
                message += `⏱ Temps de travail total : ${hours}h${minutes}min\n\n`;
            }
            message += "💭 Prends 2 minutes pour compléter et noter comment s'est passée ta journée.\n\n";
            message += "🌅 On se retrouve demain matin pour une nouvelle journée productive ! 💪";
            return message;
        }
        catch (error) {
            NotificationLogger.logError('Construction du contenu de la nuit', error);
            return "🌙 Dernière étape avant d'aller dormir !";
        }
    }
    generateProgressBar(percentage) {
        const width = 10;
        const filledCount = Math.round((percentage / 100) * width);
        const emptyCount = width - filledCount;
        return '▓'.repeat(filledCount) + '░'.repeat(emptyCount);
    }
}
export default new NotificationContentBuilder();
