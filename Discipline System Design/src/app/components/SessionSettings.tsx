import { useState } from 'react';
import { Button } from './ui/button';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SessionSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  focusDuration: number;
  breakDuration: number;
  maxSessions: number;
  onSave: (settings: { focusDuration: number; breakDuration: number; maxSessions: number }) => void;
  mode?: 'focus' | 'exam';
}

export function SessionSettings({
  isOpen,
  onClose,
  focusDuration,
  breakDuration,
  maxSessions,
  onSave,
  mode = 'focus',
}: SessionSettingsProps) {
  const [localFocusDuration, setLocalFocusDuration] = useState(focusDuration);
  const [localBreakDuration, setLocalBreakDuration] = useState(breakDuration);
  const [localMaxSessions, setLocalMaxSessions] = useState(maxSessions);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const focusDurations = mode === 'exam' ? [25, 35, 45, 60, 90] : [25, 45, 60, 90];
  const breakDurations = [5, 10, 15, 20];

  const handleSave = () => {
    onSave({
      focusDuration: localFocusDuration,
      breakDuration: localBreakDuration,
      maxSessions: localMaxSessions,
    });
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-black/5 px-6 py-6 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl tracking-tight" style={{ letterSpacing: '-0.04em' }}>
                Session Settings
              </h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5 transition-colors"
              >
                <X className="w-5 h-5 text-black/60" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-6">
            {/* Focus Duration */}
            <div className="space-y-4">
              <div>
                <p className="font-medium mb-1">Focus duration</p>
                <p className="text-sm text-black/60">Length of each focus session</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                {focusDurations.map((duration) => (
                  <motion.button
                    key={duration}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setLocalFocusDuration(duration)}
                    className={`flex-1 min-w-[70px] py-3 rounded-2xl border transition-all ${
                      localFocusDuration === duration
                        ? 'border-[#16A34A] bg-[#16A34A]/10 text-[#16A34A]'
                        : 'border-black/10 hover:border-black/20'
                    }`}
                  >
                    {duration}m
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Break Duration */}
            <div className="space-y-4">
              <div>
                <p className="font-medium mb-1">Break duration</p>
                <p className="text-sm text-black/60">Rest between sessions</p>
              </div>
              <div className="flex gap-3">
                {breakDurations.map((duration) => (
                  <motion.button
                    key={duration}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setLocalBreakDuration(duration)}
                    className={`flex-1 py-3 rounded-2xl border transition-all ${
                      localBreakDuration === duration
                        ? 'border-[#16A34A] bg-[#16A34A]/10 text-[#16A34A]'
                        : 'border-black/10 hover:border-black/20'
                    }`}
                  >
                    {duration}m
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Max Sessions */}
            <div className="space-y-4">
              <div>
                <p className="font-medium mb-1">Maximum sessions</p>
                <p className="text-sm text-black/60">Sessions planned for today</p>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={localMaxSessions}
                  onChange={(e) => setLocalMaxSessions(Number(e.target.value))}
                  className="flex-1 h-2 bg-black/5 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#16A34A] [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <span className="text-2xl font-medium w-8 text-center">{localMaxSessions}</span>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-2xl bg-black/5 border border-black/10">
              <p className="text-sm text-black/60 mb-2">Session preview</p>
              <p className="text-black/80">
                {localMaxSessions} × {localFocusDuration}min focus + {localBreakDuration}min break
              </p>
              <p className="text-sm text-black/60 mt-2">
                Total time: ~{Math.round((localFocusDuration + localBreakDuration) * localMaxSessions)}min
              </p>
            </div>

            {/* Save button */}
            <Button
              onClick={handleSave}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 relative overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {savedFeedback ? (
                  <motion.div
                    key="saved"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    <span>Saved</span>
                  </motion.div>
                ) : (
                  <motion.span
                    key="save"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    Save Settings
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
