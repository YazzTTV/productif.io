"use client"

import { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { OnboardingQuestion } from '@/components/onboarding/onboarding-question'
import { ProcessingPage } from '@/components/onboarding/processing-page'
import { ProfileRevealScreen } from '@/components/onboarding/profile-reveal-screen'
import { SymptomsPage } from '@/components/onboarding/symptoms-page'
import { TestimonialsPage } from '@/components/onboarding/testimonials-page'
import { useLocale } from '@/lib/i18n'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Zap, Target, TrendingUp, Users, Brain, MessageCircle, BarChart3 } from 'lucide-react'

export const dynamic = 'force-dynamic'

type QuestionOption = { id: string; text: string }
type Question = {
  question: string
  options: QuestionOption[]
  socialProof?: string
}

const questionsEn: Question[] = [
  {
    question: "When you work on an important project, you tend to…",
    options: [
      { id: 'A', text: "Get lost in details" },
      { id: 'B', text: "Procrastinate" },
      { id: 'C', text: "Jump between tasks" },
      { id: 'D', text: "Start strong, then lose motivation" }
    ]
  },
  {
    question: "At the end of your day, you usually feel…",
    options: [
      { id: 'A', text: "Frustrated for not doing enough" },
      { id: 'B', text: "Tired without knowing why" },
      { id: 'C', text: "Proud, but unclear about the big picture" },
      { id: 'D', text: "Lost in your priorities" }
    ]
  },
  {
    question: "Your phone while working is…",
    options: [
      { id: 'A', text: "My worst enemy" },
      { id: 'B', text: "'Just 2 minutes'… then 2 hours later" },
      { id: 'C', text: "I put it away but take it back" },
      { id: 'D', text: "I've learned to manage it" }
    ],
    socialProof: "You're not alone — 92% of Productif.io users had the same issue before starting."
  },
  {
    question: "When do you feel most productive?",
    options: [
      { id: 'A', text: "Early morning (5am-9am)" },
      { id: 'B', text: "Midday (10am-2pm)" },
      { id: 'C', text: "Afternoon/Evening (3pm-8pm)" },
      { id: 'D', text: "Late night (9pm+)" }
    ],
    socialProof: "Understanding your peak hours helps us optimize your schedule for maximum focus."
  },
  {
    question: "How do you handle breaks during work?",
    options: [
      { id: 'A', text: "I forget to take them" },
      { id: 'B', text: "Short breaks turn into long ones" },
      { id: 'C', text: "I take them but feel guilty" },
      { id: 'D', text: "I schedule them strategically" }
    ]
  },
  {
    question: "What's your main goal right now?",
    options: [
      { id: 'A', text: "Grow my business/project" },
      { id: 'B', text: "Manage my studies better" },
      { id: 'C', text: "Build discipline" },
      { id: 'D', text: "Find work-life balance" }
    ]
  }
]

const questionsFr: Question[] = [
  {
    question: "Quand vous travaillez sur un projet important, vous avez tendance à…",
    options: [
      { id: 'A', text: "Vous perdre dans les détails" },
      { id: 'B', text: "Procrastiner" },
      { id: 'C', text: "Passer d'une tâche à l'autre" },
      { id: 'D', text: "Commencer fort, puis perdre la motivation" }
    ]
  },
  {
    question: "À la fin de votre journée, vous vous sentez généralement…",
    options: [
      { id: 'A', text: "Frustré de ne pas en avoir fait assez" },
      { id: 'B', text: "Fatigué sans vraiment savoir pourquoi" },
      { id: 'C', text: "Fier, mais sans vision claire d'ensemble" },
      { id: 'D', text: "Perdu dans vos priorités" }
    ]
  },
  {
    question: "Votre téléphone pendant que vous travaillez est…",
    options: [
      { id: 'A', text: "Mon pire ennemi" },
      { id: 'B', text: "'Juste 2 minutes'… puis 2 heures plus tard" },
      { id: 'C', text: "Je le range mais je finis par le reprendre" },
      { id: 'D', text: "J'ai appris à le gérer" }
    ],
    socialProof: "Vous n'êtes pas seul — 92% des utilisateurs de Productif.io avaient le même problème avant de commencer."
  },
  {
    question: "Quand vous sentez-vous le plus productif ?",
    options: [
      { id: 'A', text: "Tôt le matin (5h-9h)" },
      { id: 'B', text: "En milieu de journée (10h-14h)" },
      { id: 'C', text: "L'après-midi / en soirée (15h-20h)" },
      { id: 'D', text: "Tard le soir (21h+)" }
    ],
    socialProof: "Comprendre vos heures de pointe nous aide à optimiser votre planning pour un focus maximal."
  },
  {
    question: "Comment gérez-vous les pauses pendant le travail ?",
    options: [
      { id: 'A', text: "J'oublie de les prendre" },
      { id: 'B', text: "Les pauses courtes deviennent longues" },
      { id: 'C', text: "Je les prends mais je me sens coupable" },
      { id: 'D', text: "Je les planifie stratégiquement" }
    ]
  },
  {
    question: "Quel est votre objectif principal en ce moment ?",
    options: [
      { id: 'A', text: "Faire grandir mon business / projet" },
      { id: 'B', text: "Mieux gérer mes études" },
      { id: 'C', text: "Construire plus de discipline" },
      { id: 'D', text: "Trouver un meilleur équilibre vie / travail" }
    ]
  }
]

const profileTypesEn: { [key: string]: { type: string; emoji: string; description: string } } = {
  'AAAA': {
    type: 'The Focused Perfectionist',
    emoji: '🎯',
    description: "You have incredible attention to detail and high standards. What's missing is knowing when to move forward. Productif.io helps you balance perfection with progress."
  },
  'BBBB': {
    type: 'The Overwhelmed Strategist',
    emoji: '🔥',
    description: "You have ambitious goals but struggle with execution. What's missing is a clear action plan. Productif.io turns your vision into daily wins."
  },
  'CCCC': {
    type: 'The Determined Scatterbrain',
    emoji: '🌀',
    description: "You have the energy and ambition — what's missing is clarity and structure. Productif.io helps you turn your chaos into focus with your personal AI coach."
  },
  'DDDD': {
    type: 'The Motivated Explorer',
    emoji: '🚀',
    description: "You start strong and love new challenges. What's missing is sustainable momentum. Productif.io keeps you engaged and on track every day."
  },
  'default': {
    type: 'The Ambitious Achiever',
    emoji: '💭',
    description: "You have the drive and potential — what's missing is the right system. Productif.io provides the structure and insights to help you reach your goals consistently."
  }
}

