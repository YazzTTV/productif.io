"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"

interface Project {
  id: string
  name: string
  color: string
}

interface Task {
  id: string
  title: string
  projectId: string | null
  userId: string
  userName: string | null
  userEmail: string
}

export function TaskSelector() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const router = useRouter()

  // Charger les projets
  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then(setProjects)
      .catch(console.error)
  }, [])

  // Charger les tâches non complétées
  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => {
        // Extraire le tableau tasks de la réponse API
        const tasksArray = data.tasks || [];
        // Filtrer pour n'avoir que les tâches de l'utilisateur connecté
        const userTasks = tasksArray.filter((task: Task) => !task.userName || task.userName === null);
        setTasks(userTasks);
      })
      .catch(console.error)
  }, [])

  // Filtrer les tâches par projet
  const filteredTasks = selectedProject === "all"
    ? tasks
    : tasks.filter((task) => task.projectId === selectedProject)

  const handleTaskSelect = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      router.push(`/dashboard/time?taskId=${taskId}&title=${encodeURIComponent(task.title)}`)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Projet</label>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un projet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les projets</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Tâche</label>
        <Select onValueChange={handleTaskSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une tâche" />
          </SelectTrigger>
          <SelectContent>
            {Array.isArray(filteredTasks) && filteredTasks.map((task) => (
              <SelectItem key={task.id} value={task.id}>
                {task.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
} 