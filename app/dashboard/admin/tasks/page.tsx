"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format, isAfter, isBefore, isToday, addDays, parseISO, startOfDay, endOfDay, isWithinInterval } from "date-fns"
import { fr } from "date-fns/locale"
import { 
  CheckCircle2, ClipboardList, Clock, User, Plus, Calendar, 
  AlertCircle, AlertTriangle, FilterX, FolderPlus, Check, ChevronsUpDown, X,
  Pencil, Trash2, MoreHorizontal, Send, Download
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { AdminRequiredPage } from "@/components/auth/admin-required"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { getManagedCompany } from "@/lib/admin-utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { type DateRange } from "react-day-picker"

interface Task {
  id: string
  title: string
  description: string | null
  priority: number | string
  energyLevel: number | null
  dueDate: string | null
  createdAt: string
  updatedAt: string
  userId: string
  userName: string | null
  userEmail: string
  completed: boolean
  assignedUserIds?: string[]
  assignedUsers?: { id: string; name: string | null; email: string }[]
}

interface User {
  id: string
  name: string | null
  email: string
}

export default function AdminTasksPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [groupedTasks, setGroupedTasks] = useState<any[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [company, setCompany] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Filtres
  const [selectedUser, setSelectedUser] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedPriority, setSelectedPriority] = useState<string>("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  })
  const [searchQuery, setSearchQuery] = useState<string>("")
  
  // Modal d'ajout de tâche
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "3", // P3 par défaut
    energyLevel: "2", // Moyen par défaut
    userId: "",
    assignedUserIds: [] as string[], // Pour la multi-assignation
    dueDate: null as Date | null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openUsersCombobox, setOpenUsersCombobox] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null)
  
  // États pour le tri
  const [sortColumn, setSortColumn] = useState<string>("priority")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Récupérer les informations de l'utilisateur connecté
        const meResponse = await fetch("/api/auth/me")
        if (!meResponse.ok) {
          throw new Error(`Erreur lors de la récupération des informations utilisateur: ${meResponse.statusText}`)
        }
        
        const meData = await meResponse.json()
        
        if (!meData || !meData.user) {
          setError("Impossible de récupérer les informations utilisateur")
          setIsLoading(false)
          return
        }
        
        setUserInfo(meData.user)
        
        // Récupérer l'entreprise de l'utilisateur
        let companyId
        if (meData.user.role === "ADMIN" || meData.user.role === "SUPER_ADMIN") {
          // Pour les admins, utiliser l'entreprise gérée
          const companyResponse = await fetch(`/api/admin/managed-company`)
          const companyData = await companyResponse.json()
          
          if (!companyResponse.ok || !companyData?.company) {
            setError("Aucune entreprise gérée n'est associée à votre compte.")
            setIsLoading(false)
            return
          }
          
          setCompany(companyData.company)
          companyId = companyData.company.id
        } else {
          // Pour les membres normaux, récupérer leur entreprise
          const userCompanyResponse = await fetch(`/api/users/${meData.user.id}/company`)
          const userCompanyData = await userCompanyResponse.json()
          
          if (!userCompanyResponse.ok || !userCompanyData?.company) {
            setError("Vous n'êtes pas associé à une entreprise.")
            setIsLoading(false)
            return
          }
          
          setCompany(userCompanyData.company)
          companyId = userCompanyData.company.id
        }
        
        // Récupérer les utilisateurs de l'entreprise
        const usersResponse = await fetch(`/api/companies/${companyId}/users`)
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData.users || [])
        } else {
          throw new Error("Erreur lors de la récupération des utilisateurs")
        }
        
        // Récupérer les tâches des utilisateurs de l'entreprise
        const tasksResponse = await fetch(`/api/tasks?companyId=${companyId}`)
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json()
          setTasks(tasksData.tasks || [])
          setFilteredTasks(tasksData.tasks || [])
        } else {
          throw new Error("Erreur lors de la récupération des tâches")
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error)
        setError("Une erreur est survenue lors du chargement des données")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // Vérifier si une date d'échéance est dépassée
  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const date = new Date(dueDate)
    return isBefore(date, today)
  }

  // Vérifier si une date d'échéance est aujourd'hui
  const isDueToday = (dueDate: string | null) => {
    if (!dueDate) return false
    return isToday(new Date(dueDate))
  }

  // Vérifier si une date d'échéance est cette semaine
  const isDueSoon = (dueDate: string | null) => {
    if (!dueDate) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextWeek = addDays(today, 7)
    const date = new Date(dueDate)
    return isAfter(date, today) && isBefore(date, nextWeek)
  }
  
  // Badges pour les dates d'échéance
  const getDueDateBadge = (dueDate: string | null) => {
    if (!dueDate) return <span className="text-gray-400">-</span>
    
    if (isOverdue(dueDate)) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          <span>{format(new Date(dueDate), "dd/MM/yyyy", { locale: fr })}</span>
        </Badge>
      )
    }
    
    if (isDueToday(dueDate)) {
      return (
        <Badge variant="default" className="bg-amber-500 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          <span>Aujourd'hui</span>
        </Badge>
      )
    }
    
    if (isDueSoon(dueDate)) {
      return (
        <Badge variant="outline" className="border-amber-500 text-amber-600 flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{format(new Date(dueDate), "dd/MM", { locale: fr })}</span>
        </Badge>
      )
    }
    
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        <span>{format(new Date(dueDate), "dd/MM/yyyy", { locale: fr })}</span>
      </Badge>
    )
  }
  
  // Badge de statut
  const getStatusBadge = (task: Task) => {
    if (task.completed) {
      return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="mr-1 h-3 w-3" /> Terminé</Badge>
    }
    
    return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" /> À faire</Badge>
  }
  
  // Badge de priorité
  const getPriorityBadge = (priority: number | string) => {
    const priorityStr = priority?.toString() || ""
    
    switch (priorityStr) {
      case "0":
        return <Badge variant="outline" className="text-xs font-semibold">P0 - Optionnel</Badge>
      case "1":
        return <Badge variant="secondary" className="text-xs font-semibold">P1 - À faire</Badge>
      case "2":
        return <Badge variant="default" className="bg-orange-500 text-xs font-semibold">P2 - Important</Badge>
      case "3":
        return <Badge variant="destructive" className="text-xs font-semibold">P3 - Urgent</Badge>
      case "4":
        return <Badge variant="default" className="bg-green-500 text-xs font-semibold">P4 - Quick Win</Badge>
      default:
        return <Badge variant="outline" className="text-xs font-semibold">{priorityStr}</Badge>
    }
  }

  // Fonction pour regrouper les tâches identiques assignées à plusieurs personnes
  const groupIdenticalTasks = (tasks: Task[]) => {
    // Créer une map pour stocker les groupes de tâches par titre et description
    const taskGroups = new Map();
    
    tasks.forEach(task => {
      // Créer une clé unique pour regrouper les tâches identiques
      // On considère que deux tâches sont identiques si elles ont le même titre, la même description, 
      // la même date d'échéance, la même priorité et le même niveau d'énergie
      const key = `${task.title}__${task.description || ''}__${task.dueDate || ''}__${task.priority}__${task.energyLevel}`;
      
      if (!taskGroups.has(key)) {
        // Créer un nouveau groupe avec la tâche actuelle comme base
        taskGroups.set(key, {
          ...task,
          // Créer un tableau pour stocker les informations des utilisateurs assignés
          assignedUsers: [{
            id: task.userId,
            name: task.userName,
            email: task.userEmail
          }]
        });
      } else {
        // Ajouter l'utilisateur au groupe existant
        const group = taskGroups.get(key);
        
        // Ajouter l'utilisateur uniquement s'il n'est pas déjà dans le groupe
        const userExists = group.assignedUsers.some((u: any) => u.id === task.userId);
        if (!userExists) {
          group.assignedUsers.push({
            id: task.userId,
            name: task.userName,
            email: task.userEmail
          });
        }
        
        // Si l'une des tâches du groupe est complétée, considérer le groupe comme complété
        if (task.completed) {
          group.completed = true;
        }
      }
    });
    
    // Convertir la map en tableau
    return Array.from(taskGroups.values());
  };

  // Fonction pour changer le tri
  const toggleSort = (column: string) => {
    if (sortColumn === column) {
      // Si on clique sur la même colonne, on inverse la direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Sinon, on trie par la nouvelle colonne en ordre ascendant
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  // Appliquer les filtres et regrouper les tâches
  useEffect(() => {
    let result = [...tasks]
    
    // Filtrer par utilisateur
    if (selectedUser !== "all") {
      result = result.filter(task => task.userId === selectedUser)
    }
    
    // Filtrer par statut
    if (selectedStatus !== "all") {
      if (selectedStatus === "completed") {
        result = result.filter(task => task.completed)
      } else if (selectedStatus === "TODO") {
        result = result.filter(task => !task.completed)
      } 
    }

    // Filtrer par priorité
    if (selectedPriority !== "all") {
      const priorityValue = parseInt(selectedPriority)
      result = result.filter(task => {
        // Gérer les différentes représentations de la priorité (nombre ou chaîne)
        if (typeof task.priority === 'number') {
          return task.priority === priorityValue
        } else if (typeof task.priority === 'string') {
          switch(task.priority) {
            case 'URGENT': return priorityValue === 3 // P3 - Urgent
            case 'HIGH': return priorityValue === 2   // P2 - Important
            case 'MEDIUM': return priorityValue === 1 // P1 - À faire  
            case 'LOW': return priorityValue === 0    // P0 - Optionnel
            default: return false
          }
        }
        return false
      })
    }

    // Filtrer par plage de dates
    if (dateRange && (dateRange.from || dateRange.to)) {
      result = result.filter(task => {
        if (!task.dueDate) return false
        
        const taskDate = new Date(task.dueDate)
        
        if (dateRange.from && dateRange.to) {
          // Cas où on a une plage complète, du début à la fin
          return isWithinInterval(taskDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to)
          })
        } else if (dateRange.from) {
          // Cas où on a seulement une date de début
          return isAfter(taskDate, startOfDay(dateRange.from)) || 
                 isToday(dateRange.from) && isToday(taskDate)
        } else if (dateRange.to) {
          // Cas où on a seulement une date de fin
          return isBefore(taskDate, endOfDay(dateRange.to)) || 
                isToday(dateRange.to) && isToday(taskDate)
        }
        
        return true
      })
    }
    
    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(task => 
        task.title.toLowerCase().includes(query) || 
        (task.description && task.description.toLowerCase().includes(query))
      )
    }
    
    setFilteredTasks(result)
    
    // Regrouper les tâches identiques
    const grouped = groupIdenticalTasks(result);
    
    // Trier les tâches en fonction de la colonne et de la direction
    const sortedTasks = [...grouped].sort((a, b) => {
      // Fonction pour convertir la priorité en nombre pour le tri
      const getPriorityValue = (priority: number | string | null | undefined) => {
        if (priority === null || priority === undefined) return 1 // Default to P1
        
        if (typeof priority === 'number') {
          // Nouveau mapping des priorités numériques (ordre décroissant)
          // P4 (Quick Win) a la valeur la plus élevée pour être affiché en premier
          switch(priority) {
            case 0: return 1 // P0 - Optionnel (valeur la plus basse)
            case 1: return 2 // P1 - À faire
            case 2: return 3 // P2 - Important
            case 3: return 4 // P3 - Urgent
            case 4: return 5 // P4 - Quick Win (valeur la plus haute)
            default: return priority
          }
        } else if (typeof priority === 'string') {
          // Mapping des valeurs textuelles (rétrocompatibilité)
          switch(priority) {
            case 'LOW': return 1     // P0 - Optionnel
            case 'MEDIUM': return 2  // P1 - À faire
            case 'HIGH': return 3    // P2 - Important
            case 'URGENT': return 4  // P3 - Urgent
            default: return parseInt(priority) || 1
          }
        }
        
        return 1 // Valeur par défaut
      }
      
      let comparison = 0
      
      switch (sortColumn) {
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '')
          break
        case 'priority':
          comparison = getPriorityValue(a.priority) - getPriorityValue(b.priority)
          break
        case 'status':
          comparison = (a.completed === b.completed) ? 0 : a.completed ? 1 : -1
          break
        case 'dueDate':
          // Pour les dates, on met celles qui n'ont pas de date à la fin
          if (!a.dueDate && !b.dueDate) comparison = 0
          else if (!a.dueDate) comparison = 1
          else if (!b.dueDate) comparison = -1
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          break
        case 'assignee':
          const aName = a.assignedUsers && a.assignedUsers.length > 0 ? 
            (a.assignedUsers[0].name || a.assignedUsers[0].email) : ''
          const bName = b.assignedUsers && b.assignedUsers.length > 0 ? 
            (b.assignedUsers[0].name || b.assignedUsers[0].email) : ''
          comparison = aName.localeCompare(bName)
          break
        default:
          comparison = 0
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
    
    setGroupedTasks(sortedTasks);
  }, [tasks, selectedUser, selectedStatus, selectedPriority, dateRange, searchQuery, sortColumn, sortDirection])

  // Créer une nouvelle tâche
  const createTask = async () => {
    if (!newTask.title || (newTask.assignedUserIds.length === 0 && !newTask.userId)) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires et assigner la tâche à au moins une personne",
        variant: "destructive"
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Déterminer les utilisateurs assignés
      const targetUserIds = newTask.assignedUserIds.length > 0 
        ? newTask.assignedUserIds 
        : [newTask.userId]
      
      // Créer une tâche pour chaque utilisateur assigné
      for (const userId of targetUserIds) {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: newTask.title,
            description: newTask.description,
            priority: parseInt(newTask.priority),
            energyLevel: parseInt(newTask.energyLevel),
            dueDate: newTask.dueDate,
            userId: userId
          })
        })
        
        if (!response.ok) {
          throw new Error(`Erreur lors de la création de la tâche pour ${users.find(u => u.id === userId)?.name || userId}`)
        }
      }
      
      // Recharger les tâches
      const tasksResponse = await fetch("/api/tasks?companyId=" + (userInfo?.managedCompanyId || ""))
      const tasksData = await tasksResponse.json()
      setTasks(tasksData.tasks || [])
      setFilteredTasks(tasksData.tasks || [])
      
      // Réinitialiser le formulaire
      setNewTask({
        title: "",
        description: "",
        priority: "3",
        energyLevel: "2",
        userId: "",
        assignedUserIds: [],
        dueDate: null
      })
      
      // Fermer le modal
      setIsDialogOpen(false)
      
      toast({
        title: "Tâches créées",
        description: `${targetUserIds.length} tâche(s) assignée(s) avec succès`,
        variant: "default"
      })
    } catch (error) {
      console.error("Erreur lors de la création des tâches:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer les tâches",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fonction pour ajouter/retirer un utilisateur de la liste des assignés
  const toggleUserAssignment = (userId: string) => {
    setNewTask(prev => {
      const isAlreadyAssigned = prev.assignedUserIds.includes(userId)
      
      if (isAlreadyAssigned) {
        // Retirer l'utilisateur de la liste
        return {
          ...prev,
          assignedUserIds: prev.assignedUserIds.filter(id => id !== userId)
        }
      } else {
        // Ajouter l'utilisateur à la liste
        return {
          ...prev,
          assignedUserIds: [...prev.assignedUserIds, userId]
        }
      }
    })
  }

  // Supprimer un utilisateur assigné
  const removeAssignedUser = (userId: string) => {
    setNewTask(prev => ({
      ...prev,
      assignedUserIds: prev.assignedUserIds.filter(id => id !== userId)
    }))
  }

  // Récupérer les initiales d'un utilisateur
  const getUserInitials = (name: string | null, email: string) => {
    if (name) {
      const nameParts = name.split(' ')
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      }
      return name[0].toUpperCase()
    }
    return email[0].toUpperCase()
  }

  // Fonction pour générer une couleur de fond basée sur l'ID utilisateur
  const getUserColor = (userId: string) => {
    const colors = [
      'bg-red-100 text-red-800',
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-teal-100 text-teal-800'
    ]
    
    // Utiliser l'ID pour générer un index dans le tableau de couleurs
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
  }

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSelectedUser("all")
    setSelectedStatus("all")
    setSelectedPriority("all")
    setDateRange(undefined)
    setSearchQuery("")
  }

  // Rendre la liste des assignés pour une tâche groupée
  const renderAssignedUsers = (users: { id: string, name: string | null, email: string }[]) => {
    // Si un seul utilisateur, afficher simplement son nom/email avec son avatar
    if (users.length === 1) {
      const user = users[0];
      return (
        <div className="flex items-center gap-2">
          <Avatar className={cn("h-8 w-8", getUserColor(user.id))}>
            <AvatarFallback>
              {getUserInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {user.name || user.email.split('@')[0]}
          </span>
        </div>
      );
    }
    
    // Si plusieurs utilisateurs, afficher jusqu'à 3 avatars avec un compteur
    return (
      <div className="flex flex-col space-y-2">
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {users.slice(0, 3).map((user, index) => (
              <Avatar 
                key={user.id} 
                className={cn(
                  "h-7 w-7 border-2 border-background", 
                  getUserColor(user.id)
                )}
              >
                <AvatarFallback>
                  {getUserInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
            ))}
            
            {users.length > 3 && (
              <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-xs font-medium">
                +{users.length - 3}
              </div>
            )}
          </div>
          
          <span className="ml-2 text-sm font-medium">
            {users.length} personnes
          </span>
        </div>
        
        <div className="text-xs text-muted-foreground">
          {users.slice(0, 2).map(user => user.name || user.email.split('@')[0]).join(', ')}
          {users.length > 2 && `, +${users.length - 2}`}
        </div>
      </div>
    );
  };

  // Marquer une tâche comme terminée ou non terminée
  const toggleTaskStatus = async (taskId: string, completed: boolean) => {
    setIsUpdatingStatus(taskId)
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ completed: !completed })
      })
      
      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du statut de la tâche")
      }
      
      // Mettre à jour l'état local des tâches
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, completed: !completed } : task
      ))
      
      toast({
        title: completed ? "Tâche marquée comme à faire" : "Tâche marquée comme terminée",
        variant: "default"
      })
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la tâche",
        variant: "destructive"
      })
    } finally {
      setIsUpdatingStatus(null)
    }
  }
  
  // Supprimer une tâche
  const deleteTask = async (taskId: string) => {
    setIsDeleting(taskId)
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE"
      })
      
      // Récupérer la réponse JSON, même en cas d'erreur
      let result;
      try {
        result = await response.json();
      } catch (e) {
        console.error("Erreur lors de l'analyse de la réponse JSON:", e);
        throw new Error("Format de réponse invalide");
      }
      
      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la suppression de la tâche");
      }
      
      // Afficher le message approprié
      if (result.message && result.message.includes("tâches similaires")) {
        toast({
          title: "Tâches supprimées",
          description: result.message,
          variant: "default"
        })
        
        // Recharger toutes les tâches pour mettre à jour l'affichage
        try {
          const companyId = userInfo?.managedCompanyId || "";
          const tasksResponse = await fetch(`/api/tasks?companyId=${companyId}`)
          if (tasksResponse.ok) {
            const tasksData = await tasksResponse.json()
            setTasks(tasksData.tasks || [])
            setFilteredTasks(tasksData.tasks || [])
          }
        } catch (refreshError) {
          console.error("Erreur lors du rechargement des tâches:", refreshError);
          // Mettre à jour l'état local des tâches par précaution
          setTasks(prev => prev.filter(task => task.id !== taskId))
        }
      } else {
        toast({
          title: "Tâche supprimée",
          variant: "default"
        })
        
        // Mettre à jour l'état local des tâches
        setTasks(prev => prev.filter(task => task.id !== taskId))
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer la tâche",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(null)
    }
  }
  
  // Modifier une tâche (redirection vers la page d'édition)
  const editTask = (taskId: string) => {
    // Sauvegarder la page actuelle pour y revenir après l'édition
    localStorage.setItem('returnTo', '/dashboard/admin/tasks');
    router.push(`/dashboard/tasks/${taskId}/edit`)
  }

  // Exporter les tâches filtrées au format CSV
  const exportTasksToCSV = () => {
    if (filteredTasks.length === 0) {
      toast({
        title: "Aucune tâche à exporter",
        description: "Il n'y a aucune tâche correspondant à vos filtres actuels.",
        variant: "destructive"
      })
      return
    }

    try {
      // Définir les en-têtes du CSV
      const headers = [
        'ID',
        'Titre',
        'Description',
        'Priorité',
        'Niveau d\'énergie',
        'Date d\'échéance',
        'Assignée à',
        'Email',
        'Statut',
        'Date de création'
      ]

      // Convertir les valeurs numériques de priorité en texte
      const getPriorityText = (priority: number | string) => {
        const priorityStr = priority?.toString() || ""
        
        switch (priorityStr) {
          case "0":
            return "P0 - Optionnel"
          case "1":
          case "URGENT":  // Pour rétrocompatibilité
            return "P1 - À faire"
          case "2":
          case "HIGH":    // Pour rétrocompatibilité
            return "P2 - Important"
          case "3":
          case "MEDIUM":  // Pour rétrocompatibilité
            return "P3 - Urgent"
          case "4":
          case "LOW":     // Pour rétrocompatibilité
            return "P4 - Quick Win"
          default:
            return priorityStr
        }
      }

      // Convertir les valeurs numériques de niveau d'énergie en texte
      const getEnergyLevelText = (energyLevel: number | null) => {
        switch (energyLevel) {
          case 0: return "Faible"
          case 1: return "Moyen"
          case 2: return "Élevé"
          case 3: return "Extrême"
          default: return "Non défini"
        }
      }

      // Préparer les données pour le CSV
      const csvData = groupedTasks.map(task => {
        // Formater la liste des utilisateurs assignés
        const assignedUsers = task.assignedUsers || []
        const assignedNames = assignedUsers.map((u: any) => u.name || u.email.split('@')[0]).join(', ')
        const assignedEmails = assignedUsers.map((u: any) => u.email).join(', ')
        
        return [
          task.id,
          task.title,
          task.description || '',
          getPriorityText(task.priority),
          getEnergyLevelText(task.energyLevel),
          task.dueDate ? format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: fr }) : '',
          assignedNames,
          assignedEmails,
          task.completed ? 'Terminée' : 'À faire',
          format(new Date(task.createdAt), 'dd/MM/yyyy', { locale: fr })
        ]
      })

      // Ajouter les en-têtes au début
      csvData.unshift(headers)

      // Convertir les données en chaîne CSV
      const csvString = csvData.map(row => 
        row.map(cell => {
          // Échapper les virgules et les guillemets
          const formattedCell = String(cell).replace(/"/g, '""')
          return `"${formattedCell}"`
        }).join(',')
      ).join('\n')

      // Créer un objet Blob avec les données CSV
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })

      // Créer un URL pour le blob
      const url = URL.createObjectURL(blob)

      // Créer un élément ancre pour le téléchargement
      const link = document.createElement('a')
      link.href = url
      
      // Nommer le fichier avec la date du jour
      const today = format(new Date(), 'yyyy-MM-dd', { locale: fr })
      link.setAttribute('download', `taches-productif-${today}.csv`)
      
      // Ajouter l'élément au DOM, cliquer dessus et le supprimer
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Exportation réussie",
        description: `${filteredTasks.length} tâche(s) exportée(s) au format CSV.`,
        variant: "default"
      })
    } catch (error) {
      console.error("Erreur lors de l'exportation des tâches:", error)
      toast({
        title: "Erreur d'exportation",
        description: "Une erreur est survenue lors de l'exportation des tâches.",
        variant: "destructive"
      })
    }
  }

  // Calculer les statistiques des tâches
  const calculateTaskStats = () => {
    if (tasks.length === 0) return null

    // Initialiser les compteurs
    const stats = {
      total: tasks.length,
      completed: 0,
      pending: 0,
      overdue: 0,
      dueToday: 0,
      priorities: {
        p1: 0,
        p2: 0,
        p3: 0,
        p4: 0
      },
      // Map pour compter les tâches par utilisateur
      userTaskCounts: new Map()
    }

    // Compter les tâches
    tasks.forEach(task => {
      // Statut
      if (task.completed) {
        stats.completed++
      } else {
        stats.pending++
        
        // Dates
        if (task.dueDate) {
          if (isOverdue(task.dueDate)) {
            stats.overdue++
          } else if (isDueToday(task.dueDate)) {
            stats.dueToday++
          }
        }
      }

      // Priorités
      const priority = task.priority?.toString() || ""
      if (priority === "0" || priority === "1" || priority === "URGENT") {
        stats.priorities.p1++
      } else if (priority === "2" || priority === "HIGH") {
        stats.priorities.p2++
      } else if (priority === "3" || priority === "MEDIUM") {
        stats.priorities.p3++
      } else if (priority === "4" || priority === "LOW") {
        stats.priorities.p4++
      }

      // Comptage par utilisateur
      const userId = task.userId
      const user = users.find(u => u.id === userId)
      if (user) {
        const userName = user.name || user.email.split('@')[0]
        const userTaskCount = stats.userTaskCounts.get(userName) || { total: 0, completed: 0, pending: 0 }
        userTaskCount.total++
        
        if (task.completed) {
          userTaskCount.completed++
        } else {
          userTaskCount.pending++
        }
        
        stats.userTaskCounts.set(userName, userTaskCount)
      }
    })

    // Convertir la map en tableau pour le rendu
    const userStats = Array.from(stats.userTaskCounts.entries())
      .map(([name, counts]) => ({ name, ...counts }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5) // Limiter aux 5 premiers utilisateurs

    return {
      ...stats,
      userStats
    }
  }

  // Récupérer les statistiques
  const taskStats = calculateTaskStats()

  // Composant pour l'en-tête de colonne triable
  const SortableHeader = ({ column, label }: { column: string, label: string }) => {
    return (
      <div
        className="flex items-center cursor-pointer"
        onClick={() => toggleSort(column)}
      >
        <span>{label}</span>
        {sortColumn === column ? (
          <span className="ml-1">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        ) : (
          <span className="ml-1 text-gray-300">↕</span>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {userInfo?.role === "ADMIN" || userInfo?.role === "SUPER_ADMIN" 
              ? "Tableau des tâches"
              : "Tableau des tâches"}
          </h1>
          <p className="text-muted-foreground">
            Gérez et visualisez toutes les tâches assignées aux membres de l'équipe
          </p>
        </div>
        
        <div className="flex space-x-2">
          {filteredTasks.length > 0 && (
            <Button variant="outline" onClick={exportTasksToCSV}>
              <Download className="mr-2 h-4 w-4" /> Exporter CSV
            </Button>
          )}
          
          {(userInfo?.role === "ADMIN" || userInfo?.role === "SUPER_ADMIN") && !error && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <FolderPlus className="mr-2 h-4 w-4" /> Assigner une tâche
            </Button>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Assigner une nouvelle tâche</DialogTitle>
            <DialogDescription>
              Créez une tâche et assignez-la à un ou plusieurs membres de votre équipe
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Titre de la tâche *</Label>
              <Input
                id="title"
                placeholder="Titre de la tâche"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description de la tâche"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priorité</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask({...newTask, priority: value})}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Sélectionner une priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">P0 - Optionnel</SelectItem>
                    <SelectItem value="1">P1 - À faire</SelectItem>
                    <SelectItem value="2">P2 - Important</SelectItem>
                    <SelectItem value="3">P3 - Urgent</SelectItem>
                    <SelectItem value="4">P4 - Quick Win</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="energy">Niveau d'énergie</Label>
                <Select
                  value={newTask.energyLevel}
                  onValueChange={(value) => setNewTask({...newTask, energyLevel: value})}
                >
                  <SelectTrigger id="energy">
                    <SelectValue placeholder="Niveau d'énergie requis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Faible</SelectItem>
                    <SelectItem value="1">Moyen</SelectItem>
                    <SelectItem value="2">Élevé</SelectItem>
                    <SelectItem value="3">Extrême</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="assignees">Assigner à *</Label>
              <Popover open={openUsersCombobox} onOpenChange={setOpenUsersCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openUsersCombobox}
                    className="justify-between w-full"
                  >
                    {newTask.assignedUserIds.length === 0 
                      ? "Sélectionner des membres" 
                      : `${newTask.assignedUserIds.length} membre(s) sélectionné(s)`}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Rechercher un membre..." />
                    <CommandEmpty>Aucun membre trouvé.</CommandEmpty>
                    <CommandGroup>
                      <CommandList>
                        {users.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.id}
                            onSelect={() => toggleUserAssignment(user.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                newTask.assignedUserIds.includes(user.id) 
                                  ? "opacity-100" 
                                  : "opacity-0"
                              )}
                            />
                            {user.name || user.email}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Afficher les utilisateurs sélectionnés */}
              {newTask.assignedUserIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newTask.assignedUserIds.map(userId => {
                    const user = users.find(u => u.id === userId);
                    return (
                      <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                        <span>{user?.name || user?.email}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => removeAssignedUser(userId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Date d'échéance</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !newTask.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTask.dueDate ? (
                      format(newTask.dueDate, "PPP", { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={newTask.dueDate || undefined}
                    onSelect={(date) => setNewTask({...newTask, dueDate: date || null})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={createTask} disabled={isSubmitting}>
              {isSubmitting 
                ? "Création..." 
                : newTask.assignedUserIds.length > 1 
                  ? `Créer ${newTask.assignedUserIds.length} tâches` 
                  : "Créer la tâche"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle>Accès impossible aux tâches</CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mt-4">
              <Button
                onClick={() => router.push("/dashboard")}
              >
                Retour au tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle>Filtres</CardTitle>
              <CardDescription>Filtrer les tâches par utilisateur, statut ou mot-clé</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetFilters}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <FilterX className="h-4 w-4" /> Réinitialiser
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="user-filter">Utilisateur</Label>
                <Select
                  value={selectedUser}
                  onValueChange={setSelectedUser}
                >
                  <SelectTrigger id="user-filter">
                    <SelectValue placeholder="Tous les utilisateurs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les utilisateurs</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status-filter">Statut</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="completed">Terminées</SelectItem>
                    <SelectItem value="TODO">À faire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority-filter">Priorité</Label>
                <Select
                  value={selectedPriority}
                  onValueChange={setSelectedPriority}
                >
                  <SelectTrigger id="priority-filter">
                    <SelectValue placeholder="Toutes les priorités" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les priorités</SelectItem>
                    <SelectItem value="0" className="text-gray-400 font-semibold">P0 - Optionnel</SelectItem>
                    <SelectItem value="1" className="text-blue-600 font-semibold">P1 - À faire</SelectItem>
                    <SelectItem value="2" className="text-orange-500 font-semibold">P2 - Important</SelectItem>
                    <SelectItem value="3" className="text-red-600 font-semibold">P3 - Urgent</SelectItem>
                    <SelectItem value="4" className="text-green-600 font-semibold">P4 - Quick Win</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date-filter">Date d'échéance</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date-filter"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange?.from && !dateRange?.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from || dateRange?.to ? (
                        <>
                          {dateRange?.from ? format(dateRange.from, "dd/MM/yyyy", { locale: fr }) : "Début"}
                          {" - "}
                          {dateRange?.to ? format(dateRange.to, "dd/MM/yyyy", { locale: fr }) : "Fin"}
                        </>
                      ) : (
                        <span>Toutes les dates</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      locale={fr}
                    />
                    <div className="flex items-center justify-between p-3 border-t border-border">
                      <Button
                        variant="ghost"
                        onClick={() => setDateRange(undefined)}
                        className="text-xs"
                      >
                        Réinitialiser
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          // Fermer le popover en cliquant ailleurs
                          const body = document.body
                          if (body) body.click()
                        }}
                      >
                        Appliquer
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="mt-4">
              <Label htmlFor="search">Recherche</Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  id="search"
                  placeholder="Rechercher par titre ou description"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setSearchQuery("")}
                  disabled={!searchQuery}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center">
            <ClipboardList className="mr-2 h-5 w-5 text-primary" />
            <CardTitle>Tableau des tâches de l'équipe</CardTitle>
          </div>
          <CardDescription>
            {filteredTasks.length} tâche{filteredTasks.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Aucune tâche</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Aucune tâche ne correspond à vos critères de recherche
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[5%]"></TableHead>
                  <TableHead className="w-[45%]">
                    <SortableHeader column="title" label="Tâche" />
                  </TableHead>
                  <TableHead className="w-[20%]">
                    <SortableHeader column="assignee" label="Assignée à" />
                  </TableHead>
                  <TableHead className="w-[15%]">
                    <SortableHeader column="dueDate" label="Deadline" />
                  </TableHead>
                  <TableHead className="w-[10%]">
                    <SortableHeader column="status" label="Statut" />
                  </TableHead>
                  <TableHead className="w-[5%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedTasks.map((task) => (
                  <TableRow 
                    key={task.id}
                    className={cn(
                      task.completed ? 'bg-green-50 dark:bg-green-950/20' : '',
                      !task.completed && task.dueDate && isOverdue(task.dueDate) ? 'bg-red-50 dark:bg-red-950/20' : '',
                      !task.completed && task.dueDate && isDueToday(task.dueDate) ? 'bg-amber-50 dark:bg-amber-950/20' : ''
                    )}
                  >
                    <TableCell className="pr-0">
                      <Checkbox 
                        checked={task.completed}
                        disabled={isUpdatingStatus === task.id}
                        onCheckedChange={() => toggleTaskStatus(task.id, task.completed)}
                        className={cn(
                          task.completed ? "bg-green-600 border-green-600" : "",
                          isUpdatingStatus === task.id ? "opacity-50" : ""
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        {getPriorityBadge(task.priority)}
                        <div className="flex flex-col">
                          <span className={cn(
                            "font-medium",
                            task.completed && "line-through text-muted-foreground"
                          )}>
                            {task.title}
                          </span>
                          {task.description && (
                            <span className="text-xs text-muted-foreground line-clamp-1 mt-1">
                              {task.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderAssignedUsers(task.assignedUsers)}
                    </TableCell>
                    <TableCell>
                      {getDueDateBadge(task.dueDate)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(task)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => toggleTaskStatus(task.id, task.completed)}
                            disabled={isUpdatingStatus === task.id}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {task.completed ? "Marquer comme à faire" : "Marquer comme terminée"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => editTask(task.id)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600"
                            onClick={() => deleteTask(task.id)}
                            disabled={isDeleting === task.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isDeleting === task.id ? "Suppression..." : "Supprimer"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!isLoading && !error && taskStats && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {/* Statistiques globales */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Vue d'ensemble</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total des tâches</span>
                  <span className="font-semibold">{taskStats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Terminées</span>
                  <div className="flex items-center">
                    <span className="font-semibold">{taskStats.completed}</span>
                    <span className="text-xs ml-1 text-muted-foreground">
                      ({Math.round((taskStats.completed / taskStats.total) * 100)}%)
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">À faire</span>
                  <div className="flex items-center">
                    <span className="font-semibold">{taskStats.pending}</span>
                    <span className="text-xs ml-1 text-muted-foreground">
                      ({Math.round((taskStats.pending / taskStats.total) * 100)}%)
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">En retard</span>
                  <Badge variant="destructive">{taskStats.overdue}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pour aujourd'hui</span>
                  <Badge variant="outline" className="border-amber-500 text-amber-600">{taskStats.dueToday}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Répartition par priorité */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Priorités</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Badge variant="destructive" className="mr-2">P1</Badge>
                    <span className="text-muted-foreground">Urgent</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold">{taskStats.priorities.p1}</span>
                    <span className="text-xs ml-1 text-muted-foreground">
                      ({Math.round((taskStats.priorities.p1 / taskStats.total) * 100)}%)
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Badge variant="default" className="bg-orange-500 mr-2">P2</Badge>
                    <span className="text-muted-foreground">Important</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold">{taskStats.priorities.p2}</span>
                    <span className="text-xs ml-1 text-muted-foreground">
                      ({Math.round((taskStats.priorities.p2 / taskStats.total) * 100)}%)
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Badge variant="secondary" className="mr-2">P3</Badge>
                    <span className="text-muted-foreground">Normal</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold">{taskStats.priorities.p3}</span>
                    <span className="text-xs ml-1 text-muted-foreground">
                      ({Math.round((taskStats.priorities.p3 / taskStats.total) * 100)}%)
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2">P4</Badge>
                    <span className="text-muted-foreground">Optionnel</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold">{taskStats.priorities.p4}</span>
                    <span className="text-xs ml-1 text-muted-foreground">
                      ({Math.round((taskStats.priorities.p4 / taskStats.total) * 100)}%)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progression visuelle */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progression globale</span>
                    <span className="font-medium">{Math.round((taskStats.completed / taskStats.total) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${Math.round((taskStats.completed / taskStats.total) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">P1 (Urgent)</span>
                    <span className="font-medium">
                      {taskStats.priorities.p1 > 0 
                        ? `${taskStats.priorities.p1} tâche(s)` 
                        : 'Aucune tâche'}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-destructive" 
                      style={{ width: `${Math.round((taskStats.priorities.p1 / taskStats.total) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Tâches en retard</span>
                    <span className="font-medium">
                      {taskStats.overdue > 0 
                        ? `${taskStats.overdue} tâche(s)` 
                        : 'Aucune tâche'}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500" 
                      style={{ width: `${Math.round((taskStats.overdue / taskStats.total) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top utilisateurs */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Top 5 utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {taskStats.userStats.length > 0 ? (
                  taskStats.userStats.map((user, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium truncate max-w-[150px]" title={user.name}>
                          {user.name}
                        </span>
                        <div className="flex items-center">
                          <span className="font-semibold">{user.total}</span>
                          <span className="text-xs ml-1 text-muted-foreground">
                            ({Math.round((user.completed / user.total) * 100)}% terminées)
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500" 
                          style={{ width: `${Math.round((user.completed / user.total) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-2">
                    Aucune donnée
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 