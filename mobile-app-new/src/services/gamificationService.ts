import { apiService } from './api';
import { Achievement, UserGamification } from '../types';

export class GamificationService {
  private basePath = '/gamification';

  async getUserGamification(): Promise<UserGamification> {
    return apiService.get<UserGamification>(`${this.basePath}/user`);
  }

  async getAchievements(): Promise<Achievement[]> {
    return apiService.get<Achievement[]>(`${this.basePath}/achievements`);
  }

  async getUnlockedAchievements(): Promise<Achievement[]> {
    return apiService.get<Achievement[]>(`${this.basePath}/achievements/unlocked`);
  }

  async getAvailableAchievements(): Promise<Achievement[]> {
    return apiService.get<Achievement[]>(`${this.basePath}/achievements/available`);
  }

  async getAchievementById(id: string): Promise<Achievement> {
    return apiService.get<Achievement>(`${this.basePath}/achievements/${id}`);
  }

  async claimAchievement(id: string): Promise<{
    success: boolean;
    achievement: Achievement;
    pointsEarned: number;
    experienceGained: number;
  }> {
    return apiService.post<{
      success: boolean;
      achievement: Achievement;
      pointsEarned: number;
      experienceGained: number;
    }>(`${this.basePath}/achievements/${id}/claim`);
  }

  async getLeaderboard(timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'weekly'): Promise<{
    rank: number;
    userId: string;
    userName: string;
    avatar?: string;
    points: number;
    level: number;
    experience: number;
    isCurrentUser: boolean;
  }[]> {
    return apiService.get<{
      rank: number;
      userId: string;
      userName: string;
      avatar?: string;
      points: number;
      level: number;
      experience: number;
      isCurrentUser: boolean;
    }[]>(`${this.basePath}/leaderboard?timeframe=${timeframe}`);
  }

  async getCurrentUserRank(timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'weekly'): Promise<{
    rank: number;
    points: number;
    totalUsers: number;
    percentile: number;
  }> {
    return apiService.get<{
      rank: number;
      points: number;
      totalUsers: number;
      percentile: number;
    }>(`${this.basePath}/rank?timeframe=${timeframe}`);
  }

  async getPointsHistory(period: 'week' | 'month' | 'year' = 'week'): Promise<{
    date: string;
    points: number;
    source: 'task' | 'habit' | 'achievement' | 'bonus';
    description: string;
  }[]> {
    return apiService.get<{
      date: string;
      points: number;
      source: 'task' | 'habit' | 'achievement' | 'bonus';
      description: string;
    }[]>(`${this.basePath}/points/history?period=${period}`);
  }

  async getLevelInfo(): Promise<{
    currentLevel: number;
    currentExperience: number;
    experienceToNextLevel: number;
    totalExperienceForNextLevel: number;
    progress: number;
    levelName: string;
    nextLevelName: string;
    levelBenefits: string[];
    nextLevelBenefits: string[];
  }> {
    return apiService.get<{
      currentLevel: number;
      currentExperience: number;
      experienceToNextLevel: number;
      totalExperienceForNextLevel: number;
      progress: number;
      levelName: string;
      nextLevelName: string;
      levelBenefits: string[];
      nextLevelBenefits: string[];
    }>(`${this.basePath}/level`);
  }

  async getStreaks(): Promise<{
    taskStreak: {
      current: number;
      longest: number;
      startDate?: string;
    };
    habitStreak: {
      current: number;
      longest: number;
      startDate?: string;
    };
    generalStreak: {
      current: number;
      longest: number;
      startDate?: string;
    };
    timeTrackingStreak: {
      current: number;
      longest: number;
      startDate?: string;
    };
  }> {
    return apiService.get<{
      taskStreak: {
        current: number;
        longest: number;
        startDate?: string;
      };
      habitStreak: {
        current: number;
        longest: number;
        startDate?: string;
      };
      generalStreak: {
        current: number;
        longest: number;
        startDate?: string;
      };
      timeTrackingStreak: {
        current: number;
        longest: number;
        startDate?: string;
      };
    }>(`${this.basePath}/streaks`);
  }

