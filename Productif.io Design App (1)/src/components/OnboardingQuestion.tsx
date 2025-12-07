import { motion } from 'motion/react';
import { Screen } from '../App';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface Option {
  id: string;
  text: string;
}

interface OnboardingQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  options: Option[];
  onAnswer: (answer: string) => void;
  onBack?: () => void;
  socialProof?: string;
}

export function OnboardingQuestion({
  questionNumber,
  totalQuestions,
  question,
  options,
  onAnswer,
  onBack,
  socialProof
}: OnboardingQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showSocialProof, setShowSocialProof] = useState(false);

  const progress = (questionNumber / totalQuestions) * 100;

  const handleSelect = (optionId: string) => {
    setSelectedOption(optionId);
    
    // If there's social proof, show it first
    if (socialProof) {
      setTimeout(() => {
        setShowSocialProof(true);
      }, 300);
      
      setTimeout(() => {
        onAnswer(optionId);
      }, 2500);
    } else {
      setTimeout(() => {
        onAnswer(optionId);
      }, 400);
    }
  };

  return (
    <div className="min-h-[844px] bg-white px-6 py-16 flex flex-col">
      {/* Header */}
      <div className="mb-8">
        {/* Back Button */}
        {onBack && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onBack}
            className="mb-6 p-2 -ml-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={24} />
          </motion.button>
        )}

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Question {questionNumber} of {totalQuestions}</span>
            <span className="text-sm text-[#00C27A]">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#00C27A] to-[#00D68F]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>

        {/* Question */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-800 leading-tight"
        >
          {question}
        </motion.h2>
      </div>

      {/* Options */}
      <div className="flex-1 space-y-4">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            onClick={() => handleSelect(option.id)}
            disabled={selectedOption !== null}
            whileHover={{ scale: selectedOption ? 1 : 1.02 }}
            whileTap={{ 
              scale: 0.95,
              rotate: [0, -2, 2, 0],
              transition: { duration: 0.3 }
            }}
            className={`w-full p-5 rounded-2xl border-2 transition-all text-left relative ${
              selectedOption === option.id
                ? 'border-[#00C27A] bg-[#00C27A]/5 shadow-lg'
                : selectedOption
                ? 'border-gray-200 bg-gray-50 opacity-50'
                : 'border-gray-200 bg-white hover:border-[#00C27A]/50 hover:shadow-md'
            }`}
          >
            {/* Ripple effect on selection */}
            {selectedOption === option.id && (
              <motion.div
                className="absolute inset-0 rounded-2xl bg-[#00C27A]/20"
                initial={{ scale: 0, opacity: 0.5 }}
                animate={{ 
                  scale: [1, 1.5, 2],
                  opacity: [0.5, 0.2, 0]
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            )}
            
            <div className="flex items-start gap-4">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                selectedOption === option.id
                  ? 'border-[#00C27A] bg-[#00C27A]'
                  : 'border-gray-300'
              }`}>
                {selectedOption === option.id && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  >
                    <CheckCircle2 size={24} className="text-white -ml-[9px] -mt-[9px]" />
                  </motion.div>
                )}
              </div>
              <span className="text-gray-700 flex-1">{option.text}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Social Proof */}
      {socialProof && showSocialProof && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="mt-6 p-4 bg-gradient-to-br from-[#00C27A]/10 to-white rounded-2xl border border-[#00C27A]/30 shadow-lg"
        >
          <p className="text-center text-gray-700 flex items-center justify-center gap-2">
            <span className="text-[#00C27A]">💚</span>
            {socialProof}
          </p>
        </motion.div>
      )}
    </div>
  );
}