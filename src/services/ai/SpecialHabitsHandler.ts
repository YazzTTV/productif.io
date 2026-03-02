import { PrismaClient } from '@prisma/client';
import { generateApiToken } from '../../../lib/api-token'

interface ConversationState {
  userId: string;
  phoneNumber: string;
  habitName: string;
  habitId: string;
  stage: 'waiting_for_content' | 'waiting_for_rating' | 'waiting_for_summary';
  startedAt: Date;
  tempData: {
    content?: string;
    rating?: number;
    summary?: string;
    targetDate?: Date;
  };
}

export class SpecialHabitsHandler {
  private prisma: PrismaClient;
  private conversationStates: Map<string, ConversationState> = new Map();
  
  // Constantes pour les habitudes spéciales
  private readonly SPECIAL_HABITS = {
    APPRENTISSAGE: 'apprentissage',
    NOTE_JOURNEE: 'note de sa journée'
  } as const;

  constructor() {
    this.prisma = new PrismaClient();
    
    // Nettoyer les conversations expirées toutes les 5 minutes
    setInterval(() => {
      this.cleanupExpiredConversations();
    }, 5 * 60 * 1000);
  }

  /**
   * Vérifie si une habitude est spéciale
   */
  isSpecialHabit(habitName: string): boolean {
    const normalizedName = habitName.toLowerCase();
    return Object.values(this.SPECIAL_HABITS).some(specialHabit => 
      normalizedName.includes(specialHabit)
    );
  }

  /**
   * Détermine le type d'habitude spéciale
   */
  private getSpecialHabitType(habitName: string): string | null {
    const normalizedName = habitName.toLowerCase();
    
    if (normalizedName.includes(this.SPECIAL_HABITS.APPRENTISSAGE)) {
      return this.SPECIAL_HABITS.APPRENTISSAGE;
    }
    
    if (normalizedName.includes(this.SPECIAL_HABITS.NOTE_JOURNEE)) {
      return this.SPECIAL_HABITS.NOTE_JOURNEE;
    }
    
    return null;
  }

  /**
   * Démarre le processus de complétion d'une habitude spéciale
   */
  async startSpecialHabitCompletion(
    userId: string, 
    phoneNumber: string, 
    habitName: string, 
    habitId: string,
    targetDate?: Date
  ): Promise<string> {
    const habitType = this.getSpecialHabitType(habitName);
    
    if (!habitType) {
      throw new Error('Habitude non reconnue comme spéciale');
    }

    // Créer un état de conversation
    const conversationKey = `${userId}_${phoneNumber}`;
    
    if (habitType === this.SPECIAL_HABITS.APPRENTISSAGE) {
      this.conversationStates.set(conversationKey, {
        userId,
        phoneNumber,
        habitName,
        habitId,
        stage: 'waiting_for_content',
        startedAt: new Date(),
        tempData: {
          targetDate: targetDate || new Date()
        }
      });

      return `✅ Super ! Qu'as-tu appris aujourd'hui ? 
      
📝 Décris en quelques mots ce que tu as découvert ou étudié.

💡 _Réponds avec ton apprentissage, je l'enregistrerai dans ton espace personnel !_`;
    }
    
    if (habitType === this.SPECIAL_HABITS.NOTE_JOURNEE) {
      this.conversationStates.set(conversationKey, {
        userId,
        phoneNumber,
        habitName,
        habitId,
        stage: 'waiting_for_rating',
        startedAt: new Date(),
        tempData: {
          targetDate: targetDate || new Date()
        }
      });

      return `✅ Génial ! Comment notes-tu ta journée ?

⭐ **Note ta journée de 1 à 10** (où 10 = journée parfaite)

Écris juste le chiffre, par exemple : "8"`;
    }

    throw new Error('Type d\'habitude spéciale non géré');
  }

  /**
   * Traite la réponse de l'utilisateur dans le cadre d'une conversation
   */
  async handleConversationResponse(
    userId: string, 
    phoneNumber: string, 
    message: string
  ): Promise<{ response: string; completed: boolean }> {
    const conversationKey = `${userId}_${phoneNumber}`;
    const state = this.conversationStates.get(conversationKey);
    
    if (!state) {
      return { response: '', completed: false };
    }

    // Gestion des commandes d'abandon
    if (message.toLowerCase().includes('annuler') || message.toLowerCase().includes('stop')) {
      this.conversationStates.delete(conversationKey);
      return { 
        response: '❌ Enregistrement annulé. Tu peux toujours marquer ton habitude comme complétée normalement.',
        completed: true 
      };
    }

    try {
      switch (state.stage) {
        case 'waiting_for_content':
          return await this.handleContentResponse(state, message, conversationKey);
          
        case 'waiting_for_rating':
          return await this.handleRatingResponse(state, message, conversationKey);
          
        case 'waiting_for_summary':
          return await this.handleSummaryResponse(state, message, conversationKey);
          
        default:
          this.conversationStates.delete(conversationKey);
          return { response: 'Erreur interne. Processus annulé.', completed: true };
      }
    } catch (error) {
      console.error('Erreur lors du traitement de la conversation spéciale:', error);
      this.conversationStates.delete(conversationKey);
      return { 
        response: 'Une erreur s\'est produite. L\'habitude n\'a pas été enregistrée.',
        completed: true 
      };
    }
  }

