import { motion } from 'motion/react';
import { useState } from 'react';
import { CheckCircle2, Circle, ArrowRight, Brain } from 'lucide-react';

interface SymptomsAnalysisPageProps {
  onComplete: () => void;
}

interface Symptom {
  id: string;
  text: string;
}

const symptoms: Symptom[] = [
  { id: 'distraction', text: 'I get distracted easily while working' },
  { id: 'procrastination', text: 'I often procrastinate on important tasks' },
  { id: 'overwhelmed', text: 'I feel overwhelmed by my to-do list' },
  { id: 'focus', text: 'I struggle to maintain focus for long periods' },
  { id: 'motivation', text: 'I lack motivation to start tasks' },
  { id: 'sleep', text: 'My sleep schedule is irregular' },
];

export function SymptomsAnalysisPage({ onComplete }: SymptomsAnalysisPageProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showAnalyzing, setShowAnalyzing] = useState(false);

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleContinue = () => {
    setShowAnalyzing(true);
    // Show analyzing message for 2 seconds before moving to paywall
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  if (showAnalyzing) {
    return (
      <div className="min-h-[844px] bg-white px-6 py-16 flex flex-col justify-center items-center">
        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-[#00C27A]/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center">
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            }}
            className="w-24 h-24 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-3xl flex items-center justify-center shadow-2xl mb-8 mx-auto"
          >
            <Brain size={40} className="text-white" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-800 mb-4"
          >
            Analyzing Your Symptoms...
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 leading-relaxed px-4"
          >
            We're creating a personalized productivity profile based on your answers
          </motion.p>

          {/* Loading dots */}
          <div className="flex gap-2 mt-8 justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2.5 h-2.5 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-full"
                animate={{
                  y: [0, -12, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[844px] bg-white px-6 py-12 flex flex-col">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-[#00C27A]/10 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Brain size={32} className="text-white" />
          </div>
          <h1 className="text-gray-800 mb-3">
            Tell Us About Your Symptoms
          </h1>
          <p className="text-gray-600 leading-relaxed px-4">
            Select all that apply to get a personalized analysis
          </p>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-2 mb-8"
        >
          <div className="h-1 w-12 bg-[#00C27A] rounded-full" />
          <div className="h-1 w-12 bg-[#00C27A] rounded-full" />
          <div className="h-1 w-12 bg-[#00C27A] rounded-full" />
          <div className="h-1 w-12 bg-[#00C27A]/30 rounded-full" />
        </motion.div>

        {/* Symptoms List */}
        <div className="flex-1 space-y-3 mb-6">
          {symptoms.map((symptom, index) => {
            const isSelected = selectedSymptoms.includes(symptom.id);
            
            return (
              <motion.button
                key={symptom.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                onClick={() => toggleSymptom(symptom.id)}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-4 ${
                  isSelected
                    ? 'border-[#00C27A] bg-gradient-to-br from-[#00C27A]/10 to-[#00D68F]/5 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`flex-shrink-0 ${isSelected ? 'text-[#00C27A]' : 'text-gray-300'}`}>
                  {isSelected ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <Circle size={24} />
                  )}
                </div>
                <span className={`${isSelected ? 'text-gray-800' : 'text-gray-600'}`}>
                  {symptom.text}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl p-4 mb-6"
        >
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            <span className="text-blue-600">💡</span> Based on your symptoms, we'll create a custom plan to boost your productivity
          </p>
        </motion.div>

        {/* Continue Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          onClick={handleContinue}
          disabled={selectedSymptoms.length === 0}
          whileHover={selectedSymptoms.length > 0 ? { scale: 1.02 } : {}}
          whileTap={selectedSymptoms.length > 0 ? { scale: 0.98 } : {}}
          className={`w-full py-5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg ${
            selectedSymptoms.length > 0
              ? 'bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span className="text-lg">Discover My Profile</span>
          <ArrowRight size={20} />
        </motion.button>

        {/* Selected count */}
        {selectedSymptoms.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-gray-500 mt-3"
          >
            {selectedSymptoms.length} symptom{selectedSymptoms.length !== 1 ? 's' : ''} selected
          </motion.p>
        )}
      </div>
    </div>
  );
}