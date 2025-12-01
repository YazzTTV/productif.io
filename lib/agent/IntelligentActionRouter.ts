import { Intent } from '@/lib/ai/IntentDetectionService';
import prisma from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { handleTaskPlanningCommand } from './handlers/task-planning.handler';
import { handleDeepWorkCommand } from './handlers/deepwork.handler';
import { handleHelpRequest } from './handlers/help.handler';

export class IntelligentActionRouter {
  /**
   * Router une intention vers la bonne action
   */
  static async routeIntent(
    intent: Intent,
    userId: string,
    phoneNumber: string,
    apiToken: string,
    originalMessage: string
  ): Promise<{
    handled: boolean;
    response: string;
    actionExecuted?: string;
  }> {
    // Si pas d'action requise, retourner la réponse suggérée
    if (!intent.requiresAction) {
      return {
        handled: true,
        response: intent.suggestedResponse || "Comment puis-je t'aider ?",
        actionExecuted: 'conversation'
      };
    }

    // Router selon la catégorie d'intention
    switch (intent.category) {
      case 'create_task':
        return await this.handleCreateTask(intent, userId, apiToken, originalMessage);

      case 'list_tasks':
        return await this.handleListTasks(intent, userId, apiToken);

      case 'complete_task':
        return await this.handleCompleteTask(intent, userId, apiToken);

      case 'plan_tomorrow':
        return await this.handlePlanTomorrow(intent, userId, phoneNumber, apiToken, originalMessage);

      case 'start_deepwork':
        return await this.handleStartDeepWork(intent, userId, phoneNumber, apiToken);

      case 'track_habit':
        return await this.handleTrackHabit(intent, userId, apiToken);

      case 'status_check':
        return await this.handleStatusCheck(intent, userId);

      case 'statistics':
        return await this.handleStatistics(intent, userId);

      case 'help_request':
      case 'how_to':
      case 'advice_request':
      case 'explanation':
        return await this.handleHelpRequest(intent, userId, phoneNumber, originalMessage);

      default:
        return {
          handled: false,
          response: "Je n'ai pas compris cette action. Peux-tu préciser ?"
        };
    }
  }

  // ===== HANDLERS D'ACTIONS =====

