import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../App';
import { Home, Bot, Settings as SettingsIcon, Plus, TrendingUp, Target, Zap, Clock, Award, Activity, CheckCircle2, Flame, Trophy, Bell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import logoIcon from 'figma:asset/5e6ca94c36190e877b3f2f2ae5b2d32ffb6147c1.png';
import { ImageWithFallback } from './figma/ImageWithFallback';

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
    if (!habit || habit.completed) return;

    setHabitStates(prev =>
      prev.map(h =>
        h.name === habitName ? { ...h, completed: true } : h
      )
    );

    setCelebratingHabit(habitName);
    setTimeout(() => setCelebratingHabit(null), 1500);
  };

  const sortedHabits = [...habitStates].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col">
      {/* Top Navigation Bar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm sticky top-0 z-50"
      >
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3 mr-auto">
              <ImageWithFallback src={logoIcon} alt="Productif.io" className="w-16 h-16" />
              <h1 className="text-2xl text-gray-900 whitespace-nowrap text-[24px]">
                Productif.io
              </h1>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-2xl flex items-center gap-2 shadow-md"
              >
                <Home size={20} />
                <span>Dashboard</span>
              </motion.button>

              <motion.button
                onClick={() => onNavigate('assistant')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 hover:bg-gray-100 text-gray-700 rounded-2xl flex items-center gap-2 transition-all"
              >
                <Bot size={20} />
                <span>AI Assistant</span>
              </motion.button>

              <motion.button
                onClick={() => onNavigate('analytics')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 hover:bg-gray-100 text-gray-700 rounded-2xl flex items-center gap-2 transition-all"
              >
                <TrendingUp size={20} />
                <span>Analytics</span>
              </motion.button>

              <motion.button
                onClick={() => onNavigate('tasks')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 hover:bg-gray-100 text-gray-700 rounded-2xl flex items-center gap-2 transition-all"
              >
                <CheckCircle2 size={20} />
                <span>Tasks</span>
              </motion.button>

              <motion.button
                onClick={() => onNavigate('leaderboard')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 hover:bg-gray-100 text-gray-700 rounded-2xl flex items-center gap-2 transition-all"
              >
                <Trophy size={20} />
                <span>Leaderboard</span>
              </motion.button>

              <motion.button
                onClick={() => onNavigate('settings')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 hover:bg-gray-100 text-gray-700 rounded-2xl flex items-center gap-2 transition-all"
              >
                <SettingsIcon size={20} />
                <span>Settings</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content - Centered Container */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-gray-800 text-3xl mb-2">Hello, {mockData.user} 👋</h2>
            <p className="text-gray-600 text-lg">Let's make today incredibly productive</p>
          </motion.div>

          {/* Stats Grid - 4 Columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-4 gap-6 mb-8"
          >
            {/* Daily Progress Card */}
            <div className="bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <div className="relative z-10">
                <Target size={28} className="mb-3 opacity-90" />
                <p className="text-white/80 mb-2 text-sm">Daily Progress</p>
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-4xl">{mockData.todayProgress}%</p>
                  <span className="text-white/70 text-sm">↑ 12%</span>
                </div>
                <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${mockData.todayProgress}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Focus Time Card */}
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
              <Clock size={28} className="text-[#00C27A] mb-3" />
              <p className="text-gray-600 mb-2 text-sm">Focus Time</p>
              <div className="flex items-baseline gap-2 mb-2">
                <p className="text-gray-800 text-4xl">{mockData.focusHours}</p>
                <span className="text-gray-800 text-2xl">h</span>
              </div>
              <p className="text-[#00C27A] text-sm">+2.5h vs yesterday 🎯</p>
            </div>

            {/* Streak Card */}
            <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
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
                <Flame size={28} className="mb-3 opacity-90" />
              </motion.div>
              <p className="text-white/80 mb-2 text-sm">Current Streak</p>
              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-4xl">{mockData.streakDays}</p>
                <span className="text-2xl">days</span>
              </div>
              <p className="text-white/70 text-sm">Personal best! 🏆</p>
            </div>

            {/* Productivity Score Card */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
              <Award size={28} className="mb-3 opacity-90" />
              <p className="text-white/80 mb-2 text-sm">Score</p>
              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-4xl">{mockData.productivityScore}</p>
                <span className="text-2xl">/100</span>
              </div>
              <p className="text-white/70 text-sm">Top 1% Elite ✨</p>
            </div>
          </motion.div>

          {/* Main Content Grid - 2 Columns */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Left Column - Charts & Analytics */}
            <div className="col-span-2 space-y-6">
              {/* Weekly Performance Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-gray-800 text-xl mb-1">Weekly Performance</h3>
                    <p className="text-gray-500 text-sm">Your productivity trend this week</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onNavigate('analytics')}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white px-5 py-2.5 rounded-xl shadow-sm"
                  >
                    <TrendingUp size={18} />
                    <span>Full Analytics</span>
                  </motion.button>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={mockData.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '8px 12px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#00C27A" 
                      strokeWidth={3}
                      dot={{ fill: '#00C27A', r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Stats Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100"
              >
                <h3 className="text-gray-800 text-xl mb-6">Performance Metrics</h3>
                <div className="grid grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#00C27A]/10 to-[#00D68F]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Clock size={28} className="text-[#00C27A]" />
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Total Hours</p>
                    <p className="text-[#00C27A] text-2xl">847h</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500/10 to-indigo-600/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Target size={28} className="text-purple-600" />
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Tasks Done</p>
                    <p className="text-purple-600 text-2xl">{mockData.tasksCompleted}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400/10 to-pink-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Zap size={28} className="text-orange-500" />
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Peak Time</p>
                    <p className="text-orange-500 text-2xl">9-11am</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Trophy size={28} className="text-cyan-600" />
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Rank</p>
                    <p className="text-cyan-600 text-2xl">#1 🏆</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Habits & Quick Actions */}
            <div className="space-y-6">
              {/* Daily Habits */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-800 text-lg">Daily Habits</h3>
                  <div className="bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white px-3 py-1 rounded-full text-xs">
                    2/4 Done
                  </div>
                </div>
                <div className="space-y-3">
                  {sortedHabits.map((habit, index) => {
                    const isCelebrating = celebratingHabit === habit.name;
                    return (
                      <motion.div
                        key={habit.name}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="relative"
                      >
                        <div className="flex items-center gap-3">
                          <motion.div 
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer ${
                              habit.completed 
                                ? 'bg-[#00C27A] border-[#00C27A]' 
                                : 'border-gray-300 hover:border-[#00C27A]/50'
                            }`}
                            whileHover={{ scale: habit.completed ? 1 : 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleHabit(habit.name)}
                          >
                            {habit.completed && (
                              <CheckCircle2 size={16} className="text-white" />
                            )}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm ${habit.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                {habit.name}
                              </span>
                              <span className="text-xs text-gray-400">{habit.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: habit.completed ? "100%" : "0%" }}
                                  transition={{ duration: 0.8 }}
                                />
                              </div>
                              <span className="text-xs text-[#00C27A] whitespace-nowrap flex items-center gap-1">
                                <Flame size={12} /> {habit.streak}d
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <AnimatePresence>
                          {isCelebrating && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-xl"
                            >
                              <span className="text-3xl">🎉</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Tasks Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-800 text-lg">Tasks</h3>
                  <button
                    onClick={() => onNavigate('tasks')}
                    className="text-[#00C27A] text-sm hover:underline"
                  >
                    View All →
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Completed</span>
                    <span className="text-[#00C27A]">{mockData.tasksCompleted}/{mockData.totalTasks}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(mockData.tasksCompleted / mockData.totalTasks) * 100}%` }}
                      transition={{ duration: 1, delay: 0.4 }}
                      className="h-full bg-gradient-to-r from-[#00C27A] to-[#00D68F]"
                    />
                  </div>
                  <p className="text-sm text-gray-500 pt-2">Great progress! Keep it up 🚀</p>
                </div>
              </motion.div>

              {/* Leaderboard */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-800 text-lg">Leaderboard</h3>
                  <button
                    onClick={() => onNavigate('leaderboard')}
                    className="text-[#00C27A] text-sm hover:underline"
                  >
                    View All →
                  </button>
                </div>
                <div className="space-y-3">
                  {mockData.leaderboard.map((user) => (
                    <div
                      key={user.rank}
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        user.isUser ? 'bg-gradient-to-r from-[#00C27A]/10 to-[#00D68F]/10' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          user.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white' :
                          user.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                          'bg-gradient-to-br from-orange-400 to-orange-500 text-white'
                        }`}>
                          {user.avatar}
                        </div>
                        <div>
                          <p className={`text-sm ${user.isUser ? 'text-[#00C27A]' : 'text-gray-800'}`}>
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500">{user.score} pts</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.rank === 1 && <span className="text-xl">👑</span>}
                        <span className="text-sm text-gray-400">#{user.rank}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Achievements Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-gray-800 text-xl mb-1">Recent Achievements</h3>
                <p className="text-gray-500 text-sm">Your latest unlocked badges</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('achievements')}
                className="flex items-center gap-2 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white px-5 py-2.5 rounded-xl shadow-sm"
              >
                <Award size={18} />
                <span>View All</span>
              </motion.button>
            </div>
            <div className="grid grid-cols-4 gap-6">
              <motion.div 
                whileHover={{ scale: 1.03, y: -4 }}
                className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 shadow-xl text-white cursor-pointer"
              >
                <Award size={32} className="mb-4 opacity-90" />
                <p className="text-lg mb-2">Productivity Legend</p>
                <p className="text-sm text-white/80 mb-3">42-day streak maintained</p>
                <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 w-fit">
                  <span className="text-xs">Unlocked ✨</span>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.03, y: -4 }}
                className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl p-8 shadow-xl text-white cursor-pointer"
              >
                <Target size={32} className="mb-4 opacity-90" />
                <p className="text-lg mb-2">Goal Crusher</p>
                <p className="text-sm text-white/80 mb-3">Completed 100+ tasks</p>
                <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 w-fit">
                  <span className="text-xs">Unlocked 🏆</span>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.03, y: -4 }}
                className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl p-8 shadow-xl text-white cursor-pointer"
              >
                <Zap size={32} className="mb-4 opacity-90" />
                <p className="text-lg mb-2">Distraction Slayer</p>
                <p className="text-sm text-white/80 mb-3">Avoided 500+ distractions</p>
                <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 w-fit">
                  <span className="text-xs">Unlocked ⚔️</span>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.03, y: -4 }}
                className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl p-8 shadow-xl text-white cursor-pointer"
              >
                <Activity size={32} className="mb-4 opacity-90" />
                <p className="text-lg mb-2">Top 1% Elite</p>
                <p className="text-sm text-white/80 mb-3">Score above 90 for 7 days</p>
                <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 w-fit">
                  <span className="text-xs">Unlocked 👑</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.1, boxShadow: "0 10px 30px rgba(0, 194, 122, 0.4)" }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-[#00C27A] to-[#00D68F] rounded-full flex items-center justify-center shadow-2xl z-40"
      >
        <Plus size={28} className="text-white" />
      </motion.button>
    </div>
  );
}