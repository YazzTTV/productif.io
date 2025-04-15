"use client"

import { useEffect, useState, useCallback } from "react"
import { Habit, HabitEntry } from "@prisma/client"
import { WeeklyHabitsTable } from "@/components/habits/weekly-habits-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import { startOfDay, parseISO } from "date-fns"

type HabitWithEntries = Habit & {
  entries: HabitEntry[]
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitWithEntries[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const fetchHabits = async () => {
    try {
      const response = await fetch("/api/habits")
      if (!response.ok) throw new Error("Erreur lors du chargement des habitudes")
      const data = await response.json()
      setHabits(data)
    } catch (error) {
      console.error("Error fetching habits:", error)
      toast.error("Erreur lors du chargement des habitudes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHabits()
  }, [])

  // Fonction pour sauvegarder immédiatement une habitude
  const saveHabitStatus = async (habitId: string, date: Date, completed: boolean): Promise<boolean> => {
    try {
      // Normaliser la date: définir à midi pour éviter les problèmes de fuseau horaire
      const targetDate = new Date(date);
      targetDate.setHours(12, 0, 0, 0);

      setIsSaving(true);
      
      // Envoyer la requête au serveur
      const response = await fetch("/api/habits/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          habitId: habitId,
          date: targetDate.toISOString(),
          completed: completed,
          skipDayValidation: true
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Pas de détails");
        console.error(`Erreur HTTP ${response.status} lors de la sauvegarde: ${response.statusText}`);
        console.error("Détails:", errorText);
        toast.error("Échec de la sauvegarde");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleHabit = useCallback(async (habitId: string, date: Date, currentCompleted: boolean): Promise<void> => {
    const newCompleted = !currentCompleted;
    
    // Normaliser la date: définir à midi pour éviter les problèmes de fuseau horaire
    const targetDate = new Date(date);
    targetDate.setHours(12, 0, 0, 0);

    // Mise à jour optimiste immédiate
    setHabits((prevHabits) =>
      prevHabits.map((habit) => {
        if (habit.id !== habitId) return habit;

        // Utiliser une fonction plus robuste pour comparer les dates
        const isSameDate = (date1: Date, date2: Date) => {
          const d1 = new Date(date1);
          const d2 = new Date(date2);
          return d1.getFullYear() === d2.getFullYear() && 
                 d1.getMonth() === d2.getMonth() && 
                 d1.getDate() === d2.getDate();
        };

        const existingEntryIndex = habit.entries.findIndex((e) =>
          isSameDate(new Date(e.date), targetDate)
        );

        const now = new Date();
        if (existingEntryIndex >= 0) {
          // Mettre à jour l'entrée existante
          const updatedEntries = [...habit.entries];
          updatedEntries[existingEntryIndex] = {
            ...updatedEntries[existingEntryIndex],
            completed: newCompleted,
            updatedAt: now,
          };
          return { ...habit, entries: updatedEntries };
        } else {
          // Ajouter une nouvelle entrée
          return {
            ...habit,
            entries: [
              ...habit.entries,
              {
                id: `temp-${Date.now()}`,
                habitId,
                date: targetDate,
                completed: newCompleted,
                createdAt: now,
                updatedAt: now,
                note: null,
                rating: null
              },
            ],
          };
        }
      })
    );

    // Sauvegarder immédiatement, sans file d'attente
    const success = await saveHabitStatus(habitId, targetDate, newCompleted);
    
    // Si la sauvegarde échoue, revenir à l'état précédent
    if (!success) {
      setHabits((prevHabits) =>
        prevHabits.map((habit) => {
          if (habit.id !== habitId) return habit;

          // Utiliser une fonction plus robuste pour comparer les dates
          const isSameDate = (date1: Date, date2: Date) => {
            const d1 = new Date(date1);
            const d2 = new Date(date2);
            return d1.getFullYear() === d2.getFullYear() && 
                  d1.getMonth() === d2.getMonth() && 
                  d1.getDate() === d2.getDate();
          };

          const existingEntryIndex = habit.entries.findIndex((e) =>
            isSameDate(new Date(e.date), targetDate)
          );

          if (existingEntryIndex >= 0) {
            // Remettre l'ancienne valeur
            const updatedEntries = [...habit.entries];
            updatedEntries[existingEntryIndex] = {
              ...updatedEntries[existingEntryIndex],
              completed: currentCompleted,
            };
            return { ...habit, entries: updatedEntries };
          } else {
            // Supprimer l'entrée temporaire si elle avait été ajoutée
            return {
              ...habit,
              entries: habit.entries.filter(entry => !entry.id.startsWith('temp-'))
            };
          }
        })
      );
    }
  }, []);

  if (loading) {
    return <div>Chargement...</div>
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mes Habitudes</h1>
        <Button onClick={() => router.push("/dashboard/habits/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Habitude
        </Button>
      </div>
      {isSaving && (
        <div className="mb-4 text-xs text-slate-500 italic">
          Sauvegarde en cours...
        </div>
      )}
      <WeeklyHabitsTable habits={habits} onToggleHabit={handleToggleHabit} />
    </div>
  )
} 