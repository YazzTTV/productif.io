"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ArrowLeft, User, Mail, Globe, Moon, Sun, Bell, LogOut, Save, Palette, Lock, Eye, EyeOff } from 'lucide-react'
import { useLocale } from '@/lib/i18n'
import { useTheme } from 'next-themes'
import { useToast } from '@/components/ui/use-toast'

interface UserData {
  id: string
  email: string
  name: string | null
  createdAt: Date
}

export default function ProfileSettingsPage() {
  const router = useRouter()
  const { locale, setLocale, t } = useLocale()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [notifications, setNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/users/me', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setUser(data.user)
          setName(data.user.name || '')
          setEmail(data.user.email || '')
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      toast({
        title: t('success'),
        description: t('nameUpdatedSuccess'),
      })
    } catch (error) {
      toast({
        title: t('error'),
        description: t('unableToUpdateName'),
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Note: Avatar upload functionality not yet implemented
  // The avatar field is not in the Prisma schema

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword || !currentPassword) {
      toast({
        title: t('error'),
        description: isFr ? 'Veuillez remplir tous les champs' : 'Please fill all fields',
        variant: 'destructive',
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: t('error'),
        description: isFr ? 'Les nouveaux mots de passe ne correspondent pas' : 'New passwords do not match',
        variant: 'destructive',
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: t('error'),
        description: isFr ? 'Le mot de passe doit contenir au moins 8 caractères' : 'Password must be at least 8 characters',
        variant: 'destructive',
      })
      return
    }

    setChangingPassword(true)
    try {
      const response = await fetch('/api/user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur lors de la mise à jour' }))
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du mot de passe')
      }

      toast({
        title: t('success'),
        description: t('passwordUpdated'),
      })

      // Reset form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || (isFr ? 'Erreur lors de la mise à jour du mot de passe' : 'Error updating password'),
        variant: 'destructive',
      })
    } finally {
      setChangingPassword(false)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      if (response.ok) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

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

  const isFr = locale === 'fr'
  const currentTheme = (mounted && theme) || 'light'

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C27A] mx-auto mb-4"></div>
          <p className="text-gray-600">{isFr ? 'Chargement...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Back Button */}
        <motion.button
          onClick={() => router.back()}
          whileHover={{ scale: 1.02, x: -2 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-gray-600 hover:text-[#00C27A] transition-colors mb-6 group"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-[#00C27A]/10 flex items-center justify-center transition-colors">
            <ArrowLeft size={20} className="group-hover:text-[#00C27A]" />
          </div>
          <span className="text-lg">{isFr ? 'Retour' : 'Back'}</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-gray-900 text-4xl font-bold">{t('profileSettings')}</h1>
          <p className="text-gray-600 mt-2">{isFr ? 'Gérez vos informations personnelles' : 'Manage your personal information'}</p>
        </motion.div>

        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Avatar & Name Section */}
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-full flex items-center justify-center text-white shadow-lg text-3xl font-bold">
                    <span>{getInitials(name, email)}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm mb-2 font-medium">{t('name')}</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00C27A]/20 focus:border-[#00C27A] transition-all"
                      placeholder={t('yourName')}
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm mb-2 font-medium">{t('email')}</label>
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
                      <Mail size={18} className="text-gray-400" />
                      <span className="text-gray-600">{email}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{isFr ? 'L\'email ne peut pas être modifié' : 'Email cannot be changed'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <motion.button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                whileHover={{ scale: saving ? 1 : 1.02 }}
                whileTap={{ scale: saving ? 1 : 0.98 }}
                className="w-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <Save size={20} className="relative z-10" />
                <span className="relative z-10">
                  {saving 
                    ? (isFr ? 'Enregistrement...' : 'Saving...')
                    : (isFr ? 'Enregistrer les modifications' : 'Save changes')}
                </span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Preferences Section */}
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
                  onClick={() => setLocale('fr')}
                  className={`flex-1 py-3 px-4 rounded-full border-2 transition-all text-base ${
                    locale === 'fr' 
                      ? 'border-[#00C27A] bg-[#00C27A]/5 text-[#00C27A] font-medium' 
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Français
                </button>
                <button
                  onClick={() => setLocale('en')}
                  className={`flex-1 py-3 px-4 rounded-full border-2 transition-all text-base ${
                    locale === 'en' 
                      ? 'border-[#00C27A] bg-[#00C27A]/5 text-[#00C27A] font-medium' 
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  English
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
                  onClick={() => setTheme('light')}
                  className={`flex-1 py-3 px-4 rounded-full border-2 transition-all text-base flex items-center justify-center gap-2 ${
                    currentTheme === 'light' 
                      ? 'border-[#00C27A] bg-[#00C27A]/5 text-[#00C27A] font-medium' 
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Sun size={18} />
                  {t('light')}
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-1 py-3 px-4 rounded-full border-2 transition-all text-base flex items-center justify-center gap-2 ${
                    currentTheme === 'dark' 
                      ? 'border-[#00C27A] bg-[#00C27A]/5 text-[#00C27A] font-medium' 
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Moon size={18} />
                  {t('dark')}
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="p-7 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Bell className="text-[#00C27A]" size={24} />
                  <span className="text-gray-900 text-lg">{t('notifications')}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">{t('emailNotifications')}</span>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`w-14 h-7 rounded-full transition-all duration-300 relative ${
                      emailNotifications ? 'bg-[#00C27A]' : 'bg-gray-300'
                    }`}
                  >
                    <motion.div
                      className="w-5 h-5 bg-white rounded-full absolute top-1 shadow-md"
                      animate={{ x: emailNotifications ? 28 : 4 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">{t('taskReminders')}</span>
                  <button
                    onClick={() => setPushNotifications(!pushNotifications)}
                    className={`w-14 h-7 rounded-full transition-all duration-300 relative ${
                      pushNotifications ? 'bg-[#00C27A]' : 'bg-gray-300'
                    }`}
                  >
                    <motion.div
                      className="w-5 h-5 bg-white rounded-full absolute top-1 shadow-md"
                      animate={{ x: pushNotifications ? 28 : 4 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Password Change Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-10"
        >
          <h3 className="text-gray-700 mb-4 text-lg font-semibold">{t('changePassword')}</h3>
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-7 space-y-5">
              {/* Current Password */}
              <div>
                <label className="block text-gray-700 text-sm mb-2 font-medium">{t('currentPassword')}</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00C27A]/20 focus:border-[#00C27A] transition-all"
                    placeholder={t('currentPassword')}
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-gray-700 text-sm mb-2 font-medium">{t('newPassword')}</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00C27A]/20 focus:border-[#00C27A] transition-all"
                    placeholder={t('newPassword')}
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">{isFr ? 'Minimum 8 caractères' : 'Minimum 8 characters'}</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-gray-700 text-sm mb-2 font-medium">{t('confirmNewPassword')}</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00C27A]/20 focus:border-[#00C27A] transition-all"
                    placeholder={t('confirmNewPassword')}
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Change Password Button */}
              <motion.button
                onClick={handlePasswordChange}
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                whileHover={{ scale: changingPassword ? 1 : 1.02 }}
                whileTap={{ scale: changingPassword ? 1 : 0.98 }}
                className="w-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden mt-4"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <Lock size={20} className="relative z-10" />
                <span className="relative z-10">
                  {changingPassword 
                    ? (isFr ? 'Changement en cours...' : 'Changing...')
                    : (isFr ? 'Changer le mot de passe' : 'Change password')}
                </span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <h3 className="text-gray-700 mb-4 text-lg font-semibold">{t('accountInfo')}</h3>
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-7">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('memberSince')}</span>
                  <span className="text-gray-900 font-medium">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            onClick={handleLogout}
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

