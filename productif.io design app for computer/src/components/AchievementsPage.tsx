import { motion } from 'motion/react';
import { Screen } from '../App';
import { ArrowLeft, Award, Target, Zap, Flame, TrendingUp, Star, Crown, Lock, Sparkles, Trophy, Clock, CheckCircle2, Activity, Brain, Heart, Rocket } from 'lucide-react';
import { useState } from 'react';

interface AchievementsPageProps {
  onNavigate: (screen: Screen) => void;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: string;
  category: 'productivity' | 'streaks' | 'goals' | 'elite' | 'social';
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  unlockedDate?: string;
  xp: number;
}

const achievements: Achievement[] = [
  // Unlocked Achievements
  {
    id: '1',
    title: 'Productivity Legend',
    description: '42-day streak maintained',
    icon: '🔥',
    gradient: 'from-amber-400 to-orange-500',
    category: 'streaks',
    unlocked: true,
    unlockedDate: '2 days ago',
    xp: 500,
  },
  {
    id: '2',
    title: 'Goal Crusher',
    description: 'Completed 100+ tasks',
    icon: '🎯',
    gradient: 'from-purple-400 to-pink-500',
    category: 'goals',
    unlocked: true,
    unlockedDate: '5 days ago',
    xp: 350,
  },
  {
    id: '3',
    title: 'Distraction Slayer',
    description: 'Avoided 500+ distractions',
    icon: '⚡',
    gradient: 'from-cyan-400 to-blue-500',
    category: 'productivity',
    unlocked: true,
    unlockedDate: '1 week ago',
    xp: 400,
  },
  {
    id: '4',
    title: 'Top 1% Elite',
    description: 'Score above 90 for 7 days',
    icon: '🌟',
    gradient: 'from-green-400 to-emerald-500',
    category: 'elite',
    unlocked: true,
    unlockedDate: '3 days ago',
    xp: 750,
  },
  {
    id: '5',
    title: 'Early Bird',
    description: 'Start work before 7am for 5 days',
    icon: '🌅',
    gradient: 'from-yellow-400 to-amber-500',
    category: 'productivity',
    unlocked: true,
    unlockedDate: '2 weeks ago',
    xp: 200,
  },
  {
    id: '6',
    title: 'Marathon Runner',
    description: 'Focus for 8+ hours in a day',
    icon: '🏃',
    gradient: 'from-red-400 to-pink-500',
    category: 'productivity',
    unlocked: true,
    unlockedDate: '4 days ago',
    xp: 300,
  },
  
  // Locked Achievements (In Progress)
  {
    id: '7',
    title: 'Century Club',
    description: 'Maintain 100-day streak',
    icon: '💯',
    gradient: 'from-indigo-400 to-purple-500',
    category: 'streaks',
    unlocked: false,
    progress: 42,
    maxProgress: 100,
    xp: 1000,
  },
  {
    id: '8',
    title: 'Social Butterfly',
    description: 'Connect with 10 friends',
    icon: '🦋',
    gradient: 'from-pink-400 to-rose-500',
    category: 'social',
    unlocked: false,
    progress: 6,
    maxProgress: 10,
    xp: 250,
  },
  {
    id: '9',
    title: 'Zen Master',
    description: 'Complete 30 meditation sessions',
    icon: '🧘',
    gradient: 'from-teal-400 to-cyan-500',
    category: 'productivity',
    unlocked: false,
    progress: 18,
    maxProgress: 30,
    xp: 400,
  },
  {
    id: '10',
    title: 'Task Terminator',
    description: 'Complete 500 total tasks',
    icon: '🎯',
    gradient: 'from-orange-400 to-red-500',
    category: 'goals',
    unlocked: false,
    progress: 324,
    maxProgress: 500,
    xp: 600,
  },
  {
    id: '11',
    title: 'Perfect Week',
    description: '100% daily goals for 7 consecutive days',
    icon: '✨',
    gradient: 'from-violet-400 to-purple-500',
    category: 'goals',
    unlocked: false,
    progress: 4,
    maxProgress: 7,
    xp: 500,
  },
  {
    id: '12',
    title: 'Night Owl',
    description: 'Complete 20 late-night sessions',
    icon: '🦉',
    gradient: 'from-blue-400 to-indigo-500',
    category: 'productivity',
    unlocked: false,
    progress: 12,
    maxProgress: 20,
    xp: 250,
  },
  {
    id: '13',
    title: 'Productivity God',
    description: 'Reach 99+ productivity score',
    icon: '⚡',
    gradient: 'from-yellow-400 to-orange-500',
    category: 'elite',
    unlocked: false,
    progress: 94,
    maxProgress: 99,
    xp: 1500,
  },
  {
    id: '14',
    title: 'Team Player',
    description: 'Help 5 friends improve their score',
    icon: '🤝',
    gradient: 'from-green-400 to-teal-500',
    category: 'social',
    unlocked: false,
    progress: 2,
    maxProgress: 5,
    xp: 350,
  },
  {
    id: '15',
    title: 'Speed Demon',
    description: 'Complete 50 tasks in one day',
    icon: '⚡',
    gradient: 'from-red-400 to-orange-500',
    category: 'goals',
    unlocked: false,
    progress: 24,
    maxProgress: 50,
    xp: 450,
  },
  {
    id: '16',
    title: 'Legendary Champion',
    description: 'Reach #1 on global leaderboard',
    icon: '👑',
    gradient: 'from-yellow-400 to-amber-600',
    category: 'elite',
    unlocked: false,
    progress: 1,
    maxProgress: 1,
    xp: 2000,
  },
];

const categories = [
  { id: 'all', label: 'All', icon: Trophy },
  { id: 'productivity', label: 'Productivity', icon: Zap },
  { id: 'streaks', label: 'Streaks', icon: Flame },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'elite', label: 'Elite', icon: Crown },
  { id: 'social', label: 'Social', icon: Star },
];

export function AchievementsPage({ onNavigate }: AchievementsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const totalXP = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xp, 0);

  return (
    <div className="min-h-[844px] bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00C27A] to-[#00D68F] pt-12 pb-8 px-6 relative overflow-hidden">
        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(10)].map((_, i) => (
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
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Trophy size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-white mb-1">Achievements</h1>
              <p className="text-white/80 text-sm">Unlock your potential</p>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center"
            >
              <p className="text-white/70 text-xs mb-1">Unlocked</p>
              <p className="text-white text-xl">{unlockedCount}/{totalCount}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center"
            >
              <p className="text-white/70 text-xs mb-1">Total XP</p>
              <p className="text-white text-xl">{totalXP.toLocaleString()}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center"
            >
              <p className="text-white/70 text-xs mb-1">Completion</p>
              <p className="text-white text-xl">{Math.round((unlockedCount / totalCount) * 100)}%</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-6 -mt-4 mb-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl p-2 shadow-lg flex gap-2 overflow-x-auto"
        >
          {categories.map((cat, index) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm">{cat.label}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Achievements Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-24">
        <div className="grid grid-cols-1 gap-3">
          {filteredAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              whileHover={{ scale: achievement.unlocked ? 1.02 : 1 }}
              className={`rounded-2xl p-4 shadow-md relative overflow-hidden ${
                achievement.unlocked
                  ? `bg-gradient-to-br ${achievement.gradient} text-white`
                  : 'bg-white border-2 border-gray-200'
              }`}
            >
              {/* Background Animation for Unlocked */}
              {achievement.unlocked && (
                <motion.div
                  className="absolute top-0 right-0 text-7xl opacity-10"
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  {achievement.icon}
                </motion.div>
              )}

              <div className="relative z-10 flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    achievement.unlocked
                      ? 'bg-white/20 backdrop-blur-sm'
                      : 'bg-gray-100 relative'
                  }`}
                >
                  {achievement.unlocked ? (
                    <span className="text-3xl">{achievement.icon}</span>
                  ) : (
                    <>
                      <span className="text-3xl opacity-20">{achievement.icon}</span>
                      <Lock size={16} className="absolute text-gray-400" />
                    </>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3
                      className={`${
                        achievement.unlocked ? 'text-white' : 'text-gray-800'
                      }`}
                    >
                      {achievement.title}
                    </h3>
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${
                        achievement.unlocked
                          ? 'bg-white/20'
                          : 'bg-[#00C27A]/10 text-[#00C27A]'
                      }`}
                    >
                      <Sparkles size={12} />
                      <span>{achievement.xp} XP</span>
                    </div>
                  </div>

                  <p
                    className={`text-sm mb-2 ${
                      achievement.unlocked ? 'text-white/80' : 'text-gray-600'
                    }`}
                  >
                    {achievement.description}
                  </p>

                  {/* Progress Bar for Locked */}
                  {!achievement.unlocked && achievement.progress !== undefined && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Progress</span>
                        <span className="text-xs text-[#00C27A]">
                          {achievement.progress}/{achievement.maxProgress}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] rounded-full"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(achievement.progress / (achievement.maxProgress || 1)) * 100}%`,
                          }}
                          transition={{ duration: 1, delay: 0.5 + index * 0.05 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Unlocked Badge */}
                  {achievement.unlocked && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
                        <CheckCircle2 size={12} />
                        <span className="text-xs">Unlocked</span>
                      </div>
                      <span className="text-xs text-white/70">
                        {achievement.unlockedDate}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500">No achievements in this category yet</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
