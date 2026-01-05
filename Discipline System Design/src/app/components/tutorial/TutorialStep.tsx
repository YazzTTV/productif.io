import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface TutorialStepProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  description: string;
  action: string;
  microcopy?: string;
  highlightArea?: string;
  children: ReactNode;
  onNext: () => void;
  onSkip: () => void;
}

export function TutorialStep({
  stepNumber,
  totalSteps,
  title,
  description,
  action,
  microcopy,
  highlightArea,
  children,
  onNext,
  onSkip,
}: TutorialStepProps) {
  const progress = (stepNumber / totalSteps) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-black/5">
          <motion.div
            className="h-full bg-[#16A34A]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Skip button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={onSkip}
          className="w-10 h-10 rounded-full bg-white border border-black/10 flex items-center justify-center hover:bg-black/5 transition-colors shadow-sm"
        >
          <X className="w-5 h-5 text-black/40" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="max-w-md w-full space-y-8"
        >
          {/* Step indicator */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="inline-block"
            >
              <div className="w-12 h-12 rounded-full bg-[#16A34A]/10 border-2 border-[#16A34A] flex items-center justify-center mb-3">
                <span className="text-[#16A34A] font-medium">
                  {stepNumber}
                </span>
              </div>
            </motion.div>
            <p className="text-xs text-black/40">
              Step {stepNumber} of {totalSteps}
            </p>
          </div>

          {/* Title & Description */}
          <div className="text-center space-y-3">
            <h2
              className="tracking-tight"
              style={{ letterSpacing: '-0.03em', fontSize: '1.5rem' }}
            >
              {title}
            </h2>
            <p className="text-black/60">{description}</p>
          </div>

          {/* Action area */}
          <div className="space-y-4">
            <div className="p-6 border-2 border-black/5 rounded-3xl bg-white">
              <h3 className="text-sm font-medium text-black/60 mb-4">
                {action}
              </h3>
              
              {children}
            </div>

            {microcopy && (
              <p className="text-center text-xs text-black/40 px-4">
                {microcopy}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
