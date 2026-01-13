import { useState, useEffect } from 'react';
import { authService, PlanLimits } from '@/lib/api';

export interface TrialStatus {
  status: 'trial_active' | 'trial_expired' | 'subscribed' | 'cancelled' | 'freemium';
  daysLeft?: number;
  hasAccess: boolean;
  plan?: string;
  planLimits?: PlanLimits;
  isPremium?: boolean;
}

export function useTrialStatus() {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkTrialStatus();
  }, []);

  const checkTrialStatus = async () => {
    try {
      setIsLoading(true);
      const status = await authService.getTrialStatus();
      setTrialStatus(status);
    } catch (error) {
      console.error('❌ [TRIAL] Erreur lors de la vérification du statut:', error);
      setTrialStatus({
        status: 'freemium',
        hasAccess: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    trialStatus,
    isLoading,
    isLocked: trialStatus ? !trialStatus.hasAccess : false,
    refresh: checkTrialStatus,
  };
}
