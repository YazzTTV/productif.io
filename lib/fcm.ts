import admin from 'firebase-admin';
import { prisma } from './prisma';

const LOG_LEVEL = (process.env.LOG_LEVEL || 'warn').toLowerCase();
const LOG_ORDER: Record<string, number> = { error: 0, warn: 1, success: 2, info: 3, debug: 4 };
const shouldLog = (level: string) => {
  if (LOG_LEVEL === 'silent') return false;
  const current = LOG_ORDER[LOG_LEVEL] ?? LOG_ORDER.warn;
  const incoming = LOG_ORDER[level] ?? LOG_ORDER.info;
  return incoming <= current;
};

// Configuration FCM depuis les variables d'environnement
const initializeFirebase = async () => {
  // Vérifier si Firebase est déjà initialisé
  if (admin.apps && admin.apps.length > 0) {
    return admin.app();
  }

  // Option 1: Utiliser un fichier JSON de service account via variable d'environnement
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      // Utiliser dynamic import pour charger le fichier JSON
      const serviceAccount = await import(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount.default || serviceAccount),
        projectId: (serviceAccount.default || serviceAccount).project_id
      });
    } catch (error) {
      console.error('❌ Erreur lors du chargement du fichier de service account:', error);
      return null;
    }
  }

  // Option 2: Utiliser les credentials via variables d'environnement (pour Railway/Vercel)
  // Format: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      if (shouldLog('info')) {
        console.log('🔧 Initialisation Firebase avec variables d\'environnement...');
        console.log(`   - Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
        console.log(`   - Client Email: ${process.env.FIREBASE_CLIENT_EMAIL}`);
        console.log(`   - Private Key: ${process.env.FIREBASE_PRIVATE_KEY ? '✅ Présent (' + process.env.FIREBASE_PRIVATE_KEY.length + ' caractères)' : '❌ Manquant'}`);
      }
      
      return admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation avec les variables d\'environnement:', error);
      return null;
    }
  }

  // Si aucune configuration n'est fournie, retourner null
  console.warn('⚠️ Configuration FCM incomplète. Variables requises:');
  console.warn('   - Option 1: FIREBASE_SERVICE_ACCOUNT_PATH (chemin vers fichier JSON)');
  console.warn('   - Option 2: FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY');
  return null;
};

// Initialiser Firebase (lazy loading)
let firebaseApp: admin.app.App | null = null;
let firebaseInitPromise: Promise<admin.app.App | null> | null = null;

const getFirebaseApp = async (): Promise<admin.app.App | null> => {
  if (firebaseApp) {
    return firebaseApp;
  }
  
  if (!firebaseInitPromise) {
    firebaseInitPromise = initializeFirebase();
  }
  
  firebaseApp = await firebaseInitPromise;
  return firebaseApp;
};

export interface PushNotificationPayload {
  title: string;
  body: string;
  sound?: string;
  badge?: number;
  data?: Record<string, any>;
  category?: string;
}

/**
 * Envoie une notification push à un utilisateur Android via FCM
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; sent: number; failed: number; errors?: any[] }> {
  const app = await getFirebaseApp();
  
  if (!app) {
    console.error('❌ Firebase Admin non initialisé');
    return { success: false, sent: 0, failed: 0, errors: ['Firebase Admin non initialisé'] };
  }

  try {
    // Récupérer tous les tokens Android de l'utilisateur
    const pushTokens = await prisma.pushToken.findMany({
      where: {
        userId: userId,
        platform: 'android'
      }
    });

    if (pushTokens.length === 0) {
      if (shouldLog('warn')) console.warn(`⚠️ Aucun token push Android trouvé pour l'utilisateur ${userId}`);
      return { success: true, sent: 0, failed: 0 };
    }

    if (shouldLog('info')) {
      console.log(`📱 Envoi de notification push à ${pushTokens.length} appareil(s) Android pour l'utilisateur ${userId}`);
    }

    // Convertir toutes les valeurs de data en strings (requis par FCM)
    const stringifyData = (obj: Record<string, any>): Record<string, string> => {
      const result: Record<string, string> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
          result[key] = '';
        } else if (typeof value === 'object') {
          result[key] = JSON.stringify(value);
        } else {
          result[key] = String(value);
        }
      }
      return result;
    };

    // Préparer le message FCM
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: stringifyData({
        ...(payload.data || {}),
        sound: payload.sound || 'default',
        ...(payload.badge && { badge: payload.badge.toString() }),
      }),
      android: {
        priority: 'high' as const,
        notification: {
          sound: payload.sound || 'default',
          channelId: 'default', // Canal de notification Android
          ...(payload.badge && { notificationCount: payload.badge }),
        },
      },
      tokens: pushTokens.map(pt => pt.token),
    };

    // Envoyer à tous les tokens
    const response = await admin.messaging().sendEachForMulticast(message);

    const sent = response.successCount;
    const failed = response.failureCount;

    if (failed > 0) {
      console.error(`❌ ${failed} notification(s) push échouée(s) pour l'utilisateur ${userId}`);
      
      // Supprimer les tokens invalides
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const token = pushTokens[idx].token;
          console.error(`   - Token: ${token.substring(0, 20)}..., Erreur: ${resp.error?.code} - ${resp.error?.message}`);
          
          // Si le token est invalide, le marquer pour suppression
          if (resp.error?.code === 'messaging/invalid-registration-token' ||
              resp.error?.code === 'messaging/registration-token-not-registered' ||
              resp.error?.code === 'messaging/invalid-argument') {
            invalidTokens.push(token);
          }
        }
      });

      // Supprimer les tokens invalides de la base de données
      if (invalidTokens.length > 0) {
        if (shouldLog('info')) {
          console.log(`   🗑️ Suppression de ${invalidTokens.length} token(s) invalide(s)`);
        }
        await prisma.pushToken.deleteMany({
          where: {
            token: { in: invalidTokens }
          }
        });
      }
    }

    if (sent > 0 && shouldLog('info')) {
      console.log(`✅ ${sent} notification(s) push envoyée(s) avec succès pour l'utilisateur ${userId}`);
    }

    return {
      success: sent > 0,
      sent,
      failed,
      errors: response.responses
        .filter((resp, idx) => !resp.success)
        .map((resp, idx) => ({ 
          token: pushTokens[idx].token.substring(0, 20) + '...', 
          error: resp.error?.message || 'Unknown error' 
        }))
    };
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi de notification push FCM:', error);
    return {
      success: false,
      sent: 0,
      failed: 0,
      errors: [error.message || 'Erreur inconnue']
    };
  }
}

/**
 * Envoie une notification push à plusieurs utilisateurs Android
 */
export async function sendPushNotificationsToUsers(
  userIds: string[],
  payload: PushNotificationPayload
): Promise<{ totalSent: number; totalFailed: number; results: Record<string, any> }> {
  const results: Record<string, any> = {};
  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, payload);
    results[userId] = result;
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { totalSent, totalFailed, results };
}

/**
 * Ferme la connexion Firebase (à appeler lors de l'arrêt de l'application)
 */
export function shutdownFirebaseApp(): void {
  if (firebaseApp) {
    admin.app().delete();
    firebaseApp = null;
    if (shouldLog('info')) console.log('🔌 Firebase Admin fermé');
  }
}
