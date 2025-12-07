import { motion } from 'motion/react';
import { Screen } from '../App';
import { Home, Bot, BarChart3, Settings as SettingsIcon, TrendingUp, Flame, Target, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrackerPageProps {
  onNavigate: (screen: Screen) => void;
}

const weeklyData = [
  { day: 'Mon', focus: 6.5, tasks: 8 },
  { day: 'Tue', focus: 7.2, tasks: 12 },
  { day: 'Wed', focus: 5.8, tasks: 7 },
  { day: 'Thu', focus: 8.1, tasks: 15 },
  { day: 'Fri', focus: 7.5, tasks: 11 },
  { day: 'Sat', focus: 4.2, tasks: 5 },
  { day: 'Sun', focus: 3.5, tasks: 3 },
];

const streakHeatmap = [
  [1, 1, 0, 1, 1, 1, 1],
  [1, 1, 1, 0, 1, 1, 1],
  [1, 1, 1, 1, 1, 0, 1],
  [0, 1, 1, 1, 1, 1, 1],
];

const stats = {
  currentStreak: 12,
  longestStreak: 28,
  dailyAverage: 6.4,
  focusScore: 82,
  totalHours: 156
};

export function TrackerPage({ onNavigate }: TrackerPageProps) {
  return (
    <div className="min-h-[844px] bg-white pb-24 pt-12">
      {/* Header */}
      <div className="px-8 mb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-gray-800 mb-1">Analytics</h1>
          <p className="text-gray-600">Track your progress over time</p>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-8 mb-6"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-[#1abc9c]/10 to-white rounded-2xl p-4 shadow-sm border border-[#1abc9c]/20">
            <Flame className="text-[#1abc9c] mb-2" size={24} />
            <p className="text-gray-600 text-sm mb-1">Current Streak</p>
            <p className="text-gray-800">{stats.currentStreak} days</p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <Target className="text-[#1abc9c] mb-2" size={24} />
            <p className="text-gray-600 text-sm mb-1">Focus Score</p>
            <p className="text-gray-800">{stats.focusScore}/100</p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <TrendingUp className="text-[#1abc9c] mb-2" size={24} />
            <p className="text-gray-600 text-sm mb-1">Daily Avg</p>
            <p className="text-gray-800">{stats.dailyAverage}h</p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <Calendar className="text-[#1abc9c] mb-2" size={24} />
            <p className="text-gray-600 text-sm mb-1">Total Hours</p>
            <p className="text-gray-800">{stats.totalHours}h</p>
          </div>
        </div>
      </motion.div>

      {/* Weekly Focus Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-8 mb-6"
      >
        <h3 className="text-gray-800 mb-3">Weekly Focus Time</h3>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
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
                dataKey="focus" 
                stroke="#1abc9c" 
                strokeWidth={3}
                dot={{ fill: '#1abc9c', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Streak Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-8 mb-6"
      >
        <h3 className="text-gray-800 mb-3">Activity Heatmap</h3>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="space-y-2">
            {streakHeatmap.map((week, weekIndex) => (
              <div key={weekIndex} className="flex gap-2">
                {week.map((day, dayIndex) => (
                  <motion.div
                    key={`${weekIndex}-${dayIndex}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 + (weekIndex * 0.05) + (dayIndex * 0.02) }}
                    className={`flex-1 h-8 rounded-lg ${
                      day === 1 
                        ? 'bg-gradient-to-br from-[#1abc9c] to-[#16a085]' 
                        : 'bg-gray-100'
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
            <span>4 weeks ago</span>
            <span>Today</span>
          </div>
        </div>
      </motion.div>

      {/* Milestone Achievement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-8 mb-6"
      >
        <div className="bg-gradient-to-r from-[#1abc9c] to-[#16a085] rounded-3xl p-6 shadow-lg text-white relative overflow-hidden">
          {/* Confetti Animation */}
          <motion.div
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10px`,
                }}
                animate={{
                  y: [0, 200],
                  x: [0, (Math.random() - 0.5) * 100],
                  opacity: [1, 0],
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  delay: i * 0.1
                }}
              />
            ))}
          </motion.div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <h3 className="text-white">Milestone Reached!</h3>
                <p className="text-white/80 text-sm">12-day streak achieved</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-8 py-4 shadow-lg">
        <div className="flex items-center justify-around max-w-[390px] mx-auto">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#1abc9c] transition-colors"
          >
            <Home size={24} />
            <span className="text-xs">Dashboard</span>
          </button>
          <button
            onClick={() => onNavigate('assistant')}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#1abc9c] transition-colors"
          >
            <Bot size={24} />
            <span className="text-xs">Assistant</span>
          </button>
          <button className="flex flex-col items-center gap-1 relative">
            <div className="absolute -top-1 w-12 h-1 bg-[#1abc9c] rounded-full"></div>
            <BarChart3 size={24} className="text-[#1abc9c]" />
            <span className="text-xs text-[#1abc9c]">Tracker</span>
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#1abc9c] transition-colors"
          >
            <SettingsIcon size={24} />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
