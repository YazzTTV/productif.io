import { motion } from 'motion/react';
import { Screen } from '../App';
import { useState, useEffect } from 'react';

interface BuildingPlanScreenProps {
  onComplete: () => void;
}

export function BuildingPlanScreen({ onComplete }: BuildingPlanScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const loadingSteps = [
    'Analyzing your answers...',
    'Identifying patterns...',
    'Building your profile...',
    'Personalizing insights...',
    'Almost ready...',
  ];

  useEffect(() => {
    // Smooth progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 60); // Will take about 6 seconds to complete

    // Update loading text based on progress
    const stepInterval = setInterval(() => {
      setProgress((current) => {
        if (current >= 20 && current < 40) setCurrentStepIndex(1);
        else if (current >= 40 && current < 60) setCurrentStepIndex(2);
        else if (current >= 60 && current < 80) setCurrentStepIndex(3);
        else if (current >= 80) setCurrentStepIndex(4);
        return current;
      });
    }, 100);

    // Navigate after completion
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 6500); // 6.5 seconds total

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Calculate circular progress
  const circumference = 2 * Math.PI * 120; // radius = 120
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="min-h-[844px] bg-white px-8 py-16 flex flex-col justify-center items-center">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-[#00C27A]/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Circular Progress */}
        <div className="relative mb-12">
          {/* Background Circle */}
          <svg className="transform -rotate-90" width="280" height="280">
            <circle
              cx="140"
              cy="140"
              r="120"
              stroke="#E5E7EB"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress Circle */}
            <motion.circle
              cx="140"
              cy="140"
              r="120"
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00C27A" />
                <stop offset="100%" stopColor="#00D68F" />
              </linearGradient>
            </defs>
          </svg>

          {/* Percentage in Center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              key={progress}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-gray-800 text-6xl mb-2">{progress}%</h1>
            </motion.div>
            
            {/* Completion checkmark */}
            {progress === 100 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="text-5xl"
              >
                ✓
              </motion.div>
            )}
          </div>
        </div>

        {/* Loading Status Text */}
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-gray-700 text-xl">
            {loadingSteps[currentStepIndex]}
          </p>
        </motion.div>

        {/* Loading dots animation */}
        <div className="flex gap-2 mt-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-full"
              animate={{
                y: [0, -12, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
