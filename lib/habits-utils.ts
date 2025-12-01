import { prisma } from "@/lib/prisma"

/**
 * Crée des habitudes par défaut pour un nouvel utilisateur
 */
export async function createDefaultHabits(userId: string) {
  try {
    const defaultHabits = [
      {
        name: "Boire 8 verres d'eau",
        description: "Rester hydraté tout au long de la journée",
        icon: "💧",
        category: "Santé",
        frequency: "daily",
        targetValue: 8,
        unit: "verres",
        isActive: true,
      },
      {
        name: "Méditation quotidienne",
        description: "Prendre 10 minutes pour méditer",
        icon: "🧘",
        category: "Bien-être",
        frequency: "daily",
        targetValue: 10,
        unit: "minutes",
        isActive: true,
      },
      {
        name: "Exercice physique",
        description: "Faire au moins 30 minutes d'exercice",
        icon: "🏃",
        category: "Santé",
        frequency: "daily",
        targetValue: 30,
        unit: "minutes",
        isActive: true,
      },
      {
        name: "Lecture",
        description: "Lire pendant 20 minutes",
        icon: "📚",
        category: "Développement personnel",
        frequency: "daily",
        targetValue: 20,
        unit: "minutes",
        isActive: true,
      },
    ]

    // Créer les habitudes par défaut
    for (const habit of defaultHabits) {
      await prisma.habit.create({
        data: {
          ...habit,
          userId,
        },
      })
    }

    console.log(`✅ Habitudes par défaut créées pour l'utilisateur ${userId}`)
  } catch (error) {
    console.error("❌ Erreur lors de la création des habitudes par défaut:", error)
    // Ne pas faire échouer l'inscription si la création des habitudes échoue
  }
}
