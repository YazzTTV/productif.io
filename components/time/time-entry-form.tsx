"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format } from "date-fns"

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

interface TimeEntry {
  id: string
  startTime: Date
  endTime: Date | null
  duration: number | null
  note: string | null
  taskId: string | null
  projectId: string | null
  task: {
    id: string
    title: string
  } | null
  project: {
    id: string
    name: string
    color: string | null
  } | null
}

interface TimeEntryFormProps {
  timeEntry: TimeEntry
  projects: Project[]
  tasks: Task[]
}

export function TimeEntryForm({ timeEntry, projects, tasks }: TimeEntryFormProps) {
  const router = useRouter()
  const [startTime, setStartTime] = useState<string>(format(new Date(timeEntry.startTime), "yyyy-MM-dd'T'HH:mm"))
  const [endTime, setEndTime] = useState<string>(
    timeEntry.endTime ? format(new Date(timeEntry.endTime), "yyyy-MM-dd'T'HH:mm") : "",
  )
  const [duration, setDuration] = useState<string>(timeEntry.duration ? String(timeEntry.duration) : "")
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(timeEntry.taskId)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(timeEntry.projectId)
  const [note, setNote] = useState<string>(timeEntry.note || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtrer les tâches en fonction du projet sélectionné
  const filteredTasks = selectedProjectId ? tasks.filter((task) => task.project?.id === selectedProjectId) : tasks

  // Calculer la durée à partir des heures, minutes et secondes
  const calculateDuration = (hours: number, minutes: number, seconds: number) => {
    return hours * 3600 + minutes * 60 + seconds
  }

  // Extraire les heures, minutes et secondes de la durée
  const extractDuration = (durationInSeconds: number) => {
    const hours = Math.floor(durationInSeconds / 3600)
    const minutes = Math.floor((durationInSeconds % 3600) / 60)
    const seconds = durationInSeconds % 60

    return { hours, minutes, seconds }
  }

  // Mettre à jour la durée lorsque les heures de début et de fin changent
  const updateDuration = () => {
    if (startTime && endTime) {
      const start = new Date(startTime)
      const end = new Date(endTime)
      const diffInSeconds = Math.floor((end.getTime() - start.getTime()) / 1000)

      if (diffInSeconds > 0) {
        setDuration(String(diffInSeconds))
      }
    }
  }

  // Mettre à jour les heures de début et de fin lorsque la durée change
  const updateEndTime = () => {
    if (startTime && duration) {
      const start = new Date(startTime)
      const durationInSeconds = Number(duration)
      const end = new Date(start.getTime() + durationInSeconds * 1000)

      setEndTime(format(end, "yyyy-MM-dd'T'HH:mm"))
    }
  }

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/time-entries/${timeEntry.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startTime: new Date(startTime).toISOString(),
          endTime: endTime ? new Date(endTime).toISOString() : null,
          duration: duration ? Number(duration) : null,
          note,
          taskId: selectedTaskId || undefined,
          projectId: selectedProjectId || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur lors de la mise à jour de l'entrée de temps")
      }

      // Rediriger vers la page de suivi du temps
      router.push("/dashboard/time")
      router.refresh()
    } catch (error) {
      console.error("Erreur:", error)
      setError(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modifier l'entrée de temps</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Heure de début</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value)
                  updateDuration()
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Heure de fin</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value)
                  updateDuration()
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Durée (en secondes)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => {
                setDuration(e.target.value)
                updateEndTime()
              }}
              min="0"
            />
            {duration && (
              <div className="text-sm text-gray-500">
                {(() => {
                  const { hours, minutes, seconds } = extractDuration(Number(duration))
                  return `${hours}h ${minutes}m ${seconds}s`
                })()}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Projet</Label>
              <Select value={selectedProjectId || ""} onValueChange={(value) => setSelectedProjectId(value || null)}>
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
              <Select value={selectedTaskId || ""} onValueChange={(value) => setSelectedTaskId(value || null)}>
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
              placeholder="Décrivez ce que vous avez fait..."
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/time")}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