  async getBadges(): Promise<{
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'productivity' | 'consistency' | 'achievement' | 'social' | 'milestone';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    earnedAt?: string;
    isEarned: boolean;
    progress?: number;
    maxProgress?: number;
  }[]> {
    return apiService.get<{
      id: string;
      name: string;
      description: string;
      icon: string;
      category: 'productivity' | 'consistency' | 'achievement' | 'social' | 'milestone';
      rarity: 'common' | 'rare' | 'epic' | 'legendary';
      earnedAt?: string;
      isEarned: boolean;
      progress?: number;
      maxProgress?: number;
    }[]>(`${this.basePath}/badges`);
  }

  async getChallenges(): Promise<{
    id: string;
    name: string;
    description: string;
    type: 'daily' | 'weekly' | 'monthly' | 'special';
    startDate: string;
    endDate: string;
    isActive: boolean;
    isCompleted: boolean;
    progress: number;
    maxProgress: number;
    reward: {
      points: number;
      experience: number;
      badge?: string;
    };
    participants: number;
  }[]> {
    return apiService.get<{
      id: string;
      name: string;
      description: string;
      type: 'daily' | 'weekly' | 'monthly' | 'special';
      startDate: string;
      endDate: string;
      isActive: boolean;
      isCompleted: boolean;
      progress: number;
      maxProgress: number;
      reward: {
        points: number;
        experience: number;
        badge?: string;
      };
      participants: number;
    }[]>(`${this.basePath}/challenges`);
  }

  async joinChallenge(challengeId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return apiService.post<{
      success: boolean;
      message: string;
    }>(`${this.basePath}/challenges/${challengeId}/join`);
  }

  async getActiveChallenges(): Promise<{
    id: string;
    name: string;
    description: string;
    type: 'daily' | 'weekly' | 'monthly' | 'special';
    progress: number;
    maxProgress: number;
    endDate: string;
    timeRemaining: string;
  }[]> {
    return apiService.get<{
      id: string;
      name: string;
      description: string;
      type: 'daily' | 'weekly' | 'monthly' | 'special';
      progress: number;
      maxProgress: number;
      endDate: string;
      timeRemaining: string;
    }[]>(`${this.basePath}/challenges/active`);
  }

  async getGamificationInsights(): Promise<{
    mostRewardingActivity: string;
    bestPerformanceDay: string;
    improvementAreas: string[];
    nextMilestone: {
      type: 'level' | 'achievement' | 'badge';
      name: string;
      progress: number;
      target: number;
      estimatedTimeToComplete: string;
    };
    motivationalMessage: string;
  }> {
    return apiService.get<{
      mostRewardingActivity: string;
      bestPerformanceDay: string;
      improvementAreas: string[];
      nextMilestone: {
        type: 'level' | 'achievement' | 'badge';
        name: string;
        progress: number;
        target: number;
        estimatedTimeToComplete: string;
      };
      motivationalMessage: string;
    }>(`${this.basePath}/insights`);
  }

  async getRecentRewards(): Promise<{
    id: string;
    type: 'points' | 'experience' | 'achievement' | 'badge' | 'level_up';
    amount?: number;
    name?: string;
    description: string;
    earnedAt: string;
    source: string;
  }[]> {
    return apiService.get<{
      id: string;
      type: 'points' | 'experience' | 'achievement' | 'badge' | 'level_up';
      amount?: number;
      name?: string;
      description: string;
      earnedAt: string;
      source: string;
    }[]>(`${this.basePath}/rewards/recent`);
  }

  async markRewardAsSeen(rewardId: string): Promise<{ success: boolean }> {
    return apiService.put<{ success: boolean }>(`${this.basePath}/rewards/${rewardId}/seen`);
  }

  async getCompanyLeaderboard(): Promise<{
    rank: number;
    userId: string;
    userName: string;
    avatar?: string;
    points: number;
    level: number;
    department?: string;
    isCurrentUser: boolean;
  }[]> {
    return apiService.get<{
      rank: number;
      userId: string;
      userName: string;
      avatar?: string;
      points: number;
      level: number;
      department?: string;
      isCurrentUser: boolean;
    }[]>(`${this.basePath}/company/leaderboard`);
  }
}

export const gamificationService = new GamificationService(); 