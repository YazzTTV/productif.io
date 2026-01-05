import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface FocusModeProps {
  onExit: () => void;
}

export function FocusMode({ onExit }: FocusModeProps) {
  const [timeLeft, setTimeLeft] = useState(90 * 60); // 90 minutes in seconds
  const [isRunning, setIsRunning] = useState(true);
  const totalTime = 90 * 60;

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center px-6 relative">
      {/* Exit button */}
      <button
        onClick={onExit}
        className="absolute top-8 right-8 w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="max-w-md w-full flex flex-col items-center">
        {/* Progress Ring */}
        <div className="relative w-64 h-64 mb-12">
          <svg className="w-64 h-64 transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="#16A34A"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          
          {/* Timer */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="tracking-tight" style={{ fontSize: '3.5rem', letterSpacing: '-0.04em' }}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>

        {/* Task name */}
        <div className="text-center space-y-2 mb-12">
          <h2 className="tracking-tight" style={{ letterSpacing: '-0.04em' }}>
            Complete Chapter 12 Summary
          </h2>
          <p className="text-white/60">Organic Chemistry</p>
        </div>

        {/* Controls */}
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="px-12 py-4 bg-white text-[#0A0A0A] rounded-full hover:bg-white/90 transition-colors"
        >
          {isRunning ? 'Pause' : 'Resume'}
        </button>

        {/* Subtle instruction */}
        <p className="text-white/40 text-center mt-12">
          Everything else disappeared.
        </p>
      </div>
    </div>
  );
}
