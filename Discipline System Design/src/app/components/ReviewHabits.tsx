import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check } from 'lucide-react';
import { XPFeedback } from './XPFeedback';

interface ReviewHabitsProps {
  onComplete: () => void;
  onBack: () => void;
}

interface Habit {
  id: string;
  name: string;
  category: 'morning' | 'day' | 'evening' | 'anti-habit';
  completed: boolean;
  streak?: number;
}

export function ReviewHabits({ onComplete, onBack }: ReviewHabitsProps) {
  const [habits, setHabits] = useState<Habit[]>([
    // Morning
    { id: '1', name: 'Morning pages', category: 'morning', completed: false, streak: 12 },
    { id: '2', name: 'Light breakfast', category: 'morning', completed: false, streak: 8 },
    { id: '3', name: 'Review today\'s plan', category: 'morning', completed: false, streak: 15 },
    
    // Day
    { id: '4', name: 'Lunch away from desk', category: 'day', completed: false, streak: 5 },
    { id: '5', name: 'Walk outside', category: 'day', completed: false, streak: 3 },
    { id: '6', name: 'Hydration check', category: 'day', completed: false, streak: 18 },
    
    // Evening
    { id: '7', name: 'Close open loops', category: 'evening', completed: false, streak: 7 },
    { id: '8', name: 'No screens 30min before bed', category: 'evening', completed: false, streak: 4 },
    { id: '9', name: 'Tomorrow\'s priorities', category: 'evening', completed: false, streak: 11 },
    
    // Anti-habits
    { id: '10', name: 'Social media scrolling', category: 'anti-habit', completed: false },
    { id: '11', name: 'Working through breaks', category: 'anti-habit', completed: false },
    { id: '12', name: 'Late night studying', category: 'anti-habit', completed: false },
  ]);

  const [showCompletion, setShowCompletion] = useState(false);
  const [consistencyDays, setConsistencyDays] = useState(4);

  const toggleHabit = (id: string) => {
    setHabits(habits.map(h => 
      h.id === id ? { ...h, completed: !h.completed } : h
    ));
  };

  const allCompleted = habits.every(h => h.completed);

  useEffect(() => {
    if (allCompleted && habits.length > 0) {
      setTimeout(() => {
        setShowCompletion(true);
        setTimeout(() => {
          onComplete();
        }, 2000);
      }, 500);
    }
  }, [allCompleted, habits.length, onComplete]);

  const getHabitsByCategory = (category: Habit['category']) => {
    return habits.filter(h => h.category === category);
  };

  const categoryConfig = {
    morning: { label: 'Morning', description: 'Start the day' },
    day: { label: 'Day', description: 'During work' },
    evening: { label: 'Evening', description: 'Wind down' },
    'anti-habit': { label: 'Anti-habits', description: 'Did you avoid these today?' },
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-black/5 px-6 pt-12 pb-6 z-10">
        <div className="flex items-center gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
              Habits
            </h1>
            <p className="text-black/40 mt-1">Small actions. Repeated.</p>
          </div>
        </div>

        {/* Weekly consistency indicator */}
        <div className="pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-black/40">
              Consistency this week: {consistencyDays}/7 days
            </p>
            <div className="flex gap-1">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i < consistencyDays ? 'bg-[#16A34A]' : 'bg-black/10'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pt-8 space-y-12">
        {/* Morning Habits */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div>
            <h2 className="text-black/40 uppercase tracking-wide text-sm">
              {categoryConfig.morning.label}
            </h2>
            <p className="text-black/30 text-sm mt-1">
              {categoryConfig.morning.description}
            </p>
          </div>

          <div className="space-y-3">
            {getHabitsByCategory('morning').map((habit, index) => (
              <motion.button
                key={habit.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => toggleHabit(habit.id)}
                className={`w-full p-6 border rounded-3xl transition-all ${
                  habit.completed
                    ? 'border-[#16A34A]/20 bg-[#16A34A]/5'
                    : 'border-black/5 bg-white hover:bg-black/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        habit.completed
                          ? 'border-[#16A34A] bg-[#16A34A]'
                          : 'border-black/20'
                      }`}
                    >
                      <AnimatePresence>
                        {habit.completed && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Habit name */}
                    <p className={`font-medium text-left ${
                      habit.completed ? 'text-black/60' : 'text-black'
                    }`}>
                      {habit.name}
                    </p>
                  </div>

                  {/* Streak indicator */}
                  {habit.streak && habit.streak > 2 && (
                    <span className="text-xs text-black/40 px-3 py-1 rounded-full bg-black/5">
                      {habit.streak} days
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Day Habits */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div>
            <h2 className="text-black/40 uppercase tracking-wide text-sm">
              {categoryConfig.day.label}
            </h2>
            <p className="text-black/30 text-sm mt-1">
              {categoryConfig.day.description}
            </p>
          </div>

          <div className="space-y-3">
            {getHabitsByCategory('day').map((habit, index) => (
              <motion.button
                key={habit.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                onClick={() => toggleHabit(habit.id)}
                className={`w-full p-6 border rounded-3xl transition-all ${
                  habit.completed
                    ? 'border-[#16A34A]/20 bg-[#16A34A]/5'
                    : 'border-black/5 bg-white hover:bg-black/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        habit.completed
                          ? 'border-[#16A34A] bg-[#16A34A]'
                          : 'border-black/20'
                      }`}
                    >
                      <AnimatePresence>
                        {habit.completed && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <p className={`font-medium text-left ${
                      habit.completed ? 'text-black/60' : 'text-black'
                    }`}>
                      {habit.name}
                    </p>
                  </div>

                  {habit.streak && habit.streak > 2 && (
                    <span className="text-xs text-black/40 px-3 py-1 rounded-full bg-black/5">
                      {habit.streak} days
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Evening Habits */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div>
            <h2 className="text-black/40 uppercase tracking-wide text-sm">
              {categoryConfig.evening.label}
            </h2>
            <p className="text-black/30 text-sm mt-1">
              {categoryConfig.evening.description}
            </p>
          </div>

          <div className="space-y-3">
            {getHabitsByCategory('evening').map((habit, index) => (
              <motion.button
                key={habit.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                onClick={() => toggleHabit(habit.id)}
                className={`w-full p-6 border rounded-3xl transition-all ${
                  habit.completed
                    ? 'border-[#16A34A]/20 bg-[#16A34A]/5'
                    : 'border-black/5 bg-white hover:bg-black/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        habit.completed
                          ? 'border-[#16A34A] bg-[#16A34A]'
                          : 'border-black/20'
                      }`}
                    >
                      <AnimatePresence>
                        {habit.completed && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <p className={`font-medium text-left ${
                      habit.completed ? 'text-black/60' : 'text-black'
                    }`}>
                      {habit.name}
                    </p>
                  </div>

                  {habit.streak && habit.streak > 2 && (
                    <span className="text-xs text-black/40 px-3 py-1 rounded-full bg-black/5">
                      {habit.streak} days
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Anti-habits */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div>
            <h2 className="text-black/40 uppercase tracking-wide text-sm">
              {categoryConfig['anti-habit'].label}
            </h2>
            <p className="text-black/30 text-sm mt-1">
              {categoryConfig['anti-habit'].description}
            </p>
          </div>

          <div className="space-y-3">
            {getHabitsByCategory('anti-habit').map((habit, index) => (
              <motion.button
                key={habit.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                onClick={() => toggleHabit(habit.id)}
                className={`w-full p-6 border rounded-3xl transition-all ${
                  habit.completed
                    ? 'border-[#16A34A]/20 bg-[#16A34A]/5'
                    : 'border-black/5 bg-white hover:bg-black/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        habit.completed
                          ? 'border-[#16A34A] bg-[#16A34A]'
                          : 'border-black/20'
                      }`}
                    >
                      <AnimatePresence>
                        {habit.completed && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <p className={`font-medium text-left ${
                      habit.completed ? 'text-black/60' : 'text-black'
                    }`}>
                      {habit.name}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>
      </div>

      {/* Completion overlay */}
      <AnimatePresence>
        {showCompletion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="w-16 h-16 rounded-full bg-[#16A34A]/10 flex items-center justify-center mx-auto"
              >
                <div className="w-8 h-8 rounded-full bg-[#16A34A]" />
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-2xl tracking-tight text-black/60"
                style={{ letterSpacing: '-0.03em' }}
              >
                Noted.
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}