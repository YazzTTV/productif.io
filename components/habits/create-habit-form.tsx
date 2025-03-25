"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

const DAYS_OF_WEEK = [
  { id: "monday", label: "Lundi" },
  { id: "tuesday", label: "Mardi" },
  { id: "wednesday", label: "Mercredi" },
  { id: "thursday", label: "Jeudi" },
  { id: "friday", label: "Vendredi" },
  { id: "saturday", label: "Samedi" },
  { id: "sunday", label: "Dimanche" },
]

export function CreateHabitForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    frequency: "daily",
  })
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleDay = (dayId: string) => {
    setSelectedDays(prev =>
      prev.includes(dayId)
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedDays.length === 0) {
      setError("Veuillez sélectionner au moins un jour de la semaine")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/habits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          daysOfWeek: selectedDays,
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la création de l'habitude")
      }

      router.push("/dashboard/habits")
      router.refresh()
    } catch (error) {
      console.error("Error creating habit:", error)
      setError("Une erreur est survenue lors de la création de l'habitude")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouvelle habitude</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Nom de l'habitude</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Méditation quotidienne"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnelle)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez votre habitude..."
            />
          </div>
          <div className="space-y-4">
            <Label>Jours de la semaine</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={day.id}
                    checked={selectedDays.includes(day.id)}
                    onCheckedChange={() => toggleDay(day.id)}
                  />
                  <Label htmlFor={day.id} className="cursor-pointer">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading || selectedDays.length === 0}>
            {isLoading ? "Création en cours..." : "Créer l'habitude"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 