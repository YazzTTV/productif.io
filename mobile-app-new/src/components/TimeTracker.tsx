import React, { useState, useEffect, useRef, useCallback } from 'react';
import { timeService } from '../services';
import { TimeEntry } from '../types';
import '../styles/components/TimeTracker.css';

export const TimeTracker: React.FC = () => {
  const [description, setDescription] = useState('');
  const [taskId, setTaskId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [time, setTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
  const timerRef = useRef<number>();
  const startTimeRef = useRef<Date>();

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const loadRecentEntries = useCallback(async () => {
    try {
      const entries = await timeService.getRecentEntries(5);
      setRecentEntries(entries);
    } catch (err) {
      console.error('Erreur lors du chargement des entrées récentes:', err);
    }
  }, []);

  const checkCurrentTimer = useCallback(async () => {
    try {
      const currentTimer = await timeService.getCurrentTimer();
      if (currentTimer) {
        setIsTracking(true);
        setDescription(currentTimer.description || '');
        setTaskId(currentTimer.taskId || '');
        setProjectId(currentTimer.projectId || '');
        
        // Calculer le temps écoulé
        const startTime = new Date(currentTimer.startTime);
        const now = new Date();
        setTime(Math.floor((now.getTime() - startTime.getTime()) / 1000));
        
        // Démarrer le minuteur local
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        
        timerRef.current = window.setInterval(() => {
          setTime(prev => prev + 1);
        }, 1000);
      }
    } catch (err) {
      console.error('Erreur lors de la vérification du minuteur actuel:', err);
    }
  }, []);

  const startTracking = useCallback(async () => {
    if (!description) return;
    
    try {
      setError(null);
      await timeService.startTimer({
        description,
        taskId: taskId || undefined,
        projectId: projectId || undefined,
      });
      
      setIsTracking(true);
      startTimeRef.current = new Date();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      timerRef.current = window.setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors du démarrage');
    }
  }, [description, taskId, projectId]);

  const stopTracking = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    try {
      await timeService.stopTimer();
      
      setIsTracking(false);
      setTime(0);
      setDescription('');
      setTaskId('');
      setProjectId('');
      
      // Recharger les entrées récentes
      await loadRecentEntries();
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
    }
  }, [loadRecentEntries]);

  useEffect(() => {
    checkCurrentTimer();
    loadRecentEntries();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [checkCurrentTimer, loadRecentEntries]);

  return (
    <div className="time-tracker">
      <div className="timer-card">
        <div className="timer-display" data-testid="timer-display">
          {formatTime(time)}
        </div>
        <div className="timer-inputs">
          <input
            type="text"
            className="description-input"
            placeholder="Description de l'activité"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isTracking}
          />
          <input
            type="text"
            className="task-input"
            placeholder="ID de la tâche (optionnel)"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            disabled={isTracking}
          />
          <input
            type="text"
            className="project-input"
            placeholder="ID du projet (optionnel)"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            disabled={isTracking}
          />
        </div>
        <div className="timer-controls">
          {!isTracking ? (
            <button
              className="start-button"
              onClick={startTracking}
              disabled={!description}
            >
              Démarrer
            </button>
          ) : (
            <button
              className="stop-button"
              onClick={stopTracking}
            >
              Arrêter
            </button>
          )}
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>
      <div className="time-entries">
        <h3>Entrées récentes</h3>
        {recentEntries.length === 0 ? (
          <p className="no-entries">Aucune entrée de temps</p>
        ) : (
          <ul className="entries-list">
            {recentEntries.map(entry => (
              <li key={entry.id} className="entry-item">
                <div className="entry-info">
                  <span className="entry-description">{entry.description || 'Sans description'}</span>
                  <span className="entry-duration">{formatTime(entry.duration)}</span>
                </div>
                <span className="entry-date">
                  {new Date(entry.startTime).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}; 