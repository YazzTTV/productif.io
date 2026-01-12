"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Pause, Play, X, Check, ArrowRight } from 'lucide-react'

interface Task {
  id: string
  title: string
  subject?: {
    name: string
    coefficient?: number
  } | null
  priority?: number | null
  completed: boolean
}

interface FocusSessionProps {
  duration: number // minutes
  taskId: string | null
  startTime: number // timestamp
  onComplete: (minutesFocused: number, tasksCompleted: string[], xpGained: number) => void
  onExit: () => void
}

export function FocusSession({
  duration,
  taskId: initialTaskId,
  startTime,
  onComplete,
  onExit,
}: FocusSessionProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration * 60)
  const [isRunning, setIsRunning] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [taskQueue, setTaskQueue] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<string[]>([])
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [isCompletingTask, setIsCompletingTask] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load initial task and queue
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const response = await fetch('/api/tasks/today', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          // API returns array directly or { today: [...] }
          const tasksList = Array.isArray(data) ? data : (data.today || [])
          const incompleteTasks = tasksList.filter((t: Task) => !t.completed)

          if (initialTaskId) {
            const task = incompleteTasks.find((t: Task) => t.id === initialTaskId)
            if (task) {
              setCurrentTask(task)
              setTaskQueue(incompleteTasks.filter((t: Task) => t.id !== initialTaskId))
            } else {
              // Task not found, use first available
              if (incompleteTasks.length > 0) {
                setCurrentTask(incompleteTasks[0])
                setTaskQueue(incompleteTasks.slice(1))
              }
            }
          } else {
            // No initial task, use first available
            if (incompleteTasks.length > 0) {
              setCurrentTask(incompleteTasks[0])
              setTaskQueue(incompleteTasks.slice(1))
            }
          }
        }
      } catch (error) {
        console.error('Error loading tasks:', error)
      }
    }

    loadTasks()
  }, [initialTaskId])

  // Calculate initial time remaining
  useEffect(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    const remaining = duration * 60 - elapsed
    setTimeRemaining(Math.max(0, remaining))
  }, [duration, startTime])

  // Timer logic
  useEffect(() => {
    if (isRunning && !isPaused && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSessionEnd()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, isPaused, timeRemaining])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !showExitConfirm) {
        e.preventDefault()
        setIsPaused((prev) => !prev)
      } else if (e.key === 'Enter' && !showExitConfirm && currentTask) {
        e.preventDefault()
        handleCompleteTask()
      } else if (e.key === 'n' && !showExitConfirm && taskQueue.length > 0) {
        e.preventDefault()
        handleSkipTask()
      } else if (e.key === 'Escape' && !showExitConfirm) {
        e.preventDefault()
        setShowExitConfirm(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showExitConfirm, currentTask, taskQueue.length])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSessionEnd = useCallback(() => {
    const elapsed = duration * 60 - timeRemaining
    const minutesFocused = Math.floor(elapsed / 60)
    const xpGained = Math.floor(minutesFocused * 0.5) // Simple XP calculation
    
    // Store summary data
    if (typeof window !== 'undefined') {
      localStorage.setItem('productif_focus_summary', JSON.stringify({
        minutesFocused,
        tasksCompleted: completedTasks.length,
        xpGained,
      }))
    }
    
    onComplete(minutesFocused, completedTasks, xpGained)
  }, [duration, timeRemaining, completedTasks, onComplete])

  const handleCompleteTask = async () => {
    if (!currentTask || isCompletingTask) return

    setIsCompletingTask(true)

    // Optimistically update UI
    setCompletedTasks((prev) => [...prev, currentTask.id])
    const nextTask = taskQueue[0]

    // Mark task as complete via API
    try {
      await fetch(`/api/tasks/${currentTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ completed: true }),
      })
    } catch (error) {
      console.error('Error completing task:', error)
      // Continue anyway - will retry later
    }

    // Move to next task
    if (nextTask) {
      setCurrentTask(nextTask)
      setTaskQueue((prev) => prev.slice(1))
    } else {
      setCurrentTask(null)
    }

    setIsCompletingTask(false)
  }

  const handleSkipTask = () => {
    if (taskQueue.length === 0) return

    const nextTask = taskQueue[0]
    setCurrentTask(nextTask)
    setTaskQueue((prev) => prev.slice(1))
  }

  const handleExit = () => {
    setShowExitConfirm(false)
    handleSessionEnd()
  }

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const progress = 1 - timeRemaining / (duration * 60)

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-[720px] w-full space-y-12"
      >
        {/* Timer */}
        <div className="text-center">
          <div className="relative w-64 h-64 mx-auto mb-8">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-black/5"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                className="text-[#16A34A]"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: progress }}
                transition={{ duration: 0.3 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-light tracking-tight text-black" style={{ letterSpacing: '-0.04em' }}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Current Task */}
        {currentTask ? (
          <motion.div
            key={currentTask.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-8 border border-black/5 rounded-3xl bg-white"
          >
            <div className="space-y-4">
              {currentTask.subject && (
                <div className="flex items-center gap-2 text-sm text-black/60">
                  <span>{currentTask.subject.name}</span>
                  {currentTask.subject.coefficient && currentTask.subject.coefficient > 2 && (
                    <span className="px-2 py-0.5 bg-[#16A34A]/10 text-[#16A34A] rounded-full text-xs">
                      High impact
                    </span>
                  )}
                </div>
              )}
              <h2 className="text-2xl font-light tracking-tight text-black" style={{ letterSpacing: '-0.03em' }}>
                {currentTask.title}
              </h2>
            </div>
          </motion.div>
        ) : (
          <div className="p-8 border border-black/5 rounded-3xl bg-white text-center text-black/60">
            <p>No next task</p>
          </div>
        )}

        {/* Next Task Hint */}
        {taskQueue.length > 0 && (
          <div className="text-center text-sm text-black/40">
            <p>Next: {taskQueue[0].title}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={() => setIsPaused((prev) => !prev)}
            variant="outline"
            className="w-16 h-16 rounded-full border-2 border-black/10 flex items-center justify-center"
          >
            {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
          </Button>

          {currentTask && (
            <Button
              onClick={handleCompleteTask}
              disabled={isCompletingTask}
              className="flex-1 bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 text-lg"
            >
              <Check className="w-5 h-5 mr-2" />
              Complete task
            </Button>
          )}

          {taskQueue.length > 0 && (
            <Button
              onClick={handleSkipTask}
              variant="outline"
              className="rounded-3xl h-16 px-6"
            >
              Skip
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}

          {!currentTask && taskQueue.length === 0 && (
            <Button
              onClick={handleSessionEnd}
              className="flex-1 bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 text-lg"
            >
              End session
            </Button>
          )}
        </div>

        {/* Exit Button */}
        <div className="text-center">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="text-sm text-black/40 hover:text-black/60 underline"
          >
            Back to Dashboard
          </button>
        </div>
      </motion.div>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowExitConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full space-y-6"
            >
              <h3 className="text-xl font-light tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                End session?
              </h3>
              <p className="text-black/60">
                Your progress will be saved, but the timer will stop.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleExit}
                  className="flex-1 bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-12"
                >
                  End session
                </Button>
                <Button
                  onClick={() => setShowExitConfirm(false)}
                  variant="outline"
                  className="flex-1 rounded-2xl h-12"
                >
                  Keep focusing
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

