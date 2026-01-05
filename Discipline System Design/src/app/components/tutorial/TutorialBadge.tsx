import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface TutorialBadgeProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  pulse?: boolean;
  onClick?: () => void;
}

export function TutorialBadge({ 
  position = 'top-right', 
  pulse = true,
  onClick 
}: TutorialBadgeProps) {
  const positionClasses = {
    'top-right': 'top-0 right-0 translate-x-1/3 -translate-y-1/3',
    'top-left': 'top-0 left-0 -translate-x-1/3 -translate-y-1/3',
    'bottom-right': 'bottom-0 right-0 translate-x-1/3 translate-y-1/3',
    'bottom-left': 'bottom-0 left-0 -translate-x-1/3 translate-y-1/3',
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`absolute ${positionClasses[position]} z-10`}
    >
      <button
        onClick={onClick}
        className="relative flex items-center justify-center"
      >
        {/* Pulsing ring */}
        {pulse && (
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            className="absolute w-8 h-8 rounded-full bg-[#16A34A]"
          />
        )}
        
        {/* Badge */}
        <div className="relative w-7 h-7 rounded-full bg-[#16A34A] flex items-center justify-center shadow-lg shadow-[#16A34A]/30">
          <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
      </button>
    </motion.div>
  );
}

// Alternative: Simple dot badge
export function TutorialDot({ pulse = true }: { pulse?: boolean }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="relative"
    >
      {pulse && (
        <motion.div
          animate={{
            scale: [1, 2, 1],
            opacity: [0.7, 0, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          className="absolute inset-0 rounded-full bg-[#16A34A]"
        />
      )}
      <div className="relative w-3 h-3 rounded-full bg-[#16A34A]" />
    </motion.div>
  );
}
