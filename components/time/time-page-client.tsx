"use client"

import { useState, useEffect } from "react"
import { FixedTimer } from "./fixed-timer"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { TaskSelector } from "@/components/time/task-selector"
import { ProcessSelector } from "@/components/time/process-selector"
import { CheckCircle, Save } from "lucide-react"

interface Task {
  id: string
  title: string
  description?: string
  project?: {
    id: string
    name: string
    color: string
  }
}

interface Process {
  id: string
  name: string
  description: string
}

interface TimePageClientProps {
  taskId?: string
  taskTitle?: string
}

export function TimePageClient({ taskId, taskTitle }: TimePageClientProps) {
  const [process, setProcess] = useState("")
  const [task, setTask] = useState<Task | null>(null)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [showSaveProcessDialog, setShowSaveProcessDialog] = useState(false)
  const [processName, setProcessName] = useState("")
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (taskId) {
      // Charger les détails de la tâche
      fetch(`/api/tasks/${taskId}`)
        .then((res) => res.json())
        .then((data) => {
          setTask(data)
          setIsCompleted(data.completed)
        })
        .catch((error) => {
          console.error("Erreur lors du chargement de la tâche:", error)
          toast({
            title: "Erreur",
            description: "Impossible de charger les détails de la tâche.",
            variant: "destructive",
          })
        })
    }
  }, [taskId, toast])

  const handleComplete = async (continueSession: boolean) => {
    try {
      // Enregistrer l'entrée de temps
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId,
          description: process,
          duration: 60 * 60, // 1 heure en secondes
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'enregistrement de la session")
      }

      // Si l'utilisateur veut sauvegarder le process comme template
      if (saveAsTemplate && processName) {
        await fetch("/api/processes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: processName,
            description: process,
          }),
        })
      }

      // Si l'utilisateur veut marquer la tâche comme terminée
      if (!continueSession) {
        await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            completed: true,
          }),
        })

        toast({
          title: "Tâche terminée !",
          description: "La tâche a été marquée comme terminée.",
        })

        router.push("/dashboard/tasks")
      } else {
        // Réinitialiser le timer pour une nouvelle session
        setShowCompleteDialog(false)
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement.",
        variant: "destructive",
      })
    }
  }

  const handleTaskComplete = async () => {
    try {
      // Récupérer d'abord la tâche actuelle
      const taskResponse = await fetch(`/api/tasks/${taskId}`)
      if (!taskResponse.ok) {
        throw new Error("Impossible de récupérer les détails de la tâche")
      }
      const currentTask = await taskResponse.json()

      // Mettre à jour la tâche en conservant toutes ses propriétés
      const updateResponse = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: true,
          dueDate: currentTask.dueDate,
          priority: currentTask.priority,
          energyLevel: currentTask.energyLevel,
          projectId: currentTask.projectId,
          order: currentTask.order,
        }),
      })

      if (!updateResponse.ok) {
        throw new Error("Impossible de mettre à jour la tâche")
      }

      toast({
        title: "Tâche terminée !",
        description: "La tâche a été marquée comme terminée.",
      })
      router.push("/dashboard/tasks")
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la tâche.",
        variant: "destructive",
      })
    }
  }

  const handleTimerComplete = () => {
    setShowCompleteDialog(true)
  }

  const handleProcessSelect = (selectedProcess: Process | null) => {
    if (selectedProcess) {
      setProcess(selectedProcess.description)
    }
  }

  const handleSaveProcess = async () => {
    if (!processName.trim() || !process.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom et la description du process sont requis.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/processes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: processName,
          description: process,
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde du process")
      }

      toast({
        title: "Succès",
        description: "Le process a été sauvegardé avec succès.",
      })
      setShowSaveProcessDialog(false)
      setProcessName("")
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde du process.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="grid gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-6">Time Tracking</h1>
          
          {!taskId && (
            <div className="mb-8">
              <TaskSelector />
            </div>
          )}

          {task && (
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{task.title}</h2>
                  {task.description && (
                    <p className="text-muted-foreground mb-2">{task.description}</p>
                  )}
                  {task.project && (
                    <Badge style={{ backgroundColor: task.project.color }}>
                      {task.project.name}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleTaskComplete}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Marquer comme terminée
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard/tasks")}
                  >
                    Retour aux tâches
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <FixedTimer
                taskTitle={taskTitle}
                onComplete={handleTimerComplete}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Process</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowSaveProcessDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Sauvegarder le process
                </Button>
              </div>
              <div className="space-y-4">
                <ProcessSelector onSelect={handleProcessSelect} />
                <Textarea
                  placeholder="Décrivez le process pour réaliser cette tâche..."
                  className="min-h-[200px]"
                  value={process}
                  onChange={(e) => setProcess(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Session terminée</DialogTitle>
            <DialogDescription>
              Que souhaitez-vous faire maintenant ?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="saveTemplate"
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
              />
              <label htmlFor="saveTemplate">
                Sauvegarder ce process comme template
              </label>
            </div>

            {saveAsTemplate && (
              <Input
                placeholder="Nom du template"
                value={processName}
                onChange={(e) => setProcessName(e.target.value)}
              />
            )}
          </div>

          <DialogFooter className="flex space-x-2">
            <Button onClick={() => handleComplete(true)}>
              Continuer une nouvelle session
            </Button>
            <Button
              variant="default"
              onClick={() => handleComplete(false)}
            >
              Terminer la tâche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSaveProcessDialog} onOpenChange={setShowSaveProcessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sauvegarder le process</DialogTitle>
            <DialogDescription>
              Donnez un nom à votre process pour pouvoir le réutiliser plus tard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Nom du process"
              value={processName}
              onChange={(e) => setProcessName(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveProcessDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveProcess}>
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 