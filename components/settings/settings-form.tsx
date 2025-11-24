"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useTheme } from "next-themes"
import { useLocale, Locale } from "@/lib/i18n"
import { 
  Moon, 
  Sun, 
  Bell, 
  Palette, 
  User, 
  HelpCircle, 
  Shield, 
  LogOut, 
  Home,
  Globe
} from "lucide-react"

interface User {
  id: string
  email: string
  name: string | null
  createdAt: Date
}

interface SettingsFormProps {
  user: User
}

export function SettingsForm({ user }: SettingsFormProps) {
  const [name, setName] = useState(user.name || "")
  const [notifications, setNotifications] = useState(true)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')
  const { toast } = useToast()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { locale, setLocale, t } = useLocale()
  const [mounted, setMounted] = useState(false)

  // Éviter le flash de contenu non stylé
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleNameUpdate = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        throw new Error("Error updating")
      }

      toast({
        title: t('success'),
        description: t('nameUpdatedSuccess'),
      })
    } catch (error) {
      toast({
        title: t('error'),
        description: t('unableToUpdateName'),
        variant: "destructive",
      })
    }
  }

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme)
  }

  // Utiliser le thème actuel ou 'light' par défaut
  const currentTheme = (mounted && theme) || 'light'

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Back to Home Button */}
        <motion.button
          onClick={() => router.push('/dashboard')}
          whileHover={{ scale: 1.02, x: -2 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-gray-600 hover:text-[#00C27A] transition-colors mb-6 group"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-[#00C27A]/10 flex items-center justify-center transition-colors">
            <Home size={20} className="group-hover:text-[#00C27A]" />
          </div>
          <span className="text-lg">{t('backToDashboard')}</span>
        </motion.button>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-gray-900 text-4xl font-bold">{t('settings')}</h1>
        </div>

        {/* Account Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <h3 className="text-gray-700 mb-4 text-lg font-semibold">{t('account')}</h3>
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-full flex items-center justify-center text-white shadow-lg">
                  <span className="text-3xl font-bold">{getInitials(user.name, user.email)}</span>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
                    onBlur={handleNameUpdate}
                    className="text-gray-900 text-xl font-semibold mb-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 w-full"
                    placeholder={t('yourName')}
                  />
                  <p className="text-gray-500 text-base">{user.email}</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => router.push('/dashboard/settings')}
              className="w-full p-7 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <User className="text-[#00C27A]" size={24} />
                <span className="text-gray-900 text-lg">{t('profileSettings')}</span>
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
              <span className="font-medium">{t('eliteAccess')}</span>
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
                    <h3 className="text-white text-2xl font-bold">{t('premiumElite')}</h3>
                    <span className="text-2xl">✨</span>
                  </div>
                  <p className="text-white/90 text-base mb-1">{t('joinTopPerformers')}</p>
                </div>
              </div>
              
              {/* Billing Period Toggle */}
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-1.5 mb-5 border border-white/20 flex gap-1.5">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`flex-1 py-3 px-4 rounded-xl transition-all text-base relative ${
                    billingPeriod === 'monthly'
                      ? 'bg-white text-[#00C27A] shadow-lg font-medium'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {t('monthly')}
                </button>
                <button
                  onClick={() => setBillingPeriod('annual')}
                  className={`flex-1 py-3 px-4 rounded-xl transition-all text-base relative ${
                    billingPeriod === 'annual'
                      ? 'bg-white text-[#00C27A] shadow-lg font-medium'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>{t('annual')}</span>
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
                    <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-[#00C27A] text-xs px-2 py-1 rounded-full shadow-md font-bold">
                      {t('save20')}
                    </span>
                  )}
                </button>
              </div>

              {/* Annual Savings Badge */}
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
                            <p className="text-white text-base font-medium">{t('youSave')}</p>
                            <p className="text-white/70 text-sm">{t('that33Off')}</p>
                          </div>
                        </div>
                        <div className="bg-yellow-400 text-[#00C27A] px-3 py-1.5 rounded-lg text-sm font-bold">
                          {t('bestDeal')}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Limited Spots Indicator */}
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 mb-5 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/90 text-base">{t('limitedSpotsRemaining')}</span>
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
                <p className="text-white/80 text-sm mt-2">{t('only3SpotsLeft')}</p>
              </div>
              
              {/* Exclusive Features */}
              <div className="space-y-3 mb-5">
                {[t('unlimitedAICoaching'), t('prioritySupport247'), t('advancedAnalytics')].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-white/90 text-base">
                    <span className="text-white text-lg">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              
              {/* Dynamic Pricing */}
              <div className="mb-6">
                {billingPeriod === 'monthly' ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-white text-4xl font-bold">€14.99</span>
                      <span className="text-white/80 text-base">/month</span>
                    </div>
                    <p className="text-white/70 text-sm mt-1">{t('flexibleBilling')}</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-white text-4xl font-bold">€9.99</span>
                      <span className="text-white/80 text-base">/month</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-white/70 text-sm">{t('billedAnnually')}</p>
          </div>
                  </>
                )}
          </div>
              
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/pricing')}
                className="w-full bg-white text-[#00C27A] py-5 rounded-full text-lg shadow-xl relative overflow-hidden group font-semibold"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <span className="relative flex items-center justify-center gap-2">
                  <span>
                    {billingPeriod === 'monthly' 
                      ? t('getEliteAccessNow')
                      : t('getAnnualEliteAccess')}
                  </span>
                  <span>→</span>
                </span>
              </motion.button>
              
              <p className="text-white/60 text-sm text-center mt-4">
                {billingPeriod === 'monthly' 
                  ? t('offerExpires24h')
                  : t('annualOfferExpires24h')}
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
          <h3 className="text-gray-700 mb-4 text-lg font-semibold">{t('preferences')}</h3>
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Language Selector */}
            <div className="p-7 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Globe className="text-[#00C27A]" size={24} />
                  <span className="text-gray-900 text-lg">{t('language')}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setLocale('en')}
                  className={`flex-1 py-3 px-4 rounded-full border-2 transition-all text-base ${
                    locale === 'en' 
                      ? 'border-[#00C27A] bg-[#00C27A]/5 text-[#00C27A] font-medium' 
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLocale('fr')}
                  className={`flex-1 py-3 px-4 rounded-full border-2 transition-all text-base ${
                    locale === 'fr' 
                      ? 'border-[#00C27A] bg-[#00C27A]/5 text-[#00C27A] font-medium' 
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Français
                </button>
              </div>
            </div>

            {/* Theme Selector */}
            <div className="p-7 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Palette className="text-[#00C27A]" size={24} />
                  <span className="text-gray-900 text-lg">{t('theme')}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`flex-1 py-3 px-4 rounded-full border-2 transition-all text-base ${
                    currentTheme === 'light' 
                      ? 'border-[#00C27A] bg-[#00C27A]/5 text-[#00C27A] font-medium' 
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Sun size={18} className="inline mr-2" />
                  {t('light')}
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`flex-1 py-3 px-4 rounded-full border-2 transition-all text-base ${
                    currentTheme === 'dark' 
                      ? 'border-[#00C27A] bg-[#00C27A]/5 text-[#00C27A] font-medium' 
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Moon size={18} className="inline mr-2" />
                  {t('dark')}
                </button>
              </div>
            </div>

            {/* Notifications Toggle */}
            <div className="p-7 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Bell className="text-[#00C27A]" size={24} />
                <span className="text-gray-900 text-lg">{t('notifications')}</span>
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
          </div>
        </motion.div>

        {/* Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <h3 className="text-gray-700 mb-4 text-lg font-semibold">SUPPORT</h3>
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
            <button className="w-full p-7 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-4">
                <HelpCircle className="text-[#00C27A]" size={24} />
                <span className="text-gray-900 text-lg">{t('helpSupport')}</span>
              </div>
              <span className="text-gray-400 text-2xl">›</span>
            </button>
            <button className="w-full p-7 text-left hover:bg-gray-50 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Shield className="text-[#00C27A]" size={24} />
                <span className="text-gray-900 text-lg">{t('privacyTerms')}</span>
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
            onClick={async () => {
              try {
                const response = await fetch("/api/auth/logout", {
                  method: "POST",
                  credentials: "include",
                })
                if (response.ok) {
                  router.push("/login")
                }
              } catch (error) {
                console.error("Error during logout:", error)
              }
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-white border-2 border-red-200 text-red-600 py-5 rounded-full hover:bg-red-50 transition-all flex items-center justify-center gap-3 shadow-md text-lg font-medium"
          >
            <LogOut size={24} />
            {t('logOut')}
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
