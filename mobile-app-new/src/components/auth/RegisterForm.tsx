import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const RegisterForm: React.FC = () => {
  const { register, error, loading, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateForm = () => {
    if (password !== confirmPassword) {
      setValidationError('Les mots de passe ne correspondent pas');
      return false;
    }
    if (password.length < 8) {
      setValidationError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      await register(name, email, password);
    } catch (err) {
      // L'erreur est déjà gérée dans le contexte
      console.error('Erreur d\'inscription:', err);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Inscription</h2>
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="name">Nom</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre email"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Mot de passe</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirmez votre mot de passe"
            required
            disabled={loading}
          />
        </div>

        {(error || validationError) && (
          <div className="error-message" onClick={() => {
            clearError();
            setValidationError(null);
          }}>
            {validationError || error}
          </div>
        )}

        <button 
          type="submit" 
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'Inscription...' : 'S\'inscrire'}
        </button>
      </form>

      <style jsx>{`
        .auth-form-container {
          padding: 20px;
          max-width: 400px;
          margin: 0 auto;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        label {
          font-weight: 500;
          color: #333;
        }

        input {
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
        }

        input:focus {
          border-color: #007AFF;
          outline: none;
        }

        .error-message {
          color: #ff3b30;
          background-color: #ffe5e5;
          padding: 10px;
          border-radius: 8px;
          text-align: center;
          cursor: pointer;
        }

        .submit-button {
          background-color: #007AFF;
          color: white;
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }

        .submit-button:disabled {
          background-color: #99c4ff;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}; 