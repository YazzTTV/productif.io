import { motion } from 'motion/react';
import { Screen } from '../App';
import { Lightbulb } from 'lucide-react';

interface ProfileResultPageProps {
  onNavigate: (screen: Screen) => void;
  profile: any;
}

export function ProfileResultPage({ onNavigate, profile }: ProfileResultPageProps) {
  if (!profile) {
    profile = {
      type: "Strategic Achiever",
      description: "You thrive on structure and clear objectives. Your analytical mindset helps you break down complex goals into actionable steps.",
      tips: [
        "Use time-blocking to maximize your peak hours",
        "Set micro-goals to maintain momentum",
        "Track metrics that matter to you"
      ]
    };
  }

  return (
    <div className="min-h-[844px] bg-white px-8 py-16 flex flex-col justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Success Badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex justify-center mb-8"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-full flex items-center justify-center text-white shadow-xl">
            <span className="text-5xl">✓</span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-8"
        >
          <p className="text-[#00C27A] mb-2">Analysis Complete</p>
          <h1 className="text-gray-800 mb-2">Your Productivity Profile</h1>
          <h2 className="text-gray-700">{profile.type}</h2>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-6 shadow-sm mb-6 border border-gray-100"
        >
          <p className="text-gray-700 leading-relaxed">{profile.description}</p>
        </motion.div>

        {/* Personalized Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-[#00C27A]/5 to-white rounded-3xl p-6 shadow-sm mb-8 border border-[#00C27A]/20"
        >
          <h3 className="text-gray-800 mb-4 flex items-center gap-2">
            <Lightbulb className="text-[#00C27A]" size={20} />
            Personalized Recommendations
          </h3>
          <div className="space-y-3">
            {profile.tips.map((tip: string, index: number) => (
              <motion.div
                key={tip}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="flex items-start gap-3 text-gray-700"
              >
                <div className="w-6 h-6 rounded-full bg-[#00C27A] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">{index + 1}</span>
                </div>
                <span>{tip}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="space-y-4"
        >
          {/* Value Proposition */}
          <div className="bg-gradient-to-br from-[#00C27A]/10 to-white rounded-2xl p-4 border border-[#00C27A]/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">🎁</span>
              <p className="text-gray-800">Start Your Free Trial</p>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <span className="text-[#00C27A]">✓</span> No credit card
              </span>
              <span className="flex items-center gap-1">
                <span className="text-[#00C27A]">✓</span> 7 days free
              </span>
              <span className="flex items-center gap-1">
                <span className="text-[#00C27A]">✓</span> Cancel anytime
              </span>
            </div>
          </div>

          {/* Main CTA Button */}
          <motion.button
            onClick={() => onNavigate('dashboard')}
            whileHover={{ 
              scale: 1.03, 
              boxShadow: "0 20px 40px rgba(0, 194, 122, 0.4)" 
            }}
            whileTap={{ scale: 0.97 }}
            animate={{ 
              boxShadow: [
                "0 10px 30px rgba(0, 194, 122, 0.3)",
                "0 15px 40px rgba(0, 194, 122, 0.4)",
                "0 10px 30px rgba(0, 194, 122, 0.3)"
              ]
            }}
            transition={{ 
              boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="relative w-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-5 rounded-full transition-all duration-300 shadow-xl overflow-hidden group"
          >
            {/* Animated shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            
            <span className="relative text-lg flex items-center justify-center gap-2">
              <span>🚀</span>
              <span>Unlock My Full Potential Now</span>
            </span>
          </motion.button>

          {/* Urgency indicator */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-center text-sm text-gray-500"
          >
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-[#00C27A] rounded-full animate-pulse"></span>
              Join 10,000+ productive people today
            </span>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}