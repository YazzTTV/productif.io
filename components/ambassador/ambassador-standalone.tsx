"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  Users,
  CreditCard,
  TrendingUp,
  DollarSign,
  Copy,
  Check,
  Share2,
  Link2,
  Clock,
  CheckCircle2,
  Wallet,
  ChevronRight,
  RefreshCw,
  Info,
  LogOut,
  ChevronDown,
  Trophy,
  Shield,
  Zap,
  Target,
  Eye,
  Flame,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ct, getCreatorLocale, setCreatorLocale } from "@/lib/creator-i18n"

type Locale = "fr" | "en"

interface AffiliateStats {
  affiliateId: string
  referralLink: string
  referredUsersCount: number
  paidUsersCount: number
  revenueTotal: number
  revenue30d: number
  commissionsPending: number
  commissionsEligible: number
  commissionsPaid: number
}

interface ScoreData {
  score: number
  tier: "bronze" | "silver" | "gold"
  tierLabel: string
  commissionRate: number
  nextTier: "bronze" | "silver" | "gold" | null
  nextTierLabel: string | null
  pointsToNext: number
  breakdown: {
    reach: number
    activity: number
    revenue: number
    trust: number
  }
  thresholds: {
    bronze: number
    silver: number
    gold: number
  }
}

interface Referral {
  id: string
  emailMasked: string
  createdAt: string
  isPremium: boolean
  estimatedRevenue: number
  lastActiveAt: string
  commissionTotal: number
  commissionStatus: string
}

