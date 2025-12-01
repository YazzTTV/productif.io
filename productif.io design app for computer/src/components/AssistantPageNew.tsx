import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../App';
import { 
  Mic, Send, Sparkles, Calendar, Target, TrendingUp, Home, Bot, Settings as SettingsIcon, 
  Zap, Brain, BookOpen, Timer, CheckCircle2, Circle, Lightbulb, MessageSquare, 
  User, Cpu, ArrowLeft, Copy, ThumbsUp, ThumbsDown, RotateCcw, Maximize2,
  FileText, BarChart3, Clock, Star, Wand2, Headphones, Palette, MicIcon
} from 'lucide-react';
import logoIcon from 'figma:asset/5e6ca94c36190e877b3f2f2ae5b2d32ffb6147c1.png';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface AssistantPageProps {
  onNavigate: (screen: Screen) => void;
}

interface Message {
  id: string;
  text: string;
  isAI: boolean;
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'analysis' | 'task';
  metadata?: {
    confidence?: number;
    category?: string;
    actionable?: boolean;
  };
}

const quickActions = [
  { icon: Brain, label: "Session Focus", action: "deepwork", color: "from-purple-500 to-indigo-600", description: "Démarrer une session de travail focalisée" },
  { icon: BookOpen, label: "Réflexion", action: "journal", color: "from-blue-500 to-cyan-500", description: "Journal vocal de vos pensées" },
  { icon: Lightbulb, label: "Apprendre", action: "learning", color: "from-amber-400 to-orange-500", description: "Session d'apprentissage IA" },
  { icon: Calendar, label: "Planifier", action: "plan", color: "from-green-500 to-emerald-600", description: "Organiser votre emploi du temps" },
  { icon: Target, label: "Suivre", action: "track", color: "from-pink-500 to-rose-500", description: "Monitorer vos habitudes" },
  { icon: TrendingUp, label: "Analyser", action: "stats", color: "from-violet-500 to-purple-600", description: "Voir vos insights de productivité" },
];

const aiPersonalities = [
  { id: 'coach', name: 'Coach', icon: '🏃‍♂️', description: 'Motivant et orienté objectifs' },
  { id: 'mentor', name: 'Mentor', icon: '🧠', description: 'Sage et guidance stratégique' },
  { id: 'friend', name: 'Ami', icon: '😊', description: 'Décontracté et bienveillant' },
  { id: 'analyst', name: 'Analyste', icon: '📊', description: 'Insights basés sur les données' },
];

const conversationStarters = [
  "Comment améliorer ma concentration aujourd'hui ?",
  "Que dois-je prioriser cette semaine ?",
  "Aide-moi à créer une meilleure routine matinale",
  "Analyse mes patterns de productivité",
  "Je me sens dépassé, que dois-je faire ?",
  "Comment maintenir l'équilibre vie-travail ?"
];

