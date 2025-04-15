"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Pencil, Check, X, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

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
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'objective' | 'action', id: string } | null>(null)
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

  const handleDeleteAction = async (actionId: string) => {
    try {
      const response = await fetch(`/api/actions/${actionId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erreur lors de la suppression: ${errorText}`)
      }

      toast({
        title: "Action supprimée",
        description: "L'action a été supprimée avec succès",
      })
      
      setDeleteTarget(null)
      onUpdate()
    } catch (error) {
      console.error("[DeleteAction] Erreur:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  const handleDeleteObjective = async () => {
    try {
      const response = await fetch(`/api/objectives/${objective.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erreur lors de la suppression: ${errorText}`)
      }

      toast({
        title: "Objectif supprimé",
        description: "L'objectif a été supprimé avec succès",
      })
      
      setDeleteTarget(null)
      onUpdate()
    } catch (error) {
      console.error("[DeleteObjective] Erreur:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
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
      <div className="flex justify-between items-center">
        <div className="text-lg font-semibold">{objective.title}</div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDeleteTarget({ type: 'objective', id: objective.id })}
          className="text-red-500 hover:text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-5 gap-4 py-2 font-medium bg-muted px-4">
        <div>Action</div>
        <div>Target</div>
        <div>Actual</div>
        <div>Progrès</div>
        <div></div>
      </div>
      {objective.actions.map((action) => (
        <div key={action.id} className="grid grid-cols-5 gap-4 items-center px-4 py-2 border-b">
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
              <div></div>
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
              <div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteTarget({ type: 'action', id: action.id })}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      ))}
      <div className="grid grid-cols-5 gap-4 items-center px-4 py-2 bg-muted/50 font-medium">
        <div>Total</div>
        <div>{objective.target}</div>
        <div>{objective.current}</div>
        <div className={totalProgress === 100 ? "text-green-600" : "text-red-500"}>
          {totalProgress.toFixed(2)}%
        </div>
        <div></div>
      </div>

      <AlertDialog 
        open={!!deleteTarget} 
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === 'objective' ? 'Supprimer l\'objectif' : 'Supprimer l\'action'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'objective' 
                ? 'Êtes-vous sûr de vouloir supprimer cet objectif ? Cette action est irréversible et supprimera également toutes les actions associées.'
                : 'Êtes-vous sûr de vouloir supprimer cette action ? Cette action est irréversible.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget?.type === 'objective') {
                  handleDeleteObjective();
                } else if (deleteTarget?.type === 'action') {
                  handleDeleteAction(deleteTarget.id);
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 