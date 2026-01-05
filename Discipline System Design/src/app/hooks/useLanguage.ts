import { create } from 'zustand';

export type Language = 'en' | 'fr' | 'es';

interface LanguageStore {
  language: Language;
  setLanguage: (language: Language) => void;
}

// Simple store without persistence for now
export const useLanguage = create<LanguageStore>((set) => ({
  language: 'en',
  setLanguage: (language) => set({ language }),
}));
