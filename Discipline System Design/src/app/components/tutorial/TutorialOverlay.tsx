import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';

interface TutorialOverlayProps {
  isActive: boolean;
  highlightArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  tooltipContent?: ReactNode;
  arrowPosition?: 'top' | 'bottom' | 'left' | 'right';
  onDismiss?: () => void;
}

export function TutorialOverlay({
  isActive,
  highlightArea,
  tooltipPosition = 'bottom',
  tooltipContent,
  arrowPosition = 'top',
  onDismiss,
}: TutorialOverlayProps) {
  if (!isActive) return null;

  const getArrowIcon = () => {
    switch (arrowPosition) {
      case 'top':
        return <ArrowUp className="w-6 h-6" />;
      case 'bottom':
        return <ArrowDown className="w-6 h-6" />;
      case 'left':
      case 'right':
        return <ArrowRight className="w-6 h-6" />;
      default:
        return <ArrowDown className="w-6 h-6" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
        onClick={onDismiss}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Spotlight highlight */}
        {highlightArea && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="absolute rounded-2xl border-4 border-[#16A34A] bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
            style={{
              left: highlightArea.x,
              top: highlightArea.y,
              width: highlightArea.width,
              height: highlightArea.height,
            }}
          >
            {/* Pulsing glow */}
            <motion.div
              animate={{
                opacity: [0.5, 0.8, 0.5],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 rounded-2xl border-4 border-[#16A34A] opacity-50"
            />
          </motion.div>
        )}

        {/* Tooltip with arrow */}
        {tooltipContent && highlightArea && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute bg-white rounded-2xl shadow-2xl p-6 max-w-sm"
            style={{
              left: tooltipPosition === 'right' 
                ? highlightArea.x + highlightArea.width + 20
                : tooltipPosition === 'left'
                ? highlightArea.x - 300
                : highlightArea.x,
              top: tooltipPosition === 'bottom'
                ? highlightArea.y + highlightArea.height + 20
                : tooltipPosition === 'top'
                ? highlightArea.y - 200
                : highlightArea.y,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated arrow pointing to highlight */}
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-[#16A34A] mb-3"
            >
              {getArrowIcon()}
            </motion.div>

            {tooltipContent}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Example usage tooltip component
export function TutorialTooltip({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="font-medium text-lg">{title}</h3>
        <p className="text-black/60 text-sm">{description}</p>
      </div>
      <button
        onClick={onAction}
        className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white py-2.5 rounded-xl transition-all text-sm font-medium"
      >
        {actionLabel}
      </button>
    </div>
  );
}
