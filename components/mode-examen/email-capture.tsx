"use client"

import { useState } from "react"
import { useLocale } from "@/lib/i18n"
import { pageCopy } from "@/app/mode-examen/copy"
import { trackFunnelEvent } from "@/lib/funnel-analytics"

/**
 * Capture d'email de la page /mode-examen.
 *
 * Raison d'etre : tous les CTA de la page pointent vers l'App Store, donc un
 * visiteur sur Android ou sur ordinateur ne peut rien faire et ne laisse
 * aucune trace. C'est le cas de tout le trafic d'un lancement Product Hunt,
 * qui est majoritairement desktop.
 *
 * Deux variantes du meme composant :
 * - `inline`, une ligne sous le CTA principal, pour capter avant le scroll
 * - `section`, un bloc complet en bas de page
 */

type Variant = "inline" | "section"

type Status = "idle" | "loading" | "done" | "error"

export function EmailCapture({
  variant = "section",
  source = "mode-examen",
}: {
  variant?: Variant
  source?: string
}) {
  const { locale } = useLocale()
  const t = pageCopy[locale].emailForm

  const [email, setEmail] = useState("")
  // Champ piege : masque aux humains, rempli par certains robots.
  const [website, setWebsite] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState("")

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (status === "loading") return

    setStatus("loading")
    setMessage("")

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source, website }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setStatus("error")
        setMessage(data.error ?? t.errorGeneric)
        return
      }

      trackFunnelEvent("mode_examen_lead_submit", {
        source,
        variant,
      })
      setStatus("done")
      setEmail("")
    } catch {
      setStatus("error")
      setMessage(t.errorNetwork)
    }
  }

  const isInline = variant === "inline"

  if (status === "done") {
    return (
      <p
        className={
          isInline
            ? "text-sm text-[#16a34a]"
            : "text-base text-[#16a34a] text-center"
        }
      >
        {t.success}
      </p>
    )
  }

  const form = (
    <form
      onSubmit={handleSubmit}
      className={
        isInline
          ? "relative flex flex-col sm:flex-row items-stretch gap-2 w-full max-w-md"
          : "relative flex flex-col sm:flex-row items-stretch gap-3 w-full max-w-lg mx-auto"
      }
    >
      {/* Piege a robots. Hors flux et invisible, jamais rempli par un humain. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={website}
        onChange={(event) => setWebsite(event.target.value)}
        className="absolute w-px h-px -left-[9999px] opacity-0"
      />

      <label htmlFor={`email-${variant}`} className="sr-only">
        {t.label}
      </label>
      <input
        id={`email-${variant}`}
        type="email"
        required
        inputMode="email"
        autoComplete="email"
        placeholder={t.placeholder}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="flex-1 px-5 py-3.5 rounded-2xl border border-black/[0.12] bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 transition-colors"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-6 py-3.5 rounded-2xl bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
      >
        {status === "loading" ? t.sending : t.submit}
      </button>
    </form>
  )

  if (isInline) {
    return (
      <div className="w-full max-w-md">
        <p className="text-sm text-gray-500 mb-3">
          {pageCopy[locale].emailInline.prompt}
        </p>
        {form}
        {status === "error" && <p className="mt-2 text-sm text-red-600">{message}</p>}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-[-0.04em]">
        {pageCopy[locale].emailSection.title}
      </h2>
      <p className="mt-5 text-lg text-gray-600">
        {pageCopy[locale].emailSection.body}
      </p>
      <div className="mt-8">{form}</div>
      {status === "error" && <p className="mt-3 text-sm text-red-600">{message}</p>}
      <p className="mt-4 text-xs text-gray-400">
        {pageCopy[locale].emailSection.note}
      </p>
    </div>
  )
}
