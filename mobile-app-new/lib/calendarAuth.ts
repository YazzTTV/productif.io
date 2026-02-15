import { Platform, Alert } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { googleCalendarService, appleCalendarService } from './api';

// Import conditionnel d'expo-calendar pour éviter l'erreur au démarrage
let Calendar: typeof import('expo-calendar') | null = null;

async function getCalendarModule() {
  if (Platform.OS !== 'ios') {
    return null;
  }
  
  if (!Calendar) {
    try {
      Calendar = await import('expo-calendar');
    } catch (error) {
      console.warn('⚠️ [CalendarAuth] expo-calendar non disponible:', error);
      return null;
    }
  }
  
  return Calendar;
}

// Configuration pour Google Calendar
// iOS Client ID (OAuth client pour iOS)
const IOS_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || 
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 
  '738789952398-m6risp9hae6ao11n7s4178nig64largu.apps.googleusercontent.com';

// Android Client ID (OAuth client pour Android)
const ANDROID_CLIENT_ID = Constants.expoConfig?.extra?.googleAndroidClientId ||
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
  '738789952398-di4elcaboo4407v1ineqnap9tb9hjhp5.apps.googleusercontent.com';

// Web Client ID (celui du backend - utilisé pour vérifier l'idToken)
const GOOGLE_WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId ||
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

const CALENDAR_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar',
];

/**
 * Configure Google Sign-In avec les scopes Calendar
 */
export async function configureGoogleCalendar(): Promise<void> {
  try {
    if (!GOOGLE_WEB_CLIENT_ID) {
      throw new Error('Google Web Client ID not configured');
    }

    // Configuration Google Sign-In avec le Client ID natif selon la plateforme
    // iosClientId: Client ID natif (iOS ou Android) - la lib utilise ce nom pour les deux plateformes
    // webClientId: Client ID Web (pour générer le serverAuthCode)
    // IMPORTANT: Tous doivent être dans le même projet Google Cloud
    const nativeClientId = Platform.OS === 'ios' ? IOS_CLIENT_ID : ANDROID_CLIENT_ID;
    
    GoogleSignin.configure({
      iosClientId: nativeClientId, // Utilise le Client ID iOS sur iOS, Android sur Android
      webClientId: GOOGLE_WEB_CLIENT_ID,
      scopes: CALENDAR_SCOPES,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });

    console.log('✅ [CalendarAuth] Google Calendar configuré');
    console.log(`📱 [CalendarAuth] ${Platform.OS === 'ios' ? 'iOS' : 'Android'} Client ID:`, nativeClientId);
    console.log('🌐 [CalendarAuth] Web Client ID:', GOOGLE_WEB_CLIENT_ID);
  } catch (error) {
    console.error('❌ [CalendarAuth] Erreur configuration:', error);
    throw error;
  }
}

/**
 * Connecte Google Calendar via Google Sign-In natif
 * Retourne true si la connexion a réussi
 */
export async function connectGoogleCalendar(): Promise<boolean> {
  try {
    // Configurer Google Sign-In avec les scopes Calendar
    await configureGoogleCalendar();

    // Vérifier Play Services sur Android
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    // Lancer la connexion Google
    console.log('🔐 [CalendarAuth] Lancement connexion Google Calendar...');
    
    // Essayer de se déconnecter d'abord pour forcer la demande de nouveaux scopes
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      // Ignorer si l'utilisateur n'était pas connecté ou si signOut échoue
      console.log('ℹ️ [CalendarAuth] Pas de session active à déconnecter ou erreur signOut:', error);
    }
    
    // Lancer la connexion avec les nouveaux scopes Calendar
    const response = await GoogleSignin.signIn();
    
    // Récupérer le serverAuthCode
    // La réponse peut être soit directement l'objet, soit dans .data
    const userInfo = (response as any)?.data || response;
    const serverAuthCode = userInfo?.serverAuthCode;

    if (!serverAuthCode) {
      console.error('❌ [CalendarAuth] serverAuthCode manquant. Réponse:', JSON.stringify(userInfo, null, 2));
      throw new Error('Impossible d\'obtenir le code d\'autorisation Google. Assurez-vous que webClientId est correctement configuré.');
    }

    console.log('✅ [CalendarAuth] serverAuthCode obtenu');

    // Envoyer le code au backend pour échange contre les tokens
    const result = await googleCalendarService.connect(serverAuthCode);

    if (result.success) {
      console.log('✅ [CalendarAuth] Google Calendar connecté');
      return true;
    } else {
      throw new Error(result.message || 'Erreur de connexion');
    }
  } catch (error: any) {
    console.error('❌ [CalendarAuth] Erreur connexion Google Calendar:', error);
    
    // Ne pas afficher d'erreur si l'utilisateur a annulé
    if (error.code === 'SIGN_IN_CANCELLED' || error.code === '12500' || error.message?.includes('annulée') || error.message?.includes('cancelled')) {
      console.log('ℹ️ [CalendarAuth] Connexion annulée par l\'utilisateur');
      return false;
    }
    
    throw error;
  }
}

