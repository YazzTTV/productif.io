import apn from '@parse/node-apn';
import { prisma } from './prisma.js';

const LOG_LEVEL = (process.env.LOG_LEVEL || 'warn').toLowerCase();
const LOG_ORDER = { error: 0, warn: 1, success: 2, info: 3, debug: 4 };
const shouldLog = (level) => {
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
  
  // Support pour clé en base64 ou texte brut
  let keyP8 = process.env.APNS_KEY_P8;
  if (!keyP8 && process.env.APNS_KEY_BASE64) {
    // Décoder la clé base64
    try {
      keyP8 = Buffer.from(process.env.APNS_KEY_BASE64, 'base64').toString('utf-8');
      if (shouldLog('info')) console.log('✅ Clé APNs décodée depuis base64');
    } catch (error) {
      console.error('❌ Erreur lors du décodage de la clé APNs base64:', error);
      return null;
    }
  }

  if (!keyId || !teamId || !keyP8) {
    console.error('❌ Configuration APNs incomplète. Variables requises: APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY_P8 (ou APNS_KEY_BASE64)');
    return null;
  }

  const options = {
    token: {
      key: keyP8,
      keyId: keyId,
      teamId: teamId
    },
    production: process.env.NODE_ENV === 'production' || process.env.APNS_PRODUCTION === 'true'
  };

  return new apn.Provider(options);
};

let apnProvider = null;

// Initialiser le provider APNs (lazy loading)
const getProvider = () => {
  if (!apnProvider) {
    apnProvider = getApnProvider();
  }
  return apnProvider;
};

/**
 * Envoie une notification push à un utilisateur iOS
 */
export async function sendPushNotification(userId, payload) {
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
    if (shouldLog('debug')) {
      console.log(`📋 Détails du payload APNs:`, {
        title: payload.title,
        body: payload.body,
        data: payload.data,
        hasAction: !!payload.data?.action,
        hasMessage: !!payload.data?.message,
        messagePreview: payload.data?.message ? payload.data.message.substring(0, 100) : null
      });
    }

    // Préparer la notification
    const notification = new apn.Notification();
    
    // S'assurer que title et body sont bien définis
    const alertTitle = payload.title || 'Notification';
    const alertBody = payload.body || '';
    
    notification.alert = {
      title: alertTitle,
      body: alertBody
    };
    notification.sound = payload.sound || 'default';
    notification.badge = payload.badge;
    notification.topic = process.env.APNS_BUNDLE_ID || 'io.productif.app';
    
    // IMPORTANT: Pour Expo-notifications avec tokens APNs natifs,
    // les données doivent être dans une clé spécifique 'body' 
    // pour être mappées vers content.data, ou utiliser mutable-content
    notification.mutableContent = true; // Permet à iOS de modifier la notification
    notification.payload = {
      // Données au niveau racine (standard APNs)
      ...payload.data,
      // Également dans 'body' pour compatibilité Expo
      body: payload.data
    };
    
    if (shouldLog('debug')) {
      console.log(`📦 Notification APNs préparée:`, {
        alert: {
          title: notification.alert?.title || alertTitle,
          body: notification.alert?.body || alertBody
        },
        payload: notification.payload,
        topic: notification.topic,
        sound: notification.sound,
        badge: notification.badge
      });
    }
    
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
        // Log complet de l'objet failure pour debug
        console.error(`   - Token: ${failure.device || failure.token || 'N/A'}`);
        console.error(`   - Erreur: ${failure.error || failure.status || 'undefined'}`);
        console.error(`   - Objet failure complet:`, JSON.stringify(failure, null, 2));
        
        // Vérifier différentes propriétés possibles pour l'erreur
        const errorCode = failure.error || failure.status || failure.reason || failure.response?.reason;
        const errorMessage = failure.message || failure.response?.reason || 'Erreur inconnue';
        
        // Si le token est invalide, le supprimer de la base
        if (errorCode && (
          errorCode === 'BadDeviceToken' ||
          errorCode === 'Unregistered' ||
          errorCode === 'DeviceTokenNotForTopic' ||
          errorMessage.includes('BadDeviceToken') ||
          errorMessage.includes('Unregistered')
        )) {
          const tokenToDelete = failure.device || failure.token;
          if (tokenToDelete) {
            if (shouldLog('info')) {
              console.log(`   🗑️ Suppression du token invalide: ${tokenToDelete.substring(0, 20)}...`);
            }
            prisma.pushToken.deleteMany({
              where: {
                token: tokenToDelete
              }
            }).catch(err => {
              console.error(`   ❌ Erreur lors de la suppression du token:`, err);
            });
          }
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
  } catch (error) {
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
export async function sendPushNotificationsToUsers(userIds, payload) {
  const results = {};
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
export function shutdownApnProvider() {
  if (apnProvider) {
    apnProvider.shutdown();
    apnProvider = null;
    console.log('🔌 Provider APNs fermé');
  }
}
