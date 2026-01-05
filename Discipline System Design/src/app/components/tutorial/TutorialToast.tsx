import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '../ui/button';

interface TutorialToastProps {
  isOpen: boolean;
  onStart: () => void;
  onDismiss: () => void;
  language?: 'en' | 'fr' | 'es';
}

const translations = {
  en: {
    title: 'Take a quick tour?',
    description: '5 minutes to master Productif.io',
    startButton: 'Start',
    laterButton: 'Later',
  },
  fr: {
    title: 'Faire un tour rapide ?',
    description: '5 minutes pour maîtriser Productif.io',
    startButton: 'Commencer',
    laterButton: 'Plus tard',
  },
  es: {
    title: '¿Hacer un recorrido rápido?',
    description: '5 minutos para dominar Productif.io',
    startButton: 'Comenzar',
    laterButton: 'Más tarde',
  },
};

/**
 * Alternative tutorial prompt that appears as a toast notification
 * at the bottom of the screen - less intrusive than a full modal
 */
export function TutorialToast({ 
  isOpen, 
  onStart, 
  onDismiss, 
  language = 'en' 
}: TutorialToastProps) {
  const t = translations[language];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-[100]"
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-black/5 overflow-hidden">
            {/* Decorative top bar */}
            <div className="h-1 bg-gradient-to-r from-[#16A34A] to-[#16A34A]/60" />

            <div className="p-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="relative flex-shrink-0">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.3, 0, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeOut',
                    }}
                    className="absolute inset-0 rounded-full bg-[#16A34A]"
                  />
                  <div className="relative w-12 h-12 rounded-full bg-[#16A34A]/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-[#16A34A]" strokeWidth={2} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="space-y-1 mb-4">
                    <h3 className="font-medium">{t.title}</h3>
                    <p className="text-sm text-black/60">{t.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={onStart}
                      className="flex-1 bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-10 text-sm shadow-md shadow-[#16A34A]/20"
                    >
                      {t.startButton}
                    </Button>
                    <button
                      onClick={onDismiss}
                      className="text-sm text-black/60 hover:text-black px-3"
                    >
                      {t.laterButton}
                    </button>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={onDismiss}
                  className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-black/40" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
