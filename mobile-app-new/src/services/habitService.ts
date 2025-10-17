import { apiService } from './api';
import { Habit, HabitEntry, CreateHabitData } from '../types';

export class HabitService {
  private basePath = '/habits';

  async getHabits(filters?: {
    category?: string;
    isActive?: boolean;
    frequency?: Habit['frequency'];
  }): Promise<Habit[]> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `${this.basePath}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<Habit[]>(endpoint);
  }

  async getHabitById(id: string): Promise<Habit> {
    return apiService.get<Habit>(`${this.basePath}/${id}`);
  }

  async createHabit(data: CreateHabitData): Promise<Habit> {
    return apiService.post<Habit>(this.basePath, data);
  }

  async updateHabit(id: string, data: Partial<CreateHabitData>): Promise<Habit> {
    return apiService.put<Habit>(`${this.basePath}/${id}`, data);
  }

  async deleteHabit(id: string): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`${this.basePath}/${id}`);
  }

  async toggleHabitStatus(id: string): Promise<Habit> {
    return apiService.put<Habit>(`${this.basePath}/${id}/toggle`);
  }

  // Gestion des entrées d'habitudes
  async getHabitEntries(habitId: string, filters?: {
    startDate?: string;
    endDate?: string;
    completed?: boolean;
  }): Promise<HabitEntry[]> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `${this.basePath}/${habitId}/entries${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<HabitEntry[]>(endpoint);
  }

  async createHabitEntry(habitId: string, data: {
    date: string;
    value: number;
    notes?: string;
  }): Promise<HabitEntry> {
    return apiService.post<HabitEntry>(`${this.basePath}/${habitId}/entries`, data);
  }

  async updateHabitEntry(habitId: string, entryId: string, data: {
    value?: number;
    notes?: string;
    completed?: boolean;
  }): Promise<HabitEntry> {
    return apiService.put<HabitEntry>(`${this.basePath}/${habitId}/entries/${entryId}`, data);
  }

  async deleteHabitEntry(habitId: string, entryId: string): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`${this.basePath}/${habitId}/entries/${entryId}`);
  }

  async markHabitComplete(habitId: string, date: string, value?: number): Promise<HabitEntry> {
    return apiService.post<HabitEntry>(`${this.basePath}/${habitId}/complete`, { date, value });
  }

  async markHabitIncomplete(habitId: string, date: string): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`${this.basePath}/${habitId}/complete?date=${date}`);
  }

  // Statistiques et analyses
  async getHabitStats(habitId: string): Promise<{
    streak: number;
    longestStreak: number;
    completionRate: number;
    totalEntries: number;
    averageValue: number;
    weeklyProgress: Array<{ date: string; completed: boolean; value: number }>;
    monthlyProgress: Array<{ date: string; completed: boolean; value: number }>;
  }> {
    return apiService.get<{
      streak: number;
      longestStreak: number;
      completionRate: number;
      totalEntries: number;
      averageValue: number;
      weeklyProgress: Array<{ date: string; completed: boolean; value: number }>;
      monthlyProgress: Array<{ date: string; completed: boolean; value: number }>;
    }>(`${this.basePath}/${habitId}/stats`);
  }

  async getOverallHabitStats(): Promise<{
    totalHabits: number;
    activeHabits: number;
    completedToday: number;
    averageStreak: number;
    bestStreak: number;
    totalCompletedThisWeek: number;
    totalCompletedThisMonth: number;
    habitsByCategory: Array<{ category: string; count: number }>;
  }> {
    return apiService.get<{
      totalHabits: number;
      activeHabits: number;
      completedToday: number;
      averageStreak: number;
      bestStreak: number;
      totalCompletedThisWeek: number;
      totalCompletedThisMonth: number;
      habitsByCategory: Array<{ category: string; count: number }>;
    }>(`${this.basePath}/stats`);
  }

  async getTodaysHabits(): Promise<Array<Habit & { todayEntry?: HabitEntry; isCompletedToday: boolean }>> {
    return apiService.get<Array<Habit & { todayEntry?: HabitEntry; isCompletedToday: boolean }>>(`${this.basePath}/today`);
  }

  async getHabitCalendar(habitId: string, month: string, year: string): Promise<Array<{
    date: string;
    completed: boolean;
    value: number;
    notes?: string;
  }>> {
    return apiService.get<Array<{
      date: string;
      completed: boolean;
      value: number;
      notes?: string;
    }>>(`${this.basePath}/${habitId}/calendar?month=${month}&year=${year}`);
  }

  async getHabitCategories(): Promise<string[]> {
    return apiService.get<string[]>(`${this.basePath}/categories`);
  }

  async duplicateHabit(id: string, newName: string): Promise<Habit> {
    return apiService.post<Habit>(`${this.basePath}/${id}/duplicate`, { name: newName });
  }

  async getHabitInsights(habitId: string): Promise<{
    bestDayOfWeek: string;
    bestTimeOfDay: string;
    averageValueTrend: 'increasing' | 'decreasing' | 'stable';
    recommendations: string[];
    consistencyScore: number;
  }> {
    return apiService.get<{
      bestDayOfWeek: string;
      bestTimeOfDay: string;
      averageValueTrend: 'increasing' | 'decreasing' | 'stable';
      recommendations: string[];
      consistencyScore: number;
    }>(`${this.basePath}/${habitId}/insights`);
  }

  async exportHabitData(habitId: string, format: 'csv' | 'json'): Promise<Blob> {
    const API_BASE_URL = 'https://www.productif.io/api';
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${this.basePath}/${habitId}/export?format=${format}`, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de l\'export');
    }
    
    return response.blob();
  }
}

export const habitService = new HabitService(); 