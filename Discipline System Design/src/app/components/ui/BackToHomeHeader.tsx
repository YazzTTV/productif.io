import { motion } from 'motion/react';
import { Home, ArrowLeft } from 'lucide-react';

interface BackToHomeHeaderProps {
  onBack: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  useHomeIcon?: boolean; // If true, shows Home icon instead of ArrowLeft
}

export function BackToHomeHeader({ 
  onBack, 
  title, 
  subtitle,
  icon,
  useHomeIcon = false 
}: BackToHomeHeaderProps) {
  return (
    <div className="px-6 pt-8 pb-6 border-b border-black/5 bg-white sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5 transition-colors shadow-sm"
          aria-label="Back to home"
        >
          {useHomeIcon ? (
            <Home className="w-5 h-5 text-black/60" strokeWidth={2} />
          ) : (
            <ArrowLeft className="w-5 h-5 text-black/60" strokeWidth={2} />
          )}
        </motion.button>

        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex-shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '1.25rem' }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-black/60 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
