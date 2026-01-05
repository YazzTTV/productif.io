import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronRight, Mic, Pause, Square } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

interface DailyJournalProps {
  onComplete: () => void;
  onBack: () => void;
}

type JournalStep = 'entry' | 'emotional' | 'energy' | 'offload' | 'complete';

interface JournalEntry {
  id: string;
  date: string;
  emotionalLevel: number; // 0-100 (0=calm, 100=heavy)
  energyLevel: number; // 0-100 (0=low, 100=high)
  note?: string;
}

export function DailyJournal({ onComplete, onBack }: DailyJournalProps) {
  const [step, setStep] = useState<JournalStep>('entry');
  const [emotionalLevel, setEmotionalLevel] = useState(50);
  const [energyLevel, setEnergyLevel] = useState(50);
  const [note, setNote] = useState('');

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Mock history data
  const [history, setHistory] = useState<JournalEntry[]>([
    { id: '1', date: '2024-12-30', emotionalLevel: 35, energyLevel: 65 },
    { id: '2', date: '2024-12-29', emotionalLevel: 60, energyLevel: 45, note: 'Long day...' },
    { id: '3', date: '2024-12-28', emotionalLevel: 25, energyLevel: 80 },
  ]);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const handleEmotionalContinue = () => {
    setStep('energy');
  };

  const handleEnergyContinue = () => {
    setStep('offload');
  };

  const handleOffloadContinue = () => {
    // Save entry to history
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      emotionalLevel,
      energyLevel,
      note: note.trim() || undefined,
    };
    setHistory([newEntry, ...history]);
    
    setStep('complete');
  };

  const handleClose = () => {
    onComplete();
  };

  const getEmotionalLabel = (value: number) => {
    if (value < 25) return 'Calm';
    if (value < 50) return 'Steady';
    if (value < 75) return 'Tense';
    return 'Heavy';
  };

  const getEnergyLabel = (value: number) => {
    if (value < 25) return 'Low';
    if (value < 50) return 'Moderate';
    if (value < 75) return 'Good';
    return 'High';
  };

  // Recording timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    setRecordingTime(0);
  };

  const handlePauseRecording = () => {
    setIsPaused(!isPaused);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    // Simulated transcription
    const simulatedTranscription = note ? `${note}\n\nToday was challenging but I managed to stay focused. Feeling tired but accomplished.` : "Today was challenging but I managed to stay focused. Feeling tired but accomplished.";
    setNote(simulatedTranscription);
    setRecordingTime(0);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━
  // ENTRY SCREEN
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'entry') {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-6 pt-12 pb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 mb-16"
          >
            <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2.5rem' }}>
              Daily journal
            </h1>
            <p className="text-black/60 text-lg">
              A moment to unload your thoughts.
            </p>
          </motion.div>

          {/* Recent entries preview */}
          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-12"
            >
              <p className="text-black/40 mb-4">Recent entries</p>
              <div className="space-y-2">
                {history.slice(0, 3).map((entry, index) => (
                  <motion.button
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + index * 0.05 }}
                    onClick={() => setExpandedEntryId(expandedEntryId === entry.id ? null : entry.id)}
                    className="w-full p-4 border border-black/5 rounded-2xl bg-white hover:bg-black/5 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            entry.emotionalLevel < 40 ? 'bg-[#16A34A]' :
                            entry.emotionalLevel < 70 ? 'bg-yellow-500' :
                            'bg-orange-500'
                          }`}
                        />
                        <p className="text-sm text-black/60">
                          {new Date(entry.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-black/40 transition-transform ${
                        expandedEntryId === entry.id ? 'rotate-90' : ''
                      }`} />
                    </div>
                    
                    <AnimatePresence>
                      {expandedEntryId === entry.id && entry.note && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pt-3 border-t border-black/5"
                        >
                          <p className="text-sm text-black/60 text-left">{entry.note}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              onClick={() => setStep('emotional')}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98]"
            >
              Begin today's entry
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // STEP 1 — EMOTIONAL CHECK-IN
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'emotional') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="px-6 pt-12 pb-8 border-b border-black/5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setStep('entry')}
            className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              <div className="w-1.5 h-1.5 rounded-full bg-black/10" />
              <div className="w-1.5 h-1.5 rounded-full bg-black/10" />
            </div>
            <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
              How did today feel overall?
            </h1>
          </motion.div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-md space-y-12"
          >
            {/* Current feeling label */}
            <div className="text-center">
              <p className="text-4xl tracking-tight mb-2" style={{ letterSpacing: '-0.04em' }}>
                {getEmotionalLabel(emotionalLevel)}
              </p>
              <p className="text-black/40">No right or wrong answer</p>
            </div>

            {/* Slider */}
            <div className="space-y-6">
              <Slider
                value={[emotionalLevel]}
                onValueChange={([value]) => setEmotionalLevel(value)}
                max={100}
                step={1}
                className="py-8"
              />
              <div className="flex justify-between text-sm text-black/40">
                <span>Calm</span>
                <span>Heavy</span>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 border-t border-black/5 bg-white"
        >
          <Button
            onClick={handleEmotionalContinue}
            className="w-full bg-black hover:bg-black/90 text-white rounded-3xl h-16 transition-all active:scale-[0.98]"
          >
            Continue
          </Button>
        </motion.div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // STEP 2 — ENERGY CHECK
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'energy') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="px-6 pt-12 pb-8 border-b border-black/5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setStep('emotional')}
            className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              <div className="w-1.5 h-1.5 rounded-full bg-black/10" />
            </div>
            <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
              How was your energy today?
            </h1>
          </motion.div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-md space-y-12"
          >
            {/* Current energy label */}
            <div className="text-center">
              <p className="text-4xl tracking-tight mb-2" style={{ letterSpacing: '-0.04em' }}>
                {getEnergyLabel(energyLevel)}
              </p>
              <p className="text-black/40">Just observe</p>
            </div>

            {/* Slider */}
            <div className="space-y-6">
              <Slider
                value={[energyLevel]}
                onValueChange={([value]) => setEnergyLevel(value)}
                max={100}
                step={1}
                className="py-8"
              />
              <div className="flex justify-between text-sm text-black/40">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 border-t border-black/5 bg-white"
        >
          <Button
            onClick={handleEnergyContinue}
            className="w-full bg-black hover:bg-black/90 text-white rounded-3xl h-16 transition-all active:scale-[0.98]"
          >
            Continue
          </Button>
        </motion.div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // STEP 3 — OPTIONAL TEXT OFFLOAD
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'offload') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="px-6 pt-12 pb-8 border-b border-black/5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setStep('energy')}
            className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            </div>
            <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
              Anything on your mind?
            </h1>
            <p className="text-black/40">Completely optional</p>
          </motion.div>
        </div>

        <div className="flex-1 px-6 pt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write freely. No one will analyze this."
              className="w-full h-64 p-6 border border-black/5 rounded-3xl bg-white resize-none focus:outline-none focus:border-black/10 transition-colors text-lg"
              style={{ letterSpacing: '-0.02em' }}
            />
            
            {/* Microphone button */}
            <div className="absolute bottom-4 right-4 flex items-center gap-3">
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-2 bg-[#16A34A]/10 border border-[#16A34A]/20 rounded-full"
                >
                  <div className="flex items-center gap-1.5">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-[#16A34A] rounded-full"
                        animate={{
                          height: isPaused ? '8px' : ['8px', '16px', '8px'],
                        }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[#16A34A] text-sm tabular-nums">
                    {formatTime(recordingTime)}
                  </span>
                </motion.div>
              )}
              
              <div className="flex items-center gap-2">
                {isRecording && (
                  <>
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePauseRecording}
                      className="w-12 h-12 rounded-full border-2 border-black/10 bg-white flex items-center justify-center hover:bg-black/5 transition-colors"
                    >
                      <Pause className="w-5 h-5 text-black/60" />
                    </motion.button>
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleStopRecording}
                      className="w-12 h-12 rounded-full border-2 border-[#16A34A]/20 bg-[#16A34A] flex items-center justify-center hover:bg-[#16A34A]/90 transition-colors shadow-lg shadow-[#16A34A]/30"
                    >
                      <Square className="w-5 h-5 text-white fill-white" />
                    </motion.button>
                  </>
                )}
                
                {!isRecording && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartRecording}
                    className="w-14 h-14 rounded-full border-2 border-[#16A34A]/20 bg-[#16A34A] flex items-center justify-center hover:bg-[#16A34A]/90 transition-all shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40"
                  >
                    <Mic className="w-6 h-6 text-white" />
                  </motion.button>
                )}
              </div>
            </div>
            
            <p className="text-black/30 text-sm mt-3">
              {isRecording 
                ? 'Recording... Speak freely.' 
                : 'This stays private. No AI feedback.'}
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 border-t border-black/5 bg-white space-y-3"
        >
          <Button
            onClick={handleOffloadContinue}
            className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98]"
          >
            Close journal
          </Button>
          {note.trim() && (
            <p className="text-center text-sm text-black/40">
              {note.trim().length} characters written
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━
  // STEP 4 — CLOSING CONFIRMATION
  // ━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-12"
        >
          <div className="space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-[#16A34A]/10 flex items-center justify-center mx-auto"
            >
              <div className="w-10 h-10 rounded-full bg-[#16A34A]" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <h2 className="text-3xl tracking-tight" style={{ letterSpacing: '-0.04em' }}>
                Noted.
              </h2>
              <p className="text-black/40">
                No action required.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <Button
              onClick={handleClose}
              className="w-full bg-black hover:bg-black/90 text-white rounded-3xl h-16 transition-all active:scale-[0.98]"
            >
              Close journal
            </Button>
            <p className="text-black/30 text-sm">
              The day is closed.
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return null;
}