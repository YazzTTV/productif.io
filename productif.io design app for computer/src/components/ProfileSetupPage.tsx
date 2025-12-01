import { motion } from 'motion/react';
import { Screen } from '../App';
import { TrendingUp, Target, Clock, Award, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

interface ProfileSetupPageProps {
  onNavigate: (screen: Screen) => void;
}

export function ProfileSetupPage({ onNavigate }: ProfileSetupPageProps) {
  return (
    <div className="min-h-[844px] bg-white px-8 py-16 flex flex-col justify-between">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-[#00C27A]/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-center relative z-10">
        {/* Success Badge */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-full flex items-center justify-center shadow-xl">
            <CheckCircle2 size={32} className="text-white" />
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-3"
        >
          <h1 className="text-gray-800 mb-2">
            Good News
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-600 mb-10"
        >
          We've built your profile. Your progress will be tracked here.
        </motion.p>

        {/* Productivity Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            delay: 0.7 
          }}
          className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-6 shadow-2xl border border-gray-100 mb-10 relative overflow-hidden"
        >
          {/* Decorative gradient overlay */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00C27A]/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#00D68F]/20 to-transparent rounded-full blur-2xl" />
          
          <div className="relative">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-2xl flex items-center justify-center shadow-lg">
                  <TrendingUp size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-gray-800">Your Profile</h3>
                  <p className="text-xs text-gray-500">Ready to track</p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles size={20} className="text-[#00C27A]" />
              </motion.div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { 
                  icon: Target, 
                  label: 'Goals', 
                  value: 'Ready',
                  color: 'from-purple-500 to-purple-600'
                },
                { 
                  icon: Clock, 
                  label: 'Time Tracking', 
                  value: 'Active',
                  color: 'from-blue-500 to-blue-600'
                },
                { 
                  icon: Award, 
                  label: 'Streaks', 
                  value: 'Starting',
                  color: 'from-amber-500 to-orange-500'
                },
                { 
                  icon: TrendingUp, 
                  label: 'Analytics', 
                  value: 'Enabled',
                  color: 'from-[#00C27A] to-[#00D68F]'
                }
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                  >
                    <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-3 shadow-md`}>
                      <Icon size={18} className="text-white" />
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-gray-800">{stat.value}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Progress Indicator */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 1.3, duration: 0.8 }}
              className="mt-5 pt-5 border-t border-gray-100"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Profile Setup</span>
                <span className="text-xs text-[#00C27A]">50%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#00C27A] to-[#00D68F]"
                  initial={{ width: 0 }}
                  animate={{ width: '50%' }}
                  transition={{ delay: 1.5, duration: 1 }}
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom Message */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="text-center text-gray-700 mb-6"
        >
          Now, let's find out why you're struggling.
        </motion.p>
      </div>

      {/* Next Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8 }}
        onClick={() => onNavigate('onboarding-1' as Screen)}
        whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0, 194, 122, 0.3)" }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-5 rounded-2xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2 relative overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <span className="relative text-lg">Next</span>
        <ArrowRight className="relative" size={20} />
      </motion.button>
    </div>
  );
}
