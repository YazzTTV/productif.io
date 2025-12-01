import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Screen } from '../App';
import { Sparkles } from 'lucide-react';
import { AnimatedBackground } from './AnimatedBackground';

interface ProcessingPageProps {
  onNavigate: (screen: Screen) => void;
}

export function ProcessingPage({ onNavigate }: ProcessingPageProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onNavigate('profile');
    }, 3500);

    return () => clearTimeout(timer);
  }, [onNavigate]);

  return (
    <div className="min-h-[844px] bg-white flex flex-col items-center justify-center px-8 relative">
      <AnimatedBackground />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center relative z-10"
      >
        {/* Animated Circle */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 352" }}
              animate={{ strokeDasharray: "352 352" }}
              transition={{ duration: 3, ease: "easeInOut" }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00C27A" />
                <stop offset="100%" stopColor="#00D68F" />
              </linearGradient>
            </defs>
          </svg>
          
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles size={32} className="text-[#00C27A]" />
          </motion.div>
        </div>

        <h2 className="text-gray-800 mb-3">Analyzing your productivity profile...</h2>
        <p className="text-gray-600 mb-8">Our AI is discovering your strengths and weaknesses</p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-[#00C27A]"
        >
          Processing...
        </motion.div>
      </motion.div>
    </div>
  );
}