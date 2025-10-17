import { apiService } from './api';
import { TimeEntry, CreateTimeEntryData } from '../types';

export class TimeService {
  private basePath = '/time-entries';

  async getTimeEntries(filters?: {
    startDate?: string;
    endDate?: string;
    projectId?: string;
    taskId?: string;
    isRunning?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ entries: TimeEntry[]; total: number; page: number; limit: number }> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `${this.basePath}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<{ entries: TimeEntry[]; total: number; page: number; limit: number }>(endpoint);
  }

  async getTimeEntryById(id: string): Promise<TimeEntry> {
    return apiService.get<TimeEntry>(`${this.basePath}/${id}`);
  }

  async createTimeEntry(data: CreateTimeEntryData): Promise<TimeEntry> {
    return apiService.post<TimeEntry>(this.basePath, data);
  }

  async updateTimeEntry(id: string, data: Partial<CreateTimeEntryData & { duration: number }>): Promise<TimeEntry> {
    return apiService.put<TimeEntry>(`${this.basePath}/${id}`, data);
  }

  async deleteTimeEntry(id: string): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`${this.basePath}/${id}`);
  }

  // Gestion du minuteur
  async startTimer(data?: CreateTimeEntryData): Promise<TimeEntry> {
    return apiService.post<TimeEntry>('/timer/start', data);
  }

  async stopTimer(): Promise<TimeEntry> {
    return apiService.post<TimeEntry>('/timer/stop');
  }

  async pauseTimer(): Promise<TimeEntry> {
    return apiService.post<TimeEntry>('/timer/pause');
  }

  async resumeTimer(): Promise<TimeEntry> {
    return apiService.post<TimeEntry>('/timer/resume');
  }

  async getCurrentTimer(): Promise<TimeEntry | null> {
    try {
      return await apiService.get<TimeEntry>('/timer/current');
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async updateCurrentTimer(data: { description?: string; taskId?: string; projectId?: string }): Promise<TimeEntry> {
    return apiService.put<TimeEntry>('/timer/current', data);
  }

  // Statistiques et rapports
  async getTimeStats(period: 'today' | 'week' | 'month' | 'year' = 'week'): Promise<{
    totalTime: number;
    byProject: Array<{ projectId: string; projectName: string; time: number; color: string }>;
    byTask: Array<{ taskId: string; taskTitle: string; time: number }>;
    byDay: Array<{ date: string; time: number }>;
  }> {
    return apiService.get<{
      totalTime: number;
      byProject: Array<{ projectId: string; projectName: string; time: number; color: string }>;
      byTask: Array<{ taskId: string; taskTitle: string; time: number }>;
      byDay: Array<{ date: string; time: number }>;
    }>(`${this.basePath}/stats?period=${period}`);
  }

  async getWeeklyReport(): Promise<{
    weekStart: string;
    weekEnd: string;
    totalTime: number;
    dailyBreakdown: Array<{ date: string; time: number; entries: number }>;
    topProjects: Array<{ projectId: string; projectName: string; time: number; percentage: number }>;
    completedTasks: number;
  }> {
    return apiService.get<{
      weekStart: string;
      weekEnd: string;
      totalTime: number;
      dailyBreakdown: Array<{ date: string; time: number; entries: number }>;
      topProjects: Array<{ projectId: string; projectName: string; time: number; percentage: number }>;
      completedTasks: number;
    }>(`${this.basePath}/reports/weekly`);
  }

  async getMonthlyReport(month?: string, year?: string): Promise<{
    month: string;
    year: string;
    totalTime: number;
    averagePerDay: number;
    workingDays: number;
    projectBreakdown: Array<{ projectId: string; projectName: string; time: number; percentage: number }>;
    weeklyBreakdown: Array<{ week: number; time: number }>;
  }> {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    
    return apiService.get<{
      month: string;
      year: string;
      totalTime: number;
      averagePerDay: number;
      workingDays: number;
      projectBreakdown: Array<{ projectId: string; projectName: string; time: number; percentage: number }>;
      weeklyBreakdown: Array<{ week: number; time: number }>;
    }>(`${this.basePath}/reports/monthly?${params.toString()}`);
  }

  async getProductivityInsights(): Promise<{
    mostProductiveHour: number;
    averageSessionDuration: number;
    longestSession: number;
    totalSessions: number;
    focusScore: number;
    recommendations: string[];
  }> {
    return apiService.get<{
      mostProductiveHour: number;
      averageSessionDuration: number;
      longestSession: number;
      totalSessions: number;
      focusScore: number;
      recommendations: string[];
    }>(`${this.basePath}/insights`);
  }

  // Export et synchronisation
  async exportTimeEntries(format: 'csv' | 'json' | 'pdf', filters?: {
    startDate?: string;
    endDate?: string;
    projectId?: string;
  }): Promise<Blob> {
    const params = new URLSearchParams({ format });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value);
        }
      });
    }

    const API_BASE_URL = 'https://www.productif.io/api';
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${this.basePath}/export?${params.toString()}`, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de l\'export');
    }
    
    return response.blob();
  }

  async getTodayTime(): Promise<{ totalTime: number; entries: TimeEntry[] }> {
    return apiService.get<{ totalTime: number; entries: TimeEntry[] }>(`${this.basePath}/today`);
  }

  async getRecentEntries(limit: number = 10): Promise<TimeEntry[]> {
    return apiService.get<TimeEntry[]>(`${this.basePath}/recent?limit=${limit}`);
  }

  async duplicateTimeEntry(id: string): Promise<TimeEntry> {
    return apiService.post<TimeEntry>(`${this.basePath}/${id}/duplicate`);
  }

  async bulkDeleteTimeEntries(entryIds: string[]): Promise<{ deleted: number }> {
    return apiService.delete<{ deleted: number }>(`${this.basePath}/bulk?ids=${entryIds.join(',')}`);
  }

  async getTimeGoals(): Promise<{
    dailyGoal: number;
    weeklyGoal: number;
    monthlyGoal: number;
    currentDaily: number;
    currentWeekly: number;
    currentMonthly: number;
  }> {
    return apiService.get<{
      dailyGoal: number;
      weeklyGoal: number;
      monthlyGoal: number;
      currentDaily: number;
      currentWeekly: number;
      currentMonthly: number;
    }>('/time-info');
  }

  async updateTimeGoals(goals: {
    dailyGoal?: number;
    weeklyGoal?: number;
    monthlyGoal?: number;
  }): Promise<{ success: boolean }> {
    return apiService.put<{ success: boolean }>('/time-info', goals);
  }
}

export const timeService = new TimeService(); 