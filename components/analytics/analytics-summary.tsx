"use client"

import { motion } from "framer-motion"
import { Clock, FolderKanban, ListTodo, CheckCircle } from "lucide-react"
import { useLocale } from "@/lib/i18n"

interface AnalyticsSummaryProps {
  stats: {
    totalTimeTracked: number
    totalProjects: number
    activeProjects?: number
    totalTasks: number
    completedTasks: number
    completionRate: number
  }
}

export function AnalyticsSummary({ stats }: AnalyticsSummaryProps) {
  const { t } = useLocale()
  // Formater le temps total (format: XXh XXm)
  const formatTotalTime = (hours: number) => {
    // Le temps est déjà en heures, pas en secondes
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)

    return `${wholeHours}h ${minutes}m`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Temps total suivi - Gradient vert */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-3xl p-6 shadow-xl text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <div className="relative z-10">
          <Clock size={28} className="mb-3 opacity-90" />
          <p className="text-white/80 mb-2 text-sm">{t('totalTimeTracked')}</p>
          <div className="flex items-baseline gap-2 mb-1">
            <p className="text-4xl">{formatTotalTime(stats.totalTimeTracked)}</p>
          </div>
          <p className="text-white/70 text-sm">{t('totalTimeRecorded')}</p>
        </div>
      </motion.div>

      {/* Projets - Blanc */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
      >
        <FolderKanban size={28} className="text-[#00C27A] mb-3" />
        <p className="text-gray-600 mb-2 text-sm">{t('projects')}</p>
        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-gray-800 text-4xl">{stats.totalProjects}</p>
        </div>
        <p className="text-[#00C27A] text-sm">
          {stats.activeProjects !== undefined ? 
           `${stats.activeProjects} ${stats.activeProjects > 1 ? t('activePlural') : t('active')}` : 
           t('projectsCreated')}
        </p>
      </motion.div>

      {/* Tâches - Gradient orange/rose */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden"
      >
        <ListTodo size={28} className="mb-3 opacity-90" />
        <p className="text-white/80 mb-2 text-sm">{t('tasks')}</p>
        <div className="flex items-baseline gap-2 mb-1">
          <p className="text-4xl">{stats.totalTasks}</p>
        </div>
        <p className="text-white/70 text-sm">{stats.completedTasks} {t('completed')}</p>
      </motion.div>

      {/* Taux de complétion - Gradient violet/indigo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden"
      >
        <CheckCircle size={28} className="mb-3 opacity-90" />
        <p className="text-white/80 mb-2 text-sm">{t('completionRate')}</p>
        <div className="flex items-baseline gap-2 mb-1">
          <p className="text-4xl">{stats.completionRate}%</p>
        </div>
        <p className="text-white/70 text-sm">{t('tasksCompleted')}</p>
      </motion.div>
    </div>
  )
}

