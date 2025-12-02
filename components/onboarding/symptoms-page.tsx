"use client"

import { motion } from 'framer-motion'
import { useState } from 'react'
import { CheckCircle2, Circle, ArrowRight, Brain } from 'lucide-react'
import { useLocale } from '@/lib/i18n'

interface SymptomsPageProps {
  onComplete: () => void
}

interface Symptom {
  id: string
  textFr: string
  textEn: string
}

const symptoms: Symptom[] = [
  { id: 'distraction', textFr: 'Je me laisse facilement distraire pendant le travail', textEn: 'I get distracted easily while working' },
  { id: 'procrastination', textFr: 'Je remets souvent à plus tard les tâches importantes', textEn: 'I often procrastinate on important tasks' },
  { id: 'overwhelmed', textFr: 'Je me sens submergé par ma liste de choses à faire', textEn: 'I feel overwhelmed by my to-do list' },
  { id: 'focus', textFr: 'J\'ai du mal à maintenir ma concentration sur de longues périodes', textEn: 'I struggle to maintain focus for long periods' },
  { id: 'motivation', textFr: 'Je manque de motivation pour commencer les tâches', textEn: 'I lack motivation to start tasks' },
  { id: 'sleep', textFr: 'Mon horaire de sommeil est irrégulier', textEn: 'My sleep schedule is irregular' },
]

export function SymptomsPage({ onComplete }: SymptomsPageProps) {
  const { locale } = useLocale()
  const isFr = locale === 'fr'
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [showAnalyzing, setShowAnalyzing] = useState(false)

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    )
  }

  const handleContinue = () => {
    setShowAnalyzing(true)
    setTimeout(() => {
      onComplete()
    }, 2000)
  }

  if (showAnalyzing) {
    return (
      <div className="min-h-screen bg-white px-6 py-16 flex flex-col justify-center items-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-[#00C27A]/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center">
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            }}
            className="w-24 h-24 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-3xl flex items-center justify-center shadow-2xl mb-8 mx-auto"
          >
            <Brain size={40} className="text-white" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-800 mb-4 text-2xl"
          >
            {isFr ? "Analyse de vos symptômes..." : "Analyzing Your Symptoms..."}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 leading-relaxed px-4"
          >
            {isFr 
              ? "Nous créons un profil de productivité personnalisé basé sur vos réponses"
              : "We're creating a personalized productivity profile based on your answers"}
          </motion.p>

          <div className="flex gap-2 mt-8 justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2.5 h-2.5 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-full"
                animate={{
                  y: [0, -12, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white px-6 py-12 flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-[#00C27A]/10 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Brain size={48} className="text-white" />
          </div>
          <h1 className="text-gray-900 mb-4 text-5xl">
            {isFr ? "Parlez-nous de vos symptômes" : "Tell Us About Your Symptoms"}
          </h1>
          <p className="text-gray-600 leading-relaxed text-2xl">
            {isFr 
              ? "Sélectionnez tout ce qui s'applique pour obtenir une analyse personnalisée"
              : "Select all that apply to get a personalized analysis"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-3 mb-12"
        >
          <div className="h-2 w-20 bg-[#00C27A] rounded-full shadow-sm" />
          <div className="h-2 w-20 bg-[#00C27A] rounded-full shadow-sm" />
          <div className="h-2 w-20 bg-[#00C27A] rounded-full shadow-sm" />
          <div className="h-2 w-20 bg-[#00C27A]/30 rounded-full" />
        </motion.div>

        <div className="flex-1 space-y-4 mb-8">
          {symptoms.map((symptom, index) => {
            const isSelected = selectedSymptoms.includes(symptom.id)
            
            return (
              <motion.button
                key={symptom.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                onClick={() => toggleSymptom(symptom.id)}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-6 rounded-3xl border-2 transition-all text-left flex items-center gap-5 ${
                  isSelected
                    ? 'border-[#00C27A] bg-gradient-to-br from-[#00C27A]/10 to-[#00D68F]/5 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300 shadow-md'
                }`}
              >
                <div className={`flex-shrink-0 ${isSelected ? 'text-[#00C27A]' : 'text-gray-300'}`}>
                  {isSelected ? (
                    <CheckCircle2 size={32} />
                  ) : (
                    <Circle size={32} />
                  )}
                </div>
                <span className={`text-xl ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                  {isFr ? symptom.textFr : symptom.textEn}
                </span>
              </motion.button>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-3xl p-6 mb-8 shadow-md"
        >
          <p className="text-lg text-gray-700 text-center leading-relaxed">
            <span className="text-blue-600 text-2xl">💡</span> {isFr 
              ? "Basé sur vos symptômes, nous créerons un plan personnalisé pour booster votre productivité"
              : "Based on your symptoms, we'll create a custom plan to boost your productivity"}
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          onClick={handleContinue}
          disabled={selectedSymptoms.length === 0}
          whileHover={selectedSymptoms.length > 0 ? { scale: 1.02 } : {}}
          whileTap={selectedSymptoms.length > 0 ? { scale: 0.98 } : {}}
          className={`w-full py-6 rounded-3xl transition-all flex items-center justify-center gap-3 shadow-xl ${
            selectedSymptoms.length > 0
              ? 'bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span className="text-2xl">{isFr ? "Découvrir mon profil" : "Discover My Profile"}</span>
          <ArrowRight size={28} />
        </motion.button>

        {selectedSymptoms.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-lg text-gray-500 mt-4"
          >
            {selectedSymptoms.length} {isFr ? "symptôme" : "symptom"}{selectedSymptoms.length !== 1 ? (isFr ? "s" : "s") : ""} {isFr ? "sélectionné" : "selected"}
          </motion.p>
        )}
      </div>
    </div>
  )
}

