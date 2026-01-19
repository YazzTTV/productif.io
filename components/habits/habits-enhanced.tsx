"use client"

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface HabitEntry {
  id: string;
  date: Date;
  completed: boolean;
  note?: string | null;
  rating?: number | null;
}

interface Habit {
  id: string;
  name: string;
  description?: string | null;
  frequency: string;
  daysOfWeek: string[];
  category?: 'morning' | 'day' | 'evening' | 'anti-habit';
  completed: boolean;
  streak?: number;
  entries: HabitEntry[];
}

// Fonction helper pour mapper les habitudes depuis l'API
const mapHabitsFromAPI = (data: any[], today: Date): Habit[] => {
  return data.map((habit: any) => {
    const todayEntry = habit.entries?.find((entry: any) => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(12, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });

    // Déterminer la catégorie
    let category: 'morning' | 'day' | 'evening' | 'anti-habit' = 'day';
    if (habit.userCategoryOverride) {
      const override = habit.userCategoryOverride.toUpperCase();
      if (override === 'MORNING') category = 'morning';
      else if (override === 'DAY') category = 'day';
      else if (override === 'EVENING') category = 'evening';
      else if (override === 'ANTI' || override === 'ANTI-HABIT') category = 'anti-habit';
    } else if (habit.inferredCategory) {
      const inferred = habit.inferredCategory.toUpperCase();
      if (inferred === 'MORNING') category = 'morning';
      else if (inferred === 'DAY') category = 'day';
      else if (inferred === 'EVENING') category = 'evening';
      else if (inferred === 'ANTI' || inferred === 'ANTI-HABIT') category = 'anti-habit';
    } else {
      const nameLower = habit.name.toLowerCase();
      const descLower = (habit.description || '').toLowerCase();
      const combined = `${nameLower} ${descLower}`;
      
      if (combined.includes('morning') || combined.includes('matin') || 
          combined.includes('réveil') || combined.includes('lever') ||
          combined.includes('routine du matin')) {
        category = 'morning';
      } else if (combined.includes('evening') || combined.includes('soir') || 
                 combined.includes('night') || combined.includes('sommeil') ||
                 combined.includes('coucher') || combined.includes('dormir') ||
                 combined.includes('routine du soir')) {
        category = 'evening';
      } else if (combined.includes('avoid') || combined.includes('no ') || 
                 combined.includes('anti') || combined.includes('ne pas') ||
                 combined.includes('arrêter') || combined.includes('stop') ||
                 combined.includes('réseaux sociaux') || combined.includes('scrolling')) {
        category = 'anti-habit';
      }
    }

    return {
      id: habit.id,
      name: habit.name,
      description: habit.description,
      frequency: habit.frequency,
      daysOfWeek: habit.daysOfWeek || [],
      category,
      completed: todayEntry?.completed || false,
      streak: habit.currentStreak || 0,
      entries: habit.entries || [],
    };
  });
};

