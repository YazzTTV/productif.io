import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';

interface DailyStrugglesProps {
  dailyStruggles: string[];
  onContinue: (struggles: string[]) => void;
  t: any;
}

export function DailyStruggles({
  dailyStruggles: initialStruggles,
  onContinue,
  t,
}: DailyStrugglesProps) {
  const [selectedStruggles, setSelectedStruggles] = useState<string[]>(initialStruggles);

  const struggles = [
    { value: 'toomany', label: t.tooManyTasks },
    { value: 'focus', label: t.difficultyFocusing },
    { value: 'stress', label: t.constantStress },
    { value: 'guilt', label: t.guiltyResting },
    { value: 'fear', label: t.fearFallingBehind },
  ];

  const toggleStruggle = (struggle: string) => {
    if (selectedStruggles.includes(struggle)) {
      setSelectedStruggles(selectedStruggles.filter(s => s !== struggle));
    } else {
      setSelectedStruggles([...selectedStruggles, struggle]);
    }
  };

  const handleContinue = () => {
    onContinue(selectedStruggles);
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
            {t.dailyDifficulties}
          </h1>
          <p className="text-black/40 text-sm">{t.selectMultiple}</p>
        </div>

        {/* Struggles selection */}
        <div className="space-y-3">
          {struggles.map((struggle, index) => {
            const isSelected = selectedStruggles.includes(struggle.value);

            return (
              <motion.button
                key={struggle.value}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleStruggle(struggle.value)}
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
                  <span>{struggle.label}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        <Button
          onClick={handleContinue}
          className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 text-lg"
        >
          {t.next}
        </Button>
      </motion.div>
    </div>
  );
}