const profileTypesFr: { [key: string]: { type: string; emoji: string; description: string } } = {
  'AAAA': {
    type: 'Le Perfectionniste Focalisé',
    emoji: '🎯',
    description: "Vous avez une attention incroyable aux détails et des standards élevés. Ce qui manque, c’est savoir quand avancer. Productif.io vous aide à équilibrer perfection et progrès."
  },
  'BBBB': {
    type: 'Le Stratège Débordé',
    emoji: '🔥',
    description: "Vous avez des objectifs ambitieux mais vous luttez sur l’exécution. Ce qui manque, c’est un plan d’action clair. Productif.io transforme votre vision en victoires quotidiennes."
  },
  'CCCC': {
    type: 'L’Étourdi Déterminé',
    emoji: '🌀',
    description: "Vous avez l’énergie et l’ambition — ce qui manque, c’est la clarté et la structure. Productif.io vous aide à transformer votre chaos en focus avec votre coach IA personnel."
  },
  'DDDD': {
    type: 'L’Explorateur Motivé',
    emoji: '🚀',
    description: "Vous commencez fort et adorez les nouveaux défis. Ce qui manque, c’est un élan durable. Productif.io vous garde engagé et sur la bonne voie chaque jour."
  },
  'default': {
    type: 'L’Ambitieux Performant',
    emoji: '💭',
    description: "Vous avez le potentiel et l’envie — ce qui manque, c’est le bon système. Productif.io vous donne la structure et les insights pour avancer de façon régulière."
  }
}

type OnboardingStep = 'questions' | 'processing' | 'profile'

// Composant d'onboarding avec sauvegarde des réponses
function OldOnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useLocale()
  const step = searchParams.get('step') as OnboardingStep | null
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(step || 'questions')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [userProfile, setUserProfile] = useState<{ type: string; emoji: string; description: string } | null>(null)
  const auth = useAuthInfo()

  const questions = locale === 'fr' ? questionsFr : questionsEn
  const profileTypes = locale === 'fr' ? profileTypesFr : profileTypesEn

  // Sauvegarder les réponses quand elles changent
  useEffect(() => {
    if (!auth.isAuthenticated || answers.length === 0) return

    const saveAnswers = async () => {
      try {
        // Mapper les réponses du questionnaire aux champs de la base de données
        const payload: any = {
          language: locale === 'fr' ? 'fr' : 'en',
          currentStep: currentQuestionIndex + 1,
          completed: currentStep === 'profile'
        }

        // Si on a au moins 3 réponses, on peut remplir les champs du questionnaire
        if (answers.length >= 1) payload.diagBehavior = answers[0] === 'A' ? 'details' : answers[0] === 'B' ? 'procrastination' : answers[0] === 'C' ? 'distraction' : 'abandon'
        if (answers.length >= 2) payload.timeFeeling = answers[1] === 'A' ? 'frustrated' : answers[1] === 'B' ? 'tired' : answers[1] === 'C' ? 'proud' : 'lost'
        if (answers.length >= 3) payload.phoneHabit = answers[2] === 'A' ? 'enemy' : answers[2] === 'B' ? 'twoMinutes' : answers[2] === 'C' ? 'farButBack' : 'managed'

        console.log('[ONBOARDING] 💾 Sauvegarde des réponses:', payload)

        const response = await fetch('/api/onboarding/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          console.error('[ONBOARDING] ❌ Erreur sauvegarde:', response.status)
        } else {
          console.log('[ONBOARDING] ✅ Réponses sauvegardées')
        }
      } catch (error) {
        console.error('[ONBOARDING] ❌ Erreur:', error)
      }
    }

    const timeoutId = setTimeout(saveAnswers, 500)
    return () => clearTimeout(timeoutId)
  }, [answers, currentQuestionIndex, currentStep, auth.isAuthenticated, locale])

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Calculate profile
      const answerKey = newAnswers.join('')
      const profile = profileTypes[answerKey] || profileTypes['default']
      setUserProfile(profile)
      setCurrentStep('processing')
      router.push('/onboarding?step=processing')
    }
  }

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      const newAnswers = answers.slice(0, -1)
      setAnswers(newAnswers)
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    } else {
      router.push('/onboarding/intro')
    }
  }

  const handleProcessingComplete = () => {
    setCurrentStep('profile')
    router.push('/onboarding?step=profile')
  }

  const currentQuestion = questions[currentQuestionIndex]

  if (currentStep === 'processing') {
    return <ProcessingPage onComplete={handleProcessingComplete} />
  }

  if (currentStep === 'profile' && userProfile) {
    return (
      <ProfileRevealScreen
        profileType={userProfile.type}
        profileEmoji={userProfile.emoji}
        description={userProfile.description}
      />
    )
  }

  return (
    <OnboardingQuestion
      key={currentQuestionIndex}
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={questions.length}
      question={currentQuestion.question}
      options={currentQuestion.options}
      onAnswer={handleAnswer}
      onBack={handleBack}
      socialProof={currentQuestion.socialProof}
    />
  )
}

