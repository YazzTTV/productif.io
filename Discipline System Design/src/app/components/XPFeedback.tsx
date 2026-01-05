import { motion } from 'motion/react';

interface XPFeedbackProps {
  xpGained: number;
  message?: string;
}

export function XPFeedback({ xpGained, message = 'Progress updated.' }: XPFeedbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-3 p-4 bg-[#16A34A]/5 border border-[#16A34A]/10 rounded-2xl"
    >
      <div className="flex-1">
        <p className="text-sm text-black/60">{message}</p>
      </div>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="flex items-center gap-1.5"
      >
        <span className="text-[#16A34A] font-medium">+{xpGained}</span>
        <span className="text-[#16A34A]/60 text-sm">XP</span>
      </motion.div>
    </motion.div>
  );
}
