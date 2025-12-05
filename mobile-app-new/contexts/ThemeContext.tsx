import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    tint: string;
    icon: string;
    tabIconDefault: string;
    tabIconSelected: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@productif_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  // Charger le thème depuis AsyncStorage au démarrage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
          setThemeState(savedTheme as Theme);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du thème:', error);
      } finally {
        setMounted(true);
      }
    };
    loadTheme();
  }, []);

  // Sauvegarder le thème dans AsyncStorage à chaque changement
  useEffect(() => {
    if (mounted) {
      AsyncStorage.setItem(THEME_STORAGE_KEY, theme).catch((error) => {
        console.error('Erreur lors de la sauvegarde du thème:', error);
      });
    }
  }, [theme, mounted]);

  // Calculer le thème actuel (en tenant compte du système si nécessaire)
  const actualTheme: 'light' | 'dark' = 
    theme === 'system' 
      ? (systemColorScheme ?? 'light')
      : theme;

  // Calculer les couleurs basées sur le thème actuel
  const colors = useMemo(() => {
    const themeColors = Colors[actualTheme];
    return {
      background: themeColors.background,
      surface: actualTheme === 'dark' ? '#1F2937' : '#FFFFFF',
      text: themeColors.text,
      textSecondary: actualTheme === 'dark' ? '#9CA3AF' : '#6B7280',
      border: actualTheme === 'dark' ? '#374151' : '#E5E7EB',
      primary: '#00C27A',
      tint: themeColors.tint,
      icon: themeColors.icon,
      tabIconDefault: themeColors.tabIconDefault,
      tabIconSelected: themeColors.tabIconSelected,
    };
  }, [actualTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}


