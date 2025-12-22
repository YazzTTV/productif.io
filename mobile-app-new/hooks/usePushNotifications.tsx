import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { notificationService } from '@/src/services/notificationService';
import Constants from 'expo-constants';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: false,
        },
      });
      
      setPermissionStatus(status);
      
      if (status === 'granted') {
        // Obtenir le token maintenant que les permissions sont accordées
        try {
          let token: string | null = null;
          
          if (Platform.OS === 'ios') {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
            if (projectId) {
              token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            } else {
              const deviceToken = await Notifications.getDevicePushTokenAsync();
              token = deviceToken.data;
            }
          } else {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
            if (projectId) {
              token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            } else {
              const deviceToken = await Notifications.getDevicePushTokenAsync();
              token = deviceToken.data;
            }
          }
          
          if (token) {
            console.log('📱 Token push obtenu:', token);
            setExpoPushToken(token);
            registerTokenWithBackend(token);
            return true;
          }
        } catch (tokenError) {
          console.error('❌ Erreur lors de l\'obtention du token push:', tokenError);
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erreur lors de la demande de permissions:', error);
      return false;
    }
  };

  useEffect(() => {
    // Vérifier l'état actuel des permissions
    Notifications.getPermissionsAsync().then(({ status }) => {
      setPermissionStatus(status);
      
      if (status === 'granted') {
        registerForPushNotificationsAsync().then(token => {
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

    // Listener pour les notifications reçues pendant que l'app est ouverte
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification reçue:', notification);
      setNotification(notification);
    });

    // Listener pour les notifications sur lesquelles l'utilisateur a tapé
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapée:', response);
      // Ici tu peux naviguer vers une page spécifique selon le type de notification
      const data = response.notification.request.content.data;
      if (data?.notificationId) {
        // Navigation vers la notification spécifique si nécessaire
        console.log('Navigation vers notification:', data.notificationId);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
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
        // Pour une app native iOS, on doit utiliser le device token natif
        // Mais avec Expo, on peut utiliser getExpoPushTokenAsync qui retourne un token Expo
        // Si tu veux utiliser APNs directement, il faut utiliser getDevicePushTokenAsync
        // Pour l'instant, on utilise getExpoPushTokenAsync qui fonctionne avec Expo
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
        if (projectId) {
          token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        } else {
          // Fallback: utiliser getDevicePushTokenAsync pour iOS natif
          const deviceToken = await Notifications.getDevicePushTokenAsync();
          token = deviceToken.data;
        }
      } else {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
        if (projectId) {
          token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        } else {
          const deviceToken = await Notifications.getDevicePushTokenAsync();
          token = deviceToken.data;
        }
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

