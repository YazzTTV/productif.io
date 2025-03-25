"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"
import { Info, Target } from "lucide-react"

interface ObjectiveAction {
  id: string
  title: string
  current: number
  progress: number
  target: number
  createdAt: string
}

interface Objective {
  id: string
  title: string
  current: number
  progress: number
  target: number
  quarter: number
  year: number
  createdAt: string
  updatedAt: string
  actions?: ObjectiveAction[]
}

export default function ObjectivesPage() {
  const params = useParams()
  const userId = params.userId as string
  const [isLoading, setIsLoading] = useState(true)
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchObjectives = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/users/${userId}/objectives`)
        if (!response.ok) {
          throw new Error("Impossible de récupérer les objectifs")
        }
        const data = await response.json()
        setObjectives(data.objectives || [])
      } catch (error) {
        console.error("Erreur lors de la récupération des objectifs:", error)
        setError("Impossible de récupérer les objectifs de l'utilisateur")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchObjectives()
  }, [userId])
  
  // Grouper les objectifs par année et trimestre
  const groupedObjectives = objectives.reduce((acc, objective) => {
    const key = `${objective.year}-Q${objective.quarter}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(objective)
    return acc
  }, {} as Record<string, Objective[]>)
  
  // Trier les périodes par ordre décroissant
  const sortedPeriods = Object.keys(groupedObjectives).sort((a, b) => {
    const [yearA, quarterA] = a.split('-')
    const [yearB, quarterB] = b.split('-')
    if (yearA !== yearB) {
      return parseInt(yearB) - parseInt(yearA)
    }
    return quarterB.localeCompare(quarterA)
  })
  
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
  
  if (objectives.length === 0) {
    return (
      <div className="text-center py-16">
        <Target className="h-24 w-24 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Aucun objectif trouvé</h2>
        <p className="text-muted-foreground">
          Cet utilisateur n'a pas encore défini d'objectifs
        </p>
      </div>
    )
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Objectifs de l'utilisateur</h1>
      
      <div className="space-y-6">
        {sortedPeriods.map(period => (
          <Card key={period}>
            <CardHeader>
              <CardTitle>{period}</CardTitle>
              <CardDescription>
                Objectifs fixés pour cette période
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {groupedObjectives[period].map(objective => (
                  <Accordion type="single" collapsible key={objective.id}>
                    <AccordionItem value={objective.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex flex-col items-start text-left w-full">
                          <span className="font-medium">{objective.title}</span>
                          <div className="flex items-center w-full mt-1">
                            <Progress value={objective.progress} className="mr-2" />
                            <span className="text-xs text-muted-foreground">
                              {objective.current} / {objective.target} ({objective.progress}%)
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {objective.actions && objective.actions.length > 0 ? (
                          <div className="space-y-3 pl-4 pt-2">
                            {objective.actions.map(action => (
                              <div key={action.id} className="border-l border-l-slate-200 pl-4">
                                <p className="font-medium text-sm">{action.title}</p>
                                <div className="flex items-center w-full mt-1">
                                  <Progress value={action.progress} className="h-1.5 mr-2" />
                                  <span className="text-xs text-muted-foreground">
                                    {action.current} / {action.target} ({action.progress}%)
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">Aucune action définie pour cet objectif</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 