  private static async handleCreateTask(
    intent: Intent,
    userId: string,
    apiToken: string,
    originalMessage: string
  ) {
    try {
      // Si plusieurs tâches détectées
      if (intent.entities.tasks && intent.entities.tasks.length > 0) {
        const tasks = intent.entities.tasks;
        const createdTasks = [];

        for (const taskTitle of tasks) {
          const task = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/tasks/agent`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                title: taskTitle,
                priority: intent.parameters.urgency === 'high' ? 3 : 2,
                dueDate: this.parseDateFromEntities(intent.entities.dates)
              })
            }
          );

          if (task.ok) {
            const data = await task.json();
            createdTasks.push(data.task);
          }
        }

        let response = `✅ J'ai créé ${createdTasks.length} tâche${createdTasks.length > 1 ? 's' : ''} :\n\n`;
        createdTasks.forEach((t, idx) => {
          response += `${idx + 1}. ${t.title}\n`;
        });

        return {
          handled: true,
          response,
          actionExecuted: 'create_task'
        };
      } else {
        // Tâche unique, titre = message original (nettoyé)
        const taskTitle = originalMessage.length > 100 
          ? originalMessage.substring(0, 100) + '...' 
          : originalMessage;

        const task = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/tasks/agent`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              title: taskTitle,
              priority: intent.parameters.urgency === 'high' ? 3 : 2,
              dueDate: this.parseDateFromEntities(intent.entities.dates)
            })
          }
        );

        if (task.ok) {
          return {
            handled: true,
            response: `✅ Tâche créée ! Je l'ai notée pour toi. ${intent.emotionalContext === 'stressed' ? 'Respire, tu vas y arriver ! 💪' : ''}`,
            actionExecuted: 'create_task'
          };
        }
      }

      throw new Error('Erreur création tâche');

    } catch (error) {
      return {
        handled: true,
        response: '❌ Je n\'ai pas pu créer la tâche. Réessaye dans un instant.',
        actionExecuted: 'create_task_failed'
      };
    }
  }

  private static async handleListTasks(
    intent: Intent,
    userId: string,
    apiToken: string
  ) {
    try {
      // Déterminer quelle liste selon les entités
      let date = new Date();
      let title = "Tes tâches d'aujourd'hui";

      if (intent.entities.dates?.some(d => d.toLowerCase().includes('demain'))) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        date = tomorrow;
        title = "Tes tâches de demain";
      }

      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/tasks/agent/date?date=${dateStr}`,
        {
          headers: { 'Authorization': `Bearer ${apiToken}` }
        }
      );

      if (response.ok) {
        const tasks = await response.json();

        if (!tasks || tasks.length === 0) {
          return {
            handled: true,
            response: `📋 ${title} : Aucune tâche ! ${intent.emotionalContext === 'positive' ? 'Profite de ce temps libre ! ✨' : 'Veux-tu planifier ta journée ?'}`,
            actionExecuted: 'list_tasks'
          };
        }

        let responseMsg = `📋 *${title}* (${tasks.length}) :\n\n`;
        
        tasks.slice(0, 10).forEach((t: any, idx: number) => {
          const priorityEmoji = ['⚪', '🔵', '🟡', '🟠', '🔴'][t.priority || 0] || '⚪';
          responseMsg += `${priorityEmoji} ${idx + 1}. ${t.title}\n`;
        });

        if (tasks.length > 10) {
          responseMsg += `\n... et ${tasks.length - 10} autre${tasks.length - 10 > 1 ? 's' : ''}`;
        }

        return {
          handled: true,
          response: responseMsg,
          actionExecuted: 'list_tasks'
        };
      }

      throw new Error('Erreur récupération tâches');

    } catch (error) {
      return {
        handled: true,
        response: '❌ Je n\'ai pas pu récupérer tes tâches.',
        actionExecuted: 'list_tasks_failed'
      };
    }
  }

  private static async handleCompleteTask(
    intent: Intent,
    userId: string,
    apiToken: string
  ) {
    try {
      // Rechercher la tâche par titre
      const taskTitle = intent.entities.tasks?.[0];

      if (!taskTitle) {
        return {
          handled: true,
          response: '🤔 Quelle tâche veux-tu marquer comme terminée ?',
          actionExecuted: 'complete_task_unclear'
        };
      }

      // Rechercher la tâche via l'API
      const searchResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/tasks/agent?search=${encodeURIComponent(taskTitle)}`,
        {
          headers: { 'Authorization': `Bearer ${apiToken}` }
        }
      );

      if (searchResponse.ok) {
        const data = await searchResponse.json();
        const tasks = data.tasks || [];

        if (tasks.length === 0) {
          return {
            handled: true,
            response: `🤔 Je n'ai pas trouvé de tâche "${taskTitle}". Veux-tu voir ta liste de tâches ?`,
            actionExecuted: 'complete_task_not_found'
          };
        }

        const task = tasks[0];

        // Marquer comme complétée
        const completeResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/tasks/agent/${task.id}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ completed: true })
          }
        );

        if (completeResponse.ok) {
          return {
            handled: true,
            response: `✅ Tâche "${task.title}" terminée ! 🎉\n\n${intent.emotionalContext === 'positive' ? 'Bien joué ! Continue comme ça ! 💪' : 'Une de moins ! 👍'}`,
            actionExecuted: 'complete_task'
          };
        }
      }

      throw new Error('Erreur complétion tâche');

    } catch (error) {
      return {
        handled: true,
        response: '❌ Je n\'ai pas pu marquer la tâche comme terminée.',
        actionExecuted: 'complete_task_failed'
      };
    }
  }

  private static async handlePlanTomorrow(
    intent: Intent,
    userId: string,
    phoneNumber: string,
    apiToken: string,
    originalMessage: string
  ) {
    // Utiliser le handler existant de planification
    const handled = await handleTaskPlanningCommand(originalMessage, userId, phoneNumber, apiToken);
    
    if (handled) {
      return {
        handled: true,
        response: "🤖 Parfait ! Laisse-moi analyser et organiser tout ça...",
        actionExecuted: 'plan_tomorrow'
      };
    } else {
      // Si le handler n'a pas géré, on demande les tâches
      return {
        handled: true,
        response: "📋 Super ! Dis-moi tout ce que tu as à faire demain, je vais t'organiser une journée productive ! 🚀",
        actionExecuted: 'plan_tomorrow_prompt'
      };
    }
  }

  private static async handleStartDeepWork(
    intent: Intent,
    userId: string,
    phoneNumber: string,
    apiToken: string
  ) {
    // Utiliser le handler Deep Work existant
    const handled = await handleDeepWorkCommand(
      "je commence à travailler",
      userId,
      phoneNumber,
      apiToken
    );
    
    if (handled) {
      return {
        handled: true,
        response: "🚀 C'est parti pour une session Deep Work !",
        actionExecuted: 'start_deepwork'
      };
    } else {
      return {
        handled: true,
        response: "🚀 Prêt pour une session Deep Work ! Combien de temps veux-tu travailler ?",
        actionExecuted: 'start_deepwork_prompt'
      };
    }
  }

  private static async handleTrackHabit(
    intent: Intent,
    userId: string,
    apiToken: string
  ) {
    // Implémenter le tracking d'habitude
    // Pour l'instant, réponse simple
    return {
      handled: true,
      response: "✅ Habitude validée ! Continue comme ça ! 🌟",
      actionExecuted: 'track_habit'
    };
  }

  private static async handleStatusCheck(
    intent: Intent,
    userId: string
  ) {
    try {
      // Récupérer les stats du jour
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [totalTasks, completedTasks, activeSession] = await Promise.all([
        prisma.task.count({
          where: {
            userId,
            dueDate: { gte: today, lt: tomorrow }
          }
        }),
        prisma.task.count({
          where: {
            userId,
            dueDate: { gte: today, lt: tomorrow },
            completed: true
          }
        }),
        prisma.deepWorkSession.findFirst({
          where: {
            userId,
            status: 'active'
          }
        })
      ]);

      const completionRate = totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

      let response = `📊 *Ton statut aujourd'hui :*\n\n`;
      response += `✅ ${completedTasks}/${totalTasks} tâches terminées (${completionRate}%)\n`;
      
      if (activeSession) {
        response += `⏱️ Session Deep Work en cours\n`;
      }

      response += `\n`;

      if (completionRate >= 80) {
        response += `🎉 Excellente performance ! Tu assures ! 🔥`;
      } else if (completionRate >= 50) {
        response += `👍 Bon rythme ! Continue comme ça !`;
      } else if (completionRate > 0) {
        response += `💪 Tu progresses ! Chaque tâche compte !`;
      } else {
        response += `🚀 Il est temps de se lancer ! Tu peux le faire !`;
      }

      return {
        handled: true,
        response,
        actionExecuted: 'status_check'
      };

    } catch (error) {
      return {
        handled: true,
        response: '📊 Impossible de récupérer ton statut pour le moment.',
        actionExecuted: 'status_check_failed'
      };
    }
  }

  private static async handleStatistics(
    intent: Intent,
    userId: string
  ) {
    // Implémenter les statistiques
    return {
      handled: true,
      response: "📈 Voici tes stats ! (À implémenter)",
      actionExecuted: 'statistics'
    };
  }

  private static async handleHelpRequest(
    intent: Intent,
    userId: string,
    phoneNumber: string,
    originalMessage: string
  ) {
    try {
      // Récupérer le contexte utilisateur
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [pendingTasks, completedToday, activeSession] = await Promise.all([
        prisma.task.count({
          where: {
            userId,
            completed: false
          }
        }),
        prisma.task.count({
          where: {
            userId,
            dueDate: { gte: today, lt: tomorrow },
            completed: true
          }
        }),
        prisma.deepWorkSession.findFirst({
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

      const userContext = {
        pendingTasks,
        completedToday,
        hasActiveSession: !!activeSession,
        energyLevel
      };

      // Utiliser le handler d'aide
      const handled = await handleHelpRequest(originalMessage, userId, phoneNumber, userContext);
      
      if (handled) {
        return {
          handled: true,
          response: "", // Le handler envoie déjà le message
          actionExecuted: intent.category
        };
      }

      // Fallback si le handler n'a pas géré
      return {
        handled: true,
        response: intent.suggestedResponse || "Je suis là pour t'aider ! Peux-tu préciser ce sur quoi tu as besoin d'aide ? 🤔",
        actionExecuted: intent.category
      };
    } catch (error) {
      console.error('Erreur handleHelpRequest:', error);
      return {
        handled: true,
        response: "Je suis là pour t'aider ! Peux-tu reformuler ta question ? 🤔",
        actionExecuted: `${intent.category}_failed`
      };
    }
  }

  // ===== HELPERS =====

  private static parseDateFromEntities(dates?: string[]): Date | undefined {
    if (!dates || dates.length === 0) return undefined;

    const dateStr = dates[0].toLowerCase();
    const now = new Date();

    if (dateStr.includes('demain')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }

    if (dateStr.includes('aujourd\'hui') || dateStr.includes('aujourdhui')) {
      return now;
    }

    // Autres parsing de dates...
    return undefined;
  }
}

