"use client"

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface LeaderboardEnhancedProps {
  isPremium?: boolean;
}

type LeaderboardTab = 'friends' | 'class' | 'global';

interface LeaderboardUser {
  id: string;
  rank: number;
  name: string;
  avatar?: string;
  xp: number;
  maxXP: number;
  streak: number;
  focusSessions: number;
  isCurrentUser?: boolean;
}

interface LeaderboardData {
  friends: LeaderboardUser[];
  class: LeaderboardUser[];
  global: LeaderboardUser[];
  currentUser: LeaderboardUser & {
    rank: {
      friends?: number;
      class?: number;
      global?: number;
    };
  };
}

export function LeaderboardEnhanced({ isPremium = false }: LeaderboardEnhancedProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('class');
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  // Charger les données du leaderboard
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/leaderboard/data', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Erreur lors du chargement du leaderboard');
        }

        const result = await response.json();

        // Marquer l'utilisateur actuel dans chaque liste
        const markCurrentUser = (users: LeaderboardUser[], userId: string) => {
          return users.map(user => ({
            ...user,
            isCurrentUser: user.id === userId
          }));
        };

        const currentUserId = result.currentUser.id;

        setData({
          friends: markCurrentUser(result.friends || [], currentUserId),
          class: markCurrentUser(result.class || [], currentUserId),
          global: markCurrentUser(result.global || [], currentUserId),
          currentUser: {
            ...result.currentUser,
            isCurrentUser: true
          }
        });
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  const getCurrentData = (): LeaderboardUser[] => {
    if (!data) return [];
    switch (activeTab) {
      case 'friends': return data.friends;
      case 'class': return data.class;
      case 'global': return data.global;
      default: return data.class;
    }
  };

  const getCurrentUserRank = (): number | undefined => {
    if (!data) return undefined;
    switch (activeTab) {
      case 'friends': return data.currentUser.rank.friends;
      case 'class': return data.currentUser.rank.class;
      case 'global': return data.currentUser.rank.global;
      default: return data.currentUser.rank.class;
    }
  };

  const currentData = getCurrentData();
  const currentUserRank = getCurrentUserRank();
  const currentUser = data?.currentUser;

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#16A34A] mx-auto" />
          <p className="text-black/60">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-black/60">Unable to load leaderboard data.</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-black/5 px-6 pt-12 pb-6 z-10">
        <div className="mb-6">
          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
            Community
          </h1>
          <p className="text-black/60 mt-1">Others are showing up too.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-black/5 rounded-2xl">
          {(['friends', 'class', 'global'] as const).map((tab) => {
            const isLocked = !isPremium && tab === 'global';
            return (
              <motion.button
                key={tab}
                whileTap={{ scale: isLocked ? 1 : 0.95 }}
                onClick={() => {
                  if (isLocked) {
                    handleNavigate('/dashboard/upgrade');
                  } else {
                    setActiveTab(tab);
                  }
                }}
                className={`flex-1 py-3 px-4 rounded-xl transition-all relative ${
                  activeTab === tab
                    ? 'bg-white shadow-sm'
                    : 'text-black/60 hover:text-black'
                } ${isLocked ? 'opacity-50' : ''}`}
              >
                <span className="capitalize text-sm font-medium">
                  {tab === 'class' ? 'Class' : tab}
                </span>
                {isLocked && (
                  <Lock className="w-3 h-3 absolute top-1/2 -translate-y-1/2 right-2 text-black/40" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Your Position Card */}
      {currentUser && currentUserRank && (
        <div className="px-6 pt-8 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 border-2 border-[#16A34A]/20 bg-[#16A34A]/5 rounded-3xl"
          >
            <p className="text-black/40 mb-4 text-sm">Your position</p>
            <div className="flex items-center gap-4 mb-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-[#16A34A]/10 flex items-center justify-center text-xl font-medium text-[#16A34A]">
                {currentUser.name.charAt(0)}
              </div>

              {/* Stats */}
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl tracking-tight text-[#16A34A]" style={{ letterSpacing: '-0.03em' }}>
                    #{currentUserRank}
                  </span>
                  <span className="text-black/60">
                    {activeTab === 'friends' ? 'among friends' : 
                     activeTab === 'class' ? 'in your class' : 
                     'globally'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-black/60">
                  <span>{currentUser.streak}d streak</span>
                  <span>•</span>
                  <span>{currentUser.focusSessions} sessions</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(currentUser.xp / currentUser.maxXP) * 100}%` }}
                transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
                className="h-full bg-[#16A34A] rounded-full"
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-black/40">
              <span>{currentUser.xp.toLocaleString()} XP</span>
              <span>{currentUser.maxXP.toLocaleString()} XP</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Motivational Quote */}
      <div className="px-6 pb-6">
        <p className="text-black/40 text-center text-sm">
          You're aligned with this group. Keep showing up.
        </p>
      </div>

      {/* Invite CTA */}
      <div className="px-6 pb-6">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => handleNavigate('/dashboard/invite')}
          className="w-full p-6 border border-[#16A34A]/20 bg-[#16A34A]/5 rounded-3xl hover:bg-[#16A34A]/10 transition-all"
        >
          <div className="text-center space-y-2">
            <p className="text-black/60">Invite someone to stay consistent with you</p>
            <p className="font-medium text-[#16A34A]">Invite a friend →</p>
          </div>
        </motion.button>
      </div>

      {/* Leaderboard List */}
      <div className="px-6 space-y-3">
        {currentData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-black/60">
              {activeTab === 'friends' 
                ? 'No friends yet. Invite someone to get started!' 
                : activeTab === 'class'
                ? 'No group members yet. Join or create a group!'
                : 'No data available.'}
            </p>
          </div>
        ) : (
          currentData.map((user, index) => {
            if (user.isCurrentUser) return null; // Skip current user (shown above)

          const progressPercent = (user.xp / user.maxXP) * 100;

          return (
            <motion.button
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedUser(user)}
              className="w-full p-5 border border-black/5 rounded-3xl bg-white hover:bg-black/5 transition-all"
            >
              <div className="flex items-center gap-4 mb-3">
                {/* Rank */}
                <div className="w-8 text-left">
                  <span className="text-lg font-medium text-black/40">
                    {user.rank}
                  </span>
                </div>

                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center text-lg font-medium text-black/60">
                  {user.name.charAt(0)}
                </div>

                {/* User Info */}
                <div className="flex-1 text-left">
                  <p className="font-medium text-black mb-1">{user.name}</p>
                  <div className="flex items-center gap-3 text-sm text-black/60">
                    <span>{user.streak}d</span>
                    <span>•</span>
                    <span>{user.focusSessions} sessions</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ delay: 0.2 + index * 0.05, duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-black/10 rounded-full"
                />
              </div>
            </motion.button>
          );
        })
        )}
      </div>

      {/* Premium Upgrade Prompt (for Global tab) */}
      {!isPremium && activeTab === 'global' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: currentData.length * 0.05 + 0.2 }}
          className="px-6 pt-6"
        >
          <div className="p-8 border border-[#16A34A]/20 bg-[#16A34A]/5 rounded-3xl text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#16A34A]/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-[#16A34A]" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                Join the global leaderboard
              </h3>
              <p className="text-black/60">
                Compete with students worldwide and track long-term progress.
              </p>
            </div>

            <div className="space-y-3 text-left text-sm text-black/60">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                <p>Global rankings and insights</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                <p>Monthly and all-time views</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                <p>Advanced consistency metrics</p>
              </div>
            </div>

            <Button
              onClick={() => handleNavigate('/dashboard/upgrade')}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all active:scale-[0.98]"
            >
              Upgrade to Premium
            </Button>

            <p className="text-xs text-black/40">
              Continue tracking with friends and class for free
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
                <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center text-2xl font-medium text-black/60">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl tracking-tight mb-1" style={{ letterSpacing: '-0.03em' }}>
                    {selectedUser.name}
                  </h2>
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
                  <p className="text-black/40 mb-2">Weekly XP</p>
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
                    <p className="text-black/60">this week</p>
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

