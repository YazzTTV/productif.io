"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { AdminRequiredPage } from "@/components/auth/admin-required"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  Clock, 
  Users, 
  AlertTriangle, 
  Calendar, 
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  CheckSquare,
  AlertCircle
} from "lucide-react"
import { format, subDays } from "date-fns"
import { fr } from "date-fns/locale"
import { getManagedCompany } from "@/lib/admin-utils"

export default function AdminAnalyticsPage() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [company, setCompany] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Récupérer les informations de l'utilisateur connecté
        const meResponse = await fetch("/api/auth/me")
        if (!meResponse.ok) {
          throw new Error(`Erreur lors de la récupération des informations utilisateur: ${meResponse.statusText}`)
        }
        
        const meData = await meResponse.json()
        console.log("Données utilisateur reçues:", meData)
        setUserInfo(meData)

        // Vérifier que l'utilisateur existe
        if (!meData || !meData.user) {
          setError("Impossible de récupérer les informations utilisateur")
          setIsLoading(false)
          return
        }

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
        if (!usersResponse.ok) {
          throw new Error(`Erreur lors de la récupération des utilisateurs: ${usersResponse.statusText}`)
        }
        
        const usersData = await usersResponse.json()
        console.log("Données d'utilisateurs reçues:", usersData)
        
        // S'assurer que usersData est un tableau
        if (Array.isArray(usersData)) {
          setUsers(usersData)
        } else if (usersData && Array.isArray(usersData.users)) {
          setUsers(usersData.users)
        } else {
          console.warn("Format de données utilisateurs inattendu:", usersData)
          setUsers([])
        }

        // Récupérer les tâches de l'entreprise
        const tasksResponse = await fetch(`/api/tasks?companyId=${companyId}`)
        if (!tasksResponse.ok) {
          throw new Error(`Erreur lors de la récupération des tâches: ${tasksResponse.statusText}`)
        }
        
        const tasksData = await tasksResponse.json()
        console.log("Données de tâches reçues:", tasksData)
        
        if (tasksData && tasksData.tasks) {
          setTasks(tasksData.tasks)
        } else {
          console.warn("Format de données de tâches inattendu:", tasksData)
          setTasks([])
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données", error)
        setError("Une erreur est survenue lors du chargement des données. Veuillez réessayer ultérieurement.")
        setTasks([])
        setUsers([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculer les statistiques
  const calculateStats = () => {
    if (tasks === null || users === null) return null
    if (!Array.isArray(users)) {
      console.error("'users' n'est pas un tableau:", users)
      return null
    }

    // Nombre total de tâches
    const totalTasks = tasks.length
    
    // Nombre de tâches complétées
    const completedTasks = tasks.filter(task => task.completed).length
    
    // Taux de complétion
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    // Tâches par statut de priorité
    const tasksByPriority = {
      p0: tasks.filter(task => task.priority === 0 || task.priority === "0").length,
      p1: tasks.filter(task => task.priority === 1 || task.priority === "1").length,
      p2: tasks.filter(task => task.priority === 2 || task.priority === "2").length,
      p3: tasks.filter(task => task.priority === 3 || task.priority === "3").length || tasks.filter(task => task.priority === null || task.priority === undefined).length,
      p4: tasks.filter(task => task.priority === 4 || task.priority === "4").length,
    }
    
    // Taux de complétion des tâches prioritaires (P4 et P3)
    const highPriorityTasks = tasks.filter(task => 
      task.priority === 4 || task.priority === "4" || 
      task.priority === 3 || task.priority === "3"
    )
    const completedHighPriorityTasks = highPriorityTasks.filter(task => task.completed)
    const highPriorityCompletionRate = highPriorityTasks.length > 0 
      ? Math.round((completedHighPriorityTasks.length / highPriorityTasks.length) * 100) 
      : 0

    // Tâches en retard (avec date d'échéance passée et non complétées)
    const today = new Date()
    const overdueTasks = tasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      new Date(task.dueDate) < today
    )
    
    // Tâches par utilisateur
    const tasksByUser = Array.isArray(users) ? users.map(user => {
      const userTasks = tasks.filter(task => task.userId === user.id)
      const userCompletedTasks = userTasks.filter(task => task.completed)
      return {
        id: user.id,
        name: user.name || user.email,
        totalTasks: userTasks.length,
        completedTasks: userCompletedTasks.length,
        completionRate: userTasks.length > 0 
          ? Math.round((userCompletedTasks.length / userTasks.length) * 100) 
          : 0
      }
    }).sort((a, b) => b.completionRate - a.completionRate) : [] // Trier par taux de complétion décroissant

    return {
      totalTasks,
      completedTasks,
      completionRate,
      tasksByPriority,
      highPriorityCompletionRate,
      overdueTasks: overdueTasks.length,
      tasksByUser
    }
  }

  const stats = calculateStats()
  
  // Données pour les graphiques
  const priorityChartData = stats ? [
    { name: "P0", value: stats.tasksByPriority.p0, color: "#9ca3af" }, // Optionnel - gris
    { name: "P1", value: stats.tasksByPriority.p1, color: "#3b82f6" }, // À faire - bleu
    { name: "P2", value: stats.tasksByPriority.p2, color: "#eab308" }, // Important - jaune
    { name: "P3", value: stats.tasksByPriority.p3, color: "#f97316" }, // Urgent - orange
    { name: "P4", value: stats.tasksByPriority.p4, color: "#22c55e" }  // Quick Win - vert
  ].filter(item => item.value > 0) : []
  
  const completionChartData = stats ? [
    { name: "Terminées", value: stats.completedTasks, color: "#22c55e" },
    { name: "À faire", value: stats.totalTasks - stats.completedTasks, color: "#9ca3af" }
  ].filter(item => item.value > 0) : []

  const COLORS = ["#9ca3af", "#3b82f6", "#eab308", "#f97316", "#22c55e"]

  return (
    <AdminRequiredPage>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord - Performance de l'équipe</h1>
          <p className="text-muted-foreground">
            Suivez les performances et la productivité de votre équipe
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle>Accès impossible aux statistiques</CardTitle>
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
        <div className="space-y-6">
          {!stats ? (
            <Card>
              <CardHeader>
                <CardTitle>Données insuffisantes</CardTitle>
                <CardDescription>
                  Il n'y a pas assez de données pour afficher des statistiques. Commencez par créer des tâches pour vos utilisateurs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mt-4">
                  <Button
                    onClick={() => router.push("/dashboard/admin/tasks")}
                  >
                    Voir les tâches
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
          <>
            {/* Cartes de statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Taux de complétion global
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{stats.completionRate}%</div>
                    <div className={`flex items-center ${stats.completionRate > 50 ? 'text-green-500' : 'text-red-500'}`}>
                      {stats.completionRate > 50 ? (
                        <ArrowUpRight className="mr-1 h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="mr-1 h-4 w-4" />
                      )}
                      <span className="text-xs">{stats.completionRate > 50 ? 'Bon' : 'À améliorer'}</span>
                    </div>
                  </div>
                  <Progress className="mt-2" value={stats.completionRate} />
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.completedTasks} tâches terminées sur {stats.totalTasks}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Complétion tâches prioritaires
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{stats.highPriorityCompletionRate}%</div>
                    <div className={`flex items-center ${stats.highPriorityCompletionRate > 70 ? 'text-green-500' : 'text-red-500'}`}>
                      {stats.highPriorityCompletionRate > 70 ? (
                        <ArrowUpRight className="mr-1 h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="mr-1 h-4 w-4" />
                      )}
                      <span className="text-xs">{stats.highPriorityCompletionRate > 70 ? 'Excellent' : 'Critique'}</span>
                    </div>
                  </div>
                  <Progress 
                    className={stats.highPriorityCompletionRate > 70 ? "mt-2 bg-green-200" : "mt-2 bg-amber-200"}
                    value={stats.highPriorityCompletionRate} 
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    P4 et P3 (Quick Win & Urgent)
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tâches en retard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{stats.overdueTasks}</div>
                    <div className={`flex items-center ${stats.overdueTasks < 3 ? 'text-green-500' : 'text-red-500'}`}>
                      {stats.overdueTasks < 3 ? (
                        <CheckCircle className="mr-1 h-4 w-4" />
                      ) : (
                        <AlertCircle className="mr-1 h-4 w-4" />
                      )}
                      <span className="text-xs">{stats.overdueTasks < 3 ? 'Bon' : 'Attention'}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Tâches dépassant leur échéance
                  </p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-xs mt-4"
                    onClick={() => router.push("/dashboard/admin/tasks?status=TODO")}
                  >
                    Voir les tâches en retard →
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Employés actifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{users.length}</div>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Membres dans votre entreprise
                  </p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-xs mt-4"
                    onClick={() => router.push("/dashboard/admin/users")}
                  >
                    Gérer les utilisateurs →
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Graphiques de tâches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des tâches par priorité</CardTitle>
                  <CardDescription>
                    Distribution des tâches selon leur niveau d'importance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={priorityChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {priorityChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} tâches`, 'Quantité']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-5 gap-2 mt-4">
                    <div className="text-center">
                      <Badge className="bg-gray-500 hover:bg-gray-600">P0</Badge>
                      <p className="text-xs mt-1">Optionnel</p>
                    </div>
                    <div className="text-center">
                      <Badge className="bg-blue-500 hover:bg-blue-600">P1</Badge>
                      <p className="text-xs mt-1">À faire</p>
                    </div>
                    <div className="text-center">
                      <Badge className="bg-yellow-500 hover:bg-yellow-600">P2</Badge>
                      <p className="text-xs mt-1">Important</p>
                    </div>
                    <div className="text-center">
                      <Badge className="bg-orange-500 hover:bg-orange-600">P3</Badge>
                      <p className="text-xs mt-1">Urgent</p>
                    </div>
                    <div className="text-center">
                      <Badge className="bg-green-500 hover:bg-green-600">P4</Badge>
                      <p className="text-xs mt-1">Quick Win</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Progression des tâches</CardTitle>
                  <CardDescription>
                    État d'avancement des tâches de l'équipe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={completionChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {completionChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} tâches`, 'Quantité']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center space-x-10 mt-4">
                    <div className="text-center">
                      <Badge className="bg-green-500 hover:bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Terminées
                      </Badge>
                      <p className="text-sm font-medium mt-1">{stats.completedTasks} tâches</p>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline">
                        <Clock className="mr-1 h-3 w-3" />
                        À faire
                      </Badge>
                      <p className="text-sm font-medium mt-1">{stats.totalTasks - stats.completedTasks} tâches</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Performance par employé */}
            {stats && stats.tasksByUser && stats.tasksByUser.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Performance par employé</CardTitle>
                  <CardDescription>
                    Taux de complétion des tâches par membre de l'équipe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.tasksByUser.map(user => (
                      <div key={user.id} className="flex items-center">
                        <div className="w-48 flex-shrink-0">
                          <p className="font-medium truncate">{user.name}</p>
                        </div>
                        <div className="flex-grow mx-4">
                          <div className="flex items-center mb-1">
                            <Progress value={user.completionRate} className="h-2" />
                            <span className="ml-2 text-sm font-medium">{user.completionRate}%</span>
                          </div>
                          <div className="flex text-xs text-muted-foreground">
                            <span className="flex items-center mr-3">
                              <CheckSquare className="mr-1 h-3 w-3" /> 
                              {user.completedTasks} terminées
                            </span>
                            <span className="flex items-center">
                              <CheckCircle className="mr-1 h-3 w-3" /> 
                              {user.totalTasks} total
                            </span>
                          </div>
                        </div>
                        <div className="w-24 text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => router.push(`/dashboard/admin/tasks?user=${user.id}`)}
                          >
                            Détails
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
          )}
        </div>
      )}
    </AdminRequiredPage>
  )
} 