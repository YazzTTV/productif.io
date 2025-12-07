import { motion } from 'motion/react';
import { Screen } from '../App';
import { Sparkles, Check, Zap } from 'lucide-react';
import { useState } from 'react';

interface ProfileRevealScreenProps {
  onNavigate: (screen: Screen) => void;
  profileType: string;
  profileEmoji: string;
  description: string;
}

export function ProfileRevealScreen({
  onNavigate,
  profileType,
  profileEmoji,
  description
}: ProfileRevealScreenProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');

  return (
    <div className="min-h-[844px] bg-white px-6 py-12 flex flex-col">
      {/* Confetti Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-10%`,
            }}
            animate={{
              y: ['0vh', '100vh'],
              rotate: [0, 360],
              opacity: [1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              delay: Math.random() * 0.5,
              ease: 'linear',
            }}
          >
            {['🎉', '✨', '🚀', '💚', '⭐'][Math.floor(Math.random() * 5)]}
          </motion.div>
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-center relative z-10">
        {/* Success Badge */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-full flex items-center justify-center text-white shadow-xl">
            <span className="text-4xl">✓</span>
          </div>
        </motion.div>

        {/* Profile Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-6"
        >
          <p className="text-[#00C27A] text-sm mb-2">Your productivity profile</p>
          <h1 className="text-gray-800 mb-2 flex items-center justify-center gap-2">
            <span>{profileType}</span>
            <span className="text-4xl">{profileEmoji}</span>
          </h1>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-5 shadow-sm mb-5 border border-gray-100"
        >
          <p className="text-gray-700 leading-relaxed text-center">
            {description}
          </p>
        </motion.div>

        {/* Transformation Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-3 gap-2 mb-5"
        >
          <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
            <p className="text-green-600 text-xl mb-1">+87%</p>
            <p className="text-gray-600 text-xs">Focus</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
            <p className="text-blue-600 text-xl mb-1">3.2x</p>
            <p className="text-gray-600 text-xs">Tasks</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
            <p className="text-purple-600 text-xl mb-1">-64%</p>
            <p className="text-gray-600 text-xs">Stress</p>
          </div>
        </motion.div>

        {/* Pricing Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mb-5"
        >
          <h3 className="text-gray-800 mb-4 text-center">Choose your plan</h3>
          
          {/* Annual Plan - Highlighted */}
          <motion.button
            onClick={() => setSelectedPlan('annual')}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.99 }}
            className={`w-full p-5 rounded-2xl border-2 mb-3 transition-all relative ${
              selectedPlan === 'annual'
                ? 'border-[#00C27A] bg-gradient-to-br from-[#00C27A]/10 to-[#00D68F]/5 shadow-lg'
                : 'border-[#00C27A] bg-gradient-to-br from-[#00C27A]/10 to-[#00D68F]/5 shadow-lg'
            }`}
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#00C27A]/20 to-[#00D68F]/20 blur-xl -z-10" />
            
            {/* Best Value Badge - More Prominent */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white text-sm px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <span>⭐</span>
              <span>Best Value</span>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <div className="text-left">
                <p className="text-gray-800 mb-1">Annual Plan</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600 bg-green-50 px-2 py-0.5 rounded-full">💰 Save $60/year</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-gray-800 text-2xl">$9.99</p>
                  <p className="text-xs text-gray-500">per month</p>
                  <p className="text-xs text-gray-400">billed annually</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedPlan === 'annual'
                    ? 'border-[#00C27A] bg-[#00C27A]'
                    : 'border-gray-300'
                }`}>
                  {selectedPlan === 'annual' && (
                    <Check size={16} className="text-white" />
                  )}
                </div>
              </div>
            </div>
          </motion.button>

          {/* Monthly Plan - Standard */}
          <motion.button
            onClick={() => setSelectedPlan('monthly')}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`w-full p-4 rounded-2xl border-2 transition-all ${
              selectedPlan === 'monthly'
                ? 'border-[#00C27A] bg-[#00C27A]/5 shadow-md'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-gray-800">Monthly Plan</p>
                <p className="text-sm text-gray-500">Flexible billing</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-gray-800 text-xl">$14.99</p>
                  <p className="text-xs text-gray-500">per month</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedPlan === 'monthly'
                    ? 'border-[#00C27A] bg-[#00C27A]'
                    : 'border-gray-300'
                }`}>
                  {selectedPlan === 'monthly' && (
                    <Check size={16} className="text-white" />
                  )}
                </div>
              </div>
            </div>
          </motion.button>
        </motion.div>

        {/* Trial Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-gradient-to-br from-[#00C27A]/10 to-white rounded-2xl p-4 border border-[#00C27A]/30 mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Zap size={20} className="text-[#00C27A]" />
            <p className="text-gray-800">7-Day Free Trial</p>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <span className="text-[#00C27A]">✓</span> 50K+ users
            </span>
            <span className="flex items-center gap-1">
              <span className="text-[#00C27A]">✓</span> Cancel anytime
            </span>
          </div>
        </motion.div>
      </div>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        className="space-y-3 mt-6"
      >
        <motion.button
          onClick={() => onNavigate('dashboard')}
          whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0, 194, 122, 0.4)" }}
          whileTap={{ scale: 0.98 }}
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
          className="w-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-5 rounded-2xl transition-all shadow-lg relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <span className="relative text-lg flex items-center justify-center gap-2">
            <Zap size={20} />
            Start My Free Trial
          </span>
        </motion.button>

        <motion.button
          onClick={() => onNavigate('dashboard')}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full text-gray-600 py-3 rounded-2xl hover:text-gray-800 transition-all"
        >
          Skip
        </motion.button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-center text-xs text-gray-400 mt-3"
      >
        By continuing, you agree to our Terms & Privacy Policy
      </motion.p>
    </div>
  );
}