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
      <div className="flex-1 overflow-y-auto pb-24 pt-16 px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back to Home Button */}
          <motion.button
            onClick={() => onNavigate('dashboard')}
            whileHover={{ scale: 1.02, x: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-gray-600 hover:text-[#00C27A] transition-colors mb-6 group"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-[#00C27A]/10 flex items-center justify-center transition-colors">
              <Home size={20} className="group-hover:text-[#00C27A]" />
            </div>
            <span className="text-lg">Back to Home</span>
          </motion.button>

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-gray-900 text-4xl">Settings</h1>
          </div>

          {/* Account Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <h3 className="text-gray-700 mb-4 text-lg">ACCOUNT</h3>
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-8 border-b border-gray-100">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-full flex items-center justify-center text-white shadow-lg">
                    <span className="text-3xl">A</span>
                  </div>
                  <div>
                    <p className="text-gray-900 text-xl mb-1">Alex Johnson</p>
                    <p className="text-gray-500 text-base">alex@productif.io</p>
                  </div>
                </div>
              </div>
              
              <button className="w-full p-7 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <User className="text-[#00C27A]" size={24} />
                  <span className="text-gray-900 text-lg">Profile Settings</span>
                </div>
                <span className="text-gray-400 text-2xl">›</span>
              </button>
            </div>
          </motion.div>

          {/* Premium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-10"
          >
            <div className="bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
              {/* Exclusive Badge */}
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm flex items-center gap-1.5 border border-white/30">
                <span className="text-lg">👑</span>
                <span className="font-medium">Elite Access</span>
              </div>
              
              {/* Animated Shimmer Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white text-2xl">Premium Elite</h3>
                      <span className="text-2xl">✨</span>
                    </div>
                    <p className="text-white/90 text-base mb-1">Join 10,000+ top performers</p>
                  </div>
                </div>
                
                {/* Billing Period Toggle */}
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-1.5 mb-5 border border-white/20 flex gap-1.5">
                  <button
                    onClick={() => setBillingPeriod('monthly')}
                    className={`flex-1 py-3 px-4 rounded-xl transition-all text-base relative ${
                      billingPeriod === 'monthly'
                        ? 'bg-white text-[#00C27A] shadow-lg'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingPeriod('annual')}
                    className={`flex-1 py-3 px-4 rounded-xl transition-all text-base relative ${
                      billingPeriod === 'annual'
                        ? 'bg-white text-[#00C27A] shadow-lg'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Annual</span>
                      {billingPeriod === 'annual' && (
                        <motion.span
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="text-sm"
                        >
                          ✨
                        </motion.span>
                      )}
                    </div>
                    {billingPeriod !== 'annual' && (
                      <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-[#00C27A] text-xs px-2 py-1 rounded-full shadow-md">
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
                      animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-yellow-400/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-400/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🎉</span>
                            <div>
                              <p className="text-white text-base">You save $60/year</p>
                              <p className="text-white/70 text-sm">That's 33% off!</p>
                            </div>
                          </div>
                          <div className="bg-yellow-400 text-[#00C27A] px-3 py-1.5 rounded-lg text-sm">
                            BEST VALUE
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Limited Spots Indicator */}
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 mb-5 border border-white/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/90 text-base">Limited spots remaining</span>
                    <span className="text-white text-xl">🔥</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-full ${
                          i < 7 ? 'bg-white' : 'bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-white/80 text-sm mt-2">Only 3 spots left at this price</p>
                </div>
                
                {/* Exclusive Features */}
                <div className="space-y-3 mb-5">
                  {['Unlimited AI coaching', 'Priority support 24/7', 'Advanced analytics'].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-white/90 text-base">
                      <span className="text-white text-lg">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* Dynamic Pricing based on selection */}
                <div className="mb-6">
                  {billingPeriod === 'monthly' ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-white text-4xl">$14.99</span>
                        <span className="text-white/80 text-base">/month</span>
                      </div>
                      <p className="text-white/70 text-sm mt-1">Flexible billing</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-white text-4xl">$9.99</span>
                        <span className="text-white/80 text-base">/month</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-white/70 text-sm">Billed annually at $119.88</p>
                      </div>
                    </>
                  )}
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-white text-[#00C27A] py-5 rounded-full text-lg shadow-xl relative overflow-hidden group"
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
                
                <p className="text-white/60 text-sm text-center mt-4">
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
            className="mb-10"
          >
            <h3 className="text-gray-700 mb-4 text-lg">PREFERENCES</h3>
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Theme Selector */}
              <div className="p-7 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Palette className="text-[#00C27A]" size={24} />
                    <span className="text-gray-900 text-lg">Theme</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex-1 py-3 px-4 rounded-full border-2 transition-all text-base ${
                      theme === 'light' 
                        ? 'border-[#00C27A] bg-[#00C27A]/5 text-[#00C27A]' 
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <Sun size={18} className="inline mr-2" />
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex-1 py-3 px-4 rounded-full border-2 transition-all text-base ${
                      theme === 'dark' 
                        ? 'border-[#00C27A] bg-[#00C27A]/5 text-[#00C27A]' 
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <Moon size={18} className="inline mr-2" />
                    Dark
                  </button>
                  <button
                    onClick={() => setTheme('green')}
                    className={`flex-1 py-3 px-4 rounded-full border-2 transition-all text-base ${
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
              <div className="p-7 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Bell className="text-[#00C27A]" size={24} />
                  <span className="text-gray-900 text-lg">Notifications</span>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`w-16 h-8 rounded-full transition-all duration-300 relative ${
                    notifications ? 'bg-[#00C27A]' : 'bg-gray-300'
                  }`}
                >
                  <motion.div
                    className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-md"
                    animate={{ x: notifications ? 36 : 4 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Analytics */}
              <button 
                onClick={() => onNavigate('tracker')}
                className="w-full p-7 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <svg className="w-6 h-6 text-[#00C27A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-gray-900 text-lg">Detailed Statistics</span>
                </div>
                <span className="text-gray-400 text-2xl">›</span>
              </button>
            </div>
          </motion.div>

          {/* Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-10"
          >
            <h3 className="text-gray-700 mb-4 text-lg">SUPPORT</h3>
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
              <button className="w-full p-7 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <HelpCircle className="text-[#00C27A]" size={24} />
                  <span className="text-gray-900 text-lg">Help & Support</span>
                </div>
                <span className="text-gray-400 text-2xl">›</span>
              </button>
              <button className="w-full p-7 text-left hover:bg-gray-50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Shield className="text-[#00C27A]" size={24} />
                  <span className="text-gray-900 text-lg">Privacy & Terms</span>
                </div>
                <span className="text-gray-400 text-2xl">›</span>
              </button>
            </div>
          </motion.div>

          {/* Logout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <motion.button
              onClick={() => onNavigate('welcome')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white border-2 border-red-200 text-red-600 py-5 rounded-full hover:bg-red-50 transition-all flex items-center justify-center gap-3 shadow-md text-lg"
            >
              <LogOut size={24} />
              Log Out
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#00C27A] to-[#00D68F] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-30">
        {/* Navigation removed for desktop */}
      </div>
    </div>
  );
}