"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, ShieldOff, Flame, BellRing, ListChecks, LineChart, Check } from "lucide-react"
import { useLocale } from "@/lib/i18n"
import { EmailCapture } from "@/components/mode-examen/email-capture"
import { getAttributedAppUrl, trackFunnelEvent } from "@/lib/funnel-analytics"
import { pageCopy, faqItems, type FeatureId } from "./copy"
import {
  PRICE_MONTHLY,
  PRICE_YEARLY,
  PRICE_YEARLY_PER_MONTH,
  PRICE_YEARLY_BACK_TO_SCHOOL,
  YEARLY_SAVING_PERCENT,
  TRIAL_DAYS,
  BACK_TO_SCHOOL_END_LABEL,
  BACK_TO_SCHOOL_END_LABEL_EN,
  formatEur,
  formatEurEn,
  formatPercent,
  formatPercentEn,
} from "@/lib/pricing"

/**
 * Corps de la page /mode-examen.
 *
 * Separe de page.tsx pour une raison mecanique : `export const metadata` et le
 * JSON-LD exigent un composant serveur, alors que le selecteur de langue exige
 * un composant client. Le serveur garde les metadonnees, le client garde le
 * rendu.
 *
 * Les prix ne sont jamais ecrits ici, ils viennent de lib/pricing.ts, et la
 * copie vient de ./copy.ts.
 */

const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL
const APP_DESTINATION_URL =
  process.env.NEXT_PUBLIC_APPSFLYER_ONELINK_URL || "https://productif.onelink.me/HCEk"

/** Ordre d'affichage des fonctionnalites et icone associee. La copie est
 *  indexee sur ces memes identifiants, donc ajouter une entree ici sans la
 *  traduire ne compile pas. */
const FEATURES: { id: FeatureId; icon: typeof Calendar; signature?: boolean }[] = [
  { id: "exam", icon: Calendar, signature: true },
  { id: "blocking", icon: ShieldOff },
  { id: "day", icon: ListChecks },
  { id: "streak", icon: Flame },
  { id: "reminders", icon: BellRing },
  { id: "progress", icon: LineChart },
]

/** Destination unique de TOUS les CTA de la page : OneLink AppsFlyer avec les
 *  UTM de la page, pour relier le clic web a l'install et au compte cree. */
function CtaLink({
  label,
  className,
  placement = "unknown",
}: {
  label: string
  className: string
  placement?: string
}) {
  const [destinationUrl, setDestinationUrl] = useState(APP_DESTINATION_URL)

  useEffect(() => {
    setDestinationUrl(
      getAttributedAppUrl({
        placement,
        fallbackAppStoreUrl: APP_STORE_URL,
      }),
    )
  }, [placement])

  return (
    <a
      href={destinationUrl}
      target="_blank"
      rel="noopener"
      className={className}
      onClick={() =>
        trackFunnelEvent("mode_examen_app_store_click", {
          placement,
          cta_label: label,
          destination: destinationUrl,
          attribution_provider: "appsflyer",
        })
      }
    >
      {label}
    </a>
  )
}

/** CTA principal, style plein vert. */
function PrimaryCta({
  label,
  className = "",
  placement = "primary",
}: {
  label: string
  className?: string
  placement?: string
}) {
  const base =
    "inline-flex items-center justify-center px-8 py-4 bg-[#16a34a] text-white rounded-3xl font-medium text-base hover:bg-[#15803d] transition-colors duration-200"

  return <CtaLink label={label} className={`${base} ${className}`} placement={placement} />
}

