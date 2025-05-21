"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, Pause, StopCircle } from "lucide-react"

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

export function TimeTracker({ projects, tasks }: TimeTrackerProps) {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<Date | null>(null)

  // Filtrer les tâches en fonction du projet sélectionné
  const filteredTasks = selectedProjectId ? tasks.filter((task) => task.project?.id === selectedProjectId) : tasks

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
    startTimeRef.current = new Date()

    timerRef.current = setInterval(() => {
      const now = new Date()
      const start = startTimeRef.current || now
      const diffInSeconds = Math.floor((now.getTime() - start.getTime()) / 1000)
      setElapsedTime(diffInSeconds)
    }, 1000)
  }

  // Mettre en pause le chronomètre
  const pauseTimer = () => {
    if (!isRunning) return

    setIsRunning(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
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
      
      // Calculer le temps de début en soustrayant la durée écoulée de la date de fin
      // Cela garantit que la durée calculée sur le serveur correspondra à la durée mesurée localement
      const calculatedStartTime = new Date(endTime.getTime() - (elapsedTime * 1000));
      
      console.log(`Envoi des données: startTime=${calculatedStartTime.toISOString()}, endTime=${endTime.toISOString()}, elapsedTime=${elapsedTime}s`);
      
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startTime: calculatedStartTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: elapsedTime, // Envoyer la durée exacte mesurée localement
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

  // Nettoyer l'intervalle lors du démontage du composant
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chronomètre</CardTitle>
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
          <Label htmlFor="note">Note</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Décrivez ce que vous faites..."
            rows={3}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-center space-x-2">
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
      </CardFooter>
    </Card>
  )
}

