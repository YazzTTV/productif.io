"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, X, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ExamModeProps {
  onExit: () => void;
}

type ExamPhase = 'dashboard' | 'focus' | 'paused' | 'complete';

interface Task {
  id: string;
  title: string;
  subject: string;
  priority: 'critical' | 'supporting' | 'light';
  completed: boolean;
}

export function ExamMode({ onExit }: ExamModeProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<ExamPhase>('dashboard');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [focusDuration, setFocusDuration] = useState(35); // 35 min default

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Complete Chapter 12 Summary',
      subject: 'Organic Chemistry',
      priority: 'critical',
      completed: false,
    },
    {
      id: '2',
      title: 'Review lecture notes',
      subject: 'Physics - Thermodynamics',
      priority: 'supporting',
      completed: false,
    },
  ]);

  const currentTask = tasks[currentTaskIndex];
  const completedCount = tasks.filter(t => t.completed).length;

  // Timer logic
  useEffect(() => {
    if (phase === 'focus' && isRunning && timeRemaining > 0) {
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
    setTimeRemaining(focusDuration * 60);
    setPhase('focus');
    setIsRunning(true);
  };

  const handlePause = () => {
    setPhase('paused');
    setIsRunning(false);
  };

  const handleResume = () => {
    setPhase('focus');
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

  // Dashboard screen
  if (phase === 'dashboard') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-4">
            <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
              Exam Mode
            </h1>
            <p className="text-black/60">
              Stress-aware focus sessions optimized for exam preparation
            </p>
          </div>

          {/* Tasks */}
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className={`p-6 border rounded-2xl ${
                  task.priority === 'critical'
                    ? 'border-[#16A34A]/20 bg-[#16A34A]/5'
                    : 'border-black/5 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-black mb-1">{task.title}</p>
                    <p className="text-sm text-black/60">{task.subject}</p>
                  </div>
                  {task.priority === 'critical' && (
                    <span className="text-xs px-3 py-1 bg-[#16A34A]/10 text-[#16A34A] rounded-full">
                      Critical
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Duration selector */}
          <div className="space-y-3">
            <p className="text-black/60">Session duration</p>
            <div className="flex gap-3">
              {[25, 35, 45].map((duration) => (
                <button
                  key={duration}
                  onClick={() => setFocusDuration(duration)}
                  className={`flex-1 py-3 rounded-2xl border transition-all ${
                    focusDuration === duration
                      ? 'border-[#16A34A] bg-[#16A34A]/5 text-[#16A34A]'
                      : 'border-black/10 text-black/60 hover:border-black/20'
                  }`}
                >
                  {duration} min
                </button>
              ))}
            </div>
          </div>

          {/* Start button */}
          <Button
            onClick={handleStartFocus}
            className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-16 text-lg"
          >
            Start Exam Session
          </Button>
        </div>
      </div>
    );
  }

  // Focus/Paused screen
  if (phase === 'focus' || phase === 'paused') {
    const progress = timeRemaining > 0 ? (focusDuration * 60 - timeRemaining) / (focusDuration * 60) : 1;

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
                  <div className="text-5xl tracking-tight mb-2" style={{ letterSpacing: '-0.04em' }}>
                    {formatTime(timeRemaining)}
                  </div>
                  <p className="text-black/60">{currentTask.title}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Controls */}
          <div className="space-y-4">
            {phase === 'focus' ? (
              <Button
                onClick={handlePause}
                variant="outline"
                className="w-full rounded-2xl h-16 text-lg"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
            ) : (
              <Button
                onClick={handleResume}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-16 text-lg"
              >
                Resume
              </Button>
            )}
            
            <Button
              onClick={() => setShowEndConfirm(true)}
              variant="ghost"
              className="w-full rounded-2xl h-14 text-black/60"
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
              <CheckCircle2 className="w-8 h-8 text-[#16A34A]" />
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-black/60"
            >
              Session complete! {completedCount} task{completedCount > 1 ? 's' : ''} completed.
            </motion.p>
          </div>

          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-16 text-lg"
          >
            Back to dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return null;
}

