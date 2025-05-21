import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfToday, endOfToday, startOfTomorrow, endOfTomorrow, format, isSameDay } from "date-fns"

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Obtenir les dates avec normalisation pour éviter les problèmes de fuseau horaire
    const now = new Date();
    const today = startOfToday();
    const tomorrow = startOfTomorrow();
    const endTomorrow = endOfTomorrow();
    
    // Logs pour le débogage
    console.log("[TASKS_TOMORROW_GET] Fuseau horaire du serveur:", Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log("[TASKS_TOMORROW_GET] Date et heure actuelles:", now.toISOString());
    console.log("[TASKS_TOMORROW_GET] Date formatée:", format(now, "yyyy-MM-dd HH:mm:ss"));
    console.log("[TASKS_TOMORROW_GET] Début d'aujourd'hui:", today.toISOString());
    console.log("[TASKS_TOMORROW_GET] Début de demain:", tomorrow.toISOString());
    console.log("[TASKS_TOMORROW_GET] Fin de demain:", endTomorrow.toISOString());

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
    
    // Filtrer les tâches pour demain avec vérification stricte des dates
    const tasksForTomorrow = allTasks.filter(task => {
      // Tâche avec dueDate demain
      if (task.dueDate && isSameDay(new Date(task.dueDate), tomorrow)) {
        console.log(`[TASKS_TOMORROW_GET] Tâche avec dueDate demain: ${task.id} - ${task.title} - ${new Date(task.dueDate).toISOString()}`);
        return true;
      }
      
      // Tâche planifiée pour demain
      if (task.scheduledFor && isSameDay(new Date(task.scheduledFor), tomorrow)) {
        console.log(`[TASKS_TOMORROW_GET] Tâche planifiée pour demain: ${task.id} - ${task.title} - ${new Date(task.scheduledFor).toISOString()}`);
        return true;
      }
      
      // Vérification de non-contamination avec les tâches d'aujourd'hui
      if (task.dueDate && isSameDay(new Date(task.dueDate), today)) {
        console.log(`[TASKS_TOMORROW_GET] ⚠️ Tâche avec dueDate aujourd'hui trouvée: ${task.id} - ${task.title} - ${new Date(task.dueDate).toISOString()}`);
      }
      
      if (task.scheduledFor && isSameDay(new Date(task.scheduledFor), today)) {
        console.log(`[TASKS_TOMORROW_GET] ⚠️ Tâche scheduledFor aujourd'hui trouvée: ${task.id} - ${task.title} - ${new Date(task.scheduledFor).toISOString()}`);
      }
      
      return false;
    });

    console.log(`[TASKS_TOMORROW_GET] Nombre total de tâches trouvées pour demain: ${tasksForTomorrow.length}`);

    // Tri des tâches
    tasksForTomorrow.sort((a, b) => {
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

    return NextResponse.json(tasksForTomorrow.slice(0, 20))
  } catch (error) {
    console.error("[TASKS_TOMORROW_GET] Erreur:", error)
    return NextResponse.json({ error: "Erreur lors du chargement des tâches de demain" }, { status: 500 })
  }
} 