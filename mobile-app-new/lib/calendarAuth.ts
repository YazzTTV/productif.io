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
const GOOGLE_WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId ||
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

const CALENDAR_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

/**
 * Configure Google Sign-In avec les scopes Calendar
 */
export async function configureGoogleCalendar(): Promise<void> {
  try {
    if (!GOOGLE_WEB_CLIENT_ID) {
      throw new Error('Google Web Client ID not configured');
    }

    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      scopes: CALENDAR_SCOPES,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });

    console.log('✅ [CalendarAuth] Google Calendar configuré');
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
    
    // Si l'utilisateur est déjà connecté, on peut avoir besoin de re-demander les scopes
    const isSignedIn = await GoogleSignin.isSignedIn();
    
    let response;
    if (isSignedIn) {
      // Essayer de récupérer les tokens actuels
      try {
        const tokens = await GoogleSignin.getTokens();
        if (tokens.accessToken) {
          // Vérifier si les scopes calendar sont inclus
          // Si non, on doit se reconnecter
          await GoogleSignin.signOut();
        }
      } catch {
        // Ignorer et continuer avec signIn
      }
    }
    
    response = await GoogleSignin.signIn();
    
    // Récupérer le serverAuthCode
    const userInfo = (response as any).data || response;
    const serverAuthCode = userInfo.serverAuthCode;

    if (!serverAuthCode) {
      console.error('❌ [CalendarAuth] serverAuthCode manquant');
      throw new Error('Impossible d\'obtenir le code d\'autorisation Google');
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
    if (error.code === 'SIGN_IN_CANCELLED' || error.message?.includes('annulée')) {
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

