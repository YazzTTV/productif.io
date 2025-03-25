import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface Project {
  id: string
  name: string
}

interface ProjectSelectProps {
  value?: string
  onChange: (value: string) => void
}

export function ProjectSelect({ value, onChange }: ProjectSelectProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Convertir la valeur "none" en null pour le projectId
  const handleChange = (selectedValue: string) => {
    onChange(selectedValue === "none" ? "" : selectedValue)
  }

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch("/api/projects")
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des projets")
        }
        const data = await response.json()
        setProjects(data)
      } catch (error) {
        console.error("Erreur:", error)
        setError("Impossible de charger les projets")
      } finally {
        setIsLoading(false)
      }
    }
    fetchProjects()
  }, [])

  if (error) {
    return <div className="text-red-500 text-sm">{error}</div>
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="project">Projet</Label>
      <Select
        value={value === "" ? "none" : value}
        onValueChange={handleChange}
        disabled={isLoading}
      >
        <SelectTrigger id="project">
          <SelectValue placeholder="Sélectionner un projet" />
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
  )
} 