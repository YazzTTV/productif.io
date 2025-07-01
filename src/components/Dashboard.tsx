"use client"

import React from 'react';
import {
  useTasks,
  useProjects,
  useHabits,
  useTimeEntries,
  useUserStats,
  useStreak
} from '../hooks/useApi';

export function Dashboard() {
  const { data: tasks, loading: tasksLoading, error: tasksError } = useTasks();
  const { data: projects, loading: projectsLoading } = useProjects();
  const { data: habits, loading: habitsLoading } = useHabits();
  const { data: timeEntries } = useTimeEntries();
  const { data: userStats } = useUserStats();
  const { data: streak } = useStreak();

  if (tasksLoading || projectsLoading || habitsLoading) {
    return <div>Chargement...</div>;
  }

  if (tasksError) {
    return <div>Erreur: {tasksError.message}</div>;
  }

  return (
    <div className="p-4">
      {/* En-tête avec stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Tâches</h3>
          <p className="text-2xl">{tasks?.length || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Projets</h3>
          <p className="text-2xl">{projects?.length || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Habitudes</h3>
          <p className="text-2xl">{habits?.length || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Série actuelle</h3>
          <p className="text-2xl">{streak?.currentStreak || 0} jours</p>
        </div>
      </div>

      {/* Liste des tâches récentes */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Tâches récentes</h2>
        <div className="space-y-2">
          {tasks?.slice(0, 5).map(task => (
            <div
              key={task.id}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
            >
              <span className={task.completed ? 'line-through text-gray-500' : ''}>
                {task.title}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(task.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Projets en cours */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Projets en cours</h2>
        <div className="grid grid-cols-2 gap-4">
          {projects?.slice(0, 4).map(project => (
            <div
              key={project.id}
              className="p-4 rounded-lg"
              style={{ backgroundColor: project.color || '#f3f4f6' }}
            >
              <h3 className="font-semibold">{project.name}</h3>
              <p className="text-sm text-gray-600">{project.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Habitudes du jour */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Habitudes du jour</h2>
        <div className="space-y-2">
          {habits?.map(habit => (
            <div
              key={habit.id}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
            >
              <span>{habit.name}</span>
              <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                Compléter
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Statistiques utilisateur */}
      {userStats && (
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Statistiques</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold">Taux de complétion</h3>
              <p className="text-2xl">{userStats.tasksCompletionRate}%</p>
            </div>
            <div>
              <h3 className="font-semibold">Habitudes complétées</h3>
              <p className="text-2xl">{userStats.habitsCompletedToday}</p>
            </div>
            <div>
              <h3 className="font-semibold">Progrès objectifs</h3>
              <p className="text-2xl">{userStats.objectivesProgress}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 