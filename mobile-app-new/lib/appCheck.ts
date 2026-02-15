import { Platform } from 'react-native';

let appCheckInitialized = false;

/**
 * Initialise Firebase App Check (Étape 4 + 5 du plan)
 * DOIT être appelé AVANT tout appel à Google Sign-In
 *
 * - iOS: App Attest (prod) ou Debug (dev)
 * - Android: Play Integrity (prod) ou Debug (dev)
 *
 * En dev: utilise le provider "debug" → le token s'affiche dans les logs
 * → à ajouter dans Firebase Console > App Check > Manage debug tokens
 */
export async function initAppCheck(): Promise<void> {
  if (appCheckInitialized) {
    console.log('ℹ️ [AppCheck] Déjà initialisé');
    return;
  }

  try {
    // 1. Firebase App EN PREMIER (obligatoire)
    await import('@react-native-firebase/app');

    // 2. App Check avec ReactNativeFirebaseAppCheckProvider
    const appCheckModule = await import('@react-native-firebase/app-check');
    const appCheckFn = appCheckModule.default;

    if (!appCheckFn || typeof appCheckFn !== 'function') {
      throw new Error('Module App Check non disponible - rebuild nécessaire');
    }

    const appCheck = appCheckFn();

    // 3. Créer le provider et configurer (Étape 5: debug en dev)
    const rnfbProvider = appCheck.newReactNativeFirebaseAppCheckProvider();
    rnfbProvider.configure({
      apple: {
        provider: __DEV__ ? 'debug' : 'appAttest',
        debugToken: __DEV__ ? process.env.EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN : undefined,
      },
      android: {
        provider: __DEV__ ? 'debug' : 'playIntegrity',
        debugToken: __DEV__ ? process.env.EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN : undefined,
      },
      isTokenAutoRefreshEnabled: true,
    });

    // 4. Initialiser App Check (doit être fait avant tout service Firebase protégé)
    await appCheck.initializeAppCheck({ provider: rnfbProvider });

    appCheckInitialized = true;

    // 5. En mode DEBUG : appeler getToken() pour déclencher l'affichage du debug token (logs natifs Xcode)
    if (__DEV__) {
      appCheck.getToken(true).catch(() => {});
      console.log(
        '✅ [AppCheck] Initialisé (mode DEBUG). Pour voir le debug token: lance depuis Xcode avec l\'argument -FIRDebugEnabled (Product > Scheme > Edit Scheme > Run > Arguments)'
      );
    } else {
      console.log('✅ [AppCheck] Initialisé avec succès');
    }
  } catch (error: any) {
    if (__DEV__) {
      console.warn('⚠️ [AppCheck] Mode DEV - continuant sans App Check:', error?.message || error);
      appCheckInitialized = true;
    } else {
      console.error('❌ [AppCheck] Erreur:', error);
      throw error;
    }
  }
}

/**
 * Vérifie si App Check est initialisé
 */
export function isAppCheckInitialized(): boolean {
  return appCheckInitialized;
}

/**
 * Récupère un token App Check (utile pour les requêtes API backend)
 */
export async function getAppCheckToken(): Promise<string | null> {
  if (!appCheckInitialized) {
    console.warn('⚠️ [AppCheck] Tentative de récupération de token avant initialisation');
    return null;
  }

  try {
    const appCheck = await import('@react-native-firebase/app-check');
    const { token } = await appCheck.default().getToken(true);
    return token;
  } catch (error) {
    console.error('❌ [AppCheck] Erreur lors de la récupération du token:', error);
    return null;
  }
}
