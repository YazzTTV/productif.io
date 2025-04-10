import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval } from "date-fns"

export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Obtenir la date du jour
    const today = new Date()
    // Normaliser à minuit puis mettre à midi pour éviter les problèmes de fuseau horaire
    const normalizedDate = startOfDay(today)
    normalizedDate.setHours(12, 0, 0, 0)
    
    // Obtenir le jour en anglais pour le filtrage
    const currentDayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
    
    // Définir l'intervalle pour les 30 derniers jours
    const thirtyDaysAgo = subDays(today, 29) // 29 pour avoir 30 jours avec aujourd'hui inclus
    
    // Générer un tableau avec tous les jours de l'intervalle
    const dateInterval = eachDayOfInterval({
      start: startOfDay(thirtyDaysAgo),
      end: endOfDay(today)
    })
    
    // Récupérer toutes les habitudes de l'utilisateur
    const habits = await prisma.habit.findMany({
      where: {
        userId: user.id,
      },
      include: {
        entries: {
          where: {
            date: {
              gte: startOfDay(thirtyDaysAgo),
              lte: endOfDay(today),
            },
          },
        },
      },
    })

    // Statistiques pour aujourd'hui
    // Filtrer les habitudes pour ne garder que celles assignées au jour actuel
    const todayHabits = habits.filter(habit => habit.daysOfWeek.includes(currentDayOfWeek))
    const totalHabits = todayHabits.length
    
    // Compter uniquement les habitudes complétées pour aujourd'hui parmi celles qui sont assignées à ce jour
    const completedHabits = todayHabits.filter(habit => 
      habit.entries.some(entry => {
        const entryDate = new Date(entry.date)
        return entry.completed && 
               entryDate.getFullYear() === normalizedDate.getFullYear() && 
               entryDate.getMonth() === normalizedDate.getMonth() && 
               entryDate.getDate() === normalizedDate.getDate()
      })
    ).length

    // Calculer le taux de complétion en pourcentage, seulement si des habitudes sont assignées à ce jour
    const completionRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0

    // Statistiques pour les 30 derniers jours
    const dailyStats = dateInterval.map(date => {
      const dateNormalized = new Date(date)
      dateNormalized.setHours(12, 0, 0, 0)
      
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
      
      // Ne prendre en compte que les habitudes assignées à ce jour de la semaine
      const dayHabits = habits.filter(habit => habit.daysOfWeek.includes(dayName))
      const dayTotal = dayHabits.length
      
      // Compter les habitudes complétées pour ce jour
      const dayCompleted = dayHabits.filter(habit => 
        habit.entries.some(entry => {
          const entryDate = new Date(entry.date)
          return entry.completed && 
                 entryDate.getFullYear() === dateNormalized.getFullYear() && 
                 entryDate.getMonth() === dateNormalized.getMonth() && 
                 entryDate.getDate() === dateNormalized.getDate()
        })
      ).length
      
      // Calculer le taux de complétion, uniquement s'il y a des habitudes assignées à ce jour
      const dayCompletionRate = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0
      
      return {
        date: format(date, 'yyyy-MM-dd'),
        formattedDate: format(date, 'dd/MM'),
        total: dayTotal,
        completed: dayCompleted,
        completionRate: dayCompletionRate
      }
    })

    // Pour le simple widget d'habitudes
    const simpleStat = {
      total: totalHabits,
      completed: completedHabits,
      rate: completionRate
    }
    
    // Pour la compatibilité avec le composant HabitStats existant
    const fullStats = {
      totalHabits,
      completedHabits,
      completionRate,
      dailyStats
    }

    // Détecter quel format est demandé via le paramètre de requête "format"
    const url = new URL(request.url)
    const formatParam = url.searchParams.get('format')
    
    if (formatParam === 'simple') {
      return NextResponse.json(simpleStat)
    }
    
    return NextResponse.json(fullStats)
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques d'habitudes:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
} 