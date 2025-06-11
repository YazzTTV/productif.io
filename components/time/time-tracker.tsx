"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, Pause, StopCircle, Sync } from "lucide-react"

interface Project {
  id: string
  name: string
  color: string | null
}

interface Task {
  id: string
  title: string
  project: {
    id: string
    name: string
    color: string | null
  } | null
}

interface TimeTrackerProps {
  projects: Project[]
  tasks: Task[]
}

// Clés pour la persistance
const STORAGE_KEYS = {
  TIMER_STATE: 'timer_state',
  TIMER_START: 'timer_start_time',
  TIMER_ELAPSED: 'timer_elapsed_time',
  TIMER_SYNC: 'timer_last_sync'
}

interface TimerState {
  isRunning: boolean
  startTime: string | null
  elapsedTime: number
  selectedTaskId: string | null
  selectedProjectId: string | null
  note: string
  lastSync: number
}

export function TimeTracker({ projects, tasks }: TimeTrackerProps) {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<number>(0)
  const [isSyncing, setIsSyncing] = useState(false)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<Date | null>(null)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Filtrer les tâches en fonction du projet sélectionné
  const filteredTasks = selectedProjectId ? tasks.filter((task) => task.project?.id === selectedProjectId) : tasks

  // Calculer le temps basé sur les timestamps serveur
  const calculateElapsedTime = (startTime: Date): number => {
    const now = new Date()
    return Math.floor((now.getTime() - startTime.getTime()) / 1000)
  }

  // Sauvegarder l'état du timer
  const saveTimerState = () => {
    if (typeof window === 'undefined') return
    
    const state: TimerState = {
      isRunning,
      startTime: startTimeRef.current?.toISOString() || null,
      elapsedTime,
      selectedTaskId,
      selectedProjectId,
      note,
      lastSync: Date.now()
    }
    
    localStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(state))
  }

  // Charger l'état du timer au démarrage
  const loadTimerState = () => {
    if (typeof window === 'undefined') return false
    
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TIMER_STATE)
      if (!saved) return false
      
      const state: TimerState = JSON.parse(saved)
      
      // Vérifier si la session n'est pas trop ancienne (24h)
      const maxAge = 24 * 60 * 60 * 1000 // 24 heures
      if (Date.now() - state.lastSync > maxAge) {
        clearTimerState()
        return false
      }
      
      if (state.isRunning && state.startTime) {
        const startTime = new Date(state.startTime)
        const currentElapsed = calculateElapsedTime(startTime)
        
        setIsRunning(true)
        setElapsedTime(currentElapsed)
        setSelectedTaskId(state.selectedTaskId)
        setSelectedProjectId(state.selectedProjectId)
        setNote(state.note)
        setLastSync(state.lastSync)
        startTimeRef.current = startTime
        
        return true
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'état du timer:', error)
      clearTimerState()
    }
    
    return false
  }

  // Nettoyer l'état du timer
  const clearTimerState = () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEYS.TIMER_STATE)
  }

  // Synchroniser avec le serveur
  const syncWithServer = async () => {
    if (!isRunning || !startTimeRef.current) return
    
    setIsSyncing(true)
    try {
      const response = await fetch('/api/timer/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: startTimeRef.current.toISOString(),
          currentTime: new Date().toISOString()
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setLastSync(Date.now())
        
        // Ajuster si nécessaire basé sur la réponse serveur
        if (data.serverElapsed && Math.abs(data.serverElapsed - elapsedTime) > 2) {
          setElapsedTime(data.serverElapsed)
        }
      }
    } catch (error) {
      console.error('Erreur de synchronisation:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  // Formater le temps écoulé (format: HH:MM:SS)
  const formatElapsedTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600)
    const minutes = Math.floor((timeInSeconds % 3600) / 60)
    const seconds = timeInSeconds % 60

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ].join(":")
  }

  // Démarrer le chronomètre
  const startTimer = () => {
    if (isRunning) return

    if (!selectedTaskId && !selectedProjectId) {
      setError("Veuillez sélectionner une tâche ou un projet")
      return
    }

    setError(null)
    setIsRunning(true)
    
    // Utiliser l'heure serveur si possible
    const now = new Date()
    startTimeRef.current = now

    // Timer principal avec correction de dérive
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const newElapsed = calculateElapsedTime(startTimeRef.current)
        setElapsedTime(newElapsed)
        
        // Sauvegarder périodiquement
        if (newElapsed % 10 === 0) { // Toutes les 10 secondes
          saveTimerState()
        }
      }
    }, 1000)

    // Synchronisation périodique avec le serveur
    syncIntervalRef.current = setInterval(() => {
      syncWithServer()
    }, 60000) // Toutes les minutes

    saveTimerState()
  }

  // Mettre en pause le chronomètre
  const pauseTimer = () => {
    if (!isRunning) return

    setIsRunning(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current)
      syncIntervalRef.current = null
    }
    
    saveTimerState()
  }

  // Arrêter le chronomètre et enregistrer l'entrée de temps
  const stopTimer = async () => {
    if (!startTimeRef.current) return;

    pauseTimer();

    try {
      const endTime = new Date();
      
      // Vérifier que le temps écoulé est d'au moins 1 seconde
      if (elapsedTime < 1) {
        setError("La durée enregistrée doit être d'au moins 1 seconde");
        return;
      }
      
      // Utiliser l'heure de début réelle et calculer précisément
      const actualDuration = calculateElapsedTime(startTimeRef.current)
      
      console.log(`Envoi des données: startTime=${startTimeRef.current.toISOString()}, endTime=${endTime.toISOString()}, duration=${actualDuration}s`);
      
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startTime: startTimeRef.current.toISOString(),
          endTime: endTime.toISOString(),
          duration: actualDuration,
          note,
          taskId: selectedTaskId === "none" ? null : selectedTaskId,
          projectId: selectedProjectId === "none" ? null : selectedProjectId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de l'enregistrement du temps");
      }

      // Réinitialiser le chronomètre
      setElapsedTime(0);
      startTimeRef.current = null;
      setSuccess("Temps enregistré avec succès");
      clearTimerState();

      // Rafraîchir la page pour afficher la nouvelle entrée
      router.refresh();

      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error("Erreur:", error);
      setError(error instanceof Error ? error.message : "Une erreur est survenue");
    }
  };

  // Charger l'état au démarrage
  useEffect(() => {
    const hasActiveSession = loadTimerState()
    
    if (hasActiveSession && isRunning) {
      // Reprendre le timer
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const newElapsed = calculateElapsedTime(startTimeRef.current)
          setElapsedTime(newElapsed)
          
          if (newElapsed % 10 === 0) {
            saveTimerState()
          }
        }
      }, 1000)
      
      // Reprendre la synchronisation
      syncIntervalRef.current = setInterval(() => {
        syncWithServer()
      }, 60000)
    }
  }, [])

  // Sauvegarder l'état quand les valeurs changent
  useEffect(() => {
    if (isRunning) {
      saveTimerState()
    }
  }, [selectedTaskId, selectedProjectId, note])

  // Nettoyer les intervalles lors du démontage du composant
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
      if (isRunning) {
        saveTimerState()
      }
    }
  }, [isRunning])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Chronomètre
          {isSyncing && <Sync className="h-4 w-4 animate-spin" />}
          {lastSync > 0 && (
            <span className="text-xs text-muted-foreground">
              Sync: {new Date(lastSync).toLocaleTimeString()}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-center">
          <div className="text-5xl font-mono font-bold text-center py-6">{formatElapsedTime(elapsedTime)}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="project">Projet</Label>
            <Select
              value={selectedProjectId || ""}
              onValueChange={(value) => setSelectedProjectId(value || null)}
              disabled={isRunning}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un projet (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun projet</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task">Tâche</Label>
            <Select
              value={selectedTaskId || ""}
              onValueChange={(value) => setSelectedTaskId(value || null)}
              disabled={isRunning}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une tâche (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune tâche</SelectItem>
                {filteredTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Note (optionnel)</Label>
          <Textarea
            id="note"
            placeholder="Ajouter une note sur cette session de travail..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isRunning}
          />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 justify-center">
        {!isRunning ? (
          <Button onClick={startTimer} className="w-32">
            <Play className="mr-2 h-4 w-4" />
            Démarrer
          </Button>
        ) : (
          <Button onClick={pauseTimer} variant="outline" className="w-32">
            <Pause className="mr-2 h-4 w-4" />
            Pause
          </Button>
        )}
        
        <Button onClick={stopTimer} variant="destructive" className="w-32" disabled={elapsedTime === 0}>
          <StopCircle className="mr-2 h-4 w-4" />
          Arrêter
        </Button>
        
        {isRunning && (
          <Button onClick={syncWithServer} variant="ghost" size="sm" disabled={isSyncing}>
            <Sync className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

