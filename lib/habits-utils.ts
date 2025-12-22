import { prisma } from "@/lib/prisma"

export type HabitCategory = "MORNING" | "DAY" | "EVENING" | "ANTI"

// Inférence simple mais fonctionnelle basée sur l'intention
export function inferHabitCategory(name: string, description?: string | null): HabitCategory {
  const text = `${name || ""} ${description || ""}`.toLowerCase()

  // 1) Anti-habitudes : éviter un comportement
  if (
    /\b(no|ne pas|sans|stop|arrêter|éviter)\b/.test(text) ||
    text.includes("réseaux sociaux") ||
    text.includes("junk food") ||
    text.includes("alcool") ||
    text.includes("porn") ||
    text.includes("scrolling")
  ) {
    return "ANTI"
  }

  // 2) Soir / récupération / sommeil
  if (
    text.includes("sommeil") ||
    text.includes("dormir") ||
    text.includes("coucher") ||
    text.includes("écran") ||
    text.includes("écrans") ||
    text.includes("déconnexion") ||
    text.includes("routine du soir") ||
    text.includes("préparer demain") ||
    text.includes("journal du soir") ||
    text.includes("éteindre") ||
    text.includes("screens off")
  ) {
    return "EVENING"
  }

  // 3) Matin / démarrage / clarté
  if (
    text.includes("réveil") ||
    text.includes("lever") ||
    text.includes("routine du matin") ||
    text.includes("planifier la journée") ||
    text.includes("plan my day") ||
    text.includes("clarifier") ||
    text.includes("intention") ||
    text.includes("gratitude matin") ||
    text.includes("hydratation") ||
    text.includes("eau au réveil") ||
    text.includes("méditation")
  ) {
    return "MORNING"
  }

  // 4) Par défaut : exécution / journée
  return "DAY"
}

/**
 * Crée des habitudes par défaut pour un nouvel utilisateur
 */
export async function createDefaultHabits(userId: string) {
  try {
    const defaultHabits = [
      {
        name: "Apprentissage",
        description: "Notez ce que vous avez appris aujourd'hui",
        color: "#4338CA", // Indigo
        frequency: "daily",
        daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        order: 0, // L'apprentissage est toujours en premier
      },
      {
        name: "Note de sa journée",
        description: "Évaluez votre journée sur 10 et expliquez pourquoi",
        color: "#0EA5E9", // Sky
        frequency: "daily",
        daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        order: 1, // La note de journée est en deuxième
      },
    ]

    // Créer les habitudes par défaut
    for (const habit of defaultHabits) {
      const inferredCategory = inferHabitCategory(habit.name, habit.description)
      await prisma.habit.create({
        data: {
          ...habit,
          userId,
          inferredCategory,
        },
      })
    }

    console.log(`✅ Habitudes par défaut créées pour l'utilisateur ${userId}`)
  } catch (error) {
    console.error("❌ Erreur lors de la création des habitudes par défaut:", error)
    // Ne pas faire échouer l'inscription si la création des habitudes échoue
  }
}
