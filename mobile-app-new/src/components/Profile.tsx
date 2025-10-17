import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/components/Profile.css';

export const Profile: React.FC = () => {
  const { user, logout, loading } = useAuth();
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePreferences = async (newPreferences: Partial<NonNullable<typeof user>['preferences']>) => {
    if (!user) return;

    try {
      setLocalLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      const response = await fetch('https://www.productif.io/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPreferences),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour des préférences');
      }

      // Les préférences sont mises à jour côté serveur, 
      // on pourrait recharger les données utilisateur ici
      setError(null);
    } catch (err) {
      setError('Erreur lors de la mise à jour des préférences');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0] || !user) return;

    const formData = new FormData();
    formData.append('avatar', event.target.files[0]);

    try {
      setLocalLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      const response = await fetch('https://www.productif.io/api/user/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de l\'avatar');
      }

      await response.json();
      // L'avatar est mis à jour côté serveur
      setError(null);
    } catch (err) {
      setError('Erreur lors de la mise à jour de l\'avatar');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading || !user) {
    return <div className="loading">Chargement du profil...</div>;
  }

  return (
    <div className="profile">
      <div className="profile-header">
        <div className="avatar-container">
          <img 
            src={user.avatar || 'https://via.placeholder.com/80x80/667eea/ffffff?text=User'} 
            alt="Avatar" 
            className="avatar" 
          />
          <label className="avatar-upload">
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              aria-label="avatar"
              disabled={localLoading}
            />
            📷
          </label>
        </div>
        <div className="user-info">
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
      </div>

      <div className="preferences-section">
        <h3>Préférences</h3>
        
        <div className="preference-item">
          <label>
            <span>Thème sombre</span>
            <input
              type="checkbox"
              role="switch"
              checked={user.preferences?.theme === 'dark'}
              onChange={(e) => updatePreferences({ theme: e.target.checked ? 'dark' : 'light' })}
              aria-label="thème"
              disabled={localLoading}
            />
          </label>
        </div>

        <div className="preference-item">
          <label>
            <span>Langue</span>
            <select
              value={user.preferences?.language || 'fr'}
              onChange={(e) => updatePreferences({ language: e.target.value })}
              aria-label="langue"
              disabled={localLoading}
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>

        <div className="preference-item">
          <label>
            <span>Notifications par email</span>
            <input
              type="checkbox"
              role="switch"
              checked={user.preferences?.notifications?.email || false}
              onChange={(e) => updatePreferences({
                notifications: {
                  ...user.preferences?.notifications,
                  email: e.target.checked,
                  push: user.preferences?.notifications?.push || false
                },
              })}
              aria-label="email"
              disabled={localLoading}
            />
          </label>
        </div>

        <div className="preference-item">
          <label>
            <span>Notifications push</span>
            <input
              type="checkbox"
              role="switch"
              checked={user.preferences?.notifications?.push || false}
              onChange={(e) => updatePreferences({
                notifications: {
                  ...user.preferences?.notifications,
                  push: e.target.checked,
                  email: user.preferences?.notifications?.email || false
                },
              })}
              aria-label="push"
              disabled={localLoading}
            />
          </label>
        </div>
      </div>

      <div className="profile-actions">
        <button
          className="logout-button"
          onClick={handleLogout}
          disabled={localLoading}
        >
          Se déconnecter
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}; 