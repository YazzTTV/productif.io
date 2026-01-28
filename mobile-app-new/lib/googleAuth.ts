import Constants from 'expo-constants';
import { Alert, Platform, InteractionManager } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Configuration Google OAuth
// iOS Client ID (OAuth client pour iOS)
const IOS_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || 
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 
  '738789952398-m6risp9hae6ao11n7s4178nig64largu.apps.googleusercontent.com';

// Android Client ID (OAuth client pour Android)
const ANDROID_CLIENT_ID = Constants.expoConfig?.extra?.googleAndroidClientId ||
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
  '738789952398-di4elcaboo4407v1ineqnap9tb9hjhp5.apps.googleusercontent.com';

// Web Client ID (celui du backend - utilisé pour vérifier l'idToken)
// IMPORTANT: Doit être dans le même projet Google Cloud que les autres Client IDs (738789952398)
// C'est le même que GOOGLE_CLIENT_ID dans les variables d'environnement du backend
const WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId ||
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 
  null; // Doit être défini dans app.json ou variables d'environnement

// Configurer Google Sign-In une seule fois au démarrage
let isConfigured = false;

function configureGoogleSignIn() {
  if (isConfigured) {
    return;
  }

  try {
    // Vérifier que WEB_CLIENT_ID est défini
    if (!WEB_CLIENT_ID) {
      throw new Error('WEB_CLIENT_ID non défini. Configurez googleWebClientId dans app.json ou EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
    }
    
    // Configuration Google Sign-In selon la plateforme
    // iosClientId: Client ID natif (iOS ou Android) - la lib utilise ce nom pour les deux plateformes
    // webClientId: Client ID Web (pour générer l'idToken avec la bonne audience) - OBLIGATOIRE
    // IMPORTANT: Tous doivent être dans le même projet Google Cloud (738789952398)
    const nativeClientId = Platform.OS === 'ios' ? IOS_CLIENT_ID : ANDROID_CLIENT_ID;
    
    GoogleSignin.configure({
      iosClientId: nativeClientId, // Utilise le Client ID iOS sur iOS, Android sur Android
      webClientId: WEB_CLIENT_ID, // Doit être dans le même projet que les autres Client IDs
      offlineAccess: true, // Activer pour obtenir un idToken
      forceCodeForRefreshToken: false,
    });

    isConfigured = true;
    console.log('✅ [GoogleAuth] Google Sign-In configuré avec succès');
    console.log('📱 [GoogleAuth] Plateforme:', Platform.OS);
    console.log(`📱 [GoogleAuth] ${Platform.OS === 'ios' ? 'iOS' : 'Android'} Client ID:`, nativeClientId);
    console.log('🌐 [GoogleAuth] Web Client ID:', WEB_CLIENT_ID);
    
    // Vérifier que tous les IDs sont dans le même projet
    const nativeProjectId = nativeClientId.split('-')[0];
    const webProjectId = WEB_CLIENT_ID.split('-')[0];
    if (nativeProjectId !== webProjectId) {
      console.error('❌ [GoogleAuth] ERREUR: Les Client IDs ne sont pas dans le même projet!');
      console.error(`❌ [GoogleAuth] ${Platform.OS === 'ios' ? 'iOS' : 'Android'} Project ID:`, nativeProjectId);
      console.error('❌ [GoogleAuth] Web Project ID:', webProjectId);
      console.error('❌ [GoogleAuth] Tous les Client IDs doivent être dans le même projet (738789952398)');
    } else {
      console.log(`✅ [GoogleAuth] Tous les Client IDs sont dans le même projet:`, nativeProjectId);
    }
  } catch (error) {
    console.error('❌ [GoogleAuth] Erreur lors de la configuration:', error);
    throw error;
  }
}

export interface GoogleAuthResult {
  idToken: string;
  user: {
    email: string;
    name: string;
    picture?: string;
  };
}

/**
 * Attendre que l'application soit stable après le retour d'une activité native
 * Utile pour éviter les erreurs "Unable to find viewState" sur Android
 */
async function waitForAppStable(): Promise<void> {
  return new Promise((resolve) => {
    // Utiliser InteractionManager pour attendre que toutes les interactions soient terminées
    InteractionManager.runAfterInteractions(() => {
      // Attendre un peu plus pour que React Native se stabilise complètement
      setTimeout(() => {
        resolve();
      }, 500);
    });
  });
}

/**
 * Lance le flux d'authentification Google avec la lib native
 * Méthode recommandée par Google pour React Native
 */
export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  try {
    // Configurer Google Sign-In si pas déjà fait
    configureGoogleSignIn();

    // Vérifier si Google Play Services est disponible (Android uniquement)
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    // Lancer la connexion
    console.log('🔐 [GoogleAuth] Lancement de la connexion Google...');
    const response = await GoogleSignin.signIn();
    
    // Sur Android, attendre que l'app soit stable après le retour de l'activité native
    if (Platform.OS === 'android') {
      await waitForAppStable();
    }

    // Logs de débogage
    console.log('🔍 [GoogleAuth] Réponse complète:', JSON.stringify(response, null, 2));
    
    // La nouvelle version de la lib retourne { type: 'success', data: { idToken, user, ... } }
    // L'ancienne version retournait directement { idToken, user, ... }
    const userInfo = (response as any).data || response;
    
    console.log('🔍 [GoogleAuth] idToken présent:', !!userInfo.idToken);
    console.log('🔍 [GoogleAuth] serverAuthCode présent:', !!userInfo.serverAuthCode);
    console.log('🔍 [GoogleAuth] user:', userInfo.user);

    let idToken = userInfo.idToken;
    
    if (!idToken) {
      // Essayer de récupérer l'idToken depuis getTokens si disponible
      try {
        const tokens = await GoogleSignin.getTokens();
        console.log('🔍 [GoogleAuth] Tokens récupérés:', !!tokens.idToken);
        if (tokens.idToken) {
          idToken = tokens.idToken;
        }
      } catch (tokenError) {
        console.error('❌ [GoogleAuth] Erreur lors de la récupération des tokens:', tokenError);
      }
    }

    if (!idToken) {
      throw new Error('idToken manquant dans la réponse de Google Sign-In. Vérifiez que webClientId est correctement configuré.');
    }

    // Vérifier l'audience du token (débogage)
    try {
      const tokenParts = idToken.split('.');
      if (tokenParts.length === 3) {
        // Décoder le payload base64 (React Native compatible)
        const base64Url = tokenParts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        
        console.log('🔍 [GoogleAuth] Token payload (audience):', payload.aud);
        console.log('🔍 [GoogleAuth] Token issuer:', payload.iss);
        console.log('🔍 [GoogleAuth] Token email:', payload.email);
        
        // Vérifier que l'audience correspond au WEB_CLIENT_ID
        if (payload.aud !== WEB_CLIENT_ID) {
          console.warn('⚠️ [GoogleAuth] Audience mismatch!');
          console.warn('⚠️ [GoogleAuth] Token aud:', payload.aud);
          console.warn('⚠️ [GoogleAuth] Expected WEB_CLIENT_ID:', WEB_CLIENT_ID);
        } else {
          console.log('✅ [GoogleAuth] Audience vérifiée:', payload.aud);
        }
      }
    } catch (decodeError) {
      console.warn('⚠️ [GoogleAuth] Impossible de décoder le token pour vérification:', decodeError);
    }

    console.log('✅ [GoogleAuth] Connexion Google réussie');
    console.log('📧 [GoogleAuth] Email:', userInfo.user?.email);

    if (!userInfo.user || !userInfo.user.email) {
      throw new Error('Informations utilisateur manquantes dans la réponse de Google Sign-In');
    }

    return {
      idToken: idToken,
      user: {
        email: userInfo.user.email,
        name: userInfo.user.name || userInfo.user.givenName || userInfo.user.email,
        picture: userInfo.user.photo || undefined,
      },
    };
  } catch (error: any) {
    console.error('❌ [GoogleAuth] Erreur:', error);

    // Gérer les erreurs spécifiques de Google Sign-In
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Authentification annulée par l\'utilisateur');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Une authentification est déjà en cours');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services non disponible. Veuillez installer ou mettre à jour Google Play Services.');
    } else {
      throw new Error(error.message || 'Une erreur est survenue lors de la connexion avec Google');
    }
  }
}

