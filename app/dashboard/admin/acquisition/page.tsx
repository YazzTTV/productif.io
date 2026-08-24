"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AdminRequiredPage } from "@/components/auth/admin-required"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { buildTikTokAttributionLinks } from "@/lib/tiktok-attribution-links"
import { BarChart3, Copy, ExternalLink, Link2, RefreshCw, Users, Zap } from "lucide-react"

interface AcquisitionData {
  days: number
  since: string
  totals: {
    signups: number
    leads: number
    attributedUsers: number
    tiktokAttributedUsers: number
    premiumAttributedUsers: number
    paywallViews: number
    paywallDismisses: number
    purchases: number
    restores: number
    attributionRate: number
    premiumRate: number
  }
  groups: {
    source: string
    provider: string
    campaign: string
    creative: string
    placement: string
    users: number
    premiumUsers: number
    paywallViews: number
    paywallDismisses: number
    purchases: number
    restores: number
    conversionRate: number
    firstSignupAt: string | null
    lastSignupAt: string | null
  }[]
  daily: {
    day: string
    signups: number
    attributedUsers: number
    tiktokUsers: number
    premiumUsers: number
  }[]
  users: {
    id: string
    email: string
    createdAt: string
    attributedAt: string | null
    source: string
    provider: string
    referredBy: string | null
    campaign: string | null
    creative: string | null
    placement: string | null
    subscriptionStatus: string
    isPremium: boolean
  }[]
  notes: Record<string, string>
}

