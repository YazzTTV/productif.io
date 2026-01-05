import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { XPProgress } from './XPProgress';

interface DailySummaryData {
  focusSessions: number;
  tasksCompleted: number;
  habitsCompleted: number;
  xpGained: number;
  currentXP: number;
  levelXP: number;
  level: number;
  streakDays: number;
}

interface EndOfDaySummaryProps {
  data: DailySummaryData;
  onClose: () => void;
}

export function EndOfDaySummary({ data, onClose }: EndOfDaySummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center px-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-white rounded-3xl p-8 space-y-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 mx-auto rounded-full bg-[#16A34A]/10 flex items-center justify-center"
          >
            <div className="w-8 h-8 rounded-full bg-[#16A34A]" />
          </motion.div>
          <h2 className="text-2xl tracking-tight" style={{ letterSpacing: '-0.04em' }}>
            Today counted.
          </h2>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          {data.focusSessions > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between p-4 border border-black/5 rounded-2xl"
            >
              <span className="text-black/60">Focus sessions</span>
              <span className="font-medium">{data.focusSessions}</span>
            </motion.div>
          )}

          {data.tasksCompleted > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between p-4 border border-black/5 rounded-2xl"
            >
              <span className="text-black/60">Tasks completed</span>
              <span className="font-medium">{data.tasksCompleted}</span>
            </motion.div>
          )}

          {data.habitsCompleted > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between p-4 border border-black/5 rounded-2xl"
            >
              <span className="text-black/60">Habits completed</span>
              <span className="font-medium">{data.habitsCompleted}</span>
            </motion.div>
          )}
        </div>

        {/* XP Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-black/60">XP gained today</span>
            <span className="text-[#16A34A] font-medium">+{data.xpGained}</span>
          </div>
          <XPProgress
            currentXP={data.currentXP}
            levelXP={data.levelXP}
            level={data.level}
            showLabel={true}
            size="large"
          />
        </motion.div>

        {/* Streak */}
        {data.streakDays > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-4 bg-[#16A34A]/5 rounded-2xl text-center"
          >
            <p className="text-black/60 mb-2">Current streak</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
              <p className="text-2xl tracking-tight" style={{ letterSpacing: '-0.04em' }}>
                {data.streakDays} {data.streakDays === 1 ? 'day' : 'days'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Close button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            onClick={onClose}
            className="w-full bg-black hover:bg-black/90 text-white rounded-3xl h-16 transition-all active:scale-[0.98]"
          >
            Continue
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
