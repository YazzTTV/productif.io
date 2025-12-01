"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { AdminRequiredPage } from "@/components/auth/admin-required"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Users, 
  UserPlus,
  Star,
  Heart,
  CheckSquare,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  LineChart,
  User
} from "lucide-react"
import { format, subDays, startOfWeek, endOfWeek, differenceInDays } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"

export default function SuperAdminDashboardPage() {
  const [statistics, setStatistics] = useState<any>(null)
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [topActiveUsers, setTopActiveUsers] = useState<any[]>([])
  const [companiesStats, setCompaniesStats] = useState<any[]>([])
  const [weeklyTrendsData, setWeeklyTrendsData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Statistiques globales
        try {
          const statsResponse = await fetch("/api/admin/statistics", {
            credentials: 'include'
          })
          if (statsResponse.ok) {
            const statsData = await statsResponse.json()
            setStatistics(statsData)
          } else {
            const errorData = await statsResponse.json().catch(() => ({}))
            console.error("Erreur lors de la récupération des statistiques globales:", statsResponse.status, errorData)
            // En cas d'échec, utiliser des données par défaut
            setStatistics({
              totalUsers: 0,
              activeUsers: 0,
              totalCompanies: 0,
              totalTasks: 0,
              completedTasks: 0,
              totalHabits: 0,
              activeHabits: 0,
              totalObjectives: 0,
              weeklyActiveUsers: 0,
              monthlyActiveUsers: 0,
              weeklyGrowth: 0
            })
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des statistiques globales:", error)
          setStatistics({
            totalUsers: 0,
            activeUsers: 0,
            totalCompanies: 0,
            totalTasks: 0,
            completedTasks: 0,
            totalHabits: 0,
            activeHabits: 0,
            totalObjectives: 0,
            weeklyActiveUsers: 0,
            monthlyActiveUsers: 0,
            weeklyGrowth: 0
          })
        }

        // Utilisateurs récents
        try {
          const recentUsersResponse = await fetch("/api/admin/users/recent", {
            credentials: 'include'
          })
          if (recentUsersResponse.ok) {
            const recentUsersData = await recentUsersResponse.json()
            setRecentUsers(recentUsersData.users || [])
          } else {
            console.error("Erreur lors de la récupération des utilisateurs récents:", recentUsersResponse.status)
            setRecentUsers([])
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des utilisateurs récents:", error)
          setRecentUsers([])
        }

        // Utilisateurs actifs
        try {
          const activeUsersResponse = await fetch("/api/admin/users/active", {
            credentials: 'include'
          })
          if (activeUsersResponse.ok) {
            const activeUsersData = await activeUsersResponse.json()
            setTopActiveUsers(activeUsersData.users || [])
          } else {
            console.error("Erreur lors de la récupération des utilisateurs actifs:", activeUsersResponse.status)
            setTopActiveUsers([])
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des utilisateurs actifs:", error)
          setTopActiveUsers([])
        }

        // Statistiques des entreprises
        try {
          const companiesResponse = await fetch("/api/admin/companies/statistics", {
            credentials: 'include'
          })
          if (companiesResponse.ok) {
            const companiesData = await companiesResponse.json()
            setCompaniesStats(companiesData.companies || [])
          } else {
            console.error("Erreur lors de la récupération des statistiques des entreprises:", companiesResponse.status)
            setCompaniesStats([])
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des statistiques des entreprises:", error)
          setCompaniesStats([])
        }

        // Tendances hebdomadaires
        try {
          const weeklyResponse = await fetch("/api/admin/activity/weekly", {
            credentials: 'include'
          })
          if (weeklyResponse.ok) {
            const weeklyData = await weeklyResponse.json()
            setWeeklyTrendsData(weeklyData.weeklyData || [])
          } else {
            console.error("Erreur lors de la récupération des tendances hebdomadaires:", weeklyResponse.status)
            setWeeklyTrendsData([
              { name: 'Lun', tasks: 0, habits: 0, objectives: 0 },
              { name: 'Mar', tasks: 0, habits: 0, objectives: 0 },
              { name: 'Mer', tasks: 0, habits: 0, objectives: 0 },
              { name: 'Jeu', tasks: 0, habits: 0, objectives: 0 },
              { name: 'Ven', tasks: 0, habits: 0, objectives: 0 },
              { name: 'Sam', tasks: 0, habits: 0, objectives: 0 },
              { name: 'Dim', tasks: 0, habits: 0, objectives: 0 }
            ])
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des tendances hebdomadaires:", error)
          setWeeklyTrendsData([
            { name: 'Lun', tasks: 0, habits: 0, objectives: 0 },
            { name: 'Mar', tasks: 0, habits: 0, objectives: 0 },
            { name: 'Mer', tasks: 0, habits: 0, objectives: 0 },
            { name: 'Jeu', tasks: 0, habits: 0, objectives: 0 },
            { name: 'Ven', tasks: 0, habits: 0, objectives: 0 },
            { name: 'Sam', tasks: 0, habits: 0, objectives: 0 },
            { name: 'Dim', tasks: 0, habits: 0, objectives: 0 }
          ])
        }
      } catch (error) {
        console.error("Erreur globale lors du chargement des données:", error)
        setError("Une erreur est survenue lors du chargement des données. Veuillez réessayer.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Comme les APIs peuvent ne pas être disponibles, utilisons des données fictives pour la démo
    const useMockData = false  // Toujours utiliser les vraies données

    if (useMockData) {
      // Stats globales
      setStatistics({
        totalUsers: 248,
        activeUsers: 183,
        totalCompanies: 12,
        totalTasks: 3427,
        completedTasks: 2156,
        totalHabits: 875,
        activeHabits: 613,
        totalObjectives: 126,
        weeklyActiveUsers: 142,
        monthlyActiveUsers: 183,
        weeklyGrowth: 3.2
      })

      // Utilisateurs récemment inscrits
      setRecentUsers([
        { id: "u1", name: "Sophie Martin", email: "sophie.m@example.com", companyName: "Innovatech", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { id: "u2", name: "Thomas Dubois", email: "thomas.d@example.com", companyName: "DataFlow", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
        { id: "u3", name: "Emma Petit", email: "emma.p@example.com", companyName: "DigitalMind", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { id: "u4", name: "Lucas Bernard", email: "lucas.b@example.com", companyName: "Innovatech", createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
        { id: "u5", name: "Chloé Moreau", email: "chloe.m@example.com", companyName: "CloudSphere", createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() }
      ])

      // Utilisateurs les plus actifs
      setTopActiveUsers([
        { id: "ua1", name: "Alexandre Durand", email: "alex.d@example.com", companyName: "DigitalMind", tasksCompleted: 42, habitsStreak: 28, objectivesProgress: 75 },
        { id: "ua2", name: "Julie Lefevre", email: "julie.l@example.com", companyName: "Innovatech", tasksCompleted: 36, habitsStreak: 32, objectivesProgress: 60 },
        { id: "ua3", name: "Nicolas Robert", email: "nicolas.r@example.com", companyName: "DataFlow", tasksCompleted: 31, habitsStreak: 15, objectivesProgress: 80 },
        { id: "ua4", name: "Marie Simon", email: "marie.s@example.com", companyName: "CloudSphere", tasksCompleted: 28, habitsStreak: 21, objectivesProgress: 65 },
        { id: "ua5", name: "Paul Moreau", email: "paul.m@example.com", companyName: "Innovatech", tasksCompleted: 25, habitsStreak: 18, objectivesProgress: 70 }
      ])

      // Statistiques par entreprise
      setCompaniesStats([
        { id: "c1", name: "Innovatech", userCount: 48, activeUserCount: 41, tasksCompletion: 78, habitsAdoption: 82, objectivesProgress: 65 },
        { id: "c2", name: "DigitalMind", userCount: 36, activeUserCount: 29, tasksCompletion: 72, habitsAdoption: 65, objectivesProgress: 70 },
        { id: "c3", name: "DataFlow", userCount: 32, activeUserCount: 24, tasksCompletion: 65, habitsAdoption: 58, objectivesProgress: 55 },
        { id: "c4", name: "CloudSphere", userCount: 28, activeUserCount: 22, tasksCompletion: 68, habitsAdoption: 62, objectivesProgress: 60 },
        { id: "c5", name: "TechVision", userCount: 24, activeUserCount: 18, tasksCompletion: 58, habitsAdoption: 50, objectivesProgress: 45 }
      ])

      // Tendances hebdomadaires
      setWeeklyTrendsData([
        { name: 'Lun', tasks: 62, habits: 45, objectives: 12 },
        { name: 'Mar', tasks: 78, habits: 52, objectives: 15 },
        { name: 'Mer', tasks: 83, habits: 58, objectives: 18 },
        { name: 'Jeu', tasks: 75, habits: 49, objectives: 14 },
        { name: 'Ven', tasks: 92, habits: 63, objectives: 21 },
        { name: 'Sam', tasks: 45, habits: 38, objectives: 8 },
        { name: 'Dim', tasks: 30, habits: 32, objectives: 5 }
      ])

      setIsLoading(false)
    } else {
      fetchData()
    }
  }, [])

  // Données pour le graphique de répartition des utilisateurs par entreprise
  const userDistributionData = useMemo(() => {
    return companiesStats.map(company => ({
      name: company.name,
      value: company.userCount,
    }))
  }, [companiesStats])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

  return (
    <AdminRequiredPage requireSuperAdmin>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord - Vue globale</h1>
          <p className="text-muted-foreground">
            Suivez l'engagement et la progression des utilisateurs pour mieux les accompagner
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
            <CardTitle>Erreur lors du chargement des données</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.refresh()}>Réessayer</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* KPI globaux */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.activeUsers} <span className="text-sm font-normal text-muted-foreground">/ {statistics.totalUsers}</span></div>
                <p className="text-xs text-muted-foreground">
                  {statistics.weeklyGrowth > 0 ? (
                    <span className="text-green-600 flex items-center">
                      <ArrowUpRight className="mr-1 h-3 w-3" /> 
                      +{statistics.weeklyGrowth}% cette semaine
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center">
                      <ArrowDownRight className="mr-1 h-3 w-3" /> 
                      {statistics.weeklyGrowth}% cette semaine
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tâches complétées</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.completedTasks} <span className="text-sm font-normal text-muted-foreground">/ {statistics.totalTasks}</span></div>
                <Progress value={(statistics.completedTasks / statistics.totalTasks) * 100} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Taux de complétion: {Math.round((statistics.completedTasks / statistics.totalTasks) * 100)}%
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Habitudes actives</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.activeHabits} <span className="text-sm font-normal text-muted-foreground">/ {statistics.totalHabits}</span></div>
                <Progress value={(statistics.activeHabits / statistics.totalHabits) * 100} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Taux d'adoption: {Math.round((statistics.activeHabits / statistics.totalHabits) * 100)}%
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entreprises</CardTitle>
                <LineChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalCompanies}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(statistics.totalUsers / statistics.totalCompanies)} utilisateurs en moyenne par entreprise
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tableau des utilisateurs récents et actifs */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Nouveaux utilisateurs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nouveaux utilisateurs</CardTitle>
                <CardDescription>Derniers utilisateurs inscrits sur la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentUsers.map(user => (
                    <div key={user.id} className="flex items-center">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{user.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className="text-xs">{user.companyName}</Badge>
                          <span className="text-xs text-muted-foreground ml-2">
                            {differenceInDays(new Date(), new Date(user.createdAt)) === 0 
                              ? "Aujourd'hui"
                              : differenceInDays(new Date(), new Date(user.createdAt)) === 1
                                ? "Hier"
                                : `Il y a ${differenceInDays(new Date(), new Date(user.createdAt))} jours`}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="ml-auto" asChild>
                        <Link href={`/dashboard/admin/view-as/${user.id}`}>
                          Voir
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/admin/users">
                    Voir tous les utilisateurs
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Utilisateurs les plus actifs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Utilisateurs les plus actifs</CardTitle>
                <CardDescription>Basé sur les tâches complétées et les habitudes suivies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topActiveUsers.map(user => (
                    <div key={user.id} className="flex items-center">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{user.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center mt-1 space-x-2">
                          <Badge variant="outline" className="text-xs">{user.companyName}</Badge>
                          <Badge variant="secondary" className="text-xs"><CheckSquare className="mr-1 h-3 w-3" /> {user.tasksCompleted}</Badge>
                          <Badge variant="secondary" className="text-xs"><Heart className="mr-1 h-3 w-3" /> {user.habitsStreak} jours</Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="ml-auto" asChild>
                        <Link href={`/dashboard/admin/view-as/${user.id}`}>
                          Voir
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/admin/users">
                    Voir tous les utilisateurs
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Section graphiques */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Activité hebdomadaire */}
            <Card>
              <CardHeader>
                <CardTitle>Tendances hebdomadaires</CardTitle>
                <CardDescription>Activité des utilisateurs durant la semaine</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyTrendsData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="tasks" name="Tâches" fill="#3b82f6" />
                      <Bar dataKey="habits" name="Habitudes" fill="#f43f5e" />
                      <Bar dataKey="objectives" name="Objectifs" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Distribution des utilisateurs par entreprise */}
            <Card>
              <CardHeader>
                <CardTitle>Utilisateurs par entreprise</CardTitle>
                <CardDescription>Répartition des utilisateurs entre les entreprises</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {userDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tableau des entreprises */}
          <Card>
            <CardHeader>
              <CardTitle>Performance des entreprises</CardTitle>
              <CardDescription>Statistiques d'utilisation et d'engagement par entreprise</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium">Entreprise</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Utilisateurs</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Taux d'activité</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Tâches</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Habitudes</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Objectifs</th>
                      <th className="h-12 px-4 text-left align-middle font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {companiesStats.map(company => (
                      <tr key={company.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle">{company.name}</td>
                        <td className="p-4 align-middle">{company.activeUserCount}/{company.userCount}</td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center">
                            <div className="w-full">
                              <Progress value={(company.activeUserCount / company.userCount) * 100} className="h-2" />
                              <span className="text-xs text-muted-foreground">
                                {Math.round((company.activeUserCount / company.userCount) * 100)}%
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant={company.tasksCompletion >= 75 ? "default" : company.tasksCompletion >= 50 ? "secondary" : "outline"}>
                            {company.tasksCompletion}%
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant={company.habitsAdoption >= 75 ? "default" : company.habitsAdoption >= 50 ? "secondary" : "outline"}>
                            {company.habitsAdoption}%
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant={company.objectivesProgress >= 75 ? "default" : company.objectivesProgress >= 50 ? "secondary" : "outline"}>
                            {company.objectivesProgress}%
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/admin/companies/${company.id}`}>
                              Détails
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/dashboard/admin/companies">
                  Gérer les entreprises
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </AdminRequiredPage>
  )
} 