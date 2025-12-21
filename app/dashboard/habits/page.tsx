"use client"

import { useEffect, useState, useCallback } from "react"
import { Habit, HabitEntry } from "@prisma/client"
import { WeeklyHabitsTable } from "@/components/habits/weekly-habits-table"
import { MobileHabitsCards } from "@/components/habits/mobile-habits-cards"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import {
  Home,
  Bot,
  Settings as SettingsIcon,
  Plus,
  TrendingUp,
  CheckCircle2,
  Trophy,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useLocale } from "@/lib/i18n"

type HabitWithEntries = Habit & {
  entries: HabitEntry[]
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitWithEntries[]>([])
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()
  const router = useRouter()
  const { t } = useLocale()

  const fetchHabits = async () => {
    try {
      const response = await fetch("/api/habits")
      if (!response.ok) throw new Error(t('errorLoadingHabits'))
      const data = await response.json()
      setHabits(data)
    } catch (error) {
      console.error("Error fetching habits:", error)
      toast.error(t('errorLoadingHabits'))
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
    }
  };

  // Fonction utilitaire pour comparer les dates
  const isSameDate = (date1: Date, date2: Date) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getDate() === d2.getDate();
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

    // Sauvegarder en arrière-plan sans bloquer l'interface
    saveHabitStatus(habitId, targetDate, newCompleted).then(success => {
      // Si la sauvegarde échoue, revenir à l'état précédent
      if (!success) {
        setHabits((prevHabits) =>
          prevHabits.map((habit) => {
            if (habit.id !== habitId) return habit;

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
    });
  }, []);

  // Nouvelle fonction pour gérer les mises à jour custom (apprentissage, note, etc.)
  const handleCustomUpdate = useCallback(async (
    habitId: string, 
    date: Date, 
    data: { completed?: boolean; note?: string; rating?: number }
  ): Promise<void> => {
    const targetDate = new Date(date);
    targetDate.setHours(12, 0, 0, 0);

    // Mise à jour optimiste immédiate dans l'état principal
    setHabits((prevHabits) =>
      prevHabits.map((habit) => {
        if (habit.id !== habitId) return habit;

        const existingEntryIndex = habit.entries.findIndex((e) =>
          isSameDate(new Date(e.date), targetDate)
        );

        const now = new Date();
        const entryData = {
          completed: data.completed !== undefined ? data.completed : true,
          note: data.note !== undefined ? data.note : null,
          rating: data.rating !== undefined ? data.rating : null,
          updatedAt: now,
        };

        if (existingEntryIndex >= 0) {
          // Mettre à jour l'entrée existante
          const updatedEntries = [...habit.entries];
          updatedEntries[existingEntryIndex] = {
            ...updatedEntries[existingEntryIndex],
            ...entryData,
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
                createdAt: now,
                ...entryData,
              },
            ],
          };
        }
      })
    );

    // Sauvegarder sur le serveur
    try {
      const response = await fetch("/api/habits/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          habitId,
          date: targetDate.toISOString(),
          completed: data.completed !== undefined ? data.completed : true,
          note: data.note || null,
          rating: data.rating || null
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de l'habitude");
      }

      toast.success("Habitude mise à jour avec succès");
    } catch (error) {
      console.error("Error updating habit:", error);
      toast.error("Erreur lors de la mise à jour de l'habitude");
      
      // En cas d'erreur, recharger les données depuis le serveur
      fetchHabits();
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C27A] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des habitudes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col">
      {/* Top Navigation Bar (même header que le dashboard) */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm sticky top-0 z-50"
      >
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Brand */}
            <Link href="/dashboard" className="flex items-center gap-3 mr-auto">
              <Image
                src="/P_tech_letter_logo_TEMPLATE-removebg-preview.png"
                alt="Productif.io"
                width={64}
                height={64}
                className="object-contain"
              />
              <h1 className="text-2xl text-gray-900 whitespace-nowrap">
                Productif.io
              </h1>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2.5 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-2xl flex items-center gap-2 shadow-md"
              >
                <Home size={20} />
                <span>{t("dashboard")}</span>
              </motion.button>

              <motion.button
                onClick={() => router.push("/dashboard/assistant-ia")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 hover:bg-gray-100 text-gray-700 rounded-2xl flex items-center gap-2 transition-all"
              >
                <Bot size={20} />
                <span>{t("aiAssistant")}</span>
              </motion.button>

              <motion.button
                onClick={() => router.push("/dashboard/analytics")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 hover:bg-gray-100 text-gray-700 rounded-2xl flex items-center gap-2 transition-all"
              >
                <TrendingUp size={20} />
                <span>{t("analytics")}</span>
              </motion.button>

              <motion.button
                onClick={() => router.push("/dashboard/tasks")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 hover:bg-gray-100 text-gray-700 rounded-2xl flex items-center gap-2 transition-all"
              >
                <CheckCircle2 size={20} />
                <span>{t("tasks")}</span>
              </motion.button>

              <motion.button
                onClick={() => router.push("/dashboard/leaderboard")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 hover:bg-gray-100 text-gray-700 rounded-2xl flex items-center gap-2 transition-all"
              >
                <Trophy size={20} />
                <span>{t("leaderboard")}</span>
              </motion.button>

              <motion.button
                onClick={() => router.push("/dashboard/settings")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 hover:bg-gray-100 text-gray-700 rounded-2xl flex items-center gap-2 transition-all"
              >
                <SettingsIcon size={20} />
                <span>{t("settings")}</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content - même layout que le dashboard */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          {/* Header de page */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h2 className="text-gray-800 text-3xl mb-2">Mes habitudes</h2>
              <p className="text-gray-600 text-lg">
                Suivez vos routines quotidiennes et vos séries jour par jour.
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/habits/new")}
              className="flex items-center gap-2 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-2xl px-5 py-2.5 shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>Nouvelle habitude</span>
            </Button>
          </motion.div>

          {/* Interface mobile / desktop */}
          {isMobile ? (
            <MobileHabitsCards
              habits={habits}
              onToggleHabit={handleToggleHabit}
              onCustomUpdate={handleCustomUpdate}
              loading={loading}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
            >
              <WeeklyHabitsTable
                habits={habits}
                onToggleHabit={handleToggleHabit}
                onCustomUpdate={handleCustomUpdate}
              />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
} 