import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../App';
import { Moon, Sun, Bell, Palette, User, HelpCircle, Shield, LogOut, Home, Bot, Settings as SettingsIcon } from 'lucide-react';

interface SettingsPageProps {
  onNavigate: (screen: Screen) => void;
}

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'green'>('light');
  const [notifications, setNotifications] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div className="min-h-[844px] bg-white flex flex-col">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-24 pt-12">
        {/* Header */}
        <div className="px-6 mb-6">
          <h1 className="text-gray-800">Settings</h1>
        </div>

        {/* Account Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-6 mb-6"
        >
          <h3 className="text-gray-700 mb-3 text-sm">ACCOUNT</h3>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-full flex items-center justify-center text-white shadow-md">
                  <span className="text-xl">A</span>
                </div>
                <div>
                  <p className="text-gray-800">Alex Johnson</p>
                  <p className="text-gray-500 text-sm">alex@productif.io</p>
                </div>
              </div>
            </div>
            
            <button className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <User className="text-[#00C27A]" size={20} />
                <span className="text-gray-800">Profile Settings</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </motion.div>

        {/* Premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="px-6 mb-6"
        >
          <div className="bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-3xl p-6 shadow-lg text-white relative overflow-hidden">
            {/* Exclusive Badge */}
            <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs flex items-center gap-1 border border-white/30">
              <span>👑</span>
              <span className="font-medium">Elite Access</span>
            </div>
            
            {/* Animated Shimmer Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white">Premium Elite</h3>
                    <span className="text-lg">✨</span>
                  </div>
                  <p className="text-white/90 text-sm mb-1">Join 10,000+ top performers</p>
                </div>
              </div>
              
              {/* Billing Period Toggle */}
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-1 mb-4 border border-white/20 flex gap-1">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`flex-1 py-2.5 px-3 rounded-xl transition-all text-sm relative ${
                    billingPeriod === 'monthly'
                      ? 'bg-white text-[#00C27A] shadow-md'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod('annual')}
                  className={`flex-1 py-2.5 px-3 rounded-xl transition-all text-sm relative ${
                    billingPeriod === 'annual'
                      ? 'bg-white text-[#00C27A] shadow-md'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Annual</span>
                    {billingPeriod === 'annual' && (
                      <motion.span
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="text-xs"
                      >
                        ✨
                      </motion.span>
                    )}
                  </div>
                  {billingPeriod !== 'annual' && (
                    <span className="absolute -top-1 -right-1 bg-yellow-400 text-[#00C27A] text-[10px] px-1.5 py-0.5 rounded-full shadow-sm">
                      SAVE 20%
                    </span>
                  )}
                </button>
              </div>

              {/* Annual Savings Badge - Shows when annual is selected */}
              <AnimatePresence>
                {billingPeriod === 'annual' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-yellow-400/20 backdrop-blur-sm rounded-xl p-3 border border-yellow-400/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🎉</span>
                          <div>
                            <p className="text-white text-sm">You save $60/year</p>
                            <p className="text-white/70 text-xs">That's 33% off!</p>
                          </div>
                        </div>
                        <div className="bg-yellow-400 text-[#00C27A] px-2 py-1 rounded-lg text-xs">
                          BEST VALUE
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Limited Spots Indicator */}
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 mb-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/90 text-sm">Limited spots remaining</span>
                  <span className="text-white text-sm">🔥</span>
                </div>
                <div className="flex gap-1">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        i < 7 ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-white/80 text-xs mt-2">Only 3 spots left at this price</p>
              </div>
              
              {/* Exclusive Features */}
              <div className="space-y-2 mb-4">
                {['Unlimited AI coaching', 'Priority support 24/7', 'Advanced analytics'].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/90 text-sm">
                    <span className="text-white">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              
              {/* Dynamic Pricing based on selection */}
              <div className="mb-4">
                {billingPeriod === 'monthly' ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-white text-2xl">$14.99</span>
                      <span className="text-white/80 text-sm">/month</span>
                    </div>
                    <p className="text-white/70 text-xs mt-1">Flexible billing</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-white text-2xl">$9.99</span>
                      <span className="text-white/80 text-sm">/month</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-white/70 text-xs">Billed annually at $119.88</p>
                    </div>
                  </>
                )}
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-white text-[#00C27A] py-4 rounded-full shadow-xl relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <span className="relative flex items-center justify-center gap-2">
                  <span>
                    {billingPeriod === 'monthly' 
                      ? 'Claim Elite Access Now' 
                      : 'Claim Annual Elite Access'}
                  </span>
                  <span>→</span>
                </span>
              </motion.button>
              
              <p className="text-white/60 text-xs text-center mt-3">
                {billingPeriod === 'monthly' 
                  ? '⏰ Offer expires in 24 hours' 
                  : '⏰ Annual deal expires in 24 hours'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-6 mb-6"
        >
          <h3 className="text-gray-700 mb-3 text-sm">PREFERENCES</h3>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Theme Selector */}
            <div className="p-5 border-b border-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Palette className="text-[#00C27A]" size={20} />
                  <span className="text-gray-800">Theme</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex-1 py-2 px-3 rounded-full border-2 transition-all text-sm ${
                    theme === 'light' 
                      ? 'border-[#00C27A] bg-[#00C27A]/5 text-[#00C27A]' 
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <Sun size={16} className="inline mr-1" />
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-1 py-2 px-3 rounded-full border-2 transition-all text-sm ${
                    theme === 'dark' 
                      ? 'border-[#00C27A] bg-[#00C27A]/5 text-[#00C27A]' 
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <Moon size={16} className="inline mr-1" />
                  Dark
                </button>
                <button
                  onClick={() => setTheme('green')}
                  className={`flex-1 py-2 px-3 rounded-full border-2 transition-all text-sm ${
                    theme === 'green' 
                      ? 'border-[#00C27A] bg-[#00C27A]/5 text-[#00C27A]' 
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  Green
                </button>
              </div>
            </div>

            {/* Notifications Toggle */}
            <div className="p-5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="text-[#00C27A]" size={20} />
                <span className="text-gray-800">Notifications</span>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-14 h-7 rounded-full transition-all duration-300 relative ${
                  notifications ? 'bg-[#00C27A]' : 'bg-gray-300'
                }`}
              >
                <motion.div
                  className="w-5 h-5 bg-white rounded-full absolute top-1"
                  animate={{ x: notifications ? 32 : 4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Analytics */}
            <button 
              onClick={() => onNavigate('tracker')}
              className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#00C27A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-gray-800">Detailed Statistics</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </motion.div>

        {/* Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-6 mb-6"
        >
          <h3 className="text-gray-700 mb-3 text-sm">SUPPORT</h3>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <button className="w-full p-5 text-left border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HelpCircle className="text-[#00C27A]" size={20} />
                <span className="text-gray-800">Help & Support</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
            <button className="w-full p-5 text-left hover:bg-gray-50 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="text-[#00C27A]" size={20} />
                <span className="text-gray-800">Privacy & Terms</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-6"
        >
          <motion.button
            onClick={() => onNavigate('welcome')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-white border-2 border-red-200 text-red-600 py-4 rounded-full hover:bg-red-50 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <LogOut size={20} />
            Log Out
          </motion.button>
        </motion.div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#00C27A] to-[#00D68F] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-30">
        <div className="flex items-center justify-around px-8 pt-3 pb-6">
          <motion.button
            onClick={() => onNavigate('dashboard')}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-0.5"
          >
            <div className="w-12 h-12 bg-white/0 hover:bg-white/10 backdrop-blur-sm rounded-[18px] flex items-center justify-center transition-all">
              <Home size={24} className="text-white/70" />
            </div>
            <span className="text-white/70 text-[11px] mt-0.5">Home</span>
          </motion.button>

          <motion.button
            onClick={() => onNavigate('assistant')}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-0.5"
          >
            <div className="w-12 h-12 bg-white/0 hover:bg-white/10 backdrop-blur-sm rounded-[18px] flex items-center justify-center transition-all">
              <Bot size={24} className="text-white/70" />
            </div>
            <span className="text-white/70 text-[11px] mt-0.5">Assistant</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-0.5 relative"
          >
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-[18px] flex items-center justify-center">
              <SettingsIcon size={24} className="text-white" />
            </div>
            <div className="absolute top-0 w-1.5 h-1.5 bg-white rounded-full shadow-lg"></div>
            <span className="text-white text-[11px] mt-0.5">Settings</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}