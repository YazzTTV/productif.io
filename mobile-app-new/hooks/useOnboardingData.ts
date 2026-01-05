import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onboardingService, authService } from '@/lib/api';

const ONBOARDING_STORAGE_KEY = 'onboarding_responses';

export interface OnboardingResponses {
  // Langue
  language?: string;
  
  // Identité
  firstName?: string;
  studentType?: string;
  
  // Objectifs & Pression
  goals?: string[];
  pressureLevel?: number;
  
  // Contexte académique
  currentSituation?: string;
  
  // Difficultés quotidiennes
  dailyStruggles?: string[];
  
  // Style de travail
  mentalLoad?: number;
  focusQuality?: number;
  satisfaction?: number;
  overthinkTasks?: boolean;
  shouldDoMore?: boolean;
  
  // Intentions
  wantToChange?: string[];
  timeHorizon?: string;
  
  // Tâches & Journée idéale
  rawTasks?: string;
  clarifiedTasks?: any[];
  idealDay?: any;
  
  // Ancien questionnaire (compatibilité)
  diagBehavior?: string;
  timeFeeling?: string;
  phoneHabit?: string;
  mainGoal?: string;
  
  // Métadonnées
  currentStep?: number;
  completed?: boolean;
}

export function useOnboardingData() {
  const [responses, setResponses] = useState<OnboardingResponses>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Charger les données depuis AsyncStorage au démarrage
  useEffect(() => {
    loadResponses();
  }, []);

  const loadResponses = async () => {
    try {
      const stored = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setResponses(parsed);
        console.log('📥 [OnboardingData] Données chargées depuis AsyncStorage');
      }
    } catch (error) {
      console.error('❌ [OnboardingData] Erreur chargement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sauvegarder localement dans AsyncStorage
  const saveToLocal = async (updates: Partial<OnboardingResponses>) => {
    try {
      const updated = { ...responses, ...updates };
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(updated));
      setResponses(updated);
      console.log('💾 [OnboardingData] Sauvegardé localement:', Object.keys(updates));
      return updated;
    } catch (error) {
      console.error('❌ [OnboardingData] Erreur sauvegarde locale:', error);
      throw error;
    }
  };

  // Synchroniser avec le backend si l'utilisateur est authentifié
  const syncToBackend = async (data: OnboardingResponses) => {
    try {
      const user = await authService.checkAuth();
      if (!user?.id) {
        console.log('ℹ️ [OnboardingData] Utilisateur non authentifié, pas de sync backend');
        return;
      }

      setIsSaving(true);
      await onboardingService.saveOnboardingData(data);
      console.log('✅ [OnboardingData] Synchronisé avec le backend');
    } catch (error: any) {
      console.error('❌ [OnboardingData] Erreur sync backend:', error?.message);
      // Ne pas bloquer si la sync échoue, les données sont déjà en local
    } finally {
      setIsSaving(false);
    }
  };

  // Sauvegarder les réponses (local + backend si authentifié)
  const saveResponses = useCallback(async (updates: Partial<OnboardingResponses>) => {
    try {
      const updated = await saveToLocal(updates);
      // Synchroniser avec le backend en arrière-plan
      syncToBackend(updated).catch(() => {
        // Erreur déjà loggée dans syncToBackend
      });
      return updated;
    } catch (error) {
      console.error('❌ [OnboardingData] Erreur sauvegarde:', error);
      throw error;
    }
  }, [responses]);

  // Sauvegarder une réponse spécifique
  const saveResponse = useCallback(async <K extends keyof OnboardingResponses>(
    key: K,
    value: OnboardingResponses[K]
  ) => {
    return await saveResponses({ [key]: value });
  }, [saveResponses]);

  // Récupérer une réponse spécifique
  const getResponse = useCallback(<K extends keyof OnboardingResponses>(
    key: K
  ): OnboardingResponses[K] | undefined => {
    return responses[key];
  }, [responses]);

  // Réinitialiser toutes les réponses
  const clearResponses = async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
      setResponses({});
      console.log('🗑️ [OnboardingData] Réponses réinitialisées');
    } catch (error) {
      console.error('❌ [OnboardingData] Erreur réinitialisation:', error);
    }
  };

  // Forcer la synchronisation avec le backend
  const forceSync = async () => {
    await syncToBackend(responses);
  };

  return {
    responses,
    isLoading,
    isSaving,
    saveResponses,
    saveResponse,
    getResponse,
    clearResponses,
    forceSync,
  };
}

