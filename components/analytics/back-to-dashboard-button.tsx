"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"

export function BackToDashboardButton() {
  return (
    <Link href="/dashboard">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-6 py-2.5 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-2xl flex items-center gap-2 shadow-md"
      >
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </motion.button>
    </Link>
  )
}

