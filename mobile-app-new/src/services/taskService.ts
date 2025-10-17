import { apiService } from './api';
import { Task, CreateTaskData, UpdateTaskData } from '../types';

export class TaskService {
  private basePath = '/tasks';

  async getTasks(filters?: {
    status?: Task['status'];
    priority?: Task['priority'];
    projectId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tasks: Task[]; total: number; page: number; limit: number }> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `${this.basePath}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<{ tasks: Task[]; total: number; page: number; limit: number }>(endpoint);
  }

  async getTaskById(id: string): Promise<Task> {
    return apiService.get<Task>(`${this.basePath}/${id}`);
  }

  async createTask(data: CreateTaskData): Promise<Task> {
    return apiService.post<Task>(this.basePath, data);
  }

  async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    return apiService.put<Task>(`${this.basePath}/${id}`, data);
  }

  async deleteTask(id: string): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`${this.basePath}/${id}`);
  }

  async completeTask(id: string): Promise<Task> {
    return apiService.put<Task>(`${this.basePath}/${id}/complete`);
  }

  async startTask(id: string): Promise<Task> {
    return apiService.put<Task>(`${this.basePath}/${id}/start`);
  }

  async pauseTask(id: string): Promise<Task> {
    return apiService.put<Task>(`${this.basePath}/${id}/pause`);
  }

  async duplicateTask(id: string): Promise<Task> {
    return apiService.post<Task>(`${this.basePath}/${id}/duplicate`);
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    return apiService.get<Task[]>(`/projects/${projectId}/tasks`);
  }

  async getTasksStats(): Promise<{
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    overdue: number;
  }> {
    return apiService.get<{
      total: number;
      completed: number;
      pending: number;
      inProgress: number;
      overdue: number;
    }>(`${this.basePath}/stats`);
  }

  async getTasksForToday(): Promise<Task[]> {
    return apiService.get<Task[]>(`${this.basePath}/today`);
  }

  async getOverdueTasks(): Promise<Task[]> {
    return apiService.get<Task[]>(`${this.basePath}/overdue`);
  }

  async getUpcomingTasks(days: number = 7): Promise<Task[]> {
    return apiService.get<Task[]>(`${this.basePath}/upcoming?days=${days}`);
  }

  async addTaskComment(id: string, comment: string): Promise<{ success: boolean }> {
    return apiService.post<{ success: boolean }>(`${this.basePath}/${id}/comments`, { comment });
  }

  async addTaskTag(id: string, tag: string): Promise<Task> {
    return apiService.post<Task>(`${this.basePath}/${id}/tags`, { tag });
  }

  async removeTaskTag(id: string, tag: string): Promise<Task> {
    return apiService.delete<Task>(`${this.basePath}/${id}/tags/${encodeURIComponent(tag)}`);
  }

  async assignTaskToProject(id: string, projectId: string): Promise<Task> {
    return apiService.put<Task>(`${this.basePath}/${id}/project`, { projectId });
  }

  async bulkUpdateTasks(taskIds: string[], updates: Partial<UpdateTaskData>): Promise<{ updated: number }> {
    return apiService.put<{ updated: number }>(`${this.basePath}/bulk`, { taskIds, updates });
  }

  async bulkDeleteTasks(taskIds: string[]): Promise<{ deleted: number }> {
    return apiService.delete<{ deleted: number }>(`${this.basePath}/bulk?ids=${taskIds.join(',')}`);
  }
}

export const taskService = new TaskService(); 