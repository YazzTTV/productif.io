"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PlayCircle, PauseCircle, RotateCcw, Settings } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Temps par défaut en secondes
const DEFAULT_WORK_TIME = 25 * 60 // 25 minutes
const DEFAULT_SHORT_BREAK = 5 * 60 // 5 minutes
const DEFAULT_LONG_BREAK = 15 * 60 // 15 minutes
const POMODOROS_BEFORE_LONG_BREAK = 4

// Clés pour le localStorage
const STORAGE_KEYS = {
  WORK_TIME: 'pomodoro_work_time',
  SHORT_BREAK: 'pomodoro_short_break',
  LONG_BREAK: 'pomodoro_long_break',
  SOUND_ENABLED: 'pomodoro_sound_enabled',
  SOUND_VOLUME: 'pomodoro_sound_volume',
  SESSIONS_COUNT: 'pomodoro_sessions_count'
}

interface FixedTimerProps {
  onComplete: () => void
  taskTitle?: string
}

export function FixedTimer({ onComplete, taskTitle }: FixedTimerProps) {
  const [timeLeft, setTimeLeft] = useState(DEFAULT_WORK_TIME)
  const [isRunning, setIsRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [isLongBreak, setIsLongBreak] = useState(false)
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [workTime, setWorkTime] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.WORK_TIME)
      return saved ? parseInt(saved) : DEFAULT_WORK_TIME
    }
    return DEFAULT_WORK_TIME
  })
  const [shortBreakTime, setShortBreakTime] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.SHORT_BREAK)
      return saved ? parseInt(saved) : DEFAULT_SHORT_BREAK
    }
    return DEFAULT_SHORT_BREAK
  })
  const [longBreakTime, setLongBreakTime] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.LONG_BREAK)
      return saved ? parseInt(saved) : DEFAULT_LONG_BREAK
    }
    return DEFAULT_LONG_BREAK
  })
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED)
      return saved ? saved === 'true' : true
    }
    return true
  })
  const [soundVolume, setSoundVolume] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseFloat(localStorage.getItem(STORAGE_KEYS.SOUND_VOLUME) || '1')
    }
    return 1
  })
  const [sessionsCount, setSessionsCount] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem(STORAGE_KEYS.SESSIONS_COUNT) || '0')
    }
    return 0
  })
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { toast } = useToast()

  // Sauvegarder les paramètres dans le localStorage
  const saveSettings = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.WORK_TIME, workTime.toString())
    localStorage.setItem(STORAGE_KEYS.SHORT_BREAK, shortBreakTime.toString())
    localStorage.setItem(STORAGE_KEYS.LONG_BREAK, longBreakTime.toString())
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, soundEnabled.toString())
    localStorage.setItem(STORAGE_KEYS.SOUND_VOLUME, soundVolume.toString())
    localStorage.setItem(STORAGE_KEYS.SESSIONS_COUNT, sessionsCount.toString())
  }, [workTime, shortBreakTime, longBreakTime, soundEnabled, soundVolume, sessionsCount])

  // Initialiser l'audio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/timer-complete.mp3')
      if (audioRef.current) {
        audioRef.current.volume = soundVolume
      }
    }
  }, [])

  // Mettre à jour le volume quand il change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = soundVolume
    }
  }, [soundVolume])

  // Sauvegarder les paramètres quand ils changent
  useEffect(() => {
    saveSettings()
    // Réinitialiser le timer avec les nouvelles valeurs
    if (!isRunning) {
      setTimeLeft(workTime)
    }
  }, [saveSettings, workTime, shortBreakTime, longBreakTime, isRunning])

  const playNotificationSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0 // Réinitialiser le son pour qu'il puisse être rejoué
      audioRef.current.play().catch(error => {
        console.error('Erreur lors de la lecture du son:', error)
      })
    }
  }

  const resetTimer = useCallback(() => {
    setTimeLeft(workTime)
    setIsBreak(false)
    setIsLongBreak(false)
    setIsRunning(false)
    setPomodoroCount(0)
  }, [workTime])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            if (!isBreak) {
              // Fin du temps de travail
              const newPomodoroCount = pomodoroCount + 1
              setPomodoroCount(newPomodoroCount)
              
              // Vérifier si on a atteint le nombre de sessions souhaité
              if (newPomodoroCount >= sessionsCount) {
                setIsRunning(false)
                onComplete()
                return 0
              }
              
              // Déterminer le type de pause
              const shouldTakeLongBreak = newPomodoroCount % POMODOROS_BEFORE_LONG_BREAK === 0
              setIsLongBreak(shouldTakeLongBreak)
              setIsBreak(true)
              
              playNotificationSound()
              toast({
                title: "Temps de travail terminé !",
                description: shouldTakeLongBreak 
                  ? `C'est l'heure de la longue pause de ${Math.floor(longBreakTime / 60)} minutes.`
                  : `C'est l'heure de la pause de ${Math.floor(shortBreakTime / 60)} minutes.`,
              })
              
              return shouldTakeLongBreak ? longBreakTime : shortBreakTime
            } else {
              // Fin de la pause
              playNotificationSound()
              toast({
                title: "Pause terminée !",
                description: "Reprenons le travail.",
              })
              setIsBreak(false)
              setIsLongBreak(false)
              return workTime
            }
          }
          return time - 1
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isRunning, timeLeft, isBreak, isLongBreak, workTime, shortBreakTime, longBreakTime, pomodoroCount, sessionsCount, toast, soundEnabled, onComplete])

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getCurrentProgress = () => {
    const currentTime = isBreak 
      ? (isLongBreak ? longBreakTime : shortBreakTime)
      : workTime
    return ((currentTime - timeLeft) / currentTime) * 100
  }

  const getCurrentPhase = () => {
    if (isBreak) {
      return isLongBreak ? "Longue pause" : "Pause courte"
    }
    return "Travail"
  }

  return (
    <Card className="p-6">
      <div className="text-center">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{getCurrentPhase()}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSoundEnabled(!soundEnabled)
                localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, (!soundEnabled).toString())
              }}
              className={soundEnabled ? "text-primary" : "text-muted-foreground"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {taskTitle && (
          <p className="text-muted-foreground mb-4">Tâche : {taskTitle}</p>
        )}
        
        <div className="text-6xl font-mono mb-4">{formatTime(timeLeft)}</div>
        <Progress value={getCurrentProgress()} className="mb-4" />
        
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTimer}
            className="w-12 h-12"
          >
            {isRunning ? (
              <PauseCircle className="h-6 w-6" />
            ) : (
              <PlayCircle className="h-6 w-6" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={resetTimer}
            className="w-12 h-12"
          >
            <RotateCcw className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paramètres du timer</DialogTitle>
            <DialogDescription>
              Configurez les durées de travail et de pause
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workTime">Temps de travail (minutes)</Label>
              <Input
                id="workTime"
                type="number"
                value={Math.floor(workTime / 60)}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value) * 60
                  setWorkTime(newValue)
                  localStorage.setItem(STORAGE_KEYS.WORK_TIME, newValue.toString())
                }}
                min={1}
                max={60}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortBreak">Pause courte (minutes)</Label>
              <Input
                id="shortBreak"
                type="number"
                value={Math.floor(shortBreakTime / 60)}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value) * 60
                  setShortBreakTime(newValue)
                  localStorage.setItem(STORAGE_KEYS.SHORT_BREAK, newValue.toString())
                }}
                min={1}
                max={30}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longBreak">Pause longue (minutes)</Label>
              <Input
                id="longBreak"
                type="number"
                value={Math.floor(longBreakTime / 60)}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value) * 60
                  setLongBreakTime(newValue)
                  localStorage.setItem(STORAGE_KEYS.LONG_BREAK, newValue.toString())
                }}
                min={1}
                max={60}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionsCount">Nombre de sessions</Label>
              <Input
                id="sessionsCount"
                type="number"
                value={sessionsCount}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value)
                  setSessionsCount(newValue)
                  localStorage.setItem(STORAGE_KEYS.SESSIONS_COUNT, newValue.toString())
                }}
                min={1}
                max={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="soundVolume">Volume du son</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="soundVolume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={soundVolume}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value)
                    setSoundVolume(newValue)
                    localStorage.setItem(STORAGE_KEYS.SOUND_VOLUME, newValue.toString())
                    if (audioRef.current) {
                      audioRef.current.volume = newValue
                    }
                  }}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {Math.round(soundVolume * 100)}%
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowSettings(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 