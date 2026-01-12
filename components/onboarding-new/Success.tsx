"use client"

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, Calendar, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SuccessProps {
  firstName: string;
  onStartFocus: () => void;
  t: any;
}

export function Success({ firstName, onStartFocus, t }: SuccessProps) {
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

  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-12"
      >
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex flex-col items-center space-y-6"
        >
          <div className="relative">
            {/* Outer ring */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="w-32 h-32 rounded-full bg-[#16A34A]/10"
            />

            {/* Middle ring */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-[#16A34A]/20"
            />

            {/* Inner circle with icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5, type: 'spring', stiffness: 200 }}
              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[#16A34A] flex items-center justify-center"
            >
              <CheckCircle2 className="w-10 h-10 text-white" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center space-y-3"
          >
            <h1
              className="tracking-tight text-3xl font-bold"
              style={{ letterSpacing: '-0.04em', lineHeight: '1.2' }}
            >
              {getTranslation('dayIsReady', 'Votre journée est prête.')}
            </h1>
            {firstName && (
              <p className="text-xl text-black/60">
                {getTranslation('welcomeBack', 'Bon retour')}, {firstName} 👋
              </p>
            )}
            <p className="text-black/60">{getTranslation('focusWithoutThinking', 'Vous pouvez maintenant vous concentrer sans réfléchir.')}</p>
          </motion.div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="space-y-3"
        >
          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 text-lg flex items-center justify-center gap-2 shadow-lg shadow-[#16A34A]/20"
          >
            <Play className="w-5 h-5" />
            {getTranslation('startFocus', 'Commencer Focus')}
          </Button>

          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="w-full border-black/10 hover:bg-black/5 rounded-3xl h-14 flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            {getTranslation('viewInCalendar', 'Voir dans le calendrier')}
          </Button>
        </motion.div>

        {/* Free plan indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/5">
            <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <span className="text-sm text-black/60">{getTranslation('freePlanActivated', 'Plan gratuit activé.')}</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}


