import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, getAuthUserFromRequest } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const routeName = "[SUBJECTS]"
  
  try {
    console.log(`${routeName} ⏱️  DÉBUT - Route: /api/subjects - Timestamp: ${new Date().toISOString()}`)
    
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

    // Récupérer toutes les matières de l'utilisateur avec leurs tâches
    const subjects = await prisma.subject.findMany({
      where: {
        userId: user.id,
      },
      include: {
        tasks: {
          where: {
            completed: false,
          },
          orderBy: {
            dueDate: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Formater les données pour le frontend
    const formattedSubjects = subjects.map(subject => {
      const completedTasks = subject.tasks.filter(t => t.completed).length
      const totalTasks = subject.tasks.length
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      
      // Déterminer l'impact basé sur le coefficient
      let impact: 'high' | 'medium' | 'low' = 'low'
      if (subject.coefficient >= 3) {
        impact = 'high'
      } else if (subject.coefficient >= 2) {
        impact = 'medium'
      }

      // Trouver la prochaine deadline
      const nextDeadline = subject.deadline 
        ? `Deadline: ${new Date(subject.deadline).toLocaleDateString('fr-FR')}`
        : undefined

      return {
        id: subject.id,
        name: subject.name,
        coefficient: subject.coefficient,
        progress,
        impact,
        tasks: subject.tasks.map(task => ({
          id: task.id,
          title: task.title,
          estimatedTime: task.estimatedMinutes || 30,
          priority: task.priority === 4 ? 'high' : task.priority === 3 ? 'medium' : 'low',
          completed: task.completed,
          details: task.description || undefined,
        })),
        nextDeadline,
        deadline: subject.deadline,
      }
    })

    console.log(`${routeName} ✅ SUCCÈS - ${formattedSubjects.length} matières récupérées après ${Date.now() - startTime}ms`)
    return NextResponse.json(formattedSubjects, { status: 200 })

  } catch (error: any) {
    console.error(`${routeName} ❌ ERREUR après ${Date.now() - startTime}ms:`, error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des matières", details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const routeName = "[SUBJECTS]"
  
  try {
    console.log(`${routeName} ⏱️  DÉBUT - Route: /api/subjects POST - Timestamp: ${new Date().toISOString()}`)
    
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

    let body;
    try {
      body = await req.json()
      console.log(`${routeName} 📥 Body reçu:`, body)
    } catch (parseError: any) {
      console.error(`${routeName} ❌ Erreur de parsing JSON:`, parseError)
      return NextResponse.json(
        { error: "Format de données invalide", details: parseError.message },
        { status: 400 }
      )
    }

    const { name, coefficient, deadline } = body

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom de la matière est requis" },
        { status: 400 }
      )
    }

    if (!coefficient || typeof coefficient !== 'number' || coefficient < 1) {
      return NextResponse.json(
        { error: "Le coefficient doit être un nombre supérieur ou égal à 1" },
        { status: 400 }
      )
    }

    // Vérifier si une matière avec le même nom existe déjà
    const existingSubject = await prisma.subject.findFirst({
      where: {
        userId: user.id,
        name: {
          equals: name.trim(),
          mode: 'insensitive',
        },
      },
    })

    if (existingSubject) {
      return NextResponse.json(
        { error: "Une matière avec ce nom existe déjà" },
        { status: 409 }
      )
    }

    // Créer la matière
    let deadlineDate: Date | null = null;
    if (deadline) {
      try {
        deadlineDate = new Date(deadline);
        // Vérifier que la date est valide
        if (isNaN(deadlineDate.getTime())) {
          console.warn(`${routeName} ⚠️ Date invalide reçue: ${deadline}, utilisation de null`);
          deadlineDate = null;
        }
      } catch (dateError) {
        console.warn(`${routeName} ⚠️ Erreur lors de la conversion de la date: ${deadline}`, dateError);
        deadlineDate = null;
      }
    }

    console.log(`${routeName} 📝 Création matière avec:`, {
      name: name.trim(),
      coefficient: Math.round(coefficient),
      deadline: deadlineDate,
      userId: user.id,
    });

    const subject = await prisma.subject.create({
      data: {
        name: name.trim(),
        coefficient: Math.round(coefficient),
        deadline: deadlineDate,
        userId: user.id,
      },
      include: {
        tasks: true,
      },
    })

    // Formater la réponse
    const formattedSubject = {
      id: subject.id,
      name: subject.name,
      coefficient: subject.coefficient,
      progress: 0,
      impact: subject.coefficient >= 3 ? 'high' : subject.coefficient >= 2 ? 'medium' : 'low',
      tasks: [],
      nextDeadline: subject.deadline 
        ? `Deadline: ${new Date(subject.deadline).toLocaleDateString('fr-FR')}`
        : undefined,
      deadline: subject.deadline,
    }

    console.log(`${routeName} ✅ SUCCÈS - Matière créée: ${subject.id} après ${Date.now() - startTime}ms`)
    return NextResponse.json(formattedSubject, { status: 201 })

  } catch (error: any) {
    console.error(`${routeName} ❌ ERREUR après ${Date.now() - startTime}ms:`, error)
    return NextResponse.json(
      { error: "Erreur lors de la création de la matière", details: error.message },
      { status: 500 }
    )
  }
}