export function AssistantPage({ onNavigate }: AssistantPageProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Bonjour ! Je suis votre assistant IA de productivité personnalisé. Je suis là pour vous aider à optimiser votre journée et libérer votre plein potentiel. Comment puis-je vous accompagner aujourd'hui ?",
      isAI: true,
      timestamp: new Date(),
      type: 'text',
      metadata: { confidence: 100, category: 'greeting' }
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState('coach');
  const [showPersonalitySelector, setShowPersonalitySelector] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [xp, setXp] = useState(340);
  const maxXp = 500;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Simulate AI typing effect
  const simulateAIResponse = (userMessage: string) => {
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      
      // Generate contextual AI response based on user input
      let aiResponse = "";
      const lowerMessage = userMessage.toLowerCase();
      
      if (lowerMessage.includes('focus') || lowerMessage.includes('concentration')) {
        aiResponse = "Je comprends que vous voulez améliorer votre concentration. Voici quelques stratégies personnalisées basées sur vos données : essayez la technique Pomodoro de 25 minutes, éliminez les distractions numériques, et créez un environnement de travail optimal. Voulez-vous que je lance une session de focus guidée ?";
      } else if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelmed') || lowerMessage.includes('dépassé')) {
        aiResponse = "Je vois que vous vous sentez dépassé. Respirons ensemble. Essayez cette technique : inspirez pendant 4 secondes, retenez pendant 7 secondes, expirez pendant 8 secondes. Répétez 3 fois. Ensuite, listons vos priorités pour aujourd'hui. Que puis-je faire pour vous aider à vous sentir plus en contrôle ?";
      } else if (lowerMessage.includes('routine') || lowerMessage.includes('habitude')) {
        aiResponse = "Excellente question sur les routines ! Basé sur vos données, je recommande de commencer petit : choisissez 1-2 habitudes clés, définissez des déclencheurs spécifiques, et célébrez chaque petite victoire. Quelle habitude aimeriez-vous développer en premier ?";
      } else if (lowerMessage.includes('productivité') || lowerMessage.includes('efficacité')) {
        aiResponse = "Analysons votre productivité ! D'après vos patterns, vous êtes plus efficace le matin entre 9h-11h. Je suggère de bloquer ce temps pour vos tâches les plus importantes. Voulez-vous que je vous aide à planifier votre journée idéale ?";
      } else if (lowerMessage.includes('équilibre') || lowerMessage.includes('balance')) {
        aiResponse = "L'équilibre vie-travail est essentiel ! Basé sur votre profil, je recommande : définir des limites claires, programmer des pauses régulières, et pratiquer la déconnexion digitale. Quelle est votre plus grande difficulté actuellement ?";
      } else {
        aiResponse = "C'est une excellente question ! Basé sur votre profil et vos objectifs, je peux vous proposer plusieurs approches personnalisées. Pouvez-vous me donner plus de contexte sur votre situation actuelle ?";
      }
      
      const newMessage: Message = {
        id: Date.now().toString(),
        text: aiResponse,
        isAI: true,
        timestamp: new Date(),
        type: 'text',
        metadata: { confidence: 95, category: 'advice', actionable: true }
      };
      
      setMessages(prev => [...prev, newMessage]);
      setXp(prev => Math.min(prev + 15, maxXp));
    }, 1500 + Math.random() * 1000); // Realistic typing delay
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isAI: false,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToProcess = inputText;
    setInputText('');
    
    // Simulate AI response with contextual intelligence
    simulateAIResponse(messageToProcess);
  };

  const handleQuickAction = (action: string) => {
    const actionMessages: { [key: string]: string } = {
      deepwork: "Je veux démarrer une session de travail focalisée",
      journal: "Aide-moi avec ma réflexion quotidienne",
      learning: "Je veux apprendre quelque chose de nouveau",
      plan: "Aide-moi à planifier ma journée",
      track: "Je veux suivre mes habitudes",
      stats: "Montre-moi mes statistiques de productivité"
    };

    const text = actionMessages[action];
    if (text) {
      setInputText(text);
      setTimeout(() => handleSend(), 100);
    }
  };

  const handleStarterClick = (starter: string) => {
    setInputText(starter);
    setTimeout(() => handleSend(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const currentPersonality = aiPersonalities.find(p => p.id === selectedPersonality) || aiPersonalities[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/90 backdrop-blur-lg border-b border-gray-200 shadow-sm sticky top-0 z-50"
      >
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button and Logo */}
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => onNavigate('dashboard')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft size={24} className="text-gray-600" />
              </motion.button>
              
              <div className="flex items-center gap-3">
                <ImageWithFallback src={logoIcon} alt="Productif.io" className="w-12 h-12" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Assistant IA</h1>
                  <p className="text-sm text-gray-500">Votre coach de productivité personnalisé</p>
                </div>
              </div>
            </div>

            {/* Center: AI Personality Selector */}
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => setShowPersonalitySelector(!showPersonalitySelector)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-xl shadow-md"
              >
                <span className="text-lg">{currentPersonality.icon}</span>
                <span className="font-medium">{currentPersonality.name}</span>
                <Sparkles size={16} />
              </motion.button>

              {/* XP Progress */}
              <div className="flex items-center gap-2">
                <Star size={20} className="text-amber-500" />
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(xp / maxXp) * 100}%` }}
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                  />
                </div>
                <span className="text-sm font-medium text-gray-600">{xp}/{maxXp}</span>
              </div>
            </div>

            {/* Right: Navigation */}
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => onNavigate('dashboard')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 hover:bg-gray-100 text-gray-700 rounded-xl flex items-center gap-2 transition-all"
              >
                <Home size={18} />
                <span>Dashboard</span>
              </motion.button>

              <motion.button
                onClick={() => onNavigate('settings')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-gray-100 text-gray-700 rounded-xl transition-all"
              >
                <SettingsIcon size={20} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Personality Selector Dropdown */}
        <AnimatePresence>
          {showPersonalitySelector && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-50"
            >
              <div className="grid grid-cols-2 gap-3 w-80">
                {aiPersonalities.map((personality) => (
                  <motion.button
                    key={personality.id}
                    onClick={() => {
                      setSelectedPersonality(personality.id);
                      setShowPersonalitySelector(false);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      selectedPersonality === personality.id
                        ? 'border-[#00C27A] bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{personality.icon}</div>
                    <div className="font-medium text-gray-900">{personality.name}</div>
                    <div className="text-xs text-gray-500">{personality.description}</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <div className="max-w-[1200px] mx-auto px-8 py-8 h-[calc(100vh-120px)] flex flex-col">
        {/* Main Chat Area */}
        <div className="flex-1 flex gap-8">
          {/* Left Sidebar - Quick Actions */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-80 space-y-6"
          >
            {/* Quick Actions */}
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Zap size={20} className="text-[#00C27A]" />
                Actions Rapides
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action.action}
                    onClick={() => handleQuickAction(action.action)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-2xl bg-gradient-to-br ${action.color} text-white shadow-md hover:shadow-lg transition-all group`}
                  >
                    <action.icon size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-sm font-medium">{action.label}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Conversation Starters */}
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare size={20} className="text-[#00C27A]" />
                Suggestions
              </h3>
              <div className="space-y-2">
                {conversationStarters.slice(0, 4).map((starter, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleStarterClick(starter)}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left p-3 rounded-xl hover:bg-gray-50 text-sm text-gray-700 transition-all border border-transparent hover:border-gray-200"
                  >
                    "{starter}"
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Chat Messages Area */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex-1 bg-white rounded-3xl shadow-lg border border-gray-100 flex flex-col"
          >
            {/* Messages Container */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex gap-4 ${message.isAI ? 'justify-start' : 'justify-end'}`}
                >
                  {message.isAI && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00C27A] to-[#00D68F] flex items-center justify-center shadow-md">
                      <Bot size={20} className="text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[70%] ${message.isAI ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`p-4 rounded-2xl shadow-sm ${
                        message.isAI
                          ? 'bg-gray-50 border border-gray-200'
                          : 'bg-gradient-to-br from-[#00C27A] to-[#00D68F] text-white'
                      }`}
                    >
                      <p className={`text-sm leading-relaxed ${message.isAI ? 'text-gray-800' : 'text-white'}`}>
                        {message.text}
                      </p>
                      
                      {message.metadata?.actionable && message.isAI && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <ThumbsUp size={14} className="text-gray-500" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Copy size={14} className="text-gray-500" />
                          </motion.button>
                        </div>
                      )}
                    </div>
                    
                    <div className={`text-xs text-gray-500 mt-1 ${message.isAI ? 'text-left' : 'text-right'}`}>
                      {formatTime(message.timestamp)}
                      {message.metadata?.confidence && (
                        <span className="ml-2">• {message.metadata.confidence}% confiance</span>
                      )}
                    </div>
                  </div>

                  {!message.isAI && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                      <User size={20} className="text-white" />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing Indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex gap-4 justify-start"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00C27A] to-[#00D68F] flex items-center justify-center shadow-md">
                      <Bot size={20} className="text-white" />
                    </div>
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl shadow-sm">
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tapez votre message... (Entrée pour envoyer)"
                    className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-200 focus:border-[#00C27A] focus:ring-2 focus:ring-[#00C27A]/20 outline-none transition-all resize-none"
                  />
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsListening(!isListening)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-xl transition-all ${
                      isListening 
                        ? 'bg-red-500 text-white' 
                        : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    <MicIcon size={16} />
                  </motion.button>
                </div>

                <motion.button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-3 rounded-2xl shadow-md transition-all ${
                    inputText.trim()
                      ? 'bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white hover:shadow-lg'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send size={20} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}



