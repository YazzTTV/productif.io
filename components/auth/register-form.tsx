"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Building2, Mail, Lock, User, ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isCompanyAccount, setIsCompanyAccount] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [companyName, setCompanyName] = useState("")
  const [companyDescription, setCompanyDescription] = useState("")
  const [errors, setErrors] = useState({ name: '', email: '', password: '', companyName: '' })

  // Récupérer l'email depuis les paramètres URL
  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    // Validation
    let hasError = false
    const newErrors = { name: '', email: '', password: '', companyName: '' }

    if (!name.trim()) {
      newErrors.name = 'Le nom est requis'
      hasError = true
    }

    if (!email.trim()) {
      newErrors.email = 'L\'email est requis'
      hasError = true
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Veuillez entrer un email valide'
      hasError = true
    }

    if (!password) {
      newErrors.password = 'Le mot de passe est requis'
      hasError = true
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
      hasError = true
    }

    if (isCompanyAccount && !companyName.trim()) {
      newErrors.companyName = 'Le nom de l\'entreprise est requis'
      hasError = true
    }

    setErrors(newErrors)

    if (hasError) {
      setIsLoading(false)
      return
    }

    const finalCompanyName = isCompanyAccount ? companyName : undefined
    const finalCompanyDescription = isCompanyAccount ? companyDescription : undefined

    try {
      // Inscription
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: name.trim(), 
          email: email.trim().toLowerCase(), 
          password,
          company: isCompanyAccount ? { name: finalCompanyName, description: finalCompanyDescription } : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'inscription")
      }

      // Attendre un peu pour s'assurer que l'utilisateur est bien créé dans la base
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Connexion automatique après l'inscription
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password 
        }),
      })

      const loginData = await loginResponse.json()

      if (!loginResponse.ok) {
        console.error("Erreur connexion automatique:", loginData)
        // Ne pas bloquer l'utilisateur, il pourra se connecter manuellement
        // Rediriger quand même vers l'onboarding
        const urlParams = new URLSearchParams(window.location.search)
        const redirectPath = urlParams.get('redirect') || '/onboarding'
        console.log('Inscription réussie mais connexion automatique échouée, redirection vers', redirectPath)
        window.location.assign(redirectPath)
        return
      }

      // Rediriger vers l'onboarding ou le dashboard (rechargement complet pour garantir les cookies)
      const urlParams = new URLSearchParams(window.location.search)
      const redirectPath = urlParams.get('redirect') || '/onboarding'
      console.log('Inscription + connexion réussies, redirection vers', redirectPath)
      window.location.assign(redirectPath)

    } catch (error) {
      console.error("Erreur complète:", error)
      setError(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white px-8 py-16 flex flex-col">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
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

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-8 relative z-10"
      >
        <ArrowLeft size={20} />
        <span>Retour</span>
      </motion.button>

      <div className="flex-1 flex flex-col justify-center relative z-10 max-w-md mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
            className="mb-6 relative inline-block"
          >
            <h1 className="text-5xl bg-gradient-to-r from-[#00C27A] to-[#00D68F] bg-clip-text text-transparent" style={{ fontWeight: 700 }}>
              Productif.io
            </h1>
            {/* Sparkles */}
            <motion.span
              className="absolute -top-2 -right-6 text-2xl"
              animate={{
                scale: [0, 1, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 0.3,
              }}
            >
              ✨
            </motion.span>
          </motion.div>
          
          <h1 className="text-gray-800 mb-2 text-3xl font-bold">
            Créer un compte
          </h1>
          
          <p className="text-gray-600">
            Commencez votre parcours vers une productivité maximale
          </p>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Register Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onSubmit={onSubmit}
          className="space-y-4 mb-6"
        >
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-gray-700 text-sm mb-2 ml-1">
              Nom complet
            </label>
            <div className="relative">
              <User size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setErrors({ ...errors, name: '' })
                }}
                placeholder="Votre nom"
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border ${
                  errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
                } focus:outline-none focus:border-[#00C27A] focus:ring-2 focus:ring-[#00C27A]/20 transition-all`}
                disabled={isLoading}
              />
            </div>
            {errors.name && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm mt-1 ml-1"
              >
                {errors.name}
              </motion.p>
            )}
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm mb-2 ml-1">
              Adresse email
            </label>
            <div className="relative">
              <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setErrors({ ...errors, email: '' })
                }}
                placeholder="vous@exemple.com"
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border ${
                  errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
                } focus:outline-none focus:border-[#00C27A] focus:ring-2 focus:ring-[#00C27A]/20 transition-all`}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm mt-1 ml-1"
              >
                {errors.email}
              </motion.p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-gray-700 text-sm mb-2 ml-1">
              Mot de passe
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setErrors({ ...errors, password: '' })
                }}
                placeholder="Entrez votre mot de passe"
                className={`w-full pl-12 pr-12 py-4 rounded-2xl border ${
                  errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
                } focus:outline-none focus:border-[#00C27A] focus:ring-2 focus:ring-[#00C27A]/20 transition-all`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm mt-1 ml-1"
              >
                {errors.password}
              </motion.p>
            )}
          </div>

          {/* Company Account Checkbox */}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="companyAccount"
              checked={isCompanyAccount}
              onCheckedChange={(checked) => setIsCompanyAccount(checked as boolean)}
              disabled={isLoading}
            />
            <Label htmlFor="companyAccount" className="flex items-center gap-2 cursor-pointer">
              <Building2 className="h-4 w-4" />
              Créer un compte entreprise
            </Label>
          </div>

          {/* Company Fields */}
          {isCompanyAccount && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 border-t pt-4 mt-4"
            >
              <div>
                <label htmlFor="companyName" className="block text-gray-700 text-sm mb-2 ml-1">
                  Nom de l'entreprise
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value)
                    setErrors({ ...errors, companyName: '' })
                  }}
                  placeholder="Nom de votre entreprise"
                  className={`w-full px-4 py-4 rounded-2xl border ${
                    errors.companyName ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
                  } focus:outline-none focus:border-[#00C27A] focus:ring-2 focus:ring-[#00C27A]/20 transition-all`}
                  disabled={isLoading}
                />
                {errors.companyName && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm mt-1 ml-1"
                  >
                    {errors.companyName}
                  </motion.p>
                )}
              </div>

              <div>
                <label htmlFor="companyDescription" className="block text-gray-700 text-sm mb-2 ml-1">
                  Description de l'entreprise (optionnel)
                </label>
                <input
                  id="companyDescription"
                  name="companyDescription"
                  type="text"
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Description de votre entreprise"
                  className="w-full px-4 py-4 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:border-[#00C27A] focus:ring-2 focus:ring-[#00C27A]/20 transition-all"
                  disabled={isLoading}
                />
              </div>
            </motion.div>
          )}
        </motion.form>

        {/* Sign Up Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(0, 194, 122, 0.3)' }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            const form = document.querySelector('form') as HTMLFormElement
            if (form) {
              form.requestSubmit()
            }
          }}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg relative overflow-hidden mb-6"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <span className="relative z-10">{isLoading ? "Création du compte..." : "Créer mon compte"}</span>
          <ArrowRight size={18} className="relative z-10" />
        </motion.button>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-gray-400 text-sm">ou continuer avec</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </motion.div>

        {/* Social Login Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex gap-3 mb-8"
        >
          {/* Apple */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 bg-black text-white py-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
          </motion.button>

          {/* Google */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 bg-white text-gray-800 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm border border-gray-200"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </motion.button>
        </motion.div>

        {/* Login Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center"
        >
          <p className="text-gray-600 text-sm">
            Vous avez déjà un compte ?{' '}
            <Link
              href="/login"
              className="text-[#00C27A] font-medium hover:underline"
            >
              Connectez-vous
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

