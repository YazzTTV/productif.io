"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Globe,
  AtSign,
  Users,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  Loader2,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ct, getCreatorLocale, setCreatorLocale } from "@/lib/creator-i18n"

type Locale = "fr" | "en"

const PLATFORMS = [
  { id: "tiktok", label: "TikTok", icon: "🎵" },
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "youtube", label: "YouTube", icon: "🎬" },
  { id: "twitter", label: "X / Twitter", icon: "𝕏" },
  { id: "snapchat", label: "Snapchat", icon: "👻" },
  { id: "other", label: "Autre", icon: "🌐" },
]

const FOLLOWER_RANGES = [
  { id: "0-1k", label: "0 – 1K" },
  { id: "1k-10k", label: "1K – 10K" },
  { id: "10k-50k", label: "10K – 50K" },
  { id: "50k-100k", label: "50K – 100K" },
  { id: "100k-500k", label: "100K – 500K" },
  { id: "500k+", label: "500K+" },
]

const COUNTRIES = [
  "France", "Belgique", "Suisse", "Canada", "Maroc", "Algérie",
  "Tunisie", "Côte d'Ivoire", "Sénégal", "Cameroun", "Autre",
]

interface FormData {
  firstName: string
  email: string
  country: string
  platform: string
  handle: string
  followers: string
  motivation: string
}

const STEPS = [
  { id: "identity", fields: ["firstName", "email", "country"] },
  { id: "creator", fields: ["platform", "handle", "followers"] },
  { id: "motivation", fields: ["motivation"] },
]

const STEP_TITLE_KEYS = [
  "apply.step1.title",
  "apply.step2.title",
  "apply.step3.title",
] as const

