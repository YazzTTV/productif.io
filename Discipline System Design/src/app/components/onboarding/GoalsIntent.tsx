import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';

interface GoalsIntentProps {
  wantToChange: string[];
  timeHorizon: string;
  onContinue: (wantToChange: string[], timeHorizon: string) => void;
  t: any;
}

export function GoalsIntent({
  wantToChange: initialWantToChange,
  timeHorizon: initialTimeHorizon,
  onContinue,
  t,
}: GoalsIntentProps) {
  const [wantToChange, setWantToChange] = useState<string[]>(initialWantToChange);
  const [timeHorizon, setTimeHorizon] = useState(initialTimeHorizon);

  const goals = [
    { value: 'clarity', label: t.workWithClarity },
    { value: 'control', label: t.feelInControl },
    { value: 'reducestress', label: t.reduceStress },
    { value: 'consistent', label: t.beConsistent },
    { value: 'mentalenergy', label: t.stopWastingEnergy },
  ];

  const horizons = [
    { value: 'twoweeks', label: t.next2Weeks },
    { value: 'semester', label: t.thisSemester },
    { value: 'year', label: t.thisYear },
  ];

  const toggleGoal = (goal: string) => {
    if (wantToChange.includes(goal)) {
      setWantToChange(wantToChange.filter(g => g !== goal));
    } else {
      setWantToChange([...wantToChange, goal]);
    }
  };

  const handleContinue = () => {
    if (wantToChange.length > 0 && timeHorizon) {
      onContinue(wantToChange, timeHorizon);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center space-y-3">
          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
            {t.whatToChange}
          </h1>
          <p className="text-black/40 text-sm">{t.selectMultiple}</p>
        </div>

        {/* Goals selection */}
        <div className="space-y-3">
          {goals.map((goal, index) => {
            const isSelected = wantToChange.includes(goal.value);

            return (
              <motion.button
                key={goal.value}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleGoal(goal.value)}
                className={`w-full p-4 rounded-2xl border transition-all text-left ${
                  isSelected
                    ? 'border-[#16A34A] bg-[#16A34A]/5 text-black'
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

        {/* Time horizon */}
        <div className="space-y-4 pt-4">
          <label className="text-sm text-black/60 px-1">{t.timeHorizon}</label>
          <div className="space-y-2">
            {horizons.map((horizon) => {
              const isSelected = timeHorizon === horizon.value;

              return (
                <motion.button
                  key={horizon.value}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTimeHorizon(horizon.value)}
                  className={`w-full p-4 rounded-2xl border transition-all text-left ${
                    isSelected
                      ? 'border-black bg-black text-white'
                      : 'border-black/10 hover:border-black/20 hover:bg-black/5'
                  }`}
                >
                  {horizon.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        <Button
          onClick={handleContinue}
          disabled={wantToChange.length === 0 || !timeHorizon}
          className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 text-lg disabled:opacity-40"
        >
          {t.next}
        </Button>
      </motion.div>
    </div>
  );
}
