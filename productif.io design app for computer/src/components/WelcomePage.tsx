import { motion } from 'motion/react';
import { Screen } from '../App';
import logoImage from 'figma:asset/5e6ca94c36190e877b3f2f2ae5b2d32ffb6147c1.png';
import { Language, useTranslation } from '../utils/translations';

interface WelcomePageProps {
  onNavigate: (screen: Screen) => void;
  language?: Language;
}

export function WelcomePage({ onNavigate, language = 'en' }: WelcomePageProps) {
  const t = useTranslation(language);
  return (
    <div className="min-h-[844px] bg-gradient-to-b from-[#0a1525] via-[#1a2535] to-[#0a1525] flex flex-col items-center justify-center px-8 relative overflow-hidden">
      {/* Starry Background */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
        
        {/* Larger bright stars */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`bright-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          >
            <motion.div
              className="relative"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              <div className="w-1 h-1 bg-white rounded-full blur-sm" />
              <div className="absolute inset-0 w-1 h-1 bg-white rounded-full" />
            </motion.div>
          </motion.div>
        ))}
      </div>
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center relative z-10"
      >
        {/* Animated Logo with Glow Effect */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
          className="mb-8 relative"
        >
          {/* Glow effect behind logo */}
          <motion.div
            className="absolute inset-0 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              background: 'radial-gradient(circle, rgba(0, 214, 143, 0.4) 0%, transparent 70%)',
            }}
          />
          
          {/* Logo with floating animation */}
          <motion.div
            animate={{
              y: [0, -15, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <motion.img 
              src={logoImage} 
              alt="Productif.io Logo" 
              className="w-32 h-32 relative z-10 drop-shadow-2xl"
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
          
          {/* Sparkle effects */}
          <motion.div
            className="absolute -top-2 -right-2 text-2xl"
            animate={{
              scale: [0, 1, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
            }}
          >
            ✨
          </motion.div>
          <motion.div
            className="absolute -bottom-2 -left-2 text-2xl"
            animate={{
              scale: [0, 1, 0],
              rotate: [0, -180, -360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
              delay: 1,
            }}
          >
            ✨
          </motion.div>
        </motion.div>
        
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center text-white mb-3 bg-gradient-to-r from-[#00C27A] to-[#00D68F] bg-clip-text text-transparent"
          style={{ fontWeight: 700 }}
        >
          {t('welcomeTitle')}
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center text-gray-300 mb-16"
        >
          {t('welcomeSubtitle')}
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="w-full space-y-4"
        >
          <motion.button
            onClick={() => onNavigate('language')}
            whileHover={{ scale: 1.02, boxShadow: "0 10px 40px rgba(0, 214, 143, 0.4)" }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-4 px-8 rounded-full transition-all duration-300 shadow-lg relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <span className="relative z-10">{t('getStarted')}</span>
          </motion.button>
          
          <motion.button
            onClick={() => onNavigate('login')}
            whileHover={{ scale: 1.02, boxShadow: "0 5px 20px rgba(0, 214, 143, 0.2)" }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-white/10 backdrop-blur-sm border-2 border-[#00C27A] text-white py-4 px-8 rounded-full transition-all duration-300"
          >
            {t('logIn')}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}