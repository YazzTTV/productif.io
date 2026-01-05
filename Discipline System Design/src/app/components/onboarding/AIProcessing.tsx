import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface AIProcessingProps {
  onComplete: (idealDay: any) => void;
  t: any;
}

const steps = [
  { key: 'priorities', duration: 2000 },
  { key: 'effort', duration: 2500 },
  { key: 'plan', duration: 2000 },
];

export function AIProcessing({ onComplete, t }: AIProcessingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCompletedSteps(prev => [...prev, currentStep]);
        setCurrentStep(prev => prev + 1);
      }, steps[currentStep].duration);
      return () => clearTimeout(timer);
    } else {
      // All steps complete - generate mock ideal day
      const timer = setTimeout(() => {
        const mockIdealDay = {
          timeline: [
            { time: '08:00', activity: 'Morning routine', duration: 30 },
            { time: '08:30', activity: 'Deep work - Priority 1', duration: 90, priority: true },
            { time: '10:00', activity: 'Break', duration: 15 },
            { time: '10:15', activity: 'Classes / Lectures', duration: 120 },
            { time: '12:15', activity: 'Lunch break', duration: 45 },
            { time: '13:00', activity: 'Deep work - Priority 2', duration: 90, priority: true },
            { time: '14:30', activity: 'Break', duration: 15 },
            { time: '14:45', activity: 'Review & Practice', duration: 60 },
            { time: '15:45', activity: 'Break', duration: 15 },
            { time: '16:00', activity: 'Deep work - Priority 3', duration: 60, priority: true },
            { time: '17:00', activity: 'End of focused work', duration: 0 },
          ],
          priorities: [
            'Review Chapter 12 — Integrals',
            'Complete practice problems 15-20',
            'Prepare lab report',
          ],
        };
        onComplete(mockIdealDay);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, onComplete]);

  const stepLabels = {
    priorities: t.understandingPriorities,
    effort: t.estimatingEffort,
    plan: t.creatingPlan,
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-md w-full space-y-12"
      >
        <div className="text-center space-y-3">
          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
            {t.designingDay}
          </h1>
        </div>

        {/* Animated progress circle */}
        <div className="flex justify-center">
          <div className="relative w-32 h-32">
            {/* Background circle */}
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-black/5"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-[#16A34A]"
                initial={{ strokeDasharray: '0 352' }}
                animate={{
                  strokeDasharray: `${(completedSteps.length / steps.length) * 352} 352`,
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                key={completedSteps.length}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <div className="text-3xl tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                  {completedSteps.length}/{steps.length}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Steps list */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(index);
            const isCurrent = currentStep === index;

            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  isCurrent
                    ? 'bg-[#16A34A]/10 border border-[#16A34A]/20'
                    : isCompleted
                    ? 'bg-[#16A34A]/5'
                    : 'bg-black/5'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-[#16A34A]'
                      : isCurrent
                      ? 'bg-[#16A34A]/20'
                      : 'bg-black/10'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isCurrent ? 'bg-[#16A34A]' : 'bg-black/30'
                      }`}
                    />
                  )}
                </div>

                <span
                  className={`flex-1 ${
                    isCompleted ? 'text-[#16A34A]' : isCurrent ? 'text-black' : 'text-black/40'
                  }`}
                >
                  {stepLabels[step.key as keyof typeof stepLabels]}
                </span>

                {isCurrent && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-[#16A34A]/30 border-t-[#16A34A] rounded-full"
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
