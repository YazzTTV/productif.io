"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

type TaskFormProps = {
  initialData?: {
    id?: string
    title: string
    description: string
    priority: string
    energyLevel: string
    projectId?: string
  }
  projects: {
    id: string
    name: string
    color: string
  }[]
}

export function TaskForm({ initialData, projects }: TaskFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    priority: initialData?.priority || "P3_TODO",
    energyLevel: initialData?.energyLevel || "MEDIUM",
    projectId: initialData?.projectId || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const url = initialData?.id ? `/api/tasks/${initialData.id}` : "/api/tasks"
      const method = initialData?.id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue")
      }

      router.push("/dashboard/tasks")
      router.refresh()
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la tâche:", error)
      setError(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  const priorityOptions = [
    { value: "P0_QUICK_WIN", label: "P0 - Quick Win" },
    { value: "P1_URGENT", label: "P1 - Urgent" },
    { value: "P2_IMPORTANT", label: "P2 - Important" },
    { value: "P3_TODO", label: "P3 - À faire" },
    { value: "P4_LATER", label: "P4 - Plus tard" },
  ]

  const energyOptions = [
    { value: "EXTREME", label: "Extrême" },
    { value: "HIGH", label: "Élevé" },
    { value: "MEDIUM", label: "Moyen" },
    { value: "LOW", label: "Faible" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Modifier la tâche" : "Nouvelle tâche"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priorité</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une priorité" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="energyLevel">Niveau d'énergie requis</Label>
            <Select
              value={formData.energyLevel}
              onValueChange={(value) => setFormData({ ...formData, energyLevel: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un niveau d'énergie" />
              </SelectTrigger>
              <SelectContent>
                {energyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="project">Projet (optionnel)</Label>
            <Select
              value={formData.projectId}
              onValueChange={(value) => setFormData({ ...formData, projectId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un projet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun projet</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Enregistrement..." : initialData ? "Mettre à jour" : "Créer"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

