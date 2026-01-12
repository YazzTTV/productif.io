"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FocusSetup } from './focus-setup'
import { FocusSession } from './focus-session'
import { FocusSummary } from './focus-summary'

type FocusPhase = 'setup' | 'active' | 'summary'

interface FocusSessionData {
  duration: number // minutes
  taskId: string | null
  startTime: number // timestamp
  sessionId: string | null
  completedTasks: string[]
}

const STORAGE_KEY = 'productif_focus_session'

export function FocusModeFlow() {
  const router = useRouter()
  const [phase, setPhase] = useState<FocusPhase>('setup')
  const [sessionData, setSessionData] = useState<FocusSessionData | null>(null)

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const data = JSON.parse(stored)
        const now = Date.now()
        const elapsed = Math.floor((now - data.startTime) / 1000)
        const remaining = (data.duration * 60) - elapsed

        // If session expired, clear it
        if (remaining <= 0) {
          localStorage.removeItem(STORAGE_KEY)
          return
        }

        // Restore active session
        setSessionData(data)
        setPhase('active')
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  const handleStart = async (duration: number, taskId: string | null) => {
    try {
      // Create Deep Work session via API
      const response = await fetch('/api/deepwork/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          plannedDuration: duration,
          type: 'focus',
          taskId: taskId || undefined,
        }),
      })

      let sessionId = null
      if (response.ok) {
        const result = await response.json()
        sessionId = result.session?.id || null
      }

      const data: FocusSessionData = {
        duration,
        taskId,
        startTime: Date.now(),
        sessionId,
        completedTasks: [],
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      setSessionData(data)
      setPhase('active')
    } catch (error) {
      console.error('Error starting session:', error)
      // Still start locally even if API fails
      const data: FocusSessionData = {
        duration,
        taskId,
        startTime: Date.now(),
        sessionId: null,
        completedTasks: [],
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      setSessionData(data)
      setPhase('active')
    }
  }

  const handleComplete = async (minutesFocused: number, tasksCompleted: string[], xpGained: number) => {
    // Clear session from localStorage
    localStorage.removeItem(STORAGE_KEY)

    // Complete session via API if sessionId exists
    if (sessionData?.sessionId) {
      try {
        const response = await fetch(`/api/deepwork/agent/${sessionData.sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action: 'complete' }),
        })
        if (!response.ok) {
          console.error('Failed to complete session via API')
        }
      } catch (error) {
        console.error('Error completing session:', error)
      }
    }

    // Emit XP event if API exists
    if (xpGained > 0) {
      try {
        await fetch('/api/xp/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            type: 'deepwork_complete',
            amount: xpGained,
            metadata: {
              minutesFocused,
              tasksCompleted: tasksCompleted.length,
            },
          }),
        })
      } catch (error) {
        // XP API might not exist, ignore
        console.log('XP event not sent (API may not exist)')
      }
    }

    setPhase('summary')
  }

  const handleExit = () => {
    router.push('/dashboard')
  }

  if (phase === 'setup') {
    return <FocusSetup onStart={handleStart} onExit={handleExit} />
  }

  if (phase === 'active' && sessionData) {
    return (
      <FocusSession
        duration={sessionData.duration}
        taskId={sessionData.taskId}
        startTime={sessionData.startTime}
        onComplete={handleComplete}
        onExit={handleExit}
      />
    )
  }

  if (phase === 'summary') {
    return <FocusSummary onBack={handleExit} />
  }

  return null
}

