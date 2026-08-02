"use client"

import React, { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, useInView } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  ArrowUp,
  Star,
  Users,
  TrendingUp,
  Zap,
  Clock,
  CheckCircle2,
  ChevronDown,
  Quote,
  Minus,
  Plus,
} from "lucide-react"
import { ct, getCreatorLocale, setCreatorLocale } from "@/lib/creator-i18n"

function RevealOnScroll({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8, delay }}
    >
      {children}
    </motion.div>
  )
}

const PREMIUM_PRICE = 9.99
const COMMISSION_RATE = 0.5

function EarningsEstimator({ locale }: { locale: "fr" | "en" }) {
  const [referrals, setReferrals] = useState(7)
  const monthlyEarning = referrals * (PREMIUM_PRICE * COMMISSION_RATE)
  const annualEarning = monthlyEarning * 12

  const formatAmount = (n: number) =>
    new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n)

  return (
    <section className="py-24 px-6">
      <div className="max-w-2xl mx-auto">
        <RevealOnScroll>
          <h2 className="text-2xl md:text-3xl font-medium text-gray-900 text-center mb-8">
            {ct("lp.estimator.title", locale)
              .split(/(50%|Productif\.io)/)
              .map((part, i) =>
                part === "50%" || part === "Productif.io" ? (
                  <span key={i} className="text-[#16a34a] font-semibold">{part}</span>
                ) : (
                  part
                )
              )}
          </h2>
        </RevealOnScroll>
        <RevealOnScroll>
          <div className="bg-white rounded-2xl border border-black/[0.04] p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {ct("lp.estimator.cardTitle", locale)}
            </h3>
            <div className="flex items-center gap-3 mb-6">
              <label className="text-sm font-medium text-gray-700 shrink-0">
                {ct("lp.estimator.referrals", locale)}
              </label>
              <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                <input
                  type="number"
                  min={0}
                  value={referrals}
                  onChange={(e) => setReferrals(Math.min(9999, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium text-center"
                />
                <button
                  type="button"
                  onClick={() => setReferrals((n) => Math.max(0, n - 1))}
                  className="w-12 h-12 rounded-full border border-gray-200 bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors shrink-0"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setReferrals((n) => Math.min(9999, n + 1))}
                  className="w-12 h-12 rounded-full bg-[#16a34a] hover:bg-[#15803d] flex items-center justify-center text-white transition-colors shrink-0"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-bold text-gray-900">
                {formatAmount(annualEarning)} € {ct("lp.estimator.perYear", locale)}
              </div>
              <div className="flex items-center gap-1.5 text-[#16a34a] font-medium">
                <ArrowUp className="h-4 w-4" />
                {formatAmount(monthlyEarning)} € {ct("lp.estimator.perMonth", locale)}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {ct("lp.estimator.note", locale)}
            </p>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  )
}

function FAQ({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-black/[0.04]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="text-base font-medium text-gray-900">{question}</span>
        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="pb-5"
        >
          <p className="text-gray-600 leading-relaxed">{answer}</p>
        </motion.div>
      )}
    </div>
  )
}