/**
 * Déconnecter l'utilisateur Google
 */
export async function signOutGoogle(): Promise<void> {
  try {
    await GoogleSignin.signOut();
    console.log('✅ [GoogleAuth] Déconnexion Google réussie');
  } catch (error) {
    console.error('❌ [GoogleAuth] Erreur lors de la déconnexion:', error);
    throw error;
  }
}

/**
 * Vérifier si l'utilisateur est déjà connecté à Google
 */
export async function isSignedInGoogle(): Promise<boolean> {
  try {
    return await GoogleSignin.isSignedIn();
  } catch (error) {
    console.error('❌ [GoogleAuth] Erreur lors de la vérification:', error);
    return false;
  }
}

/**
 * Récupérer l'utilisateur Google actuellement connecté
 */
export async function getCurrentGoogleUser(): Promise<GoogleAuthResult | null> {
  try {
    const isSignedIn = await GoogleSignin.isSignedIn();
    if (!isSignedIn) {
      return null;
    }

    const userInfo = await GoogleSignin.getCurrentUser();
    if (!userInfo || !userInfo.idToken) {
      return null;
    }

    return {
      idToken: userInfo.idToken,
      user: {
        email: userInfo.user.email,
        name: userInfo.user.name || userInfo.user.email,
        picture: userInfo.user.photo || undefined,
      },
    };
  } catch (error) {
    console.error('❌ [GoogleAuth] Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
}
