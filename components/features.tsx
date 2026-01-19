"use client"

import type React from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Brain, Target, BarChart3, Zap, Trophy, Users } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description: "Get personalized productivity recommendations based on your unique habits and patterns.",
    color: "from-purple-500 to-indigo-600"
  },
  {
    icon: Target,
    title: "Smart Goal Tracking",
    description: "Set, track, and crush your goals with intelligent reminders and progress analytics.",
    color: "from-[#00C27A] to-[#00D68F]"
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    description: "Understand your productivity patterns with beautiful charts and actionable insights.",
    color: "from-cyan-400 to-blue-500"
  },
  {
    icon: Zap,
    title: "Focus Mode",
    description: "Block distractions and enter deep work with our scientifically-designed focus timer.",
    color: "from-orange-400 to-pink-500"
  },
  {
    icon: Trophy,
    title: "Gamification",
    description: "Restez motivé avec des séries, des succès, et une compétition amicale sur les classements.",
    color: "from-amber-400 to-orange-500"
  },
  {
    icon: Users,
    title: "Communauté Active",
    description: "Rejoignez des milliers d'individus productifs et partagez votre parcours vers le succès.",
    color: "from-pink-400 to-rose-500"
  }
];

export function Features() {
  const router = useRouter();

  const handleCTAClick = () => {
    const params = new URLSearchParams();
    const keep: string[] = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"];
    keep.forEach(k => {
      const v = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(k) : null;
      if (v) params.set(k, v);
    });
    params.set('offer', 'early-access');
    router.push(`/onboarding?${params.toString()}`);
  };

  return (
    <section id="features" className="py-28 bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#00C27A]/10 to-[#00D68F]/10 border border-[#00C27A]/20 text-sm text-[#00C27A] mb-6">
            <span className="text-xs">⚡</span>
            <span>Productivity, redesigned</span>
          </div>
          <h2 className="text-4xl md:text-5xl text-gray-900 mb-4">
            Everything you need to
            <span className="block bg-gradient-to-r from-[#00C27A] to-[#00D68F] bg-clip-text text-transparent">
              stay in flow
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Productif.io centralizes tasks, habits and deep work so you always know{" "}
            <span className="font-semibold text-gray-800">what matters now</span>.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8, boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)" }}
              className="bg-white/90 rounded-3xl p-8 border border-gray-100 hover:border-[#00C27A]/40 transition-all cursor-pointer backdrop-blur-sm"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-black/5`}>
                <feature.icon size={26} className="text-white" />
              </div>
              <h3 className="text-xl md:text-2xl text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCTAClick}
            className="px-8 py-4 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-full shadow-xl text-lg font-semibold"
          >
            Start Now for Free
          </motion.button>
        </div>
      </div>
    </section>
  )
} 