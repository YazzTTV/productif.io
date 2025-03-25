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
    console.log('Webhook received:', webhookData);

    // Process the webhook based on the action type
    const { action, data } = webhookData;

    if (action === 'create_task') {
      // Create a new task
      const { title, description, userId, projectId, dueDate } = data;
      
      if (!title || !userId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      
      const newTask = await prisma.task.create({
        data: {
          title,
          description,
          userId,
          projectId,
          dueDate: dueDate ? new Date(dueDate) : undefined,
        }
      });
      
      return NextResponse.json({ success: true, task: newTask });
    } 
    else if (action === 'update_task') {
      // Update an existing task
      const { id, ...updateData } = data;
      
      if (!id) {
        return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
      }
      
      // Process dates if present
      if (updateData.dueDate) {
        updateData.dueDate = new Date(updateData.dueDate);
      }
      
      const updatedTask = await prisma.task.update({
        where: { id },
        data: updateData
      });
      
      return NextResponse.json({ success: true, task: updatedTask });
    }
    else if (action === 'complete_task') {
      // Mark a task as completed
      const { id } = data;
      
      if (!id) {
        return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
      }
      
      const completedTask = await prisma.task.update({
        where: { id },
        data: { completed: true }
      });
      
      return NextResponse.json({ success: true, task: completedTask });
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
    message: 'Webhook endpoint is ready to receive requests',
    supportedActions: ['create_task', 'update_task', 'complete_task']
  });
} 