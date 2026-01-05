import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { BackToHomeHeader } from './ui/BackToHomeHeader';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Pause, 
  Check, 
  RefreshCw, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Edit2,
  Sparkles,
  CheckCircle2,
  Plus,
  ArrowRight,
  Shield,
  AlertCircle,
  ExternalLink,
  MoveVertical,
  Target
} from 'lucide-react';

interface PlanMyDayProps {
  onComplete: () => void;
  onBack: () => void;
}

type PlanPhase = 
  | 'entry' 
  | 'recording' 
  | 'transcription' 
  | 'processing' 
  | 'overview' 
  | 'adjust' 
  | 'sync-choice' 
  | 'permissions' 
  | 'conflicts' 
  | 'success';

interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  type: 'class' | 'deepwork' | 'admin' | 'break' | 'revision' | 'meal';
  isHighImpact?: boolean;
  linkedTaskIds?: string[];
}

interface Task {
  id: string;
  title: string;
  subject?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedMinutes: number;
  dueDate?: string;
}

interface DayPlan {
  date: string;
  blocks: TimeBlock[];
  tasks: Task[];
}

export function PlanMyDay({ onComplete, onBack }: PlanMyDayProps) {
  const [phase, setPhase] = useState<PlanPhase>('entry');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [editableTranscription, setEditableTranscription] = useState('');
  const [processingStep, setProcessingStep] = useState(0);
  const [dayPlan, setDayPlan] = useState<DayPlan | null>(null);
  const [conflictsDetected, setConflictsDetected] = useState(false);
  const [checkExistingEvents, setCheckExistingEvents] = useState(true);
  const [syncedEventsCount, setSyncedEventsCount] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Simulated voice transcription (in production, would use Web Speech API or backend)
  const simulatedTranscription = "I have organic chemistry at 9am tomorrow. Need to finish the chapter 12 summary before the exam next week. Physics lecture at 2pm. I keep avoiding the thermodynamics problem set. Want to review calculus in the evening when I have more energy. Also need to organize my study materials.";

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
    if (phase === 'processing') {
      const steps = [
        { step: 0, delay: 0 },
        { step: 1, delay: 800 },
        { step: 2, delay: 1600 },
        { step: 3, delay: 2400 },
      ];

      steps.forEach(({ step, delay }) => {
        setTimeout(() => {
          setProcessingStep(step);
          if (step === 3) {
            // Generate the plan
            generateDayPlan();
            setTimeout(() => {
              setPhase('overview');
            }, 500);
          }
        }, delay);
      });
    }
  }, [phase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    setPhase('recording');
  };

  const handlePauseRecording = () => {
    setIsPaused(!isPaused);
  };

  const handleFinishRecording = () => {
    setIsRecording(false);
    setTranscription(simulatedTranscription);
    setEditableTranscription(simulatedTranscription);
    setPhase('transcription');
  };

  const handleRedoRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setTranscription('');
    setPhase('entry');
  };

  const handleGeneratePlan = () => {
    setPhase('processing');
  };

  const generateDayPlan = () => {
    // AI-generated plan based on transcription
    const plan: DayPlan = {
      date: 'Tomorrow, March 11',
      blocks: [
        {
          id: 'b1',
          startTime: '09:00',
          endTime: '11:00',
          title: 'Organic Chemistry Class',
          type: 'class',
          linkedTaskIds: [],
        },
        {
          id: 'b2',
          startTime: '11:15',
          endTime: '12:45',
          title: 'Deep Work: Chapter 12 Summary',
          type: 'deepwork',
          isHighImpact: true,
          linkedTaskIds: ['t1'],
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
          endTime: '17:30',
          title: 'Thermodynamics Problem Set',
          type: 'deepwork',
          isHighImpact: true,
          linkedTaskIds: ['t2'],
        },
        {
          id: 'b6',
          startTime: '17:30',
          endTime: '18:00',
          title: 'Break & Organize Materials',
          type: 'break',
          linkedTaskIds: ['t3'],
        },
        {
          id: 'b7',
          startTime: '18:30',
          endTime: '19:30',
          title: 'Calculus Review',
          type: 'revision',
          isHighImpact: true,
          linkedTaskIds: [],
        },
        {
          id: 'b8',
          startTime: '20:00',
          endTime: '20:30',
          title: 'Light Review & Tomorrow Prep',
          type: 'admin',
        },
      ],
      tasks: [
        {
          id: 't1',
          title: 'Complete Chapter 12 Summary',
          subject: 'Organic Chemistry',
          priority: 'HIGH',
          estimatedMinutes: 90,
          dueDate: 'March 15',
        },
        {
          id: 't2',
          title: 'Thermodynamics Problem Set',
          subject: 'Physics',
          priority: 'HIGH',
          estimatedMinutes: 75,
        },
        {
          id: 't3',
          title: 'Organize Study Materials',
          priority: 'MEDIUM',
          estimatedMinutes: 30,
        },
      ],
    };

    setDayPlan(plan);
  };

  const handleSyncToCalendar = () => {
    setPhase('sync-choice');
  };

  const handleGoogleCalendarSync = () => {
    setPhase('permissions');
  };

  const handleConnectGoogleCalendar = () => {
    // In production, would trigger OAuth flow
    if (checkExistingEvents) {
      // Simulate conflict detection
      setConflictsDetected(true);
      setPhase('conflicts');
    } else {
      // Go straight to success
      performSync();
    }
  };

  const performSync = () => {
    setSyncedEventsCount(dayPlan?.blocks.length || 0);
    setPhase('success');
  };

  const handleResolveConflict = (action: 'move' | 'shorten' | 'keep') => {
    // Handle conflict resolution
    // For demo, just proceed to success
    performSync();
  };

  const topPriorities = dayPlan?.tasks.filter(t => t.priority === 'HIGH').slice(0, 3) || [];

  // ━━━━━━━━━━━━━━━━━━━━━━
  // SCREEN 1: ENTRY
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'entry') {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full space-y-12 text-center"
          >
            {/* Icon */}
            <div className="w-20 h-20 rounded-full bg-[#16A34A]/10 flex items-center justify-center mx-auto">
              <Sparkles className="w-10 h-10 text-[#16A34A]" />
            </div>

            {/* Title */}
            <div className="space-y-4">
              <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2.5rem' }}>
                Plan your day in 60 seconds
              </h1>
              <p className="text-black/60 text-lg">
                Speak. We'll structure it.
              </p>
            </div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <Button
                onClick={handleStartRecording}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <Mic className="w-5 h-5" />
                Record voice
              </Button>
              <Button
                onClick={() => {
                  setTranscription(simulatedTranscription);
                  setEditableTranscription(simulatedTranscription);
                  setPhase('transcription');
                }}
                variant="ghost"
                className="w-full text-black/60 hover:bg-black/5 rounded-3xl h-14 active:scale-[0.98]"
              >
                Type instead
              </Button>
            </motion.div>

            {/* Exit */}
            <Button
              onClick={onBack}
              variant="ghost"
              className="text-black/40 hover:bg-black/5 rounded-2xl h-12"
            >
              Back
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // SCREEN 2: RECORDING
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'recording') {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="min-h-screen flex flex-col px-6 py-12">
          {/* Header */}
          <div className="text-center space-y-4 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <h2 className="tracking-tight text-2xl" style={{ letterSpacing: '-0.03em' }}>
                Say everything you have tomorrow.
              </h2>
              <p className="text-black/60">Messy is fine.</p>
            </motion.div>

            {/* Timer */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="text-4xl tracking-tight text-[#16A34A]"
              style={{ letterSpacing: '-0.04em' }}
            >
              {formatTime(recordingTime)}
            </motion.div>
          </div>

          {/* Waveform animation (simulated) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-1 flex items-center justify-center mb-12"
          >
            <div className="flex items-center gap-2 h-32">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 bg-[#16A34A]/30 rounded-full"
                  animate={{
                    height: isPaused ? '20%' : ['20%', '80%', '40%', '100%', '30%'],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.05,
                    ease: 'easeInOut',
                  }}
                  style={{ height: '20%' }}
                />
              ))}
            </div>
          </motion.div>

          {/* Prompt chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3 mb-12"
          >
            <p className="text-black/40 text-sm text-center">Tap to insert ideas:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                'Classes / lectures',
                'Deadlines',
                'What you must finish',
                'What you keep avoiding',
                'Energy levels',
              ].map((prompt, index) => (
                <button
                  key={index}
                  className="px-4 py-2 border border-black/10 bg-black/[0.02] rounded-full text-sm text-black/60 hover:bg-black/5 transition-colors active:scale-95"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="flex gap-3">
              <Button
                onClick={handlePauseRecording}
                variant="ghost"
                className="flex-1 h-14 rounded-3xl border-2 border-black/10 hover:bg-black/5 active:scale-[0.98]"
              >
                <Pause className="w-5 h-5 mr-2" />
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button
                onClick={handleFinishRecording}
                className="flex-1 bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 shadow-lg shadow-[#16A34A]/30 active:scale-[0.98]"
              >
                Finish
              </Button>
            </div>
            <Button
              onClick={handleRedoRecording}
              variant="ghost"
              className="w-full text-black/40 hover:bg-black/5 rounded-2xl h-12 text-sm active:scale-[0.98]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Redo
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // SCREEN 3: TRANSCRIPTION REVIEW
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'transcription') {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="min-h-screen flex flex-col px-6 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2 mb-12"
          >
            <div className="w-12 h-12 rounded-full bg-[#16A34A]/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-[#16A34A]" />
            </div>
            <h2 className="tracking-tight text-3xl" style={{ letterSpacing: '-0.04em' }}>
              We got it.
            </h2>
          </motion.div>

          {/* Transcription card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 mb-12"
          >
            <div className="p-6 border-2 border-black/10 rounded-3xl bg-black/[0.02] relative">
              <textarea
                value={editableTranscription}
                onChange={(e) => setEditableTranscription(e.target.value)}
                className="w-full bg-transparent text-black/80 resize-none focus:outline-none min-h-[200px]"
                placeholder="Your transcription appears here..."
              />
              <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-black/10 flex items-center justify-center hover:bg-black/5 transition-colors">
                <Edit2 className="w-4 h-4 text-black/60" />
              </button>
            </div>
            <p className="text-black/40 text-sm text-center mt-4">
              You can edit if needed
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <Button
              onClick={handleGeneratePlan}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <Sparkles className="w-5 h-5" />
              Generate my ideal day
            </Button>
            <Button
              onClick={handleRedoRecording}
              variant="ghost"
              className="w-full text-black/60 hover:bg-black/5 rounded-3xl h-14 active:scale-[0.98]"
            >
              Record again
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // SCREEN 4: AI PROCESSING
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'processing') {
    const steps = [
      'Extracting tasks',
      'Prioritizing by impact + time + energy',
      'Scheduling realistic blocks',
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
            Building your ideal day…
          </h2>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
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
                  {step}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // SCREEN 5: IDEAL DAY OVERVIEW
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'overview' && dayPlan) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="min-h-screen flex flex-col">
          {/* Header with Back Button */}
          <BackToHomeHeader
            onBack={onBack}
            title="Your Ideal Day"
            subtitle={dayPlan.date}
            icon={<Sparkles className="w-5 h-5 text-[#16A34A]" />}
          />

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
                {dayPlan.blocks.map((block, index) => (
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
                Your 3 high-impact tasks
              </h2>
              
              <div className="space-y-3">
                {topPriorities.map((task, index) => (
                  <div
                    key={task.id}
                    className="p-4 border border-[#16A34A]/20 bg-white rounded-2xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="tracking-tight text-sm mb-1" style={{ letterSpacing: '-0.02em' }}>
                          {task.title}
                        </h3>
                        {task.subject && (
                          <p className="text-xs text-black/60">{task.subject}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="px-2 py-1 bg-[#16A34A] text-white text-xs rounded-full">
                          {task.priority}
                        </span>
                        <p className="text-xs text-black/40 mt-1">{task.estimatedMinutes}m</p>
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
                This covers what matters. Nothing more, nothing less.
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
                onClick={handleSyncToCalendar}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <Calendar className="w-5 h-5" />
                Sync to Google Calendar
              </Button>
              <div className="flex gap-3">
                <Button
                  onClick={() => {/* Start focus */}}
                  variant="ghost"
                  className="flex-1 text-black/60 hover:bg-black/5 rounded-3xl h-14 active:scale-[0.98]"
                >
                  Start Focus now
                </Button>
                <Button
                  onClick={() => setPhase('adjust')}
                  variant="ghost"
                  className="flex-1 text-black/60 hover:bg-black/5 rounded-3xl h-14 active:scale-[0.98]"
                >
                  Adjust plan
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // SCREEN 6: ADJUST PLAN
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'adjust' && dayPlan) {
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
              <p className="text-black/60">Make quick changes before syncing</p>
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
            </motion.div>

            {/* Editable blocks */}
            <div className="space-y-3">
              {dayPlan.blocks.map((block, index) => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className="p-4 rounded-2xl border-2 border-black/10 bg-white hover:border-black/20 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    {/* Drag handle */}
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoveVertical className="w-4 h-4 text-black/40" />
                    </button>

                    {/* Time */}
                    <div className="text-right flex-shrink-0 w-20">
                      <div className="text-sm tracking-tight">{block.startTime}</div>
                      <div className="text-xs text-black/40">{block.endTime}</div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="tracking-tight text-sm" style={{ letterSpacing: '-0.02em' }}>
                        {block.title}
                      </h3>
                    </div>

                    {/* Edit button */}
                    <button className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/5">
                      <Edit2 className="w-4 h-4 text-black/60" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Add block */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="w-full p-4 border-2 border-dashed border-black/10 rounded-2xl text-black/40 hover:border-black/20 hover:text-black/60 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add task
            </motion.button>
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
                onClick={handleSyncToCalendar}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98]"
              >
                Confirm & Sync
              </Button>
              <Button
                onClick={() => setPhase('overview')}
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
  // SCREEN 7: SYNC CHOICE
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'sync-choice') {
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
              We create events for your time blocks. You can edit anytime.
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Button
              onClick={handleGoogleCalendarSync}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <Calendar className="w-5 h-5" />
              Continue with Google
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
            onClick={() => setPhase('overview')}
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
  // SCREEN 8: PERMISSIONS
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'permissions') {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full space-y-12"
        >
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-[#16A34A]/10 flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-[#16A34A]" />
          </div>

          {/* Title */}
          <div className="space-y-3 text-center">
            <h2 className="tracking-tight text-2xl" style={{ letterSpacing: '-0.03em' }}>
              What we'll do
            </h2>
          </div>

          {/* Permissions list */}
          <div className="space-y-4">
            <div className="p-4 border border-black/10 bg-black/[0.02] rounded-2xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#16A34A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-[#16A34A]" />
              </div>
              <div>
                <h3 className="text-sm tracking-tight mb-1" style={{ letterSpacing: '-0.02em' }}>
                  Create events for tomorrow's plan
                </h3>
                <p className="text-xs text-black/60">
                  Each time block becomes a calendar event
                </p>
              </div>
            </div>

            {/* Optional toggle */}
            <div className="p-4 border border-black/10 bg-white rounded-2xl">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkExistingEvents}
                  onChange={(e) => setCheckExistingEvents(e.target.checked)}
                  className="w-5 h-5 rounded border-black/20 text-[#16A34A] focus:ring-[#16A34A] mt-0.5"
                />
                <div className="flex-1">
                  <h3 className="text-sm tracking-tight mb-1" style={{ letterSpacing: '-0.02em' }}>
                    Avoid conflicts by checking my calendar
                  </h3>
                  <p className="text-xs text-black/60">
                    We'll read your existing events to prevent overlaps
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Privacy note */}
          <div className="p-4 border border-black/5 bg-black/[0.02] rounded-2xl text-center">
            <p className="text-sm text-black/60">
              <Shield className="w-4 h-4 inline mr-1" />
              We never share your data.
            </p>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Button
              onClick={handleConnectGoogleCalendar}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98]"
            >
              Connect Google Calendar
            </Button>
            <Button
              onClick={() => setPhase('sync-choice')}
              variant="ghost"
              className="w-full text-black/60 hover:bg-black/5 rounded-3xl h-14 active:scale-[0.98]"
            >
              Back
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // SCREEN 9: CONFLICTS
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'conflicts' && dayPlan) {
    // Simulated conflict
    const conflict = {
      existingEvent: {
        time: '11:00 - 12:00',
        title: 'Team Meeting',
      },
      proposedBlock: dayPlan.blocks[1], // Deep Work block
    };

    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="min-h-screen flex flex-col px-6 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 mb-12"
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="tracking-tight text-2xl text-center" style={{ letterSpacing: '-0.03em' }}>
              Conflicts found
            </h2>
            <p className="text-black/60 text-center">
              We found 1 overlap with your existing calendar
            </p>
          </motion.div>

          {/* Conflict card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 mb-12 space-y-6"
          >
            <div className="p-6 border-2 border-amber-500/20 bg-amber-500/5 rounded-3xl space-y-6">
              {/* Existing event */}
              <div>
                <p className="text-xs text-black/40 uppercase tracking-wider mb-2">Existing event</p>
                <div className="p-4 border border-black/10 bg-white rounded-2xl">
                  <div className="text-sm tracking-tight mb-1" style={{ letterSpacing: '-0.02em' }}>
                    {conflict.existingEvent.title}
                  </div>
                  <div className="text-xs text-black/60">{conflict.existingEvent.time}</div>
                </div>
              </div>

              {/* Proposed block */}
              <div>
                <p className="text-xs text-black/40 uppercase tracking-wider mb-2">Proposed block</p>
                <div className="p-4 border border-[#16A34A]/20 bg-[#16A34A]/5 rounded-2xl">
                  <div className="text-sm tracking-tight mb-1" style={{ letterSpacing: '-0.02em' }}>
                    {conflict.proposedBlock.title}
                  </div>
                  <div className="text-xs text-black/60">
                    {conflict.proposedBlock.startTime} - {conflict.proposedBlock.endTime}
                  </div>
                </div>
              </div>

              {/* AI suggestion */}
              <div className="p-4 border border-black/5 bg-white rounded-2xl">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-black/80">
                    <span className="font-medium">Best option:</span> Move Deep Work to 16:00.
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => handleResolveConflict('move')}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 active:scale-[0.98]"
              >
                Move the task
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleResolveConflict('shorten')}
                  variant="ghost"
                  className="text-black/60 hover:bg-black/5 rounded-2xl h-12 active:scale-[0.98]"
                >
                  Shorten block
                </Button>
                <Button
                  onClick={() => handleResolveConflict('keep')}
                  variant="ghost"
                  className="text-black/60 hover:bg-black/5 rounded-2xl h-12 active:scale-[0.98]"
                >
                  Keep both
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // SCREEN 10: SUCCESS
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'success' && dayPlan) {
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
                Your day is scheduled.
              </h2>
              <p className="text-black/60 text-lg">
                {syncedEventsCount} events created in Google Calendar
              </p>
            </div>
          </motion.div>

          {/* Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 border border-black/10 bg-black/[0.02] rounded-3xl space-y-3"
          >
            <h3 className="text-black/40 text-sm uppercase tracking-wider">Tomorrow's highlights</h3>
            <div className="space-y-2">
              {dayPlan.blocks.slice(0, 3).map((block, index) => (
                <div
                  key={block.id}
                  className="flex items-center gap-3 text-left text-sm"
                >
                  <Clock className="w-4 h-4 text-black/40 flex-shrink-0" />
                  <span className="text-black/60">{block.startTime}</span>
                  <span className="text-black/80">{block.title}</span>
                </div>
              ))}
              {dayPlan.blocks.length > 3 && (
                <p className="text-xs text-black/40 text-center pt-2">
                  +{dayPlan.blocks.length - 3} more events
                </p>
              )}
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <Button
              onClick={() => {/* Start focus */}}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98]"
            >
              Start Focus
            </Button>
            <div className="flex gap-3">
              <Button
                onClick={() => window.open('https://calendar.google.com', '_blank')}
                variant="ghost"
                className="flex-1 text-black/60 hover:bg-black/5 rounded-3xl h-14 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                View in Calendar
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setPhase('entry')}
                variant="ghost"
                className="flex-1 text-black/60 hover:bg-black/5 rounded-3xl h-14 active:scale-[0.98]"
              >
                Plan another day
              </Button>
            </div>
          </motion.div>

          {/* Exit */}
          <Button
            onClick={onComplete}
            variant="ghost"
            className="text-black/40 hover:bg-black/5 rounded-2xl h-12"
          >
            Done
          </Button>
        </div>
      </motion.div>
    );
  }

  return null;
}