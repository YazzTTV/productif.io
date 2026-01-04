import { Platform, Alert } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

export interface AppleAuthResult {
  identityToken: string;
  user: {
    email: string | null;
    name: string | null;
    appleUserId: string; // sub (subject) - identifiant unique Apple
  };
}

/**
 * Vérifie si Apple Sign-In est disponible sur l'appareil
 */
export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }
  
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch (error) {
    console.error('❌ [AppleAuth] Erreur lors de la vérification de disponibilité:', error);
    return false;
  }
}

/**
 * Lance le flux d'authentification Apple avec la lib native
 * Méthode recommandée par Apple pour React Native
 */
export async function signInWithApple(): Promise<AppleAuthResult> {
  try {
    // Vérifier que Apple Sign-In est disponible
    const available = await isAppleSignInAvailable();
    if (!available) {
      const errorMsg = Platform.OS === 'ios' 
        ? "Apple Sign-In n'est pas disponible. Assurez-vous d'utiliser un build natif (npx expo run:ios)."
        : "Apple Sign-In n'est disponible que sur iOS.";
      
      console.error('❌ [AppleAuth]', errorMsg);
      Alert.alert(
        'Non disponible',
        errorMsg
      );
      throw new Error(errorMsg);
    }

    // Lancer la connexion Apple
    console.log('🍎 [AppleAuth] Lancement de la connexion Apple...');
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('identityToken manquant dans la réponse de Apple Sign-In');
    }

    // Extraire les informations utilisateur
    // IMPORTANT: email et fullName ne sont fournis qu'au PREMIER login
    // Ensuite, seul l'identityToken est disponible
    const email = credential.email || null;
    const name = credential.fullName
      ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim() || null
      : null;
    const appleUserId = credential.user; // C'est le 'sub' (subject) dans le token

    console.log('✅ [AppleAuth] Connexion Apple réussie');
    console.log('🍎 [AppleAuth] Apple User ID:', appleUserId);
    console.log('📧 [AppleAuth] Email:', email || 'Non fourni (pas le premier login)');
    console.log('👤 [AppleAuth] Name:', name || 'Non fourni (pas le premier login)');

    // Décoder le token pour vérifier l'audience (débogage)
    try {
      const tokenParts = credential.identityToken.split('.');
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
        
        console.log('🔍 [AppleAuth] Token payload (audience):', payload.aud);
        console.log('🔍 [AppleAuth] Token issuer:', payload.iss);
        console.log('🔍 [AppleAuth] Token subject:', payload.sub);
        console.log('🔍 [AppleAuth] Token email:', payload.email || 'Non présent');
      }
    } catch (decodeError) {
      console.warn('⚠️ [AppleAuth] Impossible de décoder le token pour vérification:', decodeError);
    }

    return {
      identityToken: credential.identityToken,
      user: {
        email,
        name,
        appleUserId,
      },
    };
  } catch (error: any) {
    console.error('❌ [AppleAuth] Erreur:', error);

    // Gérer les erreurs spécifiques d'Apple Sign-In
    if (error.code === 'ERR_CANCELED' || error.code === 'ERR_REQUEST_CANCELED') {
      throw new Error('Authentification annulée par l\'utilisateur');
    } else if (error.code === 'ERR_INVALID_RESPONSE') {
      throw new Error('Réponse invalide d\'Apple. Veuillez réessayer.');
    } else if (error.code === 'ERR_NOT_AVAILABLE') {
      throw new Error('Apple Sign-In n\'est pas disponible sur cet appareil.');
    } else {
      throw new Error(error.message || 'Une erreur est survenue lors de la connexion avec Apple');
    }
  }
}

/**
 * Déconnecter l'utilisateur Apple (si nécessaire)
 * Note: Apple Sign-In ne nécessite généralement pas de déconnexion explicite
 */
export async function signOutApple(): Promise<void> {
  try {
    // Apple Sign-In ne nécessite pas de déconnexion côté client
    // La déconnexion se fait en supprimant la session côté serveur
    console.log('✅ [AppleAuth] Déconnexion Apple (session supprimée côté serveur)');
  } catch (error) {
    console.error('❌ [AppleAuth] Erreur lors de la déconnexion:', error);
    throw error;
  }
}

