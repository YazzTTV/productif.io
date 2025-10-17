import React, { useEffect, useState } from 'react';

interface Habit {
  id: string;
  title: string;
  description: string;
  frequency: string;
  completed: boolean;
}

export const HabitsList: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const response = await fetch('https://www.productif.io/api/habits');
      const data = await response.json();
      setHabits(data);
    } catch (error) {
      console.error('Erreur lors du chargement des habitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (habitId: string) => {
    try {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;

      const response = await fetch(`https://www.productif.io/api/habits/${habitId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setHabits(habits.map(h => 
          h.id === habitId ? { ...h, completed: !h.completed } : h
        ));
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'habitude:', error);
    }
  };

  if (loading) {
    return <div className="loading">Chargement des habitudes...</div>;
  }

  return (
    <div className="habits-list">
      {habits.length === 0 ? (
        <div className="empty-state">
          <p>Aucune habitude pour le moment</p>
          <button className="add-button">Ajouter une habitude</button>
        </div>
      ) : (
        <ul className="habits-grid">
          {habits.map(habit => (
            <li key={habit.id} className="habit-card">
              <div className="habit-header">
                <h3>{habit.title}</h3>
                <button 
                  className={`complete-button ${habit.completed ? 'completed' : ''}`}
                  onClick={() => toggleHabit(habit.id)}
                >
                  {habit.completed ? '✓' : '○'}
                </button>
              </div>
              <p className="habit-description">{habit.description}</p>
              <div className="habit-footer">
                <span className="habit-frequency">{habit.frequency}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}; 