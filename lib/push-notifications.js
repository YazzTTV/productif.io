// Version JS pour compatibilité avec NotificationService.js
import { sendPushNotification as sendIOSPush } from './apns.js';
import { sendPushNotification as sendAndroidPush } from './fcm.js';

/**
 * Envoie une notification push à un utilisateur sur toutes ses plateformes (iOS et Android)
 */
export async function sendPushNotification(userId, payload) {
  // Envoyer aux deux plateformes en parallèle
  const [iosResult, androidResult] = await Promise.all([
    sendIOSPush(userId, payload).catch(err => {
      console.error('❌ Erreur iOS push:', err);
      return { success: false, sent: 0, failed: 0, errors: [err.message] };
    }),
    sendAndroidPush(userId, payload).catch(err => {
      console.error('❌ Erreur Android push:', err);
      return { success: false, sent: 0, failed: 0, errors: [err.message] };
    })
  ]);

  const totalSent = iosResult.sent + androidResult.sent;
  const totalFailed = iosResult.failed + androidResult.failed;
  const allErrors = [
    ...(iosResult.errors || []),
    ...(androidResult.errors || [])
  ];

  return {
    success: totalSent > 0,
    sent: totalSent,
    failed: totalFailed,
    errors: allErrors.length > 0 ? allErrors : undefined
  };
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
