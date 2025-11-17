"use client"

import { Suspense, useEffect, useMemo, useState, type ComponentType } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { signIn } from "next-auth/react"
import { Bot, LayoutDashboard, MessageCircle, ListChecks, Clock, CheckCircle2 } from "lucide-react"

export const dynamic = 'force-dynamic'

type Feature = {
  title: string
  description: string
  insight: string
  image?: string
  icon?: ComponentType<{ className?: string }>
}

const FEATURES: Feature[] = [
  {
    title: "Personal AI agent",
    description:
      "Your virtual coach follows you every day, adapts your plan, and reminds you of your priorities.",
    insight: "You no longer need to think about what to do — the AI does it for you.",
    image: "/dashboard-productif.jpg",
    icon: Bot,
  },
  {
    title: "Performance dashboard",
    description:
      "A single screen to track your productivity level, focus, and progress on your OKRs.",
    insight:
      "Finally, a dashboard that shows if you're really moving forward, not just if you check boxes.",
    image: "/placeholder.jpg",
    icon: LayoutDashboard,
  },
  {
    title: "Real-time tracking with WhatsApp",
    description:
      "Your AI writes to you directly on WhatsApp to help you stay aligned, re-motivate you, or celebrate your wins.",
    insight: "Your coach is literally in your pocket.",
    image: "/placeholder-user.jpg",
    icon: MessageCircle,
  },
  {
    title: "Clear priorities, fast execution",
    description:
      "Quick capture, prioritization, and deadlines; group by projects, assign, track; a 'do task' button → instant focus",
    insight: "",
    image: "/placeholder-logo.png",
    icon: ListChecks,
  },
]

type Questionnaire = {
  mainGoal: string
  role: string
  frustration: string
  whatsappNumber: string
  whatsappConsent: boolean
  language: "fr" | "en"
  diagBehavior?: "details" | "procrastination" | "distraction" | "abandon"
  timeFeeling?: "frustrated" | "tired" | "proud" | "lost"
  phoneHabit?: "enemy" | "twoMinutes" | "farButBack" | "managed"
}

type AuthInfo = {
  isAuthenticated: boolean
  email: string
}

