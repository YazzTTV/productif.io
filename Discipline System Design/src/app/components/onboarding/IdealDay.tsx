import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Calendar, Play, Edit3 } from 'lucide-react';

interface IdealDayProps {
  idealDay: any;
  onSyncCalendar: () => void;
  onStartFocus: () => void;
  t: any;
}

export function IdealDay({ idealDay, onSyncCalendar, onStartFocus, t }: IdealDayProps) {
  if (!idealDay) return null;

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full mx-auto space-y-8 flex-1"
      >
        <div className="text-center space-y-3">
          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
            {t.idealDayTitle}
          </h1>
        </div>

        {/* Top priorities card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-3xl bg-gradient-to-br from-[#16A34A]/10 to-[#16A34A]/5 border border-[#16A34A]/20"
        >
          <h2 className="text-lg tracking-tight mb-4" style={{ letterSpacing: '-0.02em' }}>
            {t.topPriorities}
          </h2>
          <div className="space-y-2">
            {idealDay.priorities.map((priority: string, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-sm">
                  {index + 1}
                </div>
                <span className="text-black/80">{priority}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="space-y-2">
          {idealDay.timeline.map((block: any, index: number) => {
            if (block.duration === 0) return null;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.03 }}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  block.priority
                    ? 'border-[#16A34A]/30 bg-[#16A34A]/5'
                    : 'border-black/10 bg-white'
                }`}
              >
                <div className="flex flex-col items-center gap-1 w-16 flex-shrink-0">
                  <span className="text-sm text-black/60">{block.time}</span>
                  <span className="text-xs text-black/40">{block.duration}min</span>
                </div>

                <div className="flex-1">
                  <p className={block.priority ? 'text-black' : 'text-black/70'}>
                    {block.activity}
                  </p>
                </div>

                {block.priority && (
                  <div className="w-2 h-2 rounded-full bg-[#16A34A] flex-shrink-0" />
                )}
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-black/60"
        >
          {t.enoughForGoodDay}
        </motion.p>
      </motion.div>

      {/* Fixed bottom CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="max-w-2xl w-full mx-auto pt-6 space-y-3"
      >
        <Button
          onClick={onSyncCalendar}
          className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 text-lg flex items-center justify-center gap-2"
        >
          <Calendar className="w-5 h-5" />
          {t.syncCalendar}
        </Button>

        <div className="flex gap-3">
          <Button
            onClick={onStartFocus}
            variant="outline"
            className="flex-1 border-black/10 hover:bg-black/5 rounded-2xl h-12 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            {t.startFocusNow}
          </Button>

          <Button
            variant="ghost"
            className="flex-1 hover:bg-black/5 rounded-2xl h-12 flex items-center justify-center gap-2 text-black/60"
          >
            <Edit3 className="w-4 h-4" />
            {t.adjust}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
