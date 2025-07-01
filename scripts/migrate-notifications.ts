import { PrismaClient as PostgresClient } from '@prisma/client'
import { MongoClient } from 'mongodb'
import * as dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI
const POSTGRES_URL = process.env.DATABASE_URL

if (!MONGODB_URI || !POSTGRES_URL) {
  console.error('❌ Les variables d\'environnement MONGODB_URI et DATABASE_URL sont requises')
  process.exit(1)
}

async function migrateNotifications() {
  console.log('🚀 Démarrage de la migration des notifications...')

  // Connexion aux bases de données
  const mongoClient = new MongoClient(MONGODB_URI)
  const postgresClient = new PostgresClient()

  try {
    await mongoClient.connect()
    console.log('✅ Connecté à MongoDB')

    const db = mongoClient.db()
    
    // 1. Migrer l'historique des notifications
    console.log('📋 Migration de l\'historique des notifications...')
    const notificationHistory = await db.collection('NotificationHistory').find({}).toArray()
    
    for (const notification of notificationHistory) {
      await postgresClient.notificationHistory.create({
        data: {
          id: notification._id.toString(),
          userId: notification.userId,
          type: notification.type,
          content: notification.content,
          scheduledFor: new Date(notification.scheduledFor),
          sentAt: notification.sentAt ? new Date(notification.sentAt) : null,
          status: notification.status,
          error: notification.error
        }
      })
    }
    console.log(`✅ ${notificationHistory.length} notifications migrées`)

    // 2. Migrer les préférences de notification
    console.log('⚙️ Migration des préférences de notification...')
    const preferences = await db.collection('UserNotificationPreference').find({}).toArray()
    
    for (const pref of preferences) {
      // Vérifier si l'utilisateur existe déjà dans PostgreSQL
      const existingUser = await postgresClient.user.findUnique({
        where: { id: pref.userId }
      })

      if (existingUser) {
        await postgresClient.notificationSettings.upsert({
          where: { userId: pref.userId },
          update: {
            whatsappEnabled: pref.whatsappEnabled,
            whatsappNumber: pref.whatsappNumber,
            morningReminder: pref.morningReminder,
            taskReminder: pref.taskReminder,
            habitReminder: pref.habitReminder,
            motivation: pref.motivation,
            dailySummary: pref.dailySummary
          },
          create: {
            userId: pref.userId,
            whatsappEnabled: pref.whatsappEnabled,
            whatsappNumber: pref.whatsappNumber,
            morningReminder: pref.morningReminder,
            taskReminder: pref.taskReminder,
            habitReminder: pref.habitReminder,
            motivation: pref.motivation,
            dailySummary: pref.dailySummary
          }
        })
      } else {
        console.warn(`⚠️ Utilisateur ${pref.userId} non trouvé dans PostgreSQL`)
      }
    }
    console.log(`✅ ${preferences.length} préférences de notification migrées`)

    console.log('✨ Migration terminée avec succès !')
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  } finally {
    await mongoClient.close()
    await postgresClient.$disconnect()
  }
}

// Exécuter la migration
migrateNotifications()
  .catch(console.error)
  .finally(() => process.exit()) 