export function ModeExamenContent() {
  const { locale, setLocale } = useLocale()
  const c = pageCopy[locale]
  const isEn = locale === "en"
  const viewTracked = useRef(false)

  useEffect(() => {
    if (viewTracked.current) return
    viewTracked.current = true
    trackFunnelEvent("mode_examen_view", { locale })
  }, [locale])

  // Formatage des montants a l'anglaise ou a la francaise, jamais en dur.
  const eur = isEn ? formatEurEn : formatEur
  const pct = isEn ? formatPercentEn : formatPercent
  const endLabel = isEn ? BACK_TO_SCHOOL_END_LABEL_EN : BACK_TO_SCHOOL_END_LABEL

  const faq = faqItems(locale, {
    monthly: eur(PRICE_MONTHLY),
    yearly: eur(PRICE_YEARLY),
    yearlyPerMonth: eur(PRICE_YEARLY_PER_MONTH),
    trialDays: TRIAL_DAYS,
  })

  return (
    <main className="min-h-screen bg-white">
      {/* ================= HERO ================= */}
      <section className="relative px-6 pt-16 pb-24 md:pt-24">
        {/* Selecteur de langue. Meme forme que celui de la homepage pour que le
            visiteur qui passe d'une page a l'autre le retrouve au meme endroit. */}
        <div className="absolute top-6 right-6 md:top-8 md:right-12">
          <button
            type="button"
            onClick={() => setLocale(isEn ? "fr" : "en")}
            aria-label={isEn ? "Passer en français" : "Switch to English"}
            className="bg-white rounded-2xl px-4 py-2.5 shadow-sm border border-black/[0.05] flex items-center gap-2 hover:bg-gray-50 transition-colors font-medium text-sm text-gray-900"
          >
            <span className={isEn ? "text-gray-500" : "font-semibold"}>FR</span>
            <span className="text-gray-300">/</span>
            <span className={isEn ? "font-semibold" : "text-gray-500"}>EN</span>
          </button>
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-10">
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-black/[0.03]">
              <Image
                src="/icon-new.png"
                alt="productif.io"
                width={64}
                height={64}
                className="w-16 h-16"
                priority
              />
            </div>
          </div>

          <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#16a34a]/20 bg-[#16a34a]/5 text-sm font-medium text-[#16a34a] tracking-tight">
            {c.hero.badge}
          </span>

          <h1 className="mt-8 text-5xl md:text-7xl font-light text-gray-900 tracking-[-0.04em] leading-tight">
            {c.hero.titleLine1}
            <br />
            {c.hero.titleLead}
            <span className="text-[#16a34a]">{c.hero.titleAccent}</span>.
          </h1>

          <p className="mt-8 text-xl md:text-2xl text-gray-600 font-light leading-relaxed max-w-2xl mx-auto">
            {c.hero.subtitle}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <PrimaryCta label={c.hero.ctaPrimary} placement="hero" />
            <Link
              href="#le-systeme"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 rounded-3xl font-medium text-base border border-black/[0.08] hover:bg-gray-50 transition-colors duration-200"
            >
              {c.hero.ctaSecondary}
            </Link>
          </div>

          <p className="mt-8 text-sm text-gray-500">{c.hero.trialNote(TRIAL_DAYS)}</p>

          {/* Rattrapage haut de page : tous les CTA ci-dessus mènent à l'App Store,
              donc un visiteur Android ou sur ordinateur repart sans laisser de trace.
              Ce bloc doit rester visible sans scroller, c'est tout l'intérêt. */}
          <div className="mt-10 flex justify-center">
            <EmailCapture variant="inline" />
          </div>
        </div>
      </section>

      {/* ================= FREIN N1 ================= */}
      <section className="py-24 md:py-32 px-6 bg-[#fafafa] border-y border-black/[0.04]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-[-0.04em]">
            {c.friction.titleLead}
            <span className="text-[#16a34a]">{c.friction.titleAccent}</span>
            {c.friction.titleTail}
          </h2>
          <p className="mt-8 text-lg text-gray-600 leading-relaxed">{c.friction.intro}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-14 text-left">
            {c.friction.items.map((item) => (
              <div
                key={item}
                className="bg-white border border-black/[0.06] rounded-3xl p-6 text-gray-700 text-sm leading-relaxed"
              >
                {item}
              </div>
            ))}
          </div>

          <p className="mt-14 text-lg font-medium text-gray-900">{c.friction.closing}</p>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section id="le-systeme" className="py-24 md:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-[-0.04em] text-center max-w-3xl mx-auto">
            {c.features.title}
          </h2>
          <p className="mt-6 text-center text-gray-600 text-lg max-w-2xl mx-auto">
            {c.features.subtitle}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
            {FEATURES.map(({ id, icon: Icon, signature }) => {
              const feature = c.features.items[id]
              return (
                <div
                  key={id}
                  className={`rounded-3xl p-8 shadow-sm transition-colors ${
                    signature
                      ? "bg-[#16a34a]/[0.04] border-2 border-[#16a34a]/30"
                      : "bg-white border border-[#16a34a]/10 hover:border-[#16a34a]/20"
                  }`}
                >
                  <Icon size={24} strokeWidth={1.5} className="text-[#16a34a] mb-4" />
                  {signature && (
                    <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-[#16a34a] mb-2">
                      {c.features.signatureLabel}
                    </span>
                  )}
                  <h3 className="text-xl font-medium text-gray-900 mb-3 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section className="py-24 md:py-32 px-6 bg-[#fafafa] border-y border-black/[0.04]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-[-0.04em] text-center">
            {c.pricing.title}
          </h2>
          <p className="mt-6 text-center text-gray-600 text-lg">{c.pricing.subtitle}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 items-stretch">
            {/* Gratuit */}
            <div className="bg-white border border-black/[0.06] rounded-3xl p-8 flex flex-col">
              <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-gray-500">
                {c.pricing.freeLabel}
              </h3>
              <div className="mt-4 text-4xl font-light text-gray-900 tracking-tight">
                {c.pricing.freePrice}
              </div>
              <p className="mt-1 text-sm text-gray-500">{c.pricing.freeTagline}</p>
              <ul className="mt-8 space-y-3 flex-1">
                {c.pricing.freeItems.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-gray-700">
                    <Check size={16} className="text-[#16a34a] flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
                <li className="flex gap-3 text-sm text-gray-400">
                  <span className="flex-shrink-0 mt-0.5 w-4 text-center">·</span>
                  {c.pricing.freeExcluded}
                </li>
              </ul>
              <CtaLink
                label={c.pricing.freeCta}
                className="mt-8 inline-flex items-center justify-center px-6 py-3.5 bg-white text-gray-900 rounded-2xl font-medium text-sm border border-black/[0.08] hover:bg-gray-50 transition-colors"
                placement="pricing_free"
              />
            </div>

            {/* Annuel, mis en avant */}
            <div className="relative bg-white border-2 border-[#16a34a] rounded-3xl p-8 flex flex-col shadow-sm">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#16a34a] text-white text-xs font-semibold uppercase tracking-[0.08em] px-4 py-1.5 rounded-full whitespace-nowrap">
                {c.pricing.yearlyBadge}
              </span>
              <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-gray-500">
                {c.pricing.yearlyLabel}
              </h3>
              <div className="mt-4 text-4xl font-light text-gray-900 tracking-tight">
                {eur(PRICE_YEARLY)}
                <span className="text-base text-gray-500 font-normal">{c.pricing.perYear}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {c.pricing.yearlyTagline(eur(PRICE_YEARLY_PER_MONTH), pct(YEARLY_SAVING_PERCENT))}
              </p>
              <ul className="mt-8 space-y-3 flex-1">
                {c.pricing.premiumItems.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-gray-700">
                    <Check size={16} className="text-[#16a34a] flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <PrimaryCta
                label={c.pricing.yearlyCta(TRIAL_DAYS)}
                className="mt-8 !px-6 !py-3.5 !text-sm !rounded-2xl"
                placement="pricing_yearly"
              />
            </div>

            {/* Mensuel */}
            <div className="bg-white border border-black/[0.06] rounded-3xl p-8 flex flex-col">
              <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-gray-500">
                {c.pricing.monthlyLabel}
              </h3>
              <div className="mt-4 text-4xl font-light text-gray-900 tracking-tight">
                {eur(PRICE_MONTHLY)}
                <span className="text-base text-gray-500 font-normal">{c.pricing.perMonth}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">{c.pricing.monthlyTagline}</p>
              <ul className="mt-8 space-y-3 flex-1">
                {c.pricing.monthlyItems(TRIAL_DAYS).map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-gray-700">
                    <Check size={16} className="text-[#16a34a] flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <PrimaryCta
                label={c.pricing.monthlyCta(TRIAL_DAYS)}
                className="mt-8 !px-6 !py-3.5 !text-sm !rounded-2xl !bg-white !text-gray-900 border border-black/[0.08] hover:!bg-gray-50"
                placement="pricing_monthly"
              />
            </div>
          </div>

          {/* Offre de rentrée */}
          <div className="mt-10 bg-white border border-[#16a34a]/30 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-lg font-medium text-gray-900">
                {c.pricing.backToSchoolTitle(eur(PRICE_YEARLY_BACK_TO_SCHOOL), endLabel)}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {c.pricing.backToSchoolNote(eur(PRICE_YEARLY))}
              </p>
            </div>
            <PrimaryCta
              label={c.pricing.backToSchoolCta}
              className="!px-6 !py-3.5 !text-sm !rounded-2xl"
              placement="back_to_school"
            />
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-[-0.04em] text-center mb-14">
            {c.faq.title}
          </h2>

          <div className="space-y-3">
            {faq.map((item) => (
              <details
                key={item.q}
                className="group bg-white border border-black/[0.06] rounded-3xl overflow-hidden"
              >
                <summary className="cursor-pointer list-none px-7 py-5 font-medium text-gray-900 flex items-center justify-between gap-6">
                  {item.q}
                  <span className="text-[#16a34a] text-xl font-light transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="px-7 pb-6 text-gray-600 text-sm leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA FINAL ================= */}
      <section className="py-24 md:py-32 px-6 bg-[#fafafa] border-t border-black/[0.04]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-[-0.04em]">
            {c.finalCta.title}
          </h2>
          <p className="mt-6 text-lg text-gray-600">{c.finalCta.body}</p>
          <div className="mt-10 flex justify-center">
            <PrimaryCta label={c.finalCta.cta} placement="final_cta" />
          </div>
        </div>
      </section>

      {/* ================= CAPTURE EMAIL ================= */}
      <section className="py-24 md:py-32 px-6 border-t border-black/[0.04]">
        <EmailCapture variant="section" />
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="py-10 px-6 border-t border-black/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span className="font-medium text-gray-900">productif.io</span>
          <div className="flex items-center gap-5">
            <Link href="/" className="hover:text-gray-900 transition-colors">
              {c.footer.site}
            </Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">
              {c.footer.terms}
            </Link>
            <Link href="/privacy-policy" className="hover:text-gray-900 transition-colors">
              {c.footer.privacy}
            </Link>
          </div>
          <span>© {new Date().getFullYear()} productif.io</span>
        </div>
      </footer>
    </main>
  )
}
