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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center py-12 px-8">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-[#00C27A]/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Centered Content Container */}
      <div className="max-w-3xl w-full relative z-10">
        {/* Header */}
        <div className="mb-12">
          {/* Back Button */}
          {onBack && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onBack}
              className="mb-8 p-3 -ml-3 text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-xl transition-all"
            >
              <ArrowLeft size={28} />
            </motion.button>
          )}

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg text-gray-700">Question {questionNumber} of {totalQuestions}</span>
              <span className="text-lg text-[#00C27A] font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] shadow-sm"
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
            className="text-gray-900 leading-tight text-4xl text-center mb-4"
          >
            {question}
          </motion.h2>
        </div>

        {/* Options */}
        <div className="space-y-5 mb-8">
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
              className={`w-full p-7 rounded-3xl border-2 transition-all text-left relative ${
                selectedOption === option.id
                  ? 'border-[#00C27A] bg-gradient-to-br from-[#00C27A]/10 to-[#00D68F]/10 shadow-2xl'
                  : selectedOption
                  ? 'border-gray-200 bg-gray-100 opacity-50'
                  : 'border-gray-300 bg-white/80 backdrop-blur-sm hover:border-[#00C27A] hover:shadow-xl hover:bg-white'
              }`}
            >
              {/* Ripple effect on selection */}
              {selectedOption === option.id && (
                <motion.div
                  className="absolute inset-0 rounded-3xl bg-[#00C27A]/20"
                  initial={{ scale: 0, opacity: 0.5 }}
                  animate={{ 
                    scale: [1, 1.5, 2],
                    opacity: [0.5, 0.2, 0]
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              )}
              
              <div className="flex items-start gap-5">
                <div className={`w-8 h-8 rounded-full border-3 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${
                  selectedOption === option.id
                    ? 'border-[#00C27A] bg-[#00C27A] shadow-lg'
                    : 'border-gray-400'
                }`}>
                  {selectedOption === option.id && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                      <CheckCircle2 size={28} className="text-white -ml-[10px] -mt-[10px]" />
                    </motion.div>
                  )}
                </div>
                <span className="text-gray-800 flex-1 text-xl leading-relaxed">{option.text}</span>
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
            className="p-6 bg-gradient-to-br from-[#00C27A]/10 to-white rounded-3xl border-2 border-[#00C27A]/30 shadow-2xl backdrop-blur-sm"
          >
            <p className="text-center text-gray-800 text-lg flex items-center justify-center gap-3">
              <span className="text-2xl">💚</span>
              <span>{socialProof}</span>
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}