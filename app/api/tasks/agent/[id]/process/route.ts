import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiAuth } from '@/middleware/api-auth'

// PATCH /api/tasks/agent/[id]/process - Assigner ou retirer un processus d'une tâche via token API
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Vérifier l'authentification API
  const authResponse = await apiAuth(req, {
    requiredScopes: ['tasks:write', 'processes:read']
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
  
  const { id } = params
  
  try {
    const { processId } = await req.json()
    
    // Vérifier que la tâche existe et appartient à l'utilisateur
    const task = await prisma.task.findFirst({
      where: {
        id: id,
        userId: userId
      }
    })
    
    if (!task) {
      return NextResponse.json(
        { error: 'Tâche non trouvée ou n\'appartenant pas à l\'utilisateur' },
        { status: 404 }
      )
    }
    
    // Si processId est fourni (non null), vérifier qu'il existe et appartient à l'utilisateur
    if (processId !== null && processId !== undefined) {
      const process = await prisma.process.findFirst({
        where: {
          id: processId,
          userId: userId
        }
      })
      
      if (!process) {
        return NextResponse.json(
          { error: 'Processus non trouvé ou n\'appartenant pas à l\'utilisateur' },
          { status: 404 }
        )
      }
    }
    
    // Mettre à jour la tâche avec le nouveau processus (ou null pour le retirer)
    const updatedTask = await prisma.task.update({
      where: { id },
      data: { 
        processId: processId || null,
        updatedAt: new Date()
      },
      include: {
        process: true,
        project: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: processId 
        ? `Processus assigné à la tâche avec succès` 
        : `Processus retiré de la tâche avec succès`
    })
  } catch (error) {
    console.error('Erreur lors de l\'assignation du processus à la tâche:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'assignation du processus à la tâche' },
      { status: 500 }
    )
  }
}

// GET /api/tasks/agent/[id]/process - Récupérer le processus assigné à une tâche
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Vérifier l'authentification API
  const authResponse = await apiAuth(req, {
    requiredScopes: ['tasks:read', 'processes:read']
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
  
  const { id } = params
  
  try {
    // Récupérer la tâche avec son processus
    const task = await prisma.task.findFirst({
      where: {
        id: id,
        userId: userId
      },
      include: {
        process: true,
        project: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    })
    
    if (!task) {
      return NextResponse.json(
        { error: 'Tâche non trouvée ou n\'appartenant pas à l\'utilisateur' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      taskId: task.id,
      taskTitle: task.title,
      process: task.process,
      hasProcess: !!task.process
    })
  } catch (error) {
    console.error('Erreur lors de la récupération du processus de la tâche:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du processus de la tâche' },
      { status: 500 }
    )
  }
} 