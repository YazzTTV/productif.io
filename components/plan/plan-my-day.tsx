"use client"

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
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
  Target,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
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

  // Simulated voice transcription
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setPhase('recording');
    setRecordingTime(0);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setTranscription(simulatedTranscription);
    setEditableTranscription(simulatedTranscription);
    setPhase('transcription');
  };

  const handleEditTranscription = () => {
    setPhase('transcription');
  };

  const handleConfirmTranscription = () => {
    setPhase('processing');
    // Simulate AI processing
    setTimeout(() => {
      generateDayPlan();
      setPhase('overview');
    }, 2000);
  };

  const generateDayPlan = () => {
    // Mock day plan
    const plan: DayPlan = {
      date: new Date().toISOString().split('T')[0],
      blocks: [
        {
          id: 'b1',
          startTime: '09:00',
          endTime: '10:30',
          title: 'Organic Chemistry - Chapter 12',
          type: 'deepwork',
          isHighImpact: true,
          linkedTaskIds: ['t1'],
        },
        {
          id: 'b2',
          startTime: '11:30',
          endTime: '12:00',
          title: 'Break',
          type: 'break',
        },
        {
          id: 'b3',
          startTime: '14:00',
          endTime: '15:30',
          title: 'Physics Lecture',
          type: 'class',
        },
        {
          id: 'b4',
          startTime: '16:15',
          endTime: '17:30',
          title: 'Thermodynamics Problem Set',
          type: 'deepwork',
          isHighImpact: true,
          linkedTaskIds: ['t2'],
        },
        {
          id: 'b5',
          startTime: '18:30',
          endTime: '19:30',
          title: 'Calculus Review',
          type: 'revision',
          isHighImpact: true,
        },
      ],
      tasks: [
        {
          id: 't1',
          title: 'Complete Chapter 12 Summary',
          subject: 'Organic Chemistry',
          priority: 'HIGH',
          estimatedMinutes: 90,
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
    if (checkExistingEvents) {
      setConflictsDetected(true);
      setPhase('conflicts');
    } else {
      performSync();
    }
  };

  const performSync = () => {
    setSyncedEventsCount(dayPlan?.blocks.length || 0);
    setPhase('success');
  };

  const topPriorities = dayPlan?.tasks.filter(t => t.priority === 'HIGH').slice(0, 3) || [];

  // Entry screen
  if (phase === 'entry') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-12 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-[#16A34A]/10 flex items-center justify-center mx-auto">
            <Sparkles className="w-10 h-10 text-[#16A34A]" />
          </div>

          <div className="space-y-4">
            <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
              Plan your day in 60 seconds
            </h1>
            <p className="text-black/60">Speak. We'll structure it.</p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleStartRecording}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-16 text-lg"
            >
              <Mic className="w-5 h-5 mr-2" />
              Record voice
            </Button>
            <Button
              onClick={() => {
                setTranscription(simulatedTranscription);
                setEditableTranscription(simulatedTranscription);
                setPhase('transcription');
              }}
              variant="ghost"
              className="w-full rounded-2xl h-14 text-black/60"
            >
              Type instead
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Recording screen
  if (phase === 'recording') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-md w-full space-y-12 text-center">
          <div className="space-y-4">
            <h2 className="tracking-tight text-xl" style={{ letterSpacing: '-0.03em' }}>
              Say everything you have tomorrow.
            </h2>
            <p className="text-black/60">Messy is fine.</p>
          </div>

          <div className="text-4xl tracking-tight text-[#16A34A]" style={{ letterSpacing: '-0.04em' }}>
            {formatTime(recordingTime)}
          </div>

          <div className="space-y-4">
            {isPaused ? (
              <Button
                onClick={() => setIsPaused(false)}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-16 text-lg"
              >
                Resume
              </Button>
            ) : (
              <Button
                onClick={() => setIsPaused(true)}
                variant="outline"
                className="w-full rounded-2xl h-16 text-lg"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
            )}
            <Button
              onClick={handleStopRecording}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-16 text-lg"
            >
              Stop & process
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Transcription screen
  if (phase === 'transcription') {
    return (
      <div className="min-h-screen bg-white py-12 px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="tracking-tight mb-2" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
              Review & edit
            </h2>
            <p className="text-black/60">Make any corrections before we structure your day.</p>
          </div>

          <textarea
            value={editableTranscription}
            onChange={(e) => setEditableTranscription(e.target.value)}
            className="w-full p-6 border border-black/5 rounded-2xl bg-white resize-none h-48 focus:outline-none focus:border-black/10 transition-colors"
            placeholder="Your day plan..."
          />

          <div className="flex gap-4">
            <Button
              onClick={handleConfirmTranscription}
              className="flex-1 bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-14"
            >
              Process
            </Button>
            <Button
              onClick={() => setPhase('entry')}
              variant="outline"
              className="rounded-2xl h-14"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Processing screen
  if (phase === 'processing') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-8">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-black/60"
          >
            Building today's structure…
          </motion.p>
          
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
                className="h-20 bg-black/5 rounded-2xl"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Overview screen
  if (phase === 'overview' && dayPlan) {
    return (
      <div className="min-h-screen bg-white py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="tracking-tight mb-2" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
                Today's structure
              </h1>
              <p className="text-black/60">Review and adjust if needed.</p>
            </div>
            <Button
              onClick={() => setPhase('adjust')}
              variant="outline"
              className="rounded-2xl"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Adjust
            </Button>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            {dayPlan.blocks.map((block, index) => (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-6 p-6 border border-black/5 rounded-2xl bg-white"
              >
                <div className="w-20 text-black/60 text-sm">
                  {block.startTime} - {block.endTime}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-black mb-1">{block.title}</p>
                  <span className="text-xs px-2 py-1 bg-black/5 text-black/60 rounded-full">
                    {block.type}
                  </span>
                  {block.isHighImpact && (
                    <span className="ml-2 text-xs px-2 py-1 bg-[#16A34A]/10 text-[#16A34A] rounded-full">
                      High impact
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tasks */}
          <div>
            <p className="text-black/60 mb-3">Tasks</p>
            <div className="space-y-2">
              {dayPlan.tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 border border-black/5 rounded-2xl bg-white flex items-center justify-between"
                >
                  <div>
                    <p className="text-black">{task.title}</p>
                    {task.subject && (
                      <p className="text-sm text-black/60">{task.subject}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-black/60">{task.estimatedMinutes} min</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.priority === 'HIGH' 
                        ? 'bg-[#16A34A]/10 text-[#16A34A]' 
                        : 'bg-black/5 text-black/60'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sync CTA */}
          <div className="pt-6 border-t border-black/5">
            <Button
              onClick={handleSyncToCalendar}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-14"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Sync to Google Calendar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success screen
  if (phase === 'success') {
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
              {syncedEventsCount} events synced to your calendar.
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

  // Adjust screen (simplified)
  if (phase === 'adjust') {
    return (
      <div className="min-h-screen bg-white py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
              Adjust schedule
            </h2>
            <Button
              onClick={() => setPhase('overview')}
              variant="ghost"
              className="rounded-2xl"
            >
              <X className="w-4 h-4 mr-2" />
              Done
            </Button>
          </div>
          <p className="text-black/60">Drag to reorder, click to edit.</p>
          {/* Simplified - would have drag & drop in production */}
          <div className="space-y-4">
            {dayPlan?.blocks.map((block) => (
              <div
                key={block.id}
                className="p-6 border border-black/5 rounded-2xl bg-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{block.title}</p>
                    <p className="text-sm text-black/60">{block.startTime} - {block.endTime}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-xl">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Sync screens (simplified)
  if (phase === 'sync-choice' || phase === 'permissions' || phase === 'conflicts') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#16A34A]/10 flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8 text-[#16A34A]" />
          </div>
          <div>
            <h2 className="tracking-tight mb-2" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
              {phase === 'conflicts' ? 'Resolve conflicts' : 'Sync to calendar'}
            </h2>
            <p className="text-black/60">
              {phase === 'conflicts' 
                ? 'Some events conflict with your plan.' 
                : 'Connect your Google Calendar to sync events.'}
            </p>
          </div>
          {phase === 'sync-choice' && (
            <Button
              onClick={handleGoogleCalendarSync}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-14"
            >
              Connect Google Calendar
            </Button>
          )}
          {phase === 'permissions' && (
            <Button
              onClick={handleConnectGoogleCalendar}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-14"
            >
              Authorize
            </Button>
          )}
          {phase === 'conflicts' && (
            <div className="space-y-3">
              <div className="p-4 border border-black/5 rounded-2xl bg-white text-left">
                <p className="text-sm text-black/60">3 conflicts detected</p>
              </div>
              <Button
                onClick={performSync}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-14"
              >
                Resolve & sync
              </Button>
            </div>
          )}
          <Button
            onClick={() => setPhase('overview')}
            variant="ghost"
            className="w-full rounded-2xl h-12 text-black/60"
          >
            Skip
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

