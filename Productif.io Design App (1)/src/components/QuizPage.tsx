import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../App';

interface QuizPageProps {
  onNavigate: (screen: Screen) => void;
  onProgressUpdate: (progress: number) => void;
  onComplete: (profile: any) => void;
}

const questions = [
  {
    question: "When do you feel most productive?",
    options: ["Early morning (5-9am)", "Midday (10am-2pm)", "Afternoon (3-6pm)", "Evening/Night"]
  },
  {
    question: "How do you prefer to organize tasks?",
    options: ["To-do lists", "Calendar blocks", "Kanban boards", "Mind maps"]
  },
  {
    question: "What's your biggest productivity blocker?",
    options: ["Procrastination", "Distractions", "Poor planning", "Low energy"]
  },
  {
    question: "How often do you take breaks?",
    options: ["Every 25 min (Pomodoro)", "Every hour", "Every 2-3 hours", "Rarely"]
  },
  {
    question: "What motivates you most?",
    options: ["Achieving goals", "Competition", "Learning", "Recognition"]
  },
  {
    question: "Your approach to deadlines?",
    options: ["Plan well ahead", "Work steadily", "Last-minute rush", "Flexible approach"]
  },
  {
    question: "Preferred work environment?",
    options: ["Quiet & calm", "Background music", "Collaborative", "Changing locations"]
  },
  {
    question: "How do you track progress?",
    options: ["Daily journaling", "Weekly reviews", "Monthly goals", "I don't track"]
  }
];

export function QuizPage({ onNavigate, onProgressUpdate, onComplete }: QuizPageProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    
    setTimeout(() => {
      const answer = questions[currentQuestion].options[optionIndex];
      const newAnswers = [...answers, answer];
      setAnswers(newAnswers);
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOption(null);
        onProgressUpdate(((currentQuestion + 2) / questions.length) * 100);
      } else {
        onProgressUpdate(100);
        
        const profile = {
          type: "Strategic Achiever",
          description: "You thrive on structure and clear objectives. Your analytical mindset helps you break down complex goals into actionable steps.",
          tips: [
            "Use time-blocking to maximize your peak hours",
            "Set micro-goals to maintain momentum",
            "Track metrics that matter to you"
          ]
        };
        
        onComplete(profile);
        setTimeout(() => {
          onNavigate('processing');
        }, 300);
      }
    }, 400);
  };

  return (
    <div className="min-h-[844px] bg-white flex">
      {/* Main Content */}
      <div className="flex-1 px-8 py-16 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-4">
              <span className="text-[#00C27A]">Question {currentQuestion + 1}/{questions.length}</span>
            </div>
            
            <h2 className="text-gray-800 mb-12">
              {questions[currentQuestion].question}
            </h2>

            <div className="space-y-3">
              {questions[currentQuestion].options.map((option, index) => (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleAnswer(index)}
                  whileHover={{ scale: 1.02 }}
                  className={`w-full text-left px-6 py-4 rounded-full transition-all duration-200 ${
                    selectedOption === index
                      ? 'bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white shadow-lg scale-[1.02]'
                      : 'bg-white border-2 border-gray-200 hover:border-[#00C27A] hover:bg-[#00C27A]/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${
                      selectedOption === index 
                        ? 'border-white bg-white text-[#00C27A]' 
                        : 'border-gray-300 text-gray-400'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className={selectedOption === index ? 'text-white' : 'text-gray-700'}>
                      {option}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right Progress Bar */}
      <div className="w-16 flex-shrink-0 bg-gray-50 flex items-center justify-center py-16">
        <div className="relative h-full w-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="absolute bottom-0 w-full bg-gradient-to-t from-[#00C27A] to-[#00D68F] rounded-full"
            initial={{ height: 0 }}
            animate={{ height: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}