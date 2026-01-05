import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { BackToHomeHeader } from './ui/BackToHomeHeader';
import { Slider } from './ui/slider';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'motion/react';
import { Pause, Play, X, ArrowRight, Target, Settings } from 'lucide-react';
import { XPFeedback } from './XPFeedback';
import { SessionSettings } from './SessionSettings';

interface FocusFlowProps {
  onExit: () => void;
  onShowPaywall?: () => void; // Optional callback to show paywall after first session
}

type FocusPhase = 'intro' | 'setup' | 'active' | 'paused' | 'complete' | 'early-exit';

interface Task {
  id: string;
  title: string;
  context?: string;
  difficulty: 'light' | 'medium' | 'heavy'; // For fatigue adaptation
  estimatedMinutes: number;
  completed: boolean;
}

const PRESET_DURATIONS = [25, 45, 60, 90]; // minutes
const DEFAULT_DURATION = 45;

// Fatigue model constants
const FATIGUE_INCREMENT_LIGHT = 0.5;
const FATIGUE_INCREMENT_MEDIUM = 1.0;
const FATIGUE_INCREMENT_HEAVY = 1.5;
const FATIGUE_THRESHOLD_SUGGEST_END = 70;
const FATIGUE_THRESHOLD_SUGGEST_EXTEND = 30;

