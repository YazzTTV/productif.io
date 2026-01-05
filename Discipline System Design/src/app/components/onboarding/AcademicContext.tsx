import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';

interface AcademicContextProps {
  currentSituation: string;
  onContinue: (situation: string) => void;
  t: any;
}

export function AcademicContext({
  currentSituation: initialSituation,
  onContinue,
  t,
}: AcademicContextProps) {
  const [currentSituation, setCurrentSituation] = useState(initialSituation);

  const situations = [
    { value: 'exams', label: t.preparingExams },
    { value: 'consistency', label: t.maintainingConsistency },
    { value: 'catchingup', label: t.catchingUp },
    { value: 'highperformance', label: t.highPerformance },
    { value: 'stressmanagement', label: t.stressManagement },
  ];

  const handleContinue = () => {
    if (currentSituation) {
      onContinue(currentSituation);
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
            {t.currentSituation}
          </h1>
          <p className="text-black/40 text-sm">{t.selectOne}</p>
        </div>

        {/* Situations selection */}
        <div className="space-y-3">
          {situations.map((situation, index) => {
            const isSelected = currentSituation === situation.value;

            return (
              <motion.button
                key={situation.value}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentSituation(situation.value)}
                className={`w-full p-4 rounded-2xl border transition-all text-left ${
                  isSelected
                    ? 'border-black bg-black text-white'
                    : 'border-black/10 hover:border-black/20 hover:bg-black/5'
                }`}
              >
                {situation.label}
              </motion.button>
            );
          })}
        </div>

        <Button
          onClick={handleContinue}
          disabled={!currentSituation}
          className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 text-lg disabled:opacity-40"
        >
          {t.next}
        </Button>
      </motion.div>
    </div>
  );
}
