import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Authentification OBLIGATOIRE, userId issu du jeton et jamais du corps, et
    // vérification de propriété sur chaque écriture. Voir la note du webhook
    // habits pour le détail de la faille corrigée.
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const authUserId = payload.userId;

    // Parse the webhook payload
    const webhookData = await req.json();

    // Process the webhook based on the action type
    const { action, data } = webhookData;

    if (action === 'create_mission') {
      // Create a new mission (OKR period)
      const { title, quarter, year, target } = data;

      if (!title || !quarter || !year) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const newMission = await prisma.mission.create({
        data: {
          title,
          quarter: parseInt(quarter),
          year: parseInt(year),
          userId: authUserId,
          target: target ? parseFloat(target) : 100
        }
      });

      return NextResponse.json({ success: true, mission: newMission });
    }
    else if (action === 'create_objective') {
      // Create a new objective for a mission
      const { title, missionId, target } = data;

      if (!title || !missionId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // La mission cible doit appartenir à l'appelant.
      const mission = await prisma.mission.findUnique({
        where: { id: missionId },
        select: { userId: true }
      });
      if (!mission || mission.userId !== authUserId) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      const newObjective = await prisma.objective.create({
        data: {
          title,
          missionId,
          target: target ? parseFloat(target) : 100
        }
      });

      return NextResponse.json({ success: true, objective: newObjective });
    }
    else if (action === 'update_objective_progress') {
      // Update the progress of an objective
      const { id, current } = data;

      if (!id || current === undefined) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // On charge la mission parente pour vérifier la propriété avant d'écrire.
      const objective = await prisma.objective.findUnique({
        where: { id },
        include: { mission: { select: { userId: true } } }
      });

      if (!objective || objective.mission?.userId !== authUserId) {
        return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
      }

      const currentValue = parseFloat(current);
      const progress = (currentValue / objective.target) * 100;
      
      const updatedObjective = await prisma.objective.update({
        where: { id },
        data: { 
          current: currentValue,
          progress
        }
      });
      
      // Also update the parent mission's progress
      const missionObjectives = await prisma.objective.findMany({
        where: { missionId: objective.missionId }
      });
      
      if (missionObjectives.length > 0) {
        const totalProgress = missionObjectives.reduce((sum, obj) => sum + obj.progress, 0);
        const avgProgress = totalProgress / missionObjectives.length;
        
        await prisma.mission.update({
          where: { id: objective.missionId },
          data: { progress: avgProgress }
        });
      }
      
      return NextResponse.json({ success: true, objective: updatedObjective });
    }
    
    // Default response for unknown actions
    return NextResponse.json({ message: 'Webhook received successfully' });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add a GET endpoint for testing
export async function GET() {
  return NextResponse.json({ 
    status: 'online',
    message: 'Objectives webhook endpoint is ready to receive requests',
    supportedActions: ['create_mission', 'create_objective', 'update_objective_progress']
  });
} 