import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';

// Import dynamique pour éviter les crashs en Expo Go
// Ces modules nécessitent un build natif (expo-crypto)
let AuthSession: typeof import('expo-auth-session') | null = null;
let WebBrowser: typeof import('expo-web-browser') | null = null;

// Fonction pour charger les modules de manière sécurisée
function loadAuthModules() {
  if (AuthSession && WebBrowser) {
    return true; // Déjà chargés
  }

  try {
    // Vérifier d'abord si on est en Expo Go en testant expo-crypto
    // Si expo-crypto n'est pas disponible, on est en Expo Go
    require('expo-crypto');
    
    // Si on arrive ici, expo-crypto est disponible, on peut charger les autres modules
    AuthSession = require('expo-auth-session');
    WebBrowser = require('expo-web-browser');
    
    // Compléter l'authentification dans le navigateur
    WebBrowser?.maybeCompleteAuthSession();
    return true;
  } catch (error) {
    // En Expo Go, expo-crypto n'est pas disponible
    console.warn('⚠️ [GoogleAuth] Modules natifs non disponibles (Expo Go détecté)');
    return false;
  }
}

// Configuration Google OAuth - Utiliser le Client ID iOS
const GOOGLE_CLIENT_ID_IOS = Constants.expoConfig?.extra?.googleClientId || 
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 
  '738789952398-m6risp9hae6ao11n7s4178nig64largu.apps.googleusercontent.com';

// Le Reversed Client ID pour le schéma de redirection iOS
const REVERSED_CLIENT_ID = `com.googleusercontent.apps.${GOOGLE_CLIENT_ID_IOS.split('.')[0]}`;

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// Scopes pour l'authentification et Google Calendar
const scopes = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar',
];

export interface GoogleAuthResult {
  accessToken: string;
  idToken: string;
  user: {
    email: string;
    name: string;
    picture?: string;
  };
}

/**
 * Lance le flux d'authentification Google
 */
export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  // Charger les modules de manière sécurisée
  if (!loadAuthModules()) {
    const errorMsg = 'Google Auth nécessite un build natif (npx expo run:ios). Non disponible en Expo Go.';
    console.error('❌ [GoogleAuth]', errorMsg);
    Alert.alert(
      'Build natif requis',
      'La connexion Google nécessite un build natif. Veuillez utiliser:\n\nnpx expo run:ios\n\nou\n\nnpx expo run:android',
      [{ text: 'OK' }]
    );
    throw new Error(errorMsg);
  }

  // Vérifier que les modules sont bien chargés
  if (!AuthSession || !WebBrowser) {
    throw new Error('Impossible de charger les modules d\'authentification');
  }

  try {
    // Pour iOS natif, utiliser le Reversed Client ID comme schéma de redirection
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: REVERSED_CLIENT_ID,
      path: 'oauth2redirect/google',
    });

    console.log('🔐 [GoogleAuth] Redirect URI:', redirectUri);
    console.log('🔐 [GoogleAuth] Client ID:', GOOGLE_CLIENT_ID_IOS);

    // Créer la requête d'authentification avec Authorization Code flow (plus sûr pour mobile)
    const request = new AuthSession.AuthRequest({
      clientId: GOOGLE_CLIENT_ID_IOS,
      scopes,
      responseType: AuthSession.ResponseType.Code,
      redirectUri,
      additionalParameters: {},
      usePKCE: true, // Utiliser PKCE pour la sécurité
    });

    // Lancer le navigateur pour l'authentification
    const result = await request.promptAsync(discovery, {
      showInRecents: true,
    });

    console.log('🔐 [GoogleAuth] Résultat:', result.type);

    if (result.type === 'success') {
      const { code } = result.params;

      if (!code) {
        throw new Error('Code d\'autorisation manquant dans la réponse');
      }

      // Échanger le code contre un access token via notre backend
      const tokenResponse = await fetch('https://www.productif.io/api/auth/google/exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Échec de l\'échange du code');
      }

      const tokenData = await tokenResponse.json();

      if (!tokenData.accessToken) {
        throw new Error('Access token manquant dans la réponse du serveur');
      }

      // Récupérer les informations utilisateur depuis Google
      const userInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.accessToken}`
      );

      if (!userInfoResponse.ok) {
        throw new Error('Impossible de récupérer les informations utilisateur');
      }

      const userInfo = await userInfoResponse.json();

      return {
        accessToken: tokenData.accessToken,
        idToken: tokenData.idToken || '',
        user: {
          email: userInfo.email,
          name: userInfo.name || userInfo.email,
          picture: userInfo.picture,
        },
      };
    } else if (result.type === 'cancel') {
      throw new Error('Authentification annulée par l\'utilisateur');
    } else {
      throw new Error(`Erreur d'authentification: ${result.type}`);
    }
  } catch (error) {
    console.error('❌ [GoogleAuth] Erreur:', error);
    throw error;
  }
}

