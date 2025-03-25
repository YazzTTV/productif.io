"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Process {
  id: string
  name: string
  description: string
}

interface ProcessSelectorProps {
  onSelect: (process: Process | null) => void
}

export function ProcessSelector({ onSelect }: ProcessSelectorProps) {
  const [processes, setProcesses] = useState<Process[]>([])

  useEffect(() => {
    // Charger les process existants
    fetch("/api/processes")
      .then((res) => res.json())
      .then(setProcesses)
      .catch(console.error)
  }, [])

  const handleSelect = (processId: string) => {
    if (processId === "none") {
      onSelect(null)
      return
    }
    
    const selectedProcess = processes.find((p) => p.id === processId)
    if (selectedProcess) {
      onSelect(selectedProcess)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Utiliser un process existant</label>
      <Select onValueChange={handleSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Sélectionner un process" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Aucun process</SelectItem>
          {processes.map((process) => (
            <SelectItem key={process.id} value={process.id}>
              {process.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 