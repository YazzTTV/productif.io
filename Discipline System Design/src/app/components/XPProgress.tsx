import { motion } from 'motion/react';

interface XPProgressProps {
  currentXP: number;
  levelXP: number;
  level: number;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function XPProgress({ 
  currentXP, 
  levelXP, 
  level, 
  showLabel = true,
  size = 'medium' 
}: XPProgressProps) {
  const progress = (currentXP / levelXP) * 100;

  const heights = {
    small: 'h-1.5',
    medium: 'h-2',
    large: 'h-3'
  };

  const textSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center justify-between">
          <p className={`${textSizes[size]} text-black/60`}>
            Level {level}
          </p>
          <p className={`${textSizes[size]} text-black/40`}>
            {currentXP.toLocaleString()} / {levelXP.toLocaleString()} XP
          </p>
        </div>
      )}
      <div className={`w-full bg-black/5 rounded-full overflow-hidden ${heights[size]}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full bg-[#16A34A] rounded-full"
        />
      </div>
    </div>
  );
}
