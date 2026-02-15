import { PrismaClient } from '@prisma/client';
import NotificationLogger from './NotificationLogger.js';
const shouldLog = (level) => NotificationLogger.shouldLog(level);
class NotificationContentBuilder {
    constructor() {
        this.prisma = new PrismaClient();
    }
    /**
     * Construit uniquement la variable {{1}} du template productif_rappel_matin
     * (liste des habitudes)
     */
    async buildMorningHabitsVariable(userId) {
        try {
            if (shouldLog('debug')) console.log('💫 Construction de la variable habitudes pour template');
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
            
            if (habits.length === 0) {
                return "Aucune habitude prévue aujourd'hui.";
            }
            
            // Construire la liste des habitudes (variable {{1}})
            // WhatsApp templates n'acceptent pas les sauts de ligne dans les variables
            // On utilise " • " comme séparateur
            const habitsList = habits.map((habit, index) => {
                const completed = habit.entries.length > 0 && habit.entries[0].completed;
                const status = completed ? "✅" : "⭕";
                return `${status} ${habit.name}`;
            }).join(' • ');
            
            return habitsList;
        }
        catch (error) {
            console.error('❌ Erreur dans buildMorningHabitsVariable:', error);
            NotificationLogger.logError('Construction des habitudes du matin', error);
            return "💫 Tes habitudes pour aujourd'hui";
        }
    }

