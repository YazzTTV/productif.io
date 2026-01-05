import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { BackToHomeHeader } from './ui/BackToHomeHeader';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, CheckCircle2, AlertTriangle, ChevronRight, TrendingUp, Target, Shield } from 'lucide-react';

interface WeeklyExamStrategyProps {
  onExit: () => void;
}

type StrategyPhase = 'overview' | 'daily' | 'subject-detail' | 'anti-panic' | 'summary';

interface Subject {
  id: string;
  name: string;
  coefficient: number;
  examDate: string;
  daysUntilExam: number;
  examType: 'written' | 'oral' | 'practical';
  priority: 'primary' | 'secondary' | 'light';
  topicsToRevise: string[];
  estimatedHours: number;
  whyItMatters: string;
  howMuchIsEnough: string;
  progressPercentage: number;
}

interface DayPlan {
  day: string;
  date: string;
  subjects: {
    subjectId: string;
    type: 'heavy' | 'medium' | 'light' | 'consolidation';
    duration: number;
    topic: string;
  }[];
  totalLoad: 'heavy' | 'medium' | 'light';
  isRecoveryDay: boolean;
}

interface WeekProgress {
  subjectsCovered: number;
  focusHoursCompleted: number;
  tasksCompleted: number;
  weekQuality: 'excellent' | 'good' | 'moderate';
}

