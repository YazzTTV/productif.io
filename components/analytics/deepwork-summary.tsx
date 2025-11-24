"use client"

import { motion } from "framer-motion"
import { Clock, Activity, Timer } from "lucide-react"

interface DeepWorkSummaryProps {
  weekHours: number
  allTimeHours: number
  sessionsThisWeek: number
  avgSessionMinutes?: number
}

export function DeepWorkSummary({ weekHours, allTimeHours, sessionsThisWeek, avgSessionMinutes }: DeepWorkSummaryProps) {
  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    return `${wholeHours}h ${minutes}m`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Deep Work 7 jours - Gradient cyan/blue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden"
      >
        <Clock size={28} className="mb-3 opacity-90" />
        <p className="text-white/80 mb-2 text-sm">Deep Work (7 jours)</p>
        <div className="flex items-baseline gap-2 mb-1">
          <p className="text-4xl">{formatHours(weekHours)}</p>
        </div>
        <p className="text-white/70 text-sm">Temps total sur 7 jours</p>
      </motion.div>

      {/* Sessions 7 jours - Blanc */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
      >
        <Activity size={28} className="text-[#00C27A] mb-3" />
        <p className="text-gray-600 mb-2 text-sm">Sessions (7 jours)</p>
        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-gray-800 text-4xl">{sessionsThisWeek}</p>
        </div>
        <p className="text-[#00C27A] text-sm">Sessions terminées</p>
      </motion.div>

      {/* Deep Work Total - Gradient vert */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-3xl p-6 shadow-xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <div className="relative z-10">
          <Timer size={28} className="mb-3 opacity-90" />
          <p className="text-white/80 mb-2 text-sm">Deep Work (Total)</p>
          <div className="flex items-baseline gap-2 mb-1">
            <p className="text-4xl">{formatHours(allTimeHours)}</p>
          </div>
          <p className="text-white/70 text-sm">
            {typeof avgSessionMinutes === 'number' ? `~${Math.round(avgSessionMinutes)} min/séance` : 'Total cumulé'}
          </p>
        </div>
      </motion.div>
    </div>
  )
}


