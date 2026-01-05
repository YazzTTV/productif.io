import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';
import { Sparkles, X } from 'lucide-react';

interface TutorialPromptProps {
  isOpen: boolean;
  onStart: () => void;
  onDismiss: () => void;
  language?: 'en' | 'fr' | 'es';
}

const translations = {
  en: {
    title: 'Ready to master Productif.io?',
    description: 'A 5-minute guided tutorial to discover all features and start strong.',
    benefits: [
      'Organize your tasks by subjects',
      'Plan your ideal day',
      'Master focus sessions',
      'Discover exam mode',
    ],
    startButton: 'Start tutorial',
    laterButton: 'Later',
  },
  fr: {
    title: 'Prêt à maîtriser Productif.io ?',
    description: 'Un didacticiel guidé de 5 minutes pour découvrir toutes les fonctionnalités et démarrer du bon pied.',
    benefits: [
      'Organiser vos tâches par matières',
      'Planifier votre journée idéale',
      'Maîtriser les sessions de focus',
      'Découvrir le mode examen',
    ],
    startButton: 'Commencer le didacticiel',
    laterButton: 'Plus tard',
  },
  es: {
    title: '¿Listo para dominar Productif.io?',
    description: 'Un tutorial guiado de 5 minutos para descubrir todas las funciones y empezar con fuerza.',
    benefits: [
      'Organiza tus tareas por materias',
      'Planifica tu día ideal',
      'Domina las sesiones de enfoque',
      'Descubre el modo examen',
    ],
    startButton: 'Comenzar tutorial',
    laterButton: 'Más tarde',
  },
};

export function TutorialPrompt({ isOpen, onStart, onDismiss, language = 'en' }: TutorialPromptProps) {
  const t = translations[language];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onDismiss}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors z-10"
              >
                <X className="w-4 h-4 text-black/60" />
              </button>

              {/* Content */}
              <div className="p-8 space-y-6">
                {/* Icon with pulse animation */}
                <div className="flex justify-center">
                  <div className="relative">
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeOut',
                      }}
                      className="absolute inset-0 rounded-full bg-[#16A34A]"
                    />
                    <div className="relative w-16 h-16 rounded-full bg-[#16A34A]/10 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-[#16A34A]" strokeWidth={2} />
                    </div>
                  </div>
                </div>

                {/* Text */}
                <div className="text-center space-y-3">
                  <h2
                    className="tracking-tight"
                    style={{ letterSpacing: '-0.03em', fontSize: '1.5rem' }}
                  >
                    {t.title}
                  </h2>
                  <p className="text-black/60">
                    {t.description}
                  </p>
                </div>

                {/* Benefits */}
                <div className="space-y-2 px-2">
                  {t.benefits.map((benefit, index) => (
                    <motion.div
                      key={benefit}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                      <p className="text-sm text-black/70">{benefit}</p>
                    </motion.div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="space-y-3 pt-2">
                  <Button
                    onClick={onStart}
                    className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-12 shadow-lg shadow-[#16A34A]/20 hover:shadow-xl hover:shadow-[#16A34A]/30 transition-all"
                  >
                    {t.startButton}
                  </Button>

                  <button
                    onClick={onDismiss}
                    className="w-full text-black/60 hover:text-black transition-colors text-sm py-3"
                  >
                    {t.laterButton}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}