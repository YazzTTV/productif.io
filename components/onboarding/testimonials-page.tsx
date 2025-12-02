"use client"

import { motion } from 'framer-motion'
import { Star, TrendingUp, Users, Award, CheckCircle2, ArrowRight } from 'lucide-react'
import { useLocale } from '@/lib/i18n'
import { useRouter } from 'next/navigation'

interface TestimonialsPageProps {
  onComplete: () => void
}

export function TestimonialsPage({ onComplete }: TestimonialsPageProps) {
  const { locale } = useLocale()
  const isFr = locale === 'fr'
  const router = useRouter()

  const caseStudies = [
    {
      name: "Sarah Chen",
      role: isFr ? "Designer produit" : "Product Designer",
      image: "👩‍💼",
      before: isFr ? "Lutte avec la concentration" : "Struggling with focus",
      after: isFr ? "+147% de productivité" : "+147% productivity",
      quote: isFr 
        ? "Je suis passé de 2 heures de travail profond par jour à 6+ heures. Productif.io a tout changé."
        : "I went from 2 hours of deep work daily to 6+ hours. Productif.io changed everything.",
      timeframe: isFr ? "3 semaines" : "3 weeks",
      metrics: [
        { label: isFr ? "Travail profond" : "Deep work", value: "+220%" },
        { label: isFr ? "Distractions" : "Distractions", value: "-81%" }
      ]
    },
    {
      name: "Marcus Rodriguez",
      role: isFr ? "Fondateur de startup" : "Startup Founder",
      image: "👨‍💻",
      before: isFr ? "Épuisement et surcharge" : "Burnout & overwhelm",
      after: isFr ? "Croissance de revenus x3" : "3x revenue growth",
      quote: isFr
        ? "J'ai enfin construit les habitudes qui ont fait évoluer mon entreprise. Le coaching IA est incroyable."
        : "Finally built the habits that scaled my business. The AI coaching is unreal.",
      timeframe: isFr ? "2 mois" : "2 months",
      metrics: [
        { label: isFr ? "Tâches terminées" : "Tasks done", value: "+340%" },
        { label: isFr ? "Stress" : "Stress", value: "-72%" }
      ]
    },
    {
      name: "Emma Thompson",
      role: isFr ? "Étudiante en médecine" : "Medical Student",
      image: "👩‍⚕️",
      before: isFr ? "Spirale de procrastination" : "Procrastination spiral",
      after: isFr ? "Top 5% de la classe" : "Top 5% of class",
      quote: isFr
        ? "D'échouer aux examens à les réussir. Le suivi des habitudes m'a tenu responsable."
        : "From failing exams to acing them. The habit tracking kept me accountable.",
      timeframe: isFr ? "6 semaines" : "6 weeks",
      metrics: [
        { label: isFr ? "Temps d'étude" : "Study time", value: "+290%" },
        { label: isFr ? "Notes" : "Grades", value: "+45%" }
      ]
    }
  ]

  const testimonials = [
    { 
      text: isFr 
        ? "C'est l'application de productivité que je cherchais toute ma vie."
        : "This is the productivity app I've been searching for my entire life.", 
      author: "Alex M.", 
      verified: true 
    },
    { 
      text: isFr
        ? "Mieux qu'un coach à 500$/h. L'IA comprend vraiment mes difficultés."
        : "Better than a $500/hr coach. The AI actually understands my struggles.", 
      author: "Jordan P.", 
      verified: true 
    },
    { 
      text: isFr
        ? "A changé ma vie en 2 semaines. J'aurais aimé trouver ça il y a des années."
        : "Changed my life in 2 weeks. I wish I found this years ago.", 
      author: "Taylor K.", 
      verified: true 
    },
  ]

  const stats = [
    { 
      value: "87%", 
      label: isFr ? "Rapportent des améliorations majeures" : "Report major improvements", 
      icon: TrendingUp 
    },
    { 
      value: "50K+", 
      label: isFr ? "Utilisateurs actifs dans le monde" : "Active users worldwide", 
      icon: Users 
    },
    { 
      value: "4.9★", 
      label: isFr ? "Note moyenne" : "Average rating", 
      icon: Star 
    },
    { 
      value: "2.5h", 
      label: isFr ? "Économisées par jour par utilisateur" : "Saved daily per user", 
      icon: Award 
    }
  ]

  return (
    <div className="min-h-screen bg-white overflow-y-auto">
      <div className="bg-gradient-to-br from-[#00C27A] to-[#00D68F] px-12 py-20 pt-28 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center relative z-10 max-w-5xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl"
          >
            <Award className="text-white" size={64} />
          </motion.div>
          <h1 className="text-white mb-6 text-6xl">
            {isFr ? "Approuvé par des milliers" : "Trusted by Thousands"}
          </h1>
          <p className="text-white/95 text-2xl">
            {isFr ? "Découvrez ce que disent les utilisateurs" : "See what users are saying"}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-gray-50 to-white border-y border-gray-100 py-4 px-6"
      >
        <div className="grid grid-cols-4 gap-2">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="text-center"
            >
              <stat.icon className="text-[#00C27A] mx-auto mb-1" size={18} />
              <p className="text-gray-800 text-sm mb-0.5">{stat.value}</p>
              <p className="text-gray-500 text-xs leading-tight">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="px-6 py-6 space-y-6">
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="text-gray-800 mb-4 text-2xl"
          >
            {isFr ? "Histoires de succès" : "Success Stories"}
          </motion.h2>

          <div className="space-y-4">
            {caseStudies.map((study, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.15 }}
                className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-4xl">{study.image}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-gray-800">{study.name}</p>
                      <CheckCircle2 className="text-[#00C27A]" size={16} />
                    </div>
                    <p className="text-sm text-gray-500">{study.role}</p>
                  </div>
                  <div className="bg-[#00C27A]/10 text-[#00C27A] text-xs px-2 py-1 rounded-full">
                    {study.timeframe}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-50 to-green-50 rounded-xl p-3 mb-3 flex items-center justify-between">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-500 mb-1">{isFr ? "Avant" : "Before"}</p>
                    <p className="text-sm text-red-600">{study.before}</p>
                  </div>
                  <ArrowRight className="text-gray-400 mx-2" size={20} />
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-500 mb-1">{isFr ? "Après" : "After"}</p>
                    <p className="text-sm text-[#00C27A]">{study.after}</p>
                  </div>
                </div>

                <p className="text-gray-700 italic mb-3 text-sm leading-relaxed">
                  "{study.quote}"
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {study.metrics.map((metric, i) => (
                    <div key={i} className="bg-white rounded-lg p-2 text-center border border-gray-100">
                      <p className="text-[#00C27A] mb-0.5">{metric.value}</p>
                      <p className="text-xs text-gray-500">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <h2 className="text-gray-800 mb-4 text-2xl">
            {isFr ? "Ce que disent les utilisateurs" : "What Users Say"}
          </h2>
          <div className="space-y-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 + index * 0.1 }}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
              >
                <div className="flex gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm mb-2 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">{testimonial.author}</p>
                  {testimonial.verified && (
                    <div className="flex items-center gap-1 text-xs text-[#00C27A]">
                      <CheckCircle2 size={12} />
                      <span>{isFr ? "Vérifié" : "Verified"}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.6 }}
          className="bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-2xl p-5 text-center relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-white mb-2 relative z-10">⭐⭐⭐⭐⭐</p>
          <p className="text-white text-sm mb-1 relative z-10">
            {isFr ? "Note de 4.9/5 sur 12 847 avis" : "4.9/5 rating from 12,847 reviews"}
          </p>
          <p className="text-white/80 text-xs relative z-10">
            {isFr 
              ? "Approuvé par des professionnels chez Google, Apple, Meta et plus"
              : "Trusted by professionals at Google, Apple, Meta & more"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
          className="bg-gray-50 rounded-xl p-4 border border-gray-200"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#00C27A]/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-[#00C27A]" size={16} />
              </div>
              <p className="text-sm text-gray-700">
                {isFr ? "Essai gratuit de 7 jours, annulez à tout moment" : "7-day free trial, cancel anytime"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#00C27A]/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-[#00C27A]" size={16} />
              </div>
              <p className="text-sm text-gray-700">
                {isFr ? "Aucune carte bancaire requise pour commencer" : "No credit card required to start"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#00C27A]/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-[#00C27A]" size={16} />
              </div>
              <p className="text-sm text-gray-700">
                {isFr ? "Garantie de remboursement si non satisfait" : "Money-back guarantee if not satisfied"}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent px-6 py-4">
        <motion.button
          onClick={onComplete}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-5 rounded-2xl shadow-lg relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <span className="relative text-lg flex items-center justify-center gap-2">
            {isFr ? "Voir mes résultats" : "See My Results"}
            <ArrowRight size={20} />
          </span>
        </motion.button>
      </div>
    </div>
  )
}

