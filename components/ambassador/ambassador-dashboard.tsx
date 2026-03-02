"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
  Gift,
  Trophy,
  Shield,
  Zap,
  Eye,
  Flame,
} from "lucide-react"
import { cn } from "@/lib/utils"

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

function StatCard({
  label,
  value,
  icon: Icon,
  description,
  className,
}: {
  label: string
  value: string
  icon: React.ElementType
  description?: string
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

export function AmbassadorDashboard() {
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [scoreData, setScoreData] = useState<ScoreData | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [referralsTotal, setReferralsTotal] = useState(0)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [copied, setCopied] = useState(false)

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
          title: "Productif.io — Programme Ambassadeur",
          text: "Rejoins Productif.io — le système de discipline pour les étudiants sérieux.",
          url: stats.referralLink,
        })
      } catch {
        // cancelled
      }
    } else {
      handleCopy()
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const conversionRate =
    stats && stats.referredUsersCount > 0
      ? Math.round((stats.paidUsersCount / stats.referredUsersCount) * 100)
      : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Gift className="h-7 w-7 text-green-600" />
            <h1 className="text-2xl font-bold tracking-tight">Programme Ambassadeur</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Partagez Productif.io et gagnez {scoreData ? `${Math.round(scoreData.commissionRate * 100)}%` : "50%"} de commission sur chaque abonnement.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border bg-background hover:bg-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Rafraîchir
        </button>
      </div>

      {/* Referral link */}
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/10 dark:border-green-900/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Mon lien de parrainage
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-white dark:bg-background rounded-lg border px-4 py-2.5 text-sm text-muted-foreground font-mono truncate">
              {stats?.referralLink || "Chargement..."}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all",
                  copied
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-background hover:bg-accent"
                )}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copié !" : "Copier"}
              </button>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border bg-background hover:bg-accent transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Partager
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* APS Score & Tier */}
      {scoreData && <DashboardScoreSection score={scoreData} />}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Inscrits"
          value={String(stats?.referredUsersCount ?? 0)}
          icon={Users}
          description="Utilisateurs référés"
        />
        <StatCard
          label="Abonnés payants"
          value={String(stats?.paidUsersCount ?? 0)}
          icon={CreditCard}
          description={`${conversionRate}% de conversion`}
        />
        <StatCard
          label="Revenu total généré"
          value={formatCurrency(stats?.revenueTotal ?? 0)}
          icon={TrendingUp}
          description="Depuis le début"
        />
        <StatCard
          label="Revenu 30j"
          value={formatCurrency(stats?.revenue30d ?? 0)}
          icon={DollarSign}
          description="30 derniers jours"
        />
      </div>

      {/* Commissions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Mes commissions</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="text-sm text-muted-foreground">En attente</span>
                <Clock className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.commissionsPending ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Période de vérification de 14 jours
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-900/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">Disponible</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 ml-auto" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats?.commissionsEligible ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Prêt à être retiré
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-2.5 w-2.5 rounded-full bg-gray-400" />
                <span className="text-sm text-muted-foreground">Déjà payé</span>
                <Wallet className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.commissionsPaid ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total des commissions versées
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            Les commissions deviennent disponibles 14 jours après le paiement pour couvrir les éventuels remboursements.
          </span>
        </div>
      </div>

      {/* Referrals table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Mes filleuls{" "}
            <span className="text-muted-foreground font-normal text-sm">
              ({referralsTotal})
            </span>
          </h2>
        </div>

        {referrals.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold mb-1">Aucun filleul pour le moment</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Partagez votre lien de parrainage pour commencer à parrainer des utilisateurs et gagner des commissions.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium text-muted-foreground p-4">Email</th>
                    <th className="text-left font-medium text-muted-foreground p-4">Inscription</th>
                    <th className="text-center font-medium text-muted-foreground p-4">Statut</th>
                    <th className="text-right font-medium text-muted-foreground p-4">Revenu</th>
                    <th className="text-right font-medium text-muted-foreground p-4">Commission</th>
                    <th className="text-center font-medium text-muted-foreground p-4">Commission statut</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-mono text-xs">{referral.emailMasked}</td>
                      <td className="p-4 text-muted-foreground">
                        {formatDate(referral.createdAt)}
                      </td>
                      <td className="p-4 text-center">
                        <Badge
                          variant={referral.isPremium ? "default" : "secondary"}
                          className={cn(
                            referral.isPremium
                              ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
                              : ""
                          )}
                        >
                          {referral.isPremium ? "Premium" : "Gratuit"}
                        </Badge>
                      </td>
                      <td className="p-4 text-right font-medium">
                        {formatCurrency(referral.estimatedRevenue)}
                      </td>
                      <td className="p-4 text-right font-medium">
                        {formatCurrency(referral.commissionTotal)}
                      </td>
                      <td className="p-4 text-center">
                        <CommissionStatusBadge status={referral.commissionStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {nextCursor && (
              <div className="p-4 border-t">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border bg-background hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {loadingMore ? "Chargement..." : "Voir plus"}
                </button>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}

function DashboardInfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 rounded-xl bg-popover text-popover-foreground text-[11px] leading-relaxed shadow-lg border z-50 pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-popover" />
        </div>
      )}
    </div>
  )
}

const TIER_CONFIG = {
  bronze: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", ring: "ring-amber-300", icon: <Shield className="h-5 w-5" /> },
  silver: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-300", ring: "ring-gray-400", icon: <Zap className="h-5 w-5" /> },
  gold: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300", ring: "ring-yellow-400", icon: <Trophy className="h-5 w-5" /> },
}

function DashboardScoreSection({ score }: { score: ScoreData }) {
  const cfg = TIER_CONFIG[score.tier]
  const progressPercent = (score.score / 1000) * 100

  const breakdowns = [
    { label: "Reach", value: score.breakdown.reach, max: 200, icon: <Eye className="h-4 w-4" />, color: "bg-blue-500", tooltip: "Basé sur la taille de ton audience déclarée. Plus tu as d'abonnés, plus ton potentiel de reach est élevé." },
    { label: "Activité", value: score.breakdown.activity, max: 200, icon: <Flame className="h-4 w-4" />, color: "bg-orange-500", tooltip: "Nombre d'utilisateurs que tu as référés ces 30 derniers jours. Reflète ton effort de création de contenu." },
    { label: "Revenu", value: score.breakdown.revenue, max: 500, icon: <DollarSign className="h-4 w-4" />, color: "bg-green-500", tooltip: "Revenus générés par tes filleuls sur les 30 derniers jours. C'est le facteur le plus important de ton score." },
    { label: "Confiance", value: score.breakdown.trust, max: 100, icon: <Shield className="h-4 w-4" />, color: "bg-purple-500", tooltip: "Bonus basé sur : vérification manuelle, taux de conversion, ancienneté du compte et absence de fraude." },
  ]

  const tiers = [
    { key: "bronze" as const, label: "Explorateur", threshold: 0, commission: "50%" },
    { key: "silver" as const, label: "Performer", threshold: 250, commission: "50%" },
    { key: "gold" as const, label: "Élite", threshold: 600, commission: "60%" },
  ]

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center", cfg.bg, cfg.text)}>
              {cfg.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold tracking-tight">{score.score}</span>
                <span className="text-sm text-muted-foreground font-medium">/ 1000</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className={cn(cfg.bg, cfg.text, cfg.border)}>
                  {cfg.icon}
                  <span className="ml-1">{score.tierLabel}</span>
                </Badge>
                {score.nextTier && (
                  <span className="text-xs text-muted-foreground">
                    {score.pointsToNext} pts → {score.nextTierLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Commission</div>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(score.commissionRate * 100)}%
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
            <div className="absolute top-0 bottom-0 w-px bg-white/80" style={{ left: `${(score.thresholds.silver / 1000) * 100}%` }} />
            <div className="absolute top-0 bottom-0 w-px bg-white/80" style={{ left: `${(score.thresholds.gold / 1000) * 100}%` }} />
          </div>
          <div className="relative flex justify-between text-[10px] font-medium text-muted-foreground">
            <span className={cn(score.tier === "bronze" && "text-foreground font-semibold")}>Explorateur</span>
            <span className={cn(score.tier === "silver" && "text-foreground font-semibold")}>Performer</span>
            <span className={cn(score.tier === "gold" && "text-foreground font-semibold")}>Élite</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {breakdowns.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{item.icon}</span>
                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                <DashboardInfoTooltip text={item.tooltip} />
                <span className="ml-auto text-xs font-semibold">{item.value}/{item.max}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", item.color)}
                  style={{ width: `${(item.value / item.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
          {tiers.map((t) => {
            const tc = TIER_CONFIG[t.key]
            const active = score.tier === t.key
            return (
              <div
                key={t.key}
                className={cn(
                  "rounded-xl border p-4 transition-all",
                  active
                    ? cn(tc.border, tc.bg, "ring-2", tc.ring)
                    : "border-border bg-muted/30 opacity-60"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("text-sm", active ? tc.text : "text-muted-foreground")}>{tc.icon}</span>
                  <span className={cn("text-sm font-semibold", active ? "text-foreground" : "text-muted-foreground")}>{t.label}</span>
                  {active && (
                    <Badge variant="outline" className="ml-auto text-[10px] bg-green-50 text-green-700 border-green-200">
                      Actuel
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {t.threshold}+ pts · <span className="font-semibold text-foreground">{t.commission}</span> commission
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function CommissionStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          En attente
        </Badge>
      )
    case "eligible":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Disponible
        </Badge>
      )
    case "paid":
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          Payé
        </Badge>
      )
    case "reversed":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Annulé
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground">
          —
        </Badge>
      )
  }
}
