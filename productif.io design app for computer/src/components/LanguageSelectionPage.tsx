import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../App';
import { Check, Globe } from 'lucide-react';
import { Language, useTranslation } from '../utils/translations';

interface LanguageSelectionPageProps {
  onNavigate: (screen: Screen) => void;
  onLanguageSelect: (language: Language) => void;
}

export function LanguageSelectionPage({ onNavigate, onLanguageSelect }: LanguageSelectionPageProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const t = useTranslation(selectedLanguage);

  const languages = [
    { code: 'en' as Language, name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'fr' as Language, name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  ];

  const handleContinue = () => {
    // Save the selected language
    onLanguageSelect(selectedLanguage);
    // Navigate to connection page
    onNavigate('connection');
  };

  return (
    <div className="min-h-[844px] bg-gradient-to-br from-white to-gray-50 px-6 py-16 flex flex-col relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 text-center"
        >
          {/* Globe Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
            className="mb-6 flex justify-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-full flex items-center justify-center shadow-lg">
              <Globe size={40} className="text-white" />
            </div>
          </motion.div>

          <h1 className="text-gray-800 mb-3">{t('chooseLanguage')}</h1>
          <p className="text-gray-600">{t('selectPreferredLanguage')}</p>
        </motion.div>

        {/* Language List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 overflow-y-auto mb-6"
        >
          <div className="space-y-3">
            {languages.map((language, index) => (
              <motion.button
                key={language.code}
                onClick={() => setSelectedLanguage(language.code)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between ${
                  selectedLanguage === language.code
                    ? 'border-[#00C27A] bg-gradient-to-br from-[#00C27A]/10 to-[#00D68F]/5 shadow-md'
                    : 'border-gray-200 bg-white hover:border-[#00C27A]/30 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{language.flag}</span>
                  <div className="text-left">
                    <p className="text-gray-800">{language.name}</p>
                    <p className="text-sm text-gray-500">{language.nativeName}</p>
                  </div>
                </div>

                {/* Check Icon */}
                <AnimatePresence>
                  {selectedLanguage === language.code && (
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 90 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="w-7 h-7 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-full flex items-center justify-center"
                    >
                      <Check size={16} className="text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.button
            onClick={handleContinue}
            whileHover={{ scale: 1.02, boxShadow: "0 10px 40px rgba(0, 194, 122, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            disabled={!selectedLanguage}
            className="w-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-4 rounded-full shadow-lg relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <span className="relative z-10 flex items-center justify-center gap-2">
              {t('continue')}
              <span className="text-xl">→</span>
            </span>
          </motion.button>

          {/* Language Info */}
          <p className="text-center text-gray-400 text-xs mt-4">
            {t('changeLanguageLater')}
          </p>
        </motion.div>
      </div>
    </div>
  );
}