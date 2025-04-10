"use client"

import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  id: string
  title: string
  completed: boolean
  isExpanded: boolean
  subSteps: Step[]
}

interface ProcessViewerProps {
  value: string
}

export function ProcessViewer({ value }: ProcessViewerProps) {
  let steps: Step[] = []
  try {
    steps = JSON.parse(value)
  } catch {
    // Si ce n'est pas un JSON valide, on affiche le texte brut
    return <p className="whitespace-pre-wrap">{value}</p>
  }

  const renderStep = (step: Step, level: number = 0) => {
    return (
      <div
        key={step.id}
        className={cn(
          "group relative",
          step.completed && "text-muted-foreground line-through"
        )}
        style={{ marginLeft: `${level * 24}px` }}
      >
        <div className="flex items-center gap-1 py-1">
          {step.subSteps.length > 0 && (
            <span className="h-4 w-4 flex items-center justify-center text-muted-foreground">
              {step.isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </span>
          )}
          <span className="h-4 w-4 flex items-center justify-center">
            {step.completed ? "✓" : "○"}
          </span>
          <span className="flex-1">{step.title}</span>
        </div>
        {step.isExpanded && step.subSteps.length > 0 && (
          <div className="mt-1">
            {step.subSteps.map(subStep => renderStep(subStep, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {steps.map(step => renderStep(step))}
    </div>
  )
} 