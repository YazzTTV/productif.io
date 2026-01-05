import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { 
  ArrowRight,
  Mic,
  Pause,
  Check,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  Target,
  Edit2,
  Plus,
  Trash2,
  Shield,
  ExternalLink
} from 'lucide-react';

interface OnboardingProps {
  onComplete: (userData: UserData) => void;
}

interface UserData {
  firstName: string;
  studentType: string;
  goals: string[];
  pressureLevel: number;
  tasks: Task[];
  dayPlan: DayPlan | null;
}

interface Task {
  id: string;
  title: string;
  category: 'classes' | 'work' | 'study' | 'personal';
  mustDoTomorrow: boolean;
}

interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  type: 'class' | 'deepwork' | 'admin' | 'break' | 'revision' | 'meal';
  isHighImpact?: boolean;
}

interface DayPlan {
  date: string;
  blocks: TimeBlock[];
  topPriorities: {
    title: string;
    subject?: string;
    estimatedMinutes: number;
  }[];
}

type OnboardingStep = 
  | 'welcome'
  | 'value-awareness'
  | 'identity'
  | 'goals'
  | 'tasks-input'
  | 'tasks-clarification'
  | 'ai-processing'
  | 'ideal-day'
  | 'adjust'
  | 'calendar-sync'
  | 'success';

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [userData, setUserData] = useState<UserData>({
    firstName: '',
    studentType: '',
    goals: [],
    pressureLevel: 50,
    tasks: [],
    dayPlan: null,
  });

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [tasksInput, setTasksInput] = useState('');
  const [processingStep, setProcessingStep] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Recording timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  // AI Processing simulation
  useEffect(() => {
    if (step === 'ai-processing') {
      const steps = [
        { step: 0, delay: 0 },
        { step: 1, delay: 800 },
        { step: 2, delay: 1600 },
        { step: 3, delay: 2400 },
      ];

      steps.forEach(({ step: stepNum, delay }) => {
        setTimeout(() => {
          setProcessingStep(stepNum);
          if (stepNum === 3) {
            generateIdealDay();
            setTimeout(() => {
              setStep('ideal-day');
            }, 500);
          }
        }, delay);
      });
    }
  }, [step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
  };

  const handleFinishRecording = () => {
    setIsRecording(false);
    // Simulate transcription
    const simulatedTranscription = "I have organic chemistry at 9am. Need to finish chapter 12 summary. Physics lecture at 2pm. Want to review calculus in the evening.";
    setTasksInput(simulatedTranscription);
  };

  const extractTasksFromInput = () => {
    // AI extraction (simulated)
    const extractedTasks: Task[] = [
      {
        id: '1',
        title: 'Organic Chemistry Class',
        category: 'classes',
        mustDoTomorrow: true,
      },
      {
        id: '2',
        title: 'Complete Chapter 12 Summary',
        category: 'study',
        mustDoTomorrow: true,
      },
      {
        id: '3',
        title: 'Physics Lecture',
        category: 'classes',
        mustDoTomorrow: true,
      },
      {
        id: '4',
        title: 'Review Calculus',
        category: 'study',
        mustDoTomorrow: false,
      },
    ];

    setUserData(prev => ({ ...prev, tasks: extractedTasks }));
    setStep('tasks-clarification');
  };

  const generateIdealDay = () => {
    const dayPlan: DayPlan = {
      date: 'Tomorrow, March 11',
      blocks: [
        {
          id: 'b1',
          startTime: '09:00',
          endTime: '11:00',
          title: 'Organic Chemistry Class',
          type: 'class',
        },
        {
          id: 'b2',
          startTime: '11:15',
          endTime: '12:45',
          title: 'Deep Work: Chapter 12 Summary',
          type: 'deepwork',
          isHighImpact: true,
        },
        {
          id: 'b3',
          startTime: '12:45',
          endTime: '13:30',
          title: 'Lunch Break',
          type: 'meal',
        },
        {
          id: 'b4',
          startTime: '14:00',
          endTime: '16:00',
          title: 'Physics Lecture',
          type: 'class',
        },
        {
          id: 'b5',
          startTime: '16:15',
          endTime: '17:00',
          title: 'Break & Light Tasks',
          type: 'break',
        },
        {
          id: 'b6',
          startTime: '18:00',
          endTime: '19:00',
          title: 'Calculus Review',
          type: 'revision',
          isHighImpact: true,
        },
        {
          id: 'b7',
          startTime: '20:00',
          endTime: '20:30',
          title: 'Light Review & Tomorrow Prep',
          type: 'admin',
        },
      ],
      topPriorities: [
        {
          title: 'Complete Chapter 12 Summary',
          subject: 'Organic Chemistry',
          estimatedMinutes: 90,
        },
        {
          title: 'Calculus Review',
          subject: 'Mathematics',
          estimatedMinutes: 60,
        },
        {
          title: 'Attend Physics Lecture',
          subject: 'Physics',
          estimatedMinutes: 120,
        },
      ],
    };

    setUserData(prev => ({ ...prev, dayPlan }));
  };

  const handleToggleGoal = (goal: string) => {
    setUserData(prev => {
      const currentGoals = prev.goals;
      if (currentGoals.includes(goal)) {
        return { ...prev, goals: currentGoals.filter(g => g !== goal) };
      } else if (currentGoals.length < 2) {
        return { ...prev, goals: [...currentGoals, goal] };
      }
      return prev;
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setUserData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId),
    }));
  };

  const handleToggleMustDo = (taskId: string) => {
    setUserData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t =>
        t.id === taskId ? { ...t, mustDoTomorrow: !t.mustDoTomorrow } : t
      ),
    }));
  };

  // ━━━━━━━━━━━━━━━━━━━━━━
  // SCREEN 1: WELCOME
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'welcome') {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="min-h-screen flex flex-col">
          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative h-[50vh] overflow-hidden"
          >
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1760236963218-424a715d1816?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwZGVzayUyMGNhbG0lMjBmb2N1c3xlbnwxfHx8fDE3Njc1NDAxMDF8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Calm study environment"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white" />
          </motion.div>

          {/* Content */}
          <div className="flex-1 px-6 py-12 -mt-20 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="max-w-md mx-auto space-y-8 text-center"
            >
              {/* Title */}
              <div className="space-y-4">
                <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2.5rem' }}>
                  Let's make your days clearer.
                </h1>
                <p className="text-black/60 text-lg">
                  Productif.io helps students turn effort into results — calmly.
                </p>
              </div>

              {/* CTA */}
              <Button
                onClick={() => setStep('value-awareness')}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
              >
                Get started
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // SCREEN 2: VALUE AWARENESS
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'value-awareness') {
    const bullets = [
      "You work a lot.",
      "You try to stay disciplined.",
      "But everything feels scattered.",
    ];

    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full space-y-12 text-center"
          >
            {/* Title */}
            <div className="space-y-4">
              <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2.5rem' }}>
                You're not the problem.
              </h1>
            </div>

            {/* Bullets */}
            <div className="space-y-6">
              {bullets.map((bullet, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.3, duration: 0.5 }}
                  className="p-6 border-2 border-black/10 rounded-3xl bg-black/[0.02] text-left"
                >
                  <p className="text-lg text-black/80">{bullet}</p>
                </motion.div>
              ))}
            </div>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="p-6 border-2 border-[#16A34A]/20 bg-[#16A34A]/5 rounded-3xl"
            >
              <p className="text-lg text-black/80">
                The problem is the lack of a clear system.
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
            >
              <Button
                onClick={() => setStep('identity')}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // SCREEN 3: IDENTITY
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'identity') {
    const studentTypes = [
      { value: 'high-school', label: 'High school' },
      { value: 'university', label: 'University' },
      { value: 'med-law-prepa', label: 'Med / Law / Prépa' },
      { value: 'engineering-business', label: 'Engineering / Business school' },
    ];

    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="min-h-screen flex flex-col px-6 py-12">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="h-1 bg-black/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '27%' }}
                className="h-full bg-[#16A34A]"
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-black/40 mt-2">Step 1 of 4</p>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 flex-1"
            >
              {/* Title */}
              <div className="space-y-3">
                <h1 className="tracking-tight text-3xl" style={{ letterSpacing: '-0.04em' }}>
                  First, tell us who you are.
                </h1>
                <p className="text-black/60">This helps us adapt the system to you.</p>
              </div>

              {/* First Name */}
              <div className="space-y-3">
                <label className="text-sm text-black/60">First name</label>
                <input
                  type="text"
                  value={userData.firstName}
                  onChange={(e) => setUserData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter your first name"
                  className="w-full px-6 py-4 border-2 border-black/10 rounded-3xl bg-white focus:border-[#16A34A] focus:outline-none text-lg transition-colors"
                />
              </div>

              {/* Student Type */}
              <div className="space-y-3">
                <label className="text-sm text-black/60">I'm a student in</label>
                <div className="space-y-3">
                  {studentTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setUserData(prev => ({ ...prev, studentType: type.value }))}
                      className={`w-full p-4 rounded-3xl border-2 transition-all text-left ${
                        userData.studentType === type.value
                          ? 'border-[#16A34A] bg-[#16A34A]/5'
                          : 'border-black/10 bg-white hover:border-black/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg">{type.label}</span>
                        {userData.studentType === type.value && (
                          <div className="w-6 h-6 rounded-full bg-[#16A34A] flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <Button
                onClick={() => setStep('goals')}
                disabled={!userData.firstName || !userData.studentType}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // SCREEN 4: GOALS & PRESSURE
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'goals') {
    const goalOptions = [
      { value: 'succeed-exams', label: 'Succeed in exams', icon: Target },
      { value: 'reduce-stress', label: 'Reduce stress', icon: CheckCircle2 },
      { value: 'stay-consistent', label: 'Stay consistent', icon: Calendar },
      { value: 'stop-overwhelm', label: 'Stop feeling overwhelmed', icon: Shield },
      { value: 'use-time-better', label: 'Use my time better', icon: Clock },
    ];

    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="min-h-screen flex flex-col px-6 py-12">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="h-1 bg-black/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '27%' }}
                animate={{ width: '54%' }}
                className="h-full bg-[#16A34A]"
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-black/40 mt-2">Step 2 of 4</p>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 flex-1"
            >
              {/* Title */}
              <div className="space-y-3">
                <h1 className="tracking-tight text-3xl" style={{ letterSpacing: '-0.04em' }}>
                  What matters most to you right now?
                </h1>
                <p className="text-black/60">Choose up to 2</p>
              </div>

              {/* Goals */}
              <div className="space-y-3">
                {goalOptions.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = userData.goals.includes(goal.value);
                  return (
                    <button
                      key={goal.value}
                      onClick={() => handleToggleGoal(goal.value)}
                      className={`w-full p-5 rounded-3xl border-2 transition-all ${
                        isSelected
                          ? 'border-[#16A34A] bg-[#16A34A]/5'
                          : 'border-black/10 bg-white hover:border-black/20'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          isSelected ? 'bg-[#16A34A]/10' : 'bg-black/5'
                        }`}>
                          <Icon className={`w-6 h-6 ${isSelected ? 'text-[#16A34A]' : 'text-black/40'}`} />
                        </div>
                        <span className="text-lg flex-1 text-left">{goal.label}</span>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-[#16A34A] flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pressure slider */}
              <div className="space-y-4">
                <label className="text-sm text-black/60">How intense is your current pressure?</label>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={userData.pressureLevel}
                    onChange={(e) => setUserData(prev => ({ ...prev, pressureLevel: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-black/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#16A34A] [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-black/40">
                    <span>Low</span>
                    <span>Very high</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <Button
                onClick={() => setStep('tasks-input')}
                disabled={userData.goals.length === 0}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // SCREEN 5: TASKS INPUT
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'tasks-input') {
    const promptChips = [
      'Classes / lectures',
      'Deadlines',
      'Revisions',
      'Things I\'m avoiding',
      'Personal obligations',
    ];

    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="min-h-screen flex flex-col px-6 py-12">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="h-1 bg-black/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '54%' }}
                animate={{ width: '81%' }}
                className="h-full bg-[#16A34A]"
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-black/40 mt-2">Step 3 of 4</p>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 flex-1"
            >
              {/* Title */}
              <div className="space-y-3">
                <h1 className="tracking-tight text-3xl" style={{ letterSpacing: '-0.04em' }}>
                  What do you actually have to do tomorrow?
                </h1>
                <p className="text-black/60">Write or speak freely. We'll structure it.</p>
              </div>

              {/* Text input */}
              <div className="space-y-4">
                <textarea
                  value={tasksInput}
                  onChange={(e) => setTasksInput(e.target.value)}
                  placeholder="e.g. revise biology, finish assignment, attend class…"
                  className="w-full px-6 py-4 border-2 border-black/10 rounded-3xl bg-white focus:border-[#16A34A] focus:outline-none resize-none min-h-[160px]"
                />
                
                {/* OR divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-black/10" />
                  <span className="text-sm text-black/40">OR</span>
                  <div className="flex-1 h-px bg-black/10" />
                </div>

                {/* Voice button */}
                <Button
                  onClick={() => {
                    if (isRecording) {
                      handleFinishRecording();
                    } else {
                      handleStartRecording();
                    }
                  }}
                  variant="ghost"
                  className="w-full h-16 border-2 border-black/10 hover:border-black/20 rounded-3xl flex items-center justify-center gap-3"
                >
                  {isRecording ? (
                    <>
                      <Pause className="w-5 h-5 text-[#16A34A]" />
                      <span>Recording... {formatTime(recordingTime)}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      <span>Record voice instead</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Prompt chips */}
              <div className="space-y-3">
                <p className="text-sm text-black/40">Tap to insert ideas:</p>
                <div className="flex flex-wrap gap-2">
                  {promptChips.map((chip, index) => (
                    <button
                      key={index}
                      onClick={() => setTasksInput(prev => prev ? `${prev}, ${chip.toLowerCase()}` : chip.toLowerCase())}
                      className="px-4 py-2 border border-black/10 bg-black/[0.02] rounded-full text-sm text-black/60 hover:bg-black/5 transition-colors active:scale-95"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Microcopy */}
              <div className="p-4 border border-black/5 bg-black/[0.02] rounded-2xl">
                <p className="text-sm text-black/60 italic text-center">
                  Messy is fine. Don't organize anything yet.
                </p>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <Button
                onClick={extractTasksFromInput}
                disabled={!tasksInput.trim()}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // SCREEN 6: TASKS CLARIFICATION
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'tasks-clarification') {
    const groupedTasks = {
      classes: userData.tasks.filter(t => t.category === 'classes'),
      study: userData.tasks.filter(t => t.category === 'study'),
      work: userData.tasks.filter(t => t.category === 'work'),
      personal: userData.tasks.filter(t => t.category === 'personal'),
    };

    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="min-h-screen flex flex-col px-6 py-12">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="h-1 bg-black/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '81%' }}
                animate={{ width: '100%' }}
                className="h-full bg-[#16A34A]"
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-black/40 mt-2">Step 4 of 4</p>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 flex-1"
            >
              {/* Title */}
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#16A34A]/10 flex items-center justify-center mb-4">
                  <Check className="w-6 h-6 text-[#16A34A]" />
                </div>
                <h1 className="tracking-tight text-3xl" style={{ letterSpacing: '-0.04em' }}>
                  Here's what we understood.
                </h1>
                <p className="text-black/60">Review and adjust if needed</p>
              </div>

              {/* Grouped tasks */}
              <div className="space-y-6">
                {Object.entries(groupedTasks).map(([category, tasks]) => {
                  if (tasks.length === 0) return null;
                  return (
                    <div key={category} className="space-y-3">
                      <h3 className="text-sm text-black/40 uppercase tracking-wider">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            className={`p-4 rounded-2xl border-2 transition-all ${
                              task.mustDoTomorrow
                                ? 'border-[#16A34A]/30 bg-[#16A34A]/5'
                                : 'border-black/10 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleToggleMustDo(task.id)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                  task.mustDoTomorrow
                                    ? 'border-[#16A34A] bg-[#16A34A]'
                                    : 'border-black/20'
                                }`}
                              >
                                {task.mustDoTomorrow && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </button>
                              <span className="flex-1 text-sm">{task.title}</span>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-black/40" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="p-4 border border-black/5 bg-black/[0.02] rounded-2xl">
                <p className="text-xs text-black/60 text-center">
                  Check the tasks you <span className="font-medium">must do tomorrow</span>
                </p>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <Button
                onClick={() => setStep('ai-processing')}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <Sparkles className="w-5 h-5" />
                Build my ideal day
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // SCREEN 7: AI PROCESSING
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'ai-processing') {
    const steps = [
      'Understanding your priorities',
      'Estimating effort & energy',
      'Structuring a realistic schedule',
    ];

    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full space-y-12 text-center"
        >
          {/* Animated icon */}
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
              scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-[#16A34A]/20 to-[#16A34A]/5 flex items-center justify-center mx-auto"
          >
            <Sparkles className="w-10 h-10 text-[#16A34A]" />
          </motion.div>

          {/* Title */}
          <h2 className="tracking-tight text-2xl" style={{ letterSpacing: '-0.03em' }}>
            Designing your ideal day…
          </h2>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((stepText, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: processingStep > index ? 1 : 0.3,
                  x: 0,
                }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-4 rounded-2xl border border-black/10 bg-black/[0.02]"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    processingStep > index
                      ? 'bg-[#16A34A]'
                      : 'bg-black/10'
                  }`}
                >
                  {processingStep > index && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>
                <span
                  className={`text-sm transition-colors ${
                    processingStep > index ? 'text-black' : 'text-black/40'
                  }`}
                >
                  {stepText}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // SCREEN 8: IDEAL DAY (WOW)
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'ideal-day' && userData.dayPlan) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <div className="px-6 pt-12 pb-8 border-b border-black/5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 text-[#16A34A]">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm uppercase tracking-wider">AI Generated</span>
              </div>
              <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
                Here's your ideal day for tomorrow.
              </h1>
              <p className="text-black/60">{userData.dayPlan.date}</p>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="flex-1 px-6 py-8 pb-32 space-y-8">
            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h2 className="text-black/40 text-sm uppercase tracking-wider">Your schedule</h2>
              
              <div className="space-y-3">
                {userData.dayPlan.blocks.map((block, index) => (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className={`p-4 rounded-2xl border-2 flex items-center gap-4 ${
                      block.type === 'deepwork'
                        ? 'border-[#16A34A]/30 bg-[#16A34A]/5'
                        : block.type === 'class'
                        ? 'border-black/20 bg-black/5'
                        : 'border-black/10 bg-white'
                    }`}
                  >
                    {/* Time */}
                    <div className="text-right flex-shrink-0 w-20">
                      <div className="text-sm tracking-tight">{block.startTime}</div>
                      <div className="text-xs text-black/40">{block.endTime}</div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {block.isHighImpact && (
                          <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
                        )}
                        <h3 className="tracking-tight text-sm" style={{ letterSpacing: '-0.02em' }}>
                          {block.title}
                        </h3>
                      </div>
                      <p className="text-xs text-black/60 capitalize">{block.type}</p>
                    </div>

                    {/* Icon */}
                    {block.type === 'deepwork' && <Target className="w-4 h-4 text-[#16A34A]" />}
                    {block.type === 'class' && <Calendar className="w-4 h-4 text-black/40" />}
                    {block.type === 'break' && <Clock className="w-4 h-4 text-black/40" />}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Top 3 Priorities */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 border-2 border-[#16A34A]/20 bg-[#16A34A]/5 rounded-3xl space-y-4"
            >
              <h2 className="text-[#16A34A] text-sm uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4" />
                Your 3 priorities
              </h2>
              
              <div className="space-y-3">
                {userData.dayPlan.topPriorities.map((priority, index) => (
                  <div
                    key={index}
                    className="p-4 border border-[#16A34A]/20 bg-white rounded-2xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="tracking-tight text-sm mb-1" style={{ letterSpacing: '-0.02em' }}>
                          {priority.title}
                        </h3>
                        {priority.subject && (
                          <p className="text-xs text-black/60">{priority.subject}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-black/40">{priority.estimatedMinutes}m</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Micro-reassurance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 border border-black/5 bg-black/[0.02] rounded-3xl"
            >
              <p className="text-black/60 text-center italic">
                This is enough to make tomorrow a good day.
              </p>
            </motion.div>
          </div>

          {/* Fixed Bottom CTAs */}
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent border-t border-black/5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <Button
                onClick={() => setStep('calendar-sync')}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <Calendar className="w-5 h-5" />
                Sync to Google Calendar
              </Button>
              <div className="flex gap-3">
                <Button
                  onClick={() => setStep('success')}
                  variant="ghost"
                  className="flex-1 text-black/60 hover:bg-black/5 rounded-3xl h-14 active:scale-[0.98]"
                >
                  Start Focus now
                </Button>
                <Button
                  onClick={() => setStep('adjust')}
                  variant="ghost"
                  className="flex-1 text-black/60 hover:bg-black/5 rounded-3xl h-14 active:scale-[0.98]"
                >
                  Adjust
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // SCREEN 9: ADJUST (OPTIONAL)
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'adjust' && userData.dayPlan) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <div className="px-6 pt-12 pb-8 border-b border-black/5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <h1 className="tracking-tight text-2xl" style={{ letterSpacing: '-0.03em' }}>
                Adjust your plan
              </h1>
              <p className="text-black/60">Make quick changes before confirming</p>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="flex-1 px-6 py-8 pb-32 space-y-6">
            {/* AI Suggestions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex gap-3"
            >
              <button className="flex-1 px-4 py-3 border border-black/10 bg-black/[0.02] rounded-2xl text-sm text-black/60 hover:bg-black/5 transition-colors active:scale-95">
                Make it lighter
              </button>
              <button className="flex-1 px-4 py-3 border border-black/10 bg-black/[0.02] rounded-2xl text-sm text-black/60 hover:bg-black/5 transition-colors active:scale-95">
                More ambitious
              </button>
              <button className="flex-1 px-4 py-3 border border-black/10 bg-black/[0.02] rounded-2xl text-sm text-black/60 hover:bg-black/5 transition-colors active:scale-95">
                Add buffer
              </button>
            </motion.div>

            {/* Blocks (simplified, no actual drag-and-drop for demo) */}
            <div className="space-y-3">
              {userData.dayPlan.blocks.map((block, index) => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className="p-4 rounded-2xl border-2 border-black/10 bg-white hover:border-black/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-right flex-shrink-0 w-20">
                      <div className="text-sm tracking-tight">{block.startTime}</div>
                      <div className="text-xs text-black/40">{block.endTime}</div>
                    </div>
                    <div className="flex-1">
                      <h3 className="tracking-tight text-sm" style={{ letterSpacing: '-0.02em' }}>
                        {block.title}
                      </h3>
                    </div>
                    <button className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5">
                      <Edit2 className="w-4 h-4 text-black/60" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Fixed Bottom CTA */}
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent border-t border-black/5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <Button
                onClick={() => setStep('calendar-sync')}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98]"
              >
                Confirm plan
              </Button>
              <Button
                onClick={() => setStep('ideal-day')}
                variant="ghost"
                className="w-full text-black/60 hover:bg-black/5 rounded-3xl h-14 active:scale-[0.98]"
              >
                Back to overview
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // SCREEN 10: CALENDAR SYNC
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'calendar-sync') {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full space-y-12 text-center"
        >
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-[#16A34A]/10 flex items-center justify-center mx-auto">
            <Calendar className="w-10 h-10 text-[#16A34A]" />
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h2 className="tracking-tight text-3xl" style={{ letterSpacing: '-0.04em' }}>
              Sync your day
            </h2>
            <p className="text-black/60">
              We'll create events for your planned blocks.
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Button
              onClick={() => setStep('success')}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <Calendar className="w-5 h-5" />
              Connect Google Calendar
            </Button>
            <Button
              disabled
              variant="ghost"
              className="w-full text-black/40 rounded-3xl h-14 cursor-not-allowed"
            >
              Apple Calendar
              <span className="ml-2 text-xs">(Coming soon)</span>
            </Button>
          </div>

          {/* Skip */}
          <Button
            onClick={() => setStep('success')}
            variant="ghost"
            className="text-black/40 hover:bg-black/5 rounded-2xl h-12"
          >
            Skip for now
          </Button>
        </motion.div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // SCREEN 11: SUCCESS
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'success') {
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
              <CheckCircle2 className="w-12 h-12 text-[#16A34A]" />
            </div>

            <div className="space-y-4">
              <h2 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
                Your day is ready.
              </h2>
              <p className="text-black/60 text-lg">
                You can now focus without thinking.
              </p>
            </div>
          </motion.div>

          {/* Free plan badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-4 border border-[#16A34A]/20 bg-[#16A34A]/5 rounded-2xl"
          >
            <p className="text-sm text-[#16A34A] flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              Free plan activated
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <Button
              onClick={() => onComplete(userData)}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98]"
            >
              Start Focus
            </Button>
            <Button
              onClick={() => window.open('https://calendar.google.com', '_blank')}
              variant="ghost"
              className="w-full text-black/60 hover:bg-black/5 rounded-3xl h-14 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              View in Calendar
              <ExternalLink className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return null;
}
