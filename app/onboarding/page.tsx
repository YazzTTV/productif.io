"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

type Feature = {
  title: string
  description: string
  insight: string
}

const FEATURES: Feature[] = [
  {
    title: "Agent IA personnel",
    description:
      "Ton coach virtuel te suit chaque jour, adapte ton plan et te rappelle tes priorités.",
    insight: "Tu n’as plus besoin de réfléchir à quoi faire, l’IA le fait pour toi.",
  },
  {
    title: "Tableau de bord de performance",
    description:
      "Un seul écran pour suivre ton niveau de productivité, ton focus, et tes progrès sur tes OKRs.",
    insight:
      "Enfin un dashboard qui te montre si tu avances vraiment, pas juste si tu coches des cases.",
  },
  {
    title: "Suivi en temps réel avec WhatsApp",
    description:
      "Ton IA t’écrit directement sur WhatsApp pour t’aider à rester aligné, te remotiver ou célébrer tes wins.",
    insight: "Ton coach est littéralement dans ta poche.",
  },
  {
    title: "Priorités limpides, exécution rapide",
    description:
      "capture rapide, priorisation et échéances; regroupez par projets, assignez, suivez; un bouton ‘faire la tâche’ → focus immédiat",
    insight: "",
  },
]

type Questionnaire = {
  mainGoal: string
  role: string
  frustration: string
  whatsappNumber: string
  whatsappConsent: boolean
  language: "fr" | "en"
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

export default function OnboardingPage() {
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

  const next = () => setStep((s) => Math.min(s + 1, 6))
  const prev = () => setStep((s) => Math.max(s - 1, 1))

  const currentEmail = auth.isAuthenticated ? auth.email : emailFallback

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
      // Step 1: ensure waitlist entry with email
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentEmail, step: 1 }),
      })

      // Step 2: save phone/motivation if provided
      const motivation = answers.mainGoal || "onboarding-early-access"
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentEmail,
          phone: answers.whatsappNumber || undefined,
          motivation,
          step: 2,
        }),
      })

      // Step 3: create Stripe session
      const resp = await fetch("/api/waitlist/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentEmail }),
      })
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}))
        throw new Error(data.error || "Erreur lors de la création du paiement")
      }
      const data = await resp.json()
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
          <CardTitle>
            {step === 1 && "Bienvenue — Authentification"}
            {step === 2 && "Découvre les fonctionnalités clés"}
            {step === 3 && "Ils en parlent"}
            {step === 4 && "Parlons de toi"}
            {step === 5 && (offer === "early-access" ? "Rejoindre pour 1€" : "Rejoindre la waitlist")}
            {step === 6 && "C’est fait 🎉"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              {auth.isAuthenticated ? (
                <p className="text-sm text-muted-foreground">
                  Connecté en tant que <span className="font-medium">{auth.email}</span>
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3">
                    <Label htmlFor="email">Ton email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="toi@exemple.com"
                      value={emailFallback}
                      onChange={(e) => setEmailFallback(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button variant="outline" onClick={() => router.push("/login?redirect=/onboarding")}>Se connecter</Button>
                    <Button variant="outline" onClick={() => router.push("/register?redirect=/onboarding")}>Créer un compte</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Ou continue sans compte avec ton email.</p>
                </div>
              )}
              <div className="flex justify-between">
                <div />
                <Button onClick={next}>Continuer</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold">{FEATURES[featureIndex].title}</h3>
                <p className="mt-2 text-muted-foreground">{FEATURES[featureIndex].description}</p>
                {FEATURES[featureIndex].insight && (
                  <p className="mt-2 text-sm italic">“{FEATURES[featureIndex].insight}”</p>
                )}
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
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-base font-medium">“J’ai enfin un vrai copilote qui me garde aligné.”</p>
                <p className="text-sm text-muted-foreground">— Alex, Maker</p>
              </div>
              <div className="space-y-1">
                <p className="text-base font-medium">“Le dashboard m’a montré où j’étais vraiment bloqué.”</p>
                <p className="text-sm text-muted-foreground">— Léa, Manager</p>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={prev}>Retour</Button>
                <Button onClick={next}>Continuer</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="grid gap-3">
                <Label htmlFor="goal">Objectif principal</Label>
                <Input id="goal" placeholder="Focus, OKR, habitude, carrière…" value={answers.mainGoal} onChange={(e) => setAnswers({ ...answers, mainGoal: e.target.value })} />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="role">Rôle / Profil</Label>
                <Input id="role" placeholder="Étudiant, maker, manager…" value={answers.role} onChange={(e) => setAnswers({ ...answers, role: e.target.value })} />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="frustration">Frustration actuelle</Label>
                <Input id="frustration" placeholder="Procrastination, dispersion, manque de clarté…" value={answers.frustration} onChange={(e) => setAnswers({ ...answers, frustration: e.target.value })} />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="wa">Numéro WhatsApp (E.164)</Label>
                <Input id="wa" placeholder="+33612345678" value={answers.whatsappNumber} onChange={(e) => setAnswers({ ...answers, whatsappNumber: e.target.value })} />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consent" checked={answers.whatsappConsent} onCheckedChange={(v) => setAnswers({ ...answers, whatsappConsent: Boolean(v) })} />
                <Label htmlFor="consent" className="text-sm text-muted-foreground">J’accepte d’être contacté sur WhatsApp</Label>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={prev}>Retour</Button>
                <Button onClick={() => { handleSaveNotificationPrefs(); next() }}>Continuer</Button>
              </div>
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

          {step === 6 && (
            <div className="space-y-4">
              <p>Merci ! On t’envoie bientôt des nouvelles. Tu peux déjà ouvrir WhatsApp:</p>
              <div className="grid gap-3">
                <Button asChild>
                  <a href={`https://wa.me/${encodeURIComponent(answers.whatsappNumber || "")}`} target="_blank" rel="noreferrer">Ouvrir WhatsApp</a>
                </Button>
                <Button variant="outline" onClick={() => router.push("/mon-espace")}>Accéder à mon espace</Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <div className="text-xs text-muted-foreground">Étape {step} / 6</div>
        </CardFooter>
      </Card>
    </div>
  )
}


