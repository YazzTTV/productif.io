import React, { useState, useEffect } from 'react';
import { taskService } from '../services';
import { Task } from '../types';
import '../styles/components/TasksList.css';

type TaskStatusFilter = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'all';

export const TasksList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskStatusFilter>('all');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await taskService.getTasks();
      setTasks(response.tasks);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      await taskService.updateTask(taskId, { status: newStatus });
      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du statut');
    }
  };

  const getPriorityColor = (priority: Task['priority']): string => {
    switch (priority) {
      case 'HIGH':
      case 'URGENT':
        return '#EF4444'; // Rouge
      case 'MEDIUM':
        return '#F59E0B'; // Orange
      case 'LOW':
        return '#10B981'; // Vert
      default:
        return '#6B7280'; // Gris
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Chargement des tâches...</div>;
  }

  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter(task => task.status === filter);

  return (
    <div className="tasks-list">
      <div className="tasks-header">
        <h2>Mes Tâches</h2>
        <div className="filter-buttons">
          <button
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Toutes
          </button>
          <button
            className={`filter-button ${filter === 'PENDING' ? 'active' : ''}`}
            onClick={() => setFilter('PENDING')}
          >
            À faire
          </button>
          <button
            className={`filter-button ${filter === 'IN_PROGRESS' ? 'active' : ''}`}
            onClick={() => setFilter('IN_PROGRESS')}
          >
            En cours
          </button>
          <button
            className={`filter-button ${filter === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setFilter('COMPLETED')}
          >
            Terminées
          </button>
        </div>
      </div>

      {error ? (
        <div className="error-message">{error}</div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state">
          <p>Aucune tâche</p>
          <button className="add-button">Ajouter une tâche</button>
        </div>
      ) : (
        <ul className="tasks-grid">
          {filteredTasks.map(task => (
            <li key={task.id} className="task-card">
              <div className="task-header">
                <div
                  className="priority-indicator"
                  style={{ backgroundColor: getPriorityColor(task.priority) }}
                />
                <h3>{task.title}</h3>
              </div>
              <p className="task-description">{task.description}</p>
              <div className="task-footer">
                <select
                  className="status-select"
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value as Task['status'])}
                >
                  <option value="PENDING">À faire</option>
                  <option value="IN_PROGRESS">En cours</option>
                  <option value="COMPLETED">Terminée</option>
                </select>
                {task.dueDate && (
                  <span className="due-date">
                    Échéance : {formatDate(task.dueDate)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}; 