    async buildMorningContent(userId) {
        try {
            if (shouldLog('debug')) console.log('🔍 Début de buildMorningContent pour userId:', userId);
            const now = new Date();
            // Créer une date pour aujourd'hui en heure locale, puis l'ajuster pour UTC
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            // Ajuster pour que la date soit cohérente avec l'heure locale
            const offset = today.getTimezoneOffset() * 60000;
            const todayUTC = new Date(today.getTime() - offset);
            if (shouldLog('debug')) {
                console.log('📅 Date du jour (UTC ajustée):', todayUTC);
                console.log('📅 Date locale (pour debug):', now.toLocaleDateString());
            }
            // Récupérer les tâches prioritaires
            if (shouldLog('debug')) {
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
            }
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
            if (shouldLog('debug')) console.log('📋 Tâches trouvées:', tasks);
            // Récupérer les habitudes du jour
            if (shouldLog('debug')) console.log('💫 Recherche des habitudes du jour');
            const dayNameEN = todayUTC.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            if (shouldLog('debug')) console.log('📅 Jour de la semaine (EN):', dayNameEN);
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
            if (shouldLog('debug')) console.log('📋 Habitudes trouvées:', habits);
            
            // Construire le message complet du matin
            let message = "🌅 C'est parti pour une nouvelle journée !\n\n";
            
            if (habits.length > 0) {
                message += "💫 Tes habitudes pour aujourd'hui :\n\n";
                habits.forEach((habit, index) => {
                    const completed = habit.entries.length > 0 && habit.entries[0].completed;
                    const status = completed ? "✅" : "⭕";
                    message += `${index + 1}. ${status} ${habit.name}\n`;
                });
            } else {
                message += "Aucune habitude prévue aujourd'hui.\n";
            }
            
            message += "\nBonne journée ! 💙";
            
            if (shouldLog('debug')) console.log('📤 Message du matin construit');
            
            return message;
        }
        catch (error) {
            console.error('❌ Erreur dans buildMorningContent:', error);
            NotificationLogger.logError('Construction du contenu du matin', error);
            return "💫 Tes habitudes pour aujourd'hui";
        }
    }
    async buildNoonContent(userId) {
        try {
            if (shouldLog('debug')) console.log('💫 Construction des variables pour vérification de midi');
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // Heure de midi pour limiter le temps de travail
            const noon = new Date(today);
            noon.setHours(12, 0, 0, 0);
            
            // Récupérer TOUTES les tâches du jour (comparer uniquement la date, pas l'heure)
            const morningTasks = await this.prisma.task.findMany({
                where: {
                    userId,
                    OR: [
                        { 
                            dueDate: { 
                                gte: today,
                                lt: tomorrow
                            } 
                        },
                        { 
                            scheduledFor: { 
                                gte: today,
                                lt: tomorrow
                            } 
                        }
                    ],
                    // Compter toutes les tâches avec une priorité (>=1)
                    priority: {
                        not: null,
                        gte: 1
                    }
                }
            });
            
            // Récupérer le temps total passé ce matin (00:00 → 12:00)
            const timeEntries = await this.prisma.timeEntry.findMany({
                where: {
                    userId,
                    startTime: {
                        gte: today,
                        lt: noon
                    },
                    endTime: {
                        not: null
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
            
            const completedTasks = morningTasks.filter(t => t.completed);
            
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            
            if (shouldLog('debug')) {
                console.log('📊 Bilan du midi:');
                console.log(`   - ${completedTasks.length} tâches complétées sur ${morningTasks.length} totales`);
                console.log(`   - ${hours}h${minutes}min de travail ce matin`);
                if (morningTasks.length > 0) {
                    console.log('   Détail des tâches:');
                    morningTasks.forEach(t => {
                        console.log(`     - ${t.completed ? '✅' : '❌'} ${t.title}`);
                    });
                }
            }
            
            // Construire le message complet du midi
            let message = "🕛 C'est l'heure de la pause déjeuner !\n\n";
            message += "📊 Bilan de la matinée :\n\n";
            message += `✅ ${completedTasks.length}/${morningTasks.length} tâches accomplies\n`;
            message += `⏱ ${hours}h${minutes}min de travail\n\n`;
            message += "💭 Comment s'est passée ta matinée ?\n\n";
            message += "🍽 Bonne pause déjeuner ! On se retrouve après manger";
            
            return message;
        }
        catch (error) {
            console.error('❌ Erreur dans buildNoonContent:', error);
            NotificationLogger.logError('Construction du contenu du midi', error);
            return "🕛 C'est l'heure de la pause déjeuner !\n\n💭 Comment s'est passée ta matinée ?";
        }
    }
    async buildAfternoonContent(userId) {
        try {
            if (shouldLog('debug')) console.log('💫 Construction du contenu rappel après-midi');
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const offset = today.getTimezoneOffset() * 60000;
            const todayUTC = new Date(today.getTime() - offset);
            
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
            
            // Construire le message complet (sans template pour permettre les sauts de ligne)
            // Le titre sera ajouté par formatWhatsAppMessage
            let message = "💪 Allez, c'est reparti !\n\n";
            message += "💫 N'oublie pas tes habitudes :\n\n";
            
            if (habits.length === 0) {
                message += "Aucune habitude prévue pour cet après-midi.\n\n";
            } else {
                habits.forEach((habit, index) => {
                    const completed = habit.entries.length > 0 && habit.entries[0].completed;
                    const status = completed ? "✅" : "⭕";
                    message += `${index + 1}. ${status} ${habit.name}\n`;
                });
                message += "\n";
            }
            
            message += "🎯 On se retrouve quand tu as fini ! 🚀";
            
            return message;
        }
        catch (error) {
            console.error('❌ Erreur dans buildAfternoonContent:', error);
            NotificationLogger.logError('Construction du contenu de l\'après-midi', error);
            return "☀ L'après-midi t'attend ! 💪";
        }
    }
    async buildEveningContent(userId) {
        try {
            if (shouldLog('debug')) console.log('💫 Construction de la variable tâches pour planification du soir');
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // Récupérer TOUTES les tâches du jour (comparer uniquement la date, pas l'heure)
            const todayTasks = await this.prisma.task.findMany({
                where: {
                    userId,
                    OR: [
                        { 
                            dueDate: { 
                                gte: today,
                                lt: tomorrow
                            } 
                        },
                        { 
                            scheduledFor: { 
                                gte: today,
                                lt: tomorrow
                            } 
                        }
                    ],
                    // Compter toutes les tâches avec une priorité (>=1)
                    priority: {
                        not: null,
                        gte: 1
                    }
                }
            });
            
            const completedTasks = todayTasks.filter(t => t.completed);
            
            if (shouldLog('debug')) {
                console.log('📊 Bilan du soir:');
                console.log(`   - ${completedTasks.length} tâches complétées sur ${todayTasks.length} totales`);
                if (todayTasks.length > 0) {
                    console.log('   Détail des tâches:');
                    todayTasks.forEach(t => {
                        console.log(`     - ${t.completed ? '✅' : '❌'} ${t.title}`);
                    });
                }
            }
            
            // Construire le message complet du soir
            let message = "🌙 C'est l'heure du bilan et de préparer demain !\n\n";
            message += "📊 Bilan du jour :\n\n";
            message += `✅ ${completedTasks.length}/${todayTasks.length} tâches accomplies\n\n`;
            message += "📱 Pour créer une tâche : dit simplement \"planifie ma journée de demain\"";
            
            return message;
        }
        catch (error) {
            console.error('❌ Erreur dans buildEveningContent:', error);
            NotificationLogger.logError('Construction du contenu du soir', error);
            return "🌙 C'est l'heure du bilan et de préparer demain !";
        }
    }
    async buildNightContent(userId) {
        try {
            if (shouldLog('debug')) console.log('💫 Construction des variables pour vérification de nuit');
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
            
            const completedHabits = habits.filter(h => h.entries.length > 0 && h.entries[0].completed);
            
            // Calculer le ratio
            const habitRatio = `${completedHabits.length}/${habits.length}`;
            
            // Construire la liste détaillée avec sauts de ligne
            let habitsList = "";
            if (habits.length === 0) {
                habitsList = "Aucune habitude prévue aujourd'hui.";
            } else {
                habits.forEach((habit, index) => {
                    const completed = habit.entries.length > 0 && habit.entries[0].completed;
                    const status = completed ? "✅" : "⭕";
                    habitsList += `${index + 1}. ${status} ${habit.name}\n`;
                });
                habitsList = habitsList.trim();
            }
            
            // Calculer le temps de travail
            const hours = Math.floor(totalDuration / 60);
            const minutes = totalDuration % 60;
            const timeWorked = `${hours}h${minutes}min`;
            
            if (shouldLog('debug')) {
                console.log('📊 Bilan de nuit:', { 
                    habitRatio, 
                    habitsCount: habits.length,
                    timeWorked 
                });
            }
            
            // Construire le message complet (sans template pour permettre les sauts de ligne)
            let message = "✨ Bilan de ta journée\n\n";
            message += "🌙 Dernière étape avant d'aller dormir !\n\n";
            message += `📊 Habitudes du jour : ${habitRatio}\n\n`;
            message += "💫 État des habitudes :\n\n";
            message += `${habitsList}\n\n`;
            message += `⏱ Temps de travail total : ${timeWorked}\n\n`;
            message += "💭 Prends 2 minutes pour compléter et noter comment s'est passée ta journée.\n\n";
            message += "🌅 On se retrouve demain matin pour une nouvelle journée productive ! 💪";
            
            return message;
        }
        catch (error) {
            console.error('❌ Erreur dans buildNightContent:', error);
            NotificationLogger.logError('Construction du contenu de la nuit', error);
            return "✨ Bilan de ta journée\n\n🌙 Une erreur est survenue lors de la génération du bilan.";
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
