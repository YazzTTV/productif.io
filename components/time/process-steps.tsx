"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  id: string
  title: string
  completed: boolean
  isExpanded: boolean
  subSteps: Step[]
}

interface ProcessStepsProps {
  value: string
  onChange: (value: string) => void
}

export function ProcessSteps({ value, onChange }: ProcessStepsProps) {
  const [steps, setSteps] = useState<Step[]>(() => {
    console.log("Initialisation ProcessSteps avec value:", value)
    try {
      const parsed = value ? JSON.parse(value) : []
      console.log("Parsed initial steps:", parsed)
      return parsed
    } catch (error) {
      console.error("Erreur parsing initial:", error)
      return []
    }
  })

  // État pour suivre l'étape en cours d'édition
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  // Référence pour l'input en cours d'édition
  const editingInputRef = useRef<HTMLInputElement | null>(null);

  // Fonction debounce pour éviter trop de mises à jour
  const debouncedUpdateValue = useCallback((newSteps: Step[]) => {
    onChange(JSON.stringify(newSteps));
  }, [onChange]);

  // Mettre à jour les steps quand value change, mais seulement si nous ne sommes pas en train d'éditer
  useEffect(() => {
    if (editingStepId) return; // Ne pas mettre à jour si une édition est en cours
    
    console.log("Value changée:", value)
    try {
      const parsed = value ? JSON.parse(value) : []
      console.log("Nouveau parsed steps:", parsed)
      if (JSON.stringify(parsed) !== JSON.stringify(steps)) {
        console.log("Mise à jour des steps avec:", parsed)
        setSteps(parsed)
      }
    } catch (error) {
      console.error("Erreur parsing dans useEffect:", error)
      setSteps([])
    }
  }, [value, editingStepId, steps])

  const addStep = (parentId?: string) => {
    console.log("Ajout d'une étape, parentId:", parentId)
    const newStep: Step = {
      id: Math.random().toString(36).substr(2, 9),
      title: "",
      completed: false,
      isExpanded: true,
      subSteps: []
    }

    let updatedSteps: Step[]
    if (!parentId) {
      updatedSteps = [...steps, newStep]
    } else {
      updatedSteps = steps.map(step => {
        if (step.id === parentId) {
          return {
            ...step,
            subSteps: [...step.subSteps, newStep]
          }
        }
        return step
      })
    }
    console.log("Nouvelles steps après ajout:", updatedSteps)
    setSteps(updatedSteps)
    updateValue(updatedSteps)
  }

  const updateStep = (id: string, updates: Partial<Step>) => {
    console.log("Mise à jour de l'étape:", id, updates)
    const updateStepRecursive = (steps: Step[]): Step[] => {
      return steps.map(step => {
        if (step.id === id) {
          return { ...step, ...updates }
        }
        if (step.subSteps.length > 0) {
          return {
            ...step,
            subSteps: updateStepRecursive(step.subSteps)
          }
        }
        return step
      })
    }

    const updatedSteps = updateStepRecursive(steps)
    console.log("Steps après mise à jour:", updatedSteps)
    setSteps(updatedSteps)
    updateValue(updatedSteps)
  }

  const deleteStep = (id: string) => {
    console.log("Suppression de l'étape:", id)
    const deleteStepRecursive = (steps: Step[]): Step[] => {
      return steps.filter(step => {
        if (step.id === id) return false
        if (step.subSteps.length > 0) {
          step.subSteps = deleteStepRecursive(step.subSteps)
        }
        return true
      })
    }

    const updatedSteps = deleteStepRecursive(steps)
    console.log("Steps après suppression:", updatedSteps)
    setSteps(updatedSteps)
    updateValue(updatedSteps)
  }

  const toggleStep = (id: string) => {
    console.log("Toggle de l'étape:", id)
    const updatedSteps = steps.map(step => {
      if (step.id === id) {
        return { ...step, isExpanded: !step.isExpanded }
      }
      if (step.subSteps.length > 0) {
        return {
          ...step,
          subSteps: step.subSteps.map(subStep =>
            subStep.id === id ? { ...subStep, isExpanded: !subStep.isExpanded } : subStep
          )
        }
      }
      return step
    })

    console.log("Steps après toggle:", updatedSteps)
    setSteps(updatedSteps)
    updateValue(updatedSteps)
  }

  const updateValue = (newSteps: Step[]) => {
    console.log("Mise à jour de la valeur avec:", newSteps)
    debouncedUpdateValue(newSteps);
  }

  const renderStep = (step: Step, level: number = 0) => {
    console.log("Rendu de l'étape:", step.id, step.title, "niveau:", level)
    
    // L'ID de cette étape est-il en cours d'édition?
    const isEditing = editingStepId === step.id;
    
    return (
      <div
        key={step.id}
        className={cn(
          "group relative py-1",
          step.completed && "text-muted-foreground"
        )}
        style={{ marginLeft: `${level * 20}px` }}
      >
        <div className="flex items-center gap-2">
          {step.subSteps.length > 0 ? (
            <button
              type="button"
              onClick={() => toggleStep(step.id)}
              className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {step.isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          ) : (
            <div className="w-4"></div>
          )}
          <Checkbox
            checked={step.completed}
            onCheckedChange={(checked) => updateStep(step.id, { completed: checked as boolean })}
            className="h-4 w-4 rounded-sm border-gray-500"
          />
          <div className="flex-1 flex items-center min-h-[20px]">
            <input
              type="text"
              ref={isEditing ? editingInputRef : null}
              value={step.title}
              onChange={(e) => {
                // Mise à jour directe sans passer par updateStep
                const newTitle = e.target.value;
                
                const updateStepInPlace = (steps: Step[]): Step[] => {
                  return steps.map(s => {
                    if (s.id === step.id) {
                      return {...s, title: newTitle};
                    }
                    if (s.subSteps.length > 0) {
                      return {
                        ...s,
                        subSteps: updateStepInPlace(s.subSteps)
                      };
                    }
                    return s;
                  });
                };
                
                // On met à jour uniquement le state local sans notifier le parent
                setSteps(updateStepInPlace([...steps]));
              }}
              onFocus={() => {
                // Marquer cette étape comme étant en cours d'édition
                setEditingStepId(step.id);
              }}
              onBlur={() => {
                // Lorsque l'édition est terminée, mettre à jour le parent
                setEditingStepId(null);
                updateValue(steps);
              }}
              placeholder="Nouvelle étape..."
              className={cn(
                "flex-1 bg-transparent border-none outline-none focus:ring-0 p-0 text-sm",
                step.completed && "line-through"
              )}
              autoComplete="off"
            />
          </div>
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
              onClick={() => addStep(step.id)}
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-destructive hover:text-destructive hover:bg-transparent"
              onClick={() => deleteStep(step.id)}
            >
              ×
            </Button>
          </div>
        </div>
        {step.isExpanded && step.subSteps.length > 0 && (
          <div className="mt-1 ml-2">
            {step.subSteps.map(subStep => renderStep(subStep, level + 1))}
          </div>
        )}
      </div>
    )
  }

  console.log("Rendu de ProcessSteps avec steps:", steps)
  return (
    <div className="space-y-1 rounded-lg py-2">
      {steps.map(step => renderStep(step))}
      {steps.length === 0 && (
        <div
          className="flex items-center gap-2 py-1 text-muted-foreground cursor-pointer hover:text-foreground"
          onClick={() => addStep()}
        >
          <div className="w-4" />
          <Checkbox className="h-4 w-4 rounded-sm border-gray-500" disabled />
          <span className="text-sm">Cliquez pour ajouter une étape...</span>
        </div>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => addStep()}
        className="mt-2 text-muted-foreground hover:text-foreground hover:bg-transparent px-1"
      >
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une étape
      </Button>
    </div>
  )
} 