import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';

interface WorkStyleDiagnosticProps {
  mentalLoad: number;
  focusQuality: number;
  satisfaction: number;
  overthinkTasks: boolean | null;
  shouldDoMore: boolean | null;
  onContinue: (data: {
    mentalLoad: number;
    focusQuality: number;
    satisfaction: number;
    overthinkTasks: boolean;
    shouldDoMore: boolean;
  }) => void;
  t: any;
}

export function WorkStyleDiagnostic({
  mentalLoad: initialMentalLoad,
  focusQuality: initialFocusQuality,
  satisfaction: initialSatisfaction,
  overthinkTasks: initialOverthink,
  shouldDoMore: initialShouldDoMore,
  onContinue,
  t,
}: WorkStyleDiagnosticProps) {
  const [mentalLoad, setMentalLoad] = useState(initialMentalLoad);
  const [focusQuality, setFocusQuality] = useState(initialFocusQuality);
  const [satisfaction, setSatisfaction] = useState(initialSatisfaction);
  const [overthinkTasks, setOverthinkTasks] = useState<boolean | null>(initialOverthink);
  const [shouldDoMore, setShouldDoMore] = useState<boolean | null>(initialShouldDoMore);

  const handleContinue = () => {
    if (overthinkTasks !== null && shouldDoMore !== null) {
      onContinue({
        mentalLoad,
        focusQuality,
        satisfaction,
        overthinkTasks,
        shouldDoMore,
      });
    }
  };

  const getMentalLoadLabel = (value: number) => {
    if (value <= 2) return t.low;
    if (value === 3) return t.moderate;
    return t.overwhelming;
  };

  const getFocusQualityLabel = (value: number) => {
    if (value <= 2) return t.scattered;
    if (value === 3) return t.moderate;
    return t.deep;
  };

  const getSatisfactionLabel = (value: number) => {
    if (value <= 2) return t.never;
    if (value === 3) return t.sometimes;
    return t.often;
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-10"
      >
        <div className="text-center space-y-3">
          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
            {t.workStyleTitle}
          </h1>
          <p className="text-black/40 text-sm">{t.helpUsUnderstand}</p>
        </div>

        {/* Sliders */}
        <div className="space-y-8">
          {/* Mental Load */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm text-black/60">{t.mentalLoad}</label>
              <span className="text-black/40 text-sm">{getMentalLoadLabel(mentalLoad)}</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={mentalLoad}
              onChange={(e) => setMentalLoad(Number(e.target.value))}
              className="w-full h-2 bg-black/5 rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #16A34A 0%, #16A34A ${
                  ((mentalLoad - 1) / 4) * 100
                }%, #00000010 ${((mentalLoad - 1) / 4) * 100}%, #00000010 100%)`,
              }}
            />
            <div className="flex gap-1.5 justify-center pt-2">
              {[1, 2, 3, 4, 5].map(level => (
                <motion.div
                  key={level}
                  animate={{
                    scale: level === mentalLoad ? 1.2 : 1,
                    opacity: level <= mentalLoad ? 1 : 0.3,
                  }}
                  className={`w-2 rounded-full ${
                    level <= mentalLoad ? 'bg-[#16A34A]' : 'bg-black/10'
                  }`}
                  style={{ height: `${level * 6 + 16}px` }}
                />
              ))}
            </div>
          </div>

          {/* Focus Quality */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm text-black/60">{t.focusQuality}</label>
              <span className="text-black/40 text-sm">{getFocusQualityLabel(focusQuality)}</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={focusQuality}
              onChange={(e) => setFocusQuality(Number(e.target.value))}
              className="w-full h-2 bg-black/5 rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #16A34A 0%, #16A34A ${
                  ((focusQuality - 1) / 4) * 100
                }%, #00000010 ${((focusQuality - 1) / 4) * 100}%, #00000010 100%)`,
              }}
            />
            <div className="flex gap-1.5 justify-center pt-2">
              {[1, 2, 3, 4, 5].map(level => (
                <motion.div
                  key={level}
                  animate={{
                    scale: level === focusQuality ? 1.2 : 1,
                    opacity: level <= focusQuality ? 1 : 0.3,
                  }}
                  className={`w-2 rounded-full ${
                    level <= focusQuality ? 'bg-[#16A34A]' : 'bg-black/10'
                  }`}
                  style={{ height: `${level * 6 + 16}px` }}
                />
              ))}
            </div>
          </div>

          {/* Satisfaction */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm text-black/60">{t.endOfDaySatisfaction}</label>
              <span className="text-black/40 text-sm">{getSatisfactionLabel(satisfaction)}</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={satisfaction}
              onChange={(e) => setSatisfaction(Number(e.target.value))}
              className="w-full h-2 bg-black/5 rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #16A34A 0%, #16A34A ${
                  ((satisfaction - 1) / 4) * 100
                }%, #00000010 ${((satisfaction - 1) / 4) * 100}%, #00000010 100%)`,
              }}
            />
            <div className="flex gap-1.5 justify-center pt-2">
              {[1, 2, 3, 4, 5].map(level => (
                <motion.div
                  key={level}
                  animate={{
                    scale: level === satisfaction ? 1.2 : 1,
                    opacity: level <= satisfaction ? 1 : 0.3,
                  }}
                  className={`w-2 rounded-full ${
                    level <= satisfaction ? 'bg-[#16A34A]' : 'bg-black/10'
                  }`}
                  style={{ height: `${level * 6 + 16}px` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Binary questions */}
        <div className="space-y-4 pt-4">
          <div className="p-6 border border-black/10 rounded-2xl bg-white">
            <p className="mb-4">{t.overthinkQuestion}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setOverthinkTasks(true)}
                className={`flex-1 py-3 rounded-2xl border transition-all ${
                  overthinkTasks === true
                    ? 'border-[#16A34A] bg-[#16A34A]/5 text-black'
                    : 'border-black/10 hover:border-black/20'
                }`}
              >
                {t.yes}
              </button>
              <button
                onClick={() => setOverthinkTasks(false)}
                className={`flex-1 py-3 rounded-2xl border transition-all ${
                  overthinkTasks === false
                    ? 'border-[#16A34A] bg-[#16A34A]/5 text-black'
                    : 'border-black/10 hover:border-black/20'
                }`}
              >
                {t.no}
              </button>
            </div>
          </div>

          <div className="p-6 border border-black/10 rounded-2xl bg-white">
            <p className="mb-4">{t.shouldDoMoreQuestion}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShouldDoMore(true)}
                className={`flex-1 py-3 rounded-2xl border transition-all ${
                  shouldDoMore === true
                    ? 'border-[#16A34A] bg-[#16A34A]/5 text-black'
                    : 'border-black/10 hover:border-black/20'
                }`}
              >
                {t.yes}
              </button>
              <button
                onClick={() => setShouldDoMore(false)}
                className={`flex-1 py-3 rounded-2xl border transition-all ${
                  shouldDoMore === false
                    ? 'border-[#16A34A] bg-[#16A34A]/5 text-black'
                    : 'border-black/10 hover:border-black/20'
                }`}
              >
                {t.no}
              </button>
            </div>
          </div>
        </div>

        <Button
          onClick={handleContinue}
          disabled={overthinkTasks === null || shouldDoMore === null}
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
