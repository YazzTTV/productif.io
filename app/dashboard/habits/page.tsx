"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Habit, HabitEntry } from "@prisma/client"
import { WeeklyHabitsTable } from "@/components/habits/weekly-habits-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { startOfDay, parseISO } from "date-fns"

type HabitWithEntries = Habit & {
  entries: HabitEntry[]
}

// Interface pour les actions en attente
interface PendingAction {
  habitId: string;
  date: Date;
  completed: boolean;
  retry?: number;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitWithEntries[]>([])
  const [loading, setLoading] = useState(true)
  // File d'attente pour les actions en attente
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([])
  // Référence pour suivre si le traitement est déjà en cours
  const isProcessingRef = useRef(false)
  const router = useRouter()

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

  // Fonction qui traite la file d'attente des actions
  const processQueue = useCallback(async () => {
    // Si déjà en train de traiter ou pas d'actions en attente, on sort
    if (isProcessingRef.current || pendingActions.length === 0) return;
    
    // Marquer comme en cours de traitement
    isProcessingRef.current = true;
    
    try {
      // Prendre la première action de la file
      const action = pendingActions[0];
      
      // Normaliser la date: définir à midi pour éviter les problèmes de fuseau horaire
      const targetDate = new Date(action.date);
      targetDate.setHours(12, 0, 0, 0);

      // Envoyer la requête au serveur
      const response = await fetch("/api/habits/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          habitId: action.habitId,
          date: targetDate.toISOString(),
          completed: action.completed,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de l'habitude");
      }

      // Retirer l'action traitée de la file
      setPendingActions(prev => prev.slice(1));
    } catch (error) {
      console.error("Error processing action:", error);
      
      // Si échec, on déplace l'action à la fin de la file avec un compteur de tentatives
      setPendingActions(prev => {
        const failedAction = prev[0];
        const retry = (failedAction.retry || 0) + 1;
        
        // Si trop de tentatives (3), on abandonne cette action
        if (retry > 3) {
          toast.error(`Échec de la mise à jour d'une habitude après plusieurs tentatives`);
          return prev.slice(1);
        }
        
        return [...prev.slice(1), {...failedAction, retry}];
      });
    } finally {
      // Marquer comme plus en traitement
      isProcessingRef.current = false;
      
      // Planifier le traitement de la prochaine action
      setTimeout(() => {
        if (pendingActions.length > 0) {
          processQueue();
        }
      }, 100);
    }
  }, [pendingActions]);

  // Traiter la file d'attente quand elle change
  useEffect(() => {
    if (pendingActions.length > 0 && !isProcessingRef.current) {
      processQueue();
    }
  }, [pendingActions, processQueue]);

  const handleToggleHabit = useCallback(async (habitId: string, date: Date, currentCompleted: boolean) => {
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

    // Ajouter l'action à la file d'attente
    setPendingActions(prev => [...prev, {
      habitId,
      date: targetDate,
      completed: newCompleted
    }]);
    
    // Retourner immédiatement pour ne pas bloquer l'interface
    return Promise.resolve();
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
      <WeeklyHabitsTable habits={habits} onToggleHabit={handleToggleHabit} />
    </div>
  )
} 