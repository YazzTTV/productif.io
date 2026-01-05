import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';

interface CommunityUser {
  id: string;
  name: string;
  xp: number;
  maxXP: number;
  isCurrentUser?: boolean;
}

interface CommunityProgressCardProps {
  onNavigate: (screen: string) => void;
}

export function CommunityProgressCard({ onNavigate }: CommunityProgressCardProps) {
  // Mock data - top performers + current user
  const users: CommunityUser[] = [
    { id: '1', name: 'M', xp: 2847, maxXP: 3000 },
    { id: '2', name: 'You', xp: 2654, maxXP: 3000, isCurrentUser: true },
    { id: '3', name: 'A', xp: 2531, maxXP: 3000 },
    { id: '4', name: 'E', xp: 2408, maxXP: 3000 },
    { id: '5', name: 'L', xp: 2287, maxXP: 3000 },
  ];

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      onClick={() => onNavigate('leaderboard')}
      className="w-full p-6 border border-black/5 rounded-3xl bg-white hover:bg-black/5 transition-all text-left"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-medium mb-1">Community Progress</h3>
          <p className="text-sm text-black/40">Your group this week</p>
        </div>
        <ChevronRight className="w-5 h-5 text-black/20" />
      </div>

      {/* User avatars with progress bars */}
      <div className="flex items-end justify-between gap-3">
        {users.map((user, index) => {
          const progressPercent = (user.xp / user.maxXP) * 100;
          
          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              className="flex-1 flex flex-col items-center gap-2"
            >
              {/* Progress bar (vertical) */}
              <div className="w-full h-16 bg-black/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${progressPercent}%` }}
                  transition={{ delay: 0.7 + index * 0.05, duration: 0.8, ease: 'easeOut' }}
                  className={`w-full rounded-full ${
                    user.isCurrentUser ? 'bg-[#16A34A]' : 'bg-black/10'
                  }`}
                  style={{ marginTop: 'auto' }}
                />
              </div>

              {/* Avatar */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  user.isCurrentUser
                    ? 'bg-[#16A34A]/10 text-[#16A34A]'
                    : 'bg-black/5 text-black/40'
                }`}
              >
                {user.name}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="mt-6 pt-4 border-t border-black/5">
        <p className="text-sm text-black/40 text-center">
          View full leaderboard →
        </p>
      </div>
    </motion.button>
  );
}
