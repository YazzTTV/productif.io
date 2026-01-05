import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { Pause, X, Calendar, CheckCircle2, Clock, Heart, Settings, ArrowRight } from 'lucide-react';
import { SessionSettings } from './SessionSettings';

interface ExamModeProps {
  onExit: () => void;
}

type ExamPhase = 'dashboard' | 'focus' | 'paused' | 'complete';
type StressLevel = 'low' | 'moderate' | 'high';

interface Task {
  id: string;
  title: string;
  subject: string;
  priority: 'critical' | 'supporting' | 'light';
  type: 'new-material' | 'review' | 'consolidation';
  completed: boolean;
}

interface Exam {
  subject: string;
  date: string;
  daysUntil: number;
}

export function ExamMode({ onExit }: ExamModeProps) {
  const [phase, setPhase] = useState<ExamPhase>('dashboard');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  // Session settings
  const [focusDuration, setFocusDuration] = useState(35); // Default 35 min
  const [breakDuration, setBreakDuration] = useState(10); // Default 10 min
  const [maxSessions, setMaxSessions] = useState(3); // Default 3 sessions
  
  // Stress-aware system
  const [userStressLevel, setUserStressLevel] = useState<StressLevel>('moderate'); // Simulated - would come from user input or AI detection
  const [showMicroReassurance, setShowMicroReassurance] = useState(false);
  const [currentReassuranceMessage, setCurrentReassuranceMessage] = useState('');

  // Stress-aware session durations
  const getSessionDuration = (stress: StressLevel): number => {
    switch (stress) {
      case 'high':
        return 25 * 60; // 25 minutes for high stress
      case 'moderate':
        return 35 * 60; // 35 minutes for moderate stress
      case 'low':
        return 45 * 60; // 45 minutes for low stress
      default:
        return 35 * 60;
    }
  };

  // Micro-reassurance messages based on stress and progress
  const getReassuranceMessage = (stress: StressLevel, completedCount: number): string => {
    if (stress === 'high') {
      const highStressMessages = [
        "You're covering the essentials.",
        "This effort counts.",
        "One step at a time is enough.",
        "You're doing what matters.",
      ];
      return highStressMessages[completedCount % highStressMessages.length];
    } else if (stress === 'moderate') {
      const moderateStressMessages = [
        "Consistency matters more than intensity.",
        "You're making real progress.",
        "This is the right pace.",
      ];
      return moderateStressMessages[completedCount % moderateStressMessages.length];
    } else {
      return "You're exactly where you need to be.";
    }
  };

  // Exam Mode: Stress-aware task selection (favor review if stress is high)
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Complete Chapter 12 Summary',
      subject: 'Organic Chemistry',
      priority: 'critical',
      type: userStressLevel === 'high' ? 'review' : 'new-material',
      completed: false,
    },
    {
      id: '2',
      title: 'Review lecture notes',
      subject: 'Physics - Thermodynamics',
      priority: 'supporting',
      type: 'review',
      completed: false,
    },
    {
      id: '3',
      title: 'Organize study materials',
      subject: 'General',
      priority: 'light',
      type: 'consolidation',
      completed: false,
    },
  ]);

  // Upcoming exams
  const upcomingExams: Exam[] = [
    { subject: 'Organic Chemistry', date: 'March 15', daysUntil: 3 },
    { subject: 'Physics', date: 'March 18', daysUntil: 6 },
  ];

  const currentTask = tasks[currentTaskIndex];
  const completedCount = tasks.filter(t => t.completed).length;
  const allTasksCompleted = tasks.every(t => t.completed);

  // Timer logic
  useEffect(() => {
    if (phase === 'focus' && isRunning && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase, isRunning, timeRemaining]);

  // Micro-reassurance system - show every 10 minutes during focus
  useEffect(() => {
    if (phase === 'focus' && isRunning) {
      const reassuranceInterval = setInterval(() => {
        const message = getReassuranceMessage(userStressLevel, completedCount);
        setCurrentReassuranceMessage(message);
        setShowMicroReassurance(true);
        
        // Hide after 4 seconds
        setTimeout(() => {
          setShowMicroReassurance(false);
        }, 4000);
      }, 600000); // Every 10 minutes

      return () => clearInterval(reassuranceInterval);
    }
  }, [phase, isRunning, userStressLevel, completedCount]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartFocus = () => {
    setTimeRemaining(getSessionDuration(userStressLevel));
    setSessionStartTime(Date.now());
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

  const handleEndSession = () => {
    setShowEndConfirm(false);
    setPhase('complete');
    setIsRunning(false);
  };

  const handleSessionComplete = () => {
    setPhase('complete');
    setIsRunning(false);
  };

  const handleCompleteTask = () => {
    const updatedTasks = [...tasks];
    updatedTasks[currentTaskIndex].completed = true;
    setTasks(updatedTasks);

    // Move to next incomplete task if available
    const nextIncompleteIndex = tasks.findIndex((t, idx) => idx > currentTaskIndex && !t.completed);
    if (nextIncompleteIndex !== -1) {
      setTimeout(() => {
        setCurrentTaskIndex(nextIncompleteIndex);
      }, 300);
    }
  };

  const handleReturnToDashboard = () => {
    setPhase('dashboard');
    setTimeRemaining(0);
    setIsRunning(false);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━
  // DASHBOARD SCREEN
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'dashboard') {
    const nextExam = upcomingExams[0];
    
    return (
      <>
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen flex flex-col">
            {/* Header with Settings button */}
            <div className="px-6 pt-12 pb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2.5rem' }}>
                      Exam Mode
                    </h1>
                    <p className="text-black/60 text-lg">Focus on what truly matters.</p>
                  </div>

                  {/* Settings button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSettings(true)}
                    className="w-12 h-12 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors"
                  >
                    <Settings className="w-5 h-5 text-black/60" />
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Main Content */}
            <div className="flex-1 px-6 pb-24 space-y-8">
              {/* Exam Countdown (subtle) */}
              {nextExam && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-6 border-2 border-[#16A34A]/20 bg-[#16A34A]/5 rounded-3xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#16A34A]/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-[#16A34A]" />
                      </div>
                      <div>
                        <h3 className="tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                          {nextExam.subject}
                        </h3>
                        <p className="text-black/60 text-sm">{nextExam.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                        {nextExam.daysUntil}
                      </div>
                      <p className="text-black/60 text-sm">days</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Today's Priorities (max 2-3 tasks) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <h2 className="text-black/40 text-sm uppercase tracking-wider">Today's priorities</h2>
                
                <div className="space-y-3">
                  {tasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className={`p-6 rounded-3xl border-2 transition-all ${
                        task.completed
                          ? 'border-[#16A34A]/20 bg-[#16A34A]/5'
                          : task.priority === 'critical'
                          ? 'border-black/20 bg-black/5'
                          : 'border-black/10 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {task.priority === 'critical' && (
                              <span className="px-2 py-1 bg-black text-white text-xs rounded-full">
                                Critical
                              </span>
                            )}
                            {task.priority === 'supporting' && (
                              <span className="px-2 py-1 bg-black/10 text-black/60 text-xs rounded-full">
                                Supporting
                              </span>
                            )}
                            {task.priority === 'light' && (
                              <span className="px-2 py-1 bg-black/5 text-black/40 text-xs rounded-full">
                                Light
                              </span>
                            )}
                          </div>
                          <h3 className="tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                            {task.title}
                          </h3>
                          <p className="text-black/60 text-sm">{task.subject}</p>
                        </div>
                        {task.completed && (
                          <div className="w-8 h-8 rounded-full bg-[#16A34A] flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Micro-reassurance message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="p-6 border border-black/5 bg-black/[0.02] rounded-3xl"
              >
                <p className="text-black/60 text-center italic">
                  {allTasksCompleted 
                    ? "This is enough for today." 
                    : completedCount > 0
                    ? "You're covering what matters."
                    : "Consistency beats panic."}
                </p>
              </motion.div>
            </div>

            {/* Fixed Bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-3"
              >
                {!allTasksCompleted && (
                  <Button
                    onClick={handleStartFocus}
                    className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98]"
                  >
                    Start Focus
                  </Button>
                )}
                <Button
                  onClick={onExit}
                  variant="ghost"
                  className="w-full text-black/60 hover:bg-black/5 rounded-3xl h-14 active:scale-[0.98]"
                >
                  Exit Exam Mode
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Session Settings Modal */}
        <SessionSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          focusDuration={focusDuration}
          breakDuration={breakDuration}
          maxSessions={maxSessions}
          onSave={(settings) => {
            setFocusDuration(settings.focusDuration);
            setBreakDuration(settings.breakDuration);
            setMaxSessions(settings.maxSessions);
          }}
          mode="exam"
        />
      </>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // ACTIVE FOCUS BLOCK
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'focus') {
    const sessionProgress = ((getSessionDuration(userStressLevel) - timeRemaining) / getSessionDuration(userStressLevel)) * 100;

    return (
      <div className="fixed inset-0 bg-[#0A0A0A] z-50">
        {/* Overall session progress */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
          <motion.div
            className="h-full bg-[#16A34A]"
            initial={{ width: 0 }}
            animate={{ width: `${sessionProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="flex flex-col h-full px-6 pt-16 pb-8">
          <div className="flex-1 flex flex-col items-center justify-center space-y-12">
            {/* Block indicator */}
            <p className="text-white/40 text-center">
              Focus block • {getSessionDuration(userStressLevel) / 60}m
            </p>

            {/* Timer */}
            <motion.div
              key={timeRemaining}
              initial={{ scale: 1.01, opacity: 0.95 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-white tracking-tight text-center"
              style={{ letterSpacing: '-0.04em', fontSize: '5rem', lineHeight: 1 }}
            >
              {formatTime(timeRemaining)}
            </motion.div>

            {/* Micro-reassurance overlay */}
            <AnimatePresence>
              {showMicroReassurance && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute top-32 left-0 right-0 px-6"
                >
                  <div className="max-w-md mx-auto p-4 border border-[#16A34A]/30 bg-[#16A34A]/10 backdrop-blur-md rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Heart className="w-4 h-4 text-[#16A34A]" />
                      <p className="text-white/90 text-sm italic">
                        {currentReassuranceMessage}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Task card */}
            <div className="w-full max-w-md">
              <p className="text-white/40 text-center mb-4">
                Current task • {currentTaskIndex + 1} of {tasks.length}
              </p>

              <AnimatePresence mode="wait" custom={currentTaskIndex}>
                <motion.div
                  key={currentTask.id}
                  custom={currentTaskIndex}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <div className="p-8 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-sm">
                    <div className="space-y-3 text-center">
                      <h3 className="text-white text-xl tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                        {currentTask.title}
                      </h3>
                      <p className="text-white/60">{currentTask.subject}</p>
                    </div>

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
              onClick={isRunning ? handlePause : handleResume}
              className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
            >
              <Pause className="w-5 h-5 text-white" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowEndConfirm(true)}
              className="flex-1 h-14 rounded-full border border-white/10 text-white/60 hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              <span>End session</span>
            </motion.button>
          </div>
        </div>

        {/* End confirmation */}
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
                    End Exam Mode?
                  </h3>
                  <p className="text-black/60">
                    {Math.floor((getSessionDuration(userStressLevel) - timeRemaining) / 60)}m remaining
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
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // PAUSED MODE
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'paused') {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full space-y-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="w-20 h-20 rounded-full border-4 border-black/10 flex items-center justify-center mx-auto">
              <Pause className="w-8 h-8 text-black/40" />
            </div>

            <div className="space-y-4">
              <h2 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
                Take your time.
              </h2>
              <p className="text-black/60">You can return whenever you're ready.</p>
            </div>

            <motion.div
              key={timeRemaining}
              initial={{ scale: 1.01, opacity: 0.95 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-black/40 tracking-tight text-lg"
            >
              {formatTime(timeRemaining)} remaining
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="p-6 border border-black/5 bg-black/[0.02] rounded-3xl space-y-3 text-black/60">
              <p>Stand up</p>
              <p>Drink water</p>
              <p>Breathe</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <Button
              onClick={handleResume}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98]"
            >
              Resume
            </Button>
            <Button
              onClick={handleEndSession}
              variant="ghost"
              className="w-full text-black/60 hover:bg-black/5 rounded-3xl h-14 active:scale-[0.98]"
            >
              End session
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // COMPLETE SUMMARY
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'complete') {
    const focusedMinutes = Math.floor((getSessionDuration(userStressLevel) - timeRemaining) / 60);

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
                You did what you could today.
              </h2>
              <p className="text-black/60 text-lg">That's enough.</p>
            </div>
          </motion.div>

          {/* What was covered today */}
          {completedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <h3 className="text-black/40 text-sm uppercase tracking-wider">What you covered</h3>
              <div className="space-y-3">
                {tasks.filter(t => t.completed).map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="p-4 border border-[#16A34A]/20 bg-[#16A34A]/5 rounded-2xl flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#16A34A] flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm">{task.title}</p>
                      <p className="text-xs text-black/60">{task.subject}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Tomorrow's plan (if incomplete tasks remain) */}
          {tasks.some(t => !t.completed) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              <h3 className="text-black/40 text-sm uppercase tracking-wider">For tomorrow</h3>
              <div className="p-6 border border-black/10 bg-black/[0.02] rounded-3xl">
                <p className="text-black/60 text-sm">
                  {tasks.filter(t => !t.completed)[0]?.title}
                </p>
              </div>
            </motion.div>
          )}

          {/* Summary stats (subtle) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-8 text-black/40 text-sm"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{focusedMinutes} min</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{completedCount} {completedCount === 1 ? 'task' : 'tasks'}</span>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            <Button
              onClick={handleReturnToDashboard}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98]"
            >
              Back to Exam Mode
            </Button>
            <Button
              onClick={onExit}
              variant="ghost"
              className="w-full text-black/60 hover:bg-black/5 rounded-3xl h-14 active:scale-[0.98]"
            >
              Exit Exam Mode
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return null;
}