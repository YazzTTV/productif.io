import React, { useState, useEffect } from 'react';
import { habitService } from '../services';
import { Habit, HabitEntry } from '../types';
import '../styles/components/HabitsTracker.css';

export const HabitsTracker: React.FC = () => {
  const [todaysHabits, setTodaysHabits] = useState<(Habit & { isCompletedToday: boolean; todayEntry?: HabitEntry })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTodaysHabits();
  }, []);

  const loadTodaysHabits = async () => {
    try {
      setLoading(true);
      const habits = await habitService.getTodaysHabits();
      setTodaysHabits(habits);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des habitudes');
    } finally {
      setLoading(false);
    }
  };

  const toggleHabitCompletion = async (habitId: string, isCompleted: boolean) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (isCompleted) {
        // Marquer comme incomplet
        await habitService.markHabitIncomplete(habitId, today);
      } else {
        // Marquer comme complet
        const habit = todaysHabits.find(h => h.id === habitId);
        if (habit) {
          await habitService.markHabitComplete(habitId, today, habit.targetValue);
        }
      }
      
      // Recharger les habitudes
      await loadTodaysHabits();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour');
    }
  };

  const updateHabitValue = async (habitId: string, value: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const habit = todaysHabits.find(h => h.id === habitId);
      
      if (habit?.todayEntry) {
        // Mettre à jour l'entrée existante
        await habitService.updateHabitEntry(habitId, habit.todayEntry.id, { value });
      } else {
        // Créer une nouvelle entrée
        await habitService.createHabitEntry(habitId, { date: today, value });
      }
      
      // Recharger les habitudes
      await loadTodaysHabits();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour');
    }
  };

  const getProgressPercentage = (current: number, target: number): number => {
    if (target === 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const getFrequencyText = (frequency: Habit['frequency']): string => {
    switch (frequency) {
      case 'DAILY': return 'Quotidien';
      case 'WEEKLY': return 'Hebdomadaire';
      case 'MONTHLY': return 'Mensuel';
      default: return frequency;
    }
  };

  if (loading) {
    return (
      <div className="habits-loading">
        <div className="loading-spinner"></div>
        <p>Chargement des habitudes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="habits-error">
        <p>{error}</p>
        <button onClick={loadTodaysHabits} className="retry-button">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="habits-tracker">
      <div className="habits-header">
        <h2>Mes Habitudes</h2>
        <div className="habits-date">
          {new Date().toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {todaysHabits.length === 0 ? (
        <div className="no-habits">
          <div className="no-habits-icon">🎯</div>
          <h3>Aucune habitude configurée</h3>
          <p>Commencez par créer vos premières habitudes pour suivre vos progrès quotidiens.</p>
          <button className="add-habit-button">Ajouter une habitude</button>
        </div>
      ) : (
        <div className="habits-list">
          {todaysHabits.map(habit => {
            const currentValue = habit.todayEntry?.value || 0;
            const progressPercentage = getProgressPercentage(currentValue, habit.targetValue);
            const isCompleted = habit.isCompletedToday;

            return (
              <div key={habit.id} className={`habit-card ${isCompleted ? 'completed' : ''}`}>
                <div className="habit-header">
                  <div className="habit-info">
                    <h3 className="habit-name">{habit.name}</h3>
                    <div className="habit-details">
                      <span className="habit-category">{habit.category}</span>
                      <span className="habit-frequency">{getFrequencyText(habit.frequency)}</span>
                    </div>
                  </div>
                  <button
                    className={`completion-button ${isCompleted ? 'completed' : ''}`}
                    onClick={() => toggleHabitCompletion(habit.id, isCompleted)}
                  >
                    {isCompleted ? '✓' : '○'}
                  </button>
                </div>

                {habit.description && (
                  <p className="habit-description">{habit.description}</p>
                )}

                <div className="habit-progress">
                  <div className="progress-info">
                    <span className="progress-text">
                      {currentValue} / {habit.targetValue} {habit.unit}
                    </span>
                    <span className="progress-percentage">{progressPercentage}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {habit.unit !== 'fois' && (
                  <div className="habit-input">
                    <input
                      type="number"
                      min="0"
                      max={habit.targetValue * 2}
                      value={currentValue}
                      onChange={(e) => updateHabitValue(habit.id, parseFloat(e.target.value) || 0)}
                      className="value-input"
                      placeholder={`Valeur en ${habit.unit}`}
                    />
                  </div>
                )}

                <div className="habit-stats">
                  <div className="stat">
                    <span className="stat-label">Série</span>
                    <span className="stat-value">{habit.streak} jours</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Taux</span>
                    <span className="stat-value">{Math.round(habit.completionRate)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="habits-summary">
        <div className="summary-card">
          <h3>Résumé du jour</h3>
          <div className="summary-stats">
            <div className="summary-stat">
              <span className="summary-number">
                {todaysHabits.filter(h => h.isCompletedToday).length}
              </span>
              <span className="summary-label">Complétées</span>
            </div>
            <div className="summary-stat">
              <span className="summary-number">{todaysHabits.length}</span>
              <span className="summary-label">Total</span>
            </div>
            <div className="summary-stat">
              <span className="summary-number">
                {todaysHabits.length > 0 
                  ? Math.round((todaysHabits.filter(h => h.isCompletedToday).length / todaysHabits.length) * 100)
                  : 0}%
              </span>
              <span className="summary-label">Réussite</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 