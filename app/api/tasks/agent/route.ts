import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiAuth } from '@/middleware/api-auth'
import { calculateTaskOrder } from "@/lib/tasks"
import { localDateToUTC } from "@/lib/date-utils"

// Liste toutes les tâches pour un agent IA
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
    // Récupérer les paramètres de requête (filtrage)
    const { searchParams } = new URL(req.url)
    const completed = searchParams.get('completed') === 'true'
    const projectId = searchParams.get('projectId')
    const scheduled = searchParams.get('scheduled') === 'true'
    
    // Construire les filtres
    const filters: any = { userId }
    
    if (completed !== undefined) {
      filters.completed = completed
    }
    
    if (projectId) {
      filters.projectId = projectId
    }
    
    if (scheduled) {
      filters.scheduledFor = { not: null }
    }
    
    // Récupérer toutes les tâches correspondantes
    const tasks = await prisma.task.findMany({
      where: filters,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })
    
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des tâches' },
      { status: 500 }
    )
  }
}

// Créer une nouvelle tâche via un agent IA
export async function POST(req: NextRequest) {
  // Vérifier l'authentification API
  const authResponse = await apiAuth(req, {
    requiredScopes: ['tasks:write']
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
    const { title, description, projectId, dueDate, priority, energyLevel, scheduledFor } = await req.json()
    
    // Validation
    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Titre requis' }, { status: 400 })
    }
    
    // Vérifier que le projet appartient à l'utilisateur (si fourni)
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId }
      })
      
      if (!project) {
        return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 })
      }
    }
    
    // Créer la nouvelle tâche
    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        userId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        priority,
        energyLevel,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined
      }
    })
    
    return NextResponse.json(task)
  } catch (error) {
    console.error('Erreur lors de la création de la tâche:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la tâche' },
      { status: 500 }
    )
  }
} 