import { motion } from 'motion/react';
import { Button } from '../ui/button';
import productifLogo from 'figma:asset/74a73e97503d2c70426e85e4615331f23c885101.png';

interface WelcomeProps {
  onStart: () => void;
  onLogin: () => void;
  t: any;
}

export function Welcome({ onStart, onLogin, t }: WelcomeProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-16"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex justify-center"
        >
          <img 
            src={productifLogo} 
            alt="Productif.io" 
            className="w-24 h-24"
          />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4 text-center"
        >
          <h1
            className="tracking-tight"
            style={{ letterSpacing: '-0.04em' }}
          >
            {t.welcomeTitle}
          </h1>
          <p className="text-black/60">{t.welcomeSubtitle}</p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <Button
            onClick={onStart}
            className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14"
          >
            {t.getStarted}
          </Button>

          <button
            onClick={onLogin}
            className="w-full text-black/60 hover:text-black transition-colors text-sm"
          >
            {t.alreadyHaveAccount}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}