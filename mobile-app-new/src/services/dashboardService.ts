import { apiService } from './api';
import { DashboardStats, Analytics } from '../types';

export class DashboardService {
  private basePath = '/dashboard';

  async getDashboardStats(): Promise<DashboardStats> {
    return apiService.get<DashboardStats>(`${this.basePath}/stats`);
  }

  async getAnalytics(period: 'week' | 'month' | 'quarter' | 'year' = 'week'): Promise<Analytics> {
    return apiService.get<Analytics>(`${this.basePath}/analytics?period=${period}`);
  }

  async getProductivityScore(): Promise<{
    score: number;
    factors: Array<{
      name: string;
      score: number;
      impact: 'positive' | 'negative' | 'neutral';
      description: string;
    }>;
    recommendations: string[];
    trend: 'up' | 'down' | 'stable';
  }> {
    return apiService.get<{
      score: number;
      factors: Array<{
        name: string;
        score: number;
        impact: 'positive' | 'negative' | 'neutral';
        description: string;
      }>;
      recommendations: string[];
      trend: 'up' | 'down' | 'stable';
    }>(`${this.basePath}/productivity`);
  }

  async getRecentActivity(): Promise<Array<{
    id: string;
    type: 'task_completed' | 'habit_completed' | 'time_tracked' | 'project_created' | 'achievement_unlocked';
    title: string;
    description: string;
    timestamp: string;
    metadata?: any;
  }>> {
    return apiService.get<Array<{
      id: string;
      type: 'task_completed' | 'habit_completed' | 'time_tracked' | 'project_created' | 'achievement_unlocked';
      title: string;
      description: string;
      timestamp: string;
      metadata?: any;
    }>>(`${this.basePath}/activity`);
  }

  async getUpcomingDeadlines(): Promise<Array<{
    id: string;
    title: string;
    type: 'task' | 'objective' | 'project';
    dueDate: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status: string;
    daysUntilDue: number;
  }>> {
    return apiService.get<Array<{
      id: string;
      title: string;
      type: 'task' | 'objective' | 'project';
      dueDate: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      status: string;
      daysUntilDue: number;
    }>>(`${this.basePath}/deadlines`);
  }

  async getTodayGoals(): Promise<{
    tasks: {
      completed: number;
      total: number;
      goal: number;
    };
    habits: {
      completed: number;
      total: number;
      goal: number;
    };
    timeTracking: {
      current: number;
      goal: number;
    };
    focusTime: {
      current: number;
      goal: number;
    };
  }> {
    return apiService.get<{
      tasks: {
        completed: number;
        total: number;
        goal: number;
      };
      habits: {
        completed: number;
        total: number;
        goal: number;
      };
      timeTracking: {
        current: number;
        goal: number;
      };
      focusTime: {
        current: number;
        goal: number;
      };
    }>(`${this.basePath}/today-goals`);
  }

  async getWeeklyProgress(): Promise<{
    tasksCompleted: Array<{ date: string; count: number }>;
    habitsCompleted: Array<{ date: string; count: number }>;
    timeTracked: Array<{ date: string; time: number }>;
    productivityScore: Array<{ date: string; score: number }>;
    weekStart: string;
    weekEnd: string;
  }> {
    return apiService.get<{
      tasksCompleted: Array<{ date: string; count: number }>;
      habitsCompleted: Array<{ date: string; count: number }>;
      timeTracked: Array<{ date: string; time: number }>;
      productivityScore: Array<{ date: string; score: number }>;
      weekStart: string;
      weekEnd: string;
    }>(`${this.basePath}/weekly-progress`);
  }

  async getQuickStats(): Promise<{
    completedTasksToday: number;
    completedHabitsToday: number;
    timeTrackedToday: number;
    currentStreak: number;
    weeklyProgress: number;
    monthlyProgress: number;
  }> {
    return apiService.get<{
      completedTasksToday: number;
      completedHabitsToday: number;
      timeTrackedToday: number;
      currentStreak: number;
      weeklyProgress: number;
      monthlyProgress: number;
    }>(`${this.basePath}/quick-stats`);
  }

  async getMotivationalInsights(): Promise<{
    streaks: Array<{
      type: 'task' | 'habit' | 'time';
      name: string;
      current: number;
      best: number;
    }>;
    achievements: Array<{
      id: string;
      name: string;
      description: string;
      progress: number;
      maxProgress: number;
      isClose: boolean;
    }>;
    milestones: Array<{
      name: string;
      achieved: boolean;
      achievedAt?: string;
      progress: number;
      target: number;
    }>;
  }> {
    return apiService.get<{
      streaks: Array<{
        type: 'task' | 'habit' | 'time';
        name: string;
        current: number;
        best: number;
      }>;
      achievements: Array<{
        id: string;
        name: string;
        description: string;
        progress: number;
        maxProgress: number;
        isClose: boolean;
      }>;
      milestones: Array<{
        name: string;
        achieved: boolean;
        achievedAt?: string;
        progress: number;
        target: number;
      }>;
    }>(`${this.basePath}/motivation`);
  }

  async getFocusMetrics(): Promise<{
    focusScore: number;
    deepWorkSessions: number;
    averageSessionLength: number;
    distractionCount: number;
    bestFocusTime: string;
    weeklyFocusTrend: Array<{ date: string; score: number }>;
  }> {
    return apiService.get<{
      focusScore: number;
      deepWorkSessions: number;
      averageSessionLength: number;
      distractionCount: number;
      bestFocusTime: string;
      weeklyFocusTrend: Array<{ date: string; score: number }>;
    }>(`${this.basePath}/focus`);
  }

  async getPersonalizedRecommendations(): Promise<Array<{
    id: string;
    type: 'habit' | 'productivity' | 'time_management' | 'goal_setting';
    title: string;
    description: string;
    actionText: string;
    priority: 'high' | 'medium' | 'low';
    basedOn: string[];
  }>> {
    return apiService.get<Array<{
      id: string;
      type: 'habit' | 'productivity' | 'time_management' | 'goal_setting';
      title: string;
      description: string;
      actionText: string;
      priority: 'high' | 'medium' | 'low';
      basedOn: string[];
    }>>(`${this.basePath}/recommendations`);
  }

  async markRecommendationAsRead(id: string): Promise<{ success: boolean }> {
    return apiService.put<{ success: boolean }>(`${this.basePath}/recommendations/${id}/read`);
  }

  async dismissRecommendation(id: string): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`${this.basePath}/recommendations/${id}`);
  }

  async refreshDashboard(): Promise<{ success: boolean; timestamp: string }> {
    return apiService.post<{ success: boolean; timestamp: string }>(`${this.basePath}/refresh`);
  }
}

export const dashboardService = new DashboardService(); 