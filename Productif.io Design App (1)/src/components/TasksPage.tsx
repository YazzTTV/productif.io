import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../App';
import { Home, Bot, Settings as SettingsIcon, ArrowLeft, Plus, Trash2, ChevronDown, Flame, Target, Clock } from 'lucide-react';
import { useState } from 'react';

interface TasksPageProps {
  onNavigate: (screen: Screen) => void;
}

type Priority = 'high' | 'medium' | 'low';

interface Task {
  id: string;
  text: string;
  priority: Priority;
  completed: boolean;
}

const priorityConfig = {
  high: {
    label: 'High Priority',
    icon: Flame,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-500',
  },
  medium: {
    label: 'Medium Priority',
    icon: Target,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-500',
  },
  low: {
    label: 'Low Priority',
    icon: Clock,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-500',
  },
};

export function TasksPage({ onNavigate }: TasksPageProps) {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Complete project proposal', priority: 'high', completed: false },
    { id: '2', text: 'Review team feedback', priority: 'high', completed: false },
    { id: '3', text: 'Schedule meeting with client', priority: 'medium', completed: false },
    { id: '4', text: 'Update documentation', priority: 'medium', completed: true },
    { id: '5', text: 'Organize workspace', priority: 'low', completed: false },
    { id: '6', text: 'Read industry articles', priority: 'low', completed: true },
  ]);

  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  const addTask = () => {
    if (newTaskText.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        text: newTaskText.trim(),
        priority: newTaskPriority,
        completed: false,
      };
      setTasks([newTask, ...tasks]);
      setNewTaskText('');
      setNewTaskPriority('medium');
      setShowAddTask(false);
    }
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const changePriority = (id: string, priority: Priority) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, priority } : task
    ));
  };

  // Sort tasks: incomplete first (by priority: high > medium > low), then completed
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const highPriorityCount = incompleteTasks.filter(t => t.priority === 'high').length;

  return (
    <div className="min-h-[844px] bg-gradient-to-br from-gray-50 to-white pb-24 pt-16 px-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => onNavigate('dashboard')}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-gray-800">My Tasks</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Stats */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-600 text-sm mb-1">Total Tasks</p>
            <p className="text-gray-800 text-2xl">{incompleteTasks.length}</p>
          </div>
          <div className="flex-1 bg-gradient-to-br from-red-50 to-white rounded-2xl p-4 shadow-sm border border-red-100">
            <p className="text-gray-600 text-sm mb-1">High Priority</p>
            <div className="flex items-center gap-1">
              <Flame size={20} className="text-red-500" />
              <p className="text-gray-800 text-2xl">{highPriorityCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Task Button */}
      <motion.button
        onClick={() => setShowAddTask(!showAddTask)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-2xl shadow-md flex items-center justify-center gap-2 mb-6"
      >
        <Plus size={20} />
        <span>Add New Task</span>
      </motion.button>

      {/* Add Task Form */}
      <AnimatePresence>
        {showAddTask && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 mb-6"
          >
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="What do you need to do?"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#00C27A]"
              autoFocus
            />
            
            {/* Priority Selector */}
            <div className="relative mb-3">
              <button
                onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-between text-gray-700 bg-white"
              >
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = priorityConfig[newTaskPriority].icon;
                    return <Icon size={18} className={priorityConfig[newTaskPriority].color} />;
                  })()}
                  <span>{priorityConfig[newTaskPriority].label}</span>
                </div>
                <ChevronDown size={18} className="text-gray-400" />
              </button>

              {showPriorityDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-10">
                  {(Object.keys(priorityConfig) as Priority[]).map((priority) => {
                    const Icon = priorityConfig[priority].icon;
                    return (
                      <button
                        key={priority}
                        onClick={() => {
                          setNewTaskPriority(priority);
                          setShowPriorityDropdown(false);
                        }}
                        className="w-full px-4 py-3 flex items-center gap-2 hover:bg-gray-50 transition-colors"
                      >
                        <Icon size={18} className={priorityConfig[priority].color} />
                        <span className="text-gray-700">{priorityConfig[priority].label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={addTask}
                className="flex-1 py-3 bg-[#00C27A] text-white rounded-xl"
              >
                Add Task
              </button>
              <button
                onClick={() => {
                  setShowAddTask(false);
                  setNewTaskText('');
                  setNewTaskPriority('medium');
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tasks List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedTasks.map((task) => {
            const config = priorityConfig[task.priority];
            const Icon = config.icon;

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={`bg-white rounded-2xl p-4 shadow-sm border ${
                  task.completed ? 'border-gray-100 opacity-60' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                      task.completed
                        ? 'bg-[#00C27A] border-[#00C27A]'
                        : 'border-gray-300 hover:border-[#00C27A]'
                    }`}
                  >
                    {task.completed && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </motion.svg>
                    )}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-gray-800 mb-2 ${task.completed ? 'line-through text-gray-400' : ''}`}>
                      {task.text}
                    </p>
                    
                    {/* Priority Badge */}
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${config.bg} ${config.border} border`}>
                        <Icon size={14} className={config.color} />
                        <span className={`text-xs ${config.color}`}>{config.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-[#00C27A]/10 to-[#00D68F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target size={40} className="text-[#00C27A]" />
            </div>
            <p className="text-gray-600 mb-2">No tasks yet</p>
            <p className="text-gray-400 text-sm">Add your first task to get started!</p>
          </div>
        )}
      </div>

      {/* Completion Message */}
      {incompleteTasks.length === 0 && tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-[#00C27A]/10 to-[#00D68F]/5 rounded-2xl p-6 text-center border border-[#00C27A]/30 mt-6"
        >
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-gray-800 mb-1">All tasks completed!</p>
          <p className="text-gray-600 text-sm">Great job staying productive</p>
        </motion.div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-around">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex flex-col items-center gap-1 text-gray-400"
        >
          <Home size={24} />
          <span className="text-xs">Home</span>
        </button>
        <button
          onClick={() => onNavigate('assistant')}
          className="flex flex-col items-center gap-1 text-gray-400"
        >
          <Bot size={24} />
          <span className="text-xs">AI Assistant</span>
        </button>
        <button
          onClick={() => onNavigate('settings')}
          className="flex flex-col items-center gap-1 text-gray-400"
        >
          <SettingsIcon size={24} />
          <span className="text-xs">Settings</span>
        </button>
      </div>
    </div>
  );
}