export default function CreatorApplyPage() {
  const router = useRouter()
  const [locale, setLocale] = useState<Locale>(getCreatorLocale)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [error, setError] = useState("")
  const [form, setForm] = useState<FormData>({
    firstName: "",
    email: "",
    country: "",
    platform: "",
    handle: "",
    followers: "",
    motivation: "",
  })

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const canProceed = () => {
    const fields = STEPS[step].fields as (keyof FormData)[]
    return fields.every((f) => form[f].trim().length > 0)
  }

  const handleNext = () => {
    if (!canProceed()) return
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (form.motivation.trim().length < 10) {
      setError(ct("apply.motivation.error", locale))
      return
    }
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/creator/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue")
        return
      }

      setSubmitted(true)
    } catch {
      setError(ct("apply.error.connection", locale))
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canProceed()) {
      e.preventDefault()
      handleNext()
    }
  }

  const handleCreateAccount = async () => {
    if (password.length < 6) {
      setPasswordError(ct("apply.password.error", locale))
      return
    }
    setCreatingAccount(true)
    setPasswordError("")

    try {
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.firstName.trim(),
          email: form.email.trim().toLowerCase(),
          password,
          creatorFlow: true,
        }),
      })
      const registerData = await registerRes.json()

      if (!registerRes.ok) {
        setPasswordError(registerData.error || "Erreur lors de la création du compte")
        setCreatingAccount(false)
        return
      }

      await new Promise((r) => setTimeout(r, 500))

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password,
        }),
      })

      if (!loginRes.ok) {
        window.location.assign("/login?redirect=/ambassador")
        return
      }

      window.location.assign("/ambassador")
    } catch {
      setPasswordError(ct("apply.error.connection", locale))
      setCreatingAccount(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-[#16a34a]/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-[#16a34a]" />
            </div>
            <h1 className="text-3xl font-light text-gray-900 tracking-tight mb-3">
              {ct("apply.success.title", locale)}
            </h1>
            <p className="text-gray-500 mb-1">
              {ct("apply.success.thanks", locale)} <span className="font-medium text-gray-700">{form.firstName}</span> !
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
              {ct("apply.success.sub", locale)}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                {ct("apply.email", locale)}
              </label>
              <div className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-500">
                {form.email}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Lock className="h-4 w-4 text-gray-400" />
                {ct("apply.password", locale)}
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setPasswordError("")
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && password.length >= 6) handleCreateAccount()
                  }}
                  placeholder={ct("apply.password.placeholder", locale)}
                  autoFocus
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20 outline-none transition-all text-sm text-gray-900 placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-red-500 text-sm mt-1.5">{passwordError}</p>
              )}
            </div>

            <button
              onClick={handleCreateAccount}
              disabled={password.length < 6 || creatingAccount}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium transition-all text-sm",
                password.length >= 6 && !creatingAccount
                  ? "bg-[#16a34a] text-white hover:bg-[#15803d]"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              {creatingAccount ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {ct("apply.creatingAccount", locale)}
                </>
              ) : (
                <>
                  {ct("apply.createAccount", locale)}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <button
              onClick={() => router.push("/createur")}
              className="w-full px-6 py-3 text-gray-400 hover:text-gray-600 transition-colors text-sm"
            >
              {ct("apply.later", locale)}
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col" onKeyDown={handleKeyDown}>
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Image src="/icon-new.png" alt="Productif.io" width={28} height={28} className="w-7 h-7" />
          <span className="text-sm font-medium text-gray-500">{ct("apply.header", locale)}</span>
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={() => { const newL: Locale = locale === 'fr' ? 'en' : 'fr'; setLocale(newL); setCreatorLocale(newL); }}
            className="flex items-center gap-1.5 text-sm text-gray-400"
          >
            <span className={locale === 'fr' ? 'font-semibold text-gray-700' : ''}>FR</span>
            <span className="text-gray-300">/</span>
            <span className={locale === 'en' ? 'font-semibold text-gray-700' : ''}>EN</span>
          </button>
          <button
            onClick={() => router.push("/createur")}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            {ct("apply.cancel", locale)}
          </button>
        </div>
      </header>

      {/* Progress */}
      <div className="px-6 pb-2">
        <div className="max-w-lg mx-auto flex gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 rounded-full flex-1 transition-colors duration-300",
                i <= step ? "bg-[#16a34a]" : "bg-gray-100"
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step title */}
              <div className="mb-8">
                <div className="flex items-center gap-2 text-xs text-[#16a34a] font-medium mb-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  {ct("apply.step", locale)} {step + 1} {ct("apply.of", locale)} {STEPS.length}
                </div>
                <h2 className="text-2xl font-light text-gray-900 tracking-tight">
                  {ct(STEP_TITLE_KEYS[step], locale)}
                </h2>
              </div>

              {/* Step 1: Identity */}
              {step === 0 && (
                <div className="space-y-5">
                  <Field
                    icon={<User className="h-4 w-4" />}
                    label={ct("apply.firstName", locale)}
                    value={form.firstName}
                    onChange={(v) => updateField("firstName", v)}
                    placeholder={ct("apply.firstName.placeholder", locale)}
                    autoFocus
                  />
                  <Field
                    icon={<Mail className="h-4 w-4" />}
                    label={ct("apply.email", locale)}
                    value={form.email}
                    onChange={(v) => updateField("email", v)}
                    placeholder={ct("apply.email.placeholder", locale)}
                    type="email"
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      {ct("apply.country", locale)}
                    </label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {COUNTRIES.map((c) => (
                        <button
                          key={c}
                          onClick={() => updateField("country", c)}
                          className={cn(
                            "px-3 py-2.5 rounded-xl text-sm font-medium transition-all border",
                            form.country === c
                              ? "bg-[#16a34a] text-white border-[#16a34a]"
                              : "bg-white text-gray-600 border-gray-200 hover:border-[#16a34a]/30"
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Creator profile */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      {ct("apply.platform", locale)}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {PLATFORMS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => updateField("platform", p.id)}
                          className={cn(
                            "px-3 py-3 rounded-xl text-sm font-medium transition-all border flex flex-col items-center gap-1",
                            form.platform === p.id
                              ? "bg-[#16a34a] text-white border-[#16a34a]"
                              : "bg-white text-gray-600 border-gray-200 hover:border-[#16a34a]/30"
                          )}
                        >
                          <span className="text-lg">{p.icon}</span>
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Field
                    icon={<AtSign className="h-4 w-4" />}
                    label={ct("apply.handle", locale)}
                    value={form.handle}
                    onChange={(v) => updateField("handle", v)}
                    placeholder={ct("apply.handle.placeholder", locale)}
                    autoFocus
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      {ct("apply.followers", locale)}
                    </label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {FOLLOWER_RANGES.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => updateField("followers", r.id)}
                          className={cn(
                            "px-3 py-2.5 rounded-xl text-sm font-medium transition-all border",
                            form.followers === r.id
                              ? "bg-[#16a34a] text-white border-[#16a34a]"
                              : "bg-white text-gray-600 border-gray-200 hover:border-[#16a34a]/30"
                          )}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Motivation */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-gray-400" />
                      {ct("apply.motivation.label", locale)}
                    </label>
                    <textarea
                      value={form.motivation}
                      onChange={(e) => updateField("motivation", e.target.value)}
                      placeholder={ct("apply.motivation.placeholder", locale)}
                      className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20 outline-none transition-all text-sm resize-none h-32 text-gray-900 placeholder:text-gray-400"
                      autoFocus
                    />
                    <p className="text-xs text-gray-400 mt-1.5">
                      {form.motivation.length} {ct("apply.motivation.count", locale)}
                    </p>
                  </div>

                  {/* Recap */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">{ct("apply.recap", locale)}</p>
                    <RecapLine label={ct("apply.recap.name", locale)} value={form.firstName} />
                    <RecapLine label={ct("apply.recap.email", locale)} value={form.email} />
                    <RecapLine label={ct("apply.recap.country", locale)} value={form.country} />
                    <RecapLine label={ct("apply.recap.platform", locale)} value={PLATFORMS.find((p) => p.id === form.platform)?.label || form.platform} />
                    <RecapLine label={ct("apply.recap.handle", locale)} value={`@${form.handle}`} />
                    <RecapLine label={ct("apply.recap.followers", locale)} value={FOLLOWER_RANGES.find((r) => r.id === form.followers)?.label || form.followers} />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">
                  {error}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer navigation */}
      <footer className="px-6 py-6">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
              step === 0
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            {ct("apply.back", locale)}
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed() || submitting}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all",
              canProceed() && !submitting
                ? "bg-[#16a34a] text-white hover:bg-[#15803d]"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {ct("apply.submitting", locale)}
              </>
            ) : step === STEPS.length - 1 ? (
              <>
                {ct("apply.submit", locale)}
                <CheckCircle2 className="h-4 w-4" />
              </>
            ) : (
              <>
                {ct("apply.continue", locale)}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  )
}

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus,
}: {
  icon: React.ReactNode
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: string
  autoFocus?: boolean
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <span className="text-gray-400">{icon}</span>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20 outline-none transition-all text-sm text-gray-900 placeholder:text-gray-400"
      />
    </div>
  )
}

function RecapLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-700 font-medium">{value}</span>
    </div>
  )
}
