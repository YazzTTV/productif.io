"use client"

import { motion } from 'framer-motion';

interface LanguageSelectionProps {
  onSelect: (language: 'fr' | 'en') => void;
  t: any;
}

const languages = [
  { code: 'en' as const, label: 'English', flag: '🇬🇧' },
  { code: 'fr' as const, label: 'Français', flag: '🇫🇷' },
];

export function LanguageSelection({ onSelect, t }: LanguageSelectionProps) {
  // Helper to get translation with fallback
  const getTranslation = (key: string, fallback: string) => {
    if (!t) return fallback;
    if (typeof t === 'function') {
      const translation = t(key);
      return translation && translation !== key ? translation : fallback;
    } else if (typeof t === 'object' && t[key]) {
      return t[key];
    }
    return fallback;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center space-y-3">
          <h1 className="tracking-tight text-3xl font-bold" style={{ letterSpacing: '-0.04em' }}>
            {getTranslation('chooseLanguage', 'Choisissez votre langue')}
          </h1>
          <p className="text-black/40 text-sm">{getTranslation('changeAnytime', 'Vous pouvez changer cela à tout moment.')}</p>
        </div>

        <div className="space-y-3">
          {languages.map((lang, index) => (
            <motion.button
              key={lang.code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(lang.code)}
              className="w-full p-6 rounded-3xl border border-black/10 hover:border-black/20 hover:bg-black/5 transition-all flex items-center gap-4"
            >
              <span className="text-4xl">{lang.flag}</span>
              <span className="text-xl tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                {lang.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}


