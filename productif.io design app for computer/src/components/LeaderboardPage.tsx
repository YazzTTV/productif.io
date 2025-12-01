import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../App';
import { Home, Bot, Settings as SettingsIcon, ArrowLeft, Trophy, Users, Plus, Crown, TrendingUp, Zap, Target, Medal, UserPlus, Share2, X, Copy, Check, Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';

interface LeaderboardPageProps {
  onNavigate: (screen: Screen) => void;
}

type LeaderboardTab = 'global' | 'friends';

const globalLeaderboard = [
  { rank: 1, name: "You", score: 3847, avatar: "A", isUser: true, trend: "up", level: 42, streak: 42 },
  { rank: 2, name: "Sophie M.", score: 3654, avatar: "S", trend: "same", level: 38, streak: 35 },
  { rank: 3, name: "Lucas B.", score: 3521, avatar: "L", trend: "up", level: 36, streak: 28 },
  { rank: 4, name: "Emma K.", score: 3489, avatar: "E", trend: "down", level: 35, streak: 31 },
  { rank: 5, name: "Oliver T.", score: 3412, avatar: "O", trend: "up", level: 34, streak: 22 },
  { rank: 6, name: "Ava L.", score: 3387, avatar: "A", trend: "same", level: 33, streak: 27 },
  { rank: 7, name: "Noah P.", score: 3265, avatar: "N", trend: "up", level: 32, streak: 19 },
  { rank: 8, name: "Mia R.", score: 3198, avatar: "M", trend: "down", level: 31, streak: 25 },
  { rank: 9, name: "James W.", score: 3087, avatar: "J", trend: "up", level: 30, streak: 18 },
  { rank: 10, name: "Isabella H.", score: 2954, avatar: "I", trend: "same", level: 29, streak: 21 },
];

const friendGroups = [
  { 
    id: 1, 
    name: "Work Squad 💼", 
    members: 5, 
    yourRank: 1,
    topScorer: "You",
    totalScore: 15234,
    leaderboard: [
      { rank: 1, name: "You", score: 3847, avatar: "A", isUser: true, trend: "up", level: 42 },
      { rank: 2, name: "Sarah J.", score: 3542, avatar: "S", trend: "up", level: 38 },
      { rank: 3, name: "Mike D.", score: 3198, avatar: "M", trend: "same", level: 35 },
      { rank: 4, name: "Lisa K.", score: 2876, avatar: "L", trend: "down", level: 32 },
      { rank: 5, name: "Tom R.", score: 1771, avatar: "T", trend: "up", level: 28 },
    ]
  },
  { 
    id: 2, 
    name: "Fitness Crew 💪", 
    members: 8, 
    yourRank: 3,
    topScorer: "Alex M.",
    totalScore: 24567,
    leaderboard: [
      { rank: 1, name: "Alex M.", score: 4102, avatar: "A", trend: "up", level: 45 },
      { rank: 2, name: "Jordan K.", score: 3921, avatar: "J", trend: "up", level: 43 },
      { rank: 3, name: "You", score: 3847, avatar: "A", isUser: true, trend: "up", level: 42 },
      { rank: 4, name: "Sam L.", score: 3654, avatar: "S", trend: "same", level: 40 },
      { rank: 5, name: "Casey P.", score: 3421, avatar: "C", trend: "down", level: 38 },
    ]
  },
  { 
    id: 3, 
    name: "Study Buddies 📚", 
    members: 4, 
    yourRank: 2,
    topScorer: "Emma T.",
    totalScore: 12876,
    leaderboard: [
      { rank: 1, name: "Emma T.", score: 3998, avatar: "E", trend: "up", level: 44 },
      { rank: 2, name: "You", score: 3847, avatar: "A", isUser: true, trend: "up", level: 42 },
      { rank: 3, name: "David L.", score: 3187, avatar: "D", trend: "same", level: 36 },
      { rank: 4, name: "Rachel M.", score: 1844, avatar: "R", trend: "up", level: 29 },
    ]
  },
];

export function LeaderboardPage({ onNavigate }: LeaderboardPageProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('global');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [groupName, setGroupName] = useState('');
  const [shareGroupId, setShareGroupId] = useState<number | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-500';
    if (rank === 2) return 'from-gray-300 to-gray-400';
    if (rank === 3) return 'from-amber-600 to-amber-700';
    return 'from-gray-200 to-gray-300';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={16} className="text-white" />;
    if (rank === 2) return <Medal size={16} className="text-white" />;
    if (rank === 3) return <Medal size={16} className="text-white" />;
    return null;
  };

  return (
    <div className="min-h-[844px] bg-gradient-to-br from-gray-50 to-white pb-24 pt-16 px-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => onNavigate('dashboard')}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-gray-800">Leaderboard</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 mb-4">
          <motion.button
            onClick={() => setActiveTab('global')}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'global'
                ? 'bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            <Trophy size={18} />
            <span>Global</span>
          </motion.button>
          <motion.button
            onClick={() => setActiveTab('friends')}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'friends'
                ? 'bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            <Users size={18} />
            <span>Groups</span>
          </motion.button>
        </div>
      </div>

      {/* Global Leaderboard */}
      {activeTab === 'global' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {/* Your Rank Card */}
          <div className="bg-gradient-to-r from-[#00C27A] to-[#00D68F] rounded-3xl p-5 mb-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm mb-1">Your Global Rank</p>
                <div className="flex items-center gap-3">
                  <p className="text-4xl">#1</p>
                  <div>
                    <p className="text-sm">3,847 pts</p>
                    <div className="flex items-center gap-1 text-xs text-white/80">
                      <TrendingUp size={12} />
                      <span>+124 today</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Crown size={32} className="text-white" />
              </div>
            </div>
          </div>

          {/* Top 3 Podium */}
          <div className="mb-6">
            <div className="flex items-end justify-center gap-2 mb-6">
              {/* 2nd Place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex-1 text-center"
              >
                <div className="relative mb-2">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                    S
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">2</span>
                  </div>
                </div>
                <p className="text-gray-800 text-sm mb-1">Sophie M.</p>
                <p className="text-gray-500 text-xs">3,654 pts</p>
                <div className="mt-2 h-20 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-xl"></div>
              </motion.div>

              {/* 1st Place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex-1 text-center"
              >
                <div className="relative mb-2">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-white text-2xl shadow-xl"
                  >
                    A
                  </motion.div>
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full">
                    <Crown size={24} className="text-yellow-500" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white">1</span>
                  </div>
                </div>
                <p className="text-[#00C27A]">You</p>
                <p className="text-gray-500 text-xs">3,847 pts</p>
                <div className="mt-2 h-28 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-xl"></div>
              </motion.div>

              {/* 3rd Place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex-1 text-center"
              >
                <div className="relative mb-2">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                    L
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">3</span>
                  </div>
                </div>
                <p className="text-gray-800 text-sm mb-1">Lucas B.</p>
                <p className="text-gray-500 text-xs">3,521 pts</p>
                <div className="mt-2 h-16 bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-xl"></div>
              </motion.div>
            </div>
          </div>

          {/* Full Leaderboard List */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {globalLeaderboard.slice(3).map((user, index) => (
              <motion.div
                key={user.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className={`flex items-center justify-between p-4 border-b border-gray-50 last:border-b-0 ${
                  user.isUser ? 'bg-[#00C27A]/5' : ''
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-gray-400 w-6">{user.rank}</span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${getRankColor(user.rank)}`}>
                    <span className="text-white">{user.avatar}</span>
                  </div>
                  <div className="flex-1">
                    <p className={`${user.isUser ? 'text-[#00C27A]' : 'text-gray-800'}`}>
                      {user.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Lvl {user.level}</span>
                      <span>•</span>
                      <span>{user.streak}🔥</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {user.trend === 'up' ? (
                    <TrendingUp size={16} className="text-green-500" />
                  ) : user.trend === 'same' ? (
                    <div className="w-4 h-0.5 bg-gray-400 rounded"></div>
                  ) : (
                    <TrendingUp size={16} className="text-red-400 transform rotate-180" />
                  )}
                  <span className="text-gray-800">{user.score}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Friend Groups */}
      {activeTab === 'friends' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {/* Create Group Button */}
          <motion.button
            onClick={() => setShowCreateGroup(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-2xl p-4 mb-6 shadow-lg flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            <span>Create New Group</span>
          </motion.button>

          {/* Groups List */}
          <div className="space-y-4">
            {friendGroups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-gray-800 mb-1">{group.name}</h3>
                      <p className="text-gray-500 text-sm">{group.members} members</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[#00C27A] text-xl">#{group.yourRank}</div>
                      <p className="text-gray-500 text-xs">Your rank</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => setSelectedGroup(selectedGroup === group.id ? null : group.id)}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-2 rounded-xl text-sm"
                    >
                      {selectedGroup === group.id ? 'Hide Leaderboard' : 'View Leaderboard'}
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setShareGroupId(group.id);
                        setLinkCopied(false);
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gray-100 p-2 rounded-xl"
                    >
                      <Share2 size={18} className="text-gray-600" />
                    </motion.button>
                  </div>
                </div>

                <AnimatePresence>
                  {selectedGroup === group.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-3">
                        {group.leaderboard.map((user, userIndex) => (
                          <div
                            key={user.rank}
                            className={`flex items-center justify-between p-3 rounded-xl ${
                              user.isUser ? 'bg-[#00C27A]/5' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-6 text-center ${user.rank <= 3 ? 'text-[#00C27A]' : 'text-gray-400'}`}>
                                {user.rank}
                              </span>
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${getRankColor(user.rank)}`}>
                                {getRankIcon(user.rank) || <span className="text-white">{user.avatar}</span>}
                              </div>
                              <div>
                                <p className={`text-sm ${user.isUser ? 'text-[#00C27A]' : 'text-gray-800'}`}>
                                  {user.name}
                                </p>
                                <p className="text-xs text-gray-500">Level {user.level}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-gray-800">{user.score}</p>
                              {user.trend === 'up' && (
                                <TrendingUp size={14} className="text-green-500 ml-auto" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 bg-gray-50 border-t border-gray-100">
                        <motion.button
                          onClick={() => setShowShareModal(true)}
                          whileTap={{ scale: 0.95 }}
                          className="w-full flex items-center justify-center gap-2 py-2 text-[#00C27A] text-sm"
                        >
                          <UserPlus size={16} />
                          <span>Invite Friends</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateGroup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateGroup(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-3xl p-6 shadow-2xl z-50"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-gray-800 text-xl">Create Group</h2>
                <button
                  onClick={() => setShowCreateGroup(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <X size={18} className="text-gray-600" />
                </button>
              </div>

              <div className="mb-6">
                <label className="text-gray-700 text-sm mb-2 block">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Study Squad, Gym Rats, etc."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C27A]/20 focus:border-[#00C27A]"
                />
              </div>

              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-3">Select an emoji:</p>
                <div className="grid grid-cols-6 gap-2">
                  {['💼', '💪', '📚', '🎯', '⚡', '🔥', '🎮', '🏃', '🧘', '🎨', '🎵', '🌟'].map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileTap={{ scale: 0.9 }}
                      className="w-full aspect-square bg-gray-50 rounded-xl flex items-center justify-center text-2xl hover:bg-gray-100 transition-colors"
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowCreateGroup(false);
                  setGroupName('');
                }}
                className="w-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-3 rounded-xl"
              >
                Create Group
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Share Group Modal */}
      <AnimatePresence>
        {shareGroupId !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShareGroupId(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-3xl p-6 shadow-2xl z-50"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-gray-800 text-xl">Share Group</h2>
                <button
                  onClick={() => setShareGroupId(null)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <X size={18} className="text-gray-600" />
                </button>
              </div>

              <div className="mb-6">
                <label className="text-gray-700 text-sm mb-2 block">Group Link</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={`https://example.com/groups/${shareGroupId}`}
                    readOnly
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C27A]/20 focus:border-[#00C27A]"
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      navigator.clipboard.writeText(`https://example.com/groups/${shareGroupId}`);
                      setLinkCopied(true);
                    }}
                    className="bg-gray-100 p-2 rounded-xl"
                  >
                    {linkCopied ? <Check size={18} className="text-gray-600" /> : <Copy size={18} className="text-gray-600" />}
                  </motion.button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShareGroupId(null)}
                className="w-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-3 rounded-xl"
              >
                Close
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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