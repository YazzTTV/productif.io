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

export async function setPremiumStatus(plan: 'annual' | 'monthly' | 'free'): Promise<void> {
  try {
    await AsyncStorage.setItem(SELECTED_PLAN_KEY, plan);
    await AsyncStorage.setItem(PREMIUM_KEY, plan !== 'free' ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting premium status:', error);
  }
}

