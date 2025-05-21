import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiAuth } from "@/middleware/api-auth"
import { parseISO, isWithinInterval } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { USER_TIMEZONE } from "@/lib/date-utils"

// Récupère les tâches pour une date spécifique via un agent IA
export async function GET(req: NextRequest) {
  // Vérifier l'authentification API
  const authResponse = await apiAuth(req, {
    requiredScopes: ['tasks:read']
  })
  
  // Si l'authentification a échoué, retourner la réponse d'erreur
  if (authResponse) {
    return authResponse
  }
  
  // Extraire l'ID de l'utilisateur à partir de l'en-tête (ajouté par le middleware)
  const userId = req.headers.get('x-api-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
  }
  
  try {
    // Récupérer le paramètre de date de la requête
    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date')
    
    if (!dateParam) {
      return NextResponse.json({ error: "Paramètre de date requis" }, { status: 400 })
    }
    
    // Analyser la date fournie (format attendu: YYYY-MM-DD)
    let targetDate: Date;
    try {
      targetDate = parseISO(dateParam);
    } catch (error) {
      return NextResponse.json({ error: "Format de date invalide. Utilisez le format YYYY-MM-DD" }, { status: 400 })
    }
    
    // Créer le début de la journée dans le fuseau horaire de l'utilisateur
    const dateInUserTz = toZonedTime(targetDate, USER_TIMEZONE);
    const startOfDayUserTz = new Date(
      dateInUserTz.getFullYear(),
      dateInUserTz.getMonth(),
      dateInUserTz.getDate(),
      0, 0, 0
    );
    
    // Fin de la journée dans le fuseau horaire de l'utilisateur
    const endOfDayUserTz = new Date(
      dateInUserTz.getFullYear(),
      dateInUserTz.getMonth(),
      dateInUserTz.getDate(),
      23, 59, 59, 999
    );
    
    // Convertir ces dates en UTC pour les comparaisons avec la base de données
    const startOfDayUtc = new Date(startOfDayUserTz.toUTCString());
    const endOfDayUtc = new Date(endOfDayUserTz.toUTCString());
    
    // Logs pour le débogage
    console.log("[TASKS_AGENT_DATE_GET] Date demandée:", dateParam);
    console.log("[TASKS_AGENT_DATE_GET] Utilisateur:", userId);
    console.log("[TASKS_AGENT_DATE_GET] Fuseau horaire utilisé:", USER_TIMEZONE);
    console.log("[TASKS_AGENT_DATE_GET] Début du jour (User TZ):", startOfDayUserTz.toISOString());
    console.log("[TASKS_AGENT_DATE_GET] Fin du jour (User TZ):", endOfDayUserTz.toISOString());

    // Récupérer TOUTES les tâches de l'utilisateur pour filtrage et débogage
    const allTasks = await prisma.task.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });
    
    console.log(`[TASKS_AGENT_DATE_GET] Nombre total de tâches récupérées: ${allTasks.length}`);
    
    // Identifier et filtrer les tâches en tenant compte du fuseau horaire
    const tasksForDate = [];
    
    for (const task of allTasks) {
      // Convertir les dates de la tâche en tenant compte du fuseau horaire
      const dueDate = task.dueDate ? toZonedTime(new Date(task.dueDate), USER_TIMEZONE) : null;
      const scheduledFor = task.scheduledFor ? toZonedTime(new Date(task.scheduledFor), USER_TIMEZONE) : null;
      const updatedAt = task.updatedAt ? toZonedTime(new Date(task.updatedAt), USER_TIMEZONE) : null;
      const createdAt = task.createdAt ? toZonedTime(new Date(task.createdAt), USER_TIMEZONE) : null;
      
      // Tester si la date d'échéance est le jour demandé dans le fuseau horaire de l'utilisateur
      const isDueThisDay = dueDate && isWithinInterval(dueDate, {
        start: startOfDayUserTz,
        end: endOfDayUserTz
      });
      
      // Tester si la tâche est planifiée pour le jour demandé dans le fuseau horaire de l'utilisateur
      const isScheduledForThisDay = scheduledFor && isWithinInterval(scheduledFor, {
        start: startOfDayUserTz,
        end: endOfDayUserTz
      });
      
      // Tester si la tâche a été mise à jour le jour demandé (pour les tâches complétées)
      const isCompletedThisDay = task.completed && updatedAt && isWithinInterval(updatedAt, {
        start: startOfDayUserTz,
        end: endOfDayUserTz
      });
      
      // Tester si la tâche est en retard par rapport au jour demandé
      const isOverdue = dueDate && !task.completed && dueDate < startOfDayUserTz;
      
      // Tester si la tâche a été créée le jour demandé sans date d'échéance ou date de planification
      const isCreatedThisDayWithoutDates = createdAt && 
        isWithinInterval(createdAt, { start: startOfDayUserTz, end: endOfDayUserTz }) && 
        !dueDate && !scheduledFor;
      
      // Ajouter la tâche à la liste des tâches du jour demandé si elle correspond aux critères
      if (isDueThisDay || isScheduledForThisDay || isCompletedThisDay || isOverdue || isCreatedThisDayWithoutDates) {
        tasksForDate.push(task);
        
        // Log pour débogage
        const reason = [];
        if (isDueThisDay) reason.push("due ce jour");
        if (isScheduledForThisDay) reason.push("planifiée ce jour");
        if (isCompletedThisDay) reason.push("complétée ce jour");
        if (isOverdue) reason.push("en retard");
        if (isCreatedThisDayWithoutDates) reason.push("créée ce jour sans dates");
        
        console.log(`[TASKS_AGENT_DATE_GET] Tâche ajoutée (${reason.join(", ")}): ${task.id} - ${task.title}`);
      }
    }

    console.log(`[TASKS_AGENT_DATE_GET] Nombre total de tâches trouvées pour le ${dateParam}: ${tasksForDate.length}`);
    
    // Tri des tâches
    tasksForDate.sort((a, b) => {
      // D'abord trier par statut de complétion
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      // Ensuite trier par priorité (P0 > P1 > P2 > P3 > P4)
      const priorityOrder = {
        0: 5, // Quick Win
        1: 4, // Urgent
        2: 3, // Important
        3: 2, // A faire
        4: 1  // Optionnel
      };
      
      const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
      const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Ordre décroissant
      }

      // Si même priorité, trier par niveau d'énergie
      const energyOrder = {
        0: 4, // Extrême
        1: 3, // Élevé
        2: 2, // Moyen
        3: 1  // Faible
      };
      
      const energyA = energyOrder[a.energyLevel as keyof typeof energyOrder] || 0;
      const energyB = energyOrder[b.energyLevel as keyof typeof energyOrder] || 0;
      
      if (energyA !== energyB) {
        return energyB - energyA; // Ordre décroissant
      }

      // Si même priorité et même niveau d'énergie, trier par date d'échéance
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      return 0;
    });

    return NextResponse.json(tasksForDate)
  } catch (error) {
    console.error("[TASKS_AGENT_DATE_GET] Erreur:", error)
    return NextResponse.json({ error: "Erreur lors du chargement des tâches" }, { status: 500 })
  }
} 