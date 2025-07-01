"use client"

import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Storage } from '@capacitor/storage';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface CacheConfig {
  enabled: boolean;
  duration: number; // durée en minutes
}

const defaultCacheConfig: CacheConfig = {
  enabled: true,
  duration: 5 // 5 minutes par défaut
};

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
  cacheConfig: CacheConfig = defaultCacheConfig
) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null
  });

  const cacheKey = `api_cache_${apiCall.toString()}`;

  const fetchData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Vérifier le cache si activé
      if (cacheConfig.enabled) {
        const cachedData = await getCachedData();
        if (cachedData) {
          setState({
            data: cachedData,
            loading: false,
            error: null
          });
          return;
        }
      }

      // Appel API
      const result = await apiCall();

      // Mettre en cache si activé
      if (cacheConfig.enabled) {
        await cacheData(result);
      }

      setState({
        data: result,
        loading: false,
        error: null
      });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error as Error
      });
    }
  };

  const getCachedData = async (): Promise<T | null> => {
    try {
      const { value } = await Storage.get({ key: cacheKey });
      if (!value) return null;

      const cached = JSON.parse(value);
      const now = new Date().getTime();

      if (now - cached.timestamp > cacheConfig.duration * 60 * 1000) {
        await Storage.remove({ key: cacheKey });
        return null;
      }

      return cached.data;
    } catch {
      return null;
    }
  };

  const cacheData = async (data: T) => {
    const cacheData = {
      data,
      timestamp: new Date().getTime()
    };
    await Storage.set({
      key: cacheKey,
      value: JSON.stringify(cacheData)
    });
  };

  const refresh = () => {
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  return {
    ...state,
    refresh
  };
}

// Hooks spécifiques pour chaque type de données
export function useTasks() {
  return useApi(apiService.getTasks);
}

export function useProjects() {
  return useApi(apiService.getProjects);
}

export function useHabits() {
  return useApi(apiService.getHabits);
}

export function useTimeEntries(startDate?: string, endDate?: string) {
  return useApi(() => apiService.getTimeEntries(startDate, endDate), [startDate, endDate]);
}

export function useMissions(year?: number, quarter?: number) {
  return useApi(() => apiService.getMissions(year, quarter), [year, quarter]);
}

export function useObjectives(missionId: string) {
  return useApi(() => apiService.getObjectives(missionId), [missionId]);
}

export function useUserStats() {
  return useApi(apiService.getUserStats, [], {
    enabled: true,
    duration: 30 // Cache de 30 minutes pour les stats
  });
}

export function useHabitStats(habitId: string) {
  return useApi(() => apiService.getHabitStats(habitId), [habitId], {
    enabled: true,
    duration: 60 // Cache d'une heure pour les stats d'habitudes
  });
}

export function useAchievements() {
  return useApi(apiService.getAchievements);
}

export function useStreak() {
  return useApi(apiService.getStreak);
} 