"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, 
  Plus, 
  UserPlus, 
  Share2, 
  Copy, 
  X,
  Trophy,
  Crown,
  Medal,
  Star,
  Flame,
  Target,
  Check
} from "lucide-react"

interface Group {
  id: string
  name: string
  description: string | null
  inviteCode: string
  createdAt: string
  createdBy: {
    id: string
    name: string | null
    email: string
  }
  memberCount: number
  isCreator: boolean
  joinedAt: string
}

interface LeaderboardEntry {
  userId: string
  userName: string
  userEmail: string
  points: number
  level: number
  currentStreak: number
  longestStreak: number
  rank: number
}

const LEVEL_COLORS = {
  1: 'text-gray-600',
  2: 'text-blue-600',
  3: 'text-green-600',
  4: 'text-purple-600',
  5: 'text-yellow-600',
} as const

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
          <Trophy className="h-5 w-5 text-white" />
        </div>
      )
    case 2:
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-lg">
          <Medal className="h-5 w-5 text-white" />
        </div>
      )
    case 3:
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
          <Medal className="h-5 w-5 text-white" />
        </div>
      )
    default:
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-600">#{rank}</span>
        </div>
      )
  }
}

export function LeaderboardGroups() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [groupLeaderboard, setGroupLeaderboard] = useState<LeaderboardEntry[]>([])
  const [groupUserRank, setGroupUserRank] = useState<number | undefined>()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // Form states
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [inviteEmails, setInviteEmails] = useState("")
  const [linkCopied, setLinkCopied] = useState(false)

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch("/api/gamification/groups")
      if (!response.ok) {
        throw new Error("Error loading groups")
      }
      
      const data = await response.json()
      setGroups(data.groups || [])
      
      // Get current user ID
      try {
        const userRes = await fetch("/api/auth/me")
        if (userRes.ok) {
          const user = await userRes.json()
          setCurrentUserId(user.id || null)
        }
      } catch (err) {
        console.error("Error fetching user:", err)
      }
    } catch (error) {
      console.error('Error loading groups:', error)
      setError("Unable to load groups")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchGroupLeaderboard = useCallback(async (groupId: string) => {
    try {
      const response = await fetch(`/api/gamification/groups/${groupId}/leaderboard`)
      if (!response.ok) {
        throw new Error("Error loading leaderboard")
      }
      
      const data = await response.json()
      setGroupLeaderboard(data.leaderboard || [])
      setGroupUserRank(data.userRank)
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    }
  }, [])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupLeaderboard(selectedGroup)
    }
  }, [selectedGroup, fetchGroupLeaderboard])

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return

    try {
      const response = await fetch("/api/gamification/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName.trim(),
          description: groupDescription.trim() || null
        })
      })

      if (!response.ok) {
        throw new Error("Error creating group")
      }

      const data = await response.json()
      setGroups(prev => [data.group, ...prev])
      setShowCreateModal(false)
      setGroupName("")
      setGroupDescription("")
    } catch (error) {
      console.error("Error creating group:", error)
      alert("Error creating group")
    }
  }

  const handleInvite = async (groupId: string) => {
    const emails = inviteEmails.split(',').map(e => e.trim()).filter(Boolean)
    if (emails.length === 0) return

    try {
      const response = await fetch(`/api/gamification/groups/${groupId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails })
      })

      if (!response.ok) {
        throw new Error("Error sending invitation")
      }

      setShowInviteModal(null)
      setInviteEmails("")
      alert("Invitations sent successfully!")
    } catch (error) {
      console.error("Error sending invitation:", error)
      alert("Error sending invitations")
    }
  }

  const copyInviteLink = (inviteCode: string) => {
    const link = `${window.location.origin}/dashboard/leaderboard?join=${inviteCode}`
    navigator.clipboard.writeText(link)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchGroups}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Retry
        </motion.button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Bouton créer un groupe */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowCreateModal(true)}
        className="w-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 font-medium"
      >
        <Plus className="h-5 w-5" />
        Create a Group
      </motion.button>

      {/* Groups list */}
      {groups.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 text-center">
          <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">You are not a member of any group</p>
          <p className="text-sm text-gray-400">Create a group to invite your friends and compare your performance!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-gray-800 text-lg font-semibold mb-1">{group.name}</h3>
                    {group.description && (
                      <p className="text-gray-500 text-sm mb-2">{group.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{group.memberCount} member{group.memberCount > 1 ? 's' : ''}</span>
                      </div>
                      {group.isCreator && (
                        <span className="px-2 py-0.5 bg-[#00C27A]/10 text-[#00C27A] rounded-full text-xs font-medium">
                          Creator
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedGroup(selectedGroup === group.id ? null : group.id)}
                    className="flex-1 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-2.5 rounded-xl text-sm font-medium"
                  >
                    {selectedGroup === group.id ? 'Hide Leaderboard' : 'View Leaderboard'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowInviteModal(group.id)}
                    className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    title="Invite friends"
                  >
                    <UserPlus className="h-5 w-5 text-gray-600" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => copyInviteLink(group.inviteCode)}
                    className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    title="Copy invitation link"
                  >
                    {linkCopied ? (
                      <Check className="h-5 w-5 text-[#00C27A]" />
                    ) : (
                      <Copy className="h-5 w-5 text-gray-600" />
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Leaderboard du groupe */}
              <AnimatePresence>
                {selectedGroup === group.id && groupLeaderboard.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-100 overflow-hidden"
                  >
                    <div className="p-6 space-y-3">
                      {groupUserRank && (
                        <div className="mb-4 p-4 bg-gradient-to-r from-[#00C27A]/20 via-[#00D68F]/20 to-[#00C27A]/20 border-2 border-[#00C27A] rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00C27A] to-[#00D68F] flex items-center justify-center">
                              <Target className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Your position</p>
                              <p className="text-lg font-bold text-[#00C27A]">#{groupUserRank}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {groupLeaderboard.map((entry, index) => {
                        const isUser = currentUserId ? entry.userId === currentUserId : false
                        const isTop3 = entry.rank <= 3
                        
                        return (
                          <motion.div
                            key={entry.userId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.02, y: -2 }}
                            className={`flex items-center gap-4 p-5 rounded-2xl transition-all ${
                              isUser
                                ? 'bg-gradient-to-r from-[#00C27A]/10 to-[#00D68F]/10 border-2 border-[#00C27A] shadow-md'
                                : isTop3
                                ? 'bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-300 shadow-lg' 
                                : 'bg-white hover:bg-gray-50 border border-gray-200 shadow-sm'
                            }`}
                          >
                            {getRankIcon(entry.rank)}
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <p className={`font-semibold text-base truncate ${
                                  isUser ? 'text-[#00C27A]' : 'text-gray-800'
                                }`}>
                                  {entry.userName}
                                </p>
                                {isUser && (
                                  <span className="px-2 py-0.5 bg-[#00C27A] text-white text-xs rounded-full font-medium">
                                    You
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-3 mb-2">
                                <Crown className={`h-4 w-4 ${LEVEL_COLORS[Math.min(entry.level, 5) as keyof typeof LEVEL_COLORS] || 'text-gray-600'}`} />
                                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                                  Lvl. {entry.level}
                                </span>
                              </div>
                            
                              <div className="flex items-center gap-4 text-xs text-gray-600">
                                <div className="flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-lg">
                                  <Star className="h-3.5 w-3.5 text-yellow-500" />
                                  <span className="font-medium">{entry.points.toLocaleString()} pts</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-lg">
                                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                                  <span className="font-medium">{entry.currentStreak}j</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-lg">
                                  <Trophy className="h-3.5 w-3.5 text-purple-500" />
                                  <span className="font-medium">{entry.longestStreak}j max</span>
                                </div>
                              </div>
                            </div>

                            <div className={`rounded-xl px-4 py-2 font-bold text-sm min-w-[60px] text-center ${
                              entry.rank <= 3
                                ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md'
                                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700'
                            }`}>
                              #{entry.rank}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal créer un groupe */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Create a Group</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Ex: Productivity Team"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C27A]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="Describe your group..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C27A]"
                  />
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim()}
                  className="w-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Group
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal inviter */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowInviteModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Invite Friends</h3>
                <button
                  onClick={() => setShowInviteModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emails (separated by commas)
                  </label>
                  <textarea
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    placeholder="email1@example.com, email2@example.com"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C27A]"
                  />
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleInvite(showInviteModal)}
                  disabled={!inviteEmails.trim()}
                  className="w-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Invitations
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