export default function CreateurPage() {
  const router = useRouter()
  const [locale, setLocale] = useState<"fr" | "en">(getCreatorLocale)

  const testimonials = [
    { quote: ct("lp.t1", locale) },
    { quote: ct("lp.t2", locale) },
    { quote: ct("lp.t3", locale) },
    { quote: ct("lp.t4", locale) },
    { quote: ct("lp.t5", locale) },
    { quote: ct("lp.t6", locale) },
  ]

  const faqs = [
    { question: ct("lp.faq1.q", locale), answer: ct("lp.faq1.a", locale) },
    { question: ct("lp.faq2.q", locale), answer: ct("lp.faq2.a", locale) },
    { question: ct("lp.faq3.q", locale), answer: ct("lp.faq3.a", locale) },
    { question: ct("lp.faq4.q", locale), answer: ct("lp.faq4.a", locale) },
  ]

  const handleCTA = () => {
    router.push("/createur/apply")
  }

  const handleLogin = () => {
    router.push("/ambassador")
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/icon-new.png"
                alt="Productif.io"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="font-medium text-gray-900">Productif.io</span>
            </Link>
            <span className="text-gray-300 mx-1">/</span>
            <span className="text-sm text-[#16a34a] font-medium">Créateurs</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { const newL = locale === 'fr' ? 'en' : 'fr'; setLocale(newL); setCreatorLocale(newL); }}
              className="bg-white rounded-2xl px-4 py-2.5 shadow-sm border border-black/[0.05] flex items-center gap-2 hover:bg-gray-50 transition-colors font-medium text-sm text-gray-900"
            >
              <span className={locale === 'fr' ? 'font-semibold' : 'text-gray-500'}>FR</span>
              <span className="text-gray-300">/</span>
              <span className={locale === 'en' ? 'font-semibold' : 'text-gray-500'}>EN</span>
            </button>
            <button
              onClick={handleLogin}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-black/[0.06] rounded-xl hover:bg-gray-50 transition-colors"
            >
              {ct("lp.mySpace", locale)}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#16a34a]/20 bg-[#16a34a]/5 text-sm font-medium text-[#16a34a] mb-6">
              {ct("lp.badge", locale)}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-light text-gray-900 tracking-[-0.04em] leading-tight mb-6"
          >
            {ct("lp.hero.title1", locale)}{" "}
            <span className="text-[#16a34a] font-medium">Productif.io</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-500 font-light max-w-2xl mx-auto leading-relaxed mb-4"
          >
            {ct("lp.hero.sub", locale)}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-base text-gray-400 max-w-xl mx-auto mb-10"
          >
            {ct("lp.hero.sub2", locale)}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={handleCTA}
              className="group px-8 py-4 bg-[#16a34a] text-white rounded-2xl font-medium text-base hover:bg-[#15803d] transition-colors flex items-center gap-2"
            >
              {ct("lp.cta", locale)}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleLogin}
              className="px-8 py-4 text-gray-700 border border-black/[0.08] rounded-2xl font-medium text-base hover:bg-gray-50 transition-colors"
            >
              {ct("lp.already", locale)}
            </button>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12 text-sm text-gray-500"
          >
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-[#16a34a] fill-[#16a34a]" />
                ))}
              </div>
              <span className="font-medium text-gray-700 ml-1">4.87</span>
            </div>
            <div className="h-4 w-px bg-gray-200 hidden sm:block" />
            <span>{ct("lp.rating", locale)} <span className="font-medium text-gray-700">3 563 000</span> {ct("lp.students", locale)}</span>
          </motion.div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-24 px-6 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-[-0.03em]">
                {ct("lp.value.title1", locale)} <span className="text-[#16a34a]">{ct("lp.value.progress", locale)}</span> {ct("lp.value.andBe", locale)} <span className="text-[#16a34a]">{ct("lp.value.paid", locale)}</span>
              </h2>
              <p className="text-gray-500 mt-4 text-lg max-w-xl mx-auto">
                {ct("lp.value.sub", locale)}
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RevealOnScroll>
              <div className="bg-white rounded-2xl border border-black/[0.04] p-8 shadow-sm h-full">
                <div className="w-12 h-12 rounded-2xl bg-[#16a34a]/10 flex items-center justify-center mb-5">
                  <TrendingUp className="h-6 w-6 text-[#16a34a]" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{ct("lp.commission.title", locale)}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {ct("lp.commission.desc", locale)}
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.1}>
              <div className="bg-white rounded-2xl border border-black/[0.04] p-8 shadow-sm h-full">
                <div className="w-12 h-12 rounded-2xl bg-[#16a34a]/10 flex items-center justify-center mb-5">
                  <Clock className="h-6 w-6 text-[#16a34a]" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{ct("lp.hour.title", locale)}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {ct("lp.hour.desc", locale)}
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.2}>
              <div className="bg-white rounded-2xl border border-black/[0.04] p-8 shadow-sm h-full">
                <div className="w-12 h-12 rounded-2xl bg-[#16a34a]/10 flex items-center justify-center mb-5">
                  <Zap className="h-6 w-6 text-[#16a34a]" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{ct("lp.tracking.title", locale)}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {ct("lp.tracking.desc", locale)}
                </p>
              </div>
            </RevealOnScroll>
          </div>

          {/* Big stat */}
          <RevealOnScroll>
            <div className="mt-16 text-center">
              <div className="inline-flex items-center gap-4 bg-white rounded-2xl border border-black/[0.04] px-8 py-5 shadow-sm">
                <Users className="h-8 w-8 text-[#16a34a]" />
                <div className="text-left">
                  <div className="text-3xl font-semibold text-gray-900 tracking-tight">200+</div>
                  <div className="text-sm text-gray-500">{ct("lp.creators", locale)}</div>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Earnings estimator */}
      <EarningsEstimator locale={locale} />

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-[-0.03em]">
                {ct("lp.howItWorks", locale)}
              </h2>
              <p className="text-gray-500 mt-4 text-lg max-w-lg mx-auto">
                {ct("lp.howItWorks.sub", locale)}
              </p>
            </div>
          </RevealOnScroll>

          <div className="space-y-6">
            {[
              { step: "1", title: ct("lp.step1.title", locale), description: ct("lp.step1.desc", locale) },
              { step: "2", title: ct("lp.step2.title", locale), description: ct("lp.step2.desc", locale) },
              { step: "3", title: ct("lp.step3.title", locale), description: ct("lp.step3.desc", locale) },
              { step: "4", title: ct("lp.step4.title", locale), description: ct("lp.step4.desc", locale) },
            ].map((item, i) => (
              <RevealOnScroll key={item.step} delay={i * 0.1}>
                <div className="flex items-start gap-5 bg-white rounded-2xl border border-black/[0.04] p-6 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-[#16a34a] text-white flex items-center justify-center font-semibold text-sm shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll>
            <div className="text-center mt-12">
              <button
                onClick={handleCTA}
                className="group px-8 py-4 bg-[#16a34a] text-white rounded-2xl font-medium text-base hover:bg-[#15803d] transition-colors inline-flex items-center gap-2"
              >
                {ct("lp.ctaContent", locale)}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center justify-center gap-1.5 mt-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 text-[#16a34a] fill-[#16a34a]" />
                  ))}
                </div>
                <span className="text-xs text-gray-500 ml-1">4.87 — {ct("lp.adopted", locale)}</span>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-[-0.03em] text-center mb-12">
              {ct("lp.testimonials", locale)} <span className="text-[#16a34a]">{ct("lp.creatorsWord", locale)}</span>
            </h2>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <RevealOnScroll key={i} delay={i * 0.05}>
                <div className="bg-white rounded-2xl border border-black/[0.04] p-6 shadow-sm h-full">
                  <Quote className="h-6 w-6 text-[#16a34a]/30 mb-3" />
                  <p className="text-gray-700 leading-relaxed text-sm">
                    &laquo; {t.quote} &raquo;
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <RevealOnScroll>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-[-0.03em] text-center mb-12">
              {ct("lp.faq", locale)}
            </h2>
          </RevealOnScroll>

          <RevealOnScroll>
            <div className="bg-white rounded-2xl border border-black/[0.04] px-8 shadow-sm">
              {faqs.map((faq, i) => (
                <FAQ key={i} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-[#16a34a]">
        <div className="max-w-3xl mx-auto text-center">
          <RevealOnScroll>
            <h2 className="text-3xl md:text-4xl font-light text-white tracking-[-0.03em] mb-4">
              {ct("lp.finalCta.title", locale)}
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto">
              {ct("lp.finalCta.sub", locale)}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleCTA}
                className="group px-8 py-4 bg-white text-[#16a34a] rounded-2xl font-medium text-base hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
              >
                {ct("lp.cta", locale)}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={handleLogin}
                className="px-8 py-4 bg-transparent text-white border border-white/30 rounded-2xl font-medium text-base hover:bg-white/10 transition-colors"
              >
                {ct("lp.mySpace", locale)}
              </button>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-black/[0.04] bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/icon-new.png"
                alt="Productif.io"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <span className="text-sm text-gray-500">
                © {new Date().getFullYear()} Productif.io. {ct("lp.rights", locale)}
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="/privacy-policy" className="hover:text-gray-900 transition-colors">{ct("lp.privacy", locale)}</a>
              <a href="/terms" className="hover:text-gray-900 transition-colors">{ct("lp.terms", locale)}</a>
              <a href="/cgv" className="hover:text-gray-900 transition-colors">{ct("lp.cgv", locale)}</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
