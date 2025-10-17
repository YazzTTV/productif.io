import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services';
import { DashboardStats } from '../types';
import '../styles/components/Dashboard.css';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardStats = await dashboardService.getDashboardStats();
      setStats(dashboardStats);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const getProgressPercentage = (current: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>{error}</p>
        <button onClick={loadDashboardData} className="retry-button">
          Réessayer
        </button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Tableau de bord</h1>
        <button onClick={loadDashboardData} className="refresh-button">
          🔄
        </button>
      </div>

      {/* Statistiques rapides */}
      <div className="quick-stats">
        <div className="stat-card tasks">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Tâches</h3>
            <div className="stat-value">
              {stats.completedTasks}/{stats.totalTasks}
            </div>
            <div className="stat-label">
              {getProgressPercentage(stats.completedTasks, stats.totalTasks)}% complétées
            </div>
          </div>
        </div>

        <div className="stat-card time">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>Temps aujourd'hui</h3>
            <div className="stat-value">{formatTime(stats.totalTimeToday)}</div>
            <div className="stat-label">Cette semaine: {formatTime(stats.totalTimeWeek)}</div>
          </div>
        </div>

        <div className="stat-card habits">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Habitudes</h3>
            <div className="stat-value">
              {stats.completedHabitsToday}/{stats.activeHabits}
            </div>
            <div className="stat-label">
              {getProgressPercentage(stats.completedHabitsToday, stats.activeHabits)}% aujourd'hui
            </div>
          </div>
        </div>

        <div className="stat-card level">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <h3>Niveau</h3>
            <div className="stat-value">{stats.level}</div>
            <div className="stat-label">
              {stats.experience}/{stats.nextLevelExp} XP
            </div>
          </div>
        </div>
      </div>

      {/* Série actuelle */}
      <div className="current-streak">
        <div className="streak-card">
          <h3>🔥 Série actuelle</h3>
          <div className="streak-value">{stats.currentStreak} jours</div>
          <p>Continuez comme ça !</p>
        </div>
      </div>

      {/* Tâches en attente */}
      {stats.pendingTasks > 0 && (
        <div className="pending-tasks-alert">
          <div className="alert-content">
            <span className="alert-icon">⚠️</span>
            <span>Vous avez {stats.pendingTasks} tâches en attente</span>
          </div>
        </div>
      )}

      {/* Réalisations récentes */}
      {stats.recentAchievements && stats.recentAchievements.length > 0 && (
        <div className="recent-achievements">
          <h3>🏅 Réalisations récentes</h3>
          <div className="achievements-list">
            {stats.recentAchievements.slice(0, 3).map(achievement => (
              <div key={achievement.id} className="achievement-item">
                <span className="achievement-icon">{achievement.icon}</span>
                <div className="achievement-info">
                  <div className="achievement-name">{achievement.name}</div>
                  <div className="achievement-description">{achievement.description}</div>
                </div>
                <div className="achievement-points">+{achievement.points} XP</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barre de progression XP */}
      <div className="xp-progress">
        <div className="xp-bar">
          <div 
            className="xp-fill" 
            style={{ 
              width: `${getProgressPercentage(stats.experience, stats.nextLevelExp)}%` 
            }}
          ></div>
        </div>
        <div className="xp-text">
          {stats.experience} / {stats.nextLevelExp} XP pour le niveau {stats.level + 1}
        </div>
      </div>
    </div>
  );
}; 