"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CheckCircle2, ClipboardList, Clock, User, XCircle, Plus, Calendar } from "lucide-react"
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
    dueDate: null as Date | null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Vérifier si l'utilisateur est un super admin et le rediriger si c'est le cas
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          setUserInfo(data.user)
          
          // Rediriger si c'est un super admin
          if (data.user?.role === "SUPER_ADMIN") {
            router.push("/dashboard/admin")
          }
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du rôle:", error)
      }
    }
    
    checkUserRole()
  }, [router])

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
        
        // Utiliser l'API directement pour récupérer l'entreprise gérée
        const companyResponse = await fetch(`/api/admin/managed-company`)
        const companyData = await companyResponse.json()
        console.log("Données entreprise reçues:", companyData)
        
        if (!companyResponse.ok || !companyData?.company) {
          setError("Aucune entreprise gérée n'est associée à votre compte. Veuillez contacter un administrateur pour associer votre compte à une entreprise.")
          setIsLoading(false)
          return
        }
        
        setCompany(companyData.company)
        const companyId = companyData.company.id
        
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
        console.error("Erreur lors du chargement des données", error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les données",
          variant: "destructive"
        })
        setError("Une erreur est survenue lors du chargement des données. Veuillez réessayer ultérieurement.")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [toast])
  
  // Mise à jour pour déterminer le statut à partir du champ completed
  const getStatus = (task: Task) => {
    if (task.completed) {
      return 'DONE';
    }
    // Par défaut, si une tâche n'est pas terminée, elle est "À faire"
    return 'TODO';
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

  // Appliquer les filtres
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
  }, [tasks, selectedUser, selectedStatus, searchQuery])

  // Créer une nouvelle tâche
  const createTask = async () => {
    if (!newTask.title || !newTask.userId) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }
    
    setIsSubmitting(true)
    
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
          userId: newTask.userId
        })
      })
      
      if (!response.ok) {
        throw new Error("Erreur lors de la création de la tâche")
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
        dueDate: null
      })
      
      // Fermer le modal
      setIsDialogOpen(false)
      
      toast({
        title: "Tâche créée",
        description: "La tâche a été créée avec succès",
        variant: "default"
      })
    } catch (error) {
      console.error("Erreur lors de la création de la tâche:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminRequiredPage prohibitSuperAdmin>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tâches des membres</h1>
          <p className="text-muted-foreground">
            Gérez les tâches assignées aux membres de votre entreprise
          </p>
        </div>
        
        {!error && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Assigner une tâche
          </Button>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assigner une nouvelle tâche</DialogTitle>
            <DialogDescription>
              Créez une tâche et assignez-la à un membre de votre équipe
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
              <Label htmlFor="assignee">Assigner à *</Label>
              <Select
                value={newTask.userId}
                onValueChange={(value) => setNewTask({...newTask, userId: value})}
              >
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Sélectionner un membre" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {isSubmitting ? "Création..." : "Créer la tâche"}
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
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Assignée à</TableHead>
                  <TableHead>Complétée</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow 
                    key={task.id}
                    className={task.completed ? 'bg-green-50 dark:bg-green-950/20' : ''}
                  >
                    <TableCell className="font-medium">
                      {task.completed ? (
                        <span className="flex items-center">
                          <CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
                          <span className="line-through text-muted-foreground">{task.title}</span>
                        </span>
                      ) : (
                        task.title
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        {task.userName || task.userEmail}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(task)}</TableCell>
                    <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                    <TableCell>{getPriorityCategory(task.priority, task.energyLevel)}</TableCell>
                    <TableCell>
                      {task.dueDate ? format(new Date(task.dueDate), "dd/MM/yyyy", { locale: fr }) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                      >
                        Détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminRequiredPage>
  )
} 