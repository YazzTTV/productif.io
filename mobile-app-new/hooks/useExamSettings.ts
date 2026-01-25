import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXAM_SETTINGS_KEY = 'exam_settings';

export interface ExamSettings {
  examDuration: number;
  maxTasks: number;
  hardMode: boolean;
  breaksEnabled: boolean;
}

const DEFAULT_SETTINGS: ExamSettings = {
  examDuration: 45,
  maxTasks: 3,
  hardMode: true,
  breaksEnabled: false,
};

export function useExamSettings() {
  const [settings, setSettings] = useState<ExamSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem(EXAM_SETTINGS_KEY);
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        // Merge with defaults to ensure all properties exist
        const mergedSettings: ExamSettings = {
          ...DEFAULT_SETTINGS,
          ...parsedSettings,
        };
        setSettings(mergedSettings);
      }
    } catch (error) {
      console.error('Error loading exam settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<ExamSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await AsyncStorage.setItem(EXAM_SETTINGS_KEY, JSON.stringify(updatedSettings));
      setSettings(updatedSettings);
      return true;
    } catch (error) {
      console.error('Error saving exam settings:', error);
      return false;
    }
  };

  const resetSettings = async () => {
    try {
      await AsyncStorage.removeItem(EXAM_SETTINGS_KEY);
      setSettings(DEFAULT_SETTINGS);
      return true;
    } catch (error) {
      console.error('Error resetting exam settings:', error);
      return false;
    }
  };

  return {
    settings,
    loading,
    saveSettings,
    resetSettings,
    loadSettings,
  };
}