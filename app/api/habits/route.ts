import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, subDays } from "date-fns"
import { getAuthUser } from "@/lib/auth"

// Habitudes par défaut
const DEFAULT_HABITS = [
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

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier et créer les habitudes par défaut
    for (const defaultHabit of DEFAULT_HABITS) {
      const existingHabit = await prisma.habit.findFirst({
        where: {
          userId: user.id,
          name: defaultHabit.name,
        },
      })

      if (!existingHabit) {
        // Créer l'habitude par défaut si elle n'existe pas
        await prisma.habit.create({
          data: {
            ...defaultHabit,
            userId: user.id,
          },
        });
      }
    }

    // 1. Récupérer toutes les habitudes avec Prisma
    const habits = await prisma.habit.findMany({
      where: {
        userId: user.id,
      },
      include: {
        entries: {
          orderBy: {
            date: "desc",
          },
          take: 30,
        },
      },
      orderBy: [
        {
          order: "asc" // Tri principal par le champ order
        },
        {
          createdAt: "desc" // Tri secondaire par date de création
        }
      ],
    });

    // 2. Pour chaque habitude, récupérer les entrées avec note et rating
    for (const habit of habits) {
      // Utiliser une méthode alternative pour récupérer les entrées avec les champs manquants
      const entries = await prisma.$queryRaw`
        SELECT 
          id, 
          "habitId", 
          date, 
          completed, 
          note, 
          rating, 
          "createdAt", 
          "updatedAt"
        FROM "habit_entries" 
        WHERE "habitId" = ${habit.id}
        ORDER BY date DESC 
        LIMIT 30
      `;

      // @ts-expect-error - Ignorer l'erreur TypeScript pour les propriétés note et rating
      habit.entries = entries;
    }

    return NextResponse.json(habits);
  } catch (error) {
    console.error("Erreur lors de la récupération des habitudes:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des habitudes" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, daysOfWeek, frequency, color } = body

    console.log("Données reçues pour la création d'habitude:", {
      name,
      description,
      daysOfWeek,
      frequency,
      color
    })

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: "Le nom de l'habitude est requis" },
        { status: 400 }
      )
    }

    if (!daysOfWeek || !Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return NextResponse.json(
        { error: "Veuillez sélectionner au moins un jour de la semaine" },
        { status: 400 }
      )
    }

    // Valider que les jours sont corrects
    const validDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    const allDaysValid = daysOfWeek.every(day => validDays.includes(day))
    if (!allDaysValid) {
      return NextResponse.json(
        { error: "Certains jours sélectionnés sont invalides" },
        { status: 400 }
      )
    }

    // Valider la fréquence
    if (!frequency || !["daily", "weekly"].includes(frequency)) {
      return NextResponse.json(
        { error: "La fréquence doit être 'daily' ou 'weekly'" },
        { status: 400 }
      )
    }

    // Trouver l'ordre maximum actuel pour placer la nouvelle habitude en dernier
    const maxOrderHabit = await prisma.habit.findFirst({
      where: { userId: user.id },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    const maxOrder = maxOrderHabit ? maxOrderHabit.order + 1 : 2; // +1 pour le placer après, ou 2 si aucune habitude (après les 2 par défaut)

    // Créer l'habitude
    const habit = await prisma.habit.create({
      data: {
        name,
        description,
        frequency,
        daysOfWeek,
        color,
        order: maxOrder,
        userId: user.id,
      },
    })

    return NextResponse.json(habit, { status: 201 })
  } catch (error) {
    console.error("Erreur lors de la création de l'habitude:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'habitude" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await req.json()
    const { habits } = body

    // Validation
    if (!habits || !Array.isArray(habits)) {
      return NextResponse.json(
        { error: "Format de données invalide" },
        { status: 400 }
      )
    }

    // Vérifier que toutes les habitudes appartiennent à l'utilisateur
    const habitIds = habits.map(h => h.id)
    const userHabits = await prisma.habit.findMany({
      where: {
        id: { in: habitIds },
        userId: user.id
      }
    })

    if (userHabits.length !== habitIds.length) {
      return NextResponse.json(
        { error: "Certaines habitudes n'appartiennent pas à l'utilisateur" },
        { status: 403 }
      )
    }

    // Mise à jour en masse des ordres
    const updates = habits.map((habit, index) => 
      prisma.habit.update({
        where: { id: habit.id },
        data: { order: index }
      })
    )

    await prisma.$transaction(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'ordre des habitudes:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'ordre des habitudes" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { habitId } = await req.json()

    // Vérifier que l'habitude appartient à l'utilisateur
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: user.id,
      },
    })

    if (!habit) {
      return NextResponse.json(
        { error: "Habitude non trouvée" },
        { status: 404 }
      )
    }

    // Supprimer l'habitude
    await prisma.habit.delete({
      where: {
        id: habitId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur lors de la suppression de l'habitude:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'habitude" },
      { status: 500 }
    )
  }
} 