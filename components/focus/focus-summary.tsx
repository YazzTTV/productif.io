"use client"

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FocusSummaryProps {
  onBack: () => void
  minutesFocused?: number
  tasksCompleted?: number
  xpGained?: number
}

export function FocusSummary({ onBack, minutesFocused = 0, tasksCompleted = 0, xpGained = 0 }: FocusSummaryProps) {
  const router = useRouter()

  // Get stats from session data if available
  const stats = typeof window !== 'undefined' ? (() => {
    try {
      const stored = localStorage.getItem('productif_focus_summary')
      if (stored) {
        const data = JSON.parse(stored)
        localStorage.removeItem('productif_focus_summary')
        return data
      }
    } catch (e) {
      // Ignore
    }
    return { minutesFocused, tasksCompleted, xpGained }
  })() : { minutesFocused, tasksCompleted, xpGained }

  const handlePlanNext = () => {
    router.push('/dashboard/assistant-ia')
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[720px] w-full space-y-12 text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-[#16A34A]/10 flex items-center justify-center mx-auto"
        >
          <CheckCircle2 className="w-10 h-10 text-[#16A34A]" />
        </motion.div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2.5rem', fontWeight: 300 }}>
            Session complete
          </h1>
        </div>

        {/* Stats */}
        <div className="space-y-6">
          <div className="space-y-1">
            <p className="text-4xl font-light tracking-tight text-black" style={{ letterSpacing: '-0.04em' }}>
              {stats.minutesFocused}
            </p>
            <p className="text-black/60">minutes focused</p>
          </div>

          {stats.tasksCompleted > 0 && (
            <div className="space-y-1">
              <p className="text-4xl font-light tracking-tight text-black" style={{ letterSpacing: '-0.04em' }}>
                {stats.tasksCompleted}
              </p>
              <p className="text-black/60">task{stats.tasksCompleted > 1 ? 's' : ''} completed</p>
            </div>
          )}

          {stats.xpGained > 0 && (
            <div className="space-y-1">
              <p className="text-4xl font-light tracking-tight text-[#16A34A]" style={{ letterSpacing: '-0.04em' }}>
                +{stats.xpGained}
              </p>
              <p className="text-black/60">XP gained</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handlePlanNext}
            className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 text-lg shadow-lg shadow-[#16A34A]/20"
          >
            Plan next focus
          </Button>
          <Button
            onClick={onBack}
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

