import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';

interface AuthProps {
  onAuth: (isNewUser: boolean) => void;
  t: any;
}

export function Auth({ onAuth, t }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(false);

  const handleEmailAuth = () => {
    // Mock authentication - in real app, would call auth service
    onAuth(!isLogin);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center space-y-3">
          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
            {isLogin ? t.welcomeBack : t.createAccount}
          </h1>
          <p className="text-black/60">{t.chooseFastest}</p>
        </div>

        <div className="space-y-4">
          {/* Social auth buttons */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAuth(!isLogin)}
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
            <span>{t.continueWithGoogle}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAuth(!isLogin)}
            className="w-full p-4 rounded-2xl border border-black/10 hover:border-black/20 hover:bg-black/5 transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <span>{t.continueWithApple}</span>
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-black/10" />
            <span className="text-black/40 text-sm">{t.or}</span>
            <div className="flex-1 h-px bg-black/10" />
          </div>

          {/* Email & Password inputs */}
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className="w-full px-4 py-4 border border-black/10 rounded-2xl bg-white focus:outline-none focus:border-black/20 transition-colors"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.passwordPlaceholder}
              className="w-full px-4 py-4 border border-black/10 rounded-2xl bg-white focus:outline-none focus:border-black/20 transition-colors"
            />

            <Button
              onClick={handleEmailAuth}
              disabled={!email || !password}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-12 disabled:opacity-40"
            >
              {isLogin ? t.loginButton : t.signUpButton}
            </Button>
          </div>

          {/* Toggle login/signup */}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-black/60 hover:text-black transition-colors text-sm"
          >
            {isLogin ? t.createAccountLink : t.alreadyHaveAccount}
          </button>

          <p className="text-xs text-black/30 text-center pt-4">{t.noSpam}</p>
        </div>
      </motion.div>
    </div>
  );
}