import { useState } from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { ArrowLeft, Calendar, Focus, ListCheck, BookOpen, GraduationCap, CheckSquare, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AIAgentConductorProps {
  onNavigate: (screen: string) => void;
  userName: string;
}

type AgentView = 'main' | 'plan-loading' | 'plan-result' | 'habits' | 'journal' | 'journal-complete';

export function AIAgentConductor({ onNavigate, userName }: AIAgentConductorProps) {
  const [view, setView] = useState<AgentView>('main');
  const [stressLevel, setStressLevel] = useState(50);
  const [energyLevel, setEnergyLevel] = useState(50);
  const [habits, setHabits] = useState({
    morning: false,
    midday: false,
    evening: false,
  });

  // Plan my day flow
  const handlePlanDay = () => {
    onNavigate('plan');
  };

  const handleConfirmPlan = () => {
    onNavigate('dashboard');
  };

  // Start focus flow
  const handleStartFocus = () => {
    onNavigate('focus');
  };

  // Main screen
  if (view === 'main') {
    const actions = [
      {
        id: 'focus',
        icon: Focus,
        label: 'Start focus',
        action: handleStartFocus,
      },
      {
        id: 'exam',
        icon: GraduationCap,
        label: 'Exam Mode',
        action: () => onNavigate('exam'),
      },
      {
        id: 'tasks',
        icon: CheckSquare,
        label: 'Your Tasks',
        subtitle: 'Organized by subject and impact.',
        action: () => onNavigate('tasks'),
      },
      {
        id: 'habits',
        icon: ListCheck,
        label: 'Review habits',
        action: () => onNavigate('habits'),
      },
      {
        id: 'plan',
        icon: Calendar,
        label: 'Plan my day',
        action: handlePlanDay,
      },
      {
        id: 'journal',
        icon: BookOpen,
        label: 'Daily journal',
        action: () => onNavigate('journal'),
      },
    ];

    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="px-6 pt-12 pb-8 border-b border-black/5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('dashboard')}
            className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors shadow-sm mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          <div className="space-y-3">
            <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
              Your system is ready.
            </h1>
            <p className="text-black/60">
              Today is structured for deep work.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-6 pt-8 pb-8 space-y-4">
          {actions.map((action, index) => (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.action}
              className="w-full p-8 border border-black/10 rounded-3xl bg-white hover:bg-black/5 transition-all flex items-center gap-6 shadow-sm hover:shadow-md group"
            >
              <div className="w-14 h-14 rounded-2xl bg-black/5 flex items-center justify-center group-hover:bg-[#16A34A]/10 transition-colors">
                <action.icon className="w-6 h-6 text-black/80 group-hover:text-[#16A34A] transition-colors" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-xl tracking-tight block" style={{ letterSpacing: '-0.03em' }}>
                  {action.label}
                </span>
                {action.subtitle && (
                  <p className="text-sm text-black/60 mt-1">
                    {action.subtitle}
                  </p>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // Plan my day - Loading
  if (view === 'plan-loading') {
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
          
          {/* Skeleton UI */}
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
                className="h-20 bg-black/5 rounded-3xl"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Plan my day - Result
  if (view === 'plan-result') {
    return (
      <div className="min-h-screen bg-white pb-24">
        <div className="px-6 pt-12 pb-8 border-b border-black/5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView('main')}
            className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors shadow-sm mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
            Today's structure
          </h1>
        </div>

        <div className="px-6 pt-8 space-y-6">
          {/* Main priority */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-black/60 mb-3">Main priority</p>
            <div className="p-8 border-2 border-[#16A34A]/20 bg-[#16A34A]/5 rounded-3xl">
              <div className="space-y-3">
                <h3 className="text-xl tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                  Complete Chapter 12 Summary
                </h3>
                <p className="text-black/60">Organic Chemistry</p>
                <div className="flex items-center gap-2 text-black/60 pt-2">
                  <span>09:00 - 10:30</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-black/60 mb-3">Scheduled</p>
            <div className="space-y-3">
              <div className="p-6 border border-black/5 rounded-3xl bg-white">
                <p className="mb-1">Review lecture notes</p>
                <p className="text-black/60">11:00 - 11:30</p>
              </div>
              <div className="p-6 border border-black/5 rounded-3xl bg-white">
                <p className="mb-1">Practice exercises</p>
                <p className="text-black/60">14:00 - 14:45</p>
              </div>
            </div>
          </motion.div>

          {/* Habits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-black/60 mb-3">Habits</p>
            <div className="space-y-3">
              <div className="p-6 border border-black/5 rounded-3xl bg-white flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-black/20" />
                <span>Morning review</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-black/5 p-6"
        >
          <Button
            onClick={handleConfirmPlan}
            className="w-full max-w-md mx-auto bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98]"
          >
            Confirm and start
          </Button>
        </motion.div>
      </div>
    );
  }

  // Review habits
  if (view === 'habits') {
    const habitsList = [
      { id: 'morning', label: 'Morning review', time: '07:00' },
      { id: 'midday', label: 'Midday reset', time: '13:00' },
      { id: 'evening', label: 'Evening reflection', time: '20:00' },
    ];

    return (
      <div className="min-h-screen bg-white pb-24">
        <div className="px-6 pt-12 pb-8 border-b border-black/5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView('main')}
            className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors shadow-sm mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          <div className="space-y-3">
            <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
              Habits
            </h1>
            <p className="text-black/60">
              Consistency matters more than intensity.
            </p>
          </div>
        </div>

        <div className="px-6 pt-8 space-y-4">
          {habitsList.map((habit, index) => (
            <motion.button
              key={habit.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setHabits({ ...habits, [habit.id]: !habits[habit.id as keyof typeof habits] })}
              className={`w-full p-6 border rounded-3xl transition-all flex items-center justify-between ${
                habits[habit.id as keyof typeof habits]
                  ? 'border-[#16A34A] bg-[#16A34A]/5'
                  : 'border-black/5 hover:border-black/10'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  habits[habit.id as keyof typeof habits]
                    ? 'border-[#16A34A] bg-[#16A34A]'
                    : 'border-black/20'
                }`}>
                  {habits[habit.id as keyof typeof habits] && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-3 h-3 rounded-full bg-white"
                    />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-medium">{habit.label}</p>
                  <p className="text-black/40">{habit.time}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Anti-habits */}
        <div className="px-6 pt-12">
          <p className="text-black/60 mb-4">Avoid</p>
          <div className="space-y-3">
            <div className="p-6 border border-black/5 rounded-3xl bg-black/5">
              <p className="text-black/60">Social media before 10:00</p>
            </div>
            <div className="p-6 border border-black/5 rounded-3xl bg-black/5">
              <p className="text-black/60">Work after 22:00</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Daily journal
  if (view === 'journal') {
    return (
      <div className="min-h-screen bg-white pb-24">
        <div className="px-6 pt-12 pb-8 border-b border-black/5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView('main')}
            className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors shadow-sm mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
            How did today feel?
          </h1>
        </div>

        <div className="px-6 pt-12 space-y-12">
          {/* Stress slider */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center">
              <p className="text-lg">Stress</p>
              <span className="text-black/40">
                {stressLevel < 33 ? 'Low' : stressLevel < 66 ? 'Moderate' : 'High'}
              </span>
            </div>
            <Slider
              value={[stressLevel]}
              onValueChange={([value]) => setStressLevel(value)}
              max={100}
              step={1}
              className="py-6"
            />
          </motion.div>

          {/* Energy slider */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center">
              <p className="text-lg">Energy</p>
              <span className="text-black/40">
                {energyLevel < 33 ? 'Low' : energyLevel < 66 ? 'Moderate' : 'High'}
              </span>
            </div>
            <Slider
              value={[energyLevel]}
              onValueChange={([value]) => setEnergyLevel(value)}
              max={100}
              step={1}
              className="py-6"
            />
          </motion.div>

          {/* Optional note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <p className="text-black/60">Optional note</p>
            <textarea
              placeholder="One thought (optional)"
              className="w-full p-6 border border-black/5 rounded-3xl bg-white resize-none h-32 focus:outline-none focus:border-black/10 transition-colors"
              maxLength={120}
            />
            <p className="text-black/40 text-right">Max 120 characters</p>
          </motion.div>
        </div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-black/5 p-6"
        >
          <Button
            onClick={() => setView('journal-complete')}
            className="w-full max-w-md mx-auto bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98]"
          >
            Submit
          </Button>
        </motion.div>
      </div>
    );
  }

  // Journal complete
  if (view === 'journal-complete') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-12"
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
              Noted. No action required.
            </motion.p>
          </div>

          <Button
            onClick={() => setView('main')}
            variant="ghost"
            className="w-full rounded-3xl h-14 text-black/60 active:scale-[0.98]"
          >
            Back to actions
          </Button>
        </motion.div>
      </div>
    );
  }

  return null;
}