"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { ArrowLeft } from 'lucide-react'

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

interface FocusSetupProps {
  onStart: (duration: number, taskId: string | null) => void
  onExit: () => void
}

export function FocusSetup({ onStart, onExit }: FocusSetupProps) {
  const [duration, setDuration] = useState(45)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [skipTask, setSkipTask] = useState(false)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/tasks/today', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          // API returns array directly or { today: [...] }
          const tasksList = Array.isArray(data) ? data : (data.today || [])
          // Filter incomplete tasks and limit to 6
          const incompleteTasks = tasksList
            .filter((t: Task) => !t.completed)
            .slice(0, 6)
          setTasks(incompleteTasks)
        }
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [])

  const handleStart = () => {
    onStart(duration, skipTask ? null : selectedTaskId)
  }

  const getPriorityLabel = (priority: number | null | undefined) => {
    if (!priority) return null
    if (priority >= 3) return 'High impact'
    return null
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[720px] w-full space-y-12"
      >
        {/* Header */}
        <div className="space-y-4 text-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onExit}
            className="absolute top-6 left-6 w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-black/60" />
          </motion.button>

          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2.5rem', fontWeight: 300 }}>
            Start Focus
          </h1>
          <p className="text-black/60 text-lg">One task. Total focus.</p>
        </div>

        {/* Duration Slider */}
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-6xl font-light tracking-tight text-[#16A34A]" style={{ letterSpacing: '-0.04em' }}>
                {duration}
              </span>
              <span className="text-2xl text-black/60">min</span>
            </div>
          </div>

          <Slider
            value={[duration]}
            onValueChange={([value]) => setDuration(value)}
            min={10}
            max={180}
            step={5}
            className="py-6"
          />

          <div className="flex justify-around text-sm text-black/40">
            {[25, 45, 60, 90, 120].map((preset) => (
              <button
                key={preset}
                onClick={() => setDuration(preset)}
                className={`px-3 py-1 rounded-full transition-colors ${
                  duration === preset
                    ? 'bg-[#16A34A]/10 text-[#16A34A]'
                    : 'hover:bg-black/5 text-black/60'
                }`}
              >
                {preset} min
              </button>
            ))}
          </div>
        </div>

        {/* Task Picker */}
        <div className="space-y-4">
          <h2 className="text-black/60 text-sm uppercase tracking-wider">Choose a task</h2>

          {isLoading ? (
            <div className="text-center py-8 text-black/40">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-black/40">
              <p className="mb-4">No tasks available today</p>
              <button
                onClick={() => setSkipTask(true)}
                className="text-[#16A34A] hover:text-[#16A34A]/80 text-sm underline"
              >
                Focus without a task
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <motion.button
                  key={task.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    setSelectedTaskId(task.id)
                    setSkipTask(false)
                  }}
                  className={`w-full p-6 border rounded-3xl text-left transition-all ${
                    selectedTaskId === task.id && !skipTask
                      ? 'border-[#16A34A] bg-[#16A34A]/5'
                      : 'border-black/5 bg-white hover:border-black/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <p className="font-medium text-black">{task.title}</p>
                      {task.subject && (
                        <div className="flex items-center gap-2 text-sm text-black/60">
                          <span>{task.subject.name}</span>
                          {task.subject.coefficient && task.subject.coefficient > 2 && (
                            <span className="px-2 py-0.5 bg-[#16A34A]/10 text-[#16A34A] rounded-full text-xs">
                              High impact
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {selectedTaskId === task.id && !skipTask && (
                      <div className="w-5 h-5 rounded-full bg-[#16A34A] flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}

              <button
                onClick={() => {
                  setSkipTask(true)
                  setSelectedTaskId(null)
                }}
                className={`w-full p-4 border-2 border-dashed rounded-3xl text-center transition-all ${
                  skipTask
                    ? 'border-[#16A34A] bg-[#16A34A]/5 text-[#16A34A]'
                    : 'border-black/10 text-black/60 hover:border-black/20'
                }`}
              >
                Skip task (focus without a task)
              </button>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Button
            onClick={handleStart}
            disabled={!skipTask && !selectedTaskId && tasks.length > 0}
            className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 text-lg shadow-lg shadow-[#16A34A]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Start
          </Button>
          <Button
            onClick={onExit}
            variant="ghost"
            className="w-full text-black/60 hover:bg-black/5 rounded-3xl h-14"
          >
            Back to Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

