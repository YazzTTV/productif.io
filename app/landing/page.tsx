"use client"

import React, { useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, useInView } from "framer-motion"
import Image from "next/image"
import {
  Target,
  Brain,
  Zap,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  Timer,
  Award,
  Flame,
  BarChart3,
  Sparkles,
  Users,
  BookOpen,
  Focus,
  Calendar,
  Clock,
  Send,
  Mic,
  Play,
  Lightbulb,
  User
} from "lucide-react"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6
    }
  }
}

// Reveal on scroll component
function RevealOnScroll({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}

// iPhone Mockup with Assistant IA Dashboard
function AppInHero() {
  return (
    <div className="w-full max-w-sm mx-auto">
      {/* iPhone Frame */}
      <div className="relative mx-auto">
        {/* iPhone Outer Frame */}
        <div className="bg-black rounded-[3rem] p-2 shadow-2xl">
          {/* iPhone Screen */}
          <div className="bg-[#FBFBFB] rounded-[2.5rem] overflow-hidden">
            {/* Notch */}
            <div className="h-6 bg-black rounded-b-3xl mx-auto w-32"></div>
            
            {/* Status Bar */}
            <div className="flex items-center justify-between px-6 pt-2 pb-1">
              <span className="text-xs font-medium text-gray-900">9:41</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-2 border border-gray-900 rounded-sm">
                  <div className="w-3 h-1.5 bg-gray-900 rounded-sm m-0.5"></div>
                </div>
                <div className="w-5 h-2.5 border border-gray-900 rounded-sm">
                  <div className="w-4 h-2 bg-gray-900 rounded-sm m-0.5"></div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="px-4 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: '600px' }}>
              {/* Header with Profile */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-[#16a34a] rounded-full flex items-center justify-center">
                  <User size={24} strokeWidth={1.5} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Good Morning, Alex</h2>
                  <p className="text-sm text-gray-600">Let's focus on what matters today</p>
                </div>
              </div>

              {/* Today's Priority Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-black/[0.03]"
              >
                {/* Image Header */}
                <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100"></div>
                  </div>
                  {/* High Focus Badge */}
                  <div className="absolute bottom-3 left-3 bg-gray-800 rounded-full px-3 py-1.5 flex items-center gap-1.5">
                    <Zap size={12} strokeWidth={2} className="text-white" />
                    <span className="text-xs font-medium text-white">High Focus</span>
                  </div>
                </div>
                
                {/* Priority Content */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-16 bg-[#16a34a] rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-[#16a34a] uppercase tracking-wide mb-1">
                        TODAY'S PRIORITY
                      </p>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Deep Work: Q3 Report
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock size={14} strokeWidth={1.5} />
                        <span>45 minutes</span>
                        <span>•</span>
                        <span>Calendar based</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Start Focus Session Button */}
                  <button className="w-full mt-4 bg-[#16a34a] text-white rounded-2xl py-3.5 flex items-center justify-center gap-2 font-medium text-sm hover:bg-[#15803d] transition-colors">
                    <Play size={18} strokeWidth={2} fill="white" />
                    <span>Start Focus Session</span>
                  </button>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-3">Quick Actions</h3>
                <div className="flex gap-3">
                  <button className="flex-1 bg-white border border-black/[0.03] rounded-2xl p-3 flex items-center gap-2 hover:bg-gray-50 transition-colors">
                    <Focus size={18} strokeWidth={1.5} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Suggest a break</span>
                  </button>
                  <button className="flex-1 bg-white border border-black/[0.03] rounded-2xl p-3 flex items-center gap-2 hover:bg-gray-50 transition-colors">
                    <Calendar size={18} strokeWidth={1.5} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Reschedule afternoon</span>
                  </button>
                </div>
              </div>

              {/* Coach Insight */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="bg-[#16a34a]/10 rounded-2xl p-4 border border-[#16a34a]/20"
              >
                <div className="flex items-start gap-3">
                  <Lightbulb size={20} strokeWidth={1.5} className="text-[#16a34a] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Coach Insight</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      You're most productive between 10 AM and 12 PM. Aim to finish the report before lunch.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Input Area */}
            <div className="px-4 py-4 border-t border-black/[0.03] bg-white">
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 bg-[#FBFBFB] border border-black/[0.03] rounded-full flex items-center justify-center">
                  <Mic size={18} strokeWidth={1.5} className="text-gray-600" />
                </button>
                <div className="flex-1 bg-[#FBFBFB] border border-black/[0.03] rounded-3xl px-4 py-3">
                  <span className="text-sm text-gray-400">Ask your coach...</span>
                </div>
                <button className="w-10 h-10 bg-[#16a34a] rounded-full flex items-center justify-center hover:bg-[#15803d] transition-colors">
                  <Send size={18} strokeWidth={1.5} className="text-white" />
                </button>
              </div>
            </div>

            {/* Home Indicator */}
            <div className="h-1 bg-gray-300 rounded-full w-32 mx-auto my-2"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()

  const handleCTAClick = () => {
    const params = new URLSearchParams()
    const keep: string[] = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"]
    keep.forEach(k => {
      const v = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(k) : null
      if (v) params.set(k, v)
    })
    router.push(`/onboarding/welcome?${params.toString()}`)
  }

  return (
    <main className="min-h-screen bg-[#FBFBFB]">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-6xl mx-auto w-full">
          {/* Logo on the side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute top-8 left-6 md:left-12"
          >
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-black/[0.03]">
              <Image
                src="/icon.png"
                alt="Productif.io"
                width={80}
                height={80}
                className="w-20 h-20"
                priority
              />
            </div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center space-y-8"
          >
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#16a34a]/20 bg-[#16a34a]/5 text-sm font-medium text-[#16a34a] tracking-tight">
                For students who want discipline
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-7xl font-light text-gray-900 tracking-[-0.04em] leading-tight max-w-4xl mx-auto"
            >
              Turn focus into <span className="text-[#16a34a]">discipline</span>.
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed"
            >
              Productif.io is the AI coach that helps students stay focused,
              build consistency, and perform better — every day.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <button
                onClick={handleCTAClick}
                className="px-8 py-4 bg-[#16a34a] text-white rounded-3xl font-medium text-base hover:bg-[#15803d] transition-colors duration-200"
              >
                Start for free
              </button>
              <button
                onClick={() => {
                  document.getElementById('the-system')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="px-8 py-4 bg-transparent text-gray-700 border border-[#16a34a]/30 rounded-3xl font-medium text-base hover:bg-[#16a34a]/5 transition-colors duration-200"
              >
                See the system
              </button>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-12">
              <AppInHero />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Recognition Section */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-[-0.04em] text-center mb-16 max-w-3xl mx-auto">
              Information is not the problem. Structure is.
            </h2>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
            {[
              {
                icon: Target,
                title: "Intent vs Action",
                description: "The gap between knowing what to do and actually doing it."
              },
              {
                icon: TrendingDown,
                title: "Focus Decay",
                description: "Attention naturally drifts without structure and accountability."
              },
              {
                icon: Zap,
                title: "Attention Theft",
                description: "Notifications, apps, and distractions fragment your flow state."
              },
              {
                icon: BarChart3,
                title: "Inconsistency",
                description: "Sporadic effort leads to mediocre results, not mastery."
              }
            ].map((item, index) => (
              <RevealOnScroll key={item.title} delay={index * 0.1}>
                <div className="bg-white border border-[#16a34a]/10 rounded-3xl p-8 shadow-sm hover:border-[#16a34a]/20 transition-colors">
                  <item.icon size={24} strokeWidth={1.5} className="text-[#16a34a] mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-3 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll delay={0.4}>
            <div className="mt-20 text-center max-w-2xl mx-auto">
              <p className="text-lg text-gray-600 leading-relaxed">
                ChatGPT gives answers. Productif.io gives direction, structure, and follow-through.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* The System Section */}
      <section id="the-system" className="py-32 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-[-0.04em] text-center mb-20">
              The System
            </h2>
          </RevealOnScroll>

          <div className="relative">
            {/* Connecting lines - hidden on mobile */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 border-t border-dashed border-[#16a34a]/20" />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-4 relative">
              {[
                {
                  step: "01",
                  title: "Personalized Onboarding",
                  subtitle: "Quiz",
                  description: "We understand your productivity profile, energy patterns, and goals."
                },
                {
                  step: "02",
                  title: "AI Plan Generation",
                  subtitle: "From intention to concrete action",
                  description: "Your AI coach structures your day, prioritizes tasks, and creates actionable plans."
                },
                {
                  step: "03",
                  title: "Deep Work & Exam Mode",
                  subtitle: "Pure focus, zero noise",
                  description: "Timer-based sessions with distraction blocking. Built for sustained concentration."
                },
                {
                  step: "04",
                  title: "Gamified Consistency",
                  subtitle: "XP, Levels, Streaks",
                  description: "Track progress through XP events. Build streaks. Level up your discipline."
                }
              ].map((step, index) => (
                <RevealOnScroll key={step.step} delay={index * 0.15}>
                  <div className="relative bg-[#FBFBFB] border border-[#16a34a]/10 rounded-3xl p-8 shadow-sm hover:border-[#16a34a]/20 transition-colors">
                    <div className="flex items-start gap-4 mb-4">
                      <span className="text-2xl font-light text-[#16a34a]/40 tracking-tight">
                        {step.step}
                      </span>
                      <div className="flex-1">
                        <h3 className="text-xl font-medium text-gray-900 mb-2 tracking-tight">
                          {step.title}
                        </h3>
                        <p className="text-sm text-[#16a34a] font-medium mb-3">
                          {step.subtitle}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features - Minimal Design */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <RevealOnScroll>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-[-0.04em] text-center mb-4">
              Built for Focus
            </h2>
            <p className="text-center text-gray-600 mb-16 text-lg">
              Four core systems that work together
            </p>
          </RevealOnScroll>

          <div className="space-y-16">
            {/* AI Coach */}
            <RevealOnScroll>
              <div className="border-l-2 border-[#16a34a] pl-8">
                <div className="flex items-center gap-3 mb-3">
                  <Brain size={24} strokeWidth={1.5} className="text-[#16a34a]" />
                  <h3 className="text-2xl font-medium text-gray-900 tracking-tight">
                    AI Coach Agent
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Structures your deep work sessions, starts focus timers, and closes loops.
                  Understands your energy levels and schedules tasks accordingly.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-3 py-1 bg-[#16a34a]/10 text-[#16a34a] rounded-full border border-[#16a34a]/20">
                    Session Structuring
                  </span>
                  <span className="text-xs px-3 py-1 bg-[#16a34a]/10 text-[#16a34a] rounded-full border border-[#16a34a]/20">
                    Focus Initiation
                  </span>
                  <span className="text-xs px-3 py-1 bg-[#16a34a]/10 text-[#16a34a] rounded-full border border-[#16a34a]/20">
                    Loop Closure
                  </span>
                </div>
              </div>
            </RevealOnScroll>

            {/* Energy-Based Tasking */}
            <RevealOnScroll delay={0.1}>
              <div className="border-l-2 border-[#16a34a] pl-8">
                <div className="flex items-center gap-3 mb-3">
                  <Zap size={24} strokeWidth={1.5} className="text-[#16a34a]" />
                  <h3 className="text-2xl font-medium text-gray-900 tracking-tight">
                    Energy-Based Tasking
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Prioritize by mental battery, not time. Tasks are scheduled based on your energy levels
                  throughout the day.
                </p>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 mb-1">Morning</div>
                    <div className="text-xs text-[#16a34a]">High energy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 mb-1">Afternoon</div>
                    <div className="text-xs text-gray-500">Medium</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 mb-1">Evening</div>
                    <div className="text-xs text-gray-500">Low energy</div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>

            {/* Habit Tracking */}
            <RevealOnScroll delay={0.2}>
              <div className="border-l-2 border-[#16a34a] pl-8">
                <div className="flex items-center gap-3 mb-3">
                  <Flame size={24} strokeWidth={1.5} className="text-[#16a34a]" />
                  <h3 className="text-2xl font-medium text-gray-900 tracking-tight">
                    Habit Tracking
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Visualize streaks and daily presence. Build consistency through daily check-ins
                  and streak bonuses.
                </p>
                <div className="flex items-center gap-6 mt-6">
                  <div>
                    <div className="text-3xl font-light text-[#16a34a] mb-1">12</div>
                    <div className="text-xs text-gray-500">day streak</div>
                  </div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#16a34a]" style={{ width: '80%' }} />
                  </div>
                  <div className="text-xs text-gray-500">+5 XP/day</div>
                </div>
              </div>
            </RevealOnScroll>

            {/* XP System */}
            <RevealOnScroll delay={0.3}>
              <div className="border-l-2 border-[#16a34a] pl-8">
                <div className="flex items-center gap-3 mb-3">
                  <Award size={24} strokeWidth={1.5} className="text-[#16a34a]" />
                  <h3 className="text-2xl font-medium text-gray-900 tracking-tight">
                    XP System
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Track progress through XP events. Every action contributes to your level.
                  Build discipline through gamified consistency.
                </p>
                <div className="space-y-3 mt-6">
                  <div className="flex items-center justify-between py-2 border-b border-black/[0.03]">
                    <span className="text-sm font-mono text-gray-700">task_complete</span>
                    <span className="text-sm text-[#16a34a] font-medium">10-20 XP</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-black/[0.03]">
                    <span className="text-sm font-mono text-gray-700">deepwork_complete</span>
                    <span className="text-sm text-[#16a34a] font-medium">1 XP/min</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-mono text-gray-700">habit_streak_bonus</span>
                    <span className="text-sm text-[#16a34a] font-medium">+5 XP/day</span>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-[-0.04em] text-center mb-4">
              What they think about us
            </h2>
            <p className="text-center text-gray-600 mb-16 text-lg">
              Students who transformed their productivity
            </p>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RevealOnScroll delay={0}>
              <div className="bg-[#FBFBFB] border border-black/[0.03] rounded-3xl p-6 shadow-sm hover:border-[#16a34a]/20 transition-colors">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-[#16a34a] rounded-full"></div>
                  ))}
                  <CheckCircle2 size={16} strokeWidth={1.5} className="text-[#16a34a] ml-2" />
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 text-sm">
                  "As an infopreneur, Productif.io helped me organize and work without distractions. As a result, I generated much more revenue by staying focused on what matters."
                </p>
                <div className="border-t border-black/[0.03] pt-4">
                  <div className="text-sm font-medium text-gray-900">Gaetan Silgado</div>
                  <div className="text-xs text-gray-500 mt-1">Infopreneur</div>
                </div>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.1}>
              <div className="bg-[#FBFBFB] border border-black/[0.03] rounded-3xl p-6 shadow-sm hover:border-[#16a34a]/20 transition-colors">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-[#16a34a] rounded-full"></div>
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 text-sm">
                  "En tant que fondateur de startup, je travaille sur plusieurs projets en parallèle. Productif.io m'a fait gagner un temps précieux en centralisant toutes mes tâches et objectifs."
                </p>
                <div className="border-t border-black/[0.03] pt-4">
                  <div className="text-sm font-medium text-gray-900">Benjamin Courdrais</div>
                  <div className="text-xs text-gray-500 mt-1">Entrepreneur</div>
                </div>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.2}>
              <div className="bg-[#FBFBFB] border border-black/[0.03] rounded-3xl p-6 shadow-sm hover:border-[#16a34a]/20 transition-colors">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-[#16a34a] rounded-full"></div>
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 text-sm">
                  "I just tried it and it's perfect. I LOVE how the app organizes my tasks and helps me track my habits. It's truly intuitive!"
                </p>
                <div className="border-t border-black/[0.03] pt-4">
                  <div className="text-sm font-medium text-gray-900">Sabrina</div>
                  <div className="text-xs text-gray-500 mt-1">Freelance Media Buyer</div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 px-6 bg-[#FBFBFB]">
        <div className="max-w-4xl mx-auto">
          <RevealOnScroll>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-[-0.04em] text-center mb-4">
              Pricing
            </h2>
            <p className="text-center text-gray-600 mb-16">
              Start free. Upgrade when you're ready.
            </p>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RevealOnScroll>
              <div className="bg-[#FBFBFB] border border-black/[0.03] rounded-3xl p-8 shadow-sm">
                <h3 className="text-2xl font-medium text-gray-900 mb-2 tracking-tight">Free</h3>
                <p className="text-gray-600 text-sm mb-6">Limited access to core features</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={18} strokeWidth={1.5} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Limited focus sessions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={18} strokeWidth={1.5} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Basic planning</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={18} strokeWidth={1.5} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Habit tracking</span>
                  </li>
                </ul>
                <button
                  onClick={handleCTAClick}
                  className="w-full px-6 py-3 bg-transparent text-gray-700 border border-black/[0.08] rounded-3xl font-medium text-sm hover:bg-black/[0.02] transition-colors duration-200"
                >
                  Get started
                </button>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.1}>
              <div className="bg-white border-2 border-[#16a34a] rounded-3xl p-8 shadow-sm relative">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-[#16a34a] text-white text-xs font-medium rounded-full">
                  Recommended
                </div>
                <h3 className="text-2xl font-medium text-gray-900 mb-2 tracking-tight">Premium</h3>
                <p className="text-gray-600 text-sm mb-6">Full access to all features</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={18} strokeWidth={1.5} className="text-[#16a34a] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Full AI coaching</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={18} strokeWidth={1.5} className="text-[#16a34a] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Exam Mode</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={18} strokeWidth={1.5} className="text-[#16a34a] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Advanced insights</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={18} strokeWidth={1.5} className="text-[#16a34a] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Unlimited sessions</span>
                  </li>
                </ul>
                <button
                  onClick={handleCTAClick}
                  className="w-full px-6 py-3 bg-black text-white rounded-3xl font-medium text-sm hover:bg-gray-900 transition-colors duration-200"
                >
                  Start free trial
                </button>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-black/[0.03]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
              <a href="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</a>
              <a href="/dashboard/habits" className="hover:text-gray-900 transition-colors">Habits</a>
              <a href="/dashboard/tasks" className="hover:text-gray-900 transition-colors">Tasks</a>
              <a href="/dashboard/analytics" className="hover:text-gray-900 transition-colors">Analytics</a>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Built for the next generation of high-performers.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}

