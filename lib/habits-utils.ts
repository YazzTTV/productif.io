import { prisma } from "@/lib/prisma"

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
