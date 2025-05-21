import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format, isEqual, isBefore } from "date-fns"
import { formatInTimezone, USER_TIMEZONE } from "@/lib/date-utils"
import { parse, parseISO, isWithinInterval } from "date-fns"
import { toZonedTime } from "date-fns-tz"

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Obtenir les dates en tenant compte du fuseau horaire de l'utilisateur
    const now = new Date();
    
    // Créer le début de la journée dans le fuseau horaire de l'utilisateur
    const todayInUserTz = toZonedTime(now, USER_TIMEZONE);
    const startOfTodayUserTz = new Date(
      todayInUserTz.getFullYear(),
      todayInUserTz.getMonth(),
      todayInUserTz.getDate(),
      0, 0, 0
    );
    
    // Fin de la journée dans le fuseau horaire de l'utilisateur
    const endOfTodayUserTz = new Date(
      todayInUserTz.getFullYear(),
      todayInUserTz.getMonth(),
      todayInUserTz.getDate(),
      23, 59, 59, 999
    );
    
    // Début de demain dans le fuseau horaire de l'utilisateur
    const startOfTomorrowUserTz = new Date(
      todayInUserTz.getFullYear(),
      todayInUserTz.getMonth(),
      todayInUserTz.getDate() + 1,
      0, 0, 0
    );
    
    // Convertir ces dates en UTC pour les comparaisons avec la base de données
    const startOfTodayUtc = new Date(startOfTodayUserTz.toUTCString());
    const endOfTodayUtc = new Date(endOfTodayUserTz.toUTCString());
    const startOfTomorrowUtc = new Date(startOfTomorrowUserTz.toUTCString());
    
    // Logs pour le débogage
    console.log("[TASKS_TODAY_GET] Fuseau horaire utilisé:", USER_TIMEZONE);
    console.log("[TASKS_TODAY_GET] Date et heure actuelles (UTC):", now.toISOString());
    console.log("[TASKS_TODAY_GET] Date et heure actuelles (User TZ):", toZonedTime(now, USER_TIMEZONE).toISOString());
    console.log("[TASKS_TODAY_GET] Début d'aujourd'hui (User TZ):", startOfTodayUserTz.toISOString());
    console.log("[TASKS_TODAY_GET] Fin d'aujourd'hui (User TZ):", endOfTodayUserTz.toISOString());
    console.log("[TASKS_TODAY_GET] Début de demain (User TZ):", startOfTomorrowUserTz.toISOString());
    console.log("[TASKS_TODAY_GET] Début d'aujourd'hui (UTC):", startOfTodayUtc.toISOString());
    console.log("[TASKS_TODAY_GET] Fin d'aujourd'hui (UTC):", endOfTodayUtc.toISOString());
    console.log("[TASKS_TODAY_GET] Début de demain (UTC):", startOfTomorrowUtc.toISOString());

    // Récupérer TOUTES les tâches de l'utilisateur pour filtrage et débogage
    const allTasks = await prisma.task.findMany({
      where: {
        userId: user.id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log(`[TASKS_TODAY_GET] Nombre total de tâches récupérées: ${allTasks.length}`);
    
    // Identifier et filtrer les tâches en tenant compte du fuseau horaire
    const tasksForToday = [];
    const tomorrowTasks = [];
    
    for (const task of allTasks) {
      // Convertir les dates de la tâche en tenant compte du fuseau horaire
      const dueDate = task.dueDate ? toZonedTime(new Date(task.dueDate), USER_TIMEZONE) : null;
      const scheduledFor = task.scheduledFor ? toZonedTime(new Date(task.scheduledFor), USER_TIMEZONE) : null;
      const updatedAt = task.updatedAt ? toZonedTime(new Date(task.updatedAt), USER_TIMEZONE) : null;
      const createdAt = task.createdAt ? toZonedTime(new Date(task.createdAt), USER_TIMEZONE) : null;
      
      // Tester si la date d'échéance est aujourd'hui dans le fuseau horaire de l'utilisateur
      const isDueToday = dueDate && isWithinInterval(dueDate, {
        start: startOfTodayUserTz,
        end: endOfTodayUserTz
      });
      
      // Tester si la tâche est planifiée pour aujourd'hui dans le fuseau horaire de l'utilisateur
      const isScheduledForToday = scheduledFor && isWithinInterval(scheduledFor, {
        start: startOfTodayUserTz,
        end: endOfTodayUserTz
      });
      
      // Tester si la tâche a été mise à jour aujourd'hui (pour les tâches complétées)
      const isCompletedToday = task.completed && updatedAt && isWithinInterval(updatedAt, {
        start: startOfTodayUserTz,
        end: endOfTodayUserTz
      });
      
      // Tester si la tâche est en retard
      const isOverdue = dueDate && !task.completed && dueDate < startOfTodayUserTz;
      
      // Tester si la tâche a été créée aujourd'hui sans date d'échéance ou date de planification
      const isCreatedTodayWithoutDates = createdAt && 
        isWithinInterval(createdAt, { start: startOfTodayUserTz, end: endOfTodayUserTz }) && 
        !dueDate && !scheduledFor;
      
      // Vérifier si la date d'échéance ou la date planifiée est demain
      const isDueTomorrow = dueDate && isWithinInterval(dueDate, {
        start: startOfTomorrowUserTz,
        end: new Date(startOfTomorrowUserTz.getTime() + 24 * 60 * 60 * 1000 - 1)
      });
      
      const isScheduledForTomorrow = scheduledFor && isWithinInterval(scheduledFor, {
        start: startOfTomorrowUserTz,
        end: new Date(startOfTomorrowUserTz.getTime() + 24 * 60 * 60 * 1000 - 1)
      });
      
      // Enregistrer les tâches de demain pour le débogage
      if (isDueTomorrow || isScheduledForTomorrow) {
        tomorrowTasks.push(task);
        console.log(`[TASKS_TODAY_GET] ⚠️ Tâche demain identifiée: ${task.id} - ${task.title} - ` +
                   `dueDate: ${task.dueDate?.toISOString() || 'N/A'} - scheduledFor: ${task.scheduledFor?.toISOString() || 'N/A'}`);
      }
      
      // Ajouter la tâche à la liste des tâches d'aujourd'hui si elle correspond aux critères
      if (isDueToday || isScheduledForToday || isCompletedToday || isOverdue || isCreatedTodayWithoutDates) {
        // Ne pas inclure les tâches de demain même si elles pourraient être considérées comme d'aujourd'hui
        if (!isDueTomorrow && !isScheduledForTomorrow) {
          tasksForToday.push(task);
          
          // Log pour débogage
          const reason = [];
          if (isDueToday) reason.push("due aujourd'hui");
          if (isScheduledForToday) reason.push("planifiée aujourd'hui");
          if (isCompletedToday) reason.push("complétée aujourd'hui");
          if (isOverdue) reason.push("en retard");
          if (isCreatedTodayWithoutDates) reason.push("créée aujourd'hui sans dates");
          
          console.log(`[TASKS_TODAY_GET] Tâche ajoutée (${reason.join(", ")}): ${task.id} - ${task.title}`);
        }
      }
    }
    
    if (tomorrowTasks.length > 0) {
      console.log(`[TASKS_TODAY_GET] ⚠️ ${tomorrowTasks.length} tâches trouvées pour DEMAIN mais exclues`);
    }

    console.log(`[TASKS_TODAY_GET] Nombre total de tâches trouvées pour aujourd'hui: ${tasksForToday.length}`);
    
    // Tri des tâches
    tasksForToday.sort((a, b) => {
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

    return NextResponse.json(tasksForToday.slice(0, 20))
  } catch (error) {
    console.error("[TASKS_TODAY_GET] Erreur:", error)
    return NextResponse.json({ error: "Erreur lors du chargement des tâches" }, { status: 500 })
  }
} 