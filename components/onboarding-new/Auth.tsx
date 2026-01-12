"use client"

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';

interface AuthProps {
  onAuth: (isNewUser: boolean) => void;
  t: any;
}

export function Auth({ onAuth, t }: AuthProps) {
  // Helper to get translation with fallback
  const getTranslation = (key: string, fallback: string) => {
    if (!t) return fallback;
    if (typeof t === 'function') {
      const translation = t(key);
      return translation && translation !== key ? translation : fallback;
    } else if (typeof t === 'object' && t[key]) {
      return t[key];
    }
    return fallback;
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async () => {
    if (!email || !password) return;
    
    setIsLoading(true);
    try {
      if (isLogin) {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include',
        });
        
        if (response.ok) {
          onAuth(false); // Existing user
        } else {
          throw new Error('Login failed');
        }
      } else {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email, 
            password,
            name: email.split('@')[0] 
          }),
          credentials: 'include',
        });
        
        if (response.ok) {
          onAuth(true); // New user
        } else {
          throw new Error('Registration failed');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    // Rediriger vers l'onboarding après l'authentification Google
    signIn('google', { callbackUrl: '/onboarding' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center space-y-3">
          <h1 className="tracking-tight text-3xl font-bold" style={{ letterSpacing: '-0.04em' }}>
            {isLogin ? getTranslation('welcomeBack', 'Bon retour') : getTranslation('createAccount', 'Créez votre compte')}
          </h1>
          <p className="text-black/60">{getTranslation('chooseFastest', 'Choisissez la façon la plus rapide de continuer.')}</p>
        </div>

        <div className="space-y-4">
          {/* Social auth buttons */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleAuth}
            className="w-full p-4 rounded-2xl border border-black/10 hover:border-black/20 hover:bg-black/5 transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>{getTranslation('continueWithGoogle', 'Continuer avec Google')}</span>
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-black/10" />
            <span className="text-black/40 text-sm">{getTranslation('or', 'ou')}</span>
            <div className="flex-1 h-px bg-black/10" />
          </div>

          {/* Email & Password inputs */}
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={getTranslation('emailPlaceholder', 'Votre email')}
              className="w-full px-4 py-4 border border-black/10 rounded-2xl bg-white focus:outline-none focus:border-black/20 transition-colors"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={getTranslation('passwordPlaceholder', 'Mot de passe')}
              className="w-full px-4 py-4 border border-black/10 rounded-2xl bg-white focus:outline-none focus:border-black/20 transition-colors"
            />

            <Button
              onClick={handleEmailAuth}
              disabled={!email || !password || isLoading}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-12 disabled:opacity-40"
            >
              {isLoading ? '...' : (isLogin ? getTranslation('loginButton', 'Se connecter') : getTranslation('signUpButton', "S'inscrire"))}
            </Button>
          </div>

          {/* Toggle login/signup */}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-black/60 hover:text-black transition-colors text-sm"
          >
            {isLogin ? getTranslation('createAccountLink', 'Créer un compte') : getTranslation('alreadyHaveAccount', "J'ai déjà un compte")}
          </button>

          <p className="text-xs text-black/30 text-center pt-4">{getTranslation('noSpam', 'Nous ne spammons jamais.')}</p>
        </div>
      </motion.div>
    </div>
  );
}


