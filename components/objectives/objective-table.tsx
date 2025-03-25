"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Pencil, Check, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ObjectiveTableProps {
  objective: {
    id: string
    title: string
    target: number
    current: number
    actions: Array<{
      id: string
      title: string
      target: number
      current: number
      progress: number
      initiative?: {
        id: string
        title: string
        description: string | null
      } | null
    }>
  }
  onUpdate: () => void
}

export function ObjectiveTable({ objective, onUpdate }: ObjectiveTableProps) {
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ target: number; current: number }>({
    target: 0,
    current: 0,
  })
  const { toast } = useToast()

  const startEditing = (actionId: string, target: number, current: number) => {
    setIsEditing(actionId)
    setEditValues({ 
      target: target || 0,
      current: current || 0
    })
  }

  const handleUpdate = async (actionId: string) => {
    try {
      // Validation des valeurs
      const targetValue = Number(editValues.target)
      const currentValue = Number(editValues.current)

      if (isNaN(targetValue) || isNaN(currentValue)) {
        toast({
          title: "Erreur",
          description: "Les valeurs doivent être des nombres valides.",
          variant: "destructive",
        })
        return
      }

      if (targetValue < 0 || currentValue < 0) {
        toast({
          title: "Erreur",
          description: "Les valeurs ne peuvent pas être négatives.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/actions/${actionId}/progress`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: targetValue,
          current: currentValue,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error("Erreur API:", {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        })
        throw new Error(`Erreur lors de la mise à jour: ${errorData}`)
      }

      const updatedData = await response.json()
      console.log("Données mises à jour:", updatedData)

      toast({
        title: "Mise à jour réussie",
        description: "Les valeurs ont été mises à jour avec succès.",
      })

      setIsEditing(null)
      onUpdate()
    } catch (error) {
      console.error("Erreur détaillée:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la mise à jour.",
        variant: "destructive",
      })
    }
  }

  // Calculer le pourcentage total de l'objectif
  const totalProgress = objective.target > 0 
    ? Math.min(100, (objective.current / objective.target) * 100)
    : 0

  return (
    <div className="space-y-4 w-full">
      <div className="text-lg font-semibold">{objective.title}</div>
      <div className="grid grid-cols-4 gap-4 py-2 font-medium bg-muted px-4">
        <div>Action</div>
        <div>Target</div>
        <div>Actual</div>
        <div>Progrès</div>
      </div>
      {objective.actions.map((action) => (
        <div key={action.id} className="grid grid-cols-4 gap-4 items-center px-4 py-2 border-b">
          <div>{action.title}</div>
          {isEditing === action.id ? (
            <>
              <div>
                <Input
                  type="number"
                  value={editValues.target || ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? 0 : parseFloat(e.target.value)
                    setEditValues({ ...editValues, target: value })
                  }}
                  className="h-8"
                />
              </div>
              <div>
                <Input
                  type="number"
                  value={editValues.current || ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? 0 : parseFloat(e.target.value)
                    setEditValues({ ...editValues, current: value })
                  }}
                  className="h-8"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleUpdate(action.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>{action.target}</div>
              <div>{action.current}</div>
              <div className="flex items-center gap-2">
                <span className={action.progress === 100 ? "text-green-600" : "text-red-500"}>
                  {(action.progress ?? 0).toFixed(2)}%
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startEditing(action.id, action.target, action.current)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      ))}
      <div className="grid grid-cols-4 gap-4 items-center px-4 py-2 bg-muted/50 font-medium">
        <div>Total</div>
        <div>{objective.target}</div>
        <div>{objective.current}</div>
        <div className={totalProgress === 100 ? "text-green-600" : "text-red-500"}>
          {totalProgress.toFixed(2)}%
        </div>
      </div>
    </div>
  )
} 