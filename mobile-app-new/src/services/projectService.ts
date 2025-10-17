import { apiService } from './api';
import { Project, CreateProjectData, Task } from '../types';

export class ProjectService {
  private basePath = '/projects';

  async getProjects(filters?: {
    search?: string;
    isArchived?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ projects: Project[]; total: number; page: number; limit: number }> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `${this.basePath}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<{ projects: Project[]; total: number; page: number; limit: number }>(endpoint);
  }

  async getProjectById(id: string): Promise<Project> {
    return apiService.get<Project>(`${this.basePath}/${id}`);
  }

  async createProject(data: CreateProjectData): Promise<Project> {
    return apiService.post<Project>(this.basePath, data);
  }

  async updateProject(id: string, data: Partial<CreateProjectData>): Promise<Project> {
    return apiService.put<Project>(`${this.basePath}/${id}`, data);
  }

  async deleteProject(id: string): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`${this.basePath}/${id}`);
  }

  async archiveProject(id: string): Promise<Project> {
    return apiService.put<Project>(`${this.basePath}/${id}/archive`);
  }

  async unarchiveProject(id: string): Promise<Project> {
    return apiService.put<Project>(`${this.basePath}/${id}/unarchive`);
  }

  async getProjectTasks(id: string, filters?: {
    status?: Task['status'];
    priority?: Task['priority'];
  }): Promise<Task[]> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `${this.basePath}/${id}/tasks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<Task[]>(endpoint);
  }

  async getProjectStats(id: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    totalTimeTracked: number;
    completionRate: number;
  }> {
    return apiService.get<{
      totalTasks: number;
      completedTasks: number;
      pendingTasks: number;
      totalTimeTracked: number;
      completionRate: number;
    }>(`${this.basePath}/${id}/stats`);
  }

  async getProjectTimeEntries(id: string, filters?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `${this.basePath}/${id}/time-entries${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<any>(endpoint);
  }

  async duplicateProject(id: string, newName: string): Promise<Project> {
    return apiService.post<Project>(`${this.basePath}/${id}/duplicate`, { name: newName });
  }

  async getRecentProjects(limit: number = 5): Promise<Project[]> {
    return apiService.get<Project[]>(`${this.basePath}/recent?limit=${limit}`);
  }

  async getProjectProgress(id: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    progress: number;
    estimatedHours: number;
    actualHours: number;
  }> {
    return apiService.get<{
      totalTasks: number;
      completedTasks: number;
      progress: number;
      estimatedHours: number;
      actualHours: number;
    }>(`${this.basePath}/${id}/progress`);
  }

  async getProjectColors(): Promise<string[]> {
    return apiService.get<string[]>('/projects/colors');
  }

  async exportProject(id: string, format: 'csv' | 'json' | 'pdf'): Promise<Blob> {
    const API_BASE_URL = 'https://www.productif.io/api';
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/projects/${id}/export?format=${format}`, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de l\'export');
    }
    
    return response.blob();
  }
}

export const projectService = new ProjectService(); 