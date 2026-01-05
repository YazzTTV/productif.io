import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Play, Calendar, CheckCircle2 } from 'lucide-react';

interface SuccessProps {
  firstName: string;
  onStartFocus: () => void;
  t: any;
}

export function Success({ firstName, onStartFocus, t }: SuccessProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-12"
      >
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex flex-col items-center space-y-6"
        >
          <div className="relative">
            {/* Outer ring */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="w-32 h-32 rounded-full bg-[#16A34A]/10"
            />

            {/* Middle ring */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-[#16A34A]/20"
            />

            {/* Inner circle with icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5, type: 'spring', stiffness: 200 }}
              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[#16A34A] flex items-center justify-center"
            >
              <CheckCircle2 className="w-10 h-10 text-white" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center space-y-3"
          >
            <h1
              className="tracking-tight"
              style={{ letterSpacing: '-0.04em', fontSize: '2rem', lineHeight: '1.2' }}
            >
              {t.dayIsReady}
            </h1>
            {firstName && (
              <p className="text-xl text-black/60">
                Welcome, {firstName} 👋
              </p>
            )}
            <p className="text-black/60">{t.focusWithoutThinking}</p>
          </motion.div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="space-y-3"
        >
          <Button
            onClick={onStartFocus}
            className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 text-lg flex items-center justify-center gap-2 shadow-lg shadow-[#16A34A]/20"
          >
            <Play className="w-5 h-5" />
            {t.startFocus}
          </Button>

          <Button
            onClick={onStartFocus}
            variant="outline"
            className="w-full border-black/10 hover:bg-black/5 rounded-3xl h-14 flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            {t.viewInCalendar}
          </Button>
        </motion.div>

        {/* Free plan indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/5">
            <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <span className="text-sm text-black/60">{t.freePlanActivated}</span>
          </div>
        </motion.div>

        {/* Subtle confetti effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 0.7, duration: 2 }}
          className="absolute inset-0 pointer-events-none"
        >
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -20, x: '50vw', opacity: 0 }}
              animate={{
                y: '100vh',
                x: `${45 + Math.random() * 10}vw`,
                opacity: [0, 1, 1, 0],
                rotate: Math.random() * 360,
              }}
              transition={{
                delay: 0.7 + i * 0.1,
                duration: 2 + Math.random(),
                ease: 'easeOut',
              }}
              className="absolute w-2 h-2 rounded-full bg-[#16A34A]"
              style={{ left: `${Math.random() * 100}%` }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
