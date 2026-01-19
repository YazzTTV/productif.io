"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Focus, GraduationCap, BarChart3, Lock, Clock, CheckSquare, ListChecks, Heart } from 'lucide-react'
import Link from 'next/link'

interface WebDashboardProps {
  userName: string
  isPremium: boolean
}

export function WebDashboard({ userName, isPremium }: WebDashboardProps) {
  const router = useRouter()
  const [todayTasks, setTodayTasks] = useState<any[]>([])
  const [habits, setHabits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load today's tasks
        const tasksRes = await fetch('/api/dashboard/metrics', { credentials: 'include' })
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json()
          setTodayTasks(tasksData.todayTasks?.slice(0, 3) || [])
        }

        // Load habits
        const habitsRes = await fetch('/api/habits', { credentials: 'include' })
        if (habitsRes.ok) {
          const habitsData = await habitsRes.json()
          setHabits(habitsData.slice(0, 3) || [])
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Mock ideal day data (would come from Plan My Day or Calendar)
  const idealDayEvents = [
    { time: '09:00', title: 'Organic Chemistry - Chapter 12', type: 'deepwork' },
    { time: '11:30', title: 'Break', type: 'break' },
    { time: '14:00', title: 'Physics Review', type: 'deepwork' },
  ]

  return (
    <div className="space-y-12">
      {/* TOP SECTION */}
      <div className="space-y-6">
        <div>
          <p className="text-black/40 mb-1">Today</p>
          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
            {userName}'s ideal day
          </h1>
        </div>

        {/* Ideal day overview */}
        <div className="border border-black/5 rounded-3xl p-8 bg-white">
          <div className="space-y-4">
            {idealDayEvents.map((event, index) => (
              <div key={index} className="flex items-center gap-4">
                <span className="text-black/60 w-16 text-sm">{event.time}</span>
                <div className="flex-1">
                  <p className="text-black">{event.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most important tasks */}
        {todayTasks.length > 0 && (
          <div>
            <p className="text-black/60 mb-3">Most important</p>
            <div className="space-y-2">
              {todayTasks.map((task, index) => (
                <div
                  key={task.id || index}
                  className="p-4 border border-black/5 rounded-2xl bg-white flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <CheckSquare className="w-5 h-5 text-black/40" />
                    <span className="text-black">{task.title}</span>
                  </div>
                  {task.estimatedMinutes && (
                    <span className="text-black/40 text-sm">~{task.estimatedMinutes} min</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Primary CTAs */}
        <div className="flex gap-4">
          <Button
            onClick={() => router.push('/dashboard/focus')}
            className="flex-1 bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-14 text-lg"
          >
            <Focus className="w-5 h-5 mr-2" />
            Start Focus
          </Button>
          
          {isPremium ? (
            <Button
              onClick={() => router.push('/dashboard/exam')}
              variant="outline"
              className="flex-1 rounded-2xl h-14 text-lg border-black/10"
            >
              <GraduationCap className="w-5 h-5 mr-2" />
              Start Exam Mode
            </Button>
          ) : (
            <Button
              onClick={() => router.push('/dashboard/exam?preview=true')}
              variant="outline"
              className="flex-1 rounded-2xl h-14 text-lg border-black/10 relative"
            >
              <GraduationCap className="w-5 h-5 mr-2" />
              Exam Mode
              <Lock className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* MIDDLE SECTION */}
      <div className="space-y-6">
        {/* Leaderboard compact horizontal */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-black/60">Communauté</p>
            <Link href="/dashboard/leaderboard" className="text-sm text-[#16A34A] hover:underline">
              Voir tout →
            </Link>
          </div>
          <div className="border border-black/5 rounded-2xl p-6 bg-white">
            <div className="flex items-center gap-4 overflow-x-auto">
              {[1, 2, 3, 4, 5].map((rank) => (
                <div key={rank} className="flex-shrink-0 text-center">
                  <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mb-2 mx-auto">
                    <span className="text-sm font-medium text-black/60">{rank === 2 ? 'You' : String.fromCharCode(64 + rank)}</span>
                  </div>
                  <div className="w-16 h-2 bg-black/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#16A34A] rounded-full"
                      style={{ width: `${100 - (rank - 1) * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analytics button */}
        <div>
          {isPremium ? (
            <Link href="/dashboard/analytics">
              <div className="p-6 border border-black/5 rounded-2xl bg-white hover:bg-black/5 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-black/60" />
                    <span className="text-black">Analytics</span>
                  </div>
                  <span className="text-black/40 text-sm">View insights →</span>
                </div>
              </div>
            </Link>
          ) : (
            <Link href="/dashboard/analytics?preview=true">
              <div className="p-6 border border-black/5 rounded-2xl bg-white hover:bg-black/5 transition-colors cursor-pointer relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-black/60" />
                    <span className="text-black/60">Analytics</span>
                    <Lock className="w-4 h-4 text-black/40" />
                  </div>
                  <span className="text-black/40 text-sm">Preview →</span>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="grid grid-cols-2 gap-6">
        {/* Habits quick view */}
        <div>
          <p className="text-black/60 mb-3">Habitudes du jour</p>
          <div className="border border-black/5 rounded-2xl p-6 bg-white space-y-3">
            {habits.length > 0 ? (
              habits.map((habit, index) => (
                <div key={habit.id || index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-black/20" />
                  <span className="text-sm text-black">{habit.name}</span>
                </div>
              ))
            ) : (
              <p className="text-black/40 text-sm">Aucune habitude aujourd'hui</p>
            )}
            <Link href="/dashboard/habits" className="block text-sm text-[#16A34A] hover:underline mt-4">
              Gérer les habitudes →
            </Link>
          </div>
        </div>

        {/* Stress / mood quick check-in */}
        <div>
          <p className="text-black/60 mb-3">Comment vous sentez-vous ?</p>
          <div className="border border-black/5 rounded-2xl p-6 bg-white">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-black">Stress</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className="w-3 h-3 rounded-full bg-black/10"
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-black">Energy</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className="w-3 h-3 rounded-full bg-black/10"
                    />
                  ))}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/assistant-ia')}
              className="w-full mt-4 text-sm text-black/60 hover:text-black"
            >
              Check in →
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

