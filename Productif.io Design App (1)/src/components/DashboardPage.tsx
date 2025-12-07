import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../App';
import { Home, Bot, Settings as SettingsIcon, Plus, TrendingUp, Target, Zap, Clock, Award, Activity, CheckCircle2, Flame, Trophy } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

interface DashboardPageProps {
  onNavigate: (screen: Screen) => void;
}

const mockData = {
  user: "Alex",
  todayProgress: 87,
  focusHours: 6.5,
  tasksCompleted: 24,
  totalTasks: 28,
  streakDays: 42,
  weeklyGoalProgress: 89,
  productivityScore: 94,
  distractionsAvoided: 23,
  peakHours: "9-11 AM",
  energyLevel: 92,
  trialDaysLeft: 5,
  habits: [
    { name: "Morning Exercise", completed: false, streak: 38, time: "07:00" },
    { name: "Deep Work Session", completed: false, streak: 42, time: "09:00" },
    { name: "Read 30 min", completed: true, streak: 29, time: "20:00" },
    { name: "Meditation", completed: true, streak: 42, time: "06:30" },
  ],
  weeklyData: [
    { day: 'Mon', score: 88 },
    { day: 'Tue', score: 92 },
    { day: 'Wed', score: 85 },
    { day: 'Thu', score: 95 },
    { day: 'Fri', score: 91 },
    { day: 'Sat', score: 78 },
    { day: 'Sun', score: 87 },
  ],
  leaderboard: [
    { rank: 1, name: "You", score: 3847, avatar: "A", isUser: true, trend: "up" },
    { rank: 2, name: "Sophie M.", score: 3654, avatar: "S", trend: "same" },
    { rank: 3, name: "Lucas B.", score: 3521, avatar: "L", trend: "up" },
  ],
};

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [habitStates, setHabitStates] = useState(
    mockData.habits.map(habit => ({ ...habit }))
  );
  const [celebratingHabit, setCelebratingHabit] = useState<string | null>(null);

  const toggleHabit = (habitName: string) => {
    const habit = habitStates.find(h => h.name === habitName);
    if (!habit || habit.completed) return; // Don't allow uncompleting

    // Mark as completed
    setHabitStates(prev =>
      prev.map(h =>
        h.name === habitName ? { ...h, completed: true } : h
      )
    );

    // Trigger celebration
    setCelebratingHabit(habitName);
    setTimeout(() => setCelebratingHabit(null), 1500);
  };

  // Sort habits: incomplete first, then completed
  const sortedHabits = [...habitStates].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  return (
    <div className="min-h-[844px] bg-white flex flex-col">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-24 pt-12">
        {/* Free Trial Banner */}
        {mockData.trialDaysLeft > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-6 mb-4 bg-gradient-to-r from-[#00C27A] to-[#00D68F] rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative">
                  <Zap size={20} className="text-white" />
                  {/* Sparkle animations */}
                  <motion.span
                    className="absolute -top-1 -right-1 text-yellow-300"
                    animate={{
                      scale: [0, 1, 0],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                    }}
                  >
                    ✨
                  </motion.span>
                  <motion.span
                    className="absolute -bottom-1 -left-1 text-yellow-300 text-xs"
                    animate={{
                      scale: [0, 1, 0],
                      rotate: [0, -180, -360],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                      delay: 1,
                    }}
                  >
                    ✨
                  </motion.span>
                </div>
                <div>
                  <p className="text-sm opacity-90">Free Trial</p>
                  <p className="flex items-center gap-1">
                    <span className="text-yellow-300">⚡</span>
                    {mockData.trialDaysLeft} days left to unlock full potential
                    <span className="text-yellow-300">⚡</span>
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  boxShadow: [
                    '0 0 0px rgba(255, 255, 255, 0)',
                    '0 0 20px rgba(255, 255, 255, 0.5)',
                    '0 0 0px rgba(255, 255, 255, 0)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="bg-white text-[#00C27A] px-4 py-2 rounded-full text-sm relative"
              >
                <span className="relative z-10">Upgrade</span>
                <motion.span
                  className="absolute top-0 right-2 text-xs"
                  animate={{ y: [-2, -6, -2] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ✨
                </motion.span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <div className="px-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-gray-800 mb-1">Hello, {mockData.user} 👋</h1>
            <p className="text-gray-600">Let's make today productive</p>
          </motion.div>
        </div>

        {/* Main Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-6 mb-6"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-3xl p-5 shadow-lg text-white relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <div className="relative z-10">
                <Target size={24} className="mb-2 opacity-90" />
                <p className="text-white/80 text-sm mb-1">Daily Progress</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl">{mockData.todayProgress}%</p>
                  <span className="text-white/70 text-xs">↑ 12%</span>
                </div>
                <div className="mt-2 h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${mockData.todayProgress}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <Clock size={24} className="text-[#00C27A] mb-2" />
              <p className="text-gray-600 text-sm mb-1">Focus Time</p>
              <div className="flex items-baseline gap-1">
                <p className="text-gray-800 text-3xl">{mockData.focusHours}</p>
                <span className="text-gray-800 text-xl">h</span>
              </div>
              <p className="text-[#00C27A] text-xs mt-1">+2.5h vs yesterday 🎯</p>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 size={24} className="text-[#00C27A]" />
                <button
                  onClick={() => onNavigate('tasks')}
                  className="text-[#00C27A] text-sm hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 text-sm mb-1">Tasks Completed</p>
              <div className="flex items-baseline gap-1">
                <p className="text-gray-800 text-3xl">{mockData.tasksCompleted}</p>
                <span className="text-gray-500 text-lg">/{mockData.totalTasks}</span>
              </div>
              <div className="mt-2 flex gap-0.5">
                {[...Array(mockData.totalTasks)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${
                      i < mockData.tasksCompleted ? 'bg-[#00C27A]' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-3xl p-5 shadow-lg text-white relative overflow-hidden">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Flame size={24} className="mb-2 opacity-90" />
              </motion.div>
              <p className="text-white/80 text-sm mb-1">Current Streak</p>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl">{mockData.streakDays}</p>
                <span className="text-xl">days</span>
              </div>
              <p className="text-white/70 text-xs mt-1">Personal best! 🏆</p>
            </div>
          </div>
        </motion.div>

        {/* Productivity Score Circle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-6 mb-6"
        >
          <div className="bg-gradient-to-br from-[#00C27A]/10 to-white rounded-3xl p-4 shadow-sm border border-[#00C27A]/20 relative overflow-hidden">
            {/* Animated Background Particles */}
            <motion.div
              className="absolute top-0 right-0 w-24 h-24 bg-[#00C27A]/5 rounded-full blur-3xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-20 h-20 bg-[#00D68F]/5 rounded-full blur-3xl"
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.5, 0.3, 0.5]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-800 text-sm">Productivity Score</h3>
                <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full">
                  <TrendingUp size={12} className="text-green-600" />
                  <span className="text-green-600 text-xs">+12%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="relative w-24 h-24 flex-shrink-0">
                  {/* Glowing Ring Effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] opacity-20 blur-md"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="42"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="none"
                    />
                    <motion.circle
                      cx="48"
                      cy="48"
                      r="42"
                      stroke="url(#dashboardGradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "0 264" }}
                      animate={{ strokeDasharray: `${(mockData.productivityScore / 100) * 264} 264` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                    <defs>
                      <linearGradient id="dashboardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00C27A" />
                        <stop offset="100%" stopColor="#00D68F" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span 
                      className="text-2xl text-gray-800"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1, duration: 0.5 }}
                    >
                      {mockData.productivityScore}
                    </motion.span>
                    <span className="text-[10px] text-gray-500">Elite ✨</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-gray-600 text-xs">Energy ⚡</span>
                      <span className="text-[#00C27A] text-xs">{mockData.energyLevel}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden relative">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${mockData.energyLevel}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-gray-600 text-xs">Goals 🎯</span>
                      <span className="text-[#00C27A] text-xs">{mockData.weeklyGoalProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden relative">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${mockData.weeklyGoalProgress}%` }}
                        transition={{ duration: 1, delay: 0.6 }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-gray-600 text-xs">Focus 🧠</span>
                      <span className="text-cyan-600 text-xs">96%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden relative">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "96%" }}
                        transition={{ duration: 1, delay: 0.7 }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Stats Grid */}
              <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 mb-0.5">Total Hours</p>
                  <p className="text-[#00C27A] text-sm">847</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 mb-0.5">This Week</p>
                  <p className="text-[#00C27A] text-sm">124h</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 mb-0.5">Best Time</p>
                  <p className="text-[#00C27A] text-sm">9-11am</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 mb-0.5">Global Rank</p>
                  <p className="text-[#00C27A] text-sm">#1 🏆</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Weekly Analytics Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-6 mb-6"
        >
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-gray-800 text-sm">Weekly Trend</h4>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('analytics')}
                className="flex items-center gap-1 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white px-3 py-1.5 rounded-full text-xs shadow-sm"
              >
                <TrendingUp size={14} />
                <span>View Data</span>
              </motion.button>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={mockData.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#9ca3af" style={{ fontSize: '11px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#00C27A" 
                  strokeWidth={2.5}
                  dot={{ fill: '#00C27A', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Daily Habits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="px-6 mb-6"
        >
          <h3 className="text-gray-800 mb-3">Daily Habits</h3>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 relative">
            <div className="space-y-3">
              {sortedHabits.map((habit, index) => {
                const isCelebrating = celebratingHabit === habit.name;
                return (
                  <motion.div
                    key={habit.name}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center gap-3 relative"
                  >
                    {/* Celebration Animation */}
                    <AnimatePresence>
                      {isCelebrating && (
                        <motion.div
                          className="absolute inset-0 pointer-events-none z-10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {/* Glow Effect */}
                          <motion.div
                            className="absolute inset-0 bg-[#00C27A]/20 rounded-2xl"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1.2, opacity: [0, 0.5, 0] }}
                            transition={{ duration: 0.6 }}
                          />
                          
                          {/* Confetti Particles */}
                          {[...Array(12)].map((_, i) => {
                            const angle = (i / 12) * Math.PI * 2;
                            const distance = 40 + Math.random() * 20;
                            const x = Math.cos(angle) * distance;
                            const y = Math.sin(angle) * distance;
                            const colors = ['#00C27A', '#00D68F', '#FFD700', '#FF6B9D', '#4ECDC4', '#45B7D1'];
                            const color = colors[i % colors.length];
                            
                            return (
                              <motion.div
                                key={i}
                                className="absolute left-6 top-1/2"
                                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                                animate={{
                                  x: x,
                                  y: y,
                                  scale: [0, 1, 0.8, 0],
                                  opacity: [1, 1, 0.5, 0],
                                  rotate: Math.random() * 360,
                                }}
                                transition={{
                                  duration: 0.8,
                                  ease: "easeOut",
                                }}
                              >
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                              </motion.div>
                            );
                          })}
                          
                          {/* Success Text */}
                          <motion.div
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                            initial={{ scale: 0, y: 0 }}
                            animate={{ scale: [0, 1.2, 1], y: -10 }}
                            exit={{ scale: 0, y: -20, opacity: 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            <span className="text-2xl">✨</span>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.div 
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer relative z-20 ${
                        habit.completed 
                          ? 'bg-[#00C27A] border-[#00C27A]' 
                          : 'border-gray-300 hover:border-[#00C27A]/50'
                      }`}
                      whileHover={{ scale: habit.completed ? 1 : 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleHabit(habit.name)}
                      animate={isCelebrating ? {
                        scale: [1, 1.3, 1],
                        rotate: [0, 10, -10, 0],
                      } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      {habit.completed && (
                        <motion.span
                          className="text-white text-xs"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        >
                          ✓
                        </motion.span>
                      )}
                    </motion.div>
                    <div className="flex-1 min-w-0 relative z-20">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm truncate ${habit.completed ? 'text-gray-700' : 'text-gray-500'}`}>
                          {habit.name}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">{habit.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: habit.completed ? "100%" : "0%" }}
                            transition={{ duration: 0.8, delay: habit.completed && isCelebrating ? 0.3 : 0 }}
                          />
                        </div>
                        <span className="text-xs text-[#00C27A] whitespace-nowrap flex items-center gap-1">
                          {habit.streak}d <Flame size={12} />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Quick Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="px-6 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-800">Achievements Unlocked</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('achievements')}
              className="flex items-center gap-1 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white px-3 py-1.5 rounded-full text-xs shadow-sm"
            >
              <Award size={14} />
              <span>View All</span>
            </motion.button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4 shadow-md text-white relative overflow-hidden"
            >
              <motion.div
                className="absolute top-0 right-0 text-6xl opacity-10"
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                🔥
              </motion.div>
              <Award size={20} className="mb-2 opacity-90" />
              <p className="text-sm mb-0.5">Productivity Legend</p>
              <p className="text-xs text-white/70 mb-2">42-day streak maintained</p>
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5 w-fit">
                <span className="text-xs">Unlocked</span>
                <span className="text-xs">✨</span>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl p-4 shadow-md text-white relative overflow-hidden"
            >
              <motion.div
                className="absolute top-0 right-0 text-6xl opacity-10"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🎯
              </motion.div>
              <Target size={20} className="mb-2 opacity-90" />
              <p className="text-sm mb-0.5">Goal Crusher</p>
              <p className="text-xs text-white/70 mb-2">Completed 100+ tasks</p>
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5 w-fit">
                <span className="text-xs">Unlocked</span>
                <span className="text-xs">🏆</span>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl p-4 shadow-md text-white relative overflow-hidden"
            >
              <motion.div
                className="absolute top-0 right-0 text-6xl opacity-10"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                ⚡
              </motion.div>
              <Zap size={20} className="mb-2 opacity-90" />
              <p className="text-sm mb-0.5">Distraction Slayer</p>
              <p className="text-xs text-white/70 mb-2">Avoided 500+ distractions</p>
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5 w-fit">
                <span className="text-xs">Unlocked</span>
                <span className="text-xs">⚔️</span>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-4 shadow-md text-white relative overflow-hidden"
            >
              <motion.div
                className="absolute top-0 right-0 text-6xl opacity-10"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                🌟
              </motion.div>
              <Activity size={20} className="mb-2 opacity-90" />
              <p className="text-sm mb-0.5">Top 1% Elite</p>
              <p className="text-xs text-white/70 mb-2">Score above 90 for 7 days</p>
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5 w-fit">
                <span className="text-xs">Unlocked</span>
                <span className="text-xs">👑</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="px-6 mb-6"
        >
          <h3 className="text-gray-800 mb-3">Leaderboard</h3>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {mockData.leaderboard.map((user, index) => (
              <motion.div
                key={user.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className={`flex items-center justify-between p-4 border-b border-gray-50 last:border-b-0 ${
                  user.isUser ? 'bg-[#00C27A]/5' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    user.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white' :
                    user.rank === 2 ? 'bg-gradient-to-br from-[#00C27A] to-[#00D68F] text-white shadow-md' :
                    'bg-gradient-to-br from-gray-300 to-gray-400 text-white'
                  }`}>
                    {user.avatar}
                  </div>
                  <div>
                    <p className={`${user.isUser ? 'text-[#00C27A]' : 'text-gray-800'}`}>
                      {user.name}
                    </p>
                    <p className="text-gray-500 text-sm">{user.score} pts</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {user.trend === 'up' ? (
                    <TrendingUp size={16} className="text-green-500" />
                  ) : user.trend === 'same' ? (
                    <div className="w-4 h-0.5 bg-gray-400 rounded"></div>
                  ) : (
                    <TrendingUp size={16} className="text-red-400 transform rotate-180" />
                  )}
                  <span className="text-gray-400 text-sm">#{user.rank}</span>
                </div>
              </motion.div>
            ))}
            
            {/* View Full Leaderboard Button */}
            <motion.button
              onClick={() => onNavigate('leaderboard')}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full p-4 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white flex items-center justify-center gap-2"
            >
              <Trophy size={18} />
              <span>View Full Leaderboard</span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.1, boxShadow: "0 10px 30px rgba(0, 194, 122, 0.4)" }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-28 right-6 w-14 h-14 bg-gradient-to-r from-[#00C27A] to-[#00D68F] rounded-full flex items-center justify-center shadow-xl z-20"
      >
        <Plus size={24} className="text-white" />
      </motion.button>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 flex items-center justify-around px-6 pt-3 pb-6 bg-gradient-to-r from-[#00C27A] to-[#00D68F] z-50 safe-area-bottom max-w-[390px] mx-auto">
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center gap-1 relative"
        >
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-[20px] flex items-center justify-center">
            <Home size={28} className="text-white" />
          </div>
          <div className="absolute top-0 w-2 h-2 bg-white rounded-full shadow-lg"></div>
          <span className="text-white text-xs mt-1">Home</span>
        </motion.button>

        <motion.button
          onClick={() => onNavigate('assistant')}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-14 h-14 bg-white/0 hover:bg-white/10 backdrop-blur-sm rounded-[20px] flex items-center justify-center transition-all">
            <Bot size={28} className="text-white/70" />
          </div>
          <span className="text-white/70 text-xs mt-1">Assistant</span>
        </motion.button>

        <motion.button
          onClick={() => onNavigate('settings')}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-14 h-14 bg-white/0 hover:bg-white/10 backdrop-blur-sm rounded-[20px] flex items-center justify-center transition-all">
            <SettingsIcon size={28} className="text-white/70" />
          </div>
          <span className="text-white/70 text-xs mt-1">Settings</span>
        </motion.button>
      </div>
    </div>
  );
}