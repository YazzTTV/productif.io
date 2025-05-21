"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format, isAfter, isBefore, isToday, addDays, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { 
  CheckCircle2, ClipboardList, Clock, User, Plus, Calendar, 
  AlertCircle, AlertTriangle, FilterX, Pencil, Trash2, MoreHorizontal, Download
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
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
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem,
  CommandList 
} from "@/components/ui/command"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

export default function EntreprisePage() {
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
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

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
        console.log("Données utilisateur reçues:", meData)
        
        if (!meData || !meData.user) {
          setError("Impossible de récupérer les informations utilisateur")
          setIsLoading(false)
          return
        }
        
        setUserInfo(meData.user)
        
        // Récupérer l'entreprise et les utilisateurs avec la nouvelle API
        const companyDataResponse = await fetch("/api/my-company/users")
        if (!companyDataResponse.ok) {
          setError("Vous n'êtes pas associé à une entreprise.")
          setIsLoading(false)
          return
        }
        
        const companyData = await companyDataResponse.json()
        console.log("Données entreprise reçues:", companyData)
        
        if (!companyData?.company) {
          setError("Vous n'êtes pas associé à une entreprise.")
          setIsLoading(false)
          return
        }
        
        setCompany(companyData.company)
        setUsers(companyData.users || [])
        
        // Récupérer les tâches avec la nouvelle API
        const tasksResponse = await fetch("/api/my-company/tasks")
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json()
          console.log("Données tâches reçues:", tasksData)
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
  
  // Mise à jour pour déterminer le statut à partir du champ completed
  const getStatus = (task: Task) => {
    if (task.completed) {
      return 'DONE';
    }
    // Par défaut, si une tâche n'est pas terminée, elle est "À faire"
    return 'TODO';
  }
  
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
  
  const getStatusBadge = (task: Task) => {
    // Si la tâche est complétée
    if (task.completed) {
      return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="mr-1 h-3 w-3" /> Terminé</Badge>
    }
    
    // Si non terminée, afficher "À faire" par défaut
    return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" /> À faire</Badge>
  }
  
  const getPriorityBadge = (priority: number | string) => {
    // Convertir priority en string pour compatibilité
    const priorityStr = priority?.toString() || "";
    
    switch (priorityStr) {
      // Format numérique
      case "0":
      case "1":
        return <Badge variant="destructive">Urgente</Badge>
      case "2":
        return <Badge variant="default">Haute</Badge>
      case "3":
        return <Badge variant="secondary">Moyenne</Badge>
      case "4":
        return <Badge variant="outline">Basse</Badge>
      // Format texte (compatibilité)
      case 'LOW':
        return <Badge variant="outline">Basse</Badge>
      case 'MEDIUM':
        return <Badge variant="secondary">Moyenne</Badge>
      case 'HIGH':
        return <Badge variant="default">Haute</Badge>
      case 'URGENT':
        return <Badge variant="destructive">Urgente</Badge>
      default:
        return <Badge variant="outline">{priorityStr}</Badge>
    }
  }
  
  // Fonction mise à jour pour afficher la véritable priorité utilisateur
  const getPriorityCategory = (priority: number | string, energy: number | null) => {
    // Convertir priority en string pour compatibilité
    const priorityStr = priority?.toString() || "";
    
    // Afficher la priorité exacte définie par l'utilisateur
    switch (priorityStr) {
      case "0":
        return <Badge variant="destructive" className="bg-red-600">P0 - Quick Win</Badge>
      case "1":
        return <Badge variant="destructive">P1 - Urgent</Badge>
      case "2":
        return <Badge variant="default" className="bg-orange-500">P2 - Important</Badge>
      case "3":
        return <Badge variant="secondary">P3 - À faire</Badge>
      case "4":
        return <Badge variant="outline">P4 - Optionnel</Badge>
      // Compatibilité avec l'ancien format (URGENT, HIGH, etc.)
      case "URGENT":
        return <Badge variant="destructive">P1 - Urgent</Badge>
      case "HIGH":
        return <Badge variant="default" className="bg-orange-500">P2 - Important</Badge>
      case "MEDIUM":
        return <Badge variant="secondary">P3 - À faire</Badge>
      case "LOW":
        return <Badge variant="outline">P4 - Optionnel</Badge>
      default:
        return <Badge variant="outline">P{priorityStr}</Badge>
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
      // Nous n'avons pas d'autres statuts dans la base de données
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
        if (priority === null || priority === undefined) return 3 // Default to P3
        
        if (typeof priority === 'number') return priority
        
        switch(priority) {
          case 'URGENT': return 1
          case 'HIGH': return 2
          case 'MEDIUM': return 3
          case 'LOW': return 4
          default: return parseInt(priority) || 3
        }
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
  }, [tasks, selectedUser, selectedStatus, searchQuery, sortColumn, sortDirection])

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
      // Utiliser la route spécifique qui gère la suppression des tâches multiples
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
          const tasksResponse = await fetch("/api/my-company/tasks")
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
    localStorage.setItem('returnTo', '/dashboard/entreprise');
    router.push(`/dashboard/tasks/${taskId}/edit`)
  }

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
      
      // Variables pour suivre les résultats
      let successCount = 0;
      let failedUsers: string[] = [];
      
      // Créer une tâche pour chaque utilisateur assigné
      for (const userId of targetUserIds) {
        try {
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
            // Vérifier si c'est une erreur d'autorisation
            const errorData = await response.json();
            if (response.status === 403) {
              // Erreur d'autorisation : l'utilisateur n'a pas les droits nécessaires
              throw new Error(errorData.error || "Vous n'avez pas l'autorisation de créer des tâches pour cet utilisateur");
            } else {
              // Autre type d'erreur
              throw new Error(errorData.error || `Erreur lors de la création de la tâche pour ${users.find(u => u.id === userId)?.name || userId}`);
            }
          }
          
          successCount++;
        } catch (error) {
          console.error(`Erreur pour l'utilisateur ${userId}:`, error);
          const userName = users.find(u => u.id === userId)?.name || userId;
          failedUsers.push(userName);
          // Continuer avec les autres utilisateurs malgré l'erreur
        }
      }
      
      // Si toutes les tâches ont échoué
      if (successCount === 0) {
        throw new Error("Impossible de créer les tâches pour tous les utilisateurs sélectionnés");
      }
      
      // Recharger les tâches si au moins une a réussi
      if (successCount > 0) {
        const tasksResponse = await fetch("/api/my-company/tasks")
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json()
          setTasks(tasksData.tasks || [])
          setFilteredTasks(tasksData.tasks || [])
        }
        
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
        
        // Afficher un message de succès (avec mention des échecs éventuels)
        if (failedUsers.length > 0) {
          toast({
            title: "Création partielle",
            description: `${successCount} tâche(s) créée(s). Échec pour ${failedUsers.join(', ')}`,
            variant: "default"
          })
        } else {
          toast({
            title: "Tâches créées",
            description: `${successCount} tâche(s) assignée(s) avec succès`,
            variant: "default"
          })
        }
      }
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

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {company?.name || "Mon Entreprise"}
          </h1>
          <p className="text-muted-foreground">
            Consultez et gérez les tâches de votre équipe
          </p>
        </div>
        
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Assigner une tâche
        </Button>
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
                    <SelectItem value="0">P0 - Quick Win</SelectItem>
                    <SelectItem value="1">P1 - Urgent</SelectItem>
                    <SelectItem value="2">P2 - Important</SelectItem>
                    <SelectItem value="3">P3 - À faire</SelectItem>
                    <SelectItem value="4">P4 - Optionnel</SelectItem>
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
                    <SelectItem value="0">Extrême</SelectItem>
                    <SelectItem value="1">Élevé</SelectItem>
                    <SelectItem value="2">Moyen</SelectItem>
                    <SelectItem value="3">Faible</SelectItem>
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
          <CardHeader className="pb-3">
            <CardTitle>Filtres</CardTitle>
            <CardDescription>Filtrer les tâches par utilisateur, statut ou mot-clé</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
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
                <Label htmlFor="search">Recherche</Label>
                <Input
                  id="search"
                  placeholder="Rechercher par titre ou description"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center">
            <ClipboardList className="mr-2 h-5 w-5 text-primary" />
            <CardTitle>Liste des tâches</CardTitle>
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
                  <TableHead className="w-[40%]">
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => toggleSort("title")}
                    >
                      <span>Tâche</span>
                      {sortColumn === "title" ? (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      ) : (
                        <span className="ml-1 text-gray-300">↕</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="w-[20%]">
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => toggleSort("assignee")}
                    >
                      <span>Assignée à</span>
                      {sortColumn === "assignee" ? (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      ) : (
                        <span className="ml-1 text-gray-300">↕</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="w-[15%]">
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => toggleSort("dueDate")}
                    >
                      <span>Deadline</span>
                      {sortColumn === "dueDate" ? (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      ) : (
                        <span className="ml-1 text-gray-300">↕</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="w-[10%]">
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => toggleSort("status")}
                    >
                      <span>Statut</span>
                      {sortColumn === "status" ? (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      ) : (
                        <span className="ml-1 text-gray-300">↕</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="w-[10%] text-right">Actions</TableHead>
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
                    <TableCell className="text-right">
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
    </div>
  )
}