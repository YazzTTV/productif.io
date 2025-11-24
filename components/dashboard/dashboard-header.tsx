import Link from "next/link"
import { motion } from "framer-motion"
import { PlusCircle } from "lucide-react"

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600 mt-1">Bienvenue sur votre espace de productivité</p>
      </div>
      <div className="flex space-x-2">
        <Link href="/dashboard/tasks/new">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2.5 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-xl shadow-md flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Nouvelle tâche</span>
          </motion.button>
        </Link>
      </div>
    </div>
  )
}

