"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format, isToday, isTomorrow, isThisWeek, startOfToday, isBefore, parseISO } from "date-fns"
import { enUS } from "date-fns/locale"
import { 
  Plus, 
  Trash2, 
  Edit2,
  Play,
  Check,
  Calendar as CalendarIcon,
  ArrowLeft,
  CheckCircle2
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface Task {
  id: string
  title: string
  description?: string | null
  completed: boolean
  priority: number | null
  energyLevel: number | null
  dueDate?: string | null
  projectId?: string | null
  project?: {
    id: string
    name: string
    color?: string | null
  } | null
  createdAt: string
}

interface TaskGroup {
  overdue: Task[]
  today: Task[]
  tomorrow: Task[]
  thisWeek: Task[]
  later: Task[]
  noDueDate: Task[]
}

interface Project {
  id: string
  name: string
  color?: string | null
}

// Function to get priority label
const getPriorityLabel = (priority: number | null) => {
  if (priority === null) return null
  switch (priority) {
    case 0: return { label: 'Optional', color: '#6b7280' }
    case 1: return { label: 'To Do', color: '#3b82f6' }
    case 2: return { label: 'Important', color: '#f59e0b' }
    case 3: return { label: 'Urgent', color: '#ef4444' }
    case 4: return { label: 'Quick Win', color: '#10b981' }
    default: return null
  }
}

// Function to get energy label
const getEnergyLabel = (energyLevel: number | null) => {
  if (energyLevel === null) return null
  switch (energyLevel) {
    case 0: return { label: 'Low', color: '#10b981' }
    case 1: return { label: 'Medium', color: '#f59e0b' }
    case 2: return { label: 'High', color: '#f97316' }
    case 3: return { label: 'Extreme', color: '#ef4444' }
    default: return null
  }
}

// Function to format due date
const formatDueDate = (dateString?: string | null) => {
  if (!dateString) return null
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString)
    if (isNaN(date.getTime())) return null
    if (isToday(date)) return "Today"
    if (isTomorrow(date)) return "Tomorrow"
    return format(date, 'MM/dd', { locale: enUS })
  } catch (error) {
    console.warn('Error parsing date:', dateString, error)
    return null
  }
}