/**
 * Vérifie si Google Calendar est connecté
 */
export async function isGoogleCalendarConnected(): Promise<boolean> {
  try {
    const status = await googleCalendarService.getStatus();
    return status.connected && !status.isExpired;
  } catch {
    return false;
  }
}

/**
 * Demande l'accès à Apple Calendar via EventKit
 */
export async function connectAppleCalendar(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Calendar est uniquement disponible sur iOS');
  }

  try {
    const CalendarModule = await getCalendarModule();
    if (!CalendarModule) {
      Alert.alert(
        'Erreur',
        'Le module calendrier n\'est pas disponible. Veuillez reconstruire l\'application.',
        [{ text: 'OK' }]
      );
      return false;
    }

    console.log('🍎 [CalendarAuth] Demande accès Apple Calendar...');

    // Demander la permission d'accès au calendrier
    const { status } = await CalendarModule.requestCalendarPermissionsAsync();

    if (status !== 'granted') {
      console.log('❌ [CalendarAuth] Permission refusée');
      Alert.alert(
        'Permission requise',
        'Veuillez autoriser l\'accès au calendrier dans les réglages de votre iPhone.',
        [{ text: 'OK' }]
      );
      return false;
    }

    // Récupérer les calendriers disponibles
    const calendars = await CalendarModule.getCalendarsAsync(CalendarModule.EntityTypes.EVENT);
    const calendarIds = calendars
      .filter(cal => cal.allowsModifications)
      .map(cal => cal.id);

    console.log(`✅ [CalendarAuth] ${calendarIds.length} calendriers trouvés`);

    // Enregistrer sur le serveur
    const result = await appleCalendarService.connect(true, calendarIds);

    if (result.success) {
      console.log('✅ [CalendarAuth] Apple Calendar connecté');
      return true;
    } else {
      throw new Error(result.message || 'Erreur de connexion');
    }
  } catch (error: any) {
    console.error('❌ [CalendarAuth] Erreur connexion Apple Calendar:', error);
    throw error;
  }
}

/**
 * Vérifie si Apple Calendar est connecté
 */
export async function isAppleCalendarConnected(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }

  try {
    const status = await appleCalendarService.getStatus();
    return status.connected;
  } catch {
    return false;
  }
}

/**
 * Récupère les calendriers Apple disponibles
 */
export async function getAppleCalendars(): Promise<any[]> {
  if (Platform.OS !== 'ios') {
    return [];
  }

  try {
    const CalendarModule = await getCalendarModule();
    if (!CalendarModule) {
      return [];
    }

    const { status } = await CalendarModule.getCalendarPermissionsAsync();
    if (status !== 'granted') {
      return [];
    }

    return await CalendarModule.getCalendarsAsync(CalendarModule.EntityTypes.EVENT);
  } catch {
    return [];
  }
}

/**
 * Crée un événement dans le calendrier Apple
 */
export async function createAppleCalendarEvent(
  calendarId: string,
  title: string,
  startDate: Date,
  endDate: Date,
  notes?: string
): Promise<string | null> {
  if (Platform.OS !== 'ios') {
    return null;
  }

  try {
    const CalendarModule = await getCalendarModule();
    if (!CalendarModule) {
      return null;
    }

    const eventId = await CalendarModule.createEventAsync(calendarId, {
      title,
      startDate,
      endDate,
      notes,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    console.log('✅ [CalendarAuth] Événement créé:', eventId);
    return eventId;
  } catch (error) {
    console.error('❌ [CalendarAuth] Erreur création événement:', error);
    return null;
  }
}

