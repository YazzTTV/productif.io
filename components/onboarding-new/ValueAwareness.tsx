"use client"

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface ValueAwarenessProps {
  onContinue: () => void;
  t: any;
}

export function ValueAwareness({ onContinue, t }: ValueAwarenessProps) {
  // Helper to get translation with fallback
  const getTranslation = (key: string, fallback: string) => {
    if (!t) return fallback;
    if (typeof t === 'function') {
      const translation = t(key);
      return translation && translation !== key ? translation : fallback;
    } else if (typeof t === 'object' && t[key]) {
      return t[key];
    }
    return fallback;
  };

  const [currentStatement, setCurrentStatement] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const statements = [
    getTranslation('workALot', 'Vous travaillez beaucoup.'),
    getTranslation('stayDisciplined', 'Vous essayez de rester discipliné.'),
    getTranslation('feelsScattered', 'Mais tout semble éparpillé.'),
  ];

  useEffect(() => {
    if (currentStatement < statements.length) {
      const timer = setTimeout(() => {
        setCurrentStatement(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setShowAll(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentStatement, statements.length]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-lg w-full space-y-12"
      >
        <div className="text-center space-y-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="tracking-tight text-3xl font-bold"
            style={{ letterSpacing: '-0.04em' }}
          >
            {getTranslation('notTheProblem', "Vous n'êtes pas le problème.")}
          </motion.h1>

          {/* Animated statements */}
          <div className="space-y-4">
            <AnimatePresence>
              {statements.slice(0, currentStatement + 1).map((statement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-2xl bg-black/5"
                >
                  <p className="text-lg text-black/70">{statement}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Final message */}
          <AnimatePresence>
            {showAll && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="h-px bg-black/10" />
                <p className="text-xl text-black tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                  {getTranslation('lackOfSystem', "Le problème est l'absence d'un système clair.")}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CTA */}
        <AnimatePresence>
          {showAll && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={onContinue}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 text-lg"
              >
                {getTranslation('continue', 'Continuer')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}


