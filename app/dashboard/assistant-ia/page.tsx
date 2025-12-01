'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Mic, Send, Sparkles, Calendar, Target, TrendingUp, Home, Bot, Settings as SettingsIcon, 
  Zap, Brain, BookOpen, Timer, CheckCircle2, Circle, Lightbulb, MessageSquare, 
  User, Cpu, ArrowLeft, Copy, ThumbsUp, ThumbsDown, RotateCcw, Maximize2,
  FileText, BarChart3, Clock, Star, Wand2, Headphones, Palette, MicIcon
} from 'lucide-react'
import { useLocale } from '@/lib/i18n'
import { DeepWorkData } from '@/components/analytics/deepwork-data'

interface Message {
  id: string
  text: string
  isAI: boolean
  timestamp: Date
  type?: 'text' | 'suggestion' | 'analysis' | 'task'
  metadata?: {
    confidence?: number
    category?: string
    actionable?: boolean
  }
}

const quickActions = [
  { icon: Brain, label: "Session Focus", action: "deepwork", color: "from-purple-500 to-indigo-600", description: "Démarrer une session de travail focalisée" },
  { icon: BookOpen, label: "Journaling", action: "journal", color: "from-blue-500 to-cyan-500", description: "Journal vocal de vos pensées" },
  { icon: Lightbulb, label: "Apprendre", action: "learning", color: "from-amber-400 to-orange-500", description: "Session d'apprentissage IA" },
  { icon: Calendar, label: "Planifier", action: "plan", color: "from-green-500 to-emerald-600", description: "Organiser votre emploi du temps" },
  { icon: Target, label: "Start a task", action: "start-task", color: "from-pink-500 to-rose-500", description: "Commencer à travailler sur une tâche" },
  { icon: TrendingUp, label: "Analyser", action: "stats", color: "from-violet-500 to-purple-600", description: "Voir vos insights de productivité" },
]

const aiPersonalities = [
  { id: 'coach', name: 'Coach', icon: '🏃‍♂️', description: 'Motivant et orienté objectifs' },
  { id: 'mentor', name: 'Mentor', icon: '🧠', description: 'Sage et guidance stratégique' },
  { id: 'friend', name: 'Ami', icon: '😊', description: 'Décontracté et bienveillant' },
  { id: 'analyst', name: 'Analyste', icon: '📊', description: 'Insights basés sur les données' },
]

const conversationStarters = [
  "Comment améliorer ma concentration aujourd'hui ?",
  "Que dois-je prioriser cette semaine ?",
  "Aide-moi à créer une meilleure routine matinale",
  "Analyse mes patterns de productivité",
  "Je me sens dépassé, que dois-je faire ?",
  "Comment maintenir l'équilibre vie-travail ?"
]

const CHECKIN_QUESTION_TEMPLATES: Record<
  CheckInType,
  string[]
> = {
  mood: [
    '😊 Comment te sens-tu en ce moment ? (1-10)',
    '😊 Quelle est ton humeur actuellement ? (1-10)',
    '🌟 Comment évalues-tu ton humeur ? (1-10)'
  ],
  focus: [
    '🎯 Quel est ton niveau de concentration ? (1-10)',
    '🎯 Es-tu concentré en ce moment ? (1-10)',
    '🔍 Comment évalues-tu ta capacité de focus actuelle ? (1-10)'
  ],
  motivation: [
    '🔥 Quel est ton niveau de motivation ? (1-10)',
    '💪 Te sens-tu motivé(e) en ce moment ? (1-10)',
    '🚀 Comment est ta motivation aujourd\'hui ? (1-10)'
  ],
  energy: [
    '⚡ Quel est ton niveau d\'énergie ? (1-10)',
    '⚡ Comment te sens-tu niveau énergie ? (1-10)',
    '🔋 Évalue ton niveau d\'énergie actuel (1-10)'
  ],
  stress: [
    '😰 Quel est ton niveau de stress ? (1-10)',
    '😌 Te sens-tu stressé(e) ? (1-10)',
    '💆 Comment évalues-tu ton stress actuellement ? (1-10)'
  ]
}

