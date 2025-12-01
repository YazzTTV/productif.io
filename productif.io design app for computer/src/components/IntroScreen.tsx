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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center py-12 px-8">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-[#00C27A]/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Centered Content Container */}
      <div className="max-w-2xl w-full relative z-10">
        <div className="flex flex-col items-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="flex justify-center mb-12"
          >
            <div className="w-40 h-40 bg-white rounded-[40px] flex items-center justify-center shadow-2xl p-6">
              <img src={logoIcon} alt="Productif.io" className="w-full h-full object-contain" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-12"
          >
            <h1 className="text-gray-900 mb-8 text-6xl drop-shadow-sm leading-tight">
              {t('introTitle')}
            </h1>
            <p className="text-gray-700 text-2xl leading-relaxed max-w-xl mx-auto">
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
            className="w-full max-w-md bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-6 rounded-3xl transition-all duration-300 shadow-2xl flex items-center justify-center gap-3 relative overflow-hidden group"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <span className="relative text-2xl font-semibold">{t('letsGo')}</span>
            <ArrowRight className="relative" size={28} />
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="text-center text-lg text-gray-600 mt-8"
          >
            Takes less than 2 minutes
          </motion.p>
        </div>
      </div>
    </div>
  );
}
