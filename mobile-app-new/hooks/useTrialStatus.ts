import { useState, useEffect } from 'react';
import { authService } from '@/lib/api';

export interface TrialStatus {
  status: 'trial_active' | 'trial_expired' | 'subscribed' | 'cancelled';
  daysLeft?: number;
  hasAccess: boolean;
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
      // En cas d'erreur, considérer comme expiré pour bloquer l'accès
      setTrialStatus({
        status: 'trial_expired',
        hasAccess: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    trialStatus,
    isLoading,
    isLocked: trialStatus?.status === 'trial_expired' && !trialStatus?.hasAccess,
    refresh: checkTrialStatus,
  };
}

