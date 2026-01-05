import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Calendar, Zap, Target } from 'lucide-react';
import productifLogo from 'figma:asset/74a73e97503d2c70426e85e4615331f23c885101.png';

interface InviteLandingProps {
  inviterName: string;
  inviterStreak: number;
  inviterStats?: {
    xp: number;
    focusSessions: number;
  };
  personalMessage?: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function InviteLanding({
  inviterName,
  inviterStreak,
  inviterStats,
  personalMessage,
  onAccept,
  onDecline,
}: InviteLandingProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <img 
            src={productifLogo} 
            alt="Productif.io" 
            className="w-20 h-20"
          />
        </motion.div>

        {/* Invitation Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center space-y-2"
        >
          <p className="text-black/60">You've been invited to</p>
          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
            Productif.io
          </h1>
        </motion.div>

        {/* Inviter Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-8 border-2 border-[#16A34A]/20 bg-[#16A34A]/5 rounded-3xl space-y-6"
        >
          {/* Inviter Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#16A34A]/10 flex items-center justify-center text-2xl font-medium text-[#16A34A]">
              {inviterName.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-lg">{inviterName}</p>
              <p className="text-black/60 text-sm">
                {inviterStreak} days consistent
              </p>
            </div>
          </div>

          {/* Personal Message */}
          {personalMessage && (
            <div className="p-4 bg-white rounded-2xl border border-black/5">
              <p className="text-black/80 italic">"{personalMessage}"</p>
            </div>
          )}

          {/* Inviter Stats */}
          {inviterStats && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-white rounded-2xl border border-black/5">
                <p className="text-black/40 text-sm mb-1">XP Earned</p>
                <p className="font-medium">{inviterStats.xp.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-black/5">
                <p className="text-black/40 text-sm mb-1">Focus Sessions</p>
                <p className="font-medium">{inviterStats.focusSessions}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* What is Productif.io */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <p className="text-center text-black/60">
            A discipline system for serious students
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-black/60" />
              </div>
              <div>
                <p className="font-medium mb-1">AI-planned days</p>
                <p className="text-sm text-black/60">
                  System decides what to do, when. You validate.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-black/60" />
              </div>
              <div>
                <p className="font-medium mb-1">Focus Flow</p>
                <p className="text-sm text-black/60">
                  Distraction-free sessions. No timers. Pure focus.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-black/60" />
              </div>
              <div>
                <p className="font-medium mb-1">Consistency tracking</p>
                <p className="text-sm text-black/60">
                  XP and streaks that reward showing up, not intensity.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          <Button
            onClick={onAccept}
            className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-16 text-lg shadow-xl shadow-[#16A34A]/30 hover:shadow-2xl hover:shadow-[#16A34A]/40 transition-all"
          >
            Join their focus system
          </Button>

          <button
            onClick={onDecline}
            className="w-full text-black/60 hover:text-black transition-colors text-sm"
          >
            Maybe later
          </button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <p className="text-black/40 text-sm italic">
            This is not a motivation app. This is a system.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
