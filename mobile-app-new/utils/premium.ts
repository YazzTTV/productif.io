import { authService } from '@/lib/api';

export interface PremiumStatus {
  isPremium: boolean;
  plan?: 'annual' | 'monthly' | 'free';
}

export async function checkPremiumStatus(): Promise<PremiumStatus> {
  try {
    // Récupérer le statut depuis l'API (source de vérité)
    const user = await authService.checkAuth();

    if (user) {
      return {
        isPremium: user.isPremium || false,
        plan: user.plan === 'premium' ? 'annual' : 'free', // Simplification, on pourrait récupérer le type exact
      };
    }

    // Si l'utilisateur n'est pas authentifié, retourner le statut par défaut
    // Ne pas essayer trial-status car cela nécessite aussi une authentification
    console.log('ℹ️ Utilisateur non authentifié, statut par défaut: free');
    return { isPremium: false, plan: 'free' };
  } catch (error) {
    console.error('Error checking premium status:', error);
    return { isPremium: false, plan: 'free' };
  }
}

/**
 * Accès au Mode Examen, déterminé par le serveur.
 *
 * Fail-closed : toute incertitude (non authentifié, réseau HS, réponse
 * dégradée, exception) refuse l'accès. Ne jamais dériver ce droit de la
 * présence d'une session examen en stockage local, qui est falsifiable.
 */
export async function hasExamModeAccess(): Promise<boolean> {
  try {
    const user = await authService.checkAuth();
    if (!user) return false;
    if (user.planLimits) {
      return user.planLimits.examModeEnabled === true;
    }
    // planLimits absent (réponse dégradée) : on retombe sur le statut premium.
    return user.isPremium === true;
  } catch (error) {
    console.error('Error checking exam mode access:', error);
    return false;
  }
}

export async function setPremiumStatus(plan: 'annual' | 'monthly' | 'free'): Promise<void> {
  try {
    await AsyncStorage.setItem(SELECTED_PLAN_KEY, plan);
    await AsyncStorage.setItem(PREMIUM_KEY, plan !== 'free' ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting premium status:', error);
  }
}

