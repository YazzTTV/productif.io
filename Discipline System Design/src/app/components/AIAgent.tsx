import { useState } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Calendar, Focus, ListTodo, BookOpen, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AIAgentProps {
  onNavigate: (screen: string) => void;
}

export function AIAgent({ onNavigate }: AIAgentProps) {
  const [systemMessage, setSystemMessage] = useState<string | null>(null);

  const actions = [
    {
      id: 'plan',
      icon: Calendar,
      title: 'Plan my day',
      description: 'Generate an optimized schedule',
      gradient: 'from-[#16A34A]/10 to-[#16A34A]/5',
      action: () => {
        setSystemMessage('Day planned. Check your dashboard.');
        setTimeout(() => {
          setSystemMessage(null);
          onNavigate('dashboard');
        }, 2000);
      },
    },
    {
      id: 'focus',
      icon: Focus,
      title: 'Start focus',
      description: 'Begin your main priority',
      gradient: 'from-black/5 to-transparent',
      action: () => {
        onNavigate('focus');
      },
    },
    {
      id: 'habits',
      icon: ListTodo,
      title: 'Manage habits',
      description: 'View and update daily habits',
      gradient: 'from-black/5 to-transparent',
      action: () => {
        setSystemMessage('Habits updated successfully.');
        setTimeout(() => setSystemMessage(null), 2000);
      },
    },
    {
      id: 'journal',
      icon: BookOpen,
      title: 'Daily journal',
      description: 'Reflect on your progress',
      gradient: 'from-black/5 to-transparent',
      action: () => {
        setSystemMessage('Journal entry saved.');
        setTimeout(() => setSystemMessage(null), 2000);
      },
    },
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b border-black/5">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('dashboard')}
            className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#16A34A]" />
            <div>
              <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em' }}>
                AI Conductor
              </h1>
              <p className="text-black/60">System actions</p>
            </div>
          </div>
        </div>
      </div>

      {/* System message */}
      <AnimatePresence>
        {systemMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-6 pt-6"
          >
            <div className="p-6 bg-gradient-to-r from-[#16A34A]/10 to-[#16A34A]/5 border border-[#16A34A]/20 rounded-3xl shadow-lg">
              <p className="text-center text-[#16A34A] font-medium">{systemMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="px-6 pt-8 pb-8">
        <p className="text-black/60 mb-6">What would you like to do?</p>
        
        <div className="space-y-4">
          {actions.map((action, index) => (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.action}
              className={`w-full p-6 rounded-3xl bg-gradient-to-br ${action.gradient} border border-black/5 hover:border-[#16A34A]/20 transition-all flex items-center gap-4 shadow-sm hover:shadow-md`}
            >
              <div className="w-14 h-14 rounded-2xl bg-white border border-black/5 flex items-center justify-center shadow-sm">
                <action.icon className="w-6 h-6 text-[#16A34A]" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="mb-1 font-medium">{action.title}</h3>
                <p className="text-black/60">{action.description}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="px-6">
        <div className="p-6 border border-black/5 rounded-3xl bg-black/5">
          <p className="text-black/60 text-center">
            No open chat. The system decides, you validate.
          </p>
        </div>
      </div>

      {/* Insights */}
      <div className="px-6 pt-8">
        <p className="text-black/60 mb-4">Recent insights</p>
        <div className="space-y-3">
          {[
            {
              title: 'Your focus peaks between 9–11 AM.',
              detail: 'Schedule hard tasks early.',
            },
            {
              title: 'Rest days improve performance by 18%.',
              detail: 'Sunday is your ideal recovery day.',
            },
            {
              title: 'You work best in 90-minute blocks.',
              detail: 'Adjusted your schedule accordingly.',
            },
          ].map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="p-6 border border-black/5 rounded-3xl bg-white shadow-sm"
            >
              <p className="text-black/80 mb-2">{insight.title}</p>
              <p className="text-black/40">{insight.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}