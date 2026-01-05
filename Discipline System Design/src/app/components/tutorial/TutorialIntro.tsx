import { motion } from 'motion/react';
import { Button } from '../ui/button';

interface TutorialIntroProps {
  onStart: () => void;
  onSkip: () => void;
}

export function TutorialIntro({ onStart, onSkip }: TutorialIntroProps) {
  const steps = [
    { id: 1, label: 'Subjects' },
    { id: 2, label: 'Tasks' },
    { id: 3, label: 'Plan' },
    { id: 4, label: 'Journal' },
    { id: 5, label: 'Habits' },
    { id: 6, label: 'Focus' },
    { id: 7, label: 'Exam Mode' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-12"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="tracking-tight"
            style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}
          >
            Let's set you up properly.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-black/60"
          >
            This takes 5 minutes and will save you hours.
          </motion.p>
        </div>

        {/* Progress Path Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-black/10" />
            
            {/* Steps */}
            <div className="relative space-y-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-black/10 bg-white flex items-center justify-center">
                    <span className="text-sm text-black/40">{step.id}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{step.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="space-y-4"
        >
          <Button
            onClick={onStart}
            className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 text-lg shadow-lg shadow-[#16A34A]/20 hover:shadow-xl hover:shadow-[#16A34A]/30 transition-all"
          >
            Start guided setup
          </Button>

          <button
            onClick={onSkip}
            className="w-full text-black/40 hover:text-black/60 transition-colors text-sm"
          >
            Skip for now
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
