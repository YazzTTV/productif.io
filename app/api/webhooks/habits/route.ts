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
    console.log('Habit webhook received:', webhookData);

    // Process the webhook based on the action type
    const { action, data } = webhookData;

    if (action === 'create_habit') {
      // Create a new habit
      const { name, description, frequency, daysOfWeek, userId, color } = data;
      
      if (!name || !frequency || !userId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      
      const newHabit = await prisma.habit.create({
        data: {
          name,
          description,
          frequency,
          daysOfWeek: daysOfWeek || [],
          userId,
          color
        }
      });
      
      return NextResponse.json({ success: true, habit: newHabit });
    } 
    else if (action === 'log_habit_entry') {
      // Log a habit entry for a specific day
      const { habitId, date, completed, note, rating } = data;
      
      if (!habitId || !date) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      
      // Check if an entry already exists for this date
      const existingEntry = await prisma.habitEntry.findFirst({
        where: {
          habitId,
          date: new Date(date)
        }
      });
      
      let habitEntry;
      
      if (existingEntry) {
        // Update existing entry
        habitEntry = await prisma.habitEntry.update({
          where: { id: existingEntry.id },
          data: {
            completed: completed !== undefined ? completed : existingEntry.completed,
            note: note !== undefined ? note : existingEntry.note,
            rating: rating !== undefined ? parseInt(rating) : existingEntry.rating
          }
        });
      } else {
        // Create new entry
        habitEntry = await prisma.habitEntry.create({
          data: {
            habitId,
            date: new Date(date),
            completed: completed || false,
            note,
            rating: rating ? parseInt(rating) : null
          }
        });
      }
      
      return NextResponse.json({ success: true, habitEntry });
    }
    else if (action === 'get_habit_stats') {
      // Get habit statistics for a user
      const { userId, startDate, endDate } = data;
      
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
      }
      
      const dateFilter: any = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }
      
      // Get all habits for the user
      const habits = await prisma.habit.findMany({
        where: { userId },
        include: {
          entries: {
            where: {
              date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
            }
          }
        }
      });
      
      // Calculate completion rates
      const habitStats = habits.map(habit => {
        const totalEntries = habit.entries.length;
        const completedEntries = habit.entries.filter(e => e.completed).length;
        const completionRate = totalEntries > 0 ? (completedEntries / totalEntries) * 100 : 0;
        
        return {
          id: habit.id,
          name: habit.name,
          totalEntries,
          completedEntries,
          completionRate: Math.round(completionRate * 100) / 100, // Round to 2 decimal places
          averageRating: habit.entries.reduce((sum, entry) => sum + (entry.rating || 0), 0) / 
                        (habit.entries.filter(e => e.rating !== null).length || 1)
        };
      });
      
      return NextResponse.json({ success: true, habitStats });
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
    message: 'Habits webhook endpoint is ready to receive requests',
    supportedActions: ['create_habit', 'log_habit_entry', 'get_habit_stats']
  });
} 