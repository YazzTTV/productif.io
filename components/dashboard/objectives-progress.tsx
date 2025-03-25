"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { PlusCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

interface ObjectivesProgressProps {
  className?: string
}

interface Objective {
  id: string
  title: string
  missionTitle?: string
  progress: number
  current: number
  target: number
}

export function ObjectivesProgress({ className }: ObjectivesProgressProps) {
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchObjectives() {
      try {
        const response = await fetch("/api/objectives/current")
        
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des objectifs")
        }
        
        const data = await response.json()
        setObjectives(data)
      } catch (error) {
        console.error("Erreur:", error)
        
        // Données fictives pour le développement
        setObjectives([
          { id: "1", title: "Améliorer ma productivité", missionTitle: "Q2 2025", progress: 35, current: 35, target: 100 },
          { id: "2", title: "Développer une routine matinale", missionTitle: "Q2 2025", progress: 80, current: 80, target: 100 },
          { id: "3", title: "Lire 12 livres", missionTitle: "Q2 2025", progress: 25, current: 3, target: 12 },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchObjectives()
  }, [])

  const getProgressColor = (progress: number) => {
    if (progress < 25) return "bg-red-500"
    if (progress < 50) return "bg-yellow-500"
    if (progress < 75) return "bg-blue-500"
    return "bg-green-500"
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Mes objectifs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (objectives.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Mes objectifs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 space-y-4">
            <p className="text-muted-foreground">Vous n'avez pas encore défini d'objectifs</p>
            <Link href="/dashboard/objectives/new">
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Créer un objectif
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Mes objectifs</CardTitle>
        <Link href="/dashboard/objectives/new">
          <Button variant="ghost" size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {objectives.map((objective) => (
            <div key={objective.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{objective.title}</h3>
                <span className="text-sm text-muted-foreground">{objective.progress}%</span>
              </div>
              
              <Progress 
                value={objective.progress} 
                className={`h-2 ${getProgressColor(objective.progress)}`}
              />
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  {objective.missionTitle && `${objective.missionTitle} · `}
                  {objective.current} / {objective.target}
                </span>
                
                <Link href={`/dashboard/objectives/${objective.id}`}>
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    Détails
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 