export default function AssistantIAPage() {
  const router = useRouter()
  const { t } = useLocale()
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Bonjour ! Je suis votre assistant IA de productivité personnalisé. Je suis là pour vous aider à optimiser votre journée et libérer votre plein potentiel. Comment puis-je vous accompagner aujourd'hui ?",
      isAI: true,
      timestamp: new Date(),
      type: 'text',
      metadata: { confidence: 100, category: 'greeting' }
    }
  ])
  
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedPersonality, setSelectedPersonality] = useState('coach')
  const [showPersonalitySelector, setShowPersonalitySelector] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [xp, setXp] = useState(340)
  const maxXp = 500
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDeepWorkModalOpen, setIsDeepWorkModalOpen] = useState(false)
  const [isDeepWorkLoading, setIsDeepWorkLoading] = useState(false)
  const [selectedDeepWorkDuration, setSelectedDeepWorkDuration] = useState<number | null>(25)
  const [isLearningModalOpen, setIsLearningModalOpen] = useState(false)
  const [learningText, setLearningText] = useState('')
  const [isLearningSaving, setIsLearningSaving] = useState(false)
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false)
  const [planningText, setPlanningText] = useState('')
  const [isPlanningRunning, setIsPlanningRunning] = useState(false)
  const [learningHabitId, setLearningHabitId] = useState<string | null>(null)

  // États pour la fonctionnalité Journaling
  const [isJournalingModalOpen, setIsJournalingModalOpen] = useState(false)
  const [journalingText, setJournalingText] = useState('')
  const [isJournalingSaving, setIsJournalingSaving] = useState(false)
  const [journalingHabitId, setJournalingHabitId] = useState<string | null>(null)

  const [activeDeepWork, setActiveDeepWork] = useState<{
    id: string
    plannedDuration: number
    elapsedMinutes: number
  } | null>(null)
  const [isEndingDeepWork, setIsEndingDeepWork] = useState(false)
  const [deepWorkTimeLeft, setDeepWorkTimeLeft] = useState<number | null>(null)
  const [deepWorkMode, setDeepWorkMode] = useState<'focus' | 'task' | null>(null)

  // Liste de tâches à afficher sous le timer quand on lance "Start a task"
  interface FocusTask {
    id: string
    title: string
    description?: string | null
    dueDate?: string | null
    completed?: boolean
  }
  const [focusTasks, setFocusTasks] = useState<FocusTask[]>([])
  const [isFocusTasksLoading, setIsFocusTasksLoading] = useState(false)
  type CheckInType = 'mood' | 'focus' | 'motivation' | 'energy' | 'stress'
  const [pendingCheckInType, setPendingCheckInType] = useState<CheckInType | null>(null)
  const [checkInsAskedToday, setCheckInsAskedToday] = useState(0)
  const lastCheckInAtRef = useRef<Date | null>(null)
  const [isVoiceSupported, setIsVoiceSupported] = useState(false)
  const [isVoiceRecording, setIsVoiceRecording] = useState(false)
  const recognitionRef = useRef<any | null>(null)
  const voiceModeRef = useRef<'learning' | 'planning' | null>(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Initialiser la reconnaissance vocale (si disponible dans le navigateur)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const AnyWindow = window as any
    const SpeechRecognition =
      AnyWindow.SpeechRecognition || AnyWindow.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition non supporté dans ce navigateur')
      return
    }

    try {
      setIsVoiceSupported(true)
      const recognition = new SpeechRecognition()
      recognition.lang = 'fr-FR'
      recognition.interimResults = false
      recognition.maxAlternatives = 1
      recognition.continuous = false

      recognition.onstart = () => {
        console.log('🎤 Reconnaissance vocale démarrée')
        setIsVoiceRecording(true)
      }

      recognition.onresult = (event: any) => {
        console.log('🎤 Résultat reçu:', event.results)
        const transcript = event.results[0][0].transcript as string
        console.log('🎤 Transcription:', transcript)
        const mode = voiceModeRef.current
        console.log('🎤 Mode actuel:', mode)
        
        if (mode === 'learning') {
          setLearningText(prev => (prev ? `${prev} ${transcript}` : transcript))
        } else if (mode === 'planning') {
          setPlanningText(prev => (prev ? `${prev} ${transcript}` : transcript))
        } else if (mode === 'journaling') {
          setJournalingText(prev => (prev ? `${prev} ${transcript}` : transcript))
        }
      }

      recognition.onend = () => {
        console.log('🎤 Reconnaissance vocale terminée')
        setIsVoiceRecording(false)
        voiceModeRef.current = null
      }

      recognition.onerror = (event: any) => {
        console.error('🎤 Erreur reconnaissance vocale:', event.error, event)
        setIsVoiceRecording(false)
        voiceModeRef.current = null
        
        let errorMessage = "❌ Erreur avec le micro. "
        switch (event.error) {
          case 'not-allowed':
            errorMessage += "Permissions micro refusées. Autorise l'accès au micro dans ton navigateur."
            break
          case 'no-speech':
            errorMessage += "Aucune parole détectée. Essaie de parler plus fort."
            break
          case 'audio-capture':
            errorMessage += "Problème d'accès au micro. Vérifie que ton micro fonctionne."
            break
          case 'network':
            errorMessage += "Problème de connexion réseau."
            break
          default:
            errorMessage += "Tu peux écrire ton message à la place."
        }
        appendSystemMessage(errorMessage)
      }

      recognitionRef.current = recognition
    } catch (e) {
      console.error('Erreur initialisation SpeechRecognition', e)
      setIsVoiceSupported(false)
    }
  }, [])

  // Charger une éventuelle session Deep Work active au montage + vérifier les questions en attente
  useEffect(() => {
    const loadActiveSession = async () => {
      try {
        const res = await fetch('/api/deepwork/agent?status=active&limit=1')
        if (!res.ok) return
        const data = await res.json()
        const session = data.sessions?.[0]
        if (session) {
          const remainingSeconds =
            typeof session.elapsedMinutes === 'number'
              ? Math.max(
                  (session.plannedDuration - session.elapsedMinutes) * 60,
                  0
                )
              : session.plannedDuration * 60
          setActiveDeepWork({
            id: session.id,
            plannedDuration: session.plannedDuration,
            elapsedMinutes: session.elapsedMinutes ?? 0
          })
          setDeepWorkTimeLeft(remainingSeconds)
        }
      } catch (e) {
        console.error('Error loading active deep work session', e)
      }
    }

    const checkPendingQuestion = async () => {
      try {
        const res = await fetch('/api/behavior/agent/pending-question')
        if (res.ok) {
          const data = await res.json()
          if (data.question && data.type) {
            // Il y a une question en attente côté backend (scheduler / WhatsApp),
            // on l'affiche UNE SEULE fois et on synchronise l'état local
            appendSystemMessage(data.question)
            setPendingCheckInType(data.type)
            setCheckInsAskedToday(prev => prev + 1)
            lastCheckInAtRef.current = new Date()
          }
        }
      } catch (e) {
        console.error('Error checking pending question', e)
      }
    }

    loadActiveSession()
    checkPendingQuestion()
  }, [])

  // Timer local pour le compte à rebours Deep Work (comme sur mobile)
  useEffect(() => {
    if (!activeDeepWork || deepWorkTimeLeft === null) return
    if (deepWorkTimeLeft <= 0) return

    const interval = setInterval(() => {
      setDeepWorkTimeLeft(prev => {
        if (prev === null) return prev
        if (prev <= 1) return 0
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [activeDeepWork, deepWorkTimeLeft])

  // Check-ins comportementaux automatiques (humeur / focus / stress...) comme sur WhatsApp,
  // mais déclenchés de façon aléatoire pendant que la page assistant est ouverte.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const interval = window.setInterval(() => {
      // Ne rien faire si onglet inactif
      if (document.hidden) return

      // Ne pas poser une nouvelle question si on attend déjà une réponse
      if (pendingCheckInType) return

      // Limiter le nombre de questions par jour côté UI
      if (checkInsAskedToday >= 5) return

      const now = new Date()
      if (
        lastCheckInAtRef.current &&
        now.getTime() - lastCheckInAtRef.current.getTime() < 15 * 60 * 1000
      ) {
        // moins de 15 minutes depuis la dernière question
        return
      }

      // Tirer un type au hasard
      const types: CheckInType[] = ['mood', 'focus', 'motivation', 'energy', 'stress']
      const type = types[Math.floor(Math.random() * types.length)]
      const questions = CHECKIN_QUESTION_TEMPLATES[type]
      const question = questions[Math.floor(Math.random() * questions.length)]

      appendSystemMessage(question)
      setPendingCheckInType(type)
      setCheckInsAskedToday(prev => prev + 1)
      lastCheckInAtRef.current = now
    }, 5 * 60 * 1000) // toutes les 5 minutes on vérifie si on doit poser une question

    return () => window.clearInterval(interval)
  }, [pendingCheckInType, checkInsAskedToday])

  const handleSend = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isAI: false,
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    const messageToProcess = inputText
    setInputText('')

    // 1) Si on attend une réponse de check-in (humeur / focus / stress...) et que l'utilisateur répond par un chiffre
    // Vérifier d'abord s'il y a un pendingCheckInType local OU un état en base de données
    let currentCheckInType = pendingCheckInType
    let pendingQuestion = null
    
    if (!currentCheckInType) {
      // Vérifier s'il y a une question en attente en base de données
      try {
        const pendingRes = await fetch('/api/behavior/agent/pending-question')
        if (pendingRes.ok) {
          const pendingData = await pendingRes.json()
          if (pendingData.question && pendingData.type) {
            currentCheckInType = pendingData.type
            pendingQuestion = pendingData.question
          }
        }
      } catch (e) {
        console.error('Erreur lors de la vérification de question en attente', e)
      }
    }
    
    if (currentCheckInType) {
      const numericMatch = messageToProcess.trim().match(/^(\d{1,2})$/)
      if (numericMatch) {
        const value = parseInt(numericMatch[1], 10)
        if (value >= 1 && value <= 10) {
          try {
            const res = await fetch('/api/behavior/agent/checkin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: currentCheckInType, value })
            })
            if (res.ok) {
              const data = await res.json().catch(() => null)
              appendSystemMessage(
                data?.message ||
                  `📊 ${currentCheckInType} ${value}/10 bien enregistré.`
              )
              
              // Nettoyer l'état conversationnel en base si c'était une question externe
              if (!pendingCheckInType && pendingQuestion) {
                await fetch('/api/behavior/agent/clear-state', { method: 'POST' })
              }
            } else {
              appendSystemMessage(
                "❌ Impossible d'enregistrer ta réponse (humeur/focus/stress)."
              )
            }
          } catch (e) {
            console.error('Erreur enregistrement check-in web', e)
            appendSystemMessage(
              "❌ Erreur technique lors de l'enregistrement de ta réponse."
            )
          } finally {
            setPendingCheckInType(null)
          }
          // On traite cette réponse comme un check-in spécifique, pas besoin d'appeler l'agent IA derrière
          return
        }
      }
    }

    // 2) Détection rapide d'une réponse « humeur 7 », « stress 3 », etc. (hors check-in automatique)
    const checkInMatch = messageToProcess.match(/^(humeur|focus|motivation|énergie|energie|stress)\s*[:=-]?\s*(\d{1,2})/i)
    if (checkInMatch) {
      const [, typeLabel, valueStr] = checkInMatch
      const value = parseInt(valueStr, 10)
      if (value >= 1 && value <= 10) {
        const typeMap: Record<string, string> = {
          humeur: 'mood',
          focus: 'focus',
          motivation: 'motivation',
          énergie: 'energy',
          energie: 'energy',
          stress: 'stress'
        }
        const mappedType = typeMap[typeLabel.toLowerCase()]
        if (mappedType) {
          try {
            const res = await fetch('/api/behavior/agent/checkin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: mappedType, value })
            })
            if (res.ok) {
              const data = await res.json().catch(() => null)
              appendSystemMessage(data?.message || `📊 ${typeLabel} ${value}/10 bien enregistré.`)
            } else {
              appendSystemMessage("❌ Impossible d'enregistrer ta réponse (humeur/focus/stress).")
            }
          } catch (e) {
            console.error('Erreur enregistrement check-in web', e)
            appendSystemMessage("❌ Erreur technique lors de l'enregistrement de ta réponse.")
          }
        }
      }
    }

    // Appeler l'agent IA côté serveur (même logique que WhatsApp)
    setIsTyping(true)
    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: messageToProcess })
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        appendSystemMessage(
          `❌ Erreur lors de la réponse de l'agent IA.${
            error.error ? ` Détail : ${error.error}` : ''
          }`
        )
        return
      }

      const data = await res.json()
      const aiText =
        typeof data.response === 'string'
          ? data.response
          : "🤖 Je n'ai pas réussi à générer une réponse compréhensible."

      const newMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        isAI: true,
        timestamp: new Date(),
        type: 'text',
        metadata: { confidence: 95, category: 'assistant', actionable: true }
      }

      setMessages(prev => [...prev, newMessage])
      setXp(prev => Math.min(prev + 15, maxXp))
    } catch (e) {
      console.error('Erreur en appelant /api/assistant/chat', e)
      appendSystemMessage(
        "❌ Erreur technique avec l'agent IA. Réessaye dans quelques instants."
      )
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickAction = (action: string) => {
    // Routing des actions rapides vers des flows dédiés
    if (action === 'deepwork') {
      setDeepWorkMode('focus')
      setIsDeepWorkModalOpen(true)
      return
    }

    if (action === 'learning') {
      setIsLearningModalOpen(true)
      return
    }

    if (action === 'plan') {
      setIsPlanningModalOpen(true)
      return
    }

    if (action === 'journal') {
      setIsJournalingModalOpen(true)
      return
    }

    if (action === 'start-task') {
      // Même flow que Session Focus mais orienté tâche : on choisit un temps de Deep Work
      setDeepWorkMode('task')
      setIsDeepWorkModalOpen(true)
      return
    }

    if (action === 'stats') {
      // Envoyer directement "analyse" dans le chat
      setInputText('analyse')
      setTimeout(() => handleSend(), 100)
      return
    }

    // Fallback : envoyer un message classique à l'IA
    const actionMessages: { [key: string]: string } = {
      journal: "Aide-moi avec ma réflexion quotidienne"
    }

    const text = actionMessages[action]
    if (text) {
      setInputText(text)
      setTimeout(() => handleSend(), 100)
    }
  }

  const handleStarterClick = (starter: string) => {
    setInputText(starter)
    setTimeout(() => handleSend(), 100)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatTimer = (seconds: number) => {
    const total = Math.max(seconds, 0)
    const mins = Math.floor(total / 60)
    const secs = total % 60
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }

  // Helpers backend
  const appendSystemMessage = (text: string) => {
    const msg: Message = {
      id: Date.now().toString(),
      text,
      isAI: true,
      timestamp: new Date(),
      type: 'text'
    }
    setMessages(prev => [...prev, msg])
  }

  const loadFocusTasks = async () => {
    try {
      setIsFocusTasksLoading(true)
      const res = await fetch('/api/tasks')
      if (!res.ok) {
        throw new Error('Erreur chargement tâches')
      }
      const data = await res.json()
      const tasks = Array.isArray(data.tasks) ? data.tasks : []
      const mapped: FocusTask[] = tasks
        .filter((t: any) => !t.completed)
        .slice(0, 10)
        .map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          dueDate: t.dueDate ?? null,
          completed: t.completed ?? false
        }))
      setFocusTasks(mapped)
    } catch (e) {
      console.error('Erreur lors du chargement des tâches pour le focus', e)
      appendSystemMessage("❌ Impossible de charger la liste de tes tâches pour l'instant.")
    } finally {
      setIsFocusTasksLoading(false)
    }
  }

  const startDeepWork = async (minutes: number) => {
    setIsDeepWorkLoading(true)
    try {
      const res = await fetch('/api/deepwork/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plannedDuration: minutes, type: 'deepwork' })
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        const message = typeof error.error === 'string' ? error.error : ''

        if (message && message.toLowerCase().includes('déjà en cours')) {
          appendSystemMessage(
            `⚠️ Tu as déjà une session Deep Work en cours. Je vais l'afficher en haut de l'interface pour que tu puisses la terminer.`
          )
          // Charger la session active pour affichage / gestion
          try {
            const activeRes = await fetch('/api/deepwork/agent?status=active&limit=1')
            if (activeRes.ok) {
              const data = await activeRes.json()
              const session = data.sessions?.[0]
              if (session) {
                const remainingSeconds =
                  typeof session.elapsedMinutes === 'number'
                    ? Math.max(
                        (session.plannedDuration - session.elapsedMinutes) * 60,
                        0
                      )
                    : session.plannedDuration * 60
                setActiveDeepWork({
                  id: session.id,
                  plannedDuration: session.plannedDuration,
                  elapsedMinutes: session.elapsedMinutes ?? 0
                })
                setDeepWorkTimeLeft(remainingSeconds)
              }
            }
          } catch (e) {
            console.error('Error reloading active session after conflict', e)
          }
        } else {
          appendSystemMessage(
            `❌ Impossible de lancer la session Deep Work (${minutes} min). ${message ? `Détail : ${message}` : ''}`.trim()
          )
        }
        return
      }

      const data = await res.json()
      const endTime = data.endTimeExpected ? new Date(data.endTimeExpected) : null
      appendSystemMessage(
        `🧠 Session Focus lancée pour ${minutes} minutes.${endTime ? ` Fin prévue vers ${endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.` : ''} Je te préviendrai dans tes stats.`
      )
      setActiveDeepWork({
        id: data.session.id,
        plannedDuration: data.session.plannedDuration,
        elapsedMinutes: 0
      })
      // Initialiser le timer local
      setDeepWorkTimeLeft(data.session.plannedDuration * 60)

      // Si on vient du flow "Start a task", charger la liste de tâches à afficher sous le timer
      if (deepWorkMode === 'task') {
        loadFocusTasks()
      } else {
        setFocusTasks([])
      }
      setXp(prev => Math.min(prev + 20, maxXp))
    } catch (e) {
      console.error('Error starting deep work', e)
      appendSystemMessage("❌ Erreur technique lors du lancement de la session Deep Work. Réessaye dans quelques instants.")
    } finally {
      setIsDeepWorkLoading(false)
      setIsDeepWorkModalOpen(false)
    }
  }

  const ensureLearningHabitId = async (): Promise<string | null> => {
    if (learningHabitId) return learningHabitId
    try {
      const res = await fetch('/api/habits')
      if (!res.ok) return null
      const habits = await res.json()
      
      // Debug: afficher toutes les habitudes trouvées
      console.log('🔍 Habitudes trouvées:', habits.map((h: any) => ({ id: h.id, name: h.name })))
      
      const learning = habits.find((h: any) =>
        typeof h.name === 'string' && h.name.toLowerCase().includes('apprentissage')
      )
      
      if (!learning) {
        console.log('❌ Aucune habitude contenant "apprentissage" trouvée')
        return null
      }
      
      console.log('✅ Habitude apprentissage trouvée:', learning)
      setLearningHabitId(learning.id)
      return learning.id as string
    } catch (e) {
      console.error('Error fetching habits', e)
      return null
    }
  }

  const saveLearningEntry = async () => {
    if (!learningText.trim()) {
      setIsLearningModalOpen(false)
      return
    }
    setIsLearningSaving(true)
    try {
      const habitId = await ensureLearningHabitId()
      if (!habitId) {
        appendSystemMessage("❌ Impossible de trouver l'habitude 'Apprentissage'. Vérifie ta configuration d'habitudes.")
        return
      }

      const now = new Date()
      const res = await fetch('/api/habits/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitId,
          date: now.toISOString(),
          completed: true,
          note: learningText,
          rating: null,
          skipDayValidation: true
        })
      })

      if (!res.ok) {
        const errorText = await res.text().catch(() => '')
        console.error('Error saving learning entry', errorText)
        appendSystemMessage("❌ Impossible d'enregistrer ton apprentissage aujourd'hui.")
        return
      }

      appendSystemMessage("📚 Noté ! J'ai enregistré ce que tu as appris aujourd'hui dans ton habitude 'Apprentissage'.")
      setXp(prev => Math.min(prev + 10, maxXp))
    } catch (e) {
      console.error('Error saving learning entry', e)
      appendSystemMessage("❌ Erreur technique lors de l'enregistrement de ton apprentissage.")
    } finally {
      setIsLearningSaving(false)
      setIsLearningModalOpen(false)
      setLearningText('')
    }
  }

  const runPlanning = async () => {
    if (!planningText.trim()) {
      setIsPlanningModalOpen(false)
      return
    }
    setIsPlanningRunning(true)
    try {
      appendSystemMessage("🤖 Je prépare une planification intelligente de ta journée à partir de ta liste de tâches…")
      const res = await fetch('/api/tasks/agent/batch-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: planningText })
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        appendSystemMessage(
          `❌ Je n'ai pas réussi à générer un planning intelligent. ${error.error ? `Détail : ${error.error}` : ''}`.trim()
        )
        return
      }

      const result = await res.json()
      let summary = `✅ J'ai créé ${result.tasksCreated} tâche${result.tasksCreated > 1 ? 's' : ''} pour organiser ta journée.`
      if (result.analysis?.summary) {
        summary += `\n\n🧠 Analyse : ${result.analysis.summary}`
      }
      if (result.analysis?.planSummary) {
        summary += `\n\n📋 Plan proposé :\n${result.analysis.planSummary}`
      }
      appendSystemMessage(summary)
      setXp(prev => Math.min(prev + 25, maxXp))
    } catch (e) {
      console.error('Error running planning', e)
      appendSystemMessage("❌ Erreur technique pendant la planification intelligente.")
    } finally {
      setIsPlanningRunning(false)
      setIsPlanningModalOpen(false)
      setPlanningText('')
    }
  }

  const ensureJournalingHabitId = async (): Promise<string | null> => {
    if (journalingHabitId) return journalingHabitId
    try {
      const res = await fetch('/api/habits')
      if (!res.ok) return null
      const habits = await res.json()
      
      // Debug: afficher toutes les habitudes trouvées
      console.log('🔍 Habitudes trouvées pour journaling:', habits.map((h: any) => ({ id: h.id, name: h.name })))
      
      const journaling = habits.find((h: any) =>
        typeof h.name === 'string' && h.name.toLowerCase().includes('note de sa journée')
      )
      
      if (!journaling) {
        console.log('❌ Aucune habitude contenant "note de sa journée" trouvée')
        return null
      }
      
      console.log('✅ Habitude journaling trouvée:', journaling)
      setJournalingHabitId(journaling.id)
      return journaling.id as string
    } catch (e) {
      console.error('Error fetching habits for journaling', e)
      return null
    }
  }

  const saveJournalingEntry = async () => {
    if (!journalingText.trim()) {
      setIsJournalingModalOpen(false)
      return
    }
    setIsJournalingSaving(true)
    try {
      // 1. Sauvegarder dans l'API journal
      const journalRes = await fetch('/api/journal/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          transcription: journalingText,
          date: new Date().toISOString()
        })
      })

      if (!journalRes.ok) {
        const error = await journalRes.json().catch(() => ({}))
        appendSystemMessage(`❌ Erreur lors de la sauvegarde du journal : ${error.error || 'Erreur inconnue'}`)
        return
      }

      // 2. Mettre à jour l'habitude "Note de sa journée"
      const habitId = await ensureJournalingHabitId()
      if (habitId) {
        const today = new Date().toISOString().split('T')[0]
        const habitRes = await fetch('/api/habits/entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            habitId,
            date: today,
            completed: true,
            note: journalingText
          })
        })

        if (!habitRes.ok) {
          console.warn('Erreur lors de la mise à jour de l\'habitude journaling')
        }
      }

      // 3. Feedback utilisateur
      appendSystemMessage(
        `📝 Merci pour ton partage ! J'ai enregistré ta note de journée.\n\nJe vais analyser tes réflexions et te donner mes insights demain matin 🌅\n\nTu peux aussi consulter ton journal sur la page /mon-espace.\n\nTu as gagné 25 XP ! 🌟`
      )
      
      setJournalingText('')
      setIsJournalingModalOpen(false)
      setXp(prev => Math.min(prev + 25, maxXp))
    } catch (e) {
      console.error('Error saving journaling entry', e)
      appendSystemMessage('❌ Erreur lors de la sauvegarde du journal.')
    } finally {
      setIsJournalingSaving(false)
    }
  }

  const endActiveDeepWork = async () => {
    if (!activeDeepWork) return
    setIsEndingDeepWork(true)
    try {
      const res = await fetch(`/api/deepwork/agent/${activeDeepWork.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' })
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        appendSystemMessage(
          `❌ Impossible de terminer la session en cours. ${error.error ? `Détail : ${error.error}` : ''}`.trim()
        )
        return
      }
      const result = await res.json()
      const duration = result.actualDuration ?? activeDeepWork.elapsedMinutes
      appendSystemMessage(
        `✅ Session Focus terminée. Tu as travaillé environ ${duration} minutes en Deep Work. Bien joué !`
      )
      setActiveDeepWork(null)
      setDeepWorkMode(null)
      setFocusTasks([])
    } catch (e) {
      console.error('Error ending deep work session', e)
      appendSystemMessage("❌ Erreur technique lors de la terminaison de la session.")
    } finally {
      setIsEndingDeepWork(false)
    }
  }

  const currentPersonality = aiPersonalities.find(p => p.id === selectedPersonality) || aiPersonalities[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/90 backdrop-blur-lg border-b border-gray-200 shadow-sm sticky top-0 z-50"
      >
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button and Logo */}
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => router.push('/dashboard')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft size={24} className="text-gray-600" />
              </motion.button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00C27A] to-[#00D68F] flex items-center justify-center shadow-lg">
                  <Bot size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Assistant IA</h1>
                  <p className="text-sm text-gray-500">Votre coach de productivité personnalisé</p>
                </div>
              </div>
            </div>

            {/* Center: AI Personality Selector */}
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => setShowPersonalitySelector(!showPersonalitySelector)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-xl shadow-md"
              >
                <span className="text-lg">{currentPersonality.icon}</span>
                <span className="font-medium">{currentPersonality.name}</span>
                <Sparkles size={16} />
              </motion.button>

              {/* XP Progress */}
              <div className="flex items-center gap-2">
                <Star size={20} className="text-amber-500" />
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(xp / maxXp) * 100}%` }}
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                  />
                </div>
                <span className="text-sm font-medium text-gray-600">{xp}/{maxXp}</span>
              </div>
            </div>

            {/* Right: Navigation */}
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => router.push('/dashboard')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 hover:bg-gray-100 text-gray-700 rounded-xl flex items-center gap-2 transition-all"
              >
                <Home size={18} />
                <span>{t('dashboard')}</span>
              </motion.button>

              <motion.button
                onClick={() => router.push('/dashboard/analytics')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 hover:bg-gray-100 text-gray-700 rounded-xl flex items-center gap-2 transition-all"
              >
                <TrendingUp size={18} />
                <span>{t('analytics')}</span>
              </motion.button>

              <motion.button
                onClick={() => router.push('/settings')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-gray-100 text-gray-700 rounded-xl transition-all"
              >
                <SettingsIcon size={20} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Personality Selector Dropdown */}
        <AnimatePresence>
          {showPersonalitySelector && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-50"
            >
              <div className="grid grid-cols-2 gap-3 w-80">
                {aiPersonalities.map((personality) => (
                  <motion.button
                    key={personality.id}
                    onClick={() => {
                      setSelectedPersonality(personality.id)
                      setShowPersonalitySelector(false)
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      selectedPersonality === personality.id
                        ? 'border-[#00C27A] bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{personality.icon}</div>
                    <div className="font-medium text-gray-900">{personality.name}</div>
                    <div className="text-xs text-gray-500">{personality.description}</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <div className="max-w-[1200px] mx-auto px-8 py-8 h-[calc(100vh-120px)] flex flex-col min-h-0">
        {/* Main Chat Area */}
        <div className="flex-1 flex gap-8 min-h-0">
          {/* Left Sidebar - Quick Actions */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-80 space-y-6"
          >
            {/* Quick Actions */}
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Zap size={20} className="text-[#00C27A]" />
                Actions Rapides
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action.action}
                    onClick={() => handleQuickAction(action.action)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-2xl bg-gradient-to-br ${action.color} text-white shadow-md hover:shadow-lg transition-all group`}
                  >
                    <action.icon size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-sm font-medium">{action.label}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Conversation Starters */}
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare size={20} className="text-[#00C27A]" />
                Suggestions
              </h3>
              <div className="space-y-2">
                {conversationStarters.slice(0, 4).map((starter, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleStarterClick(starter)}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left p-3 rounded-xl hover:bg-gray-50 text-sm text-gray-700 transition-all border border-transparent hover:border-gray-200"
                  >
                    "{starter}"
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Deep Work Stats - même design que la section analytics/mobile */}
            <DeepWorkData />
          </motion.div>

          {/* Chat Messages Area */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex-1 bg-white rounded-3xl shadow-lg border border-gray-100 flex flex-col min-h-0"
          >
            {activeDeepWork && (
              <div className="px-6 pt-4 pb-2 border-b border-gray-100">
                <div className="bg-gradient-to-r from-[#00C27A] to-[#00D68F] rounded-2xl p-4 text-white shadow-md flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer size={20} className="text-white" />
                      <div>
                        <p className="text-sm font-semibold">Deep Focus Mode</p>
                        <p className="text-xs text-white/80">
                          Session de {activeDeepWork.plannedDuration} min en cours
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={endActiveDeepWork}
                      disabled={isEndingDeepWork}
                      className="px-3 py-1.5 text-xs rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
                    >
                      {isEndingDeepWork ? 'Terminaison…' : 'Terminer'}
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <p className="text-3xl font-semibold tabular-nums">
                      {formatTimer(
                        deepWorkTimeLeft !== null
                          ? deepWorkTimeLeft
                          : (activeDeepWork.plannedDuration -
                              activeDeepWork.elapsedMinutes) *
                            60
                      )}
                    </p>
                    <p className="text-xs text-white/80">
                      Reste concentré·e, tu fais du bon travail 🎯
                    </p>
                  </div>

                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all"
                      style={{
                        width: (() => {
                          const total = activeDeepWork.plannedDuration * 60
                          const remaining =
                            deepWorkTimeLeft !== null
                              ? deepWorkTimeLeft
                              : (activeDeepWork.plannedDuration -
                                  activeDeepWork.elapsedMinutes) *
                                60
                          const progress =
                            total > 0
                              ? ((total - remaining) / total) * 100
                              : 0
                          return `${Math.min(Math.max(progress, 0), 100)}%`
                        })(),
                      }}
                    />
                  </div>

                  {/* Liste de tâches pour le mode Start a task (comme sur mobile : timer + tâches en dessous) */}
                  {deepWorkMode === 'task' && (
                    <div className="mt-4 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-white/90">
                          Tes tâches à attaquer pendant cette session
                        </p>
                        <button
                          onClick={() => router.push('/dashboard/tasks')}
                          className="text-[11px] underline text-white/80 hover:text-white"
                        >
                          Voir toutes les tâches
                        </button>
                      </div>
                      {isFocusTasksLoading ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="h-6 rounded bg-white/10 animate-pulse" />
                          ))}
                        </div>
                      ) : focusTasks.length === 0 ? (
                        <p className="text-[11px] text-white/80">
                          Aucune tâche en cours. Crée une tâche depuis l’onglet Tâches pour la lier à ton Deep Work.
                        </p>
                      ) : (
                        <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                          {focusTasks.map(task => (
                            <li
                              key={task.id}
                              className="text-[11px] text-white/90 flex items-center gap-2"
                            >
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/tasks/${task.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ completed: true })
                                    })
                                    if (!res.ok) return
                                    // Retirer la tâche de la liste locale
                                    setFocusTasks(prev => prev.filter(t => t.id !== task.id))
                                  } catch (e) {
                                    console.error('Erreur lors de la complétion de la tâche focus', e)
                                  }
                                }}
                                className="flex-shrink-0 w-4 h-4 rounded-full border border-white/70 flex items-center justify-center hover:bg-white/90 hover:text-[#00C27A] transition-colors"
                                title="Marquer comme faite"
                              >
                                ✓
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className="truncate">{task.title}</p>
                                {task.dueDate && (
                                  <p className="text-[10px] text-white/70">
                                    Échéance : {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                                  </p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Messages Container */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 min-h-0">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex gap-4 ${message.isAI ? 'justify-start' : 'justify-end'}`}
                >
                  {message.isAI && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00C27A] to-[#00D68F] flex items-center justify-center shadow-md">
                      <Bot size={20} className="text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[70%] ${message.isAI ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`p-4 rounded-2xl shadow-sm ${
                        message.isAI
                          ? 'bg-gray-50 border border-gray-200'
                          : 'bg-gradient-to-br from-[#00C27A] to-[#00D68F] text-white'
                      }`}
                    >
                      <p
                        className={`text-sm leading-relaxed whitespace-pre-line ${
                          message.isAI ? 'text-gray-800' : 'text-white'
                        }`}
                      >
                        {message.text}
                      </p>
                      
                      {message.metadata?.actionable && message.isAI && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <ThumbsUp size={14} className="text-gray-500" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Copy size={14} className="text-gray-500" />
                          </motion.button>
                        </div>
                      )}
                    </div>
                    
                    <div className={`text-xs text-gray-500 mt-1 ${message.isAI ? 'text-left' : 'text-right'}`}>
                      {formatTime(message.timestamp)}
                      {message.metadata?.confidence && (
                        <span className="ml-2">• {message.metadata.confidence}% confiance</span>
                      )}
                    </div>
                  </div>

                  {!message.isAI && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                      <User size={20} className="text-white" />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing Indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex gap-4 justify-start"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00C27A] to-[#00D68F] flex items-center justify-center shadow-md">
                      <Bot size={20} className="text-white" />
                    </div>
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl shadow-sm">
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tapez votre message... (Entrée pour envoyer)"
                    className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-200 focus:border-[#00C27A] focus:ring-2 focus:ring-[#00C27A]/20 outline-none transition-all resize-none"
                  />
                  
                  {isVoiceSupported && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        if (!recognitionRef.current) return
                        if (isVoiceRecording) {
                          recognitionRef.current.stop()
                          return
                        }
                        voiceModeRef.current = null
                        setIsVoiceRecording(true)
                        recognitionRef.current.start()
                      }}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-xl transition-all ${
                        isVoiceRecording 
                          ? 'bg-red-500 text-white' 
                          : 'hover:bg-gray-100 text-gray-500'
                      }`}
                    >
                      <MicIcon size={16} />
                    </motion.button>
                  )}
                </div>

                <motion.button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-3 rounded-2xl shadow-md transition-all ${
                    inputText.trim()
                      ? 'bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white hover:shadow-lg'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send size={20} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Deep Work Modal */}
      <AnimatePresence>
        {isDeepWorkModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Démarrer une Session Focus</h3>
              <p className="text-sm text-gray-500 mb-4">
                Choisis la durée de ta session de Deep Work. Tu peux commencer petit et augmenter ensuite.
              </p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[15, 25, 50, 90].map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedDeepWorkDuration(m)}
                    className={`py-2 rounded-2xl text-sm font-medium border ${
                      selectedDeepWorkDuration === m
                        ? 'bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white border-transparent'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {m} min
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setIsDeepWorkModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl"
                  disabled={isDeepWorkLoading}
                >
                  Annuler
                </button>
                <button
                  onClick={() => selectedDeepWorkDuration && startDeepWork(selectedDeepWorkDuration)}
                  disabled={isDeepWorkLoading || !selectedDeepWorkDuration}
                  className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white shadow-md disabled:opacity-60"
                >
                  {isDeepWorkLoading ? 'Démarrage…' : 'Lancer la session'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Learning Modal */}
      <AnimatePresence>
        {isLearningModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Qu’as-tu appris aujourd’hui ?
                  </h3>
                  <p className="text-sm text-gray-500">
                    Décris en quelques lignes ce que tu as retenu aujourd’hui. Je l’ajouterai à ton habitude
                    “Apprentissage”.
                  </p>
                </div>
                {isVoiceSupported && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!recognitionRef.current) {
                        appendSystemMessage("❌ Reconnaissance vocale non initialisée.")
                        return
                      }
                      if (isVoiceRecording) {
                        recognitionRef.current.stop()
                        return
                      }
                      
                      try {
                        await navigator.mediaDevices.getUserMedia({ audio: true })
                        voiceModeRef.current = 'learning'
                        console.log('🎤 Démarrage reconnaissance vocale pour learning')
                        recognitionRef.current.start()
                      } catch (error: any) {
                        console.error('🎤 Erreur permissions micro:', error)
                        if (error.name === 'NotAllowedError') {
                          appendSystemMessage("❌ Permissions micro refusées. Autorise l'accès au micro dans ton navigateur.")
                        } else {
                          appendSystemMessage("❌ Impossible d'accéder au micro. Vérifie que ton micro fonctionne.")
                        }
                      }
                    }}
                    className={`p-2 rounded-full border ${
                      isVoiceRecording
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <MicIcon size={16} />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-2">
                Décris en quelques lignes ce que tu as retenu aujourd’hui. Je l’ajouterai à ton habitude
                “Apprentissage”. {isVoiceSupported ? 'Tu peux aussi dicter avec le micro.' : ''}
              </p>
              <textarea
                value={learningText}
                onChange={(e) => setLearningText(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27A]/20 focus:border-[#00C27A] mb-4 resize-none"
                placeholder="Ex : Aujourd’hui j’ai compris comment structurer mes blocs de Deep Work pour rester concentré plus longtemps…"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsLearningModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl"
                  disabled={isLearningSaving}
                >
                  Annuler
                </button>
                <button
                  onClick={saveLearningEntry}
                  disabled={isLearningSaving || !learningText.trim()}
                  className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white shadow-md disabled:opacity-60"
                >
                  {isLearningSaving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Planning Modal */}
      <AnimatePresence>
        {isPlanningModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xl"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Planification intelligente
                  </h3>
                  <p className="text-sm text-gray-500">
                    Décris tout ce que tu dois faire (aujourd’hui ou demain). Je vais créer des tâches et organiser ta journée
                    automatiquement, comme sur l’assistant WhatsApp.
                  </p>
                </div>
                {isVoiceSupported && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!recognitionRef.current) {
                        appendSystemMessage("❌ Reconnaissance vocale non initialisée.")
                        return
                      }
                      if (isVoiceRecording) {
                        recognitionRef.current.stop()
                        return
                      }
                      
                      try {
                        await navigator.mediaDevices.getUserMedia({ audio: true })
                        voiceModeRef.current = 'planning'
                        console.log('🎤 Démarrage reconnaissance vocale pour planning')
                        recognitionRef.current.start()
                      } catch (error: any) {
                        console.error('🎤 Erreur permissions micro:', error)
                        if (error.name === 'NotAllowedError') {
                          appendSystemMessage("❌ Permissions micro refusées. Autorise l'accès au micro dans ton navigateur.")
                        } else {
                          appendSystemMessage("❌ Impossible d'accéder au micro. Vérifie que ton micro fonctionne.")
                        }
                      }
                    }}
                    className={`p-2 rounded-full border ${
                      isVoiceRecording
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <MicIcon size={16} />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-2">
                Tu peux écrire ou dicter ta liste de tâches, je m’occupe de la transformer en planning.
              </p>
              <textarea
                value={planningText}
                onChange={(e) => setPlanningText(e.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C27A]/20 focus:border-[#00C27A] mb-4 resize-none"
                placeholder='Ex : "Demain je dois finir le rapport marketing urgent, préparer la réunion client de 15h, répondre à mes emails importants et avancer sur le projet X…"'
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsPlanningModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl"
                  disabled={isPlanningRunning}
                >
                  Annuler
                </button>
                <button
                  onClick={runPlanning}
                  disabled={isPlanningRunning || !planningText.trim()}
                  className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white shadow-md disabled:opacity-60"
                >
                  {isPlanningRunning ? 'Analyse en cours…' : 'Lancer la planification'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Journaling Modal */}
      <AnimatePresence>
        {isJournalingModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xl"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Journal quotidien
                  </h3>
                  <p className="text-sm text-gray-500">
                    Raconte-moi ta journée, tes réflexions, tes émotions...
                  </p>
                </div>
                {isVoiceSupported && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!recognitionRef.current) {
                        appendSystemMessage("❌ Reconnaissance vocale non initialisée.")
                        return
                      }
                      if (isVoiceRecording) {
                        recognitionRef.current.stop()
                        return
                      }
                      
                      try {
                        // Demander les permissions micro si nécessaire
                        await navigator.mediaDevices.getUserMedia({ audio: true })
                        voiceModeRef.current = 'journaling'
                        console.log('🎤 Démarrage reconnaissance vocale pour journaling')
                        recognitionRef.current.start()
                      } catch (error: any) {
                        console.error('🎤 Erreur permissions micro:', error)
                        if (error.name === 'NotAllowedError') {
                          appendSystemMessage("❌ Permissions micro refusées. Autorise l'accès au micro dans ton navigateur.")
                        } else {
                          appendSystemMessage("❌ Impossible d'accéder au micro. Vérifie que ton micro fonctionne.")
                        }
                      }
                    }}
                    className={`p-2 rounded-full border ${
                      isVoiceRecording
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <MicIcon size={16} />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-2">
                Partage tes pensées, tes accomplissements, tes défis... Je vais analyser tes réflexions et te donner des insights. {isVoiceSupported ? 'Tu peux aussi dicter avec le micro.' : ''}
              </p>
              <textarea
                value={journalingText}
                onChange={(e) => setJournalingText(e.target.value)}
                rows={6}
                className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mb-4 resize-none"
                placeholder="Ex : Aujourd'hui j'ai eu une journée productive. J'ai terminé mon projet important et je me sens satisfait. Cependant, j'ai eu du mal à me concentrer cet après-midi..."
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsJournalingModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl"
                  disabled={isJournalingSaving}
                >
                  Annuler
                </button>
                <button
                  onClick={saveJournalingEntry}
                  disabled={isJournalingSaving || !journalingText.trim()}
                  className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md disabled:opacity-60"
                >
                  {isJournalingSaving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
