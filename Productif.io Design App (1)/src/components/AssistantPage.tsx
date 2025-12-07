import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../App';
import { Mic, Send, Sparkles, Calendar, Target, TrendingUp, Home, Bot, Settings as SettingsIcon, Zap, Brain, BookOpen, Timer, CheckCircle2, Circle, Lightbulb } from 'lucide-react';
import logoIcon from 'figma:asset/5e6ca94c36190e877b3f2f2ae5b2d32ffb6147c1.png';

interface AssistantPageProps {
  onNavigate: (screen: Screen) => void;
}

interface Message {
  id: string;
  text: string;
  isAI: boolean;
  timestamp: Date;
}

const quickActions = [
  { icon: Brain, label: "Start Deep Work", action: "deepwork" },
  { icon: BookOpen, label: "Daily Journal", action: "journal" },
  { icon: Lightbulb, label: "Learning", action: "learning" },
  { icon: Calendar, label: "Plan my day", action: "plan" },
  { icon: Target, label: "Track habit", action: "track" },
  { icon: TrendingUp, label: "Show stats", action: "stats" },
];

export function AssistantPage({ onNavigate }: AssistantPageProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your AI productivity coach. I'm here to help you optimize your day and unlock your full potential. How can I assist you?",
      isAI: true,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [xp, setXp] = useState(340);
  const maxXp = 500;
  
  // Deep Work Mode State
  const [isDeepWorkActive, setIsDeepWorkActive] = useState(false);
  const [deepWorkTimeLeft, setDeepWorkTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [selectedDuration, setSelectedDuration] = useState(25); // Track selected duration in minutes
  const [showTimeSelector, setShowTimeSelector] = useState(false);
  const [showTaskCompleteAnimation, setShowTaskCompleteAnimation] = useState(false);
  const [showSessionCompleteAnimation, setShowSessionCompleteAnimation] = useState(false);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [sessionStats, setSessionStats] = useState({ timeSpent: 0, tasksCompleted: 0, xpEarned: 0 });
  const [customDuration, setCustomDuration] = useState('');
  const [customDurationError, setCustomDurationError] = useState('');
  
  // Journal State
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessingJournal, setIsProcessingJournal] = useState(false);
  
  // Day Planning Voice State
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [isPlanningRecording, setIsPlanningRecording] = useState(false);
  const [planningRecordingTime, setPlanningRecordingTime] = useState(0);
  const [isProcessingPlanning, setIsProcessingPlanning] = useState(false);
  
  // Learning Voice State
  const [showLearningModal, setShowLearningModal] = useState(false);
  const [isLearningRecording, setIsLearningRecording] = useState(false);
  const [learningRecordingTime, setLearningRecordingTime] = useState(0);
  const [isProcessingLearning, setIsProcessingLearning] = useState(false);
  
  // Habit Tracking State
  const [showHabitsModal, setShowHabitsModal] = useState(false);
  const [habits, setHabits] = useState([
    { id: 1, name: 'Morning Meditation', icon: '🧘', completed: false, streak: 12, bestStreak: 18, completionRate: 85 },
    { id: 2, name: 'Daily Exercise', icon: '💪', completed: true, streak: 7, bestStreak: 15, completionRate: 78 },
    { id: 3, name: 'Read 30 min', icon: '📚', completed: false, streak: 5, bestStreak: 10, completionRate: 72 },
    { id: 4, name: 'Drink 8 glasses water', icon: '💧', completed: true, streak: 14, bestStreak: 20, completionRate: 92 },
    { id: 5, name: 'Journal before bed', icon: '📝', completed: false, streak: 3, bestStreak: 8, completionRate: 65 },
    { id: 6, name: 'No phone 1hr before bed', icon: '📵', completed: false, streak: 2, bestStreak: 5, completionRate: 58 },
  ]);
  
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Complete project proposal', completed: false },
    { id: 2, text: 'Review quarterly reports', completed: false },
    { id: 3, text: 'Prepare presentation slides', completed: false },
    { id: 4, text: 'Update team documentation', completed: false },
  ]);

  const timeOptions = [
    { label: '15 min', minutes: 15, emoji: '⚡' },
    { label: '25 min', minutes: 25, emoji: '🎯' },
    { label: '45 min', minutes: 45, emoji: '🔥' },
    { label: '60 min', minutes: 60, emoji: '💪' },
  ];

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isDeepWorkActive && deepWorkTimeLeft > 0) {
      interval = setInterval(() => {
        setDeepWorkTimeLeft((prev) => {
          if (prev <= 1) {
            setIsDeepWorkActive(false);
            // Add completion message
            const completionMessage: Message = {
              id: Date.now().toString(),
              text: "🎉 Deep work session complete! Great job staying focused. You earned 50 XP!",
              isAI: true,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, completionMessage]);
            setXp(prev => Math.min(prev + 50, maxXp));
            setShowSessionCompleteAnimation(true);
            return 25 * 60; // Reset to 25 minutes
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDeepWorkActive, deepWorkTimeLeft]);

  // Recording Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Planning Recording Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlanningRecording) {
      interval = setInterval(() => {
        setPlanningRecordingTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlanningRecording]);

  // Learning Recording Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLearningRecording) {
      interval = setInterval(() => {
        setLearningRecordingTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLearningRecording]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isAI: false,
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputText('');

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Great question! Based on your productivity profile, I recommend focusing on your most challenging task during your peak hours (9-11am). Would you like me to help you plan that?",
        isAI: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setXp(prev => Math.min(prev + 10, maxXp));
    }, 1000);
  };

  const handleQuickAction = (action: string) => {
    // Special handling for Deep Work - Show time selector
    if (action === 'deepwork') {
      setShowTimeSelector(true);
      return;
    }

    // Special handling for Journal - Show voice journal
    if (action === 'journal') {
      setShowJournalModal(true);
      return;
    }

    // Special handling for Learning - Show voice learning
    if (action === 'learning') {
      setShowLearningModal(true);
      return;
    }

    // Special handling for Plan my day - Show voice planning
    if (action === 'plan') {
      setShowPlanningModal(true);
      return;
    }

    // Special handling for Track habit - Show habits modal
    if (action === 'track') {
      setShowHabitsModal(true);
      return;
    }

    const actionTexts: { [key: string]: string } = {
      stats: "Show me my productivity stats"
    };

    const text = actionTexts[action];
    if (text) {
      setInputText(text);
    }
  };

  const startDeepWork = (minutes: number) => {
    setShowTimeSelector(false);
    setIsDeepWorkActive(true);
    setDeepWorkTimeLeft(minutes * 60);
    setSelectedDuration(minutes);
    setCustomDuration(''); // Reset custom input
    setCustomDurationError(''); // Clear any errors
    
    // Add AI message about starting deep work
    const deepWorkMessage: Message = {
      id: Date.now().toString(),
      text: `🧠 Deep work session started! I'll be here to keep you focused for the next ${minutes} minutes. Your tasks are ready below. Let's do this!`,
      isAI: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, deepWorkMessage]);
  };

  const handleCustomDurationChange = (value: string) => {
    setCustomDuration(value);
    setCustomDurationError('');
  };

  const startCustomDuration = () => {
    const minutes = parseInt(customDuration);
    
    // Validation
    if (!customDuration) {
      setCustomDurationError('Please enter a duration');
      return;
    }
    
    if (isNaN(minutes)) {
      setCustomDurationError('Please enter a valid number');
      return;
    }
    
    if (minutes < 1) {
      setCustomDurationError('Minimum 1 minute');
      return;
    }
    
    if (minutes > 120) {
      setCustomDurationError('Maximum 120 minutes (2 hours)');
      return;
    }
    
    // Start the session with custom duration
    startDeepWork(minutes);
  };

  const toggleTask = (taskId: number) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
    
    // Award XP for completing a task
    const task = tasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      setXp(prev => Math.min(prev + 15, maxXp))
      setShowTaskCompleteAnimation(true);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsProcessingJournal(true);
    
    // Simulate AI processing
    setTimeout(() => {
      setIsProcessingJournal(false);
      setShowJournalModal(false);
      
      // Add AI journal response message
      const journalResponse: Message = {
        id: Date.now().toString(),
        text: `📝 Thank you for sharing! I analyzed your day:\\n\\n✅ What went well:\\n• You maintained great focus during peak hours\\n• Completed important tasks on time\\n• Good energy management\\n\\n💡 Areas to improve:\\n• Consider taking more breaks\\n• Could delegate some routine tasks\\n• Try time-blocking for better structure\\n\\nKeep up the great work! You earned 25 XP! 🌟`,
        isAI: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, journalResponse]);
      setXp(prev => Math.min(prev + 25, maxXp));
      setRecordingTime(0);
    }, 2500);
  };

  const startPlanningRecording = () => {
    setIsPlanningRecording(true);
    setPlanningRecordingTime(0);
  };

  const stopPlanningRecording = () => {
    setIsPlanningRecording(false);
    setIsProcessingPlanning(true);
    
    // Simulate AI processing
    setTimeout(() => {
      setIsProcessingPlanning(false);
      setShowPlanningModal(false);
      
      // Add AI planning response message
      const planningResponse: Message = {
        id: Date.now().toString(),
        text: `📅 Perfect! I've created your personalized plan for tomorrow:\\n\\n🌅 Morning (8am-12pm):\\n• Client presentation at 9:30am (prep 30min before)\\n• Strategy meeting at 11am\\n• Quick break & review progress\\n\\n☀️ Afternoon (1pm-5pm):\\n• Deep work: Project deadline tasks (2hrs)\\n• Team check-in at 3:30pm\\n• Wrap up & plan next day\\n\\n💡 Pro Tips:\\n• Start with hardest task first\\n• Block 15min between meetings\\n• Set phone on Do Not Disturb during deep work\\n\\nYou earned 30 XP! Let's crush tomorrow! 🚀`,
        isAI: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, planningResponse]);
      setXp(prev => Math.min(prev + 30, maxXp));
      setPlanningRecordingTime(0);
    }, 3000);
  };

  const startLearningRecording = () => {
    setIsLearningRecording(true);
    setLearningRecordingTime(0);
  };

  const stopLearningRecording = () => {
    setIsLearningRecording(false);
    setIsProcessingLearning(true);
    
    // Simulate AI processing
    setTimeout(() => {
      setIsProcessingLearning(false);
      setShowLearningModal(false);
      
      // Add AI learning response message
      const learningResponse: Message = {
        id: Date.now().toString(),
        text: `💡 Amazing! I've captured your learning insights:\\n\\n📚 What You Learned Today:\\n• New project management techniques\\n• Effective communication strategies\\n• Time-blocking methodology\\n\\n🎯 Key Takeaways:\\n• Apply the 2-minute rule for quick tasks\\n• Use structured breaks to maintain focus\\n• Document learnings for future reference\\n\\n✨ Recommendations:\\n• Practice these skills tomorrow\\n• Share your insights with your team\\n• Review your learnings weekly\\n\\nKnowledge retained! You earned 20 XP! 🌟`,
        isAI: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, learningResponse]);
      setXp(prev => Math.min(prev + 20, maxXp));
      setLearningRecordingTime(0);
    }, 2800);
  };

  const endSession = () => {
    // Calculate session stats
    const timeSpent = Math.floor((selectedDuration * 60 - deepWorkTimeLeft) / 60);
    const tasksCompleted = tasks.filter(t => t.completed).length;
    const xpEarned = tasksCompleted * 15; // 15 XP per task
    
    setSessionStats({ timeSpent, tasksCompleted, xpEarned });
    setIsDeepWorkActive(false);
    setShowSessionSummary(true);
    
    // Award partial XP
    if (xpEarned > 0) {
      setXp(prev => Math.min(prev + xpEarned, maxXp));
    }
  };

  const toggleHabit = (habitId: number) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
        const newCompleted = !habit.completed;
        // Award XP when completing a habit
        if (newCompleted) {
          setXp(prevXp => Math.min(prevXp + 10, maxXp));
          
          // Add success message
          const habitMessage: Message = {
            id: Date.now().toString(),
            text: `🎉 Great job! You completed "${habit.name}"! Keep that ${habit.streak} day streak going! +10 XP`,
            isAI: true,
            timestamp: new Date()
          };
          setMessages(prevMessages => [...prevMessages, habitMessage]);
        }
        return { ...habit, completed: newCompleted };
      }
      return habit;
    }));
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const xpPercentage = (xp / maxXp) * 100;

  return (
    <div className="min-h-[844px] bg-white flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden pt-12 pb-24">
        {/* Header with AI Avatar */}
        <div className="px-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <motion.div
              animate={{ 
                y: [0, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg relative p-3"
            >
              <img src={logoIcon} alt="Productif.io" className="w-full h-full object-contain" />
              <motion.div
                className="absolute inset-0 bg-[#00C27A]/10 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <div>
              <h2 className="text-gray-800">AI Productivity Coach</h2>
              <p className="text-[#00C27A] text-sm">Always learning, always improving</p>
            </div>
          </div>

          {/* XP Progress Ring - Gamified */}
          <div className="bg-gradient-to-br from-[#00C27A]/10 to-white rounded-2xl p-4 shadow-sm border border-[#00C27A]/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 text-sm flex items-center gap-2">
                <Zap size={16} className="text-[#00C27A]" />
                Progress to next level
              </span>
              <span className="text-[#00C27A] text-sm">{xp}/{maxXp} XP</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 mb-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.isAI ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] rounded-3xl px-5 py-3 ${
                    message.isAI
                      ? 'bg-gradient-to-br from-[#00C27A]/10 to-[#00C27A]/5 text-gray-800 rounded-tl-none border border-[#00C27A]/20'
                      : 'bg-gradient-to-br from-[#00C27A] to-[#00D68F] text-white rounded-tr-none shadow-md'
                  }`}
                >
                  <p>{message.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Deep Work Timer & Tasks - Shows when active */}
          <AnimatePresence>
            {isDeepWorkActive && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="mt-4"
              >
                {/* Focus Bubble with Timer */}
                <div className="bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-3xl p-6 shadow-2xl mb-4 relative overflow-hidden">
                  {/* Animated background particles */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(15)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-white/20 rounded-full"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                          y: [0, -20, 0],
                          opacity: [0.2, 0.5, 0.2],
                        }}
                        transition={{
                          duration: 2 + Math.random() * 2,
                          repeat: Infinity,
                          delay: Math.random() * 2,
                        }}
                      />
                    ))}
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Brain size={24} className="text-white" />
                        </motion.div>
                        <span className="text-white">Deep Focus Mode</span>
                      </div>
                      <motion.button
                        onClick={() => endSession()}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-white/80 hover:text-white text-sm"
                      >
                        End Session
                      </motion.button>
                    </div>

                    {/* Large Timer Display */}
                    <div className="text-center">
                      <motion.div
                        key={deepWorkTimeLeft}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        className="text-white text-6xl mb-2"
                      >
                        {formatTime(deepWorkTimeLeft)}
                      </motion.div>
                      <p className="text-white/80 text-sm">Stay focused! You're doing great 🎯</p>
                    </div>

                    {/* Progress Ring */}
                    <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-white rounded-full"
                        style={{ width: `${((selectedDuration * 60 - deepWorkTimeLeft) / (selectedDuration * 60)) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Task List */}
                <div className="bg-white rounded-3xl p-5 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-800 flex items-center gap-2">
                      <Target size={20} className="text-[#00C27A]" />
                      Your Tasks
                    </h3>
                    <span className="text-sm text-gray-500">
                      {tasks.filter(t => t.completed).length}/{tasks.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {tasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => toggleTask(task.id)}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all group"
                      >
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          task.completed 
                            ? 'bg-gradient-to-br from-[#00C27A] to-[#00D68F] border-[#00C27A]' 
                            : 'border-gray-300 group-hover:border-[#00C27A]'
                        }`}>
                          {task.completed && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <CheckCircle2 size={16} className="text-white" />
                            </motion.div>
                          )}
                        </div>
                        <span className={`flex-1 ${
                          task.completed 
                            ? 'text-gray-400 line-through' 
                            : 'text-gray-700'
                        }`}>
                          {task.text}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Action Chips */}
        <div className="px-6 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.action}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleQuickAction(action.action)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#00C27A]/30 rounded-full hover:bg-[#00C27A]/5 hover:border-[#00C27A] transition-all whitespace-nowrap text-sm text-gray-700 shadow-sm"
              >
                <action.icon size={16} className="text-[#00C27A]" />
                {action.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="px-6 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="w-full px-5 py-3 bg-gray-50 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00C27A] transition-all border border-gray-100"
              />
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full transition-all border border-gray-100"
            >
              <Mic size={20} className="text-gray-600" />
            </motion.button>
            
            <motion.button
              onClick={handleSend}
              whileHover={{ scale: 1.05, boxShadow: "0 5px 20px rgba(0, 194, 122, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-gradient-to-r from-[#00C27A] to-[#00D68F] rounded-full transition-all shadow-md"
            >
              <Send size={20} className="text-white" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#00C27A] to-[#00D68F] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-30">
        <div className="flex items-center justify-around px-8 pt-3 pb-6">
          <motion.button
            onClick={() => onNavigate('dashboard')}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-0.5"
          >
            <div className="w-12 h-12 bg-white/0 hover:bg-white/10 backdrop-blur-sm rounded-[18px] flex items-center justify-center transition-all">
              <Home size={24} className="text-white/70" />
            </div>
            <span className="text-white/70 text-[11px] mt-0.5">Home</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-0.5 relative"
          >
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-[18px] flex items-center justify-center">
              <Bot size={24} className="text-white" />
            </div>
            <div className="absolute top-0 w-1.5 h-1.5 bg-white rounded-full shadow-lg"></div>
            <span className="text-white text-[11px] mt-0.5">Assistant</span>
          </motion.button>

          <motion.button
            onClick={() => onNavigate('settings')}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-0.5"
          >
            <div className="w-12 h-12 bg-white/0 hover:bg-white/10 backdrop-blur-sm rounded-[18px] flex items-center justify-center transition-all">
              <SettingsIcon size={24} className="text-white/70" />
            </div>
            <span className="text-white/70 text-[11px] mt-0.5">Settings</span>
          </motion.button>
        </div>
      </div>

      {/* Time Selector Modal */}
      <AnimatePresence>
        {showTimeSelector && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTimeSelector(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-6 top-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 shadow-2xl z-50 max-w-sm mx-auto"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Timer size={32} className="text-white" />
                </div>
                <h3 className="text-gray-800 mb-2">Choose Focus Duration</h3>
                <p className="text-gray-500 text-sm">How long do you want to focus?</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {timeOptions.map((option, index) => (
                  <motion.button
                    key={option.minutes}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => startDeepWork(option.minutes)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-br from-[#00C27A]/10 to-white border-2 border-[#00C27A]/30 hover:border-[#00C27A] rounded-2xl p-5 transition-all group"
                  >
                    <div className="text-3xl mb-2">{option.emoji}</div>
                    <div className="text-gray-800 group-hover:text-[#00C27A] transition-colors">
                      {option.label}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Custom Duration Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-4"
              >
                <p className="text-gray-600 text-sm mb-3 text-center">Or enter custom duration</p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={customDuration}
                      onChange={(e) => handleCustomDurationChange(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && startCustomDuration()}
                      placeholder="e.g. 30"
                      min="1"
                      max="120"
                      className={`w-full px-4 py-3 bg-gray-50 rounded-2xl focus:outline-none focus:ring-2 transition-all border text-center ${
                        customDurationError
                          ? 'border-red-300 focus:ring-red-300'
                          : 'border-gray-200 focus:ring-[#00C27A]'
                      }`}
                    />
                    {customDurationError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-xs mt-1.5 text-center"
                      >
                        {customDurationError}
                      </motion.p>
                    )}
                  </div>
                  <motion.button
                    onClick={startCustomDuration}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-2xl shadow-md flex items-center justify-center"
                  >
                    Start
                  </motion.button>
                </div>
                <p className="text-gray-400 text-xs mt-2 text-center">Range: 1-120 minutes</p>
              </motion.div>

              <motion.button
                onClick={() => setShowTimeSelector(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 text-gray-600 hover:text-gray-800 transition-colors rounded-2xl hover:bg-gray-50"
              >
                Cancel
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Task Complete Animation */}
      <AnimatePresence>
        {showTaskCompleteAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onAnimationComplete={() => {
              setTimeout(() => setShowTaskCompleteAnimation(false), 2000);
            }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            {/* Confetti particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  background: i % 2 === 0
                    ? 'linear-gradient(135deg, #00C27A, #00D68F)'
                    : '#FFD700',
                  left: '50%',
                  top: '50%',
                }}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0.5],
                  x: (Math.random() - 0.5) * 300,
                  y: (Math.random() - 0.5) * 300,
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  ease: "easeOut",
                }}
              />
            ))}

            {/* Success icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-24 h-24 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-full flex items-center justify-center shadow-2xl"
            >
              <CheckCircle2 size={48} className="text-white" />
            </motion.div>

            {/* +15 XP floating text */}
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 1, 0], y: -60, scale: 1.2 }}
              transition={{ duration: 2 }}
              className="absolute top-1/2 text-2xl text-[#00C27A] pointer-events-none mt-16"
            >
              +15 XP
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Complete Animation */}
      <AnimatePresence>
        {showSessionCompleteAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onAnimationComplete={() => {
              setTimeout(() => setShowSessionCompleteAnimation(false), 4000);
            }}
            className="fixed inset-0 bg-gradient-to-br from-[#00C27A]/90 to-[#00D68F]/90 backdrop-blur-md z-50 flex items-center justify-center"
          >
            {/* Massive confetti explosion */}
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: '50%',
                  top: '50%',
                }}
                initial={{ scale: 0, x: 0, y: 0, rotate: 0 }}
                animate={{
                  scale: [0, 1, 0.8],
                  x: (Math.random() - 0.5) * 600,
                  y: (Math.random() - 0.5) * 800 - 100,
                  rotate: Math.random() * 720,
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 2.5 + Math.random(),
                  ease: "easeOut",
                }}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    background: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#95E1D3', '#FFFFFF'][Math.floor(Math.random() * 6)]
                  }}
                />
              </motion.div>
            ))}

            {/* Celebration content */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 150, damping: 12 }}
              className="text-center z-10 px-8"
            >
              {/* Trophy/Star */}
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
                className="text-8xl mb-6"
              >
                🏆
              </motion.div>

              {/* Success message */}
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white text-4xl mb-4"
              >
                Amazing Work!
              </motion.h2>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/90 text-xl mb-6"
              >
                Deep Work Session Complete
              </motion.p>

              {/* XP Badge */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-6"
              >
                <Zap size={24} className="text-yellow-300" />
                <span className="text-white text-2xl">+50 XP</span>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex gap-6 justify-center text-white/80"
              >
                <div className="text-center">
                  <div className="text-3xl mb-1">⏱️</div>
                  <div className="text-sm">{selectedDuration} min focused</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-1">✅</div>
                  <div className="text-sm">{tasks.filter(t => t.completed).length} tasks done</div>
                </div>
              </motion.div>

              {/* Dismiss hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="text-white/60 text-sm mt-8"
              >
                Tap anywhere to continue
              </motion.p>
            </motion.div>

            {/* Tap to dismiss */}
            <div
              className="absolute inset-0 cursor-pointer"
              onClick={() => setShowSessionCompleteAnimation(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Summary Modal */}
      <AnimatePresence>
        {showSessionSummary && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Summary Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-6 top-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl z-50 max-w-sm mx-auto overflow-hidden"
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-br from-[#00C27A] to-[#00D68F] p-6 text-center relative overflow-hidden">
                {/* Floating particles */}
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-white/20 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -15, 0],
                      opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                      duration: 2 + Math.random(),
                      repeat: Infinity,
                      delay: Math.random(),
                    }}
                  />
                ))}

                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="relative z-10"
                >
                  <div className="text-5xl mb-3">📊</div>
                  <h3 className="text-white text-2xl mb-1">Session Summary</h3>
                  <p className="text-white/80 text-sm">Here's how you did!</p>
                </motion.div>
              </div>

              {/* Stats Grid */}
              <div className="p-6 space-y-4">
                {/* Time Spent */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-[#00C27A]/10 to-white rounded-2xl p-4 border border-[#00C27A]/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-xl flex items-center justify-center">
                        <Timer size={24} className="text-white" />
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Time Focused</p>
                        <p className="text-gray-800 text-xl">{sessionStats.timeSpent} min</p>
                      </div>
                    </div>
                    <div className="text-2xl">⏱️</div>
                  </div>
                </motion.div>

                {/* Tasks Completed */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-[#00C27A]/10 to-white rounded-2xl p-4 border border-[#00C27A]/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-xl flex items-center justify-center">
                        <CheckCircle2 size={24} className="text-white" />
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Tasks Completed</p>
                        <p className="text-gray-800 text-xl">{sessionStats.tasksCompleted} / {tasks.length}</p>
                      </div>
                    </div>
                    <div className="text-2xl">✅</div>
                  </div>
                </motion.div>

                {/* XP Earned */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-br from-yellow-50 to-white rounded-2xl p-4 border-2 border-yellow-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center">
                        <Zap size={24} className="text-white" />
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">XP Earned</p>
                        <p className="text-gray-800 text-xl">+{sessionStats.xpEarned} XP</p>
                      </div>
                    </div>
                    <div className="text-2xl">⚡</div>
                  </div>
                </motion.div>

                {/* Motivational Message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-center py-3"
                >
                  <p className="text-gray-600 text-sm">
                    {sessionStats.tasksCompleted === tasks.length
                      ? "🎉 Perfect! You completed all tasks!"
                      : sessionStats.tasksCompleted > 0
                        ? "💪 Great progress! Keep it up!"
                        : "👍 Every minute counts! Try again soon!"}
                  </p>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 pb-6 space-y-3">
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  onClick={() => {
                    setShowSessionSummary(false);
                    // Reset tasks for next session
                    setTasks(prev => prev.map(task => ({ ...task, completed: false })));
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-full shadow-md flex items-center justify-center"
                >
                  Finish
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Voice Journal Modal */}
      <AnimatePresence>
        {showJournalModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gradient-to-br from-[#00C27A]/20 to-[#00D68F]/20 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-6"
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-sm w-full">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#00C27A] to-[#00D68F] p-6 text-center relative overflow-hidden">
                  {/* Floating particles */}
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-white/20 rounded-full"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        y: [0, -15, 0],
                        opacity: [0.2, 0.5, 0.2],
                      }}
                      transition={{
                        duration: 2 + Math.random(),
                        repeat: Infinity,
                        delay: Math.random(),
                      }}
                    />
                  ))}

                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 150 }}
                    className="relative z-10"
                  >
                    <div className="text-5xl mb-3">📝</div>
                    <h3 className="text-white text-2xl mb-1">Daily Journal</h3>
                    <p className="text-white/80 text-sm">
                      {isProcessingJournal 
                        ? "Processing your thoughts..." 
                        : isRecording 
                          ? "I'm listening..." 
                          : "Tell me about your day"}
                    </p>
                  </motion.div>
                </div>

                {/* Content */}
                <div className="p-8">
                  {isProcessingJournal ? (
                    // Processing State
                    <div className="text-center py-8">
                      <motion.div
                        className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-full flex items-center justify-center"
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 180, 360],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Sparkles size={32} className="text-white" />
                      </motion.div>
                      <p className="text-gray-600">Analyzing your reflections...</p>
                    </div>
                  ) : (
                    <>
                      {/* Microphone Button */}
                      <div className="text-center mb-6">
                        <motion.button
                          onClick={isRecording ? stopRecording : startRecording}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="relative"
                        >
                          <motion.div
                            className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center ${
                              isRecording 
                                ? 'bg-gradient-to-br from-red-500 to-red-600' 
                                : 'bg-gradient-to-br from-[#00C27A] to-[#00D68F]'
                            } shadow-2xl`}
                            animate={isRecording ? {
                              scale: [1, 1.1, 1],
                            } : {}}
                            transition={{
                              duration: 1.5,
                              repeat: isRecording ? Infinity : 0,
                            }}
                          >
                            <Mic size={48} className="text-white" />
                          </motion.div>

                          {/* Recording Indicator */}
                          {isRecording && (
                            <>
                              {/* Pulse rings */}
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="absolute inset-0 border-4 border-red-400 rounded-full"
                                  initial={{ scale: 1, opacity: 0.5 }}
                                  animate={{
                                    scale: [1, 1.8, 2.2],
                                    opacity: [0.5, 0.2, 0],
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.6,
                                  }}
                                />
                              ))}
                              
                              {/* Red dot */}
                              <motion.div
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-4 border-white shadow-lg"
                                animate={{
                                  scale: [1, 1.2, 1],
                                }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                }}
                              />
                            </>
                          )}
                        </motion.button>

                        {/* Timer */}
                        {isRecording && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 text-2xl text-red-500"
                          >
                            {formatTime(recordingTime)}
                          </motion.div>
                        )}
                      </div>

                      {/* Prompt */}
                      <div className="text-center space-y-3 mb-6">
                        <p className="text-gray-700">
                          {isRecording ? (
                            <span>Tap again to stop recording</span>
                          ) : (
                            <span>Tap the microphone to start</span>
                          )}
                        </p>
                        <p className="text-gray-500 text-sm">
                          Share what went well and what needs improvement
                        </p>
                      </div>

                      {/* Suggested prompts */}
                      {!isRecording && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2"
                        >
                          <p className="text-gray-600 text-xs mb-2">💡 Try saying:</p>
                          {[
                            "I completed my main goals but struggled with distractions",
                            "I had great energy in the morning but felt tired after lunch",
                            "I need to improve my time management for meetings",
                          ].map((prompt, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2"
                            >
                              "{prompt}"
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </>
                  )}
                </div>

                {/* Cancel button */}
                {!isProcessingJournal && (
                  <div className="px-6 pb-6">
                    <motion.button
                      onClick={() => {
                        setShowJournalModal(false);
                        setIsRecording(false);
                        setRecordingTime(0);
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 text-gray-600 hover:text-gray-800 transition-colors rounded-2xl hover:bg-gray-50"
                    >
                      Cancel
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Voice Planning Modal */}
      <AnimatePresence>
        {showPlanningModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gradient-to-br from-[#00C27A]/20 to-[#00D68F]/20 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-6"
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-sm w-full">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#00C27A] to-[#00D68F] p-6 text-center relative overflow-hidden">
                  {/* Floating particles */}
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-white/20 rounded-full"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        y: [0, -15, 0],
                        opacity: [0.2, 0.5, 0.2],
                      }}
                      transition={{
                        duration: 2 + Math.random(),
                        repeat: Infinity,
                        delay: Math.random(),
                      }}
                    />
                  ))}

                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 150 }}
                    className="relative z-10"
                  >
                    <div className="text-5xl mb-3">📅</div>
                    <h3 className="text-white text-2xl mb-1">Plan Tomorrow</h3>
                    <p className="text-white/80 text-sm">
                      {isProcessingPlanning 
                        ? "Creating your personalized plan..." 
                        : isPlanningRecording 
                          ? "I'm listening..." 
                          : "Tell me about your day tomorrow"}
                    </p>
                  </motion.div>
                </div>

                {/* Content */}
                <div className="p-8">
                  {isProcessingPlanning ? (
                    // Processing State
                    <div className="text-center py-8">
                      <motion.div
                        className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-full flex items-center justify-center"
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 180, 360],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Sparkles size={32} className="text-white" />
                      </motion.div>
                      <p className="text-gray-600">Building your perfect day...</p>
                    </div>
                  ) : (
                    <>
                      {/* Microphone Button */}
                      <div className="text-center mb-6">
                        <motion.button
                          onClick={isPlanningRecording ? stopPlanningRecording : startPlanningRecording}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="relative"
                        >
                          <motion.div
                            className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center ${
                              isPlanningRecording 
                                ? 'bg-gradient-to-br from-red-500 to-red-600' 
                                : 'bg-gradient-to-br from-[#00C27A] to-[#00D68F]'
                            } shadow-2xl`}
                            animate={isPlanningRecording ? {
                              scale: [1, 1.1, 1],
                            } : {}}
                            transition={{
                              duration: 1.5,
                              repeat: isPlanningRecording ? Infinity : 0,
                            }}
                          >
                            <Mic size={48} className="text-white" />
                          </motion.div>

                          {/* Recording Indicator */}
                          {isPlanningRecording && (
                            <>
                              {/* Pulse rings */}
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="absolute inset-0 border-4 border-red-400 rounded-full"
                                  initial={{ scale: 1, opacity: 0.5 }}
                                  animate={{
                                    scale: [1, 1.8, 2.2],
                                    opacity: [0.5, 0.2, 0],
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.6,
                                  }}
                                />
                              ))}
                              
                              {/* Red dot */}
                              <motion.div
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-4 border-white shadow-lg"
                                animate={{
                                  scale: [1, 1.2, 1],
                                }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                }}
                              />
                            </>
                          )}
                        </motion.button>

                        {/* Timer */}
                        {isPlanningRecording && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 text-2xl text-red-500"
                          >
                            {formatTime(planningRecordingTime)}
                          </motion.div>
                        )}
                      </div>

                      {/* Prompt */}
                      <div className="text-center space-y-3 mb-6">
                        <p className="text-gray-700">
                          {isPlanningRecording ? (
                            <span>Tap again to stop recording</span>
                          ) : (
                            <span>Tap the microphone to start</span>
                          )}
                        </p>
                        <p className="text-gray-500 text-sm">
                          Share your tasks, meetings, and priorities for tomorrow
                        </p>
                      </div>

                      {/* Suggested prompts */}
                      {!isPlanningRecording && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2"
                        >
                          <p className="text-gray-600 text-xs mb-2">💡 Try saying:</p>
                          {[
                            "I have a client meeting at 10am, need to prep a presentation, and finish the quarterly report",
                            "Tomorrow I need to focus on the project deadline, have a team standup at 2pm, and review code",
                            "I want to work out in the morning, then tackle my top 3 priorities before lunch",
                          ].map((prompt, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2"
                            >
                              "{prompt}"
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </>
                  )}
                </div>

                {/* Cancel button */}
                {!isProcessingPlanning && (
                  <div className="px-6 pb-6">
                    <motion.button
                      onClick={() => {
                        setShowPlanningModal(false);
                        setIsPlanningRecording(false);
                        setPlanningRecordingTime(0);
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 text-gray-600 hover:text-gray-800 transition-colors rounded-2xl hover:bg-gray-50"
                    >
                      Cancel
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Voice Learning Modal */}
      <AnimatePresence>
        {showLearningModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gradient-to-br from-[#00C27A]/20 to-[#00D68F]/20 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-6"
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-sm w-full">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#00C27A] to-[#00D68F] p-6 text-center relative overflow-hidden">
                  {/* Floating particles */}
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-white/20 rounded-full"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        y: [0, -15, 0],
                        opacity: [0.2, 0.5, 0.2],
                      }}
                      transition={{
                        duration: 2 + Math.random(),
                        repeat: Infinity,
                        delay: Math.random(),
                      }}
                    />
                  ))}

                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 150 }}
                    className="relative z-10"
                  >
                    <div className="text-5xl mb-3">💡</div>
                    <h3 className="text-white text-2xl mb-1">What I Learned Today</h3>
                    <p className="text-white/80 text-sm">
                      {isProcessingLearning 
                        ? "Processing your insights..." 
                        : isLearningRecording 
                          ? "I'm listening..." 
                          : "Share what you learned today"}
                    </p>
                  </motion.div>
                </div>

                {/* Content */}
                <div className="p-8">
                  {isProcessingLearning ? (
                    // Processing State
                    <div className="text-center py-8">
                      <motion.div
                        className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-full flex items-center justify-center"
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 180, 360],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Sparkles size={32} className="text-white" />
                      </motion.div>
                      <p className="text-gray-600">Capturing your knowledge...</p>
                    </div>
                  ) : (
                    <>
                      {/* Microphone Button */}
                      <div className="text-center mb-6">
                        <motion.button
                          onClick={isLearningRecording ? stopLearningRecording : startLearningRecording}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="relative"
                        >
                          <motion.div
                            className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center ${
                              isLearningRecording 
                                ? 'bg-gradient-to-br from-red-500 to-red-600' 
                                : 'bg-gradient-to-br from-[#00C27A] to-[#00D68F]'
                            } shadow-2xl`}
                            animate={isLearningRecording ? {
                              scale: [1, 1.1, 1],
                            } : {}}
                            transition={{
                              duration: 1.5,
                              repeat: isLearningRecording ? Infinity : 0,
                            }}
                          >
                            <Mic size={48} className="text-white" />
                          </motion.div>

                          {/* Recording Indicator */}
                          {isLearningRecording && (
                            <>
                              {/* Pulse rings */}
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="absolute inset-0 border-4 border-red-400 rounded-full"
                                  initial={{ scale: 1, opacity: 0.5 }}
                                  animate={{
                                    scale: [1, 1.8, 2.2],
                                    opacity: [0.5, 0.2, 0],
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.6,
                                  }}
                                />
                              ))}
                              
                              {/* Red dot */}
                              <motion.div
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-4 border-white shadow-lg"
                                animate={{
                                  scale: [1, 1.2, 1],
                                }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                }}
                              />
                            </>
                          )}
                        </motion.button>

                        {/* Timer */}
                        {isLearningRecording && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 text-2xl text-red-500"
                          >
                            {formatTime(learningRecordingTime)}
                          </motion.div>
                        )}
                      </div>

                      {/* Prompt */}
                      <div className="text-center space-y-3 mb-6">
                        <p className="text-gray-700">
                          {isLearningRecording ? (
                            <span>Tap again to stop recording</span>
                          ) : (
                            <span>Tap the microphone to start</span>
                          )}
                        </p>
                        <p className="text-gray-500 text-sm">
                          Describe new skills, insights, or knowledge you gained
                        </p>
                      </div>

                      {/* Suggested prompts */}
                      {!isLearningRecording && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2"
                        >
                          <p className="text-gray-600 text-xs mb-2">💡 Try saying:</p>
                          {[
                            "I learned a new project management framework that helps prioritize tasks better",
                            "Today I discovered how to use keyboard shortcuts that save 30 minutes daily",
                            "I learned effective delegation strategies from my team lead",
                          ].map((prompt, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2"
                            >
                              "{prompt}"
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </>
                  )}
                </div>

                {/* Cancel button */}
                {!isProcessingLearning && (
                  <div className="px-6 pb-6">
                    <motion.button
                      onClick={() => {
                        setShowLearningModal(false);
                        setIsLearningRecording(false);
                        setLearningRecordingTime(0);
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 text-gray-600 hover:text-gray-800 transition-colors rounded-2xl hover:bg-gray-50"
                    >
                      Cancel
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Habit Tracking Modal */}
      <AnimatePresence>
        {showHabitsModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHabitsModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-6 top-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl z-50 max-w-md mx-auto max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-[#00C27A] to-[#00D68F] p-6 text-center relative overflow-hidden">
                {/* Floating particles */}
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-white/20 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -15, 0],
                      opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                      duration: 2 + Math.random(),
                      repeat: Infinity,
                      delay: Math.random(),
                    }}
                  />
                ))}

                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 150 }}
                  className="relative z-10"
                >
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mx-auto mb-3 flex items-center justify-center">
                    <Target size={32} className="text-white" />
                  </div>
                  <h3 className="text-white font-bold text-3xl mb-1 drop-shadow-lg">Today's Habits</h3>
                  <p className="text-white/90 font-medium drop-shadow">
                    {habits.filter(h => h.completed).length}/{habits.length} completed
                  </p>
                </motion.div>
              </div>

              {/* Habits List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {habits.map((habit, index) => (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => toggleHabit(habit.id)}
                    className={`bg-gradient-to-br rounded-2xl p-4 cursor-pointer transition-all border-2 ${
                      habit.completed
                        ? 'from-[#00C27A]/10 to-[#00D68F]/5 border-[#00C27A] shadow-md'
                        : 'from-gray-50 to-white border-gray-200 hover:border-[#00C27A]/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
                        habit.completed 
                          ? 'bg-gradient-to-br from-[#00C27A] to-[#00D68F] border-[#00C27A]' 
                          : 'border-gray-300'
                      }`}>
                        {habit.completed && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <CheckCircle2 size={16} className="text-white" />
                          </motion.div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{habit.icon}</span>
                          <h4 className={`${habit.completed ? 'text-gray-700' : 'text-gray-800'}`}>
                            {habit.name}
                          </h4>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-4 text-xs">
                          {/* Streak */}
                          <div className="flex items-center gap-1">
                            <span className="text-orange-500">🔥</span>
                            <span className="text-gray-600">{habit.streak} day streak</span>
                          </div>
                          
                          {/* Completion Rate */}
                          <div className="flex items-center gap-1">
                            <span className="text-green-600">📊</span>
                            <span className="text-gray-600">{habit.completionRate}%</span>
                          </div>
                        </div>

                        {/* Best Streak Badge */}
                        {habit.streak === habit.bestStreak && habit.streak > 3 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="mt-2 inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full"
                          >
                            <span>⭐</span>
                            <span>Best streak!</span>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Summary Footer */}
              <div className="p-6 border-t border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {/* Total Completed */}
                  <div className="text-center">
                    <div className="text-2xl mb-1">✅</div>
                    <div className="text-lg text-[#00C27A]">{habits.filter(h => h.completed).length}</div>
                    <div className="text-xs text-gray-500">Done Today</div>
                  </div>

                  {/* Avg Completion */}
                  <div className="text-center">
                    <div className="text-2xl mb-1">📈</div>
                    <div className="text-lg text-[#00C27A]">
                      {Math.round(habits.reduce((acc, h) => acc + h.completionRate, 0) / habits.length)}%
                    </div>
                    <div className="text-xs text-gray-500">Avg Rate</div>
                  </div>

                  {/* Best Streak */}
                  <div className="text-center">
                    <div className="text-2xl mb-1">🔥</div>
                    <div className="text-lg text-orange-500">
                      {Math.max(...habits.map(h => h.streak))}
                    </div>
                    <div className="text-xs text-gray-500">Top Streak</div>
                  </div>
                </div>

                {/* Close Button */}
                <motion.button
                  onClick={() => setShowHabitsModal(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-full shadow-md"
                >
                  Done
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}