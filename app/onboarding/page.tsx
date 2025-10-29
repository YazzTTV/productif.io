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
    title: "Agent IA personnel",
    description:
      "Ton coach virtuel te suit chaque jour, adapte ton plan et te rappelle tes priorités.",
    insight: "Tu n’as plus besoin de réfléchir à quoi faire, l’IA le fait pour toi.",
    image: "/dashboard-productif.jpg",
    icon: Bot,
  },
  {
    title: "Tableau de bord de performance",
    description:
      "Un seul écran pour suivre ton niveau de productivité, ton focus, et tes progrès sur tes OKRs.",
    insight:
      "Enfin un dashboard qui te montre si tu avances vraiment, pas juste si tu coches des cases.",
    image: "/placeholder.jpg",
    icon: LayoutDashboard,
  },
  {
    title: "Suivi en temps réel avec WhatsApp",
    description:
      "Ton IA t’écrit directement sur WhatsApp pour t’aider à rester aligné, te remotiver ou célébrer tes wins.",
    insight: "Ton coach est littéralement dans ta poche.",
    image: "/placeholder-user.jpg",
    icon: MessageCircle,
  },
  {
    title: "Priorités limpides, exécution rapide",
    description:
      "capture rapide, priorisation et échéances; regroupez par projets, assignez, suivez; un bouton ‘faire la tâche’ → focus immédiat",
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
      title: "Quand tu travailles sur un projet important, tu as tendance à…",
      options: [
        { key: "details", label: "Te perdre dans les détails" },
        { key: "procrastination", label: "Remettre au lendemain" },
        { key: "distraction", label: "Te disperser sur d’autres tâches" },
        { key: "abandon", label: "Commencer fort… puis abandonner" },
      ],
    },
    {
      key: "timeFeeling" as const,
      title: "À la fin de ta journée, tu te sens plutôt…",
      options: [
        { key: "frustrated", label: "Frustré de ne pas avoir fait assez" },
        { key: "tired", label: "Fatigué sans savoir pourquoi" },
        { key: "proud", label: "Fier mais sans vraie vision claire" },
        { key: "lost", label: "Complètement perdu dans tes priorités" },
      ],
    },
    {
      key: "phoneHabit" as const,
      title: "Ton téléphone pendant que tu bosses, c’est…",
      options: [
        { key: "enemy", label: "Mon pire ennemi" },
        { key: "twoMinutes", label: "Je l’ouvre ‘juste 2 minutes’… puis 2h passent" },
        { key: "farButBack", label: "Je le mets loin mais je finis par le reprendre" },
        { key: "managed", label: "J’ai appris à gérer" },
      ],
      analysis: "Tu n’es pas seul : 92% des utilisateurs de Productif.io ont ce problème avant de commencer.",
    },
    {
      key: "mainGoal" as const,
      title: "Quel est ton objectif principal aujourd’hui ?",
      options: [
        { key: "Launch", label: "Lancer / faire grandir mon projet" },
        { key: "Study", label: "Mieux gérer mes études" },
        { key: "Discipline", label: "Être plus discipliné" },
        { key: "Balance", label: "Trouver un équilibre entre travail et vie perso" },
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

  // Déterminer un profil dynamique à partir des réponses
  const computeProfileName = (q: Questionnaire): string => {
    if (q.diagBehavior === "distraction") return "Le dispersé déterminé 💭"
    if (q.diagBehavior === "details") return "Le stratège débordé 🔥"
    if (q.timeFeeling === "lost" || q.diagBehavior === "abandon") return "Le rêveur désorganisé 🌀"
    return "Le motivé à structurer 🚀"
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
            <img src="/mon-logo.png" alt="Productif.io" className="h-16 w-auto object-contain" />
          </div>
          <CardTitle>
            {step === 1 && "Connexion / Inscription"}
            {step === 2 && "Découvre les fonctionnalités clés"}
            {step === 3 && "Ils en parlent"}
            {step === 4 && "Parlons de toi"}
            {step === 5 && (offer === "early-access" ? "Rejoindre pour 1€" : "Rejoindre la waitlist")}
            {step === 6 && "Ton profil"}
            {step === 7 && "Configuration en cours"}
            {step === 8 && "C’est fait 🎉"}
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
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-9 w-9 rounded-md bg-emerald-500 text-white grid place-items-center font-bold">P</div>
                    <div className="text-lg font-semibold">Productif</div>
                    <p className="text-xs text-muted-foreground text-center">Track, Analyze & Dominate Your Market.</p>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
                  >
                    Continuer avec Google
                  </Button>

                  <div className="flex items-center gap-2">
                    <Separator className="flex-1" />
                    <span className="text-[11px] text-muted-foreground">OU</span>
                    <Separator className="flex-1" />
                  </div>

                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="toi@exemple.com"
                        value={emailFallback}
                        onChange={(e) => setEmailFallback(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Mot de passe</Label>
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
                    {loading ? "Création du compte…" : "S'inscrire avec l'email"}
                  </Button>
                  </div>

                  <p className="text-center text-sm text-muted-foreground">
                    Déjà un compte ? {""}
                    <Link href="/login?redirect=/onboarding" className="underline underline-offset-4">Se connecter</Link>
                  </p>

                  <p className="text-[11px] text-muted-foreground text-center">
                    En continuant, vous acceptez nos {""}
                    <Link href="/terms" className="underline underline-offset-4">Conditions d'utilisation</Link> {""}
                    et notre {""}
                    <Link href="/privacy-policy" className="underline underline-offset-4">Politique de confidentialité</Link>.
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
                  Précédent
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
                  {featureIndex < FEATURES.length - 1 ? "Continuer" : "Suivant"}
                </Button>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={prev}>Retour</Button>
                <Button onClick={next}>Passer</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Témoignage 1 */}
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/testimonials/benjamin-courdrais.jpg" alt="Alex" className="h-9 w-9 rounded-full object-cover" />
                    <div>
                      <div className="text-sm font-medium">Alex</div>
                      <div className="text-xs text-muted-foreground">Maker</div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6">“J’ai enfin un vrai copilote qui me garde aligné.”</p>
                </div>

                {/* Témoignage 2 */}
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/testimonials/gaetan-silgado.jpg" alt="Léa" className="h-9 w-9 rounded-full object-cover" />
                    <div>
                      <div className="text-sm font-medium">Léa</div>
                      <div className="text-xs text-muted-foreground">Manager</div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6">“Le dashboard m’a montré où j’étais vraiment bloqué.”</p>
                </div>

                {/* Témoignage 3 */}
                <div className="rounded-2xl border bg-white p-4 shadow-sm sm:col-span-2">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/testimonials/sabrina.jpg" alt="Sabrina" className="h-9 w-9 rounded-full object-cover" />
                    <div>
                      <div className="text-sm font-medium">Sabrina</div>
                      <div className="text-xs text-muted-foreground">Entrepreneure</div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6">“L’IA me relance au bon moment et j’exécute plus vite.”</p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={prev}>Retour</Button>
                <Button onClick={next}>Continuer</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              {q4Stage === 0 && (
                <div className="text-center space-y-5">
                  <h3 className="text-xl font-semibold">Découvre ton profil de productivité.</h3>
                  <p className="text-sm text-muted-foreground">Réponds à 6 questions pour savoir pourquoi tu n’avances pas… et comment Productif.io peut t’aider à exploser tes résultats.</p>
                  <div className="mx-auto max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6">
                    <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-white shadow-sm grid place-items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/mon-logo.png" alt="Productif.io" className="h-10 w-auto object-contain" />
                    </div>
                    <div className="text-base font-semibold text-emerald-700">Quelques questions rapides pour comprendre tes habitudes</div>
                    <div className="mt-2 flex items-center justify-center gap-2 text-sm text-emerald-800">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span>Temps estimé : 1 minute</span>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button onClick={() => setQ4Stage(1)} className="bg-emerald-500 hover:bg-emerald-600">C’est parti</Button>
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
                    <div className="text-xs text-muted-foreground bg-gray-50 border rounded-md p-2">Tu n’es pas seul : 92% des utilisateurs de Productif.io ont ce problème avant de commencer.</div>
                  )}
                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={() => setQ4Stage((s) => Math.max(1, s - 1))}>Retour</Button>
                    <Button onClick={() => (q4Stage < 4 ? setQ4Stage((s) => Math.min(4, s + 1)) : setStep(6))}>
                      {q4Stage < 4 ? "Continuer" : "Suivant"}
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
                <div className="text-sm text-muted-foreground">Ton profil</div>
                <div className="mt-2 text-2xl font-semibold">{computeProfileName(answers)}</div>
                <p className="mt-3 text-sm text-muted-foreground">Basé sur tes réponses, on va adapter ton interface et tes priorités.</p>
              </div>
              <div className="flex justify-end">
                <Button onClick={next}>Suivant</Button>
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
                      <CheckCircle2 className="h-5 w-5" /> Configuration terminée
                    </span>
                  ) : (
                    <>Un instant, nous configurons votre interface…</>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Personnalisation des habitudes, priorités et notifications.</p>
              </div>
              {setupDone && (
                <div className="flex justify-end">
                  <Button onClick={next}>Suivant</Button>
                </div>
              )}
            </div>
          )}

          {/* Étape 8 — Fin / Call-to-actions */}
          {step === 8 && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">Active ton assistant maintenant — 7 jours gratuits</h3>
                <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                  Tu as l’énergie et les ambitions. Mais ton plus gros blocage, c’est la clarté et la structure. Productif.io t’aide à transformer ton chaos en focus grâce à ton assistant IA personnel.
                </p>
              </div>

              <div className="mx-auto w-full max-w-2xl rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-center mb-4 gap-2">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1.5 text-sm rounded-full border ${billingCycle === 'monthly' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-300 text-gray-700'}`}
                  >
                    Mensuel
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-3 py-1.5 text-sm rounded-full border ${billingCycle === 'yearly' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-300 text-gray-700'}`}
                  >
                    Annuel (-60€)
                  </button>
                </div>

                <div className="text-center space-y-1">
                  {billingCycle === 'monthly' ? (
                    <div className="text-3xl font-bold">14,99€<span className="text-base font-medium">/mois</span></div>
                  ) : (
                    <div className="text-3xl font-bold">9,99€<span className="text-base font-medium">/mois</span>
                      <span className="ml-2 text-xs inline-block rounded bg-emerald-100 text-emerald-700 px-2 py-0.5">économise 60€</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">Facturation {billingCycle === 'monthly' ? 'mensuelle' : 'annuelle'}</div>
                </div>

                <div className="mt-5 grid gap-3 max-w-sm mx-auto">
                  <Button onClick={handleStartPayment} className="bg-emerald-600 hover:bg-emerald-700">
                    Active ton assistant maintenant — 7 jours gratuits
                  </Button>
                  <Button variant="outline" onClick={handleStartPayment}>Commencer</Button>
                  <button onClick={() => router.push('/mon-espace')} className="text-[11px] text-muted-foreground underline underline-offset-4">
                    Ignorer – continuer l’essai gratuit
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <div className="text-xs text-muted-foreground">Étape {step} / 8</div>
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


