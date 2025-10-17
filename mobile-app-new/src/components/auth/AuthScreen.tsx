import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

type AuthMode = 'login' | 'register';

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-header">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Connexion
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            Inscription
          </button>
        </div>

        <div className="auth-content">
          {mode === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>

      <style jsx>{`
        .auth-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f5f5f5;
          padding: 20px;
        }

        .auth-container {
          width: 100%;
          max-width: 400px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .auth-header {
          display: flex;
          border-bottom: 1px solid #eee;
        }

        .auth-tab {
          flex: 1;
          padding: 16px;
          font-size: 16px;
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          transition: all 0.3s ease;
        }

        .auth-tab.active {
          color: #007AFF;
          background-color: white;
          border-bottom: 2px solid #007AFF;
        }

        .auth-tab:hover:not(.active) {
          background-color: #f5f5f5;
        }

        .auth-content {
          padding: 20px;
        }
      `}</style>
    </div>
  );
}; 