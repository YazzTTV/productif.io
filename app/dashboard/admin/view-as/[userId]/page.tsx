"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BarChart3, TrendingUp, Clock, Target, CheckCircle, AlertTriangle, Info, TrendingDown, Brain, Zap, Calendar, Filter } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface HabitCorrelation {
  habitId: string;
  habitName: string;
  correlation: number;
  completionDays: number;
  nonCompletionDays: number;
  avgRatingWhenCompleted: number;
  avgRatingWhenNotCompleted: number;
  impactScore: number;
  regularity: number;
}

interface AutoInsights {
  patterns: string[];
  alarms: string[];
  recommendations: {
    maintain: string[];
    adjust: string[];
    opportunities: string[];
  };
}

interface UserStats {
  tasksTotal: number;
  tasksCompleted: number;
  tasksOverdue: number;
  tasksCompletionRate: number;
  projectsTotal: number;
  projectsCompleted: number;
  habitsTotal: number;
  habitsCompletedToday: number;
  objectivesTotal: number;
  objectivesProgress: number;
  habitCorrelations: HabitCorrelation[];
  totalDaysWithRatings: number;
  autoInsights: AutoInsights;
  dateRange: {
    startDate: string;
    endDate: string;
    days: number;
  };
}

export default function ViewAsPage() {
  const params = useParams()
  const userId = (params?.userId as string) || null
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('30d') // Par défaut 30 jours
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const fetchUserData = async (selectedRange: string = dateRange, startDate?: string, endDate?: string) => {
    if (!userId) {
      setError("ID utilisateur manquant")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      
      // Récupérer les informations de l'utilisateur
      const userResponse = await fetch(`/api/users/${userId}`)
      if (!userResponse.ok) {
        throw new Error("Impossible de récupérer les informations de l'utilisateur")
      }
      const user = await userResponse.json()
      setUserData(user)

      // Construire l'URL avec les paramètres de date
      let statsUrl = `/api/users/${userId}/stats?range=${selectedRange}`
      if (startDate && endDate) {
        statsUrl = `/api/users/${userId}/stats?startDate=${startDate}&endDate=${endDate}`
      }

      // Récupérer les statistiques avec la plage de dates
      const statsResponse = await fetch(statsUrl)
      if (!statsResponse.ok) {
        const errorData = await statsResponse.json()
        throw new Error(errorData.error || "Erreur lors de la récupération des statistiques")
      }
      
      const { stats } = await statsResponse.json()
      setStats(stats)
      setError(null)
    } catch (err) {
      console.error("Erreur:", err)
      setError(err instanceof Error ? err.message : "Une erreur inconnue s'est produite")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [userId])

  const handleDateRangeChange = (newRange: string) => {
    setDateRange(newRange)
    if (newRange !== 'custom') {
      fetchUserData(newRange)
    }
  }

  const handleCustomDateSubmit = () => {
    if (customStartDate && customEndDate) {
      fetchUserData('custom', customStartDate, customEndDate)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!stats) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Aucune donnée</AlertTitle>
        <AlertDescription>Aucune statistique disponible pour cet utilisateur.</AlertDescription>
      </Alert>
    )
  }

  // Calcul de métriques supplémentaires
  const projectCompletionRate = stats.projectsTotal > 0 
    ? Math.round((stats.projectsCompleted / stats.projectsTotal) * 100) 
    : 0

  const habitCompletionRate = stats.habitsTotal > 0 
    ? Math.round((stats.habitsCompletedToday / stats.habitsTotal) * 100) 
    : 0

  const getPerformanceLevel = (rate: number) => {
    if (rate >= 90) return { label: "Excellent", color: "bg-green-500", variant: "default" as const }
    if (rate >= 70) return { label: "Très bien", color: "bg-blue-500", variant: "secondary" as const }
    if (rate >= 50) return { label: "Bien", color: "bg-yellow-500", variant: "outline" as const }
    return { label: "À améliorer", color: "bg-red-500", variant: "destructive" as const }
  }

  const taskPerformance = getPerformanceLevel(stats.tasksCompletionRate)
  const projectPerformance = getPerformanceLevel(projectCompletionRate)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête avec informations utilisateur */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {userData?.firstName?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Analyse de {userData?.firstName} {userData?.lastName}
                </h1>
                <p className="text-gray-600 mt-1">
                  Analyse comportementale et performance • {userData?.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sélecteur de plage de dates */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Période d'analyse</span>
            </CardTitle>
            <CardDescription>
              Sélectionnez la période pour l'analyse des données
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={dateRange} onValueChange={handleDateRangeChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sélectionner une période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 derniers jours</SelectItem>
                    <SelectItem value="30d">30 derniers jours</SelectItem>
                    <SelectItem value="3m">3 derniers mois</SelectItem>
                    <SelectItem value="6m">6 derniers mois</SelectItem>
                    <SelectItem value="1y">1 dernière année</SelectItem>
                    <SelectItem value="custom">Période personnalisée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRange === 'custom' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <span className="text-gray-500">à</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <Button onClick={handleCustomDateSubmit} size="sm">
                    Analyser
                  </Button>
                </div>
              )}

              {stats?.dateRange && (
                <div className="text-sm text-gray-600">
                  📊 Analyse sur {stats.dateRange.days} jours • 
                  {format(new Date(stats.dateRange.startDate), 'dd/MM/yyyy', { locale: fr })} - 
                  {format(new Date(stats.dateRange.endDate), 'dd/MM/yyyy', { locale: fr })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de réussite global</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tasksCompletionRate}%</div>
              <div className="flex items-center mt-2">
                <Badge variant={taskPerformance.variant}>{taskPerformance.label}</Badge>
              </div>
              <Progress value={stats.tasksCompletionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tâches terminées</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tasksCompleted}/{stats.tasksTotal}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.tasksTotal - stats.tasksCompleted} tâches restantes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tâches en retard</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.tasksOverdue}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.tasksOverdue > 0 ? "Attention requise" : "Tout est à jour"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Habitudes du jour</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.habitsCompletedToday}/{stats.habitsTotal}</div>
              <div className="flex items-center mt-2">
                <span className="text-xs text-muted-foreground">{habitCompletionRate}% complété</span>
              </div>
              <Progress value={habitCompletionRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Analyse détaillée */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analyse complète des données
            </CardTitle>
            <CardDescription>
              Répartition détaillée de l'activité et des performances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Section Tâches & Projets */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">📋 Gestion des tâches</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Total des tâches</span>
                      <span className="text-lg font-bold">{stats.tasksTotal}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-green-700">Tâches terminées</span>
                      <span className="text-lg font-bold text-green-700">{stats.tasksCompleted}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="font-medium text-red-700">Tâches en retard</span>
                      <span className="text-lg font-bold text-red-700">{stats.tasksOverdue}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-blue-700">Taux de réussite</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={taskPerformance.variant}>{taskPerformance.label}</Badge>
                        <span className="text-lg font-bold text-blue-700">{stats.tasksCompletionRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">🎯 Projets</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Projets actifs</span>
                      <span className="text-lg font-bold">{stats.projectsTotal}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-green-700">Projets terminés</span>
                      <span className="text-lg font-bold text-green-700">{stats.projectsCompleted}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-blue-700">Taux d'achèvement</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={projectPerformance.variant}>{projectPerformance.label}</Badge>
                        <span className="text-lg font-bold text-blue-700">{projectCompletionRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Habitudes & Objectifs */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">⚡ Habitudes quotidiennes</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Habitudes configurées</span>
                      <span className="text-lg font-bold">{stats.habitsTotal}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-green-700">Complétées aujourd'hui</span>
                      <span className="text-lg font-bold text-green-700">{stats.habitsCompletedToday}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-blue-700">Progression du jour</span>
                      <span className="text-lg font-bold text-blue-700">{habitCompletionRate}%</span>
                    </div>
                    <div className="mt-3">
                      <Progress value={habitCompletionRate} className="h-3" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.habitsTotal - stats.habitsCompletedToday} habitudes restantes pour aujourd'hui
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">🎯 Objectifs</h3>
                  <div className="space-y-3">
                    {stats.objectivesTotal > 0 ? (
                      <>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">Objectifs définis</span>
                          <span className="text-lg font-bold">{stats.objectivesTotal}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <span className="font-medium text-blue-700">Progression moyenne</span>
                          <span className="text-lg font-bold text-blue-700">{stats.objectivesProgress}%</span>
                        </div>
                        <div className="mt-3">
                          <Progress value={stats.objectivesProgress} className="h-3" />
                        </div>
                      </>
                    ) : (
                      <div className="p-6 bg-yellow-50 rounded-lg text-center">
                        <Target className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                        <h4 className="font-medium text-yellow-800 mb-1">Aucun objectif défini</h4>
                        <p className="text-sm text-yellow-600">
                          L'utilisateur n'a pas encore configuré d'objectifs
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Résumé de performance */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">📊 Résumé de performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.tasksCompletionRate}%</div>
                  <div className="text-sm text-gray-600">Efficacité globale</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.tasksCompleted + stats.projectsCompleted + stats.habitsCompletedToday}</div>
                  <div className="text-sm text-gray-600">Éléments complétés</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.tasksTotal + stats.projectsTotal + stats.habitsTotal + stats.objectivesTotal}
                  </div>
                  <div className="text-sm text-gray-600">Total d'éléments gérés</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analyse de corrélation habits-notes avec régularité */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>Analyse de corrélation habitudes vs note journée</span>
            </CardTitle>
            <CardDescription>
              Corrélation entre les habitudes complétées et les notes de journée ({stats.totalDaysWithRatings} jours analysés)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.habitCorrelations.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Habitudes les plus impactantes */}
                  <div>
                    <h4 className="text-md font-semibold mb-3 text-gray-900 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-600" />
                      Habitudes les plus impactantes
                    </h4>
                    <div className="space-y-3">
                      {stats.habitCorrelations
                        .filter(correlation => correlation.impactScore > 0)
                        .slice(0, 5)
                        .map((correlation, index) => (
                          <div 
                            key={correlation.habitId} 
                            className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-green-800 truncate">{correlation.habitName}</h5>
                              <Badge variant="default" className="bg-green-600">
                                +{correlation.impactScore.toFixed(1)}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <div className="text-green-700 font-medium">Quand complété</div>
                                <div className="text-green-600">
                                  {correlation.avgRatingWhenCompleted.toFixed(1)}/10 ({correlation.completionDays} jours)
                                </div>
                              </div>
                              <div>
                                <div className="text-red-700 font-medium">Quand non complété</div>
                                <div className="text-red-600">
                                  {correlation.nonCompletionDays > 0 ? correlation.avgRatingWhenNotCompleted.toFixed(1) : 'N/A'}/10 ({correlation.nonCompletionDays} jours)
                                </div>
                              </div>
                            </div>
                            <div className="mt-2">
                              <div className="text-xs text-gray-600 mb-1 flex justify-between">
                                <span>Impact sur l'humeur</span>
                                <span>{correlation.regularity}% régularité</span>
                              </div>
                              <Progress 
                                value={Math.min(100, Math.abs(correlation.impactScore) * 10)} 
                                className="h-2"
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  {/* Habitudes potentiellement problématiques */}
                  <div>
                    <h4 className="text-md font-semibold mb-3 text-gray-900 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      Habitudes à surveiller
                    </h4>
                    <div className="space-y-3">
                      {stats.habitCorrelations
                        .filter(correlation => correlation.impactScore < 0)
                        .slice(0, 5)
                        .map((correlation, index) => (
                          <div 
                            key={correlation.habitId} 
                            className="p-4 border rounded-lg bg-gradient-to-r from-red-50 to-pink-50"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-red-800 truncate">{correlation.habitName}</h5>
                              <Badge variant="destructive">
                                {correlation.impactScore.toFixed(1)}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <div className="text-green-700 font-medium">Quand complété</div>
                                <div className="text-green-600">
                                  {correlation.avgRatingWhenCompleted.toFixed(1)}/10 ({correlation.completionDays} jours)
                                </div>
                              </div>
                              <div>
                                <div className="text-red-700 font-medium">Quand non complété</div>
                                <div className="text-red-600">
                                  {correlation.nonCompletionDays > 0 ? correlation.avgRatingWhenNotCompleted.toFixed(1) : 'N/A'}/10 ({correlation.nonCompletionDays} jours)
                                </div>
                              </div>
                            </div>
                            <div className="mt-2">
                              <div className="text-xs text-gray-600 mb-1 flex justify-between">
                                <span>Impact négatif</span>
                                <span>{correlation.regularity}% régularité</span>
                              </div>
                              <Progress 
                                value={Math.min(100, Math.abs(correlation.impactScore) * 10)} 
                                className="h-2"
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Résumé des insights */}
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
                  <h4 className="font-semibold text-purple-800 mb-2">🔍 Insights automatiques</h4>
                  <div className="text-sm text-purple-700 space-y-1">
                    {stats.habitCorrelations.filter(h => h.impactScore > 1).length > 0 && (
                      <p>• <strong>{stats.habitCorrelations.filter(h => h.impactScore > 1).length}</strong> habitude(s) ont un impact positif significatif sur votre humeur</p>
                    )}
                    {stats.habitCorrelations.filter(h => h.impactScore < -1).length > 0 && (
                      <p>• <strong>{stats.habitCorrelations.filter(h => h.impactScore < -1).length}</strong> habitude(s) semblent liées à des journées moins bien notées</p>
                    )}
                    <p>• Analyse basée sur <strong>{stats.totalDaysWithRatings}</strong> journées avec évaluations</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h4 className="font-medium text-gray-600 mb-2">Analyse en cours de construction</h4>
                <p className="text-sm text-gray-500">
                  Pas assez de données pour calculer les corrélations.<br/>
                  L'utilisateur doit noter ses journées plus régulièrement.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights automatiques intelligents */}
        {stats.autoInsights && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span>🎯 Insights cachés</span>
              </CardTitle>
              <CardDescription>
                Analyse intelligente automatique basée sur vos données
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Patterns intéressants */}
              {stats.autoInsights.patterns.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-600 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    📊 Patterns intéressants
                  </h3>
                  <div className="space-y-2">
                    {stats.autoInsights.patterns.map((pattern, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <p className="text-blue-800">{pattern}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Signaux d'alarme */}
              {stats.autoInsights.alarms.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    🚨 Signaux d'alarme
                  </h3>
                  <div className="space-y-2">
                    {stats.autoInsights.alarms.map((alarm, index) => (
                      <div key={index} className="p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                        <p className="text-red-800">{alarm}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommandations */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-green-600 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  💡 Recommandations basées sur les données
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* À maintenir */}
                  {stats.autoInsights.recommendations.maintain.length > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        ✅ À maintenir absolument
                      </h4>
                      <ul className="space-y-1">
                        {stats.autoInsights.recommendations.maintain.map((item, index) => (
                          <li key={index} className="text-sm text-green-700">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* À ajuster */}
                  {stats.autoInsights.recommendations.adjust.length > 0 && (
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-medium text-orange-800 mb-2 flex items-center">
                        <TrendingDown className="w-4 h-4 mr-1" />
                        🔄 À ajuster
                      </h4>
                      <ul className="space-y-1">
                        {stats.autoInsights.recommendations.adjust.map((item, index) => (
                          <li key={index} className="text-sm text-orange-700">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Opportunités */}
                  {stats.autoInsights.recommendations.opportunities.length > 0 && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-2 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        📈 Opportunités
                      </h4>
                      <ul className="space-y-1">
                        {stats.autoInsights.recommendations.opportunities.map((item, index) => (
                          <li key={index} className="text-sm text-purple-700">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 