interface ReferralsResponse {
  referrals: Referral[]
  nextCursor: string | null
  total: number
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function AmbassadorStandalone() {
  const router = useRouter()
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [scoreData, setScoreData] = useState<ScoreData | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [referralsTotal, setReferralsTotal] = useState(0)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [locale, setLoc] = useState<Locale>("fr")

  useEffect(() => {
    setLoc(getCreatorLocale())
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/affiliate/me")
      if (res.ok) {
        const data: AffiliateStats = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error("[Ambassador] Erreur stats:", error)
    }
  }, [])

  const fetchScore = useCallback(async () => {
    try {
      const res = await fetch("/api/affiliate/score")
      if (res.ok) {
        const data: ScoreData = await res.json()
        setScoreData(data)
      }
    } catch (error) {
      console.error("[Ambassador] Erreur score:", error)
    }
  }, [])

  const fetchReferrals = useCallback(async (cursor?: string) => {
    try {
      const url = cursor
        ? `/api/affiliate/referrals?cursor=${cursor}`
        : "/api/affiliate/referrals"
      const res = await fetch(url)
      if (res.ok) {
        const data: ReferralsResponse = await res.json()
        if (cursor) {
          setReferrals((prev) => [...prev, ...data.referrals])
        } else {
          setReferrals(data.referrals)
        }
        setNextCursor(data.nextCursor)
        setReferralsTotal(data.total)
      }
    } catch (error) {
      console.error("[Ambassador] Erreur referrals:", error)
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchStats(), fetchScore(), fetchReferrals()])
    setLoading(false)
  }, [fetchStats, fetchScore, fetchReferrals])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchStats(), fetchScore(), fetchReferrals()])
    setRefreshing(false)
  }

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    await fetchReferrals(nextCursor)
    setLoadingMore(false)
  }

  const handleCopy = async () => {
    if (!stats?.referralLink) return
    try {
      await navigator.clipboard.writeText(stats.referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.createElement("input")
      input.value = stats.referralLink
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    if (!stats?.referralLink) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: ct("share.title", locale),
          text: ct("share.text", locale),
          url: stats.referralLink,
        })
      } catch {
        // cancelled
      }
    } else {
      handleCopy()
    }
  }

  const conversionRate =
    stats && stats.referredUsersCount > 0
      ? Math.round((stats.paidUsersCount / stats.referredUsersCount) * 100)
      : 0

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
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
              <span className="font-medium text-gray-900">{ct("amb.title", locale)}</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-black/[0.06] bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              <span className="hidden sm:inline">{ct("amb.refresh", locale)}</span>
            </button>
            <button
              onClick={() => { const newL = locale === 'fr' ? 'en' : 'fr'; setLoc(newL); setCreatorLocale(newL); }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-black/[0.06] bg-white hover:bg-gray-50 transition-colors"
            >
              <span className={locale === 'fr' ? 'font-semibold text-gray-900' : 'text-gray-400'}>FR</span>
              <span className="text-gray-300">/</span>
              <span className={locale === 'en' ? 'font-semibold text-gray-900' : 'text-gray-400'}>EN</span>
            </button>
            <button
              onClick={() => router.push("/api/auth/logout")}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <LogOut className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Welcome */}
            <div>
              <h1 className="text-3xl font-light text-gray-900 tracking-[-0.03em]">
                {ct("amb.welcome1", locale)} <span className="text-[#16a34a] font-medium">{ct("amb.welcome2", locale)}</span>
              </h1>
              <p className="text-gray-500 mt-2 text-lg">
                {ct("amb.commissionText1", locale)}{" "}
                <span className="font-semibold text-gray-700">
                  {scoreData ? `${Math.round(scoreData.commissionRate * 100)}%` : "50%"} {ct("amb.commissionText2", locale)}
                </span>{" "}
                {ct("amb.commissionText3", locale)}
              </p>
            </div>

            {/* APS Score & Tier */}
            {scoreData && <ScoreSection score={scoreData} locale={locale} />}

            {/* Referral Link Card */}
            <div className="bg-white rounded-2xl border border-[#16a34a]/15 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Link2 className="h-5 w-5 text-[#16a34a]" />
                <span className="text-sm font-medium text-[#16a34a]">{ct("amb.referralLink", locale)}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 bg-gray-50 rounded-xl border border-black/[0.04] px-4 py-3 text-sm text-gray-600 font-mono truncate">
                  {stats?.referralLink || ct("amb.loading", locale)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className={cn(
                      "inline-flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-xl transition-all",
                      copied
                        ? "bg-[#16a34a] text-white"
                        : "bg-white border border-black/[0.06] hover:bg-gray-50"
                    )}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? ct("amb.copied", locale) : ct("amb.copy", locale)}
                  </button>
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-xl bg-white border border-black/[0.06] hover:bg-gray-50 transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">{ct("amb.share", locale)}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label={ct("amb.signups", locale)}
                value={String(stats?.referredUsersCount ?? 0)}
                icon={<Users className="h-5 w-5 text-gray-400" />}
                sub={ct("amb.signupsSub", locale)}
              />
              <StatCard
                label={ct("amb.paidUsers", locale)}
                value={String(stats?.paidUsersCount ?? 0)}
                icon={<CreditCard className="h-5 w-5 text-gray-400" />}
                sub={`${conversionRate}% ${ct("amb.conversion", locale)}`}
              />
              <StatCard
                label={ct("amb.totalRevenue", locale)}
                value={formatCurrency(stats?.revenueTotal ?? 0)}
                icon={<TrendingUp className="h-5 w-5 text-gray-400" />}
                sub={ct("amb.sinceStart", locale)}
              />
              <StatCard
                label={ct("amb.revenue30d", locale)}
                value={formatCurrency(stats?.revenue30d ?? 0)}
                icon={<DollarSign className="h-5 w-5 text-gray-400" />}
                sub={ct("amb.last30d", locale)}
              />
            </div>

            {/* Commissions */}
            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-4">{ct("amb.commissions", locale)}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <CommissionCard
                  label={ct("amb.pending", locale)}
                  amount={formatCurrency(stats?.commissionsPending ?? 0)}
                  color="amber"
                  icon={<Clock className="h-4 w-4 text-amber-500" />}
                  sub={ct("amb.pendingSub", locale)}
                />
                <CommissionCard
                  label={ct("amb.available", locale)}
                  amount={formatCurrency(stats?.commissionsEligible ?? 0)}
                  color="green"
                  icon={<CheckCircle2 className="h-4 w-4 text-[#16a34a]" />}
                  sub={ct("amb.availableSub", locale)}
                  highlight
                />
                <CommissionCard
                  label={ct("amb.paid", locale)}
                  amount={formatCurrency(stats?.commissionsPaid ?? 0)}
                  color="gray"
                  icon={<Wallet className="h-4 w-4 text-gray-400" />}
                  sub={ct("amb.paidSub", locale)}
                />
              </div>

              <div className="flex items-start gap-2 mt-3 p-3 rounded-xl bg-gray-100/80 text-xs text-gray-500">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  {ct("amb.commissionInfo", locale)}{" "}
                  {ct("amb.commissionRate", locale)} {scoreData ? `${Math.round(scoreData.commissionRate * 100)}%` : "50%"}.
                </span>
              </div>
            </div>

            {/* Referrals Table */}
            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-4">
                {ct("amb.referrals", locale)} <span className="text-gray-400 font-normal text-sm">({referralsTotal})</span>
              </h2>

              {referrals.length === 0 ? (
                <div className="bg-white rounded-2xl border border-black/[0.04] p-16 text-center">
                  <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="font-medium text-gray-900 mb-1">{ct("amb.noReferrals.title", locale)}</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    {ct("amb.noReferrals.desc", locale)}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-black/[0.04] bg-gray-50/50">
                          <th className="text-left font-medium text-gray-500 p-4 text-xs uppercase tracking-wider">{ct("amb.email", locale)}</th>
                          <th className="text-left font-medium text-gray-500 p-4 text-xs uppercase tracking-wider">{ct("amb.signupDate", locale)}</th>
                          <th className="text-center font-medium text-gray-500 p-4 text-xs uppercase tracking-wider">{ct("amb.status", locale)}</th>
                          <th className="text-right font-medium text-gray-500 p-4 text-xs uppercase tracking-wider">{ct("amb.revenue", locale)}</th>
                          <th className="text-right font-medium text-gray-500 p-4 text-xs uppercase tracking-wider">{ct("amb.commission", locale)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrals.map((referral) => (
                          <tr key={referral.id} className="border-b border-black/[0.03] last:border-0 hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 font-mono text-xs text-gray-600">{referral.emailMasked}</td>
                            <td className="p-4 text-gray-500">{formatDate(referral.createdAt)}</td>
                            <td className="p-4 text-center">
                              <span className={cn(
                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                referral.isPremium
                                  ? "bg-[#16a34a]/10 text-[#16a34a]"
                                  : "bg-gray-100 text-gray-600"
                              )}>
                                {referral.isPremium ? ct("amb.premium", locale) : ct("amb.free", locale)}
                              </span>
                            </td>
                            <td className="p-4 text-right font-medium text-gray-900">{formatCurrency(referral.estimatedRevenue)}</td>
                            <td className="p-4 text-right font-medium text-[#16a34a]">{formatCurrency(referral.commissionTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {nextCursor && (
                    <div className="p-4 border-t border-black/[0.04]">
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        {loadingMore ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        {loadingMore ? ct("amb.loadingMore", locale) : ct("amb.loadMore", locale)}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function StatCard({ label, value, icon, sub }: { label: string; value: string; icon: React.ReactNode; sub: string }) {
  return (
    <div className="bg-white rounded-2xl border border-black/[0.04] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-semibold text-gray-900 tracking-tight">{value}</div>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}

function CommissionCard({
  label, amount, color, icon, sub, highlight,
}: {
  label: string; amount: string; color: string; icon: React.ReactNode; sub: string; highlight?: boolean
}) {
  return (
    <div className={cn(
      "bg-white rounded-2xl border p-5 shadow-sm",
      highlight ? "border-[#16a34a]/20" : "border-black/[0.04]"
    )}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          "h-2.5 w-2.5 rounded-full",
          color === "amber" && "bg-amber-500",
          color === "green" && "bg-[#16a34a]",
          color === "gray" && "bg-gray-400"
        )} />
        <span className="text-sm text-gray-500">{label}</span>
        <div className="ml-auto">{icon}</div>
      </div>
      <div className={cn(
        "text-2xl font-semibold tracking-tight",
        highlight ? "text-[#16a34a]" : "text-gray-900"
      )}>
        {amount}
      </div>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="text-gray-300 hover:text-gray-500 transition-colors"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 rounded-xl bg-gray-900 text-white text-[11px] leading-relaxed shadow-lg z-50 pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-gray-900" />
        </div>
      )}
    </div>
  )
}

const TIER_COLORS = {
  bronze: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", ring: "ring-amber-300", gradient: "from-amber-500 to-amber-600" },
  silver: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-300", ring: "ring-gray-400", gradient: "from-gray-400 to-gray-500" },
  gold: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300", ring: "ring-yellow-400", gradient: "from-yellow-400 to-yellow-500" },
}

const TIER_ICONS = {
  bronze: <Shield className="h-5 w-5" />,
  silver: <Zap className="h-5 w-5" />,
  gold: <Trophy className="h-5 w-5" />,
}

function ScoreSection({ score, locale }: { score: ScoreData; locale: Locale }) {
  const colors = TIER_COLORS[score.tier]
  const progressPercent = (score.score / 1000) * 100

  const thresholdPositions = [
    { tier: "bronze" as const, label: ct("score.explorer", locale), pos: 0 },
    { tier: "silver" as const, label: ct("score.performer", locale), pos: (score.thresholds.silver / 1000) * 100 },
    { tier: "gold" as const, label: ct("score.elite", locale), pos: (score.thresholds.gold / 1000) * 100 },
  ]

  const breakdownItems = [
    { label: ct("score.reach", locale), value: score.breakdown.reach, max: 200, icon: <Eye className="h-4 w-4" />, color: "bg-blue-500", tooltip: ct("score.reach.tip", locale) },
    { label: ct("score.activity", locale), value: score.breakdown.activity, max: 200, icon: <Flame className="h-4 w-4" />, color: "bg-orange-500", tooltip: ct("score.activity.tip", locale) },
    { label: ct("score.revenue", locale), value: score.breakdown.revenue, max: 500, icon: <DollarSign className="h-4 w-4" />, color: "bg-[#16a34a]", tooltip: ct("score.revenue.tip", locale) },
    { label: ct("score.trust", locale), value: score.breakdown.trust, max: 100, icon: <Shield className="h-4 w-4" />, color: "bg-purple-500", tooltip: ct("score.trust.tip", locale) },
  ]

  return (
    <div className="bg-white rounded-2xl border border-black/[0.04] p-6 shadow-sm space-y-6">
      {/* Header: Score + Tier badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center",
            colors.bg, colors.text
          )}>
            {TIER_ICONS[score.tier]}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-gray-900 tracking-tight">{score.score}</span>
              <span className="text-sm text-gray-400 font-medium">/ 1000</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold",
                colors.bg, colors.text, colors.border, "border"
              )}>
                {TIER_ICONS[score.tier]}
                {score.tierLabel}
              </span>
              {score.nextTier && (
                <span className="text-xs text-gray-400">
                  {score.pointsToNext} pts → {score.nextTierLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-500">{ct("score.commission", locale)}</div>
          <div className="text-2xl font-bold text-[#16a34a]">
            {Math.round(score.commissionRate * 100)}%
          </div>
        </div>
      </div>

      {/* Tier Progress Bar */}
      <div className="space-y-2">
        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#16a34a] to-[#22c55e] rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          />
          {/* Tier markers */}
          {thresholdPositions.slice(1).map((t) => (
            <div
              key={t.tier}
              className="absolute top-0 bottom-0 w-px bg-white/80"
              style={{ left: `${t.pos}%` }}
            />
          ))}
        </div>
        <div className="relative h-5">
          {thresholdPositions.map((t) => (
            <div
              key={t.tier}
              className="absolute text-[10px] font-medium -translate-x-1/2"
              style={{ left: `${Math.max(5, Math.min(95, t.pos))}%` }}
            >
              <span className={cn(
                score.tier === t.tier ? "text-gray-900 font-semibold" : "text-gray-400"
              )}>
                {t.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {breakdownItems.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{item.icon}</span>
              <span className="text-xs font-medium text-gray-600">{item.label}</span>
              <InfoTooltip text={item.tooltip} />
              <span className="ml-auto text-xs font-semibold text-gray-900">{item.value}/{item.max}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700", item.color)}
                style={{ width: `${(item.value / item.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Tier Benefits Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-black/[0.04]">
        <TierCard
          tier="bronze"
          label={ct("score.explorer", locale)}
          threshold="0"
          commission="50%"
          perks={[ct("tier.bronze.p1", locale), ct("tier.bronze.p2", locale), ct("tier.bronze.p3", locale)]}
          active={score.tier === "bronze"}
          locale={locale}
        />
        <TierCard
          tier="silver"
          label={ct("score.performer", locale)}
          threshold="250"
          commission="50%"
          perks={[ct("tier.silver.p1", locale), ct("tier.silver.p2", locale), ct("tier.silver.p3", locale)]}
          active={score.tier === "silver"}
          locale={locale}
        />
        <TierCard
          tier="gold"
          label={ct("score.elite", locale)}
          threshold="600"
          commission="60%"
          perks={[ct("tier.gold.p1", locale), ct("tier.gold.p2", locale), ct("tier.gold.p3", locale)]}
          active={score.tier === "gold"}
          locale={locale}
        />
      </div>
    </div>
  )
}

function TierCard({ tier, label, threshold, commission, perks, active, locale }: {
  tier: "bronze" | "silver" | "gold"
  label: string
  threshold: string
  commission: string
  perks: string[]
  active: boolean
  locale: Locale
}) {
  const colors = TIER_COLORS[tier]

  return (
    <div className={cn(
      "rounded-xl border p-4 transition-all",
      active
        ? cn(colors.border, colors.bg, "ring-2", colors.ring)
        : "border-black/[0.04] bg-gray-50/50 opacity-60"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <span className={cn("text-sm", active ? colors.text : "text-gray-400")}>
          {TIER_ICONS[tier]}
        </span>
        <span className={cn("text-sm font-semibold", active ? "text-gray-900" : "text-gray-500")}>
          {label}
        </span>
        {active && (
          <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-[#16a34a] bg-[#16a34a]/10 px-2 py-0.5 rounded-full">
            {ct("score.current", locale)}
          </span>
        )}
      </div>
      <div className="text-xs text-gray-500 mb-2">
        {threshold}+ pts · <span className="font-semibold text-gray-700">{commission}</span> {ct("score.commission", locale).toLowerCase()}
      </div>
      <ul className="space-y-1">
        {perks.map((perk) => (
          <li key={perk} className="text-xs text-gray-500 flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-[#16a34a] shrink-0" />
            {perk}
          </li>
        ))}
      </ul>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-8 w-80 bg-gray-200 rounded-lg" />
        <div className="h-5 w-96 bg-gray-100 rounded-lg mt-3" />
      </div>
      <div className="h-32 bg-gray-100 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
      </div>
    </div>
  )
}
