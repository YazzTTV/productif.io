import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiAuth } from '@/middleware/api-auth'

// GET /api/projects/agent - Récupérer tous les projets via token API
export async function GET(req: NextRequest) {
  // Vérifier l'authentification API
  const authResponse = await apiAuth(req, {
    requiredScopes: ['projects:read']
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
    // Récupérer tous les projets de l'utilisateur avec leurs statistiques
    const projects = await prisma.project.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            tasks: {
              where: {
                completed: false
              }
            }
          }
        }
      }
    })

    // Calculer les statistiques détaillées pour chaque projet
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const completedTasksCount = await prisma.task.count({
          where: {
            projectId: project.id,
            completed: true
          }
        })
        
        const totalTasks = completedTasksCount + project._count.tasks
        const completionPercentage = totalTasks > 0 
          ? Math.round((completedTasksCount / totalTasks) * 100) 
          : 0
        
        return {
          ...project,
          stats: {
            totalTasks,
            completedTasks: completedTasksCount,
            tasksInProgress: project._count.tasks,
            completionPercentage
          }
        }
      })
    )
    
    return NextResponse.json(projectsWithStats)
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des projets' },
      { status: 500 }
    )
  }
}

// POST /api/projects/agent - Créer un nouveau projet via token API
export async function POST(req: NextRequest) {
  // Vérifier l'authentification API
  const authResponse = await apiAuth(req, {
    requiredScopes: ['projects:write']
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
    const { name, description, color } = await req.json()
    
    // Validation
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Le nom du projet est requis' }, { status: 400 })
    }
    
    // Créer le nouveau projet
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        color,
        userId,
      },
    })
    
    return NextResponse.json(project)
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du projet' },
      { status: 500 }
    )
  }
} 