import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-container">
      <h1>Tableau de bord</h1>
      <div className="user-info">
        <h2>Bienvenue, {user?.name}</h2>
        <p>Email: {user?.email}</p>
      </div>
      <button onClick={logout} className="logout-button">
        Se déconnecter
      </button>

      <style jsx>{`
        .dashboard-container {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        .user-info {
          background-color: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }

        .logout-button {
          background-color: #ff3b30;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }

        .logout-button:hover {
          background-color: #d63530;
        }
      `}</style>
    </div>
  );
}; 