"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BarChart, Info, Loader2, Target } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface ObjectiveAction {
  id: string;
  title: string;
  current: number;
  progress: number;
  target: number;
  createdAt: string;
}

interface Objective {
  id: string;
  title: string;
  current: number;
  progress: number;
  target: number;
  quarter: number;
  year: number;
  createdAt: string;
  updatedAt: string;
  actions: ObjectiveAction[];
}

export default function ViewUserObjectivesPage() {
  const params = useParams()
  const userId = params.userId as string
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Récupérer les informations de l'utilisateur
        const userResponse = await fetch(`/api/users/${userId}`)
        if (!userResponse.ok) {
          throw new Error("Impossible de récupérer les informations de l'utilisateur")
        }
        const userData = await userResponse.json()
        setUserData(userData.user)
        
        // Récupérer les objectifs de l'utilisateur
        const objectivesResponse = await fetch(`/api/users/${userId}/objectives`)
        if (!objectivesResponse.ok) {
          throw new Error("Impossible de récupérer les objectifs de l'utilisateur")
        }
        const objectivesData = await objectivesResponse.json()
        setObjectives(objectivesData.objectives || [])
        
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error)
        setError("Impossible de récupérer les données de l'utilisateur")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [userId])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
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
  
  // Regrouper les objectifs par trimestre et année
  const objectivesByPeriod: Record<string, Objective[]> = {}
  
  objectives.forEach(objective => {
    const periodKey = `${objective.year}-Q${objective.quarter}`
    if (!objectivesByPeriod[periodKey]) {
      objectivesByPeriod[periodKey] = []
    }
    objectivesByPeriod[periodKey].push(objective)
  })
  
  // Trier les périodes par ordre décroissant (plus récent d'abord)
  const sortedPeriods = Object.keys(objectivesByPeriod).sort().reverse()
  
  // Formater le pourcentage
  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">
        Objectifs de {userData?.name || userData?.email || "l'utilisateur"}
      </h1>
      <p className="text-muted-foreground mb-6">
        Suivi des objectifs et de leur progression
      </p>
      
      {objectives.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Aucun objectif n'a été défini
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sortedPeriods.map(period => (
            <div key={period}>
              <h2 className="text-xl font-semibold mb-4">
                {period.replace('-Q', ' - Trimestre ')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {objectivesByPeriod[period].map(objective => (
                  <Card key={objective.id}>
                    <CardHeader>
                      <CardTitle>{objective.title}</CardTitle>
                      <CardDescription>
                        Objectif créé le {format(new Date(objective.createdAt), "d MMMM yyyy", { locale: fr })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span>Progression</span>
                          <span className="font-medium">{formatPercentage(objective.progress)}</span>
                        </div>
                        <Progress value={objective.progress} className="h-2 mb-1" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Actuel: {objective.current}</span>
                          <span>Cible: {objective.target}</span>
                        </div>
                      </div>
                      
                      {objective.actions && objective.actions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Actions</h4>
                          <div className="space-y-3">
                            {objective.actions.map(action => (
                              <div key={action.id} className="border-t pt-2">
                                <p className="text-sm font-medium">{action.title}</p>
                                <div className="mt-2">
                                  <Progress 
                                    value={action.progress} 
                                    className="h-1.5 mb-1" 
                                  />
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{formatPercentage(action.progress)}</span>
                                    <span>{action.current} / {action.target}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 