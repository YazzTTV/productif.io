import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';

interface GoalsPressureProps {
  goals: string[];
  pressureLevel: number;
  onContinue: (goals: string[], pressureLevel: number) => void;
  t: any;
}

export function GoalsPressure({
  goals: initialGoals,
  pressureLevel: initialPressure,
  onContinue,
  t,
}: GoalsPressureProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(initialGoals);
  const [pressureLevel, setPressureLevel] = useState(initialPressure);

  const goalOptions = [
    { value: 'exams', label: t.succeedExams },
    { value: 'stress', label: t.reduceStress },
    { value: 'consistent', label: t.stayConsistent },
    { value: 'overwhelmed', label: t.stopOverwhelmed },
    { value: 'time', label: t.useTimeBetter },
  ];

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter(g => g !== goal));
    } else if (selectedGoals.length < 2) {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleContinue = () => {
    if (selectedGoals.length > 0) {
      onContinue(selectedGoals, pressureLevel);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center space-y-3">
          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
            {t.whatMatters}
          </h1>
          <p className="text-black/40 text-sm">{t.selectUpTo2}</p>
        </div>

        {/* Goals selection */}
        <div className="space-y-3">
          {goalOptions.map((goal, index) => {
            const isSelected = selectedGoals.includes(goal.value);
            const isDisabled = !isSelected && selectedGoals.length >= 2;

            return (
              <motion.button
                key={goal.value}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                onClick={() => !isDisabled && toggleGoal(goal.value)}
                disabled={isDisabled}
                className={`w-full p-4 rounded-2xl border transition-all text-left ${
                  isSelected
                    ? 'border-[#16A34A] bg-[#16A34A]/5 text-black'
                    : isDisabled
                    ? 'border-black/5 text-black/30 cursor-not-allowed'
                    : 'border-black/10 hover:border-black/20 hover:bg-black/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
                      isSelected ? 'border-[#16A34A] bg-[#16A34A]' : 'border-black/20'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2.5 h-2.5 rounded-full bg-white"
                      />
                    )}
                  </div>
                  <span>{goal.label}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Pressure slider */}
        <div className="space-y-4 pt-4">
          <label className="text-sm text-black/60 px-1">{t.pressureLevel}</label>

          <div className="space-y-3">
            <input
              type="range"
              min="1"
              max="5"
              value={pressureLevel}
              onChange={(e) => setPressureLevel(Number(e.target.value))}
              className="w-full h-2 bg-black/5 rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #16A34A 0%, #16A34A ${
                  ((pressureLevel - 1) / 4) * 100
                }%, #00000010 ${((pressureLevel - 1) / 4) * 100}%, #00000010 100%)`,
              }}
            />

            <div className="flex justify-between text-xs text-black/40">
              <span>{t.low}</span>
              <span>{t.veryHigh}</span>
            </div>
          </div>

          {/* Pressure indicators */}
          <div className="flex gap-1.5 justify-center pt-2">
            {[1, 2, 3, 4, 5].map(level => (
              <motion.div
                key={level}
                animate={{
                  scale: level === pressureLevel ? 1.2 : 1,
                  opacity: level <= pressureLevel ? 1 : 0.3,
                }}
                className={`w-2 h-8 rounded-full ${
                  level <= pressureLevel ? 'bg-[#16A34A]' : 'bg-black/10'
                }`}
                style={{ height: `${level * 6 + 16}px` }}
              />
            ))}
          </div>
        </div>

        <Button
          onClick={handleContinue}
          disabled={selectedGoals.length === 0}
          className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 text-lg disabled:opacity-40"
        >
          {t.next}
        </Button>
      </motion.div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #16A34A;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(22, 163, 74, 0.3);
        }
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #16A34A;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(22, 163, 74, 0.3);
        }
      `}</style>
    </div>
  );
}
