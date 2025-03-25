import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Extract the authorization token from headers
    const authHeader = req.headers.get('authorization');
    
    // Verify authentication if a token is provided
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = await verifyToken(token);
        if (!payload) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      } catch (error) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    // Parse the webhook payload
    const webhookData = await req.json();
    console.log('Objective webhook received:', webhookData);

    // Process the webhook based on the action type
    const { action, data } = webhookData;

    if (action === 'create_mission') {
      // Create a new mission (OKR period)
      const { title, quarter, year, userId, target } = data;
      
      if (!title || !quarter || !year || !userId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      
      const newMission = await prisma.mission.create({
        data: {
          title,
          quarter: parseInt(quarter),
          year: parseInt(year),
          userId,
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
      
      const objective = await prisma.objective.findUnique({
        where: { id }
      });
      
      if (!objective) {
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