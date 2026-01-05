import { motion } from 'motion/react';
import { Language } from './translations';

interface LanguageSelectionProps {
  onSelect: (language: Language) => void;
  t: any;
}

const languages = [
  { code: 'en' as Language, label: 'English', flag: '🇬🇧' },
  { code: 'fr' as Language, label: 'Français', flag: '🇫🇷' },
  { code: 'es' as Language, label: 'Español', flag: '🇪🇸' },
];

export function LanguageSelection({ onSelect, t }: LanguageSelectionProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center space-y-3">
          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
            {t.chooseLanguage}
          </h1>
          <p className="text-black/40 text-sm">{t.changeAnytime}</p>
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
