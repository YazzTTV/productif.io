import { motion } from 'motion/react';
import { Screen } from '../App';
import { Home, Bot, Settings as SettingsIcon, ArrowLeft, Calendar, TrendingUp, Flame, Target, Clock, Award, BarChart3, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface AnalyticsPageProps {
  onNavigate: (screen: Screen) => void;
}

type TimePeriod = 'week' | 'month' | 'trimester' | 'year';

// Mock data for different time periods
const weekData = [
  { name: 'Mon', productivity: 75, focus: 80, tasks: 8, habits: 5 },
  { name: 'Tue', productivity: 82, focus: 85, tasks: 10, habits: 6 },
  { name: 'Wed', productivity: 78, focus: 75, tasks: 9, habits: 5 },
  { name: 'Thu', productivity: 88, focus: 90, tasks: 12, habits: 7 },
  { name: 'Fri', productivity: 85, focus: 88, tasks: 11, habits: 6 },
  { name: 'Sat', productivity: 70, focus: 72, tasks: 6, habits: 4 },
  { name: 'Sun', productivity: 65, focus: 68, tasks: 5, habits: 3 },
];

const monthData = [
  { name: 'Week 1', productivity: 78, focus: 82, tasks: 45, habits: 28 },
  { name: 'Week 2', productivity: 85, focus: 88, tasks: 52, habits: 32 },
  { name: 'Week 3', productivity: 82, focus: 85, tasks: 48, habits: 30 },
  { name: 'Week 4', productivity: 88, focus: 90, tasks: 55, habits: 35 },
];

const trimesterData = [
  { name: 'Jan', productivity: 75, focus: 78, tasks: 180, habits: 110 },
  { name: 'Feb', productivity: 82, focus: 85, tasks: 195, habits: 120 },
  { name: 'Mar', productivity: 88, focus: 90, tasks: 210, habits: 135 },
];

const yearData = [
  { name: 'Q1', productivity: 78, focus: 82, tasks: 585, habits: 365 },
  { name: 'Q2', productivity: 85, focus: 88, tasks: 625, habits: 395 },
  { name: 'Q3', productivity: 82, focus: 85, tasks: 600, habits: 380 },
  { name: 'Q4', productivity: 88, focus: 90, tasks: 650, habits: 410 },
];

const habitStreaks = [
  { name: 'Morning Meditation', streak: 45, icon: '🧘', color: 'from-purple-500 to-pink-500', completed: 89 },
  { name: 'Deep Work Sessions', streak: 32, icon: '💻', color: 'from-blue-500 to-cyan-500', completed: 76 },
  { name: 'Exercise', streak: 28, icon: '💪', color: 'from-orange-500 to-red-500', completed: 68 },
  { name: 'Reading', streak: 21, icon: '📚', color: 'from-green-500 to-emerald-500', completed: 54 },
  { name: 'Journaling', streak: 15, icon: '✍️', color: 'from-indigo-500 to-purple-500', completed: 42 },
];

export function AnalyticsPage({ onNavigate }: AnalyticsPageProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');

  const getDataForPeriod = () => {
    switch (timePeriod) {
      case 'week': return weekData;
      case 'month': return monthData;
      case 'trimester': return trimesterData;
      case 'year': return yearData;
    }
  };

  const chartData = getDataForPeriod();

  const stats = {
    week: { avgProductivity: 77, totalTasks: 61, totalHabits: 36, focusHours: 42 },
    month: { avgProductivity: 83, totalTasks: 200, totalHabits: 125, focusHours: 168 },
    trimester: { avgProductivity: 82, totalTasks: 585, totalHabits: 365, focusHours: 504 },
    year: { avgProductivity: 83, totalTasks: 2460, totalHabits: 1550, focusHours: 2016 },
  };

  const currentStats = stats[timePeriod];

  return (
    <div className="min-h-[844px] bg-gradient-to-br from-gray-50 to-white pb-24 pt-16 px-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-gray-800">Analytics</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Time Period Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {(['week', 'month', 'trimester', 'year'] as TimePeriod[]).map((period) => (
            <motion.button
              key={period}
              onClick={() => setTimePeriod(period)}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
                timePeriod === period
                  ? 'bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-[#00C27A]" />
            <p className="text-gray-600 text-xs">Avg Productivity</p>
          </div>
          <p className="text-gray-800 text-2xl">{currentStats.avgProductivity}%</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={18} className="text-blue-500" />
            <p className="text-gray-600 text-xs">Total Tasks</p>
          </div>
          <p className="text-gray-800 text-2xl">{currentStats.totalTasks}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={18} className="text-orange-500" />
            <p className="text-gray-600 text-xs">Habits Tracked</p>
          </div>
          <p className="text-gray-800 text-2xl">{currentStats.totalHabits}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-purple-500" />
            <p className="text-gray-600 text-xs">Focus Hours</p>
          </div>
          <p className="text-gray-800 text-2xl">{currentStats.focusHours}h</p>
        </div>
      </div>

      {/* Productivity Trend Chart */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-gray-800 mb-4">Productivity Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="productivityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00C27A" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00C27A" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" stroke="#888" style={{ fontSize: '12px' }} />
            <YAxis stroke="#888" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '12px'
              }} 
            />
            <Area 
              type="monotone" 
              dataKey="productivity" 
              stroke="#00C27A" 
              strokeWidth={3}
              fill="url(#productivityGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Focus vs Tasks Chart */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-gray-800 mb-4">Focus Score vs Tasks Completed</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" stroke="#888" style={{ fontSize: '12px' }} />
            <YAxis stroke="#888" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '12px'
              }} 
            />
            <Bar dataKey="focus" fill="#00C27A" radius={[8, 8, 0, 0]} />
            <Bar dataKey="tasks" fill="#60A5FA" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Habit Streaks */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-800">Habit Streaks</h3>
          <Award size={20} className="text-[#00C27A]" />
        </div>
        
        <div className="space-y-3">
          {habitStreaks.map((habit, index) => (
            <motion.div
              key={habit.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-100 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{habit.icon}</div>
                  <div>
                    <p className="text-gray-800 text-sm">{habit.name}</p>
                    <p className="text-gray-500 text-xs">{habit.completed}% completion</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Flame size={16} className="text-orange-500" />
                    <span className="text-gray-800">{habit.streak}</span>
                  </div>
                  <p className="text-gray-500 text-xs">day streak</p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${habit.completed}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className={`h-2 rounded-full bg-gradient-to-r ${habit.color}`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Weekly Consistency Heatmap */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-gray-800 mb-4">Weekly Consistency</h3>
        <div className="grid grid-cols-7 gap-2">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
            <div key={index} className="text-center">
              <p className="text-gray-500 text-xs mb-2">{day}</p>
              <div 
                className={`h-12 rounded-lg ${
                  index < 5 ? 'bg-gradient-to-br from-[#00C27A] to-[#00D68F]' : 'bg-gray-200'
                }`}
              />
              <p className="text-gray-600 text-xs mt-1">
                {index < 5 ? '✓' : '–'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-around">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex flex-col items-center gap-1 text-gray-400"
        >
          <Home size={24} />
          <span className="text-xs">Home</span>
        </button>
        <button
          onClick={() => onNavigate('assistant')}
          className="flex flex-col items-center gap-1 text-gray-400"
        >
          <Bot size={24} />
          <span className="text-xs">AI Assistant</span>
        </button>
        <button
          onClick={() => onNavigate('settings')}
          className="flex flex-col items-center gap-1 text-gray-400"
        >
          <SettingsIcon size={24} />
          <span className="text-xs">Settings</span>
        </button>
      </div>
    </div>
  );
}
