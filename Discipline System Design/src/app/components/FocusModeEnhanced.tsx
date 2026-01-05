import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';

interface FocusModeEnhancedProps {
  onExit: () => void;
  taskName?: string;
}

type FocusPhase = 'pre-start' | 'active' | 'paused' | 'complete';

export function FocusModeEnhanced({ onExit, taskName = 'Complete Chapter 12 Summary' }: FocusModeEnhancedProps) {
  const [phase, setPhase] = useState<FocusPhase>('pre-start');
  const [timeRemaining, setTimeRemaining] = useState(90 * 60); // 90 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);

  // Timer logic
  useEffect(() => {
    if (phase === 'active' && isRunning && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setPhase('complete');
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase, isRunning, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setPhase('active');
    setIsRunning(true);
  };

  const handlePause = () => {
    setPhase('paused');
    setIsRunning(false);
  };

  const handleResume = () => {
    setPhase('active');
    setIsRunning(true);
  };

  const handleEnd = () => {
    setPhase('complete');
    setIsRunning(false);
  };

  // Pre-start screen
  if (phase === 'pre-start') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black flex items-center justify-center px-6 z-50"
      >
        <div className="max-w-md w-full space-y-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <h1 className="text-white tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
              {taskName}
            </h1>
            <p className="text-white/60 text-xl">
              90 minutes
            </p>
            <div className="pt-4">
              <p className="text-white/40">
                Focus session started. Everything else can wait.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={handleStart}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98]"
            >
              Begin
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Active focus screen
  if (phase === 'active') {
    const progress = ((90 * 60 - timeRemaining) / (90 * 60)) * 100;

    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-6 z-50">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
          <motion.div
            className="h-full bg-[#16A34A]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="max-w-md w-full space-y-16 text-center">
          {/* Task name */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-12"
          >
            <p className="text-white/40">{taskName}</p>
            
            {/* Timer */}
            <motion.h1
              key={timeRemaining}
              initial={{ scale: 1.05, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-white tracking-tight"
              style={{ letterSpacing: '-0.04em', fontSize: '5rem', lineHeight: 1 }}
            >
              {formatTime(timeRemaining)}
            </motion.h1>
          </motion.div>

          {/* Controls */}
          <div className="flex gap-4">
            <Button
              onClick={handlePause}
              variant="ghost"
              className="flex-1 border border-white/10 text-white hover:bg-white/5 rounded-3xl h-14 active:scale-[0.98]"
            >
              Pause
            </Button>
            <Button
              onClick={handleEnd}
              variant="ghost"
              className="flex-1 border border-white/10 text-white/60 hover:bg-white/5 rounded-3xl h-14 active:scale-[0.98]"
            >
              End
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Paused screen
  if (phase === 'paused') {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-6 z-50">
        <div className="max-w-md w-full space-y-16 text-center">
          <div className="space-y-8">
            <p className="text-white/40">Paused</p>
            <h1
              className="text-white tracking-tight"
              style={{ letterSpacing: '-0.04em', fontSize: '4rem', lineHeight: 1 }}
            >
              {formatTime(timeRemaining)}
            </h1>
            <p className="text-white/40">
              Resume when ready.
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleResume}
              className="flex-1 bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98]"
            >
              Resume
            </Button>
            <Button
              onClick={handleEnd}
              variant="ghost"
              className="flex-1 border border-white/10 text-white/60 hover:bg-white/5 rounded-3xl h-16 active:scale-[0.98]"
            >
              End
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Complete screen
  if (phase === 'complete') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black flex items-center justify-center px-6 z-50"
      >
        <div className="max-w-md w-full space-y-16 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="w-20 h-20 rounded-full bg-[#16A34A]/20 flex items-center justify-center mx-auto"
            >
              <div className="w-10 h-10 rounded-full bg-[#16A34A]" />
            </motion.div>

            <div className="space-y-4">
              <h2 className="text-white tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '1.75rem' }}>
                This session is complete.
              </h2>
              <p className="text-white/40">{taskName}</p>
            </div>
          </motion.div>

          <Button
            onClick={onExit}
            className="w-full bg-white hover:bg-white/90 text-black rounded-3xl h-16 shadow-xl transition-all active:scale-[0.98]"
          >
            Return to dashboard
          </Button>
        </div>
      </motion.div>
    );
  }

  return null;
}
