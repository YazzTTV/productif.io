"use client"

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';

interface TasksAwarenessProps {
  tasks: string;
  onContinue: (tasks: string) => void;
  t: any;
}

export function TasksAwareness({ tasks: initialTasks, onContinue, t }: TasksAwarenessProps) {
  const [tasks, setTasks] = useState(initialTasks || '');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to get translation with fallback
  const getTranslation = (key: string, fallback: string) => {
    if (!t) return fallback;
    // t can be either a function or an object
    if (typeof t === 'function') {
      const translation = t(key);
      return translation && translation !== key ? translation : fallback;
    } else if (typeof t === 'object' && t[key]) {
      return t[key];
    }
    return fallback;
  };

  const promptChips = [
    getTranslation('classesLectures', 'Cours / conférences'),
    getTranslation('deadlines', 'Échéances'),
    getTranslation('revisions', 'Révisions'),
    getTranslation('avoiding', "Choses que j'évite"),
    getTranslation('personalObligations', 'Obligations personnelles'),
  ];

  const handleChipClick = (chip: string) => {
    const newText = tasks ? `${tasks}\n${chip}: ` : `${chip}: `;
    setTasks(newText);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(newText.length, newText.length);
    }, 0);
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setTasks(prev => prev + '\n[Voice transcription would appear here]');
    } else {
      setIsRecording(true);
    }
  };

  const handleContinue = () => {
    if (tasks.trim()) {
      onContinue(tasks);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full space-y-8"
      >
        <div className="text-center space-y-3">
          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
            {getTranslation('whatToDo', 'Que devez-vous faire demain ?')}
          </h1>
          <p className="text-black/60">{getTranslation('writeOrSpeak', "Écrivez ou parlez librement. Nous organiserons tout.")}</p>
        </div>

        {/* Prompt chips */}
        <div className="flex flex-wrap gap-2 justify-center">
          {promptChips.map((chip, index) => (
            <motion.button
              key={chip}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleChipClick(chip)}
              className="px-4 py-2 rounded-full bg-black/5 hover:bg-black/10 text-sm text-black/60 hover:text-black transition-all"
            >
              {chip}
            </motion.button>
          ))}
        </div>

        {/* Text input with mic */}
        <div className="space-y-3">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
              placeholder={getTranslation('typeOrSpeak', 'Tapez ici ou appuyez sur le micro pour parler...')}
              rows={8}
              className="w-full px-4 py-4 pr-16 border border-black/10 rounded-2xl bg-white focus:outline-none focus:border-black/20 transition-colors resize-none"
              style={{ letterSpacing: '-0.01em' }}
            />

            {/* Mic button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleRecording}
              className={`absolute bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-black/5 hover:bg-black/10 text-black/60'
              }`}
            >
              {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </motion.button>

            {isRecording && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-4 right-4 flex items-center gap-2"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-2 h-2 rounded-full bg-red-500"
                />
                <span className="text-xs text-red-500">Recording...</span>
              </motion.div>
            )}
          </div>

          <p className="text-xs text-black/40 px-1">{getTranslation('messyIsFine', "Le désordre n'est pas grave.")}</p>
        </div>

        <Button
          onClick={handleContinue}
          disabled={!tasks.trim()}
          className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 text-lg disabled:opacity-40"
        >
          {getTranslation('continue', 'Continuer')}
        </Button>
      </motion.div>
    </div>
  );
}


