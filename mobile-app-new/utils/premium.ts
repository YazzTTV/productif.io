import AsyncStorage from '@react-native-async-storage/async-storage';

const PREMIUM_KEY = 'premium_status';
const SELECTED_PLAN_KEY = 'selected_plan';

export interface PremiumStatus {
  isPremium: boolean;
  plan?: 'annual' | 'monthly' | 'free';
}

export async function checkPremiumStatus(): Promise<PremiumStatus> {
  try {
    const plan = await AsyncStorage.getItem(SELECTED_PLAN_KEY);
    const isPremium = plan === 'annual' || plan === 'monthly';
    
    return {
      isPremium,
      plan: (plan as 'annual' | 'monthly' | 'free') || 'free',
    };
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

