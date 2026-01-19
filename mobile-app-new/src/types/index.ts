export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  companyId?: string;
  role: 'USER' | 'ADMIN' | 'COMPANY_ADMIN';
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
  gamification: UserGamification;
}

export interface UserPreferences {
  notifications: boolean;
  emailNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
}

export interface UserGamification {
  level: number;
  experience: number;
  points: number;
  streak: number;
  totalTasksCompleted: number;
  totalTimeTracked: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  userId: string;
  companyId?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
  timeEntries: TimeEntry[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  projectId?: string;
  userId: string;
  companyId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  project?: Project;
  timeEntries: TimeEntry[];
}

export interface TimeEntry {
  id: string;
  description?: string;
  startTime: string;
  endTime?: string;
  duration: number; // en secondes
  taskId?: string;
  projectId?: string;
  userId: string;
  companyId?: string;
  isRunning: boolean;
  createdAt: string;
  updatedAt: string;
  task?: Task;
  project?: Project;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  targetValue: number;
  unit: string;
  isActive: boolean;
  userId: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
  entries: HabitEntry[];
  streak: number;
  completionRate: number;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  date: string;
  value: number;
  completed: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  habit?: Habit;
}

export interface Objective {
  id: string;
  title: string;
  description?: string;
  type: 'PERSONAL' | 'PROFESSIONAL' | 'HEALTH' | 'LEARNING';
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  startDate: string;
  endDate?: string;
  progress: number; // 0-100
  userId: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
  initiatives: Initiative[];
  metrics: ObjectiveMetric[];
}

export interface Initiative {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dueDate?: string;
  objectiveId: string;
  createdAt: string;
  updatedAt: string;
  actions: Action[];
}

export interface Action {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dueDate?: string;
  initiativeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ObjectiveMetric {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  objectiveId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'TASKS' | 'TIME' | 'HABITS' | 'STREAK' | 'SPECIAL';
  condition: any;
  points: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  userId: string;
  createdAt: string;
  actionUrl?: string;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalTimeToday: number;
  totalTimeWeek: number;
  activeHabits: number;
  completedHabitsToday: number;
  currentStreak: number;
  level: number;
  experience: number;
  nextLevelExp: number;
  recentAchievements: Achievement[];
}

export interface Analytics {
  timeByProject: { projectName: string; time: number; color: string }[];
  timeByDay: { date: string; time: number }[];
  taskCompletionRate: number;
  habitCompletionRate: number;
  productivityScore: number;
  weeklyProgress: { day: string; tasks: number; time: number }[];
}

// Types pour les formulaires
export interface CreateTaskData {
  title: string;
  description?: string;
  priority: Task['priority'];
  dueDate?: string;
  estimatedHours?: number;
  projectId?: string;
  tags?: string[];
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  status?: Task['status'];
}

export interface CreateProjectData {
  name: string;
  description?: string;
  color: string;
}

export interface CreateHabitData {
  name: string;
  description?: string;
  category: string;
  frequency: Habit['frequency'];
  targetValue: number;
  unit: string;
}

export interface CreateObjectiveData {
  title: string;
  description?: string;
  type: Objective['type'];
  priority: Objective['priority'];
  startDate: string;
  endDate?: string;
}

export interface CreateTimeEntryData {
  description?: string;
  taskId?: string;
  projectId?: string;
} 