export function FocusFlow({ onExit, onShowPaywall }: FocusFlowProps) {
  const [phase, setPhase] = useState<FocusPhase>('intro');
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [breakDuration, setBreakDuration] = useState(10); // Default 10 min break
  const [maxSessions, setMaxSessions] = useState(4); // Default 4 sessions
  const [showSettings, setShowSettings] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [taskDirection, setTaskDirection] = useState(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [fatigue, setFatigue] = useState(20); // Invisible to user, starts low
  const [showAdaptiveSuggestion, setShowAdaptiveSuggestion] = useState(false);
  const [adaptiveSuggestionType, setAdaptiveSuggestionType] = useState<'extend' | 'end'>('extend');
  const startTimeRef = useRef<number>(0);

  // AI-prioritized tasks with difficulty levels for fatigue adaptation
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
    {
      id: '3',
      title: 'Practice exercises 15-20',
      context: 'Mathematics',
      difficulty: 'medium',
      estimatedMinutes: 25,
      completed: false,
    },
    {
      id: '4',
      title: 'Organize study materials',
      context: 'General',
      difficulty: 'light',
      estimatedMinutes: 15,
      completed: false,
    },
  ]);

  const currentTask = tasks[currentTaskIndex];
  const completedCount = tasks.filter(t => t.completed).length;
  const incompleteTasks = tasks.filter(t => !t.completed);

  // AI-recommended duration based on first task
  const aiRecommendedDuration = currentTask?.estimatedMinutes || 45;

  // Fatigue decay during session (invisible background process)
  useEffect(() => {
    if (phase === 'active' && isRunning) {
      const fatigueTimer = setInterval(() => {
        setFatigue(prev => {
          const increment = currentTask.difficulty === 'heavy' 
            ? FATIGUE_INCREMENT_HEAVY 
            : currentTask.difficulty === 'medium' 
            ? FATIGUE_INCREMENT_MEDIUM 
            : FATIGUE_INCREMENT_LIGHT;
          
          return Math.min(100, prev + increment);
        });
      }, 60000); // Update every minute

      return () => clearInterval(fatigueTimer);
    }
  }, [phase, isRunning, currentTask]);

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

  // Check for adaptive suggestions (extend or end early)
  useEffect(() => {
    if (phase === 'active' && timeRemaining <= 300 && timeRemaining > 290) { // 5 minutes remaining
      if (fatigue < FATIGUE_THRESHOLD_SUGGEST_EXTEND && incompleteTasks.length > completedCount) {
        setAdaptiveSuggestionType('extend');
        setShowAdaptiveSuggestion(true);
      } else if (fatigue > FATIGUE_THRESHOLD_SUGGEST_END) {
        setAdaptiveSuggestionType('end');
        setShowAdaptiveSuggestion(true);
      }
    }
  }, [timeRemaining, fatigue, phase, incompleteTasks.length, completedCount]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartFocus = () => {
    setTimeRemaining(duration * 60);
    setPhase('active');
    setIsRunning(true);
    startTimeRef.current = Date.now();
  };

  const handlePause = () => {
    setPhase('paused');
    setIsRunning(false);
  };

  const handleResume = () => {
    setPhase('active');
    setIsRunning(true);
  };

  const handleEndSession = () => {
    setShowEndConfirm(false);
    setPhase('complete');
    setIsRunning(false);
  };

  const handleCompleteTask = () => {
    // Mark current task as complete
    const updatedTasks = [...tasks];
    updatedTasks[currentTaskIndex].completed = true;
    setTasks(updatedTasks);

    // Move to next task if available
    if (currentTaskIndex < tasks.length - 1) {
      setTaskDirection(1);
      setTimeout(() => {
        setCurrentTaskIndex(currentTaskIndex + 1);
      }, 100);
    }
  };

  const getClosestPreset = (value: number) => {
    return PRESET_DURATIONS.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
  };

  const handleNaturalSessionEnd = () => {
    setPhase('complete');
    setIsRunning(false);
  };

  const handleAdaptiveSuggestion = (action: 'extend' | 'end') => {
    if (action === 'extend') {
      setDuration(duration + 15);
      setTimeRemaining(duration * 60 + 15 * 60);
      setShowAdaptiveSuggestion(false);
    } else if (action === 'end') {
      handleEndSession();
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━
  // INTRO SCREEN (AI-SELECTED TASK FIRST)
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'intro') {
    return (
      <>
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          {/* Header with Settings button */}
          <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-black/5 px-6 pt-12 pb-6 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onExit}
                  className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </motion.button>
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-[#16A34A]" />
                  <div>
                    <h2 className="font-medium">Focus Session</h2>
                    <p className="text-sm text-black/60">AI-selected task</p>
                  </div>
                </div>
              </div>

              {/* Settings button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(true)}
                className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors"
              >
                <Settings className="w-5 h-5 text-black/60" />
              </motion.button>
            </div>
          </div>

          <div className="flex items-center justify-center px-6 min-h-[calc(100vh-80px)]">
            <div className="max-w-md w-full space-y-16">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-3 text-center">
                  <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
                    Ready to focus
                  </h1>
                  <p className="text-black/60">First task is selected for you.</p>
                </div>

                {/* AI-selected task preview */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-8 border-2 border-[#16A34A]/20 bg-[#16A34A]/5 rounded-3xl"
                >
                  <div className="space-y-2 text-center">
                    <p className="text-black/40 text-sm">Primary task</p>
                    <h3 className="text-xl tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                      {currentTask.title}
                    </h3>
                    {currentTask.context && (
                      <p className="text-black/60">{currentTask.context}</p>
                    )}
                  </div>
                </motion.div>
              </motion.div>

              {/* Duration selection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-6"
              >
                <p className="text-black/60 text-center">How long can you stay focused right now?</p>

                <motion.div
                  key={duration}
                  initial={{ scale: 1.05, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="text-black tracking-tight text-center"
                  style={{ letterSpacing: '-0.04em', fontSize: '4rem', lineHeight: 1 }}
                >
                  {duration} min
                </motion.div>

                {/* Slider */}
                <div className="space-y-6">
                  <Slider
                    value={[duration]}
                    onValueChange={([value]) => setDuration(value)}
                    min={5}
                    max={180}
                    step={1}
                    className="py-8"
                  />

                  {/* Preset buttons */}
                  <div className="flex gap-3 justify-center">
                    {PRESET_DURATIONS.map(preset => (
                      <motion.button
                        key={preset}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDuration(preset)}
                        className={`px-6 py-3 rounded-full transition-all ${
                          duration === preset
                            ? 'bg-black text-white'
                            : 'bg-black/5 text-black/60 hover:bg-black/10'
                        }`}
                      >
                        {preset}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Start button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  onClick={handleStartFocus}
                  className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98]"
                >
                  Start focus
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Session Settings Modal */}
        <SessionSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          focusDuration={duration}
          breakDuration={breakDuration}
          maxSessions={maxSessions}
          onSave={(settings) => {
            setDuration(settings.focusDuration);
            setBreakDuration(settings.breakDuration);
            setMaxSessions(settings.maxSessions);
          }}
          mode="focus"
        />
      </>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // ACTIVE FOCUS SESSION
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'active') {
    const progress = ((duration * 60 - timeRemaining) / (duration * 60)) * 100;
    const circumference = 2 * Math.PI * 120; // 754.77

    return (
      <div className="fixed inset-0 bg-[#0A0A0A] z-50">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
          <motion.div
            className="h-full bg-[#16A34A]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="flex flex-col h-full px-6 pt-16 pb-8">
          {/* Timer section */}
          <div className="flex-1 flex flex-col items-center justify-center space-y-12">
            {/* Circular progress timer */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              {/* Progress ring */}
              <svg className="w-64 h-64 transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                  fill="none"
                />
                <motion.circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="#16A34A"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (circumference * progress) / 100}
                  transition={{ duration: 0.3 }}
                />
              </svg>

              {/* Timer display */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  key={timeRemaining}
                  initial={{ scale: 1.02, opacity: 0.9 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-white tracking-tight text-center"
                  style={{ letterSpacing: '-0.04em', fontSize: '4rem', lineHeight: 1 }}
                >
                  {formatTime(timeRemaining)}
                </motion.div>
              </div>
            </motion.div>

            {/* Task card */}
            <div className="w-full max-w-md">
              <p className="text-white/40 text-center mb-4">
                Current task • {currentTaskIndex + 1} of {tasks.length}
              </p>

              <AnimatePresence mode="wait" custom={taskDirection}>
                <motion.div
                  key={currentTask.id}
                  custom={taskDirection}
                  initial={{ opacity: 0, x: taskDirection > 0 ? 100 : -100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: taskDirection > 0 ? -100 : 100 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="relative"
                >
                  <div className="p-8 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-sm">
                    <div className="space-y-3 text-center">
                      <h3 className="text-white text-xl tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                        {currentTask.title}
                      </h3>
                      {currentTask.context && (
                        <p className="text-white/60">{currentTask.context}</p>
                      )}
                    </div>

                    {/* Complete task button */}
                    {!currentTask.completed && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-6"
                      >
                        <Button
                          onClick={handleCompleteTask}
                          className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-12 active:scale-[0.98]"
                        >
                          Complete task
                        </Button>
                      </motion.div>
                    )}

                    {currentTask.completed && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mt-6 flex items-center justify-center gap-2 text-[#16A34A]"
                      >
                        <div className="w-6 h-6 rounded-full bg-[#16A34A] flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-white" />
                        </div>
                        <span>Task complete</span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3 max-w-md mx-auto w-full">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePause}
              className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
            >
              <Pause className="w-5 h-5 text-white" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onTouchStart={() => setShowEndConfirm(true)}
              onClick={() => setShowEndConfirm(true)}
              className="flex-1 h-14 rounded-full border border-white/10 text-white/60 hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              <span>End session</span>
            </motion.button>
          </div>
        </div>

        {/* End confirmation modal */}
        <AnimatePresence>
          {showEndConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEndConfirm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center px-6"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-6"
              >
                <div className="space-y-2 text-center">
                  <h3 className="text-xl tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                    End session?
                  </h3>
                  <p className="text-black/60">
                    {formatTime(timeRemaining)} remaining
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowEndConfirm(false)}
                    variant="ghost"
                    className="flex-1 rounded-2xl h-12"
                  >
                    Continue
                  </Button>
                  <Button
                    onClick={handleEndSession}
                    className="flex-1 bg-black hover:bg-black/90 text-white rounded-2xl h-12"
                  >
                    End
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Adaptive suggestion modal */}
        <AnimatePresence>
          {showAdaptiveSuggestion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdaptiveSuggestion(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center px-6"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-6"
              >
                <div className="space-y-2 text-center">
                  <p className="text-black/60">
                    {adaptiveSuggestionType === 'extend' 
                      ? 'You still have energy. Continue?' 
                      : 'Good stopping point.'}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowAdaptiveSuggestion(false)}
                    variant="ghost"
                    className="flex-1 rounded-2xl h-12"
                  >
                    {adaptiveSuggestionType === 'extend' ? 'Finish now' : 'Continue'}
                  </Button>
                  <Button
                    onClick={() => handleAdaptiveSuggestion(adaptiveSuggestionType)}
                    className="flex-1 bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-12"
                  >
                    {adaptiveSuggestionType === 'extend' ? '+15 min' : 'End session'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // PAUSED STATE
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'paused') {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] z-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full space-y-16 text-center">
          <div className="space-y-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center mx-auto"
            >
              <Pause className="w-8 h-8 text-white" />
            </motion.div>

            <div className="space-y-3">
              <h2
                className="text-white tracking-tight"
                style={{ letterSpacing: '-0.04em', fontSize: '3rem', lineHeight: 1 }}
              >
                {formatTime(timeRemaining)}
              </h2>
              <p className="text-white/60">Session paused. You can return anytime.</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleResume}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98]"
            >
              Resume
            </Button>
            <Button
              onClick={handleEndSession}
              variant="ghost"
              className="w-full border border-white/10 text-white/60 hover:bg-white/5 rounded-3xl h-14 active:scale-[0.98]"
            >
              End session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // COMPLETE SUMMARY
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'complete') {
    const focusTime = duration * 60 - timeRemaining;
    const focusMinutes = Math.floor(focusTime / 60);
    
    // Calculate XP: 20 for session + 10 per task completed
    const xpGained = 20 + (completedCount * 10);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-white z-50 flex items-center justify-center px-6"
      >
        <div className="max-w-md w-full space-y-12 text-center">
          {/* Success indicator */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="space-y-6"
          >
            <div className="w-24 h-24 rounded-full bg-[#16A34A]/10 flex items-center justify-center mx-auto">
              <div className="w-12 h-12 rounded-full bg-[#16A34A]" />
            </div>

            <div className="space-y-4">
              <h2 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
                You focused deeply on what mattered.
              </h2>
              <p className="text-black/60">
                {focusMinutes} minutes • {completedCount} {completedCount === 1 ? 'task' : 'tasks'}
              </p>
            </div>
          </motion.div>

          {/* Completed tasks list */}
          {completedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              {tasks.filter(t => t.completed).map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="p-4 border border-[#16A34A]/20 bg-[#16A34A]/5 rounded-2xl flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-[#16A34A] flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-white" />
                  </div>
                  <span className="text-left">{task.title}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
          
          {/* XP Feedback */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + (completedCount * 0.1) }}
          >
            <XPFeedback 
              xpGained={xpGained} 
              message="Consistency recorded." 
            />
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Button
              onClick={() => {
                // Trigger paywall if callback is provided (after first session)
                if (onShowPaywall) {
                  onShowPaywall();
                } else {
                  onExit();
                }
              }}
              className="w-full bg-black hover:bg-black/90 text-white rounded-3xl h-16 shadow-xl transition-all active:scale-[0.98]"
            >
              Return to dashboard
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return null;
}