export function HabitsEnhanced() {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [consistencyDays, setConsistencyDays] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form state for adding habit
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDescription, setNewHabitDescription] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/habits', { credentials: 'include' });
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des habitudes');
        }

        const data = await response.json();
        
        // Obtenir la date d'aujourd'hui
        const today = new Date();
        today.setHours(12, 0, 0, 0);

        // Mapper les habitudes avec leur statut de complétion pour aujourd'hui
        const habitsWithStatus = mapHabitsFromAPI(data, today);

        setHabits(habitsWithStatus);

        // Calculer la consistance de la semaine (nombre de jours avec au moins une habitude complétée)
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Dimanche
        weekStart.setHours(12, 0, 0, 0);

        let daysWithHabits = 0;
        for (let i = 0; i < 7; i++) {
          const checkDate = new Date(weekStart);
          checkDate.setDate(weekStart.getDate() + i);
          
          const hasCompletedHabit = habitsWithStatus.some(habit => {
            const entry = habit.entries.find((e: any) => {
              const entryDate = new Date(e.date);
              entryDate.setHours(12, 0, 0, 0);
              return entryDate.getTime() === checkDate.getTime() && e.completed;
            });
            return entry !== undefined;
          });

          if (hasCompletedHabit) daysWithHabits++;
        }

        setConsistencyDays(daysWithHabits);
      } catch (err) {
        console.error('Error fetching habits:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (showAddModal && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [showAddModal]);

  const toggleHabit = async (id: string) => {
    try {
      const habit = habits.find(h => h.id === id);
      if (!habit) return;

      const today = new Date();
      today.setHours(12, 0, 0, 0);

      // Mise à jour optimiste
      setHabits(prev =>
        prev.map(h =>
          h.id === id ? { ...h, completed: !h.completed } : h
        )
      );

      const response = await fetch('/api/habits/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          habitId: id,
          date: today.toISOString(),
          completed: !habit.completed,
        }),
      });

      if (response.ok) {
        // Recharger les données pour mettre à jour les streaks
        const refreshResponse = await fetch('/api/habits', { credentials: 'include' });
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const today = new Date();
          today.setHours(12, 0, 0, 0);

          const habitsWithStatus = mapHabitsFromAPI(data, today);

          setHabits(habitsWithStatus);

          // Recalculer la consistance
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          weekStart.setHours(12, 0, 0, 0);

          let daysWithHabits = 0;
          for (let i = 0; i < 7; i++) {
            const checkDate = new Date(weekStart);
            checkDate.setDate(weekStart.getDate() + i);
            
            const hasCompletedHabit = habitsWithStatus.some(habit => {
              const entry = habit.entries.find((e: any) => {
                const entryDate = new Date(e.date);
                entryDate.setHours(12, 0, 0, 0);
                return entryDate.getTime() === checkDate.getTime() && e.completed;
              });
              return entry !== undefined;
            });

            if (hasCompletedHabit) daysWithHabits++;
          }

          setConsistencyDays(daysWithHabits);
        }
      } else {
        // En cas d'erreur, revenir à l'état précédent
        setHabits(prev =>
          prev.map(h =>
            h.id === id ? { ...h, completed: habit.completed } : h
          )
        );
      }
    } catch (error) {
      console.error('Error updating habit:', error);
      // En cas d'erreur, revenir à l'état précédent
      const habit = habits.find(h => h.id === id);
      if (habit) {
        setHabits(prev =>
          prev.map(h =>
            h.id === id ? { ...h, completed: habit.completed } : h
          )
        );
      }
    }
  };

  const allCompleted = habits.length > 0 && habits.every(h => h.completed);

  useEffect(() => {
    if (allCompleted && habits.length > 0) {
      setTimeout(() => {
        setShowCompletion(true);
        setTimeout(() => {
          setShowCompletion(false);
        }, 2000);
      }, 500);
    }
  }, [allCompleted, habits.length]);

  const getHabitsByCategory = (category: Habit['category']) => {
    return habits.filter(h => h.category === category);
  };

  const categoryConfig = {
    morning: { label: 'Matin', description: 'Commencer la journée' },
    day: { label: 'Journée', description: 'Pendant le travail' },
    evening: { label: 'Soir', description: 'Se détendre' },
    'anti-habit': { label: 'Anti-habitudes', description: 'Les avez-vous évitées aujourd\'hui ?' },
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-[#16A34A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-black/60">Loading habits...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-black/60">Unable to load habits.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // État vide
  if (habits.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-6 pt-8 pb-6 border-b border-black/5">
          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
            Habits
          </h1>
          <p className="text-black/40 mt-1">Small actions. Repeated.</p>
        </div>

        <div className="flex items-center justify-center px-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full text-center space-y-8"
          >
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-black/40" />
              </div>
              <p className="text-xl text-black/60">Aucune habitude pour le moment.</p>
            </div>

            <button
              onClick={() => router.push('/dashboard/habits/new')}
              className="w-full px-6 py-3 bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl"
            >
              Créer votre première habitude
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b border-black/5">
        <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
          Habitudes
        </h1>
        <p className="text-black/40 mt-1">Small actions. Repeated.</p>

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

      <div className="px-6 pt-8 space-y-12 pb-24">
        {/* Morning Habits */}
        {getHabitsByCategory('morning').length > 0 && (
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
        )}

        {/* Day Habits */}
        {getHabitsByCategory('day').length > 0 && (
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
        )}

        {/* Evening Habits */}
        {getHabitsByCategory('evening').length > 0 && (
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
        )}

        {/* Anti-habits */}
        {getHabitsByCategory('anti-habit').length > 0 && (
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
        )}

        {/* Add Habit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pt-8"
        >
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setShowAddModal(true)}
            className="w-full p-6 border-2 border-dashed border-black/10 rounded-3xl hover:border-[#16A34A] hover:bg-[#16A34A]/5 transition-all flex items-center justify-center gap-3 text-black/60 hover:text-[#16A34A]"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add habit</span>
          </motion.button>
        </motion.div>
      </div>

      {/* Add Habit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden"
            >
              <div className="flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-black/5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h2
                        className="tracking-tight mb-1"
                        style={{ letterSpacing: '-0.03em', fontSize: '1.5rem' }}
                      >
                        Add a habit
                      </h2>
                      <p className="text-black/40 text-sm">Small actions. Repeated.</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAddModal(false)}
                      className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5 text-black/40" />
                    </motion.button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newHabitName.trim() || selectedDays.length === 0) return;

                      try {
                        setIsSubmitting(true);
                        const response = await fetch('/api/habits', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({
                            name: newHabitName.trim(),
                            description: newHabitDescription.trim() || null,
                            daysOfWeek: selectedDays,
                            frequency: 'daily',
                          }),
                        });

                        if (!response.ok) {
                          throw new Error('Failed to create habit');
                        }

                        // Recharger les habitudes
                        const refreshResponse = await fetch('/api/habits', { credentials: 'include' });
                        if (refreshResponse.ok) {
                          const data = await refreshResponse.json();
                          const today = new Date();
                          today.setHours(12, 0, 0, 0);
                          const habitsWithStatus = mapHabitsFromAPI(data, today);
                          setHabits(habitsWithStatus);
                        }

                        // Reset form
                        setNewHabitName('');
                        setNewHabitDescription('');
                        setSelectedDays([]);
                        setShowAddModal(false);
                      } catch (error) {
                        console.error('Error creating habit:', error);
                        alert('Erreur lors de la création de l\'habitude');
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    className="space-y-6"
                  >
                    {/* Name */}
                    <div className="space-y-2">
                      <label className="text-sm text-black/60 px-1">Habit name</label>
                      <input
                        ref={inputRef}
                        type="text"
                        value={newHabitName}
                        onChange={(e) => setNewHabitName(e.target.value)}
                        placeholder="e.g., Morning review"
                        className="w-full px-4 py-4 border border-black/10 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-colors"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <label className="text-sm text-black/60 px-1">Description (optional)</label>
                      <textarea
                        value={newHabitDescription}
                        onChange={(e) => setNewHabitDescription(e.target.value)}
                        placeholder="What does this habit mean to you?"
                        className="w-full px-4 py-4 border border-black/10 rounded-2xl bg-white resize-none h-24 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-colors"
                      />
                    </div>

                    {/* Days of week */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-black/60 px-1">Days of the week</label>
                        <button
                          type="button"
                          onClick={() => {
                            const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                            setSelectedDays(selectedDays.length === allDays.length ? [] : allDays);
                          }}
                          className="text-xs text-[#16A34A] hover:text-[#16A34A]/80"
                        >
                          {selectedDays.length === 7 ? 'Deselect all' : 'Select all'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'monday', label: 'Mon' },
                          { id: 'tuesday', label: 'Tue' },
                          { id: 'wednesday', label: 'Wed' },
                          { id: 'thursday', label: 'Thu' },
                          { id: 'friday', label: 'Fri' },
                          { id: 'saturday', label: 'Sat' },
                          { id: 'sunday', label: 'Sun' },
                        ].map((day) => (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => {
                              setSelectedDays((prev) =>
                                prev.includes(day.id)
                                  ? prev.filter((d) => d !== day.id)
                                  : [...prev, day.id]
                              );
                            }}
                            className={`px-4 py-3 rounded-2xl border-2 transition-all ${
                              selectedDays.includes(day.id)
                                ? 'border-[#16A34A] bg-[#16A34A]/5 text-[#16A34A]'
                                : 'border-black/10 bg-white text-black/60 hover:border-black/20'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-black/5">
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 rounded-2xl h-12"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!newHabitName.trim() || selectedDays.length === 0) return;

                        try {
                          setIsSubmitting(true);
                          const response = await fetch('/api/habits', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                              name: newHabitName.trim(),
                              description: newHabitDescription.trim() || null,
                              daysOfWeek: selectedDays,
                              frequency: 'daily',
                            }),
                          });

                          if (!response.ok) {
                            throw new Error('Failed to create habit');
                          }

                          // Recharger les habitudes
                          const refreshResponse = await fetch('/api/habits', { credentials: 'include' });
                          if (refreshResponse.ok) {
                            const data = await refreshResponse.json();
                            const today = new Date();
                            today.setHours(12, 0, 0, 0);
                            const habitsWithStatus = mapHabitsFromAPI(data, today);
                            setHabits(habitsWithStatus);
                          }

                          // Reset form
                          setNewHabitName('');
                          setNewHabitDescription('');
                          setSelectedDays([]);
                          setShowAddModal(false);
                        } catch (error) {
                          console.error('Error creating habit:', error);
                          alert('Erreur lors de la création de l\'habitude');
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      disabled={!newHabitName.trim() || selectedDays.length === 0 || isSubmitting}
                      className="flex-1 bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-12 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Creating...' : 'Add habit'}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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

