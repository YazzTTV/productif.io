import { motion } from 'motion/react';

interface StreakIndicatorProps {
  streak: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export function StreakIndicator({ streak, size = 'medium', showLabel = true }: StreakIndicatorProps) {
  const dotSizes = {
    small: 'w-2 h-2',
    medium: 'w-2.5 h-2.5',
    large: 'w-3 h-3'
  };

  const textSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  return (
    <div className="flex items-center gap-2">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className={`${dotSizes[size]} rounded-full bg-[#16A34A]`}
      />
      {showLabel && (
        <span className={`${textSizes[size]} text-black/60`}>
          {streak} day{streak !== 1 ? 's' : ''} consistent
        </span>
      )}
    </div>
  );
}
