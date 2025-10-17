import { apiService } from './api';
import { Notification } from '../types';

export class NotificationService {
  private basePath = '/notifications';

  async getNotifications(filters?: {
    isRead?: boolean;
    type?: Notification['type'];
    limit?: number;
    offset?: number;
  }): Promise<{ notifications: Notification[]; total: number; unread: number }> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `${this.basePath}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<{ notifications: Notification[]; total: number; unread: number }>(endpoint);
  }

  async getUnreadNotifications(): Promise<Notification[]> {
    return apiService.get<Notification[]>(`${this.basePath}/unread`);
  }

  async getUnreadCount(): Promise<{ count: number }> {
    return apiService.get<{ count: number }>(`${this.basePath}/unread/count`);
  }

  async markAsRead(notificationId: string): Promise<{ success: boolean }> {
    return apiService.put<{ success: boolean }>(`${this.basePath}/${notificationId}/read`);
  }

  async markAllAsRead(): Promise<{ success: boolean; markedCount: number }> {
    return apiService.put<{ success: boolean; markedCount: number }>(`${this.basePath}/read-all`);
  }

  async deleteNotification(notificationId: string): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`${this.basePath}/${notificationId}`);
  }

  async deleteAllRead(): Promise<{ success: boolean; deletedCount: number }> {
    return apiService.delete<{ success: boolean; deletedCount: number }>(`${this.basePath}/read`);
  }

  async getNotificationPreferences(): Promise<{
    emailNotifications: boolean;
    pushNotifications: boolean;
    taskReminders: boolean;
    habitReminders: boolean;
    deadlineAlerts: boolean;
    achievementNotifications: boolean;
    weeklyReports: boolean;
    reminderTimes: {
      morning: string;
      evening: string;
    };
    quietHours: {
      start: string;
      end: string;
      enabled: boolean;
    };
  }> {
    return apiService.get<{
      emailNotifications: boolean;
      pushNotifications: boolean;
      taskReminders: boolean;
      habitReminders: boolean;
      deadlineAlerts: boolean;
      achievementNotifications: boolean;
      weeklyReports: boolean;
      reminderTimes: {
        morning: string;
        evening: string;
      };
      quietHours: {
        start: string;
        end: string;
        enabled: boolean;
      };
    }>(`${this.basePath}/preferences`);
  }

  async updateNotificationPreferences(preferences: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    taskReminders?: boolean;
    habitReminders?: boolean;
    deadlineAlerts?: boolean;
    achievementNotifications?: boolean;
    weeklyReports?: boolean;
    reminderTimes?: {
      morning?: string;
      evening?: string;
    };
    quietHours?: {
      start?: string;
      end?: string;
      enabled?: boolean;
    };
  }): Promise<{ success: boolean }> {
    return apiService.put<{ success: boolean }>(`${this.basePath}/preferences`, preferences);
  }

  async registerPushToken(token: string, platform: 'ios' | 'android' | 'web'): Promise<{ success: boolean }> {
    return apiService.post<{ success: boolean }>(`${this.basePath}/push-token`, { token, platform });
  }

  async unregisterPushToken(): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`${this.basePath}/push-token`);
  }

  async testNotification(type: 'email' | 'push'): Promise<{ success: boolean; message: string }> {
    return apiService.post<{ success: boolean; message: string }>(`${this.basePath}/test`, { type });
  }

  async snoozeNotification(notificationId: string, minutes: number): Promise<{ success: boolean }> {
    return apiService.put<{ success: boolean }>(`${this.basePath}/${notificationId}/snooze`, { minutes });
  }

  async getNotificationHistory(days: number = 30): Promise<Array<{
    date: string;
    sentCount: number;
    readCount: number;
    clickCount: number;
    types: Array<{ type: string; count: number }>;
  }>> {
    return apiService.get<Array<{
      date: string;
      sentCount: number;
      readCount: number;
      clickCount: number;
      types: Array<{ type: string; count: number }>;
    }>>(`${this.basePath}/history?days=${days}`);
  }

  async createCustomReminder(data: {
    title: string;
    message: string;
    scheduledFor: string;
    type: 'task' | 'habit' | 'custom';
    relatedId?: string;
    recurring?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      daysOfWeek?: number[];
      endDate?: string;
    };
  }): Promise<{ success: boolean; reminderId: string }> {
    return apiService.post<{ success: boolean; reminderId: string }>(`${this.basePath}/reminders`, data);
  }

  async getCustomReminders(): Promise<Array<{
    id: string;
    title: string;
    message: string;
    scheduledFor: string;
    type: 'task' | 'habit' | 'custom';
    isActive: boolean;
    recurring?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      daysOfWeek?: number[];
      endDate?: string;
    };
  }>> {
    return apiService.get<Array<{
      id: string;
      title: string;
      message: string;
      scheduledFor: string;
      type: 'task' | 'habit' | 'custom';
      isActive: boolean;
      recurring?: {
        frequency: 'daily' | 'weekly' | 'monthly';
        daysOfWeek?: number[];
        endDate?: string;
      };
    }>>(`${this.basePath}/reminders`);
  }

  async updateCustomReminder(reminderId: string, data: {
    title?: string;
    message?: string;
    scheduledFor?: string;
    isActive?: boolean;
    recurring?: {
      frequency?: 'daily' | 'weekly' | 'monthly';
      daysOfWeek?: number[];
      endDate?: string;
    };
  }): Promise<{ success: boolean }> {
    return apiService.put<{ success: boolean }>(`${this.basePath}/reminders/${reminderId}`, data);
  }

  async deleteCustomReminder(reminderId: string): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`${this.basePath}/reminders/${reminderId}`);
  }

  async getSmartNotificationSuggestions(): Promise<Array<{
    type: 'task_reminder' | 'habit_reminder' | 'break_reminder' | 'deadline_alert';
    title: string;
    description: string;
    suggestedTime: string;
    confidence: number;
    basedOn: string[];
  }>> {
    return apiService.get<Array<{
      type: 'task_reminder' | 'habit_reminder' | 'break_reminder' | 'deadline_alert';
      title: string;
      description: string;
      suggestedTime: string;
      confidence: number;
      basedOn: string[];
    }>>(`${this.basePath}/suggestions`);
  }
}

export const notificationService = new NotificationService(); 