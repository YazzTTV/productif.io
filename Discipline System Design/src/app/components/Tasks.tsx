import { useState } from 'react';
import { Button } from './ui/button';
import { BackToHomeHeader } from './ui/BackToHomeHeader';
import { ArrowLeft, ChevronDown, ChevronRight, Clock, CheckCircle2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AddTaskModal } from './AddTaskModal';

interface TasksProps {
  onNavigate: (screen: string) => void;
  onStartFocus?: (task: Task, subject: Subject) => void;
}

interface Task {
  id: string;
  title: string;
  estimatedTime: number; // minutes
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  details?: string;
}

interface Subject {
  id: string;
  name: string;
  coefficient: number;
  progress: number; // 0-100
  impact: 'high' | 'medium' | 'low';
  insight?: string;
  tasks: Task[];
  nextDeadline?: string;
}

// Mock data - structured by subject
const MOCK_SUBJECTS: Subject[] = [
  {
    id: '1',
    name: 'Organic Chemistry',
    coefficient: 6,
    progress: 35,
    impact: 'high',
    insight: 'This subject represents 40% of your final grade. Completing these tasks today will reduce future stress.',
    tasks: [
      {
        id: '1-1',
        title: 'Review Chapter 12 — Integrals',
        estimatedTime: 45,
        priority: 'high',
        completed: false,
        details: 'Focus on integration techniques and substitution methods',
      },
      {
        id: '1-2',
        title: 'Complete practice problems 15-20',
        estimatedTime: 60,
        priority: 'high',
        completed: false,
      },
      {
        id: '1-3',
        title: 'Review lecture notes from Monday',
        estimatedTime: 30,
        priority: 'medium',
        completed: false,
      },
    ],
    nextDeadline: 'Exam in 5 days',
  },
  {
    id: '2',
    name: 'Linear Algebra',
    coefficient: 5,
    progress: 60,
    impact: 'high',
    insight: 'Strong foundation here will help with Physics. Stay consistent.',
    tasks: [
      {
        id: '2-1',
        title: 'Matrix operations exercises',
        estimatedTime: 40,
        priority: 'high',
        completed: false,
      },
      {
        id: '2-2',
        title: 'Eigenvalues problem set',
        estimatedTime: 50,
        priority: 'medium',
        completed: true,
      },
    ],
    nextDeadline: 'Assignment due Friday',
  },
  {
    id: '3',
    name: 'Physics — Thermodynamics',
    coefficient: 4,
    progress: 45,
    impact: 'medium',
    tasks: [
      {
        id: '3-1',
        title: 'Read Chapter 8 — Heat Transfer',
        estimatedTime: 35,
        priority: 'medium',
        completed: false,
      },
      {
        id: '3-2',
        title: 'Prepare lab report',
        estimatedTime: 45,
        priority: 'low',
        completed: false,
      },
    ],
  },
  {
    id: '4',
    name: 'English Literature',
    coefficient: 2,
    progress: 80,
    impact: 'low',
    tasks: [
      {
        id: '4-1',
        title: 'Read Act III of Hamlet',
        estimatedTime: 25,
        priority: 'low',
        completed: false,
      },
    ],
  },
];

export function Tasks({ onNavigate, onStartFocus }: TasksProps) {
  const [subjects, setSubjects] = useState<Subject[]>(MOCK_SUBJECTS);
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>(['1']); // First subject expanded by default
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [showTaskAddedFeedback, setShowTaskAddedFeedback] = useState(false);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

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

  const handleCompleteTask = (subjectId: string, taskId: string) => {
    setSubjects(prev =>
      prev.map(subject =>
        subject.id === subjectId
          ? {
              ...subject,
              tasks: subject.tasks.map(task =>
                task.id === taskId
                  ? { ...task, completed: !task.completed }
                  : task
              ),
            }
          : subject
      )
    );
  };

  const handleStartFocus = (task: Task, subject: Subject) => {
    if (onStartFocus) {
      onStartFocus(task, subject);
    } else {
      onNavigate('focus');
    }
  };

  const handleAddTask = (taskData: {
    title: string;
    estimatedTime: number;
    taskType?: string;
    priority: 'high' | 'medium' | 'low';
  }) => {
    if (!selectedSubjectId) return;

    const newTask: Task = {
      id: `${selectedSubjectId}-${Date.now()}`,
      title: taskData.title,
      estimatedTime: taskData.estimatedTime,
      priority: taskData.priority,
      completed: false,
      details: taskData.taskType,
    };

    setSubjects(prev =>
      prev.map(subject =>
        subject.id === selectedSubjectId
          ? {
              ...subject,
              tasks: [...subject.tasks, newTask],
            }
          : subject
      )
    );

    setShowTaskAddedFeedback(true);
    setTimeout(() => setShowTaskAddedFeedback(false), 2000);
  };

  const totalTasks = subjects.reduce((acc, s) => acc + s.tasks.length, 0);
  const completedTasks = subjects.reduce(
    (acc, s) => acc + s.tasks.filter(t => t.completed).length,
    0
  );
  const hasNoTasks = totalTasks === 0;

  // Priority styling
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

  // Empty state
  if (hasNoTasks) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-6 pt-12 pb-8 border-b border-black/5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('ai')}
            className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors shadow-sm mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
            Your Tasks
          </h1>
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
              onClick={() => onNavigate('plan')}
              className="w-full bg-black hover:bg-black/90 text-white rounded-3xl h-14"
            >
              Plan my day
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main Tasks view
  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="px-6 pt-12 pb-8 border-b border-black/5">
        <BackToHomeHeader
          onBack={() => onNavigate('dashboard')}
          title="Your Tasks"
          subtitle="Organized by subject and impact."
        />

        <div className="space-y-3 mt-4">
          <div className="flex items-center gap-2 text-sm text-black/40">
            <span>{completedTasks} of {totalTasks} completed</span>
          </div>
        </div>
      </div>

      {/* Subjects list */}
      <div className="px-6 pt-8 space-y-4">
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
                                      <div className="flex items-center gap-1.5 text-black/60">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{task.estimatedTime} min</span>
                                      </div>
                                      <span className={`${getPriorityColor(task.priority)}`}>
                                        {getPriorityLabel(task.priority)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Expand details */}
                                  {task.details && (
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
                                  {isTaskExpanded && task.details && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="pl-9 text-sm text-black/60 overflow-hidden"
                                    >
                                      {task.details}
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
                        onClick={() => {
                          setIsAddTaskModalOpen(true);
                          setSelectedSubjectId(subject.id);
                        }}
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

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onAddTask={handleAddTask}
        subjectName={selectedSubject?.name || ''}
      />

      {/* Task Added Feedback */}
      <AnimatePresence>
        {showTaskAddedFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white border border-[#16A34A]/20 rounded-2xl px-6 py-3 shadow-lg flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <span className="text-sm text-black/70">Task added.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}