function formatDate(value: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function StatCard({
  title,
  value,
  detail,
}: {
  title: string
  value: string | number
  detail: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

export default function AdminAcquisitionPage() {
  const [days, setDays] = useState("30")
  const [campaign, setCampaign] = useState("vague2")
  const [placement, setPlacement] = useState("lead_form")
  const [fromCode, setFromCode] = useState("10")
  const [toCode, setToCode] = useState("30")
  const [data, setData] = useState<AcquisitionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState("")

  const generatedLinks = useMemo(() => {
    return buildTikTokAttributionLinks({
      campaign,
      placement,
      from: Number(fromCode) || 10,
      to: Number(toCode) || 30,
    })
  }, [campaign, placement, fromCode, toCode])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const response = await fetch(`/api/admin/acquisition?days=${encodeURIComponent(days)}`, {
        credentials: "include",
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || "Impossible de charger l'acquisition")
      }
      setData(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(label)
    window.setTimeout(() => setCopied(""), 1800)
  }

  const exportLinksCsv = () => {
    const csv = [
      "creative,campaign,placement,onelink,landing_url,deep_link",
      ...generatedLinks.map(link => [
        link.creativeCode,
        link.campaign,
        link.placement,
        link.oneLinkUrl,
        link.landingUrl,
        link.deepLinkUrl,
      ].map(value => `"${value.replaceAll('"', '""')}"`).join(",")),
    ].join("\n")
    copy("csv", csv)
  }

  return (
    <AdminRequiredPage requireSuperAdmin>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Acquisition TikTok</h1>
            <p className="text-muted-foreground">
              Suivi des comptes attribués, conversions premium et liens traçables par créa.
            </p>
          </div>
          <div className="flex items-end gap-2">
            <div className="grid gap-2">
              <Label htmlFor="days">Période</Label>
              <Input
                id="days"
                className="w-24"
                inputMode="numeric"
                value={days}
                onChange={event => setDays(event.target.value)}
              />
            </div>
            <Button onClick={fetchData} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-4 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Signups"
            value={loading ? "..." : data?.totals.signups ?? 0}
            detail={`Sur les ${data?.days || days} derniers jours`}
          />
          <StatCard
            title="Leads email"
            value={loading ? "..." : data?.totals.leads ?? 0}
            detail="Captures depuis les pages publiques"
          />
          <StatCard
            title="Attribués"
            value={loading ? "..." : data?.totals.attributedUsers ?? 0}
            detail={`${data?.totals.attributionRate ?? 0}% des signups`}
          />
          <StatCard
            title="TikTok organique"
            value={loading ? "..." : data?.totals.tiktokAttributedUsers ?? 0}
            detail="Source tiktok_organic"
          />
          <StatCard
            title="Premium attribués"
            value={loading ? "..." : data?.totals.premiumAttributedUsers ?? 0}
            detail={`${data?.totals.premiumRate ?? 0}% des attribués`}
          />
          <StatCard
            title="Paywall vues"
            value={loading ? "..." : data?.totals.paywallViews ?? 0}
            detail={`${data?.totals.purchases ?? 0} achats, ${data?.totals.restores ?? 0} restores`}
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <BarChart3 className="mt-1 h-5 w-5 text-[#16A34A]" />
              <div>
                <CardTitle>Performance par source, vague et créa</CardTitle>
                <CardDescription>
                  Comptes créés, étapes paywall et conversions premium groupés par attribution.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Vague</TableHead>
                  <TableHead>Créa</TableHead>
                  <TableHead>Placement</TableHead>
                  <TableHead className="text-right">Comptes</TableHead>
                  <TableHead className="text-right">Paywall</TableHead>
                  <TableHead className="text-right">Dismiss</TableHead>
                  <TableHead className="text-right">Achats</TableHead>
                  <TableHead className="text-right">Premium</TableHead>
                  <TableHead className="text-right">Conv.</TableHead>
                  <TableHead>Dernier signup</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.groups || []).map(group => (
                  <TableRow key={`${group.source}-${group.campaign}-${group.creative}-${group.placement}`}>
                    <TableCell>{group.source}</TableCell>
                    <TableCell>{group.campaign}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{group.creative}</Badge>
                    </TableCell>
                    <TableCell>{group.placement}</TableCell>
                    <TableCell className="text-right">{group.users}</TableCell>
                    <TableCell className="text-right">{group.paywallViews}</TableCell>
                    <TableCell className="text-right">{group.paywallDismisses}</TableCell>
                    <TableCell className="text-right">{group.purchases + group.restores}</TableCell>
                    <TableCell className="text-right">{group.premiumUsers}</TableCell>
                    <TableCell className="text-right">{group.conversionRate}%</TableCell>
                    <TableCell>{formatDate(group.lastSignupAt)}</TableCell>
                  </TableRow>
                ))}
                {!loading && data?.groups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
                      Aucune attribution sur cette période.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <Users className="mt-1 h-5 w-5 text-[#16A34A]" />
                <div>
                  <CardTitle>Derniers comptes attribués</CardTitle>
                  <CardDescription>Utile pour vérifier un email juste après un test.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Créa</TableHead>
                    <TableHead>Placement</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Attribution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.users || []).slice(0, 12).map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.creative || "-"}</TableCell>
                      <TableCell>{user.placement || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={user.isPremium ? "default" : "outline"}>
                          {user.isPremium ? "premium" : user.subscriptionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.attributedAt)}</TableCell>
                    </TableRow>
                  ))}
                  {!loading && data?.users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        Aucun compte attribué récent.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <Zap className="mt-1 h-5 w-5 text-[#16A34A]" />
                <div>
                  <CardTitle>Tendance quotidienne</CardTitle>
                  <CardDescription>Lecture rapide des derniers jours.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(data?.daily || []).slice(0, 10).map(day => (
                  <div key={day.day} className="grid grid-cols-[88px_1fr] items-center gap-3 text-sm">
                    <span className="text-muted-foreground">{day.day.slice(5)}</span>
                    <div className="grid grid-cols-4 gap-2">
                      <Badge variant="outline">{day.signups} signups</Badge>
                      <Badge variant="secondary">{day.attributedUsers} attr.</Badge>
                      <Badge variant="secondary">{day.tiktokUsers} TikTok</Badge>
                      <Badge>{day.premiumUsers} premium</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-start gap-3">
                <Link2 className="mt-1 h-5 w-5 text-[#16A34A]" />
                <div>
                  <CardTitle>Liens par vidéo TikTok</CardTitle>
                  <CardDescription>
                    Un code par créa, puis OneLink direct app et URL landing pour backup.
                  </CardDescription>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <div className="grid gap-2">
                  <Label htmlFor="campaign">Vague</Label>
                  <Input id="campaign" value={campaign} onChange={event => setCampaign(event.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="placement">Placement</Label>
                  <Input id="placement" value={placement} onChange={event => setPlacement(event.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="from">De C</Label>
                  <Input id="from" inputMode="numeric" value={fromCode} onChange={event => setFromCode(event.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="to">À C</Label>
                  <Input id="to" inputMode="numeric" value={toCode} onChange={event => setToCode(event.target.value)} />
                </div>
                <Button className="self-end" variant="outline" onClick={exportLinksCsv}>
                  <Copy className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {copied && (
              <div className="mb-3 text-sm text-[#16A34A]">
                Copié : {copied}
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Créa</TableHead>
                  <TableHead>OneLink direct app</TableHead>
                  <TableHead>Landing URL</TableHead>
                  <TableHead className="w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generatedLinks.map(link => (
                  <TableRow key={link.creativeCode}>
                    <TableCell>
                      <Badge>{link.creativeCode}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[380px] truncate font-mono text-xs">{link.oneLinkUrl}</TableCell>
                    <TableCell className="max-w-[260px] truncate font-mono text-xs">{link.landingUrl}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => copy(link.creativeCode, link.oneLinkUrl)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href={link.oneLinkUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminRequiredPage>
  )
}
