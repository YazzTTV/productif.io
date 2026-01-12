"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Clock, CheckCircle2, Heart } from 'lucide-react'

export function Analytics() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('/api/dashboard/metrics', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error loading analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black/60">Loading analytics...</p>
      </div>
    )
  }

  return (
    <div className="space-y-12 pb-12">
      <div>
        <h1 className="tracking-tight mb-2" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
          Analytics
        </h1>
        <p className="text-black/60">Insights into your productivity patterns</p>
      </div>

      {/* Focus time trends */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-black/60" />
          <h2 className="text-lg font-medium">Focus time trends</h2>
        </div>
        <div className="border border-black/5 rounded-2xl p-8 bg-white">
          <div className="h-64 flex items-end justify-between gap-2">
            {[65, 72, 58, 80, 75, 68, 82].map((value, index) => (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: `${value}%` }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex-1 bg-[#16A34A] rounded-t-2xl min-h-[20px]"
              />
            ))}
          </div>
          <div className="flex justify-between mt-4 text-sm text-black/40">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
      </section>

      {/* Task completion */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-black/60" />
          <h2 className="text-lg font-medium">Task completion</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="border border-black/5 rounded-2xl p-6 bg-white">
            <p className="text-black/40 mb-2 text-sm">This week</p>
            <p className="text-3xl tracking-tight" style={{ letterSpacing: '-0.04em' }}>
              {stats?.tasksCompleted || 12}
            </p>
            <p className="text-black/60 text-sm mt-1">tasks</p>
          </div>
          <div className="border border-black/5 rounded-2xl p-6 bg-white">
            <p className="text-black/40 mb-2 text-sm">Completion rate</p>
            <p className="text-3xl tracking-tight" style={{ letterSpacing: '-0.04em' }}>
              {stats?.completionRate || 85}%
            </p>
          </div>
          <div className="border border-black/5 rounded-2xl p-6 bg-white">
            <p className="text-black/40 mb-2 text-sm">Avg. time</p>
            <p className="text-3xl tracking-tight" style={{ letterSpacing: '-0.04em' }}>
              {stats?.avgTaskTime || 45}
            </p>
            <p className="text-black/60 text-sm mt-1">min</p>
          </div>
        </div>
      </section>

      {/* Stress / mood correlation */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-black/60" />
          <h2 className="text-lg font-medium">Stress & mood correlation</h2>
        </div>
        <div className="border border-black/5 rounded-2xl p-8 bg-white">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-black/60">Stress level</span>
                <span className="text-sm text-black/60">Moderate</span>
              </div>
              <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
                <div className="h-full bg-black/20 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-black/60">Energy level</span>
                <span className="text-sm text-black/60">High</span>
              </div>
              <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#16A34A] rounded-full" style={{ width: '72%' }} />
              </div>
            </div>
          </div>
          <p className="text-sm text-black/40 mt-6 text-center">
            Higher energy correlates with better focus sessions
          </p>
        </div>
      </section>

      {/* Consistency over time */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-black/60" />
          <h2 className="text-lg font-medium">Consistency over time</h2>
        </div>
        <div className="border border-black/5 rounded-2xl p-8 bg-white">
          <div className="flex items-end justify-between gap-4">
            {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, index) => (
              <div key={week} className="flex-1 text-center">
                <div className="h-32 bg-black/5 rounded-t-2xl mb-3 flex items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${60 + index * 10}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="w-full bg-[#16A34A] rounded-t-2xl"
                  />
                </div>
                <p className="text-sm text-black/60">{week}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

