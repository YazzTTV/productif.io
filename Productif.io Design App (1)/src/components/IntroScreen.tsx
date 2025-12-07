import { motion } from 'motion/react';
import { Screen } from '../App';
import { Language, useTranslation } from '../utils/translations';
import { ArrowRight, Sparkles } from 'lucide-react';
import logoIcon from 'figma:asset/5e6ca94c36190e877b3f2f2ae5b2d32ffb6147c1.png';

interface IntroScreenProps {
  onNavigate: (screen: Screen) => void;
  language?: Language;
}

export function IntroScreen({ onNavigate, language = 'en' }: IntroScreenProps) {
  const t = useTranslation(language);
  return (
    <div className="min-h-[844px] bg-white px-8 py-16 flex flex-col justify-center items-center">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-[#00C27A]/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="flex flex-col items-center relative z-10">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl p-3">
            <img src={logoIcon} alt="Productif.io" className="w-full h-full object-contain" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-8"
        >
          <h1 className="text-gray-800 mb-4">
            {t('introTitle')}
          </h1>
          <p className="text-gray-600">
            Struggling with focus, procrastination, and scattered habits? Let's fix that together.
          </p>
        </motion.div>

      {/* CTA Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        onClick={() => onNavigate('language' as Screen)}
        whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0, 194, 122, 0.3)" }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-5 rounded-2xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2 relative overflow-hidden group"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <span className="relative text-lg">{t('letsGo')}</span>
        <ArrowRight className="relative" size={20} />
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="text-center text-sm text-gray-400 mt-4"
      >
        Takes less than 2 minutes
      </motion.p>
      </div>
    </div>
  );
}