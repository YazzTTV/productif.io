const { MongoClient } = require('mongodb');

class TemplateService {
  constructor() {
    this.client = new MongoClient(process.env.MONGODB_URI);
  }

  /**
   * Crée ou met à jour un template
   */
  async createOrUpdateTemplate(name, content) {
    try {
      await this.client.connect();
      const db = this.client.db('plannificateur');

      return await db.collection('NotificationTemplate').updateOne(
        { name },
        {
          $set: {
            content,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Erreur lors de la création/mise à jour du template:', error);
      throw error;
    } finally {
      await this.client.close();
    }
  }

  /**
   * Récupère un template par son nom
   */
  async getTemplate(name) {
    try {
      await this.client.connect();
      const db = this.client.db('plannificateur');

      return await db.collection('NotificationTemplate').findOne({ name });
    } catch (error) {
      console.error('Erreur lors de la récupération du template:', error);
      throw error;
    } finally {
      await this.client.close();
    }
  }

  /**
   * Récupère tous les templates
   */
  async getAllTemplates() {
    try {
      await this.client.connect();
      const db = this.client.db('plannificateur');

      return await db.collection('NotificationTemplate').find().toArray();
    } catch (error) {
      console.error('Erreur lors de la récupération des templates:', error);
      throw error;
    } finally {
      await this.client.close();
    }
  }

  /**
   * Remplace les variables dans un template
   * @param {string} content - Le contenu du template avec des variables (ex: "Bonjour {name}")
   * @param {Object} variables - Un objet contenant les valeurs des variables
   */
  replaceVariables(content, variables) {
    return content.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  /**
   * Initialise les templates par défaut
   */
  async initializeDefaultTemplates() {
    const defaultTemplates = [
      {
        name: 'morning_reminder',
        type: 'morning_reminder',
        content: 'Bonjour {name} ! Voici vos objectifs pour aujourd\'hui :\n\n{tasks}\n\nBonne journée !',
        variables: ['name', 'tasks']
      },
      {
        name: 'task_reminder',
        type: 'task_reminder',
        content: '⏰ Rappel : La tâche "{taskName}" est prévue pour {dueDate}.',
        variables: ['taskName', 'dueDate']
      },
      {
        name: 'habit_reminder',
        type: 'habit_reminder',
        content: '🎯 N\'oubliez pas votre habitude "{habitName}" aujourd\'hui !',
        variables: ['habitName']
      },
      {
        name: 'daily_summary',
        type: 'daily_summary',
        content: '📊 Résumé de votre journée :\n\n✅ Tâches complétées : {completedTasks}\n📝 Tâches en attente : {pendingTasks}\n🎯 Habitudes réalisées : {completedHabits}',
        variables: ['completedTasks', 'pendingTasks', 'completedHabits']
      },
      {
        name: 'motivation',
        type: 'motivation',
        content: '💪 {motivationalMessage}',
        variables: ['motivationalMessage']
      }
    ];

    for (const template of defaultTemplates) {
      await this.createOrUpdateTemplate(
        template.name,
        template.content
      );
    }

    console.log('Templates par défaut initialisés');
  }
}

module.exports = new TemplateService(); 