const TRANSLATIONS = {
  en: {
    step2Title: "Choose your language",
    step2Description: "Select the language for the rest of the onboarding",
    step3Title: "Discover the key features",
    step4Title: "What people say",
    step6EarlyAccess: "Early access",
    step6Waitlist: "Join the waitlist",
    step5QuizTitle: "Discover your productivity profile.",
    step5QuizDescription: "Answer 4 questions to find out why you're not moving forward… and how Productif.io can help you skyrocket your results.",
    step5QuizCTA: "Let's go",
    step5QuizTime: "Estimated time: 1 minute",
    step5QuizQuickQuestions: "A few quick questions to understand your habits",
    step7ProfileTitle: "Your profile",
    step7ProfileDescription: "Based on your answers, we'll tailor your interface and priorities for faster execution.",
    step8SetupInProgress: "One moment, we're setting up your workspace…",
    step8SetupComplete: "Setup complete",
    step8SetupDescription: "Personalizing habits, priorities, and notifications.",
    step9Title: "Activate your assistant now — 7‑day free trial",
    step9Description: "You've got the energy and ambition. Your biggest blocker is clarity and structure. Productif.io helps you turn chaos into focus with your personal AI assistant.",
    step9Monthly: "Monthly",
    step9Yearly: "Yearly (-€60)",
    step9Save: "save €60",
    step9BilledMonthly: "Billed monthly",
    step9BilledYearly: "Billed yearly",
    step9Feature1Title: "AI-powered task management",
    step9Feature1Desc: "Your AI organizes, prioritizes, and suggests what to tackle next.",
    step9Feature2Title: "WhatsApp AI assistant",
    step9Feature2Desc: "Rappels intelligents et conseils sans ouvrir une autre application.",
    step9Feature3Title: "Habits & goals that stick",
    step9Feature3Desc: "Build adaptive routines with contextual reminders; track OKRs.",
    step9Feature4Title: "Complete privacy & lifetime updates",
    step9Feature4Desc: "Your data stays yours. Encryption, backups, future updates included.",
    step9StartNow: "Start Now for Free",
    step9Start: "Start",
    step9Skip: "Skip – continue free trial",
    buttonBack: "Back",
    buttonContinue: "Continue",
    buttonNext: "Next",
    buttonSkip: "Skip",
    buttonPrevious: "Previous",
    testimonial1: "I finally have a real co‑pilot that keeps me aligned.",
    testimonial2: "The dashboard showed me where I was truly blocked.",
    testimonial3: "The AI nudges me at the right time and I execute faster.",
    profileDistractor: "The determined distractor",
    profileStrategist: "The overwhelmed strategist",
    profileDreamer: "The disorganized dreamer",
    profileOrganizer: "The motivated organizer",
    question: "Question",
    analysis92: "You're not alone: 92% of Productif.io users have this problem before starting.",
    step6EarlyAccessDesc: "Early access for €1 — Limited spots.",
    step6EarlyAccessButton: "Pay €1 now",
    step6EarlyAccessLoading: "Redirecting…",
    step6WaitlistDesc: "Join the waitlist for free.",
    step6WaitlistButton: "Join",
    step6WaitlistLoading: "Validating…",
    step6Later: "Later",
  },
  fr: {
    step2Title: "Choisissez votre langue",
    step2Description: "Sélectionnez la langue pour la suite de l'onboarding",
    step3Title: "Découvrez les fonctionnalités clés",
    step4Title: "Ce qu'ils en disent",
    step6EarlyAccess: "Accès anticipé",
    step6Waitlist: "Rejoindre la liste d'attente",
    step5QuizTitle: "Découvrez votre profil de productivité.",
    step5QuizDescription: "Répondez à 4 questions pour découvrir pourquoi vous n'avancez pas… et comment Productif.io peut vous aider à faire décoller vos résultats.",
    step5QuizCTA: "C'est parti",
    step5QuizTime: "Temps estimé : 1 minute",
    step5QuizQuickQuestions: "Quelques questions rapides pour comprendre vos habitudes",
    step7ProfileTitle: "Votre profil",
    step7ProfileDescription: "D'après vos réponses, nous allons personnaliser votre interface et vos priorités pour une exécution plus rapide.",
    step8SetupInProgress: "Un instant, nous configurons votre espace de travail…",
    step8SetupComplete: "Configuration terminée",
    step8SetupDescription: "Personnalisation des habitudes, priorités et notifications.",
    step9Title: "Activez votre assistant maintenant — 7 jours d'essai gratuit",
    step9Description: "Vous avez l'énergie et l'ambition. Votre plus gros blocage est la clarté et la structure. Productif.io vous aide à transformer le chaos en focus avec votre assistant IA personnel.",
    step9Monthly: "Mensuel",
    step9Yearly: "Annuel (-60€)",
    step9Save: "économisez 60€",
    step9BilledMonthly: "Facturé mensuellement",
    step9BilledYearly: "Facturé annuellement",
    step9Feature1Title: "Gestion des tâches par IA",
    step9Feature1Desc: "Votre IA organise, priorise et suggère quoi faire ensuite.",
    step9Feature2Title: "Assistant IA WhatsApp",
    step9Feature2Desc: "Rappels intelligents et conseils sans ouvrir une autre application.",
    step9Feature3Title: "Habitudes & objectifs qui tiennent",
    step9Feature3Desc: "Construisez des routines adaptatives avec des rappels contextuels ; suivez vos OKR.",
    step9Feature4Title: "Confidentialité totale & mises à jour à vie",
    step9Feature4Desc: "Vos données restent les vôtres. Chiffrement, sauvegardes, mises à jour futures incluses.",
    step9StartNow: "Commencer maintenant gratuitement",
    step9Start: "Commencer",
    step9Skip: "Passer – continuer l'essai gratuit",
    buttonBack: "Retour",
    buttonContinue: "Continuer",
    buttonNext: "Suivant",
    buttonSkip: "Passer",
    buttonPrevious: "Précédent",
    testimonial1: "J'ai enfin un vrai copilote qui me garde aligné.",
    testimonial2: "Le tableau de bord m'a montré où j'étais vraiment bloqué.",
    testimonial3: "L'IA me relance au bon moment et j'exécute plus vite.",
    profileDistractor: "Le distrait déterminé",
    profileStrategist: "Le stratège submergé",
    profileDreamer: "Le rêveur désorganisé",
    profileOrganizer: "L'organisateur motivé",
    question: "Question",
    analysis92: "Vous n'êtes pas seul : 92% des utilisateurs de Productif.io ont ce problème avant de commencer.",
    step6EarlyAccessDesc: "Accès anticipé pour 1€ — Places limitées.",
    step6EarlyAccessButton: "Payer 1€ maintenant",
    step6EarlyAccessLoading: "Redirection…",
    step6WaitlistDesc: "Rejoindre la liste d'attente gratuitement.",
    step6WaitlistButton: "Rejoindre",
    step6WaitlistLoading: "Validation…",
    step6Later: "Plus tard",
  },
}

type Questionnaire = {
  mainGoal: string
  role: string
  frustration: string
  whatsappNumber: string
  whatsappConsent: boolean
  language: "fr" | "en"
  diagBehavior?: "details" | "procrastination" | "distraction" | "abandon"
  timeFeeling?: "frustrated" | "tired" | "proud" | "lost"
  phoneHabit?: "enemy" | "twoMinutes" | "farButBack" | "managed"
}

type AuthInfo = {
  isAuthenticated: boolean
  email: string
}

function useAuthInfo() {
  const [auth, setAuth] = useState<AuthInfo>({ isAuthenticated: false, email: "" })

  useEffect(() => {
    let isMounted = true
    const fetchAuth = async () => {
      try {
        console.log('[AUTH] 🔍 Vérification de l\'authentification...')
        const res = await fetch("/api/auth/me", { credentials: "include" })
        console.log('[AUTH] Réponse reçue:', res.status, res.ok)
        if (res.ok) {
          const data = await res.json()
          console.log('[AUTH] ✅ Utilisateur authentifié:', data.user?.email)
          if (isMounted) setAuth({ isAuthenticated: true, email: data.user?.email || "" })
        } else {
          console.log('[AUTH] ❌ Utilisateur non authentifié')
        }
      } catch (error) {
        console.error('[AUTH] ❌ Erreur lors de la vérification:', error)
      }
    }
    fetchAuth()
    return () => {
      isMounted = false
    }
  }, [])

  return auth
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useLocale()

  const offer = searchParams.get("offer") || "early-access"
  const utmParams = useMemo(() => {
    const entries: [string, string][] = []
    searchParams.forEach((v, k) => {
      if (k.startsWith("utm_") || k === "ref") entries.push([k, v])
    })
    return Object.fromEntries(entries)
  }, [searchParams])

  const [step, setStep] = useState<number>(1)
  const [featureIndex, setFeatureIndex] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [emailFallback, setEmailFallback] = useState<string>("")
  const [password, setPassword] = useState<string>("")

  const [answers, setAnswers] = useState<Questionnaire>({
    mainGoal: "",
    role: "",
    frustration: "",
    whatsappNumber: "",
    whatsappConsent: false,
    language: locale === "fr" ? "fr" : "en",
  })

  const auth = useAuthInfo()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')
  
  // Log de l'état d'authentification pour débogage
  useEffect(() => {
    console.log('[ONBOARDING] État d\'authentification:', {
      isAuthenticated: auth.isAuthenticated,
      email: auth.email,
      step: step
    })
  }, [auth.isAuthenticated, auth.email, step])

  // Charger les données depuis localStorage ou la base de données
  useEffect(() => {
    const loadData = async () => {
      // D'abord charger depuis localStorage (pour les utilisateurs non connectés)
      const saved = localStorage.getItem("onboarding_progress")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.step) setStep(parsed.step)
          if (parsed.answers) setAnswers(parsed.answers)
          if (parsed.emailFallback) setEmailFallback(parsed.emailFallback)
        } catch {
          // ignore
        }
      }

      // Si l'utilisateur est authentifié, charger depuis la base de données
      if (auth.isAuthenticated) {
        try {
          const response = await fetch('/api/onboarding/data', {
            credentials: 'include'
          })
          if (response.ok) {
            const { data } = await response.json()
            if (data) {
              // Mettre à jour avec les données de la base
              setStep(data.currentStep || 1)
              setAnswers({
                mainGoal: data.mainGoal || "",
                role: data.role || "",
                frustration: data.frustration || "",
                whatsappNumber: data.whatsappNumber || "",
                whatsappConsent: data.whatsappConsent || false,
                language: (data.language as "fr" | "en") || "fr",
                diagBehavior: data.diagBehavior as any,
                timeFeeling: data.timeFeeling as any,
                phoneHabit: data.phoneHabit as any,
              })
              if (data.emailFallback) setEmailFallback(data.emailFallback)
              if (data.billingCycle) setBillingCycle(data.billingCycle as 'monthly' | 'yearly')
            }
          }
        } catch (error) {
          console.error('Erreur chargement onboarding depuis DB:', error)
          // Continuer avec les données localStorage si la DB échoue
        }
      }
    }

    loadData()
  }, [auth.isAuthenticated])

  // Sauvegarder dans localStorage
  useEffect(() => {
    localStorage.setItem(
      "onboarding_progress",
      JSON.stringify({ step, answers, emailFallback, offer, utmParams })
    )
  }, [step, answers, emailFallback, offer, utmParams])

  // Sauvegarder en base de données si l'utilisateur est authentifié
  useEffect(() => {
    if (!auth.isAuthenticated) {
      console.log('[ONBOARDING] ⚠️ Sauvegarde ignorée - utilisateur non authentifié')
      return
    }

    const saveToDatabase = async () => {
      try {
        console.log('[ONBOARDING] 💾 Tentative de sauvegarde:', {
          isAuthenticated: auth.isAuthenticated,
          step: step,
          answers: answers
        })
        
        const response = await fetch('/api/onboarding/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            mainGoal: answers.mainGoal,
            role: answers.role,
            frustration: answers.frustration,
            language: answers.language,
            whatsappNumber: answers.whatsappNumber,
            whatsappConsent: answers.whatsappConsent,
            diagBehavior: answers.diagBehavior,
            timeFeeling: answers.timeFeeling,
            phoneHabit: answers.phoneHabit,
            offer,
            utmParams,
            emailFallback,
            billingCycle,
            currentStep: step,
            completed: step >= 9
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('[ONBOARDING] ❌ Erreur sauvegarde:', response.status, errorData)
        } else {
          const result = await response.json()
          console.log('[ONBOARDING] ✅ Sauvegarde réussie:', result)
        }
      } catch (error) {
        console.error('[ONBOARDING] ❌ Erreur sauvegarde onboarding:', error)
        // Ne pas bloquer l'utilisateur si la sauvegarde échoue
      }
    }

    // Délai pour éviter trop de requêtes
    const timeoutId = setTimeout(saveToDatabase, 500)
    return () => clearTimeout(timeoutId)
  }, [auth.isAuthenticated, step, answers, emailFallback, offer, utmParams, billingCycle])

  // Si déjà connecté, passer automatiquement à l'étape 2 (sauf si une étape supérieure est déjà sauvegardée)
  useEffect(() => {
    if (auth.isAuthenticated && step === 1) {
      setStep((s) => Math.max(s, 2))
    }
  }, [auth.isAuthenticated, step])

  const next = () => setStep((s) => Math.min(s + 1, 9))
  const prev = () => setStep((s) => Math.max(s - 1, 1))

  const currentEmail = auth.isAuthenticated ? auth.email : emailFallback

  // Étape 4 — Questionnaire interactif
  const [q4Stage, setQ4Stage] = useState<number>(0) // 0=intro, 1..4 questions
  const [q4Selections, setQ4Selections] = useState<Record<number, string>>({})

  // Traductions dynamiques basées sur la langue sélectionnée
  const t = answers.language === "fr" ? TRANSLATIONS.fr : TRANSLATIONS.en

  const q4Questions = answers.language === "fr" ? [
    {
      key: "diagBehavior" as const,
      title: "Quand vous travaillez sur un projet important, vous avez tendance à…",
      options: [
        { key: "details", label: "Vous perdre dans les détails" },
        { key: "procrastination", label: "Le remettre à demain" },
        { key: "distraction", label: "Vous laisser distraire par d'autres tâches" },
        { key: "abandon", label: "Commencer fort… puis l'abandonner" },
      ],
    },
    {
      key: "timeFeeling" as const,
      title: "À la fin de votre journée, vous vous sentez plutôt…",
      options: [
        { key: "frustrated", label: "Frustré de ne pas en avoir fait assez" },
        { key: "tired", label: "Fatigué sans savoir pourquoi" },
        { key: "proud", label: "Fier mais sans vision claire" },
        { key: "lost", label: "Complètement perdu dans vos priorités" },
      ],
    },
    {
      key: "phoneHabit" as const,
      title: "Votre téléphone pendant que vous travaillez, c'est…",
      options: [
        { key: "enemy", label: "Mon pire ennemi" },
        { key: "twoMinutes", label: "Je l'ouvre 'juste 2 minutes'… puis 2 heures passent" },
        { key: "farButBack", label: "Je le range mais je finis par le reprendre" },
        { key: "managed", label: "J'ai appris à le gérer" },
      ],
      analysis: "Vous n'êtes pas seul : 92% des utilisateurs de Productif.io ont ce problème avant de commencer.",
    },
    {
      key: "mainGoal" as const,
      title: "Quel est votre objectif principal aujourd'hui ?",
      options: [
        { key: "Launch", label: "Lancer / développer mon projet" },
        { key: "Study", label: "Mieux gérer mes études" },
        { key: "Discipline", label: "Être plus discipliné" },
        { key: "Balance", label: "Trouver un équilibre entre travail et vie personnelle" },
      ],
    },
  ] : [
    {
      key: "diagBehavior" as const,
      title: "When you work on an important project, you tend to…",
      options: [
        { key: "details", label: "Get lost in the details" },
        { key: "procrastination", label: "Put it off until tomorrow" },
        { key: "distraction", label: "Get distracted by other tasks" },
        { key: "abandon", label: "Start strong… then abandon it" },
      ],
    },
    {
      key: "timeFeeling" as const,
      title: "At the end of your day, you feel rather…",
      options: [
        { key: "frustrated", label: "Frustrated that you didn't do enough" },
        { key: "tired", label: "Tired without knowing why" },
        { key: "proud", label: "Proud but without a clear vision" },
        { key: "lost", label: "Completely lost in your priorities" },
      ],
    },
    {
      key: "phoneHabit" as const,
      title: "Your phone while you work is…",
      options: [
        { key: "enemy", label: "My worst enemy" },
        { key: "twoMinutes", label: "I open it 'just for 2 minutes'… then 2 hours pass" },
        { key: "farButBack", label: "I put it away but end up picking it back up" },
        { key: "managed", label: "I've learned to manage it" },
      ],
      analysis: "You're not alone: 92% of Productif.io users have this problem before starting.",
    },
    {
      key: "mainGoal" as const,
      title: "What is your main goal today?",
      options: [
        { key: "Launch", label: "Launch / grow my project" },
        { key: "Study", label: "Better manage my studies" },
        { key: "Discipline", label: "Be more disciplined" },
        { key: "Balance", label: "Find a balance between work and personal life" },
      ],
    },
  ]

  const handleQ4Select = (stage: number, key: string, label: string) => {
    setQ4Selections((prev) => ({ ...prev, [stage]: key }))
    const idx = stage - 1
    const meta = q4Questions[idx]
    if (!meta) return
    
    // Mettre à jour les réponses
    setAnswers((prev) => {
      const updated = { ...prev }
      if (meta.key === "diagBehavior") updated.diagBehavior = key as any
      if (meta.key === "timeFeeling") updated.timeFeeling = key as any
      if (meta.key === "phoneHabit") updated.phoneHabit = key as any
      if (meta.key === "mainGoal") updated.mainGoal = label
      
      // Sauvegarder immédiatement si l'utilisateur est authentifié
      if (auth.isAuthenticated) {
        console.log(`[Q4] Sauvegarde immédiate - ${meta.key} = ${key}`, {
          authenticated: auth.isAuthenticated,
          email: auth.email,
          updatedAnswers: updated
        })
        
        // Utiliser les valeurs mises à jour directement
        fetch('/api/onboarding/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            mainGoal: updated.mainGoal,
            role: updated.role,
            frustration: updated.frustration,
            language: updated.language,
            whatsappNumber: updated.whatsappNumber,
            whatsappConsent: updated.whatsappConsent,
            diagBehavior: updated.diagBehavior,
            timeFeeling: updated.timeFeeling,
            phoneHabit: updated.phoneHabit,
            offer,
            utmParams,
            emailFallback,
            billingCycle,
            currentStep: step,
            completed: step >= 9
          })
        }).then(async response => {
          if (!response.ok) {
            const errorText = await response.text().catch(() => '')
            console.error('❌ [Q4] Erreur sauvegarde immédiate:', response.status, errorText)
          } else {
            console.log(`✅ [Q4] Réponse sauvegardée: ${meta.key} = ${key}`)
          }
        }).catch(error => {
          console.error('❌ [Q4] Erreur sauvegarde immédiate:', error)
        })
      } else {
        console.warn('⚠️ [Q4] Utilisateur NON authentifié lors de la sélection Q4', {
          isAuthenticated: auth.isAuthenticated,
          email: auth.email
        })
      }
      
      return updated
    })
  }

  // Determine a dynamic profile from answers (labels + emoji)
  const getProfileMeta = (q: Questionnaire): { label: string; emoji: string } => {
    if (q.diagBehavior === "distraction") return { label: t.profileDistractor, emoji: "💭" }
    if (q.diagBehavior === "details") return { label: t.profileStrategist, emoji: "🔥" }
    if (q.timeFeeling === "lost" || q.diagBehavior === "abandon") return { label: t.profileDreamer, emoji: "🌀" }
    return { label: t.profileOrganizer, emoji: "🚀" }
  }

  // Écran de configuration (chargement 4s)
  const [setupDone, setSetupDone] = useState<boolean>(false)
  useEffect(() => {
    if (step === 8) {
      setSetupDone(false)
      const t = setTimeout(() => setSetupDone(true), 4000)
      return () => clearTimeout(t)
    }
  }, [step])

  // Inscription directe depuis l'onboarding puis connexion automatique
  const handleSignupWithEmail = async () => {
    if (!emailFallback || !password) {
      setError("Email et mot de passe requis")
      return
    }
    setLoading(true)
    setError("")
    try {
      // 1) Tentative de création du compte
      const defaultName = emailFallback.split("@")[0] || "Utilisateur"
      const registerResp = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: defaultName, email: emailFallback, password })
      })

      // 2) Si l'email existe déjà (409), on passe directement au login
      if (!registerResp.ok && registerResp.status !== 409) {
        const data = await registerResp.json().catch(() => ({}))
        throw new Error(data.error || "Impossible de créer le compte")
      }

      // 3) Connexion
      const loginResp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailFallback, password })
      })
      if (!loginResp.ok) {
        const data = await loginResp.json().catch(() => ({}))
        throw new Error(data.error || "Connexion automatique échouée")
      }

      // 4) Sauvegarder progression et recharger sur /onboarding (pour prendre le cookie en compte)
      try {
        const saved = JSON.parse(localStorage.getItem("onboarding_progress") || "{}")
        localStorage.setItem(
          "onboarding_progress",
          JSON.stringify({ ...saved, step: 2, emailFallback })
        )
      } catch {}
      window.location.assign("/onboarding")
    } catch (e: any) {
      setError(e?.message || "Erreur inconnue lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotificationPrefs = async () => {
    if (!auth.isAuthenticated || !answers.whatsappConsent || !answers.whatsappNumber) return
    try {
      await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "self",
          isEnabled: true,
          emailEnabled: true,
          pushEnabled: false,
          whatsappEnabled: true,
          whatsappNumber: answers.whatsappNumber,
          startHour: 9,
          endHour: 18,
          allowedDays: [1, 2, 3, 4, 5],
          notificationTypes: ["DAILY_SUMMARY", "TASK_DUE", "HABIT_REMINDER"],
          morningReminder: true,
          taskReminder: true,
          habitReminder: true,
          motivation: true,
          dailySummary: true,
          morningTime: "08:00",
          noonTime: "12:00",
          afternoonTime: "14:00",
          eveningTime: "18:00",
          nightTime: "22:00",
        }),
        credentials: "include",
      })
    } catch {
      // ignore errors for now
    }
  }

  const handleStartPayment = async () => {
    if (!currentEmail) {
      setError("Email requis pour continuer")
      return
    }

    setLoading(true)
    setError("")
    try {
      // Récupérer l'ID utilisateur depuis l'auth
      const resp = await fetch("/api/auth/me")
      if (!resp.ok) throw new Error("Non authentifié")
      const { user } = await resp.json()
      
      if (!user?.id) {
        throw new Error("Utilisateur non trouvé")
      }

      // Créer la session Stripe avec le bon billing cycle
      const stripeResp = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user.id,
          billingType: billingCycle 
        }),
      })
      
      if (!stripeResp.ok) {
        const data = await stripeResp.json().catch(() => ({}))
        throw new Error(data.error || "Erreur lors de la création du paiement")
      }
      
      const data = await stripeResp.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (e: any) {
      setError(e?.message || "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteFreeWaitlist = async () => {
    if (!currentEmail) {
      setError("Email requis pour continuer")
      return
    }
    setLoading(true)
    setError("")
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentEmail, step: 1 }),
      })
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentEmail,
          phone: answers.whatsappNumber || undefined,
          motivation: answers.mainGoal || "onboarding-waitlist",
          step: 2,
        }),
      })
      setStep(7)
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'inscription à la waitlist")
    } finally {
      setLoading(false)
    }
  }

  // Pages en plein écran (symptoms, testimonials)
  if (step === 6 || step === 8) {
    if (step === 6) {
      return <SymptomsPage onComplete={() => setStep(8)} />
    }
    if (step === 8) {
      return <TestimonialsPage onComplete={() => setStep(9)} />
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          {/* Header avec logo (agrandi, sans texte) */}
          <div className="flex items-center justify-center mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/P_tech_letter_logo_TEMPLATE-removebg-preview.png" alt="Productif.io" className="h-16 w-auto object-contain" />
          </div>
          <CardTitle>
            {step === 1 && ""}
            {step === 2 && t.step2Title}
            {step === 3 && t.step3Title}
            {step === 4 && t.step4Title}
            {step === 5 && ""}
            {step === 6 && (offer === "early-access" ? t.step6EarlyAccess : t.step6Waitlist)}
            {step === 7 && ""}
            {step === 8 && ""}
            {step === 9 && ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              {auth.isAuthenticated ? (
                <></>
              ) : (
                <div className="space-y-5">
                  

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
                  >
                    Continue with Google
                  </Button>

                  <div className="flex items-center gap-2">
                    <Separator className="flex-1" />
                    <span className="text-[11px] text-muted-foreground">OR</span>
                    <Separator className="flex-1" />
                  </div>

                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={emailFallback}
                        onChange={(e) => setEmailFallback(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  <Button
                    className="w-full"
                    onClick={handleSignupWithEmail}
                    disabled={loading}
                  >
                    {loading ? "Creating account…" : "Sign up with email"}
                  </Button>
                  </div>

                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account? {""}
                    <Link href="/login?redirect=/onboarding" className="underline underline-offset-4">Sign in</Link>
                  </p>

                  <p className="text-[11px] text-muted-foreground text-center">
                    By continuing, you agree to our {""}
                    <Link href="/terms" className="underline underline-offset-4">Terms of Use</Link> {""}
                    and our {""}
                    <Link href="/privacy-policy" className="underline underline-offset-4">Privacy Policy</Link>.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">{t.step2Title}</h3>
                <p className="text-sm text-muted-foreground">{t.step2Description}</p>
                <div className="grid gap-3 max-w-md mx-auto">
                  <button
                    onClick={() => {
                      setAnswers((prev) => ({ ...prev, language: "fr" }))
                      next()
                    }}
                    className={`text-left rounded-lg border px-6 py-4 hover:bg-emerald-50 transition ${
                      answers.language === "fr" ? "border-emerald-500 bg-emerald-50" : "border-gray-200"
                    }`}
                  >
                    <div className="font-medium">Français</div>
                    <div className="text-sm text-muted-foreground">French</div>
                  </button>
                  <button
                    onClick={() => {
                      setAnswers((prev) => ({ ...prev, language: "en" }))
                      next()
                    }}
                    className={`text-left rounded-lg border px-6 py-4 hover:bg-emerald-50 transition ${
                      answers.language === "en" ? "border-emerald-500 bg-emerald-50" : "border-gray-200"
                    }`}
                  >
                    <div className="font-medium">English</div>
                    <div className="text-sm text-muted-foreground">Anglais</div>
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={prev}>{t.buttonBack}</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">{t.step3Title}</h3>
                <p className="text-sm text-muted-foreground">
                  {answers.language === 'fr' 
                    ? 'Productif.io vous aide à rester concentré et organisé'
                    : 'Productif.io helps you stay focused and organized'}
                </p>
                <div className="grid gap-4 max-w-md mx-auto">
                  <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Brain className="h-8 w-8 text-[#00C27A]" />
                      <div className="text-left">
                        <div className="font-medium">
                          {answers.language === 'fr' ? 'Assistant IA personnel' : 'Personal AI Assistant'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {answers.language === 'fr' ? 'Organisez vos tâches intelligemment' : 'Organize your tasks intelligently'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Target className="h-8 w-8 text-[#00C27A]" />
                      <div className="text-left">
                        <div className="font-medium">
                          {answers.language === 'fr' ? 'Suivi des habitudes' : 'Habit Tracking'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {answers.language === 'fr' ? 'Construisez des routines durables' : 'Build lasting routines'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-8 w-8 text-[#00C27A]" />
                      <div className="text-left">
                        <div className="font-medium">
                          {answers.language === 'fr' ? 'Analyses avancées' : 'Advanced Analytics'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {answers.language === 'fr' ? 'Suivez vos progrès en temps réel' : 'Track your progress in real-time'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={prev}>{t.buttonBack}</Button>
                <Button onClick={next}>{t.buttonContinue}</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Testimonial 1 */}
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/testimonials/benjamin-courdrais.jpg" alt="Alex" className="h-9 w-9 rounded-full object-cover" />
                    <div>
                      <div className="text-sm font-medium">Alex</div>
                      <div className="text-xs text-muted-foreground">Maker</div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6">"{t.testimonial1}"</p>
                </div>

                {/* Testimonial 2 */}
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/testimonials/gaetan-silgado.jpg" alt="Léa" className="h-9 w-9 rounded-full object-cover" />
                    <div>
                      <div className="text-sm font-medium">Léa</div>
                      <div className="text-xs text-muted-foreground">Manager</div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6">"{t.testimonial2}"</p>
                </div>

                {/* Testimonial 3 */}
                <div className="rounded-2xl border bg-white p-4 shadow-sm sm:col-span-2">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/testimonials/sabrina.jpg" alt="Sabrina" className="h-9 w-9 rounded-full object-cover" />
                    <div>
                      <div className="text-sm font-medium">Sabrina</div>
                      <div className="text-xs text-muted-foreground">Entrepreneur</div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6">"{t.testimonial3}"</p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={prev}>{t.buttonBack}</Button>
                <Button onClick={next}>{t.buttonContinue}</Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              {q4Stage === 0 && (
                <div className="text-center space-y-5">
                  <h3 className="text-xl font-semibold">{t.step5QuizTitle}</h3>
                  <p className="text-sm text-muted-foreground">{t.step5QuizDescription}</p>
                  <div className="mx-auto max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6">
                    <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-white shadow-sm grid place-items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/P_tech_letter_logo_TEMPLATE-removebg-preview.png" alt="Productif.io" className="h-10 w-auto object-contain" />
                    </div>
                    <div className="text-base font-semibold text-emerald-700">{t.step5QuizQuickQuestions}</div>
                    <div className="mt-2 flex items-center justify-center gap-2 text-sm text-emerald-800">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span>{t.step5QuizTime}</span>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button onClick={() => setQ4Stage(1)} className="bg-emerald-500 hover:bg-emerald-600">{t.step5QuizCTA}</Button>
                  </div>
                </div>
              )}

              {q4Stage >= 1 && q4Stage <= 4 && (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">{t.question} {q4Stage} / 4</div>
                  <h4 className="text-lg font-medium">{q4Questions[q4Stage - 1].title}</h4>
                  <div className="grid gap-3">
                    {q4Questions[q4Stage - 1].options.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => {
                          console.log(`[Q4] Clic sur option: ${opt.key} (question ${q4Stage})`)
                          handleQ4Select(q4Stage, opt.key, opt.label)
                        }}
                        className={`text-left rounded-lg border px-4 py-3 hover:bg-emerald-50 transition ${q4Selections[q4Stage] === opt.key ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {q4Stage === 3 && (
                    <div className="text-xs text-muted-foreground bg-gray-50 border rounded-md p-2">{t.analysis92}</div>
                  )}
                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={() => setQ4Stage((s) => Math.max(1, s - 1))}>{t.buttonBack}</Button>
                    <Button onClick={async () => {
                      if (q4Stage < 4) {
                        setQ4Stage((s) => Math.min(4, s + 1))
                      } else {
                        // Attendre un peu pour s'assurer que toutes les réponses sont dans answers
                        await new Promise(resolve => setTimeout(resolve, 100))
                        
                        console.log('[Q4] Fin du questionnaire - État actuel:', {
                          isAuthenticated: auth.isAuthenticated,
                          email: auth.email,
                          answers: answers,
                          q4Selections: q4Selections
                        })
                        
                        // Sauvegarder toutes les réponses Q4 avant de passer à l'étape suivante
                        if (auth.isAuthenticated) {
                          try {
                            const payload = {
                              mainGoal: answers.mainGoal || null,
                              role: answers.role || null,
                              frustration: answers.frustration || null,
                              language: answers.language || 'fr',
                              whatsappNumber: answers.whatsappNumber || null,
                              whatsappConsent: answers.whatsappConsent || false,
                              diagBehavior: answers.diagBehavior || null,
                              timeFeeling: answers.timeFeeling || null,
                              phoneHabit: answers.phoneHabit || null,
                              offer: offer || null,
                              utmParams: utmParams || null,
                              emailFallback: emailFallback || null,
                              billingCycle: billingCycle || null,
                              currentStep: 6,
                              completed: false
                            }
                            
                            console.log('💾 [Q4] Sauvegarde finale:', payload)
                            
                            const response = await fetch('/api/onboarding/data', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify(payload)
                            })
                            
                            if (!response.ok) {
                              const errorData = await response.json().catch(() => ({}))
                              console.error('❌ Erreur sauvegarde finale Q4:', errorData)
                              alert('Erreur lors de la sauvegarde. Veuillez réessayer.')
                              return
                            } else {
                              const result = await response.json()
                              console.log('✅ Réponses Q4 sauvegardées avec succès:', result)
                            }
                          } catch (error) {
                            console.error('❌ Erreur sauvegarde finale Q4:', error)
                            alert('Erreur lors de la sauvegarde. Veuillez réessayer.')
                            return
                          }
                        } else {
                          console.warn('⚠️ Utilisateur non authentifié, impossible de sauvegarder')
                          alert('Vous devez être connecté pour sauvegarder vos réponses.')
                          return
                        }
                        setStep(6)
                      }
                    }}>
                      {q4Stage < 4 ? t.buttonContinue : t.buttonNext}
                    </Button>
                  </div>
                </div>
              )}

            </div>
          )}


          {/* Étape 7 — Révélation du profil (gardée pour compatibilité) */}
          {step === 7 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto max-w-sm rounded-2xl border bg-white p-6 shadow-sm">
                {(() => { const meta = getProfileMeta(answers); return (
                  <>
                    <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-emerald-50 border border-emerald-100 grid place-items-center text-2xl">
                      <span>{meta.emoji}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{t.step7ProfileTitle}</div>
                    <div className="mt-1 text-2xl font-semibold">{meta.label} {meta.emoji}</div>
                  </>
                )})()}
                <p className="mt-3 text-sm text-muted-foreground">{t.step7ProfileDescription}</p>
              </div>
              <div className="flex justify-end">
                <Button onClick={next}>{t.buttonNext}</Button>
              </div>
            </div>
          )}

          {/* Étape 7 — Révélation du profil */}
          {step === 7 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto max-w-sm rounded-2xl border bg-white p-6 shadow-sm">
                {(() => { const meta = getProfileMeta(answers); return (
                  <>
                    <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-emerald-50 border border-emerald-100 grid place-items-center text-2xl">
                      <span>{meta.emoji}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{t.step7ProfileTitle}</div>
                    <div className="mt-1 text-2xl font-semibold">{meta.label} {meta.emoji}</div>
                  </>
                )})()}
                <p className="mt-3 text-sm text-muted-foreground">{t.step7ProfileDescription}</p>
              </div>
              <div className="flex justify-end">
                <Button onClick={next}>{t.buttonNext}</Button>
              </div>
            </div>
          )}


          {/* Étape 9 — Paywall / Pricing */}
          {step === 9 && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">{t.step9Title}</h3>
                <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                  {t.step9Description}
                </p>
              </div>

              <div className="mx-auto w-full max-w-2xl rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-center mb-4 gap-2">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1.5 text-sm rounded-full border ${billingCycle === 'monthly' ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 text-gray-700'}`}
                  >
                    {t.step9Monthly}
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-3 py-1.5 text-sm rounded-full border ${billingCycle === 'yearly' ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 text-gray-700'}`}
                  >
                    {t.step9Yearly}
                  </button>
                </div>

                <div className="text-center space-y-1">
                  {billingCycle === 'monthly' ? (
                    <div className="text-3xl font-bold">€14.99<span className="text-base font-medium">/mo</span></div>
                  ) : (
                    <div className="text-3xl font-bold">€9.99<span className="text-base font-medium">/mo</span>
                      <span className="ml-2 text-xs inline-block rounded bg-green-100 text-green-700 px-2 py-0.5">{t.step9Save}</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">{billingCycle === 'monthly' ? t.step9BilledMonthly : t.step9BilledYearly}</div>
                </div>

                <ul className="mt-6 space-y-3 text-sm text-gray-700 max-w-md mx-auto text-left">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong className="text-gray-900">{t.step9Feature1Title}</strong> — {t.step9Feature1Desc}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong className="text-gray-900">{t.step9Feature2Title}</strong> — {t.step9Feature2Desc}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong className="text-gray-900">{t.step9Feature3Title}</strong> — {t.step9Feature3Desc}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong className="text-gray-900">{t.step9Feature4Title}</strong> — {t.step9Feature4Desc}</span>
                  </li>
                </ul>

                <div className="mt-6 space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600">
                      {answers.language === "fr" 
                        ? "+1500 early adopters" 
                        : "+1500 early adopters"}
                    </p>
                  </div>
                  <div className="grid gap-3 max-w-md mx-auto">
                    <Button onClick={handleStartPayment} className="bg-green-500 hover:bg-green-600 max-w-xs mx-auto">
                      {t.step9StartNow}
                    </Button>
                    <Button variant="outline" onClick={handleStartPayment} className="max-w-xs mx-auto">{t.step9Start}</Button>
                    <button onClick={() => router.push('/dashboard')} className="text-[11px] text-muted-foreground underline underline-offset-4">
                      {t.step9Skip}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <div className="text-xs text-muted-foreground">
            {answers.language === "fr" ? `Étape ${step} / 9` : `Step ${step} / 9`}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

// Wrapper avec Suspense pour useSearchParams
function OnboardingPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C27A]"></div>
      </div>
    }>
      <OldOnboardingPage />
    </Suspense>
  )
}

// Exporter le composant d'origine (flux moderne avec questions simples)
export default function OnboardingPage() {
  return <OnboardingPageWrapper />
}
