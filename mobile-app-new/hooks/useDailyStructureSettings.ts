import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAILY_STRUCTURE_KEY = '@daily_structure_settings';

export interface DailyStructureSettings {
  focusDuration: 25 | 45 | 60 | 90;
  maxSessions: number;
  workloadIntensity: 'light' | 'balanced' | 'intensive';
}

const DEFAULT_SETTINGS: DailyStructureSettings = {
  focusDuration: 45,
  maxSessions: 6,
  workloadIntensity: 'balanced',
};

export function useDailyStructureSettings() {
  const [settings, setSettings] = useState<DailyStructureSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les paramètres au démarrage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(DAILY_STRUCTURE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        console.log('📥 [DailyStructure] Paramètres chargés:', parsed);
      }
    } catch (error) {
      console.error('❌ [DailyStructure] Erreur chargement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<DailyStructureSettings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      await AsyncStorage.setItem(DAILY_STRUCTURE_KEY, JSON.stringify(updated));
      setSettings(updated);
      console.log('💾 [DailyStructure] Paramètres sauvegardés:', updated);
    } catch (error) {
      console.error('❌ [DailyStructure] Erreur sauvegarde:', error);
    }
  };

  return {
    settings,
    isLoading,
    saveSettings,
  };
}
