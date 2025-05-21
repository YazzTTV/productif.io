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
import { ProcessSteps } from "./process-steps"

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
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [timerDuration, setTimerDuration] = useState(0)
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

  useEffect(() => {
    // Enregistrer l'heure de début quand la page est chargée
    setStartTime(new Date())
  }, [])

  const handleComplete = async (continueSession: boolean) => {
    try {
      // Calculer la durée réelle passée sur la tâche
      const endTime = new Date();
      const durationInSeconds = startTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) : 60 * 60; // Fallback à 1h si pas de startTime
      
      console.log(`[TIME] Création d'une entrée de temps - Durée: ${durationInSeconds} secondes (${durationInSeconds/60} minutes)`)
      
      // Enregistrer l'entrée de temps
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId,
          description: process,
          startTime: startTime?.toISOString(), // Envoyer l'heure de début réelle
          endTime: endTime.toISOString(),     // Envoyer l'heure de fin réelle
          duration: durationInSeconds,         // Envoyer la durée calculée en secondes
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
      console.log("Process sélectionné:", selectedProcess.description)
      try {
        // Essayer de parser le process comme JSON
        const parsed = JSON.parse(selectedProcess.description)
        
        // Si c'est un tableau et que les éléments ont la structure attendue
        if (Array.isArray(parsed) && parsed.some(item => 
          typeof item === 'object' && 
          'title' in item && 
          'subSteps' in item
        )) {
          console.log("Format détecté: Nouveau format avec étapes")
          console.log("Setting process value to:", selectedProcess.description) // Debug
          setProcess(selectedProcess.description)
        } else {
          console.log("Format détecté: Ancien format ou format invalide")
          // Convertir en nouveau format
          const simpleStep = [{
            id: Math.random().toString(36).substr(2, 9),
            title: selectedProcess.name,
            completed: false,
            isExpanded: true,
            subSteps: [{
              id: Math.random().toString(36).substr(2, 9),
              title: selectedProcess.description,
              completed: false,
              isExpanded: true,
              subSteps: []
            }]
          }]
          const newValue = JSON.stringify(simpleStep)
          console.log("Setting process value to:", newValue) // Debug
          setProcess(newValue)
        }
      } catch (error) {
        console.log("Erreur de parsing:", error)
        // Si ce n'est pas du JSON du tout
        const simpleStep = [{
          id: Math.random().toString(36).substr(2, 9),
          title: selectedProcess.name,
          completed: false,
          isExpanded: true,
          subSteps: [{
            id: Math.random().toString(36).substr(2, 9),
            title: selectedProcess.description,
            completed: false,
            isExpanded: true,
            subSteps: []
          }]
        }]
        const newValue = JSON.stringify(simpleStep)
        console.log("Setting process value to:", newValue) // Debug
        setProcess(newValue)
      }
    } else {
      console.log("Setting process value to empty string") // Debug
      setProcess("")
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
    <div className="container mx-auto px-4 py-4 sm:py-6">
      <div className="grid gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Time Tracking</h1>
          
          {!taskId && (
            <div className="mb-6">
              <TaskSelector />
            </div>
          )}

          {task && (
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-2">{task.title}</h2>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                  )}
                  {task.project && (
                    <Badge style={{ backgroundColor: task.project.color }}>
                      {task.project.name}
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleTaskComplete}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span className="truncate">Marquer comme terminée</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard/tasks")}
                    className="w-full sm:w-auto"
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">Process</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowSaveProcessDialog(true)}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Save className="h-4 w-4" />
                  Sauvegarder le process
                </Button>
              </div>
              <div className="space-y-4">
                <ProcessSelector onSelect={handleProcessSelect} />
                <ProcessSteps
                  key={process} // Force re-render when process changes
                  value={process}
                  onChange={(newValue) => {
                    console.log("ProcessSteps onChange called with:", newValue) // Debug
                    setProcess(newValue)
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="sm:max-w-md">
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
              <label htmlFor="saveTemplate" className="text-sm">
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

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
            <Button 
              onClick={() => handleComplete(true)}
              className="w-full sm:w-auto"
            >
              Continuer une nouvelle session
            </Button>
            <Button
              variant="default"
              onClick={() => handleComplete(false)}
              className="w-full sm:w-auto"
            >
              Terminer la tâche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSaveProcessDialog} onOpenChange={setShowSaveProcessDialog}>
        <DialogContent className="sm:max-w-md">
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

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowSaveProcessDialog(false)}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSaveProcess}
              className="w-full sm:w-auto"
            >
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 