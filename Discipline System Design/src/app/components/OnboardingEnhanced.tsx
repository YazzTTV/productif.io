import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingEnhancedProps {
  onComplete: (data: any) => void;
}

export function OnboardingEnhanced({ onComplete }: OnboardingEnhancedProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    familiarProblems: [] as string[],
    firstName: '',
    ageRange: '',
    fieldOfStudy: '',
    currentSituation: '',
    dailyStruggles: [] as string[],
    mentalLoad: 50,
    focusQuality: 50,
    satisfaction: 50,
    overthinkTasks: null as boolean | null,
    shouldDoMore: null as boolean | null,
    wantToChange: [] as string[],
    timeHorizon: '',
  });

  const totalSteps = 12;
  const progress = (step / totalSteps) * 100;

  const nextStep = () => {
    if (step === 12) {
      onComplete(data);
    } else {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const updateData = (key: string, value: any) => {
    setData({ ...data, [key]: value });
  };

  const toggleMultiple = (key: string, value: string) => {
    const current = data[key as keyof typeof data] as string[];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateData(key, updated);
  };

  // Progress Bar Component
  const ProgressBar = () => (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-black/5">
        <motion.div
          className="h-full bg-[#16A34A]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );

  // Screen 1 - Value Proposition with iPhone Mockup
  if (step === 1) {
    return (
      <>
        <ProgressBar />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="min-h-screen flex flex-col items-center justify-center px-6 bg-white"
        >
          <div className="max-w-md w-full space-y-16">
            {/* Enhanced iPhone Mockup */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="w-64 h-[340px] border-[6px] border-black/90 rounded-[3rem] bg-white overflow-hidden shadow-2xl">
                  {/* Phone notch */}
                  <div className="h-6 bg-black/90 rounded-b-2xl w-32 mx-auto" />
                  
                  {/* Dashboard preview */}
                  <div className="p-4 space-y-3 pt-2">
                    <div className="h-2 bg-black/5 rounded-full w-20" />
                    <div className="h-20 bg-[#16A34A]/10 border border-[#16A34A]/20 rounded-2xl p-3 flex flex-col justify-between">
                      <div className="h-2 bg-[#16A34A]/30 rounded-full w-16" />
                      <div className="h-8 bg-[#16A34A] rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-12 bg-black/5 rounded-xl" />
                      <div className="h-12 bg-black/5 rounded-xl" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-4 text-center"
            >
              <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em' }}>
                You work hard. But without a system.
              </h1>
              <p className="text-black/60">
                Productif.io helps students turn effort into results — without burnout.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button 
                onClick={nextStep}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 shadow-lg shadow-[#16A34A]/20 hover:shadow-xl hover:shadow-[#16A34A]/30 transition-all active:scale-[0.98]"
              >
                Continue
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </>
    );
  }

  // Screen 2 - Problem Mirror with Stacked Cards
  if (step === 2) {
    const problems = [
      "I work long hours but still feel behind",
      "I don't know what to prioritize",
      "My brain feels constantly overloaded",
      "I procrastinate even when motivated",
      "My days end without satisfaction",
    ];

    return (
      <>
        <ProgressBar />
        <div className="min-h-screen flex flex-col px-6 pt-16 bg-white">
          <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
            <div className="space-y-8 flex-1">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="tracking-tight"
                style={{ letterSpacing: '-0.04em' }}
              >
                Which of these feel familiar?
              </motion.h2>
              
              <div className="space-y-3">
                {problems.map((problem, index) => (
                  <motion.button
                    key={problem}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => toggleMultiple('familiarProblems', problem)}
                    className={`w-full p-6 border rounded-3xl text-left transition-all shadow-sm hover:shadow-md ${
                      data.familiarProblems.includes(problem)
                        ? 'border-[#16A34A] bg-[#16A34A]/5 shadow-[#16A34A]/10'
                        : 'border-black/5 hover:border-black/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
                        data.familiarProblems.includes(problem)
                          ? 'border-[#16A34A] bg-[#16A34A] scale-110'
                          : 'border-black/20'
                      }`}>
                        {data.familiarProblems.includes(problem) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2.5 h-2.5 rounded-full bg-white"
                          />
                        )}
                      </div>
                      <span className="flex-1">{problem}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white py-6 space-y-3">
              <Button 
                onClick={nextStep}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 shadow-lg shadow-[#16A34A]/20 hover:shadow-xl hover:shadow-[#16A34A]/30 transition-all active:scale-[0.98]"
              >
                Continue
              </Button>
              <Button 
                onClick={prevStep}
                variant="ghost"
                className="w-full rounded-3xl h-14 text-black/60 active:scale-[0.98]"
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Screen 9 - WOW MOMENT (Enhanced Cinematic)
  if (step === 9) {
    return (
      <>
        <ProgressBar />
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
          <div className="max-w-md w-full space-y-16">
            <div className="space-y-12 text-center">
              {/* Personalized diagnosis with staggered fade-in */}
              <div className="space-y-6">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="tracking-tight leading-tight"
                  style={{ letterSpacing: '-0.04em', fontSize: '1.75rem' }}
                >
                  {data.firstName}, your effort is high.
                </motion.h1>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="tracking-tight leading-tight"
                  style={{ letterSpacing: '-0.04em', fontSize: '1.75rem' }}
                >
                  Your stress is high.
                </motion.h1>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="tracking-tight leading-tight"
                  style={{ letterSpacing: '-0.04em', fontSize: '1.75rem' }}
                >
                  Your structure is unclear.
                </motion.h1>
              </div>

              {/* The revelation with divider */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="space-y-6 pt-8"
              >
                <div className="h-px bg-[#16A34A]/20 w-24 mx-auto" />
                
                <div className="space-y-4">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="text-black/80"
                  >
                    You don't need to work more.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8 }}
                    className="text-black/80 relative inline-block"
                  >
                    You need a system that decides for you.
                    <motion.span
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ delay: 2.1, duration: 0.6 }}
                      className="absolute bottom-0 left-0 h-0.5 bg-[#16A34A]/30"
                    />
                  </motion.p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.4 }}
              className="space-y-3"
            >
              <Button 
                onClick={nextStep}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 shadow-lg shadow-[#16A34A]/20 hover:shadow-xl hover:shadow-[#16A34A]/30 transition-all active:scale-[0.98]"
              >
                Build my ideal day
              </Button>
              <Button 
                onClick={prevStep}
                variant="ghost"
                className="w-full rounded-3xl h-14 text-black/60 active:scale-[0.98]"
              >
                Back
              </Button>
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  // Screen 10 - Loading with Skeleton UI
  if (step === 10) {
    useEffect(() => {
      const timer = setTimeout(() => {
        setStep(11);
      }, 2500);
      return () => clearTimeout(timer);
    }, []);

    return (
      <>
        <ProgressBar />
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
          <div className="max-w-md w-full space-y-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <p className="text-center text-black/60">
                We're building your ideal day based on your profile.
              </p>
              
              {/* UI Skeleton Animation */}
              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: [0.3, 0.6, 0.3], y: 0 }}
                    transition={{
                      opacity: { duration: 1.5, repeat: Infinity, delay: i * 0.2 },
                      y: { duration: 0.3, delay: i * 0.1 }
                    }}
                    className="h-16 bg-black/5 rounded-3xl"
                  />
                ))}
              </div>

              {/* Animated dots */}
              <div className="flex items-center justify-center gap-2 pt-4">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    className="w-2 h-2 rounded-full bg-[#16A34A]"
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  // For other steps, render the original onboarding
  // (keeping the same structure but with progress bar)
  return (
    <>
      <ProgressBar />
      <div className="min-h-screen flex flex-col px-6 pt-16 bg-white">
        <div className="max-w-md w-full mx-auto">
          <p className="text-center text-black/40 mb-8">
            Step {step} of {totalSteps}
          </p>
          {/* Placeholder for other steps - use original logic */}
        </div>
      </div>
    </>
  );
}