function useAuthInfo() {
  const [auth, setAuth] = useState<AuthInfo>({ isAuthenticated: false, email: "" })

  useEffect(() => {
    let isMounted = true
    const fetchAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          if (isMounted) setAuth({ isAuthenticated: true, email: data.user?.email || "" })
        }
      } catch {
        // noop
      }
    }
    fetchAuth()
    return () => {
      isMounted = false
    }
  }, [])

  return auth
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const offer = searchParams.get("offer") || "early-access"
  const utmParams = useMemo(() => {
    const entries: [string, string][] = []
    searchParams.forEach((v, k) => {
      if (k.startsWith("utm_") || k === "ref") entries.push([k, v])
    })
    return Object.fromEntries(entries)
  }, [searchParams])

  const [step, setStep] = useState<number>(1)
  const [featureIndex, setFeatureIndex] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [emailFallback, setEmailFallback] = useState<string>("")
  const [password, setPassword] = useState<string>("")

  const [answers, setAnswers] = useState<Questionnaire>({
    mainGoal: "",
    role: "",
    frustration: "",
    whatsappNumber: "",
    whatsappConsent: false,
    language: "fr",
  })

  const auth = useAuthInfo()

  useEffect(() => {
    const saved = localStorage.getItem("onboarding_progress")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.step) setStep(parsed.step)
        if (parsed.answers) setAnswers(parsed.answers)
        if (parsed.emailFallback) setEmailFallback(parsed.emailFallback)
      } catch {
        // ignore
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      "onboarding_progress",
      JSON.stringify({ step, answers, emailFallback, offer, utmParams })
    )
  }, [step, answers, emailFallback, offer, utmParams])

  // Si déjà connecté, passer automatiquement à l'étape 2 (sauf si une étape supérieure est déjà sauvegardée)
  useEffect(() => {
    if (auth.isAuthenticated && step === 1) {
      setStep((s) => Math.max(s, 2))
    }
  }, [auth.isAuthenticated, step])

  const next = () => setStep((s) => Math.min(s + 1, 8))
  const prev = () => setStep((s) => Math.max(s - 1, 1))

  const currentEmail = auth.isAuthenticated ? auth.email : emailFallback
  const CurrentIcon = FEATURES[featureIndex]?.icon
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')

  // Étape 4 — Questionnaire interactif
  const [q4Stage, setQ4Stage] = useState<number>(0) // 0=intro, 1..4 questions
  const [q4Selections, setQ4Selections] = useState<Record<number, string>>({})

  const q4Questions = [
    {
      key: "diagBehavior" as const,
      title: "When you work on an important project, you tend to…",
      options: [
        { key: "details", label: "Get lost in the details" },
        { key: "procrastination", label: "Put it off until tomorrow" },
        { key: "distraction", label: "Get distracted by other tasks" },
        { key: "abandon", label: "Start strong… then abandon it" },
      ],
    },
    {
      key: "timeFeeling" as const,
      title: "At the end of your day, you feel rather…",
      options: [
        { key: "frustrated", label: "Frustrated that you didn't do enough" },
        { key: "tired", label: "Tired without knowing why" },
        { key: "proud", label: "Proud but without a clear vision" },
        { key: "lost", label: "Completely lost in your priorities" },
      ],
    },
    {
      key: "phoneHabit" as const,
      title: "Your phone while you work is…",
      options: [
        { key: "enemy", label: "My worst enemy" },
        { key: "twoMinutes", label: "I open it 'just for 2 minutes'… then 2 hours pass" },
        { key: "farButBack", label: "I put it away but end up picking it back up" },
        { key: "managed", label: "I've learned to manage it" },
      ],
      analysis: "You're not alone: 92% of Productif.io users have this problem before starting.",
    },
    {
      key: "mainGoal" as const,
      title: "What is your main goal today?",
      options: [
        { key: "Launch", label: "Launch / grow my project" },
        { key: "Study", label: "Better manage my studies" },
        { key: "Discipline", label: "Be more disciplined" },
        { key: "Balance", label: "Find a balance between work and personal life" },
      ],
    },
  ]

  const handleQ4Select = (stage: number, key: string, label: string) => {
    setQ4Selections((prev) => ({ ...prev, [stage]: key }))
    const idx = stage - 1
    const meta = q4Questions[idx]
    if (!meta) return
    setAnswers((prev) => {
      const updated = { ...prev }
      if (meta.key === "diagBehavior") updated.diagBehavior = key as any
      if (meta.key === "timeFeeling") updated.timeFeeling = key as any
      if (meta.key === "phoneHabit") updated.phoneHabit = key as any
      if (meta.key === "mainGoal") updated.mainGoal = label
      return updated
    })
  }

  // Determine a dynamic profile from answers (English labels + emoji)
  const getProfileMeta = (q: Questionnaire): { label: string; emoji: string } => {
    if (q.diagBehavior === "distraction") return { label: "The determined distractor", emoji: "💭" }
    if (q.diagBehavior === "details") return { label: "The overwhelmed strategist", emoji: "🔥" }
    if (q.timeFeeling === "lost" || q.diagBehavior === "abandon") return { label: "The disorganized dreamer", emoji: "🌀" }
    return { label: "The motivated organizer", emoji: "🚀" }
  }

  // Écran de configuration (chargement 4s)
  const [setupDone, setSetupDone] = useState<boolean>(false)
  useEffect(() => {
    if (step === 7) {
      setSetupDone(false)
      const t = setTimeout(() => setSetupDone(true), 4000)
      return () => clearTimeout(t)
    }
  }, [step])

  // Inscription directe depuis l'onboarding puis connexion automatique
  const handleSignupWithEmail = async () => {
    if (!emailFallback || !password) {
      setError("Email et mot de passe requis")
      return
    }
    setLoading(true)
    setError("")
    try {
      // 1) Tentative de création du compte
      const defaultName = emailFallback.split("@")[0] || "Utilisateur"
      const registerResp = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: defaultName, email: emailFallback, password })
      })

      // 2) Si l'email existe déjà (409), on passe directement au login
      if (!registerResp.ok && registerResp.status !== 409) {
        const data = await registerResp.json().catch(() => ({}))
        throw new Error(data.error || "Impossible de créer le compte")
      }

      // 3) Connexion
      const loginResp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailFallback, password })
      })
      if (!loginResp.ok) {
        const data = await loginResp.json().catch(() => ({}))
        throw new Error(data.error || "Connexion automatique échouée")
      }

      // 4) Sauvegarder progression et recharger sur /onboarding (pour prendre le cookie en compte)
      try {
        const saved = JSON.parse(localStorage.getItem("onboarding_progress") || "{}")
        localStorage.setItem(
          "onboarding_progress",
          JSON.stringify({ ...saved, step: 2, emailFallback })
        )
      } catch {}
      window.location.assign("/onboarding")
    } catch (e: any) {
      setError(e?.message || "Erreur inconnue lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotificationPrefs = async () => {
    if (!auth.isAuthenticated || !answers.whatsappConsent || !answers.whatsappNumber) return
    try {
      await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "self",
          isEnabled: true,
          emailEnabled: true,
          pushEnabled: false,
          whatsappEnabled: true,
          whatsappNumber: answers.whatsappNumber,
          startHour: 9,
          endHour: 18,
          allowedDays: [1, 2, 3, 4, 5],
          notificationTypes: ["DAILY_SUMMARY", "TASK_DUE", "HABIT_REMINDER"],
          morningReminder: true,
          taskReminder: true,
          habitReminder: true,
          motivation: true,
          dailySummary: true,
          morningTime: "08:00",
          noonTime: "12:00",
          afternoonTime: "14:00",
          eveningTime: "18:00",
          nightTime: "22:00",
        }),
        credentials: "include",
      })
    } catch {
      // ignore errors for now
    }
  }

  const handleStartPayment = async () => {
    if (!currentEmail) {
      setError("Email requis pour continuer")
      return
    }

    setLoading(true)
    setError("")
    try {
      // Récupérer l'ID utilisateur depuis l'auth
      const resp = await fetch("/api/auth/me")
      if (!resp.ok) throw new Error("Non authentifié")
      const { user } = await resp.json()
      
      if (!user?.id) {
        throw new Error("Utilisateur non trouvé")
      }

      // Créer la session Stripe avec le bon billing cycle
      const stripeResp = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user.id,
          billingType: billingCycle 
        }),
      })
      
      if (!stripeResp.ok) {
        const data = await stripeResp.json().catch(() => ({}))
        throw new Error(data.error || "Erreur lors de la création du paiement")
      }
      
      const data = await stripeResp.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (e: any) {
      setError(e?.message || "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteFreeWaitlist = async () => {
    if (!currentEmail) {
      setError("Email requis pour continuer")
      return
    }
    setLoading(true)
    setError("")
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentEmail, step: 1 }),
      })
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentEmail,
          phone: answers.whatsappNumber || undefined,
          motivation: answers.mainGoal || "onboarding-waitlist",
          step: 2,
        }),
      })
      setStep(6)
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'inscription à la waitlist")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          {/* Header avec logo (agrandi, sans texte) */}
          <div className="flex items-center justify-center mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/P_tech_letter_logo_TEMPLATE-removebg-preview.png" alt="Productif.io" className="h-16 w-auto object-contain" />
          </div>
          <CardTitle>
            {step === 1 && ""}
            {step === 2 && "Discover the key features"}
            {step === 3 && "What people say"}
            {step === 4 && ""}
            {step === 5 && (offer === "early-access" ? "Early access" : "Join the waitlist")}
            {step === 6 && ""}
            {step === 7 && ""}
            {step === 8 && ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              {auth.isAuthenticated ? (
                <></>
              ) : (
                <div className="space-y-5">
                  

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
                  >
                    Continue with Google
                  </Button>

                  <div className="flex items-center gap-2">
                    <Separator className="flex-1" />
                    <span className="text-[11px] text-muted-foreground">OR</span>
                    <Separator className="flex-1" />
                  </div>

                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={emailFallback}
                        onChange={(e) => setEmailFallback(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  <Button
                    className="w-full"
                    onClick={handleSignupWithEmail}
                    disabled={loading}
                  >
                    {loading ? "Creating account…" : "Sign up with email"}
                  </Button>
                  </div>

                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account? {""}
                    <Link href="/login?redirect=/onboarding" className="underline underline-offset-4">Sign in</Link>
                  </p>

                  <p className="text-[11px] text-muted-foreground text-center">
                    By continuing, you agree to our {""}
                    <Link href="/terms" className="underline underline-offset-4">Terms of Use</Link> {""}
                    and our {""}
                    <Link href="/privacy-policy" className="underline underline-offset-4">Privacy Policy</Link>.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 items-center">
                <div className="order-2 md:order-1 text-center md:text-left">
                  <h3 className="text-xl font-semibold">{FEATURES[featureIndex].title}</h3>
                  <p className="mt-2 text-muted-foreground">{FEATURES[featureIndex].description}</p>
                  {FEATURES[featureIndex].insight && (
                    <p className="mt-2 text-sm italic">“{FEATURES[featureIndex].insight}”</p>
                  )}
                </div>
                <div className="order-1 md:order-2">
                  <div className="w-full flex items-center justify-center">
                    <div className="h-28 w-28 rounded-full bg-emerald-50 border border-emerald-100 grid place-items-center text-emerald-600">
                      {CurrentIcon ? (
                        <CurrentIcon className="h-14 w-14" />
                      ) : (
                        <span className="text-2xl">✨</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setFeatureIndex((i) => Math.max(0, i - 1))}
                  disabled={featureIndex === 0}
                >
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">{featureIndex + 1} / {FEATURES.length}</div>
                <Button
                  onClick={() => {
                    if (featureIndex < FEATURES.length - 1) {
                      setFeatureIndex((i) => i + 1)
                    } else {
                      next()
                    }
                  }}
                >
                  {featureIndex < FEATURES.length - 1 ? "Continue" : "Next"}
                </Button>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={prev}>Back</Button>
                <Button onClick={next}>Skip</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Testimonial 1 */}
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/testimonials/benjamin-courdrais.jpg" alt="Alex" className="h-9 w-9 rounded-full object-cover" />
                    <div>
                      <div className="text-sm font-medium">Alex</div>
                      <div className="text-xs text-muted-foreground">Maker</div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6">“I finally have a real co‑pilot that keeps me aligned.”</p>
                </div>

                {/* Testimonial 2 */}
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/testimonials/gaetan-silgado.jpg" alt="Léa" className="h-9 w-9 rounded-full object-cover" />
                    <div>
                      <div className="text-sm font-medium">Léa</div>
                      <div className="text-xs text-muted-foreground">Manager</div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6">“The dashboard showed me where I was truly blocked.”</p>
                </div>

                {/* Testimonial 3 */}
                <div className="rounded-2xl border bg-white p-4 shadow-sm sm:col-span-2">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/testimonials/sabrina.jpg" alt="Sabrina" className="h-9 w-9 rounded-full object-cover" />
                    <div>
                      <div className="text-sm font-medium">Sabrina</div>
                      <div className="text-xs text-muted-foreground">Entrepreneur</div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6">“The AI nudges me at the right time and I execute faster.”</p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={prev}>Back</Button>
                <Button onClick={next}>Continue</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              {q4Stage === 0 && (
                <div className="text-center space-y-5">
                  <h3 className="text-xl font-semibold">Discover your productivity profile.</h3>
                  <p className="text-sm text-muted-foreground">Answer 4 questions to find out why you're not moving forward… and how Productif.io can help you skyrocket your results.</p>
                  <div className="mx-auto max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6">
                    <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-white shadow-sm grid place-items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/P_tech_letter_logo_TEMPLATE-removebg-preview.png" alt="Productif.io" className="h-10 w-auto object-contain" />
                    </div>
                    <div className="text-base font-semibold text-emerald-700">A few quick questions to understand your habits</div>
                    <div className="mt-2 flex items-center justify-center gap-2 text-sm text-emerald-800">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span>Estimated time: 1 minute</span>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button onClick={() => setQ4Stage(1)} className="bg-emerald-500 hover:bg-emerald-600">Let's go</Button>
                  </div>
                </div>
              )}

              {q4Stage >= 1 && q4Stage <= 4 && (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">Question {q4Stage} / 4</div>
                  <h4 className="text-lg font-medium">{q4Questions[q4Stage - 1].title}</h4>
                  <div className="grid gap-3">
                    {q4Questions[q4Stage - 1].options.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => handleQ4Select(q4Stage, opt.key, opt.label)}
                        className={`text-left rounded-lg border px-4 py-3 hover:bg-emerald-50 transition ${q4Selections[q4Stage] === opt.key ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {q4Stage === 3 && (
                    <div className="text-xs text-muted-foreground bg-gray-50 border rounded-md p-2">You're not alone: 92% of Productif.io users have this problem before starting.</div>
                  )}
                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={() => setQ4Stage((s) => Math.max(1, s - 1))}>Back</Button>
                    <Button onClick={() => (q4Stage < 4 ? setQ4Stage((s) => Math.min(4, s + 1)) : setStep(6))}>
                      {q4Stage < 4 ? "Continue" : "Next"}
                    </Button>
                  </div>
                </div>
              )}

            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              {offer === "early-access" ? (
                <>
                  <p className="text-sm text-muted-foreground">Accès anticipé pour 1€ — Places limitées.</p>
                  <Button disabled={loading} onClick={handleStartPayment}>{loading ? "Redirection…" : "Payer 1€ maintenant"}</Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Rejoindre la waitlist gratuitement.</p>
                  <Button disabled={loading} onClick={handleCompleteFreeWaitlist}>{loading ? "Validation…" : "Rejoindre"}</Button>
                </>
              )}
              <div className="flex justify-between">
                <Button variant="ghost" onClick={prev}>Retour</Button>
                <Button variant="outline" onClick={() => router.push("/")}>Plus tard</Button>
              </div>
            </div>
          )}

          {/* Étape 6 — Révélation du profil */}
          {step === 6 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto max-w-sm rounded-2xl border bg-white p-6 shadow-sm">
                {(() => { const meta = getProfileMeta(answers); return (
                  <>
                    <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-emerald-50 border border-emerald-100 grid place-items-center text-2xl">
                      <span>{meta.emoji}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Your profile</div>
                    <div className="mt-1 text-2xl font-semibold">{meta.label} {meta.emoji}</div>
                  </>
                )})()}
                <p className="mt-3 text-sm text-muted-foreground">Based on your answers, we’ll tailor your interface and priorities for faster execution.</p>
              </div>
              <div className="flex justify-end">
                <Button onClick={next}>Next</Button>
              </div>
            </div>
          )}

          {/* Étape 7 — Configuration (loading 4s) */}
          {step === 7 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto max-w-sm rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-500"></div>
                  <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-500 [animation-delay:150ms]"></div>
                  <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-500 [animation-delay:300ms]"></div>
                </div>
                <div className="mt-3 text-base font-medium">
                  {setupDone ? (
                    <span className="inline-flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 className="h-5 w-5" /> Setup complete
                    </span>
                  ) : (
                    <>One moment, we’re setting up your workspace…</>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Personalizing habits, priorities, and notifications.</p>
              </div>
              {setupDone && (
                <div className="flex justify-end">
                  <Button onClick={next}>Next</Button>
                </div>
              )}
            </div>
          )}

          {/* Étape 8 — Fin / Call-to-actions */}
          {step === 8 && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">Activate your assistant now — 7‑day free trial</h3>
                <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                  You’ve got the energy and ambition. Your biggest blocker is clarity and structure. Productif.io helps you turn chaos into focus with your personal AI assistant.
                </p>
              </div>

              <div className="mx-auto w-full max-w-2xl rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-center mb-4 gap-2">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1.5 text-sm rounded-full border ${billingCycle === 'monthly' ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 text-gray-700'}`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-3 py-1.5 text-sm rounded-full border ${billingCycle === 'yearly' ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 text-gray-700'}`}
                  >
                    Yearly (-€60)
                  </button>
                </div>

                <div className="text-center space-y-1">
                  {billingCycle === 'monthly' ? (
                    <div className="text-3xl font-bold">€14.99<span className="text-base font-medium">/mo</span></div>
                  ) : (
                    <div className="text-3xl font-bold">€9.99<span className="text-base font-medium">/mo</span>
                      <span className="ml-2 text-xs inline-block rounded bg-green-100 text-green-700 px-2 py-0.5">save €60</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">Billed {billingCycle === 'monthly' ? 'monthly' : 'yearly'}</div>
                </div>

                <ul className="mt-6 space-y-3 text-sm text-gray-700 max-w-md mx-auto text-left">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong className="text-gray-900">AI-powered task management</strong> — Your AI organizes, prioritizes, and suggests what to tackle next.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong className="text-gray-900">WhatsApp AI assistant</strong> — Smart reminders and guidance without opening another app.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong className="text-gray-900">Habits & goals that stick</strong> — Build adaptive routines with contextual reminders; track OKRs.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong className="text-gray-900">Complete privacy & lifetime updates</strong> — Your data stays yours. Encryption, backups, future updates included.</span>
                  </li>
                </ul>

                <div className="mt-6 grid gap-3 max-w-sm mx-auto">
                  <Button onClick={handleStartPayment} className="bg-green-500 hover:bg-green-600">
                    Start Now for Free
                  </Button>
                  <Button variant="outline" onClick={handleStartPayment}>Start</Button>
                  <button onClick={() => router.push('/mon-espace')} className="text-[11px] text-muted-foreground underline underline-offset-4">
                    Skip – continue free trial
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <div className="text-xs text-muted-foreground">Step {step} / 8</div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center p-8">Chargement…</div>}>
      <OnboardingContent />
    </Suspense>
  )
}


