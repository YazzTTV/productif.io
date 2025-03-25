"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ChevronRight } from "lucide-react"
import { MissionDialog } from "./mission-dialog"
import { ObjectiveDialog } from "./objective-dialog"
import { ActionDialog } from "./action-dialog"
import { InitiativeDialog } from "./initiative-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ObjectiveProgress } from "./objective-progress"
import { ActionProgressDialog } from "./action-progress-dialog"
import { ObjectiveTable } from "./objective-table"

interface Mission {
  id: string
  title: string
  target: number
  current: number
  progress: number
  objectives: Array<{
    id: string
    title: string
    description: string | null
    target: number
    current: number
    actions: Array<{
      id: string
      title: string
      description: string | null
      target: number
      current: number
      progress: number
      initiative: {
        id: string
        title: string
        description: string | null
      } | null
    }>
  }>
}

export function OKRSection() {
  const [currentQuarter] = useState(() => {
    const now = new Date()
    return Math.floor(now.getMonth() / 3) + 1
  })
  
  const [currentYear] = useState(() => new Date().getFullYear())
  const [mission, setMission] = useState<Mission | null>(null)
  const [isMissionDialogOpen, setIsMissionDialogOpen] = useState(false)
  const [isObjectiveDialogOpen, setIsObjectiveDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchMission = async () => {
    try {
      console.log("[OKRSection] Début de la récupération de la mission")
      const response = await fetch(
        `/api/missions?quarter=${currentQuarter}&year=${currentYear}`
      )
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("[OKRSection] Erreur API:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        throw new Error(`Erreur lors de la récupération de la mission: ${errorText}`)
      }

      const data = await response.json()
      console.log("[OKRSection] Données reçues:", data)
      setMission(data)
    } catch (error) {
      console.error("[OKRSection] Erreur détaillée:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMission()
  }, [currentQuarter, currentYear])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">OKR</h2>
          <p className="text-sm text-muted-foreground">
            Q{currentQuarter} {currentYear}
          </p>
        </div>
        {!mission && (
          <Button onClick={() => setIsMissionDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle mission
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mission du trimestre</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">
              Chargement de la mission...
            </div>
          ) : mission ? (
            <div className="space-y-6">
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">{mission.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Progression globale :
                        </span>
                        <span className={(mission.progress ?? 0) === 100 ? "text-green-600" : "text-red-500"}>
                          {(mission.progress ?? 0).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <ObjectiveDialog
                      missionId={mission.id}
                      onObjectiveCreated={fetchMission}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter un objectif
                        </Button>
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {mission.objectives.length > 0 ? (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="grid gap-8">
                    {mission.objectives.map((objective) => (
                      <div key={objective.id} className="space-y-4">
                        <div className="flex justify-between items-center">
                          <ObjectiveTable
                            objective={objective}
                            onUpdate={fetchMission}
                          />
                          <ActionDialog
                            objectiveId={objective.id}
                            onActionCreated={fetchMission}
                            trigger={
                              <Button variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Ajouter une action
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun objectif défini. Commencez par en ajouter un !
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Définissez votre mission pour ce trimestre et décomposez-la en objectifs
              </p>
              <Button onClick={() => setIsMissionDialogOpen(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une mission
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <MissionDialog
        open={isMissionDialogOpen}
        onOpenChange={setIsMissionDialogOpen}
        onMissionCreated={fetchMission}
        quarter={currentQuarter}
        year={currentYear}
      />
    </div>
  )
} 