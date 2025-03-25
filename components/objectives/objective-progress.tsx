"use client"

import { Progress } from "@/components/ui/progress"

interface ObjectiveProgressProps {
  target: number
  current: number
  actionsProgress?: number[]
}

export function ObjectiveProgress({ target, current, actionsProgress = [] }: ObjectiveProgressProps) {
  // Calculer le pourcentage de progression basé sur current/target
  const directProgress = Math.min(100, (current / target) * 100)
  
  // Calculer le pourcentage moyen des actions si disponible
  const actionsAverageProgress = actionsProgress.length > 0
    ? actionsProgress.reduce((sum, progress) => sum + progress, 0) / actionsProgress.length
    : null

  // Utiliser la progression des actions si disponible, sinon utiliser la progression directe
  const totalProgress = actionsAverageProgress !== null ? actionsAverageProgress : directProgress

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Progression</span>
        <span className="font-medium">{Math.round(totalProgress)}%</span>
      </div>
      <Progress value={totalProgress} className="h-2" />
      {current !== undefined && target !== undefined && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Valeur actuelle</span>
          <span>{current} / {target}</span>
        </div>
      )}
    </div>
  )
} 