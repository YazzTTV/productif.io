"use client"

import React, { useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, useInView } from "framer-motion"
import Image from "next/image"
import {
  Target,
  Zap,
  TrendingDown,
  CheckCircle2,
  Timer,
  BarChart3,
  Users,
  BookOpen,
  Focus,
  Calendar,
  Clock,
  Play,
  Lightbulb,
  User,
  Star
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
      transition={{ duration: 0.8, delay }}
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
          <div className="bg-white rounded-[2.5rem] overflow-hidden">
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
            <div className="px-6 pt-4 pb-6 space-y-6 overflow-y-auto" style={{ maxHeight: '600px' }}>
              {/* Header with Settings */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Good morning</p>
                  <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Alex</h1>
                </div>
                <button className="w-12 h-12 rounded-2xl border border-black/[0.05] flex items-center justify-center bg-white shadow-sm">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-900">
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>
              </div>

              {/* Today's Structure Card */}
              <div>
                <h2 className="text-base text-gray-600 mb-3">Today's structure</h2>
                <div className="bg-[#16a34a]/5 rounded-3xl p-8 border-2 border-[#16a34a]/20 shadow-lg">
                  <div className="space-y-6">
                    {/* Focus Block */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock size={16} strokeWidth={1.5} className="text-[#16a34a]" />
                        <span className="text-sm font-medium text-[#16a34a]">09:00 - 10:30</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Complete Chapter 12 Summary</h3>
                      <p className="text-base text-gray-600">Organic Chemistry</p>
                    </div>

                    {/* Tasks Section */}
                    <div className="pt-4 border-t border-black/10 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                        <span className="text-sm text-gray-700">Review lecture notes · 30 min</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                        <span className="text-sm text-gray-700">Practice problems 15-20 · 45 min</span>
                      </div>
                    </div>

                    {/* Habit Section */}
                    <div className="pt-4 border-t border-black/10">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border-2 border-[#16a34a] bg-[#16a34a]/10"></div>
                        <span className="text-sm text-gray-700">Morning review</span>
                      </div>
                    </div>

                    {/* Start Focus Button */}
                    <button className="w-full mt-8 bg-[#16a34a] text-white rounded-2xl py-4 flex items-center justify-center font-semibold text-lg shadow-lg shadow-[#16a34a]/30">
                      Start Focus
                    </button>
                  </div>
                </div>
              </div>

              {/* Key Moments Timeline */}
              <div>
                <h2 className="text-base text-gray-600 mb-3">Key moments today</h2>
                <div className="space-y-0">
                  {[
                    { time: '09:00', label: 'Morning Focus Session', active: true },
                    { time: '12:00', label: 'Lunch Break', active: false },
                    { time: '14:00', label: 'Study Group Meeting', active: false }
                  ].map((moment, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center w-6">
                        <div className={`w-4 h-4 rounded-full ${moment.active ? 'bg-[#16a34a] ring-4 ring-[#16a34a]/20' : 'bg-gray-200'}`}></div>
                        {i < 2 && <div className={`w-0.5 flex-1 ${moment.active ? 'bg-[#16a34a]' : 'bg-gray-200'}`} style={{ minHeight: '40px' }}></div>}
                      </div>
                      <div className={`flex-1 rounded-2xl p-5 mb-3 ${moment.active ? 'bg-white border-2 border-[#16a34a]/20 shadow-sm' : 'bg-gray-50'}`}>
                        <p className={`text-sm font-semibold mb-1 ${moment.active ? 'text-[#16a34a]' : 'text-gray-500'}`}>{moment.time}</p>
                        <p className={`text-base ${moment.active ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{moment.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Community Progress Card */}
              <div className="bg-white rounded-3xl p-6 border border-black/5">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Community Progress</h3>
                    <p className="text-sm text-gray-500">Your group this week</p>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>

                {/* Avatar Group with Progress Bars */}
                <div className="flex items-end justify-between gap-3 mb-6">
                  {['M', 'You', 'A', 'E', 'L'].map((initial, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className={`w-full h-16 rounded-lg ${initial === 'You' ? 'bg-[#16a34a]/10' : 'bg-gray-100'} flex items-end`}>
                        <div className={`w-full rounded-lg ${initial === 'You' ? 'bg-[#16a34a]' : 'bg-gray-300'}`} style={{ height: `${85 - i * 5}%` }}></div>
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${initial === 'You' ? 'bg-[#16a34a]/10' : 'bg-gray-100'}`}>
                        <span className={`text-sm font-medium ${initial === 'You' ? 'text-[#16a34a] text-lg' : 'text-gray-600'}`}>
                          {initial === 'You' ? '✓' : initial}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-black/5">
                  <p className="text-sm text-gray-500 text-center">View full leaderboard →</p>
                </div>
              </div>

              {/* Microcopy */}
              <div className="py-6 text-center">
                <p className="text-sm text-gray-500 italic">Everything else is handled.</p>
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
    <main className="min-h-screen bg-white">
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
                src="/icon-new.png"
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
                For students who want control
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
        <div className="max-w-4xl mx-auto">
          <RevealOnScroll>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-[-0.04em] text-center mb-4">
              The System
            </h2>
          </RevealOnScroll>

          <RevealOnScroll delay={0.1}>
            <p className="text-center text-gray-600 mb-16 text-lg max-w-2xl mx-auto">
              A clear sequence your day follows, from organizing your work to deep focus to long-term consistency.
            </p>
          </RevealOnScroll>

          {/* Vertical step-by-step timeline */}
          <div className="relative max-w-3xl mx-auto">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[#16a34a]/30 via-[#16a34a]/20 via-[#16a34a]/10 to-transparent pointer-events-none" />

            <div className="space-y-10">
              {[
                {
                  step: "01",
                  title: "Organize by Subjects",
                  subtitle: "Structure your work",
                  description: "Your work is organized by subjects. This keeps things clear. Add subjects with coefficients to prioritize what matters most."
                },
                {
                  step: "02",
                  title: "Create Tasks",
                  subtitle: "What you actually work on",
                  description: "Tasks are what you actually work on. Start simple. One task is enough. Add a name and difficulty level."
                },
                {
                  step: "03",
                  title: "Plan My Day",
                  subtitle: "AI structures your day",
                  description: "This is where your day becomes clear. Describe your day freely. We'll organize it. Speak or type — whatever feels easier."
                },
                {
                  step: "04",
                  title: "Daily Journal",
                  subtitle: "Unload stress, track feelings",
                  description: "This helps you unload stress and track how you feel. No judgment. Just awareness. Takes less than 30 seconds."
                },
                {
                  step: "05",
                  title: "Habits",
                  subtitle: "Protect your energy",
                  description: "Habits are small actions that protect your energy. Small habits, big impact. Example: Review plan in the morning."
                },
                {
                  step: "06",
                  title: "Focus Sessions",
                  subtitle: "Where real work happens",
                  description: "This is where real work happens. Select a task and duration. You can stop anytime. Timer-based sessions with distraction blocking."
                },
                {
                  step: "07",
                  title: "Exam Mode",
                  subtitle: "Pure focus, zero noise",
                  description: "Exam Mode removes all distractions and locks you in. Only enter when you're ready. Pressure-proof timer for deep work."
                }
              ].map((step, index) => (
                <RevealOnScroll key={step.step} delay={0.12 * index}>
                  <div className="relative pl-14">
                    {/* Step bullet */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ 
                        duration: 0.4, 
                        delay: 0.12 * index,
                        type: "spring",
                        stiffness: 200
                      }}
                      className="absolute left-0 top-3 w-12 h-12 rounded-full bg-white border-2 border-[#16a34a]/40 flex items-center justify-center shadow-sm z-10"
                    >
                      <span className="text-sm font-semibold text-[#16a34a]">
                        {step.step}
                      </span>
                    </motion.div>

                    {/* Card */}
                    <motion.div
                      initial={{ opacity: 0, x: -20, y: 20 }}
                      whileInView={{ opacity: 1, x: 0, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ 
                        duration: 0.6, 
                        delay: 0.12 * index + 0.1,
                        ease: [0.16, 1, 0.3, 1]
                      }}
                      className="bg-white border border-[#16a34a]/12 rounded-3xl p-8 shadow-sm hover:border-[#16a34a]/25 hover:shadow-md transition-all"
                    >
                      <div className="flex flex-col gap-2 mb-4">
                        <p className="text-sm font-medium text-[#16a34a] tracking-tight uppercase">
                          {step.subtitle}
                        </p>
                        <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-base text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </motion.div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <RevealOnScroll>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <button
                onClick={handleCTAClick}
                className="px-12 py-5 bg-[#16a34a] text-white rounded-3xl font-medium text-lg hover:bg-[#15803d] transition-colors duration-200 shadow-lg shadow-[#16a34a]/20 hover:shadow-xl hover:shadow-[#16a34a]/30"
              >
                Start for Free
              </button>
            </motion.div>
          </RevealOnScroll>
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
            {/* Gaetan Silgado */}
            <RevealOnScroll delay={0}>
              <div className="bg-white border border-black/[0.03] rounded-3xl p-6 shadow-sm hover:border-[#16a34a]/20 transition-colors">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} strokeWidth={1.5} className="text-[#16a34a] fill-[#16a34a]" />
                  ))}
                  <CheckCircle2 size={16} strokeWidth={1.5} className="text-[#16a34a] ml-2" />
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 text-sm">
                  &ldquo;As an infopreneur, Productif.io helped me organize and work without distractions. As a result, I generated much more revenue by staying focused on what matters.&rdquo;
                </p>
                <div className="border-t border-black/[0.03] pt-4 flex items-center gap-3">
                  <Image
                    src="/testimonials/gaetan-silgado.jpg"
                    alt="Gaetan Silgado"
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Gaetan Silgado</div>
                    <div className="text-xs text-gray-500 mt-1">Infopreneur</div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>

            {/* Benjamin Courdrais - Video */}
            <RevealOnScroll delay={0.1}>
              <div className="bg-white border border-black/[0.03] rounded-3xl overflow-hidden shadow-sm hover:border-[#16a34a]/20 transition-colors">
                <div className="relative aspect-video bg-gray-900">
                  <video
                    className="w-full h-full object-cover"
                    controls
                    poster="/testimonials/benjamin-courdrais.jpg"
                  >
                    <source src="/videos/benjamin-temoignage.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} strokeWidth={1.5} className="text-[#16a34a] fill-[#16a34a]" />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-6 text-sm">
                    &ldquo;En tant que fondateur de startup, je travaille sur plusieurs projets en parallèle. Productif.io m'a fait gagner un temps précieux en centralisant toutes mes tâches et objectifs.&rdquo;
                  </p>
                  <div className="border-t border-black/[0.03] pt-4 flex items-center gap-3">
                    <Image
                      src="/testimonials/benjamin-courdrais.jpg"
                      alt="Benjamin Courdrais"
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Benjamin Courdrais</div>
                      <div className="text-xs text-gray-500 mt-1">Entrepreneur</div>
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>

            {/* Sabrina */}
            <RevealOnScroll delay={0.2}>
              <div className="bg-white border border-black/[0.03] rounded-3xl p-6 shadow-sm hover:border-[#16a34a]/20 transition-colors">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} strokeWidth={1.5} className="text-[#16a34a] fill-[#16a34a]" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 text-sm">
                  &ldquo;I just tried it and it's perfect. I LOVE how the app organizes my tasks and helps me track my habits. It's truly intuitive!&rdquo;
                </p>
                <div className="border-t border-black/[0.03] pt-4 flex items-center gap-3">
                  <Image
                    src="/testimonials/sabrina.jpg"
                    alt="Sabrina"
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Sabrina</div>
                    <div className="text-xs text-gray-500 mt-1">Freelance Media Buyer</div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-black/[0.03] bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/icon-new.png"
                  alt="Productif.io"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                <h3 className="text-lg font-medium text-gray-900">Productif.io</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                The AI coach that helps students stay focused, build consistency, and perform better.
              </p>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <a href="/privacy-policy" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/cgv" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    CGV
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-black/[0.03]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500 text-center md:text-left">
                © {new Date().getFullYear()} Productif.io. All rights reserved.
              </p>
              <p className="text-sm text-gray-500 text-center md:text-right">
                Built for the next generation of high-performers.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
