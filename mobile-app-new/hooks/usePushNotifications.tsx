import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { notificationService } from '@/src/services/notificationService';
import { requestPushPermissionAndRegisterToken } from '@/lib/pushPermission';
import { trackBackendProductEvent } from '@/lib/productEvents';
import Constants from 'expo-constants';
import { router } from 'expo-router';

// Import dynamique pour éviter les crashs si les modules natifs ne sont pas disponibles
let Notifications: typeof import('expo-notifications') | null = null;
let isNotificationsAvailable = false;

try {
  Notifications = require('expo-notifications');
  isNotificationsAvailable = true;
  
  // Configuration des notifications
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (error) {
  console.warn('⚠️ [PushNotifications] Module natif expo-notifications non disponible. Les notifications push nécessitent un build natif.');
}

type UsePushNotificationsOptions = {
  enableResponseHandling?: boolean;
};

export function usePushNotifications(options: UsePushNotificationsOptions = {}) {
  const { enableResponseHandling = true } = options;
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const notificationListener = useRef<any | null>(null);
  const responseListener = useRef<any | null>(null);
  const isMountedRef = useRef(true);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handledResponseKeysRef = useRef<Set<string>>(new Set());

  const requestPermissions = async (): Promise<boolean> => {
    // Toute la logique vit desormais dans lib/pushPermission.ts, y compris le
    // choix du device token APNs natif. Elle etait dupliquee ici ET dans
    // registerForPushNotificationsAsync plus bas, et les deux copies avaient
    // diverge : c'est cette divergence qui a produit le BadDeviceToken constate
    // en production le 15 septembre 2026. Un seul endroit desormais.
    const { outcome, token, registered } = await requestPushPermissionAndRegisterToken();

    if (!isMountedRef.current) return outcome === 'granted' && registered;

    if (outcome === 'granted') {
      // Le statut passe a `granted` dans tous les cas : la permission EST
      // accordee cote systeme. Mais la valeur de retour ne vaut `true` que si le
      // token est reellement arrive au backend, car c'est elle qui fait ecrire
      // "notifications activees" cote serveur et afficher "vous recevrez
      // maintenant les notifications push" a l'utilisateur. Le backend envoie en
      // APNs direct : sans token enregistre, cette promesse serait fausse.
      setPermissionStatus('granted');
      if (token) setExpoPushToken(token);
      return registered;
    }

    if (outcome === 'denied') setPermissionStatus('denied');
    return false;
  };

  useEffect(() => {
    // Si le module n'est pas disponible, ne rien faire
    if (!Notifications || !isNotificationsAvailable) {
      console.log('ℹ️ [PushNotifications] Module non disponible, useEffect ignoré');
      return;
    }
    
    const clearLastNotificationResponse = async () => {
      try {
        const notificationsAny = Notifications as any;
        if (notificationsAny?.clearLastNotificationResponseAsync) {
          await notificationsAny.clearLastNotificationResponseAsync();
        }
      } catch (error) {
        console.error('❌ Erreur clearLastNotificationResponseAsync:', error);
      }
    };

    // Fonction partagée pour gérer un tap sur notification
    const handleNotificationResponse = (response: any) => {
      console.log('👆 Notification tapée - Réponse complète:', JSON.stringify(response, null, 2));
      const requestIdentifier = response?.notification?.request?.identifier || 'unknown';
      const actionIdentifier = response?.actionIdentifier || 'default';
      const responseKey = `${requestIdentifier}:${actionIdentifier}`;
      if (handledResponseKeysRef.current.has(responseKey)) {
        console.log('ℹ️ Notification déjà traitée, skip:', responseKey);
        return;
      }
      handledResponseKeysRef.current.add(responseKey);
      
      // Chercher les données dans plusieurs endroits possibles (APNs natif vs Expo)
      const content = response.notification.request.content;
      const trigger = response.notification.request.trigger as any;
      
      // Sources de données possibles
      const data1: any = (content as any).data;
      const data2: any = (content as any)?.data;
      const data3: any = (response.notification as any)?.data;
      const data4: any = (response as any)?.data;
      const data5: any = (response.notification.request as any)?.data;
      // APNs natif: les données peuvent être dans trigger.payload
      const data6: any = trigger?.payload;
      // Les données peuvent être dans trigger.payload.body (structure Expo)
      const data7: any = trigger?.payload?.body;
      // Les données peuvent aussi être directement dans le trigger
      const data8: any = trigger?.remoteMessage?.data || trigger?.data;
      // Dernière option: chercher dans content sans .data
      const data9: any = content && typeof content === 'object' && !(content as any).data ? (content as any) : null;
      
      // Utiliser la première source de données non-null avec action
      let data: any = null;
      const sources = [data1, data2, data3, data4, data5, data6, data7, data8, data9];
      for (const source of sources) {
        if (source && typeof source === 'object' && source.action) {
          data = source;
          break;
        }
      }
      // Fallback: première source non-null
      if (!data) {
        data = sources.find(s => s && typeof s === 'object' && Object.keys(s).length > 0);
      }

      const tryParseJson = (value: any) => {
        if (typeof value !== 'string') return value;
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      };

      const tryNestedAction = (value: any) => {
        const parsed = tryParseJson(value);
        if (parsed && typeof parsed === 'object' && (parsed as any).action) return parsed;
        return null;
      };

      if (data && typeof data === 'object' && !data.action) {
        const nestedCandidates = [
          data.body,
          data.data,
          data.payload,
          (content as any)?.data?.body,
          (trigger as any)?.payload?.body,
        ];
        for (const candidate of nestedCandidates) {
          const nested = tryNestedAction(candidate);
          if (nested) {
            data = nested;
            break;
          }
        }
      }
      
      console.log('📦 Données de notification extraites:', {
        hasData: !!data,
        hasAction: !!data?.action,
        hasMessage: !!data?.message,
      });

      const rawType = data?.type || data?.notificationType || data?.scenario || data?.event || data?.kind;
      const normalizedType = typeof rawType === 'string' ? rawType.toUpperCase() : undefined;
      const checkInTypeFromNotification =
        data?.checkInType ||
        (normalizedType === 'STRESS_CHECK_PREMIUM' || normalizedType === 'STRESS_CHECK'
          ? 'stress'
          : normalizedType === 'MOOD_CHECK_PREMIUM' || normalizedType === 'MOOD_CHECK'
            ? 'mood'
            : normalizedType === 'FOCUS_CHECK_PREMIUM' || normalizedType === 'FOCUS_CHECK'
              ? 'focus'
              : undefined);
      // Rappels locaux du planning de revisions (lib/studyPlanSync.ts) : on
      // ouvre l'accueil, qui affiche les blocs du jour.
      if (data?.action === 'open_study_block') {
        void trackBackendProductEvent('study_reminder_opened', {
          kind: typeof data.kind === 'string' ? data.kind : null,
          task_id: typeof data.taskId === 'string' ? data.taskId : null,
        });
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
        }
        navigationTimeoutRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          try {
            router.push('/(tabs)' as any);
            void clearLastNotificationResponse();
          } catch (navError) {
            console.error('❌ Erreur de navigation vers l\'accueil:', navError);
          }
        }, 500);
        return;
      }

      const shouldOpenFocus =
        data?.action === 'open_focus' ||
        normalizedType === 'MORNING_ANCHOR';
      const shouldOpenAnalytics =
        data?.action === 'open_analytics' ||
        normalizedType === 'STRESS_CHECK_PREMIUM' ||
        normalizedType === 'MOOD_CHECK_PREMIUM' ||
        normalizedType === 'FOCUS_CHECK_PREMIUM' ||
        normalizedType === 'STRESS_CHECK' ||
        normalizedType === 'MOOD_CHECK' ||
        normalizedType === 'FOCUS_CHECK';
      const shouldOpenJournal =
        data?.action === 'open_journal' ||
        normalizedType === 'JOURNAL_PROMPT';
      const shouldOpenDayNote =
        data?.action === 'open_day_note' ||
        normalizedType === 'DAY_NOTE' ||
        normalizedType === 'DAY_NOTE_PROMPT';

      // Navigation vers Focus pour MORNING_ANCHOR
      if (shouldOpenFocus) {
        console.log('✅ Conditions remplies - Navigation vers Focus', {
          type: data.type || normalizedType,
        });

        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
        }
        navigationTimeoutRef.current = setTimeout(() => {
          if (!isMountedRef.current) {
            console.log('⚠️ Composant démonté, navigation annulée');
            return;
          }
          try {
            console.log('🚀 Navigation vers /focus');
            router.push('/focus' as any);
            void clearLastNotificationResponse();
            console.log('✅ Navigation vers Focus déclenchée avec succès');
          } catch (navError) {
            console.error('❌ Erreur de navigation vers Focus:', navError);
          }
        }, 500);

        return;
      }

      // Navigation vers la saisie dédiée pour les notifications mood/stress/focus
      if (shouldOpenAnalytics && checkInTypeFromNotification) {
        console.log('✅ Conditions remplies - Navigation vers Analytics', {
          type: data.type || normalizedType,
          checkInType: checkInTypeFromNotification,
        });
        
        // Délai pour s'assurer que l'app et le router sont prêts (cold start)
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
        }
        navigationTimeoutRef.current = setTimeout(() => {
          if (!isMountedRef.current) {
            console.log('⚠️ Composant démonté, navigation annulée');
            return;
          }
          try {
            console.log('🚀 Navigation vers /check-in');
            router.push({ pathname: '/check-in', params: { kind: checkInTypeFromNotification } } as any);
            void clearLastNotificationResponse();
            console.log('✅ Navigation vers Analytics déclenchée avec succès');
          } catch (navError) {
            console.error('❌ Erreur de navigation vers Analytics:', navError);
          }
        }, 500);
        
        return;
      }

      // Saisie courte de la note de journée (habitude, distincte du journal libre)
      if (shouldOpenDayNote) {
        if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          try {
            router.push({ pathname: '/check-in', params: { kind: 'day' } } as any);
            void clearLastNotificationResponse();
          } catch (navError) {
            console.error('❌ Erreur de navigation vers note de journée:', navError);
          }
        }, 500);
        return;
      }

      // Navigation vers le journal quotidien
      if (shouldOpenJournal) {
        console.log('✅ Conditions remplies - Navigation vers Daily Journal', {
          type: data.type || normalizedType,
        });

        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
        }
        navigationTimeoutRef.current = setTimeout(() => {
          if (!isMountedRef.current) {
            console.log('⚠️ Composant démonté, navigation annulée');
            return;
          }
          try {
            console.log('🚀 Navigation vers /daily-journal');
            router.push('/daily-journal' as any);
            void clearLastNotificationResponse();
            console.log('✅ Navigation vers Daily Journal déclenchée avec succès');
          } catch (navError) {
            console.error('❌ Erreur de navigation vers Daily Journal:', navError);
          }
        }, 500);

        return;
      }

      // Nouveau flux : ouvrir l'assistant IA (onglet assistant) avec le message complet
      if (data?.action === 'open_assistant' && data?.message) {
        console.log('✅ Conditions remplies - Navigation vers assistant IA', {
          type: data.type,
          hasMessage: !!data.message,
          messagePreview: typeof data.message === 'string' ? data.message.slice(0, 80) : undefined,
        });
        
        const presetValue = String(data.message);
        
        // Délai pour s'assurer que l'app et le router sont prêts (cold start)
        // Nettoyer tout timeout précédent
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
        }
        navigationTimeoutRef.current = setTimeout(() => {
          // Vérifier si le composant est toujours monté
          if (!isMountedRef.current) {
            console.log('⚠️ Composant démonté, navigation annulée');
            return;
          }
          try {
            console.log('🚀 Navigation vers /(tabs)/assistant avec preset');
            // Utiliser push pour conserver un retour propre vers le dashboard
            router.push({
              pathname: '/(tabs)/assistant',
              params: { preset: presetValue },
            } as any);
            void clearLastNotificationResponse();
            console.log('✅ Navigation déclenchée avec succès');
          } catch (navError) {
            console.error('❌ Erreur de navigation vers /(tabs)/assistant:', navError);
          }
        }, 500); // Délai de 500ms pour laisser l'app s'initialiser
        
        return;
      }

      // Log si les conditions ne sont pas remplies (pour débogage)
      if (!data?.action) {
        console.warn('⚠️ Pas d\'action dans les données de notification:', data);
      } else if (data.action !== 'open_assistant') {
        console.warn('⚠️ Action différente de "open_assistant":', data.action);
      } else if (!data?.message) {
        console.warn('⚠️ Action "open_assistant" mais pas de message:', data);
      }

      // Fallback : comportement existant (logs + éventuellement navigation future)
      if (data?.notificationId) {
        console.log('📋 Navigation vers notification (fallback):', data.notificationId, data);
      }
    };

    // Vérifier l'état actuel des permissions
    Notifications.getPermissionsAsync().then(({ status }) => {
      if (!isMountedRef.current) return;
      setPermissionStatus(status);
      
      if (status === 'granted') {
        registerForPushNotificationsAsync().then(token => {
          if (!isMountedRef.current) return;
          if (token) {
            setExpoPushToken(token);
            registerTokenWithBackend(token);
          }
        });
      } else if (status === 'undetermined') {
        // Si les permissions n'ont jamais été demandées, on ne les demande PAS automatiquement
        // L'utilisateur devra les activer via la page des notifications
        console.log('ℹ️ Permissions de notification non demandées. L\'utilisateur peut les activer dans les paramètres.');
      } else {
        console.log('⚠️ Permissions de notification refusées:', status);
      }
    });

    if (enableResponseHandling) {
      // Listener pour les notifications reçues pendant que l'app est ouverte
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        if (!isMountedRef.current) return;
        console.log('📱 Notification reçue:', notification);
        setNotification(notification);
      });

      // Listener pour les notifications sur lesquelles l'utilisateur a tapé
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse
      );

      // Gérer aussi le cas où l'app est lancée à partir d'une notification déjà tapée (cold start)
      (async () => {
        try {
          const lastResponse = await Notifications.getLastNotificationResponseAsync();
          if (lastResponse) {
            console.log('📥 Dernière réponse de notification au démarrage:', lastResponse);
            handleNotificationResponse(lastResponse);
            await clearLastNotificationResponse();
          }
        } catch (error) {
          console.error('❌ Erreur lors de la récupération de la dernière notification:', error);
        }
      })();
    }

    return () => {
      // Marquer comme démonté pour éviter les mises à jour d'état
      isMountedRef.current = false;
      
      // Nettoyer le timeout de navigation
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
      
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const registerTokenWithBackend = async (token: string) => {
    console.log('🚀 [PushNotifications] registerTokenWithBackend appelé avec token:', token.substring(0, 20) + '...');
    try {
      const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
      console.log(`📤 [PushNotifications] Enregistrement du token push:`, {
        token: token.substring(0, 20) + '...',
        platform,
        fullToken: token,
        endpoint: `/notifications/push-token`
      });
      
      console.log('📡 [PushNotifications] Appel de notificationService.registerPushToken...');
      const result = await notificationService.registerPushToken(token, platform);
      console.log('📥 [PushNotifications] Réponse reçue:', result);
      
      if (result.success) {
        console.log('✅ [PushNotifications] Token push enregistré avec succès sur le backend');
      } else {
        console.error('❌ [PushNotifications] Erreur lors de l\'enregistrement du token push:', result);
      }
    } catch (error) {
      console.error('❌ [PushNotifications] Erreur lors de l\'enregistrement du token push:', error);
      if (error instanceof Error) {
        console.error('   Message:', error.message);
        console.error('   Stack:', error.stack);
      }
      // Afficher l'erreur complète pour le diagnostic
      console.error('   Erreur complète:', JSON.stringify(error, null, 2));
    }
  };

  return {
    expoPushToken,
    notification,
    permissionStatus,
    requestPermissions,
  };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00C27A',
    });
  }

  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('⚠️ Permission de notification refusée');
      return null;
    }
    
    try {
      // Pour iOS natif, on utilise getDevicePushTokenAsync au lieu de getExpoPushTokenAsync
      // car on envoie directement via APNs
      if (Platform.OS === 'ios') {
        // Meme regle que dans requestPermissions : device token APNs natif.
        // Le commentaire precedent disait deja qu'il fallait getDevicePushTokenAsync
        // pour APNs direct, et le code faisait l'inverse.
        const deviceToken = await Notifications.getDevicePushTokenAsync();
        token = deviceToken.data;
      } else {
        // Pour Android, utiliser getDevicePushTokenAsync() pour obtenir le token FCM natif
        // Cela permet d'envoyer directement via FCM depuis le backend sans passer par Expo Push Notification Service
        const deviceToken = await Notifications.getDevicePushTokenAsync();
        token = deviceToken.data;
        console.log('📱 [Android] Token FCM natif obtenu:', token.substring(0, 20) + '...');
      }
      
      console.log('📱 Token push obtenu:', token);
    } catch (error) {
      console.error('❌ Erreur lors de l\'obtention du token push:', error);
    }
  } else {
    console.warn('⚠️ Les notifications push ne fonctionnent que sur un appareil physique');
  }

  return token;
}