  /**
   * Gère la réponse pour le contenu d'apprentissage
   */
  private async handleContentResponse(
    state: ConversationState, 
    message: string, 
    conversationKey: string
  ): Promise<{ response: string; completed: boolean }> {
    const content = message.trim();
    
    if (content.length < 5) {
      return {
        response: '📝 Peux-tu être un peu plus détaillé ? Décris ce que tu as appris en quelques mots.',
        completed: false
      };
    }

    // Enregistrer l'apprentissage et compléter l'habitude
    await this.completeHabitWithData(state.habitId, { note: content }, state.tempData.targetDate);
    
    this.conversationStates.delete(conversationKey);
    
    return {
      response: `📚 Parfait ! J'ai enregistré ton apprentissage : "${content}"

✅ L'habitude "${state.habitName}" est marquée comme complétée !

🎯 Tu peux retrouver tous tes apprentissages dans **Mon Espace** sur l'app.`,
      completed: true
    };
  }

  /**
   * Gère la réponse pour la note de journée
   */
  private async handleRatingResponse(
    state: ConversationState, 
    message: string, 
    conversationKey: string
  ): Promise<{ response: string; completed: boolean }> {
    const rating = parseInt(message.trim());
    
    if (isNaN(rating) || rating < 1 || rating > 10) {
      return {
        response: '⭐ Merci de donner une note entre 1 et 10. Par exemple : "7"',
        completed: false
      };
    }

    // Stocker la note et passer à l'étape suivante
    state.tempData.rating = rating;
    state.stage = 'waiting_for_summary';
    this.conversationStates.set(conversationKey, state);

    return {
      response: `⭐ Merci ! Ta journée est notée **${rating}/10**

📝 Veux-tu ajouter un résumé de ta journée ? (optionnel)

💭 Écris quelques mots sur ce qui s'est passé, ou réponds **"non"** pour terminer.`,
      completed: false
    };
  }

  /**
   * Gère la réponse pour le résumé de journée
   */
  private async handleSummaryResponse(
    state: ConversationState, 
    message: string, 
    conversationKey: string
  ): Promise<{ response: string; completed: boolean }> {
    const summary = message.trim().toLowerCase();
    
    let finalNote = `Note: ${state.tempData.rating}/10`;
    
    if (summary !== 'non' && summary.length > 3) {
      finalNote += `\n\nRésumé: ${message.trim()}`;
    }

    // Enregistrer avec la note et le résumé
    await this.completeHabitWithData(state.habitId, { 
      note: finalNote,
      rating: state.tempData.rating 
    }, state.tempData.targetDate);
    
    // Déclenchement du journaling une fois l'habitude enregistrée
    try {
      const required = ['journal:read', 'journal:write', 'deepwork:read', 'deepwork:write', 'tasks:read', 'tasks:write']
      const existing = await this.prisma.apiToken.findFirst({
        where: { userId: state.userId, scopes: { hasEvery: required } },
        orderBy: { createdAt: 'desc' }
      })
      const token = existing?.token || (await generateApiToken({
        name: 'Agent IA (Deep Work + Journal)',
        userId: state.userId,
        scopes: required
      })).token

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const payload = {
        transcription: finalNote,
        date: (state.tempData.targetDate || new Date()).toISOString()
      }

      console.log('📔 Journaling (habit Note de sa journée) POST', { appUrl, path: '/api/journal/agent' })
      const resp = await fetch(`${appUrl}/api/journal/agent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      const txt = await resp.text()
      console.log('📔 Journaling (habit) response', { status: resp.status, textLength: txt.length })
    } catch (e) {
      console.error('Erreur envoi au journal agent (habit Note de sa journée):', e)
    }

    this.conversationStates.delete(conversationKey);
    
    const summaryText = summary !== 'non' && summary.length > 3 
      ? ' et ton résumé' 
      : '';
    
    return {
      response: `📝 Parfait ! Ta note (${state.tempData.rating}/10)${summaryText} ${summary !== 'non' && summary.length > 3 ? 'sont' : 'est'} enregistrée !

✅ L'habitude "${state.habitName}" est marquée comme complétée !

📊 Retrouve tes notes dans **Mon Espace** pour suivre ton évolution.`,
      completed: true
    };
  }

  /**
   * Complète une habitude avec des données supplémentaires
   */
  private async completeHabitWithData(
    habitId: string, 
    data: { note?: string; rating?: number },
    targetDate?: Date
  ): Promise<void> {
    // Utiliser la date fournie ou aujourd'hui par défaut
    const dateToUse = targetDate || new Date();
    const utcTargetDate = new Date(Date.UTC(
      dateToUse.getFullYear(),
      dateToUse.getMonth(),
      dateToUse.getDate(),
      0, 0, 0, 0
    ));

    console.log('📅 Date actuelle locale:', new Date().toLocaleString('fr-FR'));
    console.log('📅 Date cible pour enregistrement:', utcTargetDate.toISOString());
    console.log('📅 Date cible locale:', utcTargetDate.toLocaleDateString('fr-FR'));

    await this.prisma.habitEntry.upsert({
      where: {
        habitId_date: {
          habitId,
          date: utcTargetDate
        }
      },
      create: {
        habitId,
        date: utcTargetDate,
        completed: true,
        note: data.note,
        rating: data.rating
      },
      update: {
        completed: true,
        note: data.note,
        rating: data.rating
      }
    });
  }

  /**
   * Vérifie si un utilisateur est dans une conversation en cours
   */
  hasActiveConversation(userId: string, phoneNumber: string): boolean {
    const conversationKey = `${userId}_${phoneNumber}`;
    return this.conversationStates.has(conversationKey);
  }

  /**
   * Nettoie les conversations expirées (plus de 30 minutes)
   */
  private cleanupExpiredConversations(): void {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    
    for (const [key, state] of this.conversationStates.entries()) {
      if (state.startedAt < thirtyMinutesAgo) {
        this.conversationStates.delete(key);
        console.log(`🧹 Conversation expirée supprimée pour ${key}`);
      }
    }
  }

  /**
   * Nettoie les ressources
   */
  async cleanup(): Promise<void> {
    this.conversationStates.clear();
    await this.prisma.$disconnect();
  }
} 
