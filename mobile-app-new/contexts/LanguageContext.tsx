import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language, TranslationKey } from '@/constants/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey | string, params?: Record<string, string | number>, fallback?: string) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = '@productif_language';

export function LanguageProvider({ children, initialLanguage = 'fr' }: { children: ReactNode, initialLanguage?: Language }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const [isLoading, setIsLoading] = useState(true);

  // Charger la langue depuis AsyncStorage au démarrage
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'en' || savedLanguage === 'es')) {
          setLanguageState(savedLanguage as Language);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la langue:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLanguage();
  }, []);

  // Sauvegarder la langue dans AsyncStorage à chaque changement
  const setLanguage = useCallback(async (newLanguage: Language) => {
    setLanguageState(newLanguage);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la langue:', error);
    }
  }, []);

  // Fonction de traduction avec support des paramètres
  const t = useCallback((key: TranslationKey | string, params?: Record<string, string | number>, fallback?: string): string => {
    const safeKey = key as TranslationKey;
    let text = translations[language]?.[safeKey] || translations.en?.[safeKey] || fallback || key as string;
    
    // Remplacer les paramètres {param} par leurs valeurs
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(`{${paramKey}}`, String(value));
      });
    }
    
    return text;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // Retourner des valeurs par défaut pour éviter les erreurs
    console.warn('useLanguage called outside LanguageProvider, using defaults');
    return {
      language: 'fr',
      setLanguage: () => {},
      t: (key: TranslationKey | string, _params?: Record<string, string | number>, fallback?: string) => (fallback || (key as string)),
      isLoading: false,
    };
  }
  return context;
}

// Export des types pour utilisation externe
export type { Language, TranslationKey };
