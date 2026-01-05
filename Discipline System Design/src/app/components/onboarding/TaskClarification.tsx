import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Trash2, Check } from 'lucide-react';

interface TaskClarificationProps {
  rawTasks: string;
  onContinue: (tasks: any[]) => void;
  t: any;
}

interface ClarifiedTask {
  id: string;
  title: string;
  category: string;
  priority: boolean;
  editing?: boolean;
}

// Mock AI task extraction
const extractTasks = (rawText: string): ClarifiedTask[] => {
  const lines = rawText.split('\n').filter(l => l.trim());
  return lines.map((line, i) => ({
    id: `task-${i}`,
    title: line.trim(),
    category: i % 3 === 0 ? 'Study' : i % 3 === 1 ? 'Assignment' : 'Review',
    priority: false,
  }));
};

export function TaskClarification({ rawTasks, onContinue, t }: TaskClarificationProps) {
  const [tasks, setTasks] = useState<ClarifiedTask[]>([]);

  useEffect(() => {
    // Simulate AI processing delay
    const timer = setTimeout(() => {
      setTasks(extractTasks(rawTasks));
    }, 500);
    return () => clearTimeout(timer);
  }, [rawTasks]);

  const togglePriority = (id: string) => {
    setTasks(prev =>
      prev.map(task => (task.id === id ? { ...task, priority: !task.priority } : task))
    );
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const updateTaskTitle = (id: string, title: string) => {
    setTasks(prev =>
      prev.map(task => (task.id === id ? { ...task, title } : task))
    );
  };

  const handleContinue = () => {
    onContinue(tasks);
  };

  // Group tasks by category
  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.category]) acc[task.category] = [];
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, ClarifiedTask[]>);

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full mx-auto space-y-8 flex-1"
      >
        <div className="text-center space-y-3">
          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
            {t.whatWeUnderstood}
          </h1>
        </div>

        {/* Grouped tasks */}
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([category, categoryTasks], categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="space-y-3"
            >
              <h2 className="text-sm text-black/40 px-1">{category}</h2>

              <div className="space-y-2">
                {categoryTasks.map((task, taskIndex) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: categoryIndex * 0.1 + taskIndex * 0.05 }}
                    className={`p-4 rounded-2xl border transition-all ${
                      task.priority
                        ? 'border-[#16A34A]/30 bg-[#16A34A]/5'
                        : 'border-black/10 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Priority checkbox */}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => togglePriority(task.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                          task.priority
                            ? 'border-[#16A34A] bg-[#16A34A]'
                            : 'border-black/20 hover:border-black/40'
                        }`}
                      >
                        {task.priority && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </motion.button>

                      {/* Task title */}
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => updateTaskTitle(task.id, e.target.value)}
                        className="flex-1 bg-transparent focus:outline-none text-black"
                        style={{ letterSpacing: '-0.01em' }}
                      />

                      {/* Delete button */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deleteTask(task.id)}
                        className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-black/40 hover:text-red-500" />
                      </motion.button>
                    </div>

                    {task.priority && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-xs text-[#16A34A] mt-2 pl-9"
                      >
                        {t.mustDoTomorrow}
                      </motion.p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-12 text-black/40">
            No tasks extracted yet...
          </div>
        )}
      </motion.div>

      {/* Fixed bottom CTA */}
      <div className="max-w-2xl w-full mx-auto pt-6">
        <Button
          onClick={handleContinue}
          disabled={tasks.length === 0}
          className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 text-lg disabled:opacity-40 shadow-lg"
        >
          {t.buildIdealDay}
        </Button>
      </div>
    </div>
  );
}
