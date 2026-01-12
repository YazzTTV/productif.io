"use client"

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface WelcomeProps {
  onStart: () => void;
  onLogin: () => void;
  t: any;
}

export function Welcome({ onStart, onLogin, t }: WelcomeProps) {
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
        className="max-w-md w-full space-y-16"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex justify-center"
        >
          <Image 
            src="/icon-new.png" 
            alt="Productif.io" 
            width={96}
            height={96}
            className="w-24 h-24"
          />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4 text-center"
        >
          <h1
            className="tracking-tight text-3xl font-bold"
            style={{ letterSpacing: '-0.04em' }}
          >
            {getTranslation('welcomeTitle', 'Vous travaillez dur. Mais sans système.')}
          </h1>
          <p className="text-black/60">{getTranslation('welcomeSubtitle', 'Productif.io aide les étudiants à transformer leurs efforts en résultats — sans épuisement.')}</p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <Button
            onClick={onStart}
            className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 text-lg"
          >
            {getTranslation('getStarted', 'Continuer')}
          </Button>

          <button
            onClick={onLogin}
            className="w-full text-black/60 hover:text-black transition-colors text-sm"
          >
            {getTranslation('alreadyHaveAccount', "J'ai déjà un compte")}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}