export function WeeklyExamStrategy({ onExit }: WeeklyExamStrategyProps) {
  const [phase, setPhase] = useState<StrategyPhase>('overview');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [isPanicMode, setIsPanicMode] = useState(false);

  // AI-Generated Weekly Strategy (3 core subjects max)
  const [coreSubjects, setCoreSubjects] = useState<Subject[]>([
    {
      id: '1',
      name: 'Organic Chemistry',
      coefficient: 5,
      examDate: 'March 15',
      daysUntilExam: 10,
      examType: 'written',
      priority: 'primary',
      topicsToRevise: ['Reaction mechanisms', 'Stereochemistry', 'Carbonyl compounds'],
      estimatedHours: 12,
      whyItMatters: 'This subject represents a major part of your grade. Covering these chapters this week will reduce last-minute stress.',
      howMuchIsEnough: '2 focused sessions covering mechanisms + 1 consolidation session for practice problems.',
      progressPercentage: 45,
    },
    {
      id: '2',
      name: 'Physics - Thermodynamics',
      coefficient: 4,
      examDate: 'March 18',
      daysUntilExam: 13,
      examType: 'written',
      priority: 'secondary',
      topicsToRevise: ['Laws of thermodynamics', 'Heat engines', 'Entropy'],
      estimatedHours: 8,
      whyItMatters: 'Building a solid foundation now means less cramming later. Focus on core concepts this week.',
      howMuchIsEnough: '1 deep review session + practice exercises to test understanding.',
      progressPercentage: 30,
    },
    {
      id: '3',
      name: 'Mathematics - Calculus',
      coefficient: 3,
      examDate: 'March 22',
      daysUntilExam: 17,
      examType: 'written',
      priority: 'light',
      topicsToRevise: ['Integration techniques', 'Differential equations basics'],
      estimatedHours: 6,
      whyItMatters: 'Light consolidation this week will keep momentum without overloading your schedule.',
      howMuchIsEnough: '1 review session + a few practice problems to maintain fluency.',
      progressPercentage: 60,
    },
  ]);

  // Weekly distribution (Monday to Sunday)
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>([
    {
      day: 'Monday',
      date: 'Mar 10',
      subjects: [
        { subjectId: '1', type: 'heavy', duration: 90, topic: 'Reaction mechanisms' },
        { subjectId: '2', type: 'medium', duration: 60, topic: 'Laws of thermodynamics' },
      ],
      totalLoad: 'heavy',
      isRecoveryDay: false,
    },
    {
      day: 'Tuesday',
      date: 'Mar 11',
      subjects: [
        { subjectId: '1', type: 'heavy', duration: 90, topic: 'Stereochemistry' },
        { subjectId: '3', type: 'light', duration: 45, topic: 'Integration techniques' },
      ],
      totalLoad: 'medium',
      isRecoveryDay: false,
    },
    {
      day: 'Wednesday',
      date: 'Mar 12',
      subjects: [
        { subjectId: '2', type: 'medium', duration: 60, topic: 'Heat engines' },
        { subjectId: '3', type: 'light', duration: 45, topic: 'Practice problems' },
      ],
      totalLoad: 'light',
      isRecoveryDay: true,
    },
    {
      day: 'Thursday',
      date: 'Mar 13',
      subjects: [
        { subjectId: '1', type: 'heavy', duration: 90, topic: 'Carbonyl compounds' },
      ],
      totalLoad: 'medium',
      isRecoveryDay: false,
    },
    {
      day: 'Friday',
      date: 'Mar 14',
      subjects: [
        { subjectId: '2', type: 'medium', duration: 60, topic: 'Entropy review' },
        { subjectId: '1', type: 'consolidation', duration: 60, topic: 'Practice exam questions' },
      ],
      totalLoad: 'medium',
      isRecoveryDay: false,
    },
    {
      day: 'Saturday',
      date: 'Mar 15',
      subjects: [
        { subjectId: '1', type: 'consolidation', duration: 90, topic: 'Full chapter review' },
      ],
      totalLoad: 'light',
      isRecoveryDay: false,
    },
    {
      day: 'Sunday',
      date: 'Mar 16',
      subjects: [
        { subjectId: '2', type: 'consolidation', duration: 60, topic: 'Consolidation' },
        { subjectId: '3', type: 'consolidation', duration: 45, topic: 'Light review' },
      ],
      totalLoad: 'light',
      isRecoveryDay: true,
    },
  ]);

  // End-of-week progress (for summary phase)
  const weekProgress: WeekProgress = {
    subjectsCovered: 3,
    focusHoursCompleted: 18,
    tasksCompleted: 12,
    weekQuality: 'good',
  };

  // Detect panic signals
  useEffect(() => {
    const totalHours = coreSubjects.reduce((sum, s) => sum + s.estimatedHours, 0);
    const heavyDays = weekPlan.filter(d => d.totalLoad === 'heavy').length;
    
    // Panic detection: too many hours OR too many heavy days
    if (totalHours > 30 || heavyDays > 3 || coreSubjects.length > 3) {
      setIsPanicMode(true);
    }
  }, [coreSubjects, weekPlan]);

  const selectedSubject = coreSubjects.find(s => s.id === selectedSubjectId);

  const handleViewSubjectDetail = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setPhase('subject-detail');
  };

  const handleReplanWeek = () => {
    // Simulate AI replanning (would call API in production)
    setPhase('overview');
  };

  // ━━━━━━━━━━━━━━━━━━━━━━
  // OVERVIEW SCREEN
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'overview') {
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
              <div className="flex items-center gap-2 text-black/40">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Week of March 10-16</span>
              </div>
              <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2.5rem' }}>
                This week, focus on what truly matters.
              </h1>
              <p className="text-black/60 text-lg">
                3 core subjects. Balanced effort. Built-in recovery.
              </p>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="flex-1 px-6 py-8 pb-32 space-y-8">
            {/* Core Subjects (max 3) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h2 className="text-black/40 text-sm uppercase tracking-wider">Core subjects this week</h2>
              
              <div className="space-y-4">
                {coreSubjects.map((subject, index) => (
                  <motion.button
                    key={subject.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    onClick={() => handleViewSubjectDetail(subject.id)}
                    className={`w-full p-6 rounded-3xl border-2 transition-all text-left hover:scale-[1.02] active:scale-[0.98] ${
                      subject.priority === 'primary'
                        ? 'border-[#16A34A]/30 bg-[#16A34A]/5'
                        : subject.priority === 'secondary'
                        ? 'border-black/20 bg-black/5'
                        : 'border-black/10 bg-white'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {subject.priority === 'primary' && (
                              <span className="px-2 py-1 bg-[#16A34A] text-white text-xs rounded-full">
                                Primary focus
                              </span>
                            )}
                            {subject.priority === 'secondary' && (
                              <span className="px-2 py-1 bg-black text-white text-xs rounded-full">
                                Secondary
                              </span>
                            )}
                            {subject.priority === 'light' && (
                              <span className="px-2 py-1 bg-black/10 text-black/60 text-xs rounded-full">
                                Light
                              </span>
                            )}
                            <span className="text-xs text-black/40">Coef {subject.coefficient}</span>
                          </div>
                          <h3 className="text-xl tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                            {subject.name}
                          </h3>
                          <p className="text-black/60 text-sm">{subject.examDate} • {subject.daysUntilExam} days</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-black/40" />
                      </div>

                      {/* Progress indicator */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-black/40">
                          <span>Progress</span>
                          <span>{subject.progressPercentage}%</span>
                        </div>
                        <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${subject.progressPercentage}%` }}
                            transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
                            className="h-full bg-[#16A34A] rounded-full"
                          />
                        </div>
                      </div>

                      {/* Effort this week */}
                      <div className="flex items-center gap-2 text-sm text-black/60">
                        <Clock className="w-4 h-4" />
                        <span>{subject.estimatedHours}h this week</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Weekly Overview Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 border border-black/10 bg-black/[0.02] rounded-3xl space-y-4"
            >
              <h3 className="text-black/40 text-sm uppercase tracking-wider">This week's structure</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-2xl tracking-tight mb-1" style={{ letterSpacing: '-0.03em' }}>
                    {coreSubjects.reduce((sum, s) => sum + s.estimatedHours, 0)}h
                  </div>
                  <div className="text-black/60 text-sm">Total focus time</div>
                </div>
                <div>
                  <div className="text-2xl tracking-tight mb-1" style={{ letterSpacing: '-0.03em' }}>
                    {weekPlan.filter(d => d.isRecoveryDay).length}
                  </div>
                  <div className="text-black/60 text-sm">Recovery days</div>
                </div>
              </div>

              <div className="pt-4 border-t border-black/5">
                <p className="text-black/60 text-sm italic text-center">
                  No day is overloaded. No subject is ignored.
                </p>
              </div>
            </motion.div>

            {/* Anti-panic safeguard message */}
            {isPanicMode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="p-6 border-2 border-amber-500/30 bg-amber-500/5 rounded-3xl"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                      Plan adjusted for sustainability
                    </h3>
                    <p className="text-black/60 text-sm">
                      The original plan was too ambitious. We've reduced scope to focus on exam-impact topics only.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Fixed Bottom CTA */}
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent border-t border-black/5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-3"
            >
              <Button
                onClick={() => setPhase('daily')}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98]"
              >
                View daily breakdown
              </Button>
              <Button
                onClick={onExit}
                variant="ghost"
                className="w-full text-black/60 hover:bg-black/5 rounded-3xl h-14 active:scale-[0.98]"
              >
                Back to dashboard
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // DAILY BREAKDOWN VIEW
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'daily') {
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
              <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2.5rem' }}>
                Day-by-day plan
              </h1>
              <p className="text-black/60 text-lg">
                Your week, optimized for sustainable progress.
              </p>
            </motion.div>
          </div>

          {/* Daily Cards */}
          <div className="flex-1 px-6 py-8 pb-32 space-y-4">
            {weekPlan.map((day, index) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className={`p-6 rounded-3xl border-2 ${
                  day.isRecoveryDay
                    ? 'border-[#16A34A]/20 bg-[#16A34A]/5'
                    : day.totalLoad === 'heavy'
                    ? 'border-black/20 bg-black/5'
                    : 'border-black/10 bg-white'
                }`}
              >
                <div className="space-y-4">
                  {/* Day header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                        {day.day}
                      </h3>
                      <p className="text-black/60 text-sm">{day.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {day.isRecoveryDay && (
                        <span className="px-3 py-1 bg-[#16A34A]/10 text-[#16A34A] text-xs rounded-full">
                          Recovery day
                        </span>
                      )}
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        day.totalLoad === 'heavy'
                          ? 'bg-black/10 text-black/60'
                          : day.totalLoad === 'medium'
                          ? 'bg-black/5 text-black/60'
                          : 'bg-black/[0.02] text-black/40'
                      }`}>
                        {day.totalLoad} load
                      </span>
                    </div>
                  </div>

                  {/* Sessions */}
                  <div className="space-y-3">
                    {day.subjects.map((session, idx) => {
                      const subject = coreSubjects.find(s => s.id === session.subjectId);
                      return (
                        <div
                          key={idx}
                          className="p-4 border border-black/10 bg-white rounded-2xl flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <h4 className="text-sm tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                              {subject?.name}
                            </h4>
                            <p className="text-xs text-black/60">{session.topic}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-black/60">{session.duration}m</div>
                            <div className={`text-xs ${
                              session.type === 'heavy' ? 'text-black/60' :
                              session.type === 'consolidation' ? 'text-[#16A34A]' :
                              'text-black/40'
                            }`}>
                              {session.type}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total for the day */}
                  <div className="pt-3 border-t border-black/5 flex items-center justify-between text-sm text-black/60">
                    <span>Total</span>
                    <span>{day.subjects.reduce((sum, s) => sum + s.duration, 0)}m</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Fixed Bottom CTA */}
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent border-t border-black/5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
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
  // SUBJECT DETAIL CARD
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'subject-detail' && selectedSubject) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <div className="px-6 pt-12 pb-8 border-b border-black/5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-xs rounded-full ${
                  selectedSubject.priority === 'primary'
                    ? 'bg-[#16A34A] text-white'
                    : selectedSubject.priority === 'secondary'
                    ? 'bg-black text-white'
                    : 'bg-black/10 text-black/60'
                }`}>
                  {selectedSubject.priority === 'primary' ? 'Primary focus' : 
                   selectedSubject.priority === 'secondary' ? 'Secondary' : 'Light'}
                </span>
                <span className="text-sm text-black/40">Coef {selectedSubject.coefficient}</span>
              </div>
              <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2.5rem' }}>
                {selectedSubject.name}
              </h1>
              <p className="text-black/60">
                {selectedSubject.examType} exam • {selectedSubject.examDate} ({selectedSubject.daysUntilExam} days)
              </p>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="flex-1 px-6 py-8 pb-32 space-y-8">
            {/* What to revise */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-black/40">
                <Target className="w-4 h-4" />
                <h2 className="text-sm uppercase tracking-wider">What to revise</h2>
              </div>
              <div className="space-y-3">
                {selectedSubject.topicsToRevise.map((topic, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="p-4 border border-black/10 bg-black/[0.02] rounded-2xl flex items-center gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
                    <span className="text-sm">{topic}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Why it matters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 border-2 border-[#16A34A]/20 bg-[#16A34A]/5 rounded-3xl space-y-3"
            >
              <div className="flex items-center gap-2 text-[#16A34A]">
                <TrendingUp className="w-4 h-4" />
                <h3 className="text-sm uppercase tracking-wider">Why it matters now</h3>
              </div>
              <p className="text-black/80">
                {selectedSubject.whyItMatters}
              </p>
            </motion.div>

            {/* How much is enough */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 border border-black/10 bg-white rounded-3xl space-y-3"
            >
              <div className="flex items-center gap-2 text-black/60">
                <CheckCircle2 className="w-4 h-4" />
                <h3 className="text-sm uppercase tracking-wider">How much is enough</h3>
              </div>
              <p className="text-black/80">
                {selectedSubject.howMuchIsEnough}
              </p>
            </motion.div>

            {/* Estimated effort */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 border border-black/5 bg-black/[0.02] rounded-3xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-black/60">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Effort this week</span>
                </div>
                <span className="text-2xl tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                  {selectedSubject.estimatedHours}h
                </span>
              </div>
            </motion.div>
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

  // ━━━━━━━━━━━━━━━━━━━━���━
  // END-OF-WEEK SUMMARY
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (phase === 'summary') {
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
                You focused on the essentials this week.
              </h2>
            </div>
          </motion.div>

          {/* What was covered */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <h3 className="text-black/40 text-sm uppercase tracking-wider">This week's progress</h3>
            
            <div className="p-6 border border-black/10 bg-black/[0.02] rounded-3xl space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-2xl tracking-tight mb-1" style={{ letterSpacing: '-0.03em' }}>
                    {weekProgress.focusHoursCompleted}h
                  </div>
                  <div className="text-black/60 text-sm">Focus time</div>
                </div>
                <div>
                  <div className="text-2xl tracking-tight mb-1" style={{ letterSpacing: '-0.03em' }}>
                    {weekProgress.subjectsCovered}
                  </div>
                  <div className="text-black/60 text-sm">Subjects</div>
                </div>
              </div>
            </div>

            {/* Subjects covered */}
            <div className="space-y-3">
              {coreSubjects.slice(0, 2).map((subject, index) => (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="p-4 border border-[#16A34A]/20 bg-[#16A34A]/5 rounded-2xl flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                  <span className="text-sm">{subject.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* What rolls over (if any) */}
          {coreSubjects.some(s => s.progressPercentage < 100) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="p-6 border border-black/5 bg-white rounded-3xl"
            >
              <p className="text-black/60 text-sm">
                {coreSubjects.filter(s => s.progressPercentage < 100).length} subject
                {coreSubjects.filter(s => s.progressPercentage < 100).length > 1 ? 's' : ''} will continue next week.
              </p>
            </motion.div>
          )}

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            <Button
              onClick={handleReplanWeek}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98]"
            >
              Plan next week
            </Button>
            <Button
              onClick={onExit}
              variant="ghost"
              className="w-full text-black/60 hover:bg-black/5 rounded-3xl h-14 active:scale-[0.98]"
            >
              Back to dashboard
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return null;
}