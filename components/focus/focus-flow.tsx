"use client"

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, X, ArrowRight, Target, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FocusFlowProps {
  onExit: () => void;
  onShowPaywall?: () => void;
}

type FocusPhase = 'intro' | 'setup' | 'active' | 'paused' | 'complete' | 'early-exit';

interface Task {
  id: string;
  title: string;
  context?: string;
  difficulty: 'light' | 'medium' | 'heavy';
  estimatedMinutes: number;
  completed: boolean;
}

const PRESET_DURATIONS = [25, 45, 60, 90];
const DEFAULT_DURATION = 45;

export function FocusFlow({ onExit, onShowPaywall }: FocusFlowProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<FocusPhase>('intro');
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Complete Chapter 12 Summary',
      context: 'Organic Chemistry',
      difficulty: 'heavy',
      estimatedMinutes: 45,
      completed: false,
    },
    {
      id: '2',
      title: 'Review lecture notes',
      context: 'Physics - Thermodynamics',
      difficulty: 'medium',
      estimatedMinutes: 30,
      completed: false,
    },
  ]);

  const currentTask = tasks[currentTaskIndex];
  const completedCount = tasks.filter(t => t.completed).length;

  // Timer logic
  useEffect(() => {
    if (phase === 'active' && isRunning && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleNaturalSessionEnd();
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

  const handleStartFocus = () => {
    setTimeRemaining(duration * 60);
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

  const handleNaturalSessionEnd = () => {
    setPhase('complete');
    setIsRunning(false);
  };

  const handleCompleteTask = () => {
    const updatedTasks = [...tasks];
    updatedTasks[currentTaskIndex].completed = true;
    setTasks(updatedTasks);

    if (currentTaskIndex < tasks.length - 1) {
      setTimeout(() => {
        setCurrentTaskIndex(currentTaskIndex + 1);
      }, 100);
    }
  };

  // Intro screen
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8 text-center"
        >
          <div className="space-y-4">
            <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
              Ready to focus?
            </h1>
            <p className="text-black/60">
              {currentTask ? currentTask.title : 'Start your focus session'}
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => setPhase('setup')}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 text-lg"
            >
              Start focus
            </Button>
            <Button
              onClick={onExit}
              variant="ghost"
              className="w-full rounded-3xl h-14 text-black/60"
            >
              Back
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Setup screen
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-white pb-24">
        <div className="px-6 pt-12 pb-8 border-b border-black/5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPhase('intro')}
            className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors shadow-sm mb-8"
          >
            <X className="w-5 h-5" />
          </motion.button>

          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
            Session settings
          </h1>
        </div>

        <div className="px-6 pt-8 space-y-8">
          <div className="space-y-4">
            <p className="text-black/60">Duration</p>
            <div className="flex gap-3">
              {PRESET_DURATIONS.map((preset) => (
                <motion.button
                  key={preset}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDuration(preset)}
                  className={`flex-1 py-4 rounded-2xl border transition-all ${
                    duration === preset
                      ? 'border-[#16A34A] bg-[#16A34A]/5 text-[#16A34A]'
                      : 'border-black/10 text-black/60 hover:border-black/20'
                  }`}
                >
                  {preset} min
                </motion.button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-black/60">Task</p>
            <div className="p-6 border border-black/5 rounded-3xl bg-white">
              <p className="font-medium mb-1">{currentTask.title}</p>
              {currentTask.context && (
                <p className="text-black/60 text-sm">{currentTask.context}</p>
              )}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-black/5 p-6">
          <Button
            onClick={handleStartFocus}
            className="w-full max-w-md mx-auto bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 text-lg"
          >
            Start focus
          </Button>
        </div>
      </div>
    );
  }

  // Active/Paused screen
  if (phase === 'active' || phase === 'paused') {
    const progress = timeRemaining > 0 ? (duration * 60 - timeRemaining) / (duration * 60) : 1;
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;

    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-md w-full space-y-12 text-center">
          {/* Timer */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="space-y-6"
          >
            <div className="relative w-64 h-64 mx-auto">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-black/5"
                />
                <motion.circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="#16A34A"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 120}
                  strokeDashoffset={2 * Math.PI * 120 * (1 - progress)}
                  initial={{ strokeDashoffset: 2 * Math.PI * 120 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 120 * (1 - progress) }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl tracking-tight" style={{ letterSpacing: '-0.04em' }}>
                    {formatTime(timeRemaining)}
                  </div>
                  <p className="text-black/60 mt-2">{currentTask.title}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Controls */}
          <div className="space-y-4">
            {phase === 'active' ? (
              <Button
                onClick={handlePause}
                variant="outline"
                className="w-full rounded-3xl h-16 text-lg"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
            ) : (
              <Button
                onClick={handleResume}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 text-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Resume
              </Button>
            )}
            <Button
              onClick={() => setShowEndConfirm(true)}
              variant="ghost"
              className="w-full rounded-3xl h-14 text-black/60"
            >
              End session
            </Button>
          </div>
        </div>

        {/* End confirmation */}
        <AnimatePresence>
          {showEndConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center px-6"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4"
              >
                <p className="text-lg font-medium">End session early?</p>
                <p className="text-black/60 text-sm">Your progress will be saved.</p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowEndConfirm(false)}
                    variant="outline"
                    className="flex-1 rounded-2xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setPhase('complete');
                      setIsRunning(false);
                    }}
                    className="flex-1 bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl"
                  >
                    End
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Complete screen
  if (phase === 'complete') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 rounded-full bg-[#16A34A]/10 flex items-center justify-center mx-auto"
            >
              <div className="w-8 h-8 rounded-full bg-[#16A34A]" />
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-black/60"
            >
              Session complete!
            </motion.p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={onExit}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 text-lg"
            >
              Back to dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}

