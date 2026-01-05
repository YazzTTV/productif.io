import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Calendar } from 'lucide-react';

interface CalendarSyncProps {
  onConnect: () => void;
  onSkip: () => void;
  t: any;
}

export function CalendarSync({ onConnect, onSkip, t }: CalendarSyncProps) {
  const handleConnect = (provider: string) => {
    // Mock calendar connection
    console.log(`Connecting to ${provider}`);
    onConnect();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-[#16A34A]/10 flex items-center justify-center mx-auto"
          >
            <Calendar className="w-10 h-10 text-[#16A34A]" />
          </motion.div>

          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
            {t.syncYourDay}
          </h1>
          <p className="text-black/60">{t.createEvents}</p>
        </div>

        <div className="space-y-3">
          {/* Google Calendar */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleConnect('google')}
            className="w-full p-6 rounded-3xl border border-black/10 hover:border-[#16A34A]/30 hover:bg-[#16A34A]/5 transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-white border border-black/10 flex items-center justify-center">
              <svg className="w-7 h-7" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                {t.googleCalendar}
              </h3>
            </div>
          </motion.button>

          {/* Apple Calendar */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleConnect('apple')}
            className="w-full p-6 rounded-3xl border border-black/10 hover:border-[#16A34A]/30 hover:bg-[#16A34A]/5 transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-white border border-black/10 flex items-center justify-center">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                {t.appleCalendar}
              </h3>
            </div>
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button
            onClick={onSkip}
            className="w-full text-black/60 hover:text-black transition-colors text-sm py-4"
          >
            {t.skip}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
