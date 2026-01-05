import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: {
    title: string;
    estimatedTime: number;
    taskType?: string;
    priority: 'high' | 'medium' | 'low';
  }) => void;
  subjectName: string;
}

const EFFORT_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1h', value: 60 },
];

const TASK_TYPES = ['Revision', 'Assignment', 'Practice', 'Reading'];

export function AddTaskModal({ isOpen, onClose, onAddTask, subjectName }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [taskType, setTaskType] = useState<string | undefined>(undefined);
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Reset form when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setTitle('');
        setEstimatedTime(30);
        setTaskType(undefined);
        setPriority('medium');
        setShowMoreOptions(false);
      }, 300);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAddTask({
        title: title.trim(),
        estimatedTime,
        taskType,
        priority,
      });
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40"
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
                      Add a task
                    </h2>
                    <p className="text-black/40 text-sm">One clear task is enough.</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-black/40" />
                  </motion.button>
                </div>
                <p className="text-sm text-black/60">
                  For <span className="text-black">{subjectName}</span>
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Task title input */}
                  <div className="space-y-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="e.g. Review chapter 3 / Finish problem set"
                      className="w-full px-4 py-3 border border-black/10 rounded-2xl bg-white focus:outline-none focus:border-black/20 transition-colors text-lg"
                      style={{ letterSpacing: '-0.01em' }}
                    />
                    <p className="text-xs text-black/40 px-1">Keep it specific and doable.</p>
                  </div>

                  {/* Estimated effort */}
                  <div className="space-y-3">
                    <p className="text-sm text-black/60">Estimated effort</p>
                    <div className="flex flex-wrap gap-2">
                      {EFFORT_OPTIONS.map((option) => (
                        <motion.button
                          key={option.value}
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setEstimatedTime(option.value)}
                          className={`px-4 py-2 rounded-full text-sm transition-all ${
                            estimatedTime === option.value
                              ? 'bg-black text-white'
                              : 'bg-black/5 text-black/60 hover:bg-black/10'
                          }`}
                        >
                          {option.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Task type (optional) */}
                  <div className="space-y-3">
                    <p className="text-sm text-black/60">Task type (optional)</p>
                    <div className="flex flex-wrap gap-2">
                      {TASK_TYPES.map((type) => (
                        <motion.button
                          key={type}
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setTaskType(taskType === type ? undefined : type)}
                          className={`px-4 py-2 rounded-full text-sm transition-all ${
                            taskType === type
                              ? 'bg-black text-white'
                              : 'bg-black/5 text-black/60 hover:bg-black/10'
                          }`}
                        >
                          {type}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="space-y-3">
                    <p className="text-sm text-black/60">Priority</p>
                    <div className="flex gap-2">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPriority('medium')}
                        className={`flex-1 px-4 py-2 rounded-full text-sm transition-all ${
                          priority === 'medium'
                            ? 'bg-black text-white'
                            : 'bg-black/5 text-black/60 hover:bg-black/10'
                        }`}
                      >
                        Normal
                      </motion.button>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPriority('high')}
                        className={`flex-1 px-4 py-2 rounded-full text-sm transition-all ${
                          priority === 'high'
                            ? 'bg-black text-white'
                            : 'bg-black/5 text-black/60 hover:bg-black/10'
                        }`}
                      >
                        Important
                      </motion.button>
                    </div>
                  </div>

                  {/* More options (collapsed by default) */}
                  <motion.button
                    type="button"
                    onClick={() => setShowMoreOptions(!showMoreOptions)}
                    className="text-sm text-black/40 hover:text-black/60 transition-colors"
                  >
                    {showMoreOptions ? 'Less options' : 'More options'}
                  </motion.button>

                  <AnimatePresence>
                    {showMoreOptions && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        <div className="pt-2 space-y-3">
                          <p className="text-sm text-black/40">
                            Due date and notes coming soon.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>

              {/* Footer / CTA */}
              <div className="px-6 py-6 border-t border-black/5 bg-white space-y-4">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    className="flex-1 rounded-2xl h-12 text-black/60 hover:text-black hover:bg-black/5"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!title.trim()}
                    className="flex-1 bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-12 shadow-lg shadow-[#16A34A]/20 hover:shadow-xl hover:shadow-[#16A34A]/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add task
                  </Button>
                </div>
                <p className="text-xs text-black/30 text-center">You can always adjust later.</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}