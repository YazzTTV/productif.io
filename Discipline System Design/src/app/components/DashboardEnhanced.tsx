import { Button } from './ui/button';
import { Home, Brain, Settings, Clock, GraduationCap, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { CommunityProgressCard } from './CommunityProgressCard';

interface DashboardEnhancedProps {
  userName: string;
  onNavigate: (screen: string) => void;
}

export function DashboardEnhanced({ userName, onNavigate }: DashboardEnhancedProps) {
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  const keyMoments = [
    { time: '09:00', label: 'Morning focus', type: 'focus', active: true },
    { time: '11:30', label: 'Break', type: 'break', active: false },
    { time: '14:00', label: 'Afternoon focus', type: 'focus', active: false },
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Greeting Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-12 pb-6"
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-black/40">{greeting}</p>
            <h1 className="tracking-tight mt-1" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
              {userName}
            </h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('settings')}
            className="w-12 h-12 rounded-2xl border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors shadow-sm"
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      <div className="px-6 space-y-6">
        {/* Today's Structure Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-black/60 mb-3">Today's structure</p>
          <div className="p-8 border-2 border-[#16A34A]/20 bg-gradient-to-br from-[#16A34A]/5 to-[#16A34A]/10 rounded-3xl shadow-lg shadow-[#16A34A]/5">
            <div className="space-y-6">
              {/* Main Focus Block */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#16A34A]">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">09:00 - 10:30</span>
                </div>
                <h3 className="text-2xl" style={{ letterSpacing: '-0.03em' }}>
                  Complete Chapter 12 Summary
                </h3>
                <p className="text-black/60">Organic Chemistry</p>
              </div>

              {/* Key Tasks */}
              <div className="space-y-2 pt-4 border-t border-black/10">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-black/40" />
                  <span className="text-black/70">Review lecture notes · 30 min</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-black/40" />
                  <span className="text-black/70">Practice problems 15-20 · 45 min</span>
                </div>
              </div>

              {/* Daily Habit */}
              <div className="pt-4 border-t border-black/10">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-[#16A34A] bg-[#16A34A]/10" />
                  <span className="text-black/70">Morning review</span>
                </div>
              </div>
            </div>

            {/* Primary CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <Button
                onClick={() => onNavigate('focus')}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-16 text-lg shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98]"
              >
                Start to Focus
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Key Moments Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-black/60 mb-3">Key moments today</p>
          <div className="space-y-3">
            {keyMoments.map((moment, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`relative pl-8 pb-6 ${
                  index !== keyMoments.length - 1 ? 'border-l-2' : ''
                } ${
                  moment.active ? 'border-[#16A34A]' : 'border-black/10'
                }`}
              >
                {/* Timeline dot */}
                <div
                  className={`absolute left-0 top-0 w-4 h-4 rounded-full -translate-x-[9px] ${
                    moment.active
                      ? 'bg-[#16A34A] ring-4 ring-[#16A34A]/20'
                      : 'bg-black/10'
                  }`}
                />
                
                {/* Content */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  moment.active
                    ? 'bg-white border-[#16A34A]/20 shadow-md'
                    : 'bg-black/5 border-transparent'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${moment.active ? 'text-[#16A34A]' : 'text-black/40'}`}>
                        {moment.time}
                      </p>
                      <p className={`mt-1 ${moment.active ? 'text-black' : 'text-black/60'}`}>
                        {moment.label}
                      </p>
                    </div>
                    {moment.type === 'focus' && moment.active && (
                      <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Community Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <CommunityProgressCard onNavigate={onNavigate} />
        </motion.div>

        {/* Microcopy */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-6"
        >
          <p className="text-black/40 italic">Everything else is handled.</p>
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-black/5 px-6 py-4 shadow-2xl"
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('dashboard')}
            className="flex flex-col items-center gap-1.5 text-[#16A34A]"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#16A34A]/10 flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Home</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('ai')}
            className="flex flex-col items-center gap-1.5 text-black/40 hover:text-black/70 transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <span className="text-xs">AI</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('leaderboard')}
            className="flex flex-col items-center gap-1.5 text-black/40 hover:text-black/70 transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs">Community</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}