"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PlayCircle, PauseCircle, RotateCcw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const WORK_TIME = 45 * 60 // 45 minutes en secondes
const BREAK_TIME = 15 * 60 // 15 minutes en secondes
const TOTAL_TIME = WORK_TIME + BREAK_TIME

interface FixedTimerProps {
  onComplete: () => void
  taskTitle?: string
}

export function FixedTimer({ onComplete, taskTitle }: FixedTimerProps) {
  const [timeLeft, setTimeLeft] = useState(WORK_TIME)
  const [isRunning, setIsRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const { toast } = useToast()

  const resetTimer = useCallback(() => {
    setTimeLeft(WORK_TIME)
    setIsBreak(false)
    setIsRunning(false)
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            if (!isBreak) {
              // Fin du temps de travail, début de la pause
              toast({
                title: "Temps de travail terminé !",
                description: "C'est l'heure de la pause de 15 minutes.",
              })
              setIsBreak(true)
              return BREAK_TIME
            } else {
              // Fin de la pause, cycle complet terminé
              toast({
                title: "Session terminée !",
                description: "Vous avez complété une session de travail.",
              })
              setIsRunning(false)
              onComplete()
            }
          }
          return time - 1
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isRunning, timeLeft, isBreak, onComplete, toast])

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const progress = isBreak
    ? ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100
    : ((WORK_TIME - timeLeft) / WORK_TIME) * 100

  return (
    <Card className="p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">
          {isBreak ? "Pause" : "Temps de travail"}
        </h2>
        {taskTitle && (
          <p className="text-muted-foreground mb-4">Tâche : {taskTitle}</p>
        )}
        <div className="text-4xl font-mono mb-4">{formatTime(timeLeft)}</div>
        <Progress value={progress} className="mb-4" />
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
    </Card>
  )
} 