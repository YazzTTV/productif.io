import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiAuth } from '@/middleware/api-auth'
import { calculateTaskOrder } from '@/lib/tasks'

// Mettre à jour une tâche spécifique via un agent IA
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
  
  const { id } = params
  
  try {
    // Vérifier que la tâche existe et appartient à l'utilisateur
    const task = await prisma.task.findFirst({
      where: { id, userId }
    })
    
    if (!task) {
      return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 })
    }
    
    // Récupérer les données à mettre à jour
    const updateData = await req.json()
    
    // Traiter les dates si elles sont présentes
    if (updateData.dueDate !== undefined) {
      updateData.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null
    }
    
    if (updateData.scheduledFor !== undefined) {
      updateData.scheduledFor = updateData.scheduledFor ? new Date(updateData.scheduledFor) : null
    }
    
    // Traiter la priorité et le niveau d'énergie
    let order = task.order
    
    if (updateData.priority !== undefined || updateData.energyLevel !== undefined) {
      // Convertir les valeurs numériques en chaînes pour le calcul de l'ordre
      const priorityString = updateData.priority !== undefined 
        ? `P${updateData.priority}` 
        : task.priority !== null ? `P${task.priority}` : "P3";
      
      const energyLevels: Record<number, string> = {
        0: "Extrême",
        1: "Élevé",
        2: "Moyen",
        3: "Faible"
      };
      
      const newEnergyLevel = updateData.energyLevel !== undefined 
        ? updateData.energyLevel 
        : task.energyLevel;
      
      const energyString = newEnergyLevel !== null && typeof newEnergyLevel === 'number' && newEnergyLevel in energyLevels
        ? energyLevels[newEnergyLevel]
        : "Moyen";
      
      // Calculer le nouvel ordre
      order = calculateTaskOrder(priorityString, energyString);
      updateData.order = order;
    }
    
    // Mettre à jour la tâche
    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData
    })
    
    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la tâche:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la tâche' },
      { status: 500 }
    )
  }
}

// Supprimer une tâche spécifique via un agent IA
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
  
  const { id } = params
  
  try {
    // Vérifier que la tâche existe et appartient à l'utilisateur
    const task = await prisma.task.findFirst({
      where: { id, userId }
    })
    
    if (!task) {
      return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 })
    }
    
    // Supprimer la tâche
    await prisma.task.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la tâche' },
      { status: 500 }
    )
  }
} 