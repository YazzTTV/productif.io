import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { startOfDay } from "date-fns"
import { getAuthUser, getAuthUserFromRequest } from "@/lib/auth"

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

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const routeName = "[HABITS]"
  
  try {
    console.log(`${routeName} ⏱️  DÉBUT - Route: /api/habits - Timestamp: ${new Date().toISOString()}`)
    
    // Essayer d'abord avec getAuthUserFromRequest (tokens utilisateur dans headers)
    let user = await getAuthUserFromRequest(req)
    
    // Si pas d'utilisateur, essayer avec getAuthUser (cookies pour web)
    if (!user) {
      user = await getAuthUser()
    }
    
    if (!user) {
      console.log(`${routeName} ❌ ERREUR - Non authentifié après ${Date.now() - startTime}ms`)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    console.log(`${routeName} ✅ Utilisateur authentifié: ${user.id} - Temps: ${Date.now() - startTime}ms`)

    // Obtenir la date du jour
    const today = new Date()
    // Normaliser à minuit puis mettre à midi pour éviter les problèmes de fuseau horaire
    const normalizedDate = startOfDay(today)
    normalizedDate.setHours(12, 0, 0, 0)
    
    // Obtenir le jour en anglais pour le filtrage
    const currentDayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
    
    // Récupérer toutes les habitudes de l'utilisateur avec toutes leurs entrées historiques
    const habits = await prisma.habit.findMany({
      where: {
        userId: user.id,
      },
      include: {
        entries: {
          orderBy: {
            date: 'desc'
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    // Calculer les streaks pour chaque habitude
    const habitsWithStreaks = habits.map(habit => {
      let streak = 0
      
      // Trier les entrées complétées par date décroissante (les plus récentes en premier)
      const sortedEntries = [...habit.entries]
        .filter(entry => entry.completed) // Seulement les entrées complétées
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      if (sortedEntries.length === 0) {
        // Aucune entrée complétée, streak = 0
        return {
          ...habit,
          currentStreak: 0,
        }
      }
      
      // Prendre la date de la dernière entrée complétée
      const lastEntry = sortedEntries[0]
      const lastCompletedDate = new Date(lastEntry.date)
      lastCompletedDate.setHours(12, 0, 0, 0)
      
      // Calculer le streak en remontant depuis le dernier jour complété
      let checkDate = new Date(lastCompletedDate)
      checkDate.setHours(12, 0, 0, 0)
      
      // Créer un Set des dates complétées pour une recherche rapide
      const completedDatesSet = new Set(
        sortedEntries.map(entry => {
          const d = new Date(entry.date)
          d.setHours(12, 0, 0, 0)
          return d.getTime()
        })
      )
      
      // Calculer le streak en remontant jour par jour
      while (true) {
        const dayName = checkDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
        
        // Vérifier si l'habitude est prévue ce jour
        if (!habit.daysOfWeek.includes(dayName)) {
          // Si l'habitude n'est pas prévue ce jour, passer au jour précédent
          checkDate.setDate(checkDate.getDate() - 1)
          continue
        }
        
        // Normaliser la date pour la comparaison (midi)
        const normalizedCheckDate = new Date(checkDate)
        normalizedCheckDate.setHours(12, 0, 0, 0)
        const checkDateTimestamp = normalizedCheckDate.getTime()
        
        // Vérifier si ce jour est complété
        if (completedDatesSet.has(checkDateTimestamp)) {
          streak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          // Pas d'entrée complétée pour ce jour, le streak s'arrête
          break
        }
        
        // Limite de sécurité
        if (streak > 365) {
          break
        }
      }
      
      // Toujours retourner la streak, même si elle est 0
      return {
        ...habit,
        currentStreak: streak,
      }
    })

    // Retourner les habitudes avec leurs entrées et leurs streaks
    const totalTime = Date.now() - startTime
    console.log(`${routeName} ✅ SUCCÈS - Route terminée en ${totalTime}ms - Habitudes: ${habitsWithStreaks.length} - Timestamp: ${new Date().toISOString()}`)
    
    return NextResponse.json(habitsWithStreaks)
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`${routeName} ❌ ERREUR - Route échouée après ${totalTime}ms - Timestamp: ${new Date().toISOString()}`)
    console.error("Erreur lors de la récupération des habitudes:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des habitudes" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Essayer d'abord avec getAuthUserFromRequest (tokens utilisateur dans headers)
    let user = await getAuthUserFromRequest(req)
    
    // Si pas d'utilisateur, essayer avec getAuthUser (cookies pour web)
    if (!user) {
      user = await getAuthUser()
    }
    
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