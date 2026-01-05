import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, TrendingUp, X, Lock } from 'lucide-react';
import { Button } from './ui/button';

interface LeaderboardProps {
  onNavigate: (screen: string) => void;
  isPremium?: boolean;
}

type TimeRange = 'today' | 'week' | 'all-time';

interface LeaderboardUser {
  id: string;
  rank: number;
  name: string;
  avatar?: string;
  xp: number;
  streak: number;
  focusSessions: number;
  rankChange?: number; // positive = up, negative = down
  isCurrentUser?: boolean;
}

export function Leaderboard({ onNavigate, isPremium }: LeaderboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);

  // Mock data - This Week
  const weekData: LeaderboardUser[] = [
    { id: '1', rank: 1, name: 'Marie D.', xp: 2847, streak: 12, focusSessions: 18, rankChange: 2 },
    { id: '2', rank: 2, name: 'You', xp: 2654, streak: 9, focusSessions: 15, isCurrentUser: true, rankChange: 1 },
    { id: '3', rank: 3, name: 'Alex T.', xp: 2531, streak: 7, focusSessions: 14 },
    { id: '4', rank: 4, name: 'Emma R.', xp: 2408, streak: 11, focusSessions: 16, rankChange: -1 },
    { id: '5', rank: 5, name: 'Lucas M.', xp: 2287, streak: 5, focusSessions: 12 },
    { id: '6', rank: 6, name: 'Sofia K.', xp: 2156, streak: 14, focusSessions: 13, rankChange: 3 },
    { id: '7', rank: 7, name: 'Thomas B.', xp: 2089, streak: 6, focusSessions: 11 },
    { id: '8', rank: 8, name: 'Nina L.', xp: 1967, streak: 8, focusSessions: 10 },
  ];

  // Mock data - Today
  const todayData: LeaderboardUser[] = [
    { id: '1', rank: 1, name: 'Alex T.', xp: 480, streak: 7, focusSessions: 4 },
    { id: '2', rank: 2, name: 'You', xp: 425, streak: 9, focusSessions: 3, isCurrentUser: true },
    { id: '3', rank: 3, name: 'Marie D.', xp: 390, streak: 12, focusSessions: 3 },
    { id: '4', rank: 4, name: 'Sofia K.', xp: 365, streak: 14, focusSessions: 3 },
    { id: '5', rank: 5, name: 'Emma R.', xp: 310, streak: 11, focusSessions: 2 },
  ];

  // Mock data - All-Time
  const allTimeData: LeaderboardUser[] = [
    { id: '1', rank: 1, name: 'Marie D.', xp: 18547, streak: 45, focusSessions: 128 },
    { id: '2', rank: 2, name: 'Sofia K.', xp: 16892, streak: 52, focusSessions: 115 },
    { id: '3', rank: 3, name: 'You', xp: 15234, streak: 38, focusSessions: 102, isCurrentUser: true },
    { id: '4', rank: 4, name: 'Alex T.', xp: 14776, streak: 31, focusSessions: 98 },
    { id: '5', rank: 5, name: 'Emma R.', xp: 13908, streak: 42, focusSessions: 94 },
  ];

  const getCurrentData = () => {
    switch (timeRange) {
      case 'today': return todayData;
      case 'week': return weekData;
      case 'all-time': return allTimeData;
      default: return weekData;
    }
  };

  const data = getCurrentData();
  const currentUserRank = data.find(u => u.isCurrentUser)?.rank || 0;

  // Freemium: Show top 5 + current user (if not in top 5) + upgrade prompt
  const displayData = isPremium ? data : data.slice(0, 5);

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-black/5 px-6 pt-12 pb-6 z-10">
        <div className="flex items-center gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('dashboard')}
            className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex-1">
            <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
              Leaderboard
            </h1>
            <p className="text-black/60 mt-1">Consistency beats intensity.</p>
          </div>
        </div>

        {/* Time Range Tabs */}
        <div className="flex gap-2 p-1 bg-black/5 rounded-2xl">
          {(['today', 'week', 'all-time'] as const).map((range) => {
            const isLocked = !isPremium && range !== 'week';
            return (
              <motion.button
                key={range}
                whileTap={{ scale: isLocked ? 1 : 0.95 }}
                onClick={() => {
                  if (isLocked) {
                    onNavigate('paywall');
                  } else {
                    setTimeRange(range);
                  }
                }}
                className={`flex-1 py-3 px-4 rounded-xl transition-all relative ${
                  timeRange === range
                    ? 'bg-white shadow-sm'
                    : 'text-black/60 hover:text-black'
                } ${isLocked ? 'opacity-50' : ''}`}
              >
                <span className="capitalize text-sm font-medium">
                  {range === 'all-time' ? 'All-Time' : range}
                </span>
                {isLocked && (
                  <Lock className="w-3 h-3 absolute top-1/2 -translate-y-1/2 right-2 text-black/40" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="px-6 pt-8 pb-6">
        <div className="text-center space-y-2">
          <p className="text-black/60 text-lg" style={{ letterSpacing: '-0.02em' }}>
            You don't need to win.
          </p>
          <p className="text-black/60 text-lg" style={{ letterSpacing: '-0.02em' }}>
            You just need to show up.
          </p>
        </div>
      </div>

      {/* Ranking Methodology */}
      <div className="px-6 pb-6">
        <p className="text-black/40 text-center text-sm">
          Ranked by consistency, not volume.
        </p>
      </div>

      {/* Leaderboard List */}
      <div className="px-6 space-y-3">
        {displayData.map((user, index) => (
          <motion.button
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setSelectedUser(user)}
            className={`w-full p-5 border rounded-3xl transition-all ${
              user.isCurrentUser
                ? 'border-[#16A34A]/20 bg-[#16A34A]/5'
                : 'border-black/5 bg-white hover:bg-black/5'
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="w-8 text-left">
                <span className={`text-lg font-medium ${
                  user.isCurrentUser ? 'text-[#16A34A]' : 'text-black/40'
                }`}>
                  {user.rank}
                </span>
              </div>

              {/* Avatar */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium ${
                user.isCurrentUser
                  ? 'bg-[#16A34A]/10 text-[#16A34A]'
                  : 'bg-black/5 text-black/60'
              }`}>
                {user.name.charAt(0)}
              </div>

              {/* User Info */}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`font-medium ${
                    user.isCurrentUser ? 'text-[#16A34A]' : 'text-black'
                  }`}>
                    {user.name}
                  </p>
                  {user.isCurrentUser && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A]">
                      You
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-black/60">
                  <span>{user.streak}d streak</span>
                  <span>•</span>
                  <span>{user.focusSessions} sessions</span>
                </div>
              </div>

              {/* XP and Rank Change */}
              <div className="text-right space-y-1">
                <p className={`font-medium ${
                  user.isCurrentUser ? 'text-[#16A34A]' : 'text-black'
                }`}>
                  {user.xp.toLocaleString()} XP
                </p>
                {user.rankChange && (
                  <div className="flex items-center justify-end gap-1">
                    <TrendingUp className={`w-3 h-3 ${
                      user.rankChange > 0 ? 'text-[#16A34A] rotate-0' : 'text-black/40 rotate-180'
                    }`} />
                    <span className={`text-xs ${
                      user.rankChange > 0 ? 'text-[#16A34A]' : 'text-black/40'
                    }`}>
                      {Math.abs(user.rankChange)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Freemium Upgrade Prompt */}
      {!isPremium && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: displayData.length * 0.05 + 0.2 }}
          className="px-6 pt-6"
        >
          <div className="p-8 border border-[#16A34A]/20 bg-[#16A34A]/5 rounded-3xl text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#16A34A]/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-[#16A34A]" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                See full rankings
              </h3>
              <p className="text-black/60">
                Unlock complete leaderboard access with daily and all-time views.
              </p>
            </div>

            <div className="space-y-3 text-left text-sm text-black/60">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                <p>Access Today and All-Time leaderboards</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                <p>View detailed user profiles</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                <p>Track your rank across all time ranges</p>
              </div>
            </div>

            <Button
              onClick={() => onNavigate('paywall')}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98]"
            >
              Upgrade to Premium
            </Button>

            <p className="text-xs text-black/40">
              Continue tracking your progress for free
            </p>
          </div>
        </motion.div>
      )}

      {/* User Profile Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full bg-white rounded-t-3xl p-6 pb-12"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User header */}
              <div className="flex items-center gap-4 mb-8">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-medium ${
                  selectedUser.isCurrentUser
                    ? 'bg-[#16A34A]/10 text-[#16A34A]'
                    : 'bg-black/5 text-black/60'
                }`}>
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                      {selectedUser.name}
                    </h2>
                    {selectedUser.isCurrentUser && (
                      <span className="text-xs px-2 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A]">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-black/60">Rank #{selectedUser.rank}</p>
                </div>
              </div>

              {/* Stats grid */}
              <div className="space-y-3">
                <div className="p-6 border border-black/5 rounded-3xl bg-white">
                  <p className="text-black/40 mb-2">Current streak</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl tracking-tight" style={{ letterSpacing: '-0.04em' }}>
                      {selectedUser.streak}
                    </p>
                    <p className="text-black/60">days</p>
                  </div>
                </div>

                <div className="p-6 border border-black/5 rounded-3xl bg-white">
                  <p className="text-black/40 mb-2">
                    {timeRange === 'today' ? 'Today\'s XP' : 
                     timeRange === 'week' ? 'Weekly XP' : 
                     'Total XP'}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl tracking-tight" style={{ letterSpacing: '-0.04em' }}>
                      {selectedUser.xp.toLocaleString()}
                    </p>
                    <p className="text-black/60">XP</p>
                  </div>
                </div>

                <div className="p-6 border border-black/5 rounded-3xl bg-white">
                  <p className="text-black/40 mb-2">Focus sessions</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl tracking-tight" style={{ letterSpacing: '-0.04em' }}>
                      {selectedUser.focusSessions}
                    </p>
                    <p className="text-black/60">
                      {timeRange === 'today' ? 'today' : 
                       timeRange === 'week' ? 'this week' : 
                       'completed'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="mt-8 p-4 bg-black/5 rounded-2xl">
                <p className="text-sm text-black/60 text-center">
                  Stats are private. No messaging available.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}