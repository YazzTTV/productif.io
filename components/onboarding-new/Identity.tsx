"use client"

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface IdentityProps {
  firstName: string;
  studentType: string;
  onContinue: (firstName: string, studentType: string) => void;
  t: any;
}

export function Identity({ firstName: initialFirstName, studentType: initialStudentType, onContinue, t }: IdentityProps) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [studentType, setStudentType] = useState(initialStudentType);

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

  const studentTypes = [
    { value: 'highschool', label: getTranslation('highSchool', 'Lycée') },
    { value: 'university', label: getTranslation('university', 'Université') },
    { value: 'medlawprepa', label: getTranslation('medLawPrepa', 'Médecine / Droit / Prépa') },
    { value: 'engineering', label: getTranslation('engineeringBusiness', "École d'ingénieurs / Commerce") },
    { value: 'other', label: getTranslation('other', 'Autre') },
  ];

  const handleContinue = () => {
    if (firstName && studentType) {
      onContinue(firstName, studentType);
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
            {getTranslation('tellAboutYourself', 'Parlez-nous de vous.')}
          </h1>
        </div>

        <div className="space-y-6">
          {/* First name */}
          <div className="space-y-2">
            <label className="text-sm text-black/60 px-1">{getTranslation('firstName', 'Prénom')}</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Alex"
              className="w-full px-4 py-4 border border-black/10 rounded-2xl bg-white focus:outline-none focus:border-black/20 transition-colors text-lg"
              style={{ letterSpacing: '-0.01em' }}
            />
          </div>

          {/* Student type */}
          <div className="space-y-3">
            <label className="text-sm text-black/60 px-1">{getTranslation('studentType', "Type d'étudiant")}</label>
            <div className="space-y-2">
              {studentTypes.map((type, index) => (
                <motion.button
                  key={type.value}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStudentType(type.value)}
                  className={`w-full p-4 rounded-2xl border transition-all text-left ${
                    studentType === type.value
                      ? 'border-black bg-black text-white'
                      : 'border-black/10 hover:border-black/20 hover:bg-black/5'
                  }`}
                >
                  {type.label}
                </motion.button>
              ))}
            </div>
          </div>

          <p className="text-xs text-black/40 px-1">{getTranslation('helpsAdapt', 'Cela nous aide à adapter le système pour vous.')}</p>
        </div>

        <Button
          onClick={handleContinue}
          disabled={!firstName || !studentType}
          className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 text-lg disabled:opacity-40"
        >
          {getTranslation('next', 'Suivant')}
        </Button>
      </motion.div>
    </div>
  );
}


