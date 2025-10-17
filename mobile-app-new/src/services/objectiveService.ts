import { apiService } from './api';
import { Objective, Initiative, Action, CreateObjectiveData } from '../types';

export class ObjectiveService {
  private basePath = '/objectives';

  async getObjectives(filters?: {
    status?: Objective['status'];
    type?: Objective['type'];
    priority?: Objective['priority'];
    search?: string;
  }): Promise<Objective[]> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `${this.basePath}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<Objective[]>(endpoint);
  }

  async getObjectiveById(id: string): Promise<Objective> {
    return apiService.get<Objective>(`${this.basePath}/${id}`);
  }

  async createObjective(data: CreateObjectiveData): Promise<Objective> {
    return apiService.post<Objective>(this.basePath, data);
  }

  async updateObjective(id: string, data: Partial<CreateObjectiveData>): Promise<Objective> {
    return apiService.put<Objective>(`${this.basePath}/${id}`, data);
  }

  async deleteObjective(id: string): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`${this.basePath}/${id}`);
  }

  async updateObjectiveStatus(id: string, status: Objective['status']): Promise<Objective> {
    return apiService.put<Objective>(`${this.basePath}/${id}/status`, { status });
  }

  async updateObjectiveProgress(id: string, progress: number): Promise<Objective> {
    return apiService.put<Objective>(`${this.basePath}/${id}/progress`, { progress });
  }

  // Gestion des initiatives
  async getObjectiveInitiatives(objectiveId: string): Promise<Initiative[]> {
    return apiService.get<Initiative[]>(`${this.basePath}/${objectiveId}/initiatives`);
  }

  async createInitiative(objectiveId: string, data: {
    title: string;
    description?: string;
    dueDate?: string;
  }): Promise<Initiative> {
    return apiService.post<Initiative>(`${this.basePath}/${objectiveId}/initiatives`, data);
  }

  async updateInitiative(objectiveId: string, initiativeId: string, data: {
    title?: string;
    description?: string;
    status?: Initiative['status'];
    dueDate?: string;
  }): Promise<Initiative> {
    return apiService.put<Initiative>(`${this.basePath}/${objectiveId}/initiatives/${initiativeId}`, data);
  }

  async deleteInitiative(objectiveId: string, initiativeId: string): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`${this.basePath}/${objectiveId}/initiatives/${initiativeId}`);
  }

  // Gestion des actions
  async getInitiativeActions(objectiveId: string, initiativeId: string): Promise<Action[]> {
    return apiService.get<Action[]>(`${this.basePath}/${objectiveId}/initiatives/${initiativeId}/actions`);
  }

  async createAction(objectiveId: string, initiativeId: string, data: {
    title: string;
    description?: string;
    dueDate?: string;
  }): Promise<Action> {
    return apiService.post<Action>(`${this.basePath}/${objectiveId}/initiatives/${initiativeId}/actions`, data);
  }

  async updateAction(objectiveId: string, initiativeId: string, actionId: string, data: {
    title?: string;
    description?: string;
    status?: Action['status'];
    dueDate?: string;
  }): Promise<Action> {
    return apiService.put<Action>(`${this.basePath}/${objectiveId}/initiatives/${initiativeId}/actions/${actionId}`, data);
  }

  async deleteAction(objectiveId: string, initiativeId: string, actionId: string): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`${this.basePath}/${objectiveId}/initiatives/${initiativeId}/actions/${actionId}`);
  }

  // Statistiques et analyses
  async getObjectiveStats(): Promise<{
    total: number;
    active: number;
    completed: number;
    paused: number;
    cancelled: number;
    overdue: number;
    onTrack: number;
    behindSchedule: number;
    byType: Array<{ type: string; count: number }>;
    byPriority: Array<{ priority: string; count: number }>;
  }> {
    return apiService.get<{
      total: number;
      active: number;
      completed: number;
      paused: number;
      cancelled: number;
      overdue: number;
      onTrack: number;
      behindSchedule: number;
      byType: Array<{ type: string; count: number }>;
      byPriority: Array<{ priority: string; count: number }>;
    }>(`${this.basePath}/stats`);
  }

  async getObjectiveProgress(id: string): Promise<{
    currentProgress: number;
    targetProgress: number;
    isOnTrack: boolean;
    daysRemaining: number;
    completedInitiatives: number;
    totalInitiatives: number;
    completedActions: number;
    totalActions: number;
    milestones: Array<{
      title: string;
      targetDate: string;
      completed: boolean;
      completedDate?: string;
    }>;
  }> {
    return apiService.get<{
      currentProgress: number;
      targetProgress: number;
      isOnTrack: boolean;
      daysRemaining: number;
      completedInitiatives: number;
      totalInitiatives: number;
      completedActions: number;
      totalActions: number;
      milestones: Array<{
        title: string;
        targetDate: string;
        completed: boolean;
        completedDate?: string;
      }>;
    }>(`${this.basePath}/${id}/progress`);
  }

  async getActiveObjectives(): Promise<Objective[]> {
    return apiService.get<Objective[]>(`${this.basePath}/active`);
  }

  async getOverdueObjectives(): Promise<Objective[]> {
    return apiService.get<Objective[]>(`${this.basePath}/overdue`);
  }

  async getUpcomingDeadlines(): Promise<Array<{
    objectiveId: string;
    objectiveTitle: string;
    type: 'objective' | 'initiative' | 'action';
    itemId: string;
    itemTitle: string;
    dueDate: string;
    daysUntilDue: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>> {
    return apiService.get<Array<{
      objectiveId: string;
      objectiveTitle: string;
      type: 'objective' | 'initiative' | 'action';
      itemId: string;
      itemTitle: string;
      dueDate: string;
      daysUntilDue: number;
      priority: 'LOW' | 'MEDIUM' | 'HIGH';
    }>>(`${this.basePath}/deadlines`);
  }

  async duplicateObjective(id: string, newTitle: string): Promise<Objective> {
    return apiService.post<Objective>(`${this.basePath}/${id}/duplicate`, { title: newTitle });
  }

  async archiveObjective(id: string): Promise<Objective> {
    return apiService.put<Objective>(`${this.basePath}/${id}/archive`);
  }

  async unarchiveObjective(id: string): Promise<Objective> {
    return apiService.put<Objective>(`${this.basePath}/${id}/unarchive`);
  }

  async getObjectiveInsights(id: string): Promise<{
    completionTrend: 'ahead' | 'on_track' | 'behind' | 'at_risk';
    estimatedCompletionDate: string;
    recommendedActions: string[];
    blockers: Array<{
      type: 'initiative' | 'action';
      id: string;
      title: string;
      issue: string;
    }>;
    successFactors: string[];
  }> {
    return apiService.get<{
      completionTrend: 'ahead' | 'on_track' | 'behind' | 'at_risk';
      estimatedCompletionDate: string;
      recommendedActions: string[];
      blockers: Array<{
        type: 'initiative' | 'action';
        id: string;
        title: string;
        issue: string;
      }>;
      successFactors: string[];
    }>(`${this.basePath}/${id}/insights`);
  }
}

export const objectiveService = new ObjectiveService(); 