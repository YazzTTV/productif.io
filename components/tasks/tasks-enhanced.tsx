"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Clock, CheckCircle2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Task {
  id: string;
  title: string;
  estimatedMinutes?: number | null;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  description?: string | null;
  subjectId?: string | null;
}

interface Subject {
  id: string;
  name: string;
  coefficient: number;
  progress: number;
  impact: 'high' | 'medium' | 'low';
  insight?: string;
  tasks: Task[];
  nextDeadline?: string | null;
}

export function TasksEnhanced() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Récupérer les sujets et tâches
        const [subjectsRes, tasksRes] = await Promise.all([
          fetch('/api/subjects', { credentials: 'include' }),
          fetch('/api/tasks', { credentials: 'include' })
        ]);

        if (!subjectsRes.ok || !tasksRes.ok) {
          throw new Error('Erreur lors du chargement des données');
        }

        const subjectsData = await subjectsRes.json();
        const tasksData = await tasksRes.json();

        // Organiser les tâches par sujet
        const subjectsWithTasks: Subject[] = subjectsData.subjects?.map((subject: any) => {
          const subjectTasks = tasksData.tasks?.filter((task: any) => 
            task.subjectId === subject.id
          ) || [];

          const completedCount = subjectTasks.filter((t: Task) => t.completed).length;
          const totalCount = subjectTasks.length;
          const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          // Déterminer l'impact basé sur le coefficient
          let impact: 'high' | 'medium' | 'low' = 'low';
          if (subject.coefficient >= 5) impact = 'high';
          else if (subject.coefficient >= 3) impact = 'medium';

          return {
            id: subject.id,
            name: subject.name,
            coefficient: subject.coefficient || 1,
            progress,
            impact,
            tasks: subjectTasks.map((task: any) => {
              // Convertir priority (number) en string
              let priorityStr: 'high' | 'medium' | 'low' = 'medium';
              if (task.priority !== null && task.priority !== undefined) {
                if (task.priority >= 8) priorityStr = 'high';
                else if (task.priority >= 5) priorityStr = 'medium';
                else priorityStr = 'low';
              }

              return {
                id: task.id,
                title: task.title,
                estimatedMinutes: task.estimatedMinutes || null,
                priority: priorityStr,
                completed: task.completed || false,
                description: task.description || null,
                subjectId: task.subjectId,
              };
            }),
            nextDeadline: subject.deadline ? new Date(subject.deadline).toLocaleDateString() : null,
          };
        }) || [];

        // Trier par impact (high first)
        subjectsWithTasks.sort((a, b) => {
          const impactOrder = { high: 3, medium: 2, low: 1 };
          return impactOrder[b.impact] - impactOrder[a.impact];
        });

        setSubjects(subjectsWithTasks);

        // Expandir le premier sujet par défaut
        if (subjectsWithTasks.length > 0) {
          setExpandedSubjects([subjectsWithTasks[0].id]);
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const toggleTaskDetails = (taskId: string) => {
    setExpandedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleCompleteTask = async (subjectId: string, taskId: string) => {
    try {
      const task = subjects
        .find(s => s.id === subjectId)
        ?.tasks.find(t => t.id === taskId);

      if (!task) return;

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ completed: !task.completed }),
      });

      if (response.ok) {
        setSubjects(prev =>
          prev.map(subject =>
            subject.id === subjectId
              ? {
                  ...subject,
                  tasks: subject.tasks.map(t =>
                    t.id === taskId ? { ...t, completed: !t.completed } : t
                  ),
                }
              : subject
          )
        );
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleStartFocus = (task: Task, subject: Subject) => {
    router.push(`/dashboard/focus?taskId=${task.id}`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-black';
      case 'medium':
        return 'text-black/70';
      case 'low':
        return 'text-black/50';
      default:
        return 'text-black/60';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'High impact';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return '';
    }
  };

  const totalTasks = subjects.reduce((acc, s) => acc + s.tasks.length, 0);
  const completedTasks = subjects.reduce(
    (acc, s) => acc + s.tasks.filter(t => t.completed).length,
    0
  );
  const hasNoTasks = totalTasks === 0;

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-[#16A34A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-black/60">Loading tasks...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-black/60">Unable to load tasks.</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // État vide
  if (hasNoTasks) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-6 pt-8 pb-8 border-b border-black/5">
          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
            Your Tasks
          </h1>
          <p className="text-black/60 mt-1">Organized by subject and impact.</p>
        </div>

        <div className="flex items-center justify-center px-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full text-center space-y-8"
          >
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-black/40" />
              </div>
              <p className="text-xl text-black/60">No tasks yet. Your plan is clear.</p>
            </div>

            <Button
              onClick={() => router.push('/dashboard/assistant-ia')}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14"
            >
              Plan my day
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Vue principale
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b border-black/5">
        <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
          Your Tasks
        </h1>
        <p className="text-black/60 mt-1">Organized by subject and impact.</p>

        <div className="space-y-3 mt-4">
          <div className="flex items-center gap-2 text-sm text-black/40">
            <span>{completedTasks} of {totalTasks} completed</span>
          </div>
        </div>
      </div>

      {/* Subjects list */}
      <div className="px-6 pt-8 space-y-4 pb-24">
        {subjects.map((subject, index) => {
          const isExpanded = expandedSubjects.includes(subject.id);
          const completedCount = subject.tasks.filter(t => t.completed).length;
          const totalCount = subject.tasks.length;

          return (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border border-black/10 rounded-3xl overflow-hidden bg-white"
            >
              {/* Subject header */}
              <motion.button
                whileTap={{ scale: 0.99 }}
                onClick={() => toggleSubject(subject.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-black/5 transition-colors"
              >
                <div className="flex-1 text-left space-y-3">
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-xl tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                      {subject.name}
                    </h2>
                    <span className="text-sm text-black/40">
                      Coef {subject.coefficient}
                    </span>
                  </div>

                  {subject.impact === 'high' && (
                    <p className="text-sm text-[#16A34A]">High impact on final grade</p>
                  )}

                  {subject.nextDeadline && (
                    <p className="text-sm text-black/60">{subject.nextDeadline}</p>
                  )}

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-black/40">
                      <span>{completedCount}/{totalCount} tasks</span>
                      <span>{subject.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${subject.progress}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          subject.impact === 'high' ? 'bg-[#16A34A]' : 'bg-black/20'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-4"
                >
                  <ChevronDown className="w-5 h-5 text-black/40" />
                </motion.div>
              </motion.button>

              {/* Subject content - expanded */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="px-6 pb-6 space-y-4 border-t border-black/5">
                      {/* AI Insight */}
                      {subject.insight && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="mt-4 p-4 bg-black/5 rounded-2xl"
                        >
                          <p className="text-sm text-black/70 leading-relaxed">
                            {subject.insight}
                          </p>
                        </motion.div>
                      )}

                      {/* Tasks list */}
                      <div className="space-y-3 mt-4">
                        {subject.tasks.map((task, taskIndex) => {
                          const isTaskExpanded = expandedTasks.includes(task.id);

                          return (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 + taskIndex * 0.05 }}
                              className={`border rounded-2xl overflow-hidden transition-all ${
                                task.completed
                                  ? 'border-[#16A34A]/20 bg-[#16A34A]/5'
                                  : 'border-black/10 bg-white'
                              }`}
                            >
                              <div className="p-4 space-y-3">
                                {/* Task header */}
                                <div className="flex items-start gap-3">
                                  {/* Checkbox */}
                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleCompleteTask(subject.id, task.id)}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                                      task.completed
                                        ? 'border-[#16A34A] bg-[#16A34A]'
                                        : 'border-black/20 hover:border-black/40'
                                    }`}
                                  >
                                    {task.completed && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-3 h-3 rounded-full bg-white"
                                      />
                                    )}
                                  </motion.button>

                                  {/* Task info */}
                                  <div className="flex-1 min-w-0">
                                    <h3
                                      className={`tracking-tight mb-2 ${
                                        task.completed ? 'line-through text-black/40' : 'text-black'
                                      }`}
                                      style={{ letterSpacing: '-0.02em' }}
                                    >
                                      {task.title}
                                    </h3>

                                    <div className="flex items-center gap-4 text-sm">
                                      {task.estimatedMinutes && (
                                        <div className="flex items-center gap-1.5 text-black/60">
                                          <Clock className="w-3.5 h-3.5" />
                                          <span>{task.estimatedMinutes} min</span>
                                        </div>
                                      )}
                                      <span className={getPriorityColor(task.priority)}>
                                        {getPriorityLabel(task.priority)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Expand details */}
                                  {task.description && (
                                    <motion.button
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => toggleTaskDetails(task.id)}
                                      className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
                                    >
                                      <motion.div
                                        animate={{ rotate: isTaskExpanded ? 90 : 0 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <ChevronRight className="w-4 h-4 text-black/40" />
                                      </motion.div>
                                    </motion.button>
                                  )}
                                </div>

                                {/* Task details - expanded */}
                                <AnimatePresence>
                                  {isTaskExpanded && task.description && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="pl-9 text-sm text-black/60 overflow-hidden"
                                    >
                                      {task.description}
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {/* Task actions */}
                                {!task.completed && (
                                  <div className="pl-9">
                                    <Button
                                      onClick={() => handleStartFocus(task, subject)}
                                      className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-xl h-10 px-6 text-sm"
                                    >
                                      Start Focus Session
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Add task button */}
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="w-full flex items-center justify-center gap-2 p-4 mt-3 border-2 border-dashed border-black/10 rounded-2xl hover:border-black/20 hover:bg-black/5 transition-all group"
                        onClick={() => router.push(`/dashboard/tasks/new?subjectId=${subject.id}`)}
                      >
                        <div className="w-6 h-6 rounded-full bg-black/5 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                          <Plus className="w-4 h-4 text-black/40 group-hover:text-black/60 transition-colors" />
                        </div>
                        <span className="text-sm text-black/40 group-hover:text-black/60 transition-colors">
                          Add task
                        </span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

