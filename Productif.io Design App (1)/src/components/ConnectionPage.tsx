import { motion } from 'motion/react';
import { Screen } from '../App';
import { Apple, Mail, ArrowRight, KeyRound } from 'lucide-react';
import { Language, useTranslation } from '../utils/translations';

interface ConnectionPageProps {
  onNavigate: (screen: Screen) => void;
  language?: Language;
}

export function ConnectionPage({ onNavigate, language = 'en' }: ConnectionPageProps) {
  const t = useTranslation(language);
  
  const handleSkip = () => {
    onNavigate('onboarding-1' as Screen);
  };

  const handleConnect = (provider: string) => {
    // In a real app, this would handle OAuth
    console.log(`Connecting with ${provider}`);
    
    // If it's the Login button, go to login page
    if (provider === 'Login') {
      onNavigate('login');
      return;
    }
    
    // Otherwise go to profile setup page after connecting
    onNavigate('profile-setup' as Screen);
  };

  return (
    <div className="min-h-[844px] bg-white px-8 py-16 flex flex-col justify-between">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
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

      <div className="flex-1 flex flex-col justify-center relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
            className="mb-6 relative inline-block"
          >
            <h1 className="text-5xl bg-gradient-to-r from-[#00C27A] to-[#00D68F] bg-clip-text text-transparent" style={{ fontWeight: 700 }}>
              Productif.io
            </h1>
            {/* Sparkles */}
            <motion.span
              className="absolute -top-2 -right-6 text-2xl"
              animate={{
                scale: [0, 1, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 0.3,
              }}
            >
              ✨
            </motion.span>
            <motion.span
              className="absolute -bottom-2 -left-6 text-2xl"
              animate={{
                scale: [0, 1, 0],
                rotate: [0, -180, -360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 0.3,
                delay: 1,
              }}
            >
              ✨
            </motion.span>
          </motion.div>
          
          <h1 className="text-gray-800 mb-2">
            {t('connectionTitle')}
          </h1>
          
          <p className="text-gray-600 mb-6">
            {t('connectionSubtitle')}
          </p>

          {/* Benefits */}
          <div className="flex flex-col gap-2 mb-4">
            {[
              { icon: '🤖', text: 'AI Assistant to guide you 24/7' },
              { icon: '🔥', text: 'Track habits & build streaks' },
              { icon: '📊', text: 'Advanced analytics & insights' },
              { icon: '🏆', text: 'Compete with friends' },
              { icon: '☁️', text: 'Sync across all devices' },
            ].map((benefit, index) => (
              <motion.div
                key={benefit.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-3 text-left bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-gray-100"
              >
                <span className="text-xl">{benefit.icon}</span>
                <span className="text-gray-700 text-sm">{benefit.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Create Account Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mb-6"
        >
          <div className="text-center mb-3">
            <p className="text-gray-800 font-medium">Join the Elite — Create Your Account</p>
            <p className="text-gray-500 text-sm">Free 7-day trial • No credit card required</p>
          </div>

          <div className="space-y-3">
            {/* Email - Primary CTA */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(0, 194, 122, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleConnect('Email')}
              className="w-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              <Mail size={20} className="relative z-10" />
              <span className="relative z-10">{t('continueWithEmail')}</span>
              <ArrowRight size={18} className="relative z-10" />
            </motion.button>

            {/* Apple */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleConnect('Apple')}
              className="w-full bg-black text-white py-4 rounded-2xl flex items-center justify-center gap-3 shadow-sm"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <span>{t('continueWithApple')}</span>
            </motion.button>

            {/* Google */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleConnect('Google')}
              className="w-full bg-white text-gray-800 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-sm border border-gray-200"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{t('continueWithGoogle')}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-gray-400 text-sm">{t('or')}</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </motion.div>

        {/* Sign In Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center"
        >
          <p className="text-gray-600 text-sm mb-3">Already have an account?</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleConnect('Login')}
            className="w-full bg-white text-[#00C27A] py-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm border-2 border-[#00C27A] font-medium"
          >
            <span>{t('logIn')}</span>
            <ArrowRight size={18} />
          </motion.button>
        </motion.div>

        {/* Skip Option */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          onClick={handleSkip}
          className="w-full text-gray-400 py-3 text-center hover:text-gray-600 mt-4 text-sm"
        >
          {t('skipForNow')}
        </motion.button>
      </div>
    </div>
  );
}