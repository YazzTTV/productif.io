import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { CheckCircle2 } from 'lucide-react';

interface TutorialCompletionProps {
  onComplete: () => void;
}

export function TutorialCompletion({ onComplete }: TutorialCompletionProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-12"
      >
        {/* Success icon with animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            delay: 0.2,
            type: 'spring',
            stiffness: 200,
            damping: 15
          }}
          className="flex justify-center"
        >
          <div className="relative">
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeOut'
              }}
              className="absolute inset-0 rounded-full bg-[#16A34A]"
            />
            <CheckCircle2 
              className="w-24 h-24 text-[#16A34A] relative z-10" 
              strokeWidth={1.5}
            />
          </div>
        </motion.div>

        {/* Text content */}
        <div className="text-center space-y-4">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="tracking-tight"
            style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}
          >
            You're set.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-black/60 text-lg"
          >
            You now have a system — not just an app.
          </motion.p>
        </div>

        {/* Progress completion visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-black/60">Tutorial progress</span>
            <span className="text-[#16A34A] font-medium">100%</span>
          </div>
          <div className="h-2 bg-black/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.7, duration: 1, ease: 'easeOut' }}
              className="h-full bg-[#16A34A] rounded-full"
            />
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="space-y-4"
        >
          <Button
            onClick={onComplete}
            className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 text-lg shadow-lg shadow-[#16A34A]/20 hover:shadow-xl hover:shadow-[#16A34A]/30 transition-all"
          >
            Go to my dashboard
          </Button>

          <p className="text-center text-sm text-black/40">
            You can restart the tutorial anytime in Settings
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