export function NewTasksPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  
  // Form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'P1',
    energyLevel: 'Medium',
    dueDate: undefined as Date | undefined,
    projectId: '',
  })

  // Options for selects
  const priorityOptions = [
    { value: 'P4', label: 'Quick Win' },
    { value: 'P3', label: 'Urgent' },
    { value: 'P2', label: 'Important' },
    { value: 'P1', label: 'To Do' },
    { value: 'P0', label: 'Optional' },
  ]

  const energyOptions = [
    { value: 'Extreme', label: 'Extreme' },
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' },
  ]

  // Function to group tasks by date
  const groupTasks = (tasks: Task[]): TaskGroup => {
    const today = startOfToday()
    const incompleteTasks = tasks.filter(task => !task.completed)
    
    return incompleteTasks.reduce((groups: TaskGroup, task) => {
      if (!task.dueDate) {
        groups.noDueDate.push(task)
        return groups
      }

      try {
        const taskDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : new Date(task.dueDate)
        if (isNaN(taskDate.getTime())) {
          groups.noDueDate.push(task)
          return groups
        }
        
        if (isBefore(taskDate, today)) {
          groups.overdue.push(task)
        } else if (isToday(taskDate)) {
          groups.today.push(task)
        } else if (isTomorrow(taskDate)) {
          groups.tomorrow.push(task)
        } else if (isThisWeek(taskDate)) {
          groups.thisWeek.push(task)
        } else {
          groups.later.push(task)
        }
      } catch (error) {
        console.warn('Error parsing date for task:', task.title, task.dueDate, error)
        groups.noDueDate.push(task)
      }
      
      return groups
    }, {
      overdue: [],
      today: [],
      tomorrow: [],
      thisWeek: [],
      later: [],
      noDueDate: []
    })
  }

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tasks')
      if (!response.ok) {
        throw new Error("Error loading tasks")
      }
      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
      toast({
        title: "Error",
        description: "Unable to load tasks",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects')
      if (!response.ok) {
        throw new Error("Error loading projects")
      }
      const projects = await response.json()
      setProjects(Array.isArray(projects) ? projects : projects.projects || [])
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
    fetchProjects()
  }, [fetchTasks, fetchProjects])

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      })

      if (!response.ok) {
        throw new Error("Error updating task")
      }

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, completed: !completed } : task
      ))
      
      toast({
        title: "Success",
        description: completed ? "Task marked as incomplete" : "Task completed",
      })
      
      router.refresh()
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error",
        description: "Unable to update task",
        variant: "destructive",
      })
    }
  }

  const handleTaskPress = (task: Task) => {
    const priorityValue = task.priority !== null ? `P${task.priority}` : 'P1'
    const energyValue = getEnergyStringFromNumber(task.energyLevel)
    
    setEditingTask(task)
    setNewTask({
      title: task.title,
      description: task.description || '',
      priority: priorityValue,
      energyLevel: energyValue,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      projectId: task.projectId || '',
    })
    setShowEditModal(true)
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error("Error deleting task")
      }

      setTasks(prev => prev.filter(task => task.id !== taskId))
      
      toast({
        title: "Success",
        description: "Task deleted successfully",
      })
      
      router.refresh()
    } catch (error) {
      console.error("Error deleting task:", error)
      toast({
        title: "Error",
        description: "Unable to delete task",
        variant: "destructive",
      })
    }
  }

  const getEnergyStringFromNumber = (energyLevel: number | null) => {
    if (energyLevel === null) return 'Medium'
    switch (energyLevel) {
      case 0: return 'Low'
      case 1: return 'Medium'
      case 2: return 'High'
      case 3: return 'Extreme'
      default: return 'Medium'
    }
  }

  const getEnergyNumberFromString = (energyString: string) => {
    switch (energyString) {
      case 'Low': return 0
      case 'Medium': return 1
      case 'High': return 2
      case 'Extreme': return 3
      default: return 1
    }
  }

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task title",
        variant: "destructive",
      })
      return
    }

    setCreating(true)
    try {
      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description.trim() || null,
        priority: newTask.priority ? parseInt(newTask.priority.replace('P', '')) : null,
        energyLevel: newTask.energyLevel ? getEnergyNumberFromString(newTask.energyLevel) : null,
        dueDate: newTask.dueDate || null,
        projectId: newTask.projectId || null,
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        throw new Error("Error creating task")
      }

      const createdTask = await response.json()
      
      setNewTask({
        title: '',
        description: '',
        priority: 'P1',
        energyLevel: 'Medium',
        dueDate: undefined,
        projectId: '',
      })
      
      setShowCreateModal(false)
      fetchTasks()
      
      toast({
        title: "Success",
        description: "Task created successfully",
      })
      
      router.refresh()
    } catch (error) {
      console.error('Error creating task:', error)
      toast({
        title: "Error",
        description: "Unable to create task",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateTask = async () => {
    if (!newTask.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task title",
        variant: "destructive",
      })
      return
    }

    if (!editingTask) {
      return
    }

    setUpdating(true)

    try {
      const priorityNumber = parseInt(newTask.priority.replace('P', ''))
      const energyNumber = getEnergyNumberFromString(newTask.energyLevel)

      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        priority: priorityNumber,
        energyLevel: energyNumber,
        dueDate: newTask.dueDate ? newTask.dueDate.toISOString() : null,
        projectId: newTask.projectId || null,
      }

      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        throw new Error("Error updating task")
      }

      const updatedTask = await response.json()
      
      setTasks(prev => prev.map(task => 
        task.id === editingTask.id ? { ...task, ...updatedTask } : task
      ))
      
      setEditingTask(null)
      setShowEditModal(false)
      setNewTask({
        title: '',
        description: '',
        priority: 'P1',
        energyLevel: 'Medium',
        dueDate: undefined,
        projectId: '',
      })
      
      toast({
        title: "Success",
        description: "Task updated successfully",
      })
      
      router.refresh()
    } catch (error) {
      console.error('Error updating task:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleStartTimer = (task: Task) => {
    // Navigate to timer with task
    router.push(`/dashboard/timer?taskId=${task.id}&taskTitle=${encodeURIComponent(task.title)}`)
  }

  const resetForm = () => {
    setNewTask({
      title: '',
      description: '',
      priority: 'P1',
      energyLevel: 'Medium',
      dueDate: undefined,
      projectId: '',
    })
  }

  // Group tasks
  const groupedTasks = groupTasks(tasks)

  // Component to render a task group
  const renderTaskGroup = (title: string, tasks: Task[]) => {
    if (tasks.length === 0) return null

    return (
      <div key={title} className="mb-6">
        <h3 className="text-base font-semibold text-gray-700 mb-3">{title}</h3>
        <div className="space-y-3">
          {tasks.map((task) => {
            const priorityInfo = getPriorityLabel(task.priority)
            const energyInfo = getEnergyLabel(task.energyLevel)
            const dueDateFormatted = formatDueDate(task.dueDate)

            return (
              <div
                key={task.id}
                className={cn(
                  "bg-white rounded-lg border border-gray-200 p-3 transition-all hover:shadow-sm",
                  task.completed && "opacity-60 bg-gray-50"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleTask(task.id, task.completed)}
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                      task.completed
                        ? "bg-[#22c55e] border-[#22c55e]"
                        : "border-gray-300 hover:border-[#22c55e]"
                    )}
                  >
                    {task.completed && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </button>
                  
                  {/* Task content */}
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => handleTaskPress(task)}
                      className="text-left w-full"
                    >
                      <h4 className={cn(
                        "font-medium text-gray-900 mb-1 text-base",
                        task.completed && "line-through text-gray-500"
                      )}>
                        {task.title}
                      </h4>
                      
                      {task.description && (
                        <p className={cn(
                          "text-sm text-gray-600 mb-2 line-clamp-2",
                          task.completed && "text-gray-400"
                        )}>
                          {task.description}
                        </p>
                      )}
                    </button>
                    
                    {/* Metadata */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {priorityInfo && (
                        <Badge 
                          variant="outline" 
                          className="text-xs border rounded-full px-2 py-0.5"
                          style={{ borderColor: priorityInfo.color, color: priorityInfo.color }}
                        >
                          {priorityInfo.label}
                        </Badge>
                      )}
                      
                      {energyInfo && (
                        <Badge 
                          variant="outline" 
                          className="text-xs border rounded-full px-2 py-0.5"
                          style={{ borderColor: energyInfo.color, color: energyInfo.color }}
                        >
                          Energy {energyInfo.label}
                        </Badge>
                      )}
                      
                      {task.project && (
                        <Badge variant="outline" className="text-xs border rounded-full px-2 py-0.5 text-gray-600 border-gray-300">
                          {task.project.name}
                        </Badge>
                      )}
                      
                      {dueDateFormatted && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <CalendarIcon className="w-3 h-3" />
                          <span>{dueDateFormatted}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleStartTimer(task)}
                      className="p-2 text-[#10b981] hover:bg-green-50 rounded transition-colors"
                      title="Start timer"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleTaskPress(task)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C27A] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de tes tâches…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#00C27A] transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour au dashboard</span>
            </button>

            <h1 className="text-2xl font-bold text-gray-900">Tâches</h1>
            <p className="text-sm text-gray-600">
              Organise et priorise tes tâches pour rester focalisé sur l’essentiel.
            </p>
          </div>

          <Button
            onClick={() => {
              resetForm()
              setShowCreateModal(true)
            }}
            className="bg-[#00C27A] hover:bg-[#00A767] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle tâche
          </Button>
        </div>

        {/* Carte principale des tâches */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
          {/* Task groups list */}
          <div className="space-y-6">
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Aucune tâche pour le moment</h3>
                <p className="text-gray-500 mb-6">
                  Crée ta première tâche pour structurer ta journée.
                </p>
                <Button
                  onClick={() => {
                    resetForm()
                    setShowCreateModal(true)
                  }}
                  className="bg-[#00C27A] hover:bg-[#00A767] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle tâche
                </Button>
              </div>
            ) : (
              <>
                {renderTaskGroup("En retard", groupedTasks.overdue)}
                {renderTaskGroup("Aujourd’hui", groupedTasks.today)}
                {renderTaskGroup("Demain", groupedTasks.tomorrow)}
                {renderTaskGroup("Cette semaine", groupedTasks.thisWeek)}
                {renderTaskGroup("Plus tard", groupedTasks.later)}
                {renderTaskGroup("Sans date", groupedTasks.noDueDate)}
              </>
            )}
          </div>
        </div>

        {/* Create Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Task</DialogTitle>
              <DialogDescription>
                Create a new task with all its details
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Task title"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Task description"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a priority" />
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
                  <Label htmlFor="energyLevel">Required Energy Level</Label>
                  <Select
                    value={newTask.energyLevel}
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, energyLevel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an energy level" />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newTask.dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newTask.dueDate ? (
                          format(newTask.dueDate, "PPP", { locale: enUS })
                        ) : (
                          <span>Choose a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newTask.dueDate}
                        onSelect={(date) => setNewTask(prev => ({ ...prev, dueDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select
                    value={newTask.projectId || "__none__"}
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, projectId: value === "__none__" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No project</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTask}
                disabled={creating || !newTask.title.trim()}
                className="bg-[#22c55e] hover:bg-[#16a34a] text-white"
              >
                {creating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Update your task details
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Task title"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Task description"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a priority" />
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
                  <Label htmlFor="edit-energyLevel">Required Energy Level</Label>
                  <Select
                    value={newTask.energyLevel}
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, energyLevel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an energy level" />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newTask.dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newTask.dueDate ? (
                          format(newTask.dueDate, "PPP", { locale: enUS })
                        ) : (
                          <span>Choose a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newTask.dueDate}
                        onSelect={(date) => setNewTask(prev => ({ ...prev, dueDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-project">Project</Label>
                  <Select
                    value={newTask.projectId || "__none__"}
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, projectId: value === "__none__" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No project</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false)
                  setEditingTask(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTask}
                disabled={updating}
                className="bg-[#22c55e] hover:bg-[#16a34a] text-white"
              >
                {updating ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
