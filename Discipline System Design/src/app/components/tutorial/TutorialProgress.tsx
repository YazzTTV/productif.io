import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

interface TutorialProgressProps {
  steps: Step[];
  orientation?: 'horizontal' | 'vertical';
}

export function TutorialProgress({ 
  steps, 
  orientation = 'horizontal' 
}: TutorialProgressProps) {
  if (orientation === 'vertical') {
    return <VerticalProgress steps={steps} />;
  }

  return <HorizontalProgress steps={steps} />;
}

function HorizontalProgress({ steps }: { steps: Step[] }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step circle */}
            <div className="relative">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: step.current ? 1.1 : 1 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  step.completed
                    ? 'bg-[#16A34A] text-white'
                    : step.current
                    ? 'bg-[#16A34A]/20 border-2 border-[#16A34A] text-[#16A34A]'
                    : 'bg-black/5 text-black/40'
                }`}
              >
                {step.completed ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Check className="w-5 h-5" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </motion.div>

              {/* Current step pulse */}
              {step.current && (
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                  className="absolute inset-0 rounded-full bg-[#16A34A]"
                />
              )}
            </div>

            {/* Connecting line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 bg-black/10 relative overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: step.completed ? '100%' : 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-y-0 left-0 bg-[#16A34A]"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between mt-3">
        {steps.map((step) => (
          <div 
            key={`label-${step.id}`} 
            className="flex-1 text-center"
          >
            <p className={`text-xs transition-colors ${
              step.current 
                ? 'text-[#16A34A] font-medium' 
                : step.completed
                ? 'text-black/60'
                : 'text-black/40'
            }`}>
              {step.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerticalProgress({ steps }: { steps: Step[] }) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-start gap-4">
          {/* Step circle with connecting line */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: step.current ? 1.1 : 1 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  step.completed
                    ? 'bg-[#16A34A] text-white'
                    : step.current
                    ? 'bg-[#16A34A]/20 border-2 border-[#16A34A] text-[#16A34A]'
                    : 'bg-black/5 text-black/40'
                }`}
              >
                {step.completed ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Check className="w-5 h-5" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </motion.div>

              {/* Current step pulse */}
              {step.current && (
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                  className="absolute inset-0 rounded-full bg-[#16A34A]"
                />
              )}
            </div>

            {/* Connecting line */}
            {index < steps.length - 1 && (
              <div className="w-0.5 h-12 mt-2 bg-black/10 relative overflow-hidden">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: step.completed ? '100%' : 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-x-0 top-0 bg-[#16A34A]"
                />
              </div>
            )}
          </div>

          {/* Label */}
          <div className="flex-1 pt-2">
            <p className={`text-sm transition-colors ${
              step.current 
                ? 'text-[#16A34A] font-medium' 
                : step.completed
                ? 'text-black/60'
                : 'text-black/40'
            }`}>
              {step.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
