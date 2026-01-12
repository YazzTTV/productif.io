"use client"

import React, { useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, useInView } from "framer-motion"
import Image from "next/image"
import { useLocale } from "@/lib/i18n"
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
function AppInHero({ t }: { t: (key: string) => string }) {
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
                  <p className="text-sm text-gray-500 mb-1">{t('lpGoodMorning')}</p>
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
                <h2 className="text-base text-gray-600 mb-3">{t('lpTodaysStructure')}</h2>
                <div className="bg-[#16a34a]/5 rounded-3xl p-8 border-2 border-[#16a34a]/20 shadow-lg">
                  <div className="space-y-6">
                    {/* Focus Block */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock size={16} strokeWidth={1.5} className="text-[#16a34a]" />
                        <span className="text-sm font-medium text-[#16a34a]">09:00 - 10:30</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{t('lpCompleteChapter12')}</h3>
                      <p className="text-base text-gray-600">{t('lpOrganicChemistry')}</p>
                    </div>

                    {/* Tasks Section */}
                    <div className="pt-4 border-t border-black/10 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                        <span className="text-sm text-gray-700">{t('lpReviewLectureNotes')}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                        <span className="text-sm text-gray-700">{t('lpPracticeProblems')}</span>
                      </div>
                    </div>

                    {/* Habit Section */}
                    <div className="pt-4 border-t border-black/10">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border-2 border-[#16a34a] bg-[#16a34a]/10"></div>
                        <span className="text-sm text-gray-700">{t('lpMorningReview')}</span>
                      </div>
                    </div>

                    {/* Start Focus Button */}
                    <button className="w-full mt-8 bg-[#16a34a] text-white rounded-2xl py-4 flex items-center justify-center font-semibold text-lg shadow-lg shadow-[#16a34a]/30">
                      {t('lpStartFocus')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Key Moments Timeline */}
              <div>
                <h2 className="text-base text-gray-600 mb-3">{t('lpKeyMomentsToday')}</h2>
                <div className="space-y-0">
                  {[
                    { time: '09:00', label: t('lpMorningFocusSession'), active: true },
                    { time: '12:00', label: t('lpLunchBreak'), active: false },
                    { time: '14:00', label: t('lpStudyGroupMeeting'), active: false }
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
                    <h3 className="text-lg font-medium text-gray-900 mb-1">{t('lpCommunityProgress')}</h3>
                    <p className="text-sm text-gray-500">{t('lpYourGroupThisWeek')}</p>
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
                  <p className="text-sm text-gray-500 text-center">{t('lpViewFullLeaderboard')}</p>
                </div>
              </div>

              {/* Microcopy */}
              <div className="py-6 text-center">
                <p className="text-sm text-gray-500 italic">{t('lpEverythingElseHandled')}</p>
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

export default function Home() {
  const router = useRouter()
  
  // Wrap useLocale in a try-catch to prevent crashes
  let locale: 'fr' | 'en' = 'fr'
  let setLocale: (locale: 'fr' | 'en') => void = () => {}
  let t: (key: string) => string = (key: string) => key
  
  try {
    const localeData = useLocale()
    locale = localeData.locale
    setLocale = localeData.setLocale
    t = localeData.t
  } catch (error) {
    console.error('Error with useLocale:', error)
    // Fallback translations
    t = (key: string) => {
      const fallback: Record<string, string> = {
        'lpForStudents': 'Pour les étudiants qui veulent le contrôle',
        'lpTurnFocusIntoDiscipline': 'Transformez la concentration en',
        'lpDiscipline': 'discipline',
        'lpHeroSubtitle': 'Productif.io est le coach IA qui aide les étudiants à rester concentrés, à développer la constance et à mieux performer — chaque jour.',
        'lpStartForFree': 'Commencer gratuitement',
        'lpSeeTheSystem': 'Découvrir le système',
      }
      return fallback[key] || key
    }
  }

  const handleCTAClick = () => {
    const params = new URLSearchParams()
    const keep: string[] = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"]
    keep.forEach(k => {
      const v = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(k) : null
      if (v) params.set(k, v)
    })
    router.push(`/onboarding?${params.toString()}`)
  }

  const toggleLanguage = () => {
    setLocale(locale === 'fr' ? 'en' : 'fr')
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

          {/* Language Toggle Button */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute top-8 right-6 md:right-12"
          >
            <button
              onClick={toggleLanguage}
              className="bg-white rounded-2xl px-4 py-2.5 shadow-sm border border-black/[0.05] flex items-center gap-2 hover:bg-gray-50 transition-colors font-medium text-sm text-gray-900"
            >
              <span className={locale === 'fr' ? 'font-semibold' : 'text-gray-500'}>FR</span>
              <span className="text-gray-300">/</span>
              <span className={locale === 'en' ? 'font-semibold' : 'text-gray-500'}>EN</span>
            </button>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center space-y-8"
          >
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#16a34a]/20 bg-[#16a34a]/5 text-sm font-medium text-[#16a34a] tracking-tight">
                {t('lpForStudents')}
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-7xl font-light text-gray-900 tracking-[-0.04em] leading-tight max-w-4xl mx-auto"
            >
              {t('lpTurnFocusIntoDiscipline')} <span className="text-[#16a34a]">{t('lpDiscipline')}</span>.
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed"
            >
              {t('lpHeroSubtitle')}
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <button
                onClick={handleCTAClick}
                className="px-8 py-4 bg-[#16a34a] text-white rounded-3xl font-medium text-base hover:bg-[#15803d] transition-colors duration-200"
              >
                {t('lpStartForFree')}
              </button>
              <button
                onClick={() => {
                  document.getElementById('the-system')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="px-8 py-4 bg-transparent text-gray-700 border border-[#16a34a]/30 rounded-3xl font-medium text-base hover:bg-[#16a34a]/5 transition-colors duration-200"
              >
                {t('lpSeeTheSystem')}
              </button>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-12">
              <AppInHero t={t} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Recognition Section */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-[-0.04em] text-center mb-16 max-w-3xl mx-auto">
              {t('lpInformationNotProblem')}
            </h2>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
            {[
              {
                icon: Target,
                title: t('lpIntentVsAction'),
                description: t('lpIntentVsActionDesc')
              },
              {
                icon: TrendingDown,
                title: t('lpFocusDecay'),
                description: t('lpFocusDecayDesc')
              },
              {
                icon: Zap,
                title: t('lpAttentionTheft'),
                description: t('lpAttentionTheftDesc')
              },
              {
                icon: BarChart3,
                title: t('lpInconsistency'),
                description: t('lpInconsistencyDesc')
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
                {t('lpChatGPTGivesAnswers')}
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
              {t('lpTheSystem')}
            </h2>
          </RevealOnScroll>

          <RevealOnScroll delay={0.1}>
            <p className="text-center text-gray-600 mb-16 text-lg max-w-2xl mx-auto">
              {t('lpSystemSubtitle')}
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
                  title: t('lpStep01Title'),
                  subtitle: t('lpStep01Subtitle'),
                  description: t('lpStep01Desc')
                },
                {
                  step: "02",
                  title: t('lpStep02Title'),
                  subtitle: t('lpStep02Subtitle'),
                  description: t('lpStep02Desc')
                },
                {
                  step: "03",
                  title: t('lpStep03Title'),
                  subtitle: t('lpStep03Subtitle'),
                  description: t('lpStep03Desc')
                },
                {
                  step: "04",
                  title: t('lpStep04Title'),
                  subtitle: t('lpStep04Subtitle'),
                  description: t('lpStep04Desc')
                },
                {
                  step: "05",
                  title: t('lpStep05Title'),
                  subtitle: t('lpStep05Subtitle'),
                  description: t('lpStep05Desc')
                },
                {
                  step: "06",
                  title: t('lpStep06Title'),
                  subtitle: t('lpStep06Subtitle'),
                  description: t('lpStep06Desc')
                },
                {
                  step: "07",
                  title: t('lpStep07Title'),
                  subtitle: t('lpStep07Subtitle'),
                  description: t('lpStep07Desc')
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
                {t('lpStartForFree')}
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
              {t('lpWhatTheyThink')}
            </h2>
            <p className="text-center text-gray-600 mb-16 text-lg">
              {t('lpStudentsTransformed')}
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
                  &ldquo;{t('lpTestimonialGaetan')}&rdquo;
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
                    &ldquo;{t('lpTestimonialBenjamin')}&rdquo;
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
                  &ldquo;{t('lpTestimonialSabrina')}&rdquo;
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
                {t('lpFooterDescription')}
              </p>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">{t('lpLegal')}</h4>
              <ul className="space-y-3">
                <li>
                  <a href="/privacy-policy" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    {t('lpPrivacyPolicy')}
                  </a>
                </li>
                <li>
                  <a href="/terms" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    {t('lpTermsOfService')}
                  </a>
                </li>
                <li>
                  <a href="/cgv" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    {t('lpCGV')}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-black/[0.03]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500 text-center md:text-left">
                © {new Date().getFullYear()} Productif.io. {t('lpAllRightsReserved')}
              </p>
              <p className="text-sm text-gray-500 text-center md:text-right">
                {t('lpBuiltForNextGen')}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
} 
