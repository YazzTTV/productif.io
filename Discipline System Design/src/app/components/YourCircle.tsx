import { motion } from 'motion/react';
import { Users, UserPlus, MoreVertical, X } from 'lucide-react';
import { Button } from './ui/button';

interface YourCircleProps {
  onInvite: () => void;
}

interface Friend {
  id: string;
  name: string;
  streak: number;
  lastActive: string;
  status: 'active' | 'inactive';
}

interface Group {
  id: string;
  name: string;
  memberCount: number;
  yourRank: number;
}

export function YourCircle({ onInvite }: YourCircleProps) {
  // Mock data
  const friends: Friend[] = [
    { id: '1', name: 'Alex T.', streak: 7, lastActive: '2h ago', status: 'active' },
    { id: '2', name: 'Emma R.', streak: 11, lastActive: 'Now', status: 'active' },
    { id: '3', name: 'Lucas M.', streak: 5, lastActive: '1d ago', status: 'inactive' },
  ];

  const groups: Group[] = [
    { id: '1', name: 'Prepa 2025', memberCount: 12, yourRank: 3 },
    { id: '2', name: 'Engineering Focus Group', memberCount: 8, yourRank: 2 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl tracking-tight mb-1" style={{ letterSpacing: '-0.03em' }}>
            Your Circle
          </h2>
          <p className="text-black/60 text-sm">
            Private connections for accountability
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onInvite}
          className="w-10 h-10 rounded-full bg-[#16A34A]/10 flex items-center justify-center hover:bg-[#16A34A]/20 transition-colors"
        >
          <UserPlus className="w-5 h-5 text-[#16A34A]" />
        </motion.button>
      </div>

      {/* Friends */}
      <div>
        <p className="text-black/60 mb-3 text-sm">Friends ({friends.length})</p>
        <div className="space-y-3">
          {friends.map((friend) => (
            <motion.div
              key={friend.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 border border-black/5 rounded-3xl bg-white hover:bg-black/5 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center font-medium text-black/60">
                    {friend.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{friend.name}</p>
                      {friend.status === 'active' && (
                        <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-black/60">
                      <span>{friend.streak}d streak</span>
                      <span>•</span>
                      <span>{friend.lastActive}</span>
                    </div>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors">
                  <MoreVertical className="w-4 h-4 text-black/40" />
                </button>
              </div>
            </motion.div>
          ))}

          {friends.length === 0 && (
            <div className="p-8 border border-black/5 rounded-3xl bg-white text-center">
              <p className="text-black/60 mb-4">No friends added yet</p>
              <Button
                onClick={onInvite}
                className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-12 px-8"
              >
                Invite a friend
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Groups */}
      <div>
        <p className="text-black/60 mb-3 text-sm">Groups ({groups.length})</p>
        <div className="space-y-3">
          {groups.map((group) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 border border-black/5 rounded-3xl bg-white hover:bg-black/5 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#16A34A]/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-[#16A34A]" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">{group.name}</p>
                    <div className="flex items-center gap-3 text-sm text-black/60">
                      <span>{group.memberCount} members</span>
                      <span>•</span>
                      <span>You're #{group.yourRank}</span>
                    </div>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors">
                  <MoreVertical className="w-4 h-4 text-black/40" />
                </button>
              </div>
            </motion.div>
          ))}

          {groups.length === 0 && (
            <div className="p-8 border border-black/5 rounded-3xl bg-white text-center">
              <p className="text-black/60 mb-4">No groups joined yet</p>
              <Button
                onClick={onInvite}
                className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-12 px-8"
              >
                Create or join a group
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Invite Limits */}
      <div className="p-4 bg-black/5 rounded-2xl">
        <div className="flex items-center justify-between">
          <p className="text-sm text-black/60">Invites remaining this week</p>
          <p className="font-medium">5 / 10</p>
        </div>
        <p className="text-xs text-black/40 mt-2">
          Limits prevent spam and keep invitations intentional.
        </p>
      </div>
    </div>
  );
}
