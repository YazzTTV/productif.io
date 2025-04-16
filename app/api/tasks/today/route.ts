import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfToday, endOfToday, startOfTomorrow, format, isEqual, isSameDay, isBefore, isTomorrow, isToday } from "date-fns"

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Obtenir les dates avec normalisation pour éviter les problèmes de fuseau horaire
    const now = new Date();
    const today = startOfToday();
    const endToday = endOfToday();
    const tomorrow = startOfTomorrow();
    
    // Logs pour le débogage
    console.log("[TASKS_TODAY_GET] Fuseau horaire du serveur:", Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log("[TASKS_TODAY_GET] Date et heure actuelles:", now.toISOString());
    console.log("[TASKS_TODAY_GET] Date formatée:", format(now, "yyyy-MM-dd HH:mm:ss"));
    console.log("[TASKS_TODAY_GET] Début d'aujourd'hui:", today.toISOString());
    console.log("[TASKS_TODAY_GET] Fin d'aujourd'hui:", endToday.toISOString());
    console.log("[TASKS_TODAY_GET] Début de demain:", tomorrow.toISOString());

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
    
    // Vérifier explicitement s'il y a des tâches pour demain et les signaler
    const tomorrowTasks = allTasks.filter(task => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const scheduledFor = task.scheduledFor ? new Date(task.scheduledFor) : null;
      
      return (dueDate && isTomorrow(dueDate)) || (scheduledFor && isTomorrow(scheduledFor));
    });
    
    if (tomorrowTasks.length > 0) {
      console.log(`[TASKS_TODAY_GET] ⚠️ ${tomorrowTasks.length} tâches trouvées pour DEMAIN:`);
      tomorrowTasks.forEach(task => {
        console.log(`[TASKS_TODAY_GET] ⚠️ Tâche demain: ${task.id} - ${task.title} - ` +
                   `dueDate: ${task.dueDate?.toISOString() || 'N/A'} - scheduledFor: ${task.scheduledFor?.toISOString() || 'N/A'}`);
      });
    }
    
    // Filtrer les tâches pour aujourd'hui avec vérification stricte des dates
    const tasksForToday = allTasks.filter(task => {
      // Convertir en objets Date pour utiliser les fonctions date-fns correctement
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const scheduledFor = task.scheduledFor ? new Date(task.scheduledFor) : null;
      const updatedAt = task.updatedAt ? new Date(task.updatedAt) : null;
      
      // Tâche avec dueDate aujourd'hui
      if (dueDate && isToday(dueDate)) {
        console.log(`[TASKS_TODAY_GET] Tâche avec dueDate aujourd'hui: ${task.id} - ${task.title} - ${dueDate.toISOString()}`);
        return true;
      }
      
      // Tâche planifiée pour aujourd'hui
      if (scheduledFor && isToday(scheduledFor)) {
        console.log(`[TASKS_TODAY_GET] Tâche planifiée pour aujourd'hui: ${task.id} - ${task.title} - ${scheduledFor.toISOString()}`);
        return true;
      }
      
      // Tâche complétée aujourd'hui
      if (task.completed && updatedAt && isToday(updatedAt)) {
        console.log(`[TASKS_TODAY_GET] Tâche complétée aujourd'hui: ${task.id} - ${task.title} - ${updatedAt.toISOString()}`);
        return true;
      }
      
      // Tâche en retard (due avant aujourd'hui, non complétée)
      if (dueDate && !task.completed && isBefore(dueDate, today)) {
        console.log(`[TASKS_TODAY_GET] Tâche en retard: ${task.id} - ${task.title} - ${dueDate.toISOString()}`);
        return true;
      }
      
      // Si la tâche a été créée aujourd'hui et n'a pas de date d'échéance ou date de planification
      if (task.createdAt && isToday(new Date(task.createdAt)) && !dueDate && !scheduledFor) {
        console.log(`[TASKS_TODAY_GET] Tâche créée aujourd'hui sans date: ${task.id} - ${task.title}`);
        return true;
      }
      
      // IMPORTANT: Exclure explicitement les tâches de demain
      if (dueDate && isTomorrow(dueDate)) {
        console.log(`[TASKS_TODAY_GET] ⚠️ Exclusion de tâche demain: ${task.id} - ${task.title} - ${dueDate.toISOString()}`);
        return false;
      }
      
      if (scheduledFor && isTomorrow(scheduledFor)) {
        console.log(`[TASKS_TODAY_GET] ⚠️ Exclusion de tâche scheduledFor demain: ${task.id} - ${task.title} - ${scheduledFor.toISOString()}`);
        return false;
      }
      
      return false;
    });

    console.log(`[TASKS_TODAY_GET] Nombre total de tâches trouvées pour aujourd'hui: ${tasksForToday.length}`);
    
    // Double vérification pour s'assurer qu'aucune tâche de demain n'est incluse
    const doubleCheck = tasksForToday.filter(task => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const scheduledFor = task.scheduledFor ? new Date(task.scheduledFor) : null;
      
      return (dueDate && isTomorrow(dueDate)) || (scheduledFor && isTomorrow(scheduledFor));
    });
    
    if (doubleCheck.length > 0) {
      console.log(`[TASKS_TODAY_GET] ⚠️ ERREUR: ${doubleCheck.length} tâches de demain ont été incluses par erreur!`);
      console.log(`[TASKS_TODAY_GET] Retrait forcé des tâches de demain...`);
      const correctedTasks = tasksForToday.filter(task => {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const scheduledFor = task.scheduledFor ? new Date(task.scheduledFor) : null;
        
        return !((dueDate && isTomorrow(dueDate)) || (scheduledFor && isTomorrow(scheduledFor)));
      });
      
      console.log(`[TASKS_TODAY_GET] Après correction: ${correctedTasks.length} tâches`);
      tasksForToday.length = 0;
      tasksForToday.push(...correctedTasks);
    }

    // Tri des tâches
    tasksForToday.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      if (a.priority !== b.priority) {
        return (a.priority || 999) - (b.priority || 999);
      }
      
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