"use client"

import { useState, useEffect, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Leaderboard } from "@/components/gamification/leaderboard"
import { LeaderboardGroups } from "@/components/gamification/leaderboard-groups"
import { BackToDashboardButton } from "@/components/analytics/back-to-dashboard-button"
import { Trophy, Users } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

type LeaderboardTab = 'global' | 'groups'

function LeaderboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('global')

  const handleJoinGroup = async (inviteCode: string) => {
    try {
      const response = await fetch("/api/gamification/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`You joined the group "${data.group.name}"!`)
        setActiveTab('groups')
        router.replace('/dashboard/leaderboard')
      } else {
        const error = await response.json()
        alert(error.error || "Error joining the group")
      }
    } catch (error) {
      console.error("Error joining the group:", error)
      alert("Error joining the group")
    }
  }

  useEffect(() => {
    // Check if we need to join a group via invitation code
    const joinCode = searchParams.get('join')
    if (joinCode) {
      handleJoinGroup(joinCode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-800 text-3xl mb-2">Leaderboard</h1>
              <p className="text-gray-600 text-lg">
                Discover the top performers and compare your progress with the community
              </p>
            </div>
            <BackToDashboardButton />
          </div>

          {/* Tabs */}
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('global')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'global'
                  ? 'bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white shadow-lg'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Trophy className="h-5 w-5" />
              <span>Global</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('groups')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'groups'
                  ? 'bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white shadow-lg'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Users className="h-5 w-5" />
              <span>My Groups</span>
            </motion.button>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'global' ? (
              <motion.div
                key="global"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Leaderboard limit={100} showUserRank={true} />
              </motion.div>
            ) : (
              <motion.div
                key="groups"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <LeaderboardGroups />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    }>
      <LeaderboardContent />
    </Suspense>
  )
} 