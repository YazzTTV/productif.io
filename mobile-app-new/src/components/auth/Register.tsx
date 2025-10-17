import React, { useState } from 'react';
import '../../styles/components/auth/Register.css';

interface RegisterProps {
  onRegister: (email: string, password: string, name: string) => Promise<void>;
  onSwitchToLogin: () => void;
  loading?: boolean;
  error?: string | null;
}

export const Register: React.FC<RegisterProps> = ({ 
  onRegister, 
  onSwitchToLogin, 
  loading = false, 
  error 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [validationErrors, setValidationErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    email?: string;
  }>({});

  const validatePassword = (pwd: string): string | undefined => {
    if (pwd.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pwd)) {
      return 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
    }
    return undefined;
  };

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd);
    const error = validatePassword(pwd);
    setValidationErrors(prev => ({ ...prev, password: error }));
  };

  const handleConfirmPasswordChange = (confirmPwd: string) => {
    setConfirmPassword(confirmPwd);
    if (confirmPwd && confirmPwd !== password) {
      setValidationErrors(prev => ({ ...prev, confirmPassword: 'Les mots de passe ne correspondent pas' }));
    } else {
      setValidationErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation finale
    const passwordError = validatePassword(password);
    if (passwordError) {
      setValidationErrors(prev => ({ ...prev, password: passwordError }));
      return;
    }
    
    if (password !== confirmPassword) {
      setValidationErrors(prev => ({ ...prev, confirmPassword: 'Les mots de passe ne correspondent pas' }));
      return;
    }

    if (!acceptTerms) {
      return;
    }

    if (email && password && name) {
      await onRegister(email, password, name);
    }
  };

  const isFormValid = email && password && confirmPassword && name && acceptTerms && 
                     !validationErrors.password && !validationErrors.confirmPassword;

  return (
    <div className="register-container">
      <div className="register-header">
        <div className="logo">
          <h1>Productif.io</h1>
          <p>Commencez votre parcours de productivité</p>
        </div>
      </div>

      <div className="register-form-container">
        <h2>Créer un compte</h2>
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="name">Nom complet</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom complet"
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <div className="password-input">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Créer un mot de passe"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {validationErrors.password && (
              <div className="field-error">{validationErrors.password}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              placeholder="Confirmer votre mot de passe"
              required
              autoComplete="new-password"
            />
            {validationErrors.confirmPassword && (
              <div className="field-error">{validationErrors.confirmPassword}</div>
            )}
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                required
              />
              <span className="checkbox-text">
                J'accepte les <button type="button" className="link-text">conditions d'utilisation</button> et la <button type="button" className="link-text">politique de confidentialité</button>
              </span>
            </label>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="register-button"
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <span className="loading-spinner">
                <span></span>
                Création du compte...
              </span>
            ) : (
              'Créer mon compte'
            )}
          </button>
        </form>

        <div className="register-footer">
          <button
            type="button"
            className="link-button"
            onClick={onSwitchToLogin}
          >
            Déjà un compte ? Se connecter
          </button>
        </div>
      </div>
    </div>
  );
}; 