import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiAuth } from '@/middleware/api-auth'

// GET /api/processes/agent - Récupérer tous les processus via token API
export async function GET(req: NextRequest) {
  // Vérifier l'authentification API
  const authResponse = await apiAuth(req, {
    requiredScopes: ['processes:read']
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
    // Récupérer les paramètres de requête (filtrage optionnel)
    const { searchParams } = new URL(req.url)
    const includeStats = searchParams.get('includeStats') === 'true'
    const includeTasks = searchParams.get('includeTasks') === 'true'
    
    // Configuration de base pour la requête
    const queryConfig: any = {
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    }
    
    // Ajouter les inclusions selon les paramètres
    if (includeStats || includeTasks) {
      queryConfig.include = {}
      
      if (includeStats) {
        queryConfig.include._count = {
          select: { tasks: true }
        }
      }
      
      if (includeTasks) {
        queryConfig.include.tasks = {
          orderBy: {
            createdAt: "desc"
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
                color: true
              }
            }
          }
        }
      }
    }
    
    const processes = await prisma.process.findMany(queryConfig)
    
    // Si includeStats est demandé, calculer des statistiques supplémentaires
    if (includeStats && !includeTasks) {
      const processesWithStats = await Promise.all(
        processes.map(async (process) => {
          const completedTasksCount = await prisma.task.count({
            where: {
              processId: process.id,
              completed: true
            }
          })
          
          const totalTasks = (process as any)._count?.tasks || 0
          const completionPercentage = totalTasks > 0 
            ? Math.round((completedTasksCount / totalTasks) * 100) 
            : 0
          
          return {
            ...process,
            stats: {
              totalTasks,
              completedTasks: completedTasksCount,
              completionPercentage
            }
          }
        })
      )
      
      return NextResponse.json(processesWithStats)
    }
    
    return NextResponse.json(processes)
  } catch (error) {
    console.error('Erreur lors de la récupération des processus:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des processus' },
      { status: 500 }
    )
  }
}

// POST /api/processes/agent - Créer un nouveau processus via token API
export async function POST(req: NextRequest) {
  // Vérifier l'authentification API
  const authResponse = await apiAuth(req, {
    requiredScopes: ['processes:write']
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
    const { name, description } = await req.json()
    
    // Validation
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Le nom du processus est requis' }, { status: 400 })
    }
    
    if (!description || description.trim() === '') {
      return NextResponse.json({ error: 'La description du processus est requise' }, { status: 400 })
    }
    
    // Créer le nouveau processus
    const process = await prisma.process.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        userId: userId,
      },
    })
    
    return NextResponse.json(process)
  } catch (error) {
    console.error('Erreur lors de la création du processus:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du processus' },
      { status: 500 }
    )
  }
}

// PATCH /api/processes/agent - Mettre à jour un processus via token API
export async function PATCH(req: NextRequest) {
  // Vérifier l'authentification API
  const authResponse = await apiAuth(req, {
    requiredScopes: ['processes:write']
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
    const { id, name, description } = await req.json()
    
    // Validation
    if (!id) {
      return NextResponse.json({ error: 'L\'ID du processus est requis' }, { status: 400 })
    }
    
    // Vérifier que le processus appartient à l'utilisateur
    const existingProcess = await prisma.process.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    })
    
    if (!existingProcess) {
      return NextResponse.json(
        { error: 'Processus non trouvé ou n\'appartenant pas à l\'utilisateur' },
        { status: 404 }
      )
    }
    
    // Préparer les données de mise à jour
    const updateData: any = {}
    if (name !== undefined) {
      if (!name || name.trim() === '') {
        return NextResponse.json({ error: 'Le nom du processus ne peut pas être vide' }, { status: 400 })
      }
      updateData.name = name.trim()
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || ''
    }
    
    // Mettre à jour le processus
    const updatedProcess = await prisma.process.update({
      where: { id },
      data: updateData,
    })
    
    return NextResponse.json(updatedProcess)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du processus:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du processus' },
      { status: 500 }
    )
  }
}

// DELETE /api/processes/agent - Supprimer un processus via token API
export async function DELETE(req: NextRequest) {
  // Vérifier l'authentification API
  const authResponse = await apiAuth(req, {
    requiredScopes: ['processes:write']
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
    const { id } = await req.json()
    
    // Validation
    if (!id) {
      return NextResponse.json({ error: 'L\'ID du processus est requis' }, { status: 400 })
    }
    
    // Vérifier que le processus appartient à l'utilisateur
    const existingProcess = await prisma.process.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    })
    
    if (!existingProcess) {
      return NextResponse.json(
        { error: 'Processus non trouvé ou n\'appartenant pas à l\'utilisateur' },
        { status: 404 }
      )
    }
    
    // Dissocier le processus de toutes les tâches associées
    await prisma.task.updateMany({
      where: { processId: id },
      data: { processId: null }
    })
    
    // Supprimer le processus
    await prisma.process.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true, message: 'Processus supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression du processus:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du processus' },
      { status: 500 }
    )
  }
} 