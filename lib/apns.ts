import apn from '@parse/node-apn';
import { prisma } from './prisma';

const LOG_LEVEL = (process.env.LOG_LEVEL || 'warn').toLowerCase();
const LOG_ORDER: Record<string, number> = { error: 0, warn: 1, success: 2, info: 3, debug: 4 };
const shouldLog = (level: string) => {
  if (LOG_LEVEL === 'silent') return false;
  const current = LOG_ORDER[LOG_LEVEL] ?? LOG_ORDER.warn;
  const incoming = LOG_ORDER[level] ?? LOG_ORDER.info;
  return incoming <= current;
};

// Configuration APNs depuis les variables d'environnement
const getApnProvider = () => {
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const bundleId = process.env.APNS_BUNDLE_ID || 'io.productif.app';
  const keyP8 = process.env.APNS_KEY_P8;

  if (!keyId || !teamId || !keyP8) {
    console.error('❌ Configuration APNs incomplète. Variables requises: APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY_P8');
    return null;
  }

  const options: apn.ProviderOptions = {
    token: {
      key: keyP8,
      keyId: keyId,
      teamId: teamId
    },
    production: process.env.NODE_ENV === 'production' || process.env.APNS_PRODUCTION === 'true'
  };

  return new apn.Provider(options);
};

let apnProvider: apn.Provider | null = null;

// Initialiser le provider APNs (lazy loading)
const getProvider = (): apn.Provider | null => {
  if (!apnProvider) {
    apnProvider = getApnProvider();
  }
  return apnProvider;
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
 * Envoie une notification push à un utilisateur iOS
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; sent: number; failed: number; errors?: any[] }> {
  const provider = getProvider();
  
  if (!provider) {
    console.error('❌ Provider APNs non initialisé');
    return { success: false, sent: 0, failed: 0, errors: ['Provider APNs non initialisé'] };
  }

  try {
    // Récupérer tous les tokens iOS de l'utilisateur
    const pushTokens = await prisma.pushToken.findMany({
      where: {
        userId: userId,
        platform: 'ios'
      }
    });

    if (pushTokens.length === 0) {
      if (shouldLog('warn')) console.warn(`⚠️ Aucun token push iOS trouvé pour l'utilisateur ${userId}`);
      return { success: true, sent: 0, failed: 0 };
    }

    if (shouldLog('info')) {
      console.log(`📱 Envoi de notification push à ${pushTokens.length} appareil(s) iOS pour l'utilisateur ${userId}`);
    }

    // Préparer la notification
    const notification = new apn.Notification();
    notification.alert = {
      title: payload.title,
      body: payload.body
    };
    notification.sound = payload.sound || 'default';
    notification.badge = payload.badge;
    notification.topic = process.env.APNS_BUNDLE_ID || 'io.productif.app';
    notification.payload = payload.data || {};
    
    if (payload.category) {
      notification.category = payload.category;
    }

    // Expiration (1 heure)
    notification.expiry = Math.floor(Date.now() / 1000) + 3600;
    
    // Priorité (10 = immédiat, 5 = économique)
    notification.priority = 10;

    // Envoyer à tous les tokens
    const tokens = pushTokens.map(pt => pt.token);
    const result = await provider.send(notification, tokens);

    const sent = result.sent.length;
    const failed = result.failed.length;

    if (failed > 0) {
      console.error(`❌ ${failed} notification(s) push échouée(s) pour l'utilisateur ${userId}`);
      result.failed.forEach((failure) => {
        console.error(`   - Token: ${failure.device}, Erreur: ${failure.error}`);
        
        // Si le token est invalide, le supprimer de la base
        if (failure.error && (
          failure.error === 'BadDeviceToken' ||
          failure.error === 'Unregistered' ||
          failure.error === 'DeviceTokenNotForTopic'
        )) {
          if (shouldLog('info')) {
            console.log(`   🗑️ Suppression du token invalide: ${failure.device}`);
          }
          prisma.pushToken.deleteMany({
            where: {
              token: failure.device
            }
          }).catch(err => {
            console.error(`   ❌ Erreur lors de la suppression du token:`, err);
          });
        }
      });
    }

    if (sent > 0 && shouldLog('info')) {
      console.log(`✅ ${sent} notification(s) push envoyée(s) avec succès pour l'utilisateur ${userId}`);
    }

    return {
      success: sent > 0,
      sent,
      failed,
      errors: result.failed.length > 0 ? result.failed.map(f => ({ token: f.device, error: f.error })) : undefined
    };
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi de notification push:', error);
    return {
      success: false,
      sent: 0,
      failed: 0,
      errors: [error.message || 'Erreur inconnue']
    };
  }
}

/**
 * Envoie une notification push à plusieurs utilisateurs
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
 * Ferme la connexion APNs (à appeler lors de l'arrêt de l'application)
 */
export function shutdownApnProvider(): void {
  if (apnProvider) {
    apnProvider.shutdown();
    apnProvider = null;
    if (shouldLog('info')) console.log('🔌 Provider APNs fermé');
  }
}
