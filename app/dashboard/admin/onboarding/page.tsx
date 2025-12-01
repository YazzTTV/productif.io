"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminRequiredPage } from "@/components/auth/admin-required"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  MessageCircle,
  Globe,
  Search,
  Download,
  Eye
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface OnboardingData {
  id: string
  userId: string
  mainGoal: string | null
  role: string | null
  frustration: string | null
  language: string | null
  whatsappNumber: string | null
  whatsappConsent: boolean
  diagBehavior: string | null
  timeFeeling: string | null
  phoneHabit: string | null
  offer: string | null
  utmParams: any
  emailFallback: string | null
  billingCycle: string | null
  currentStep: number | null
  completed: boolean
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    email: string
    name: string | null
    createdAt: Date
    subscriptionStatus: string | null
    trialStatus: string | null
  }
}

interface Stats {
  total: number
  completed: number
  withWhatsApp: number
  languages: {
    fr: number
    en: number
  }
  offers: {
    earlyAccess: number
    waitlist: number
  }
  behaviors: {
    details: number
    procrastination: number
    distraction: number
    abandon: number
  }
}

export default function AdminOnboardingPage() {
  const router = useRouter()
  const [data, setData] = useState<OnboardingData[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedData, setSelectedData] = useState<OnboardingData | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/onboarding")
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des données")
      }
      const result = await response.json()
      setData(result.data)
      setStats(result.stats)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredData = data.filter(item => {
    const search = searchTerm.toLowerCase()
    return (
      item.user.email.toLowerCase().includes(search) ||
      item.user.name?.toLowerCase().includes(search) ||
      item.mainGoal?.toLowerCase().includes(search) ||
      item.role?.toLowerCase().includes(search) ||
      item.frustration?.toLowerCase().includes(search)
    )
  })

  const exportToCSV = () => {
    const headers = [
      "Email",
      "Nom",
      "Objectif",
      "Rôle",
      "Frustration",
      "Langue",
      "WhatsApp",
      "Comportement",
      "Sentiment",
      "Habitude téléphone",
      "Offre",
      "Cycle facturation",
      "Étape",
      "Complété",
      "Date création"
    ]

    const rows = filteredData.map(item => [
      item.user.email,
      item.user.name || "",
      item.mainGoal || "",
      item.role || "",
      item.frustration || "",
      item.language || "",
      item.whatsappNumber || "",
      item.diagBehavior || "",
      item.timeFeeling || "",
      item.phoneHabit || "",
      item.offer || "",
      item.billingCycle || "",
      item.currentStep?.toString() || "",
      item.completed ? "Oui" : "Non",
      format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })
    ])

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `onboarding-data-${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <AdminRequiredPage requireSuperAdmin>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminRequiredPage>
    )
  }

  if (error) {
    return (
      <AdminRequiredPage requireSuperAdmin>
        <Card>
          <CardHeader>
            <CardTitle>Erreur</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchData}>Réessayer</Button>
          </CardContent>
        </Card>
      </AdminRequiredPage>
    )
  }

  return (
    <AdminRequiredPage requireSuperAdmin>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Données d'onboarding</h1>
            <p className="text-muted-foreground">
              Consultez toutes les données collectées lors de l'onboarding
            </p>
          </div>
          <Button onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Utilisateurs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Complétés</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% du total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avec WhatsApp</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.withWhatsApp}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? Math.round((stats.withWhatsApp / stats.total) * 100) : 0}% du total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Langues</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">FR: {stats.languages.fr} / EN: {stats.languages.en}</div>
                <p className="text-xs text-muted-foreground">Répartition</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recherche */}
        <Card>
          <CardHeader>
            <CardTitle>Recherche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par email, nom, objectif, rôle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tableau */}
        <Card>
          <CardHeader>
            <CardTitle>Données d'onboarding ({filteredData.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Objectif</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Langue</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Comportement</TableHead>
                    <TableHead>Étape</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        Aucune donnée trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.user.email}</div>
                            {item.user.name && (
                              <div className="text-sm text-muted-foreground">{item.user.name}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {item.mainGoal || "-"}
                        </TableCell>
                        <TableCell>{item.role || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.language?.toUpperCase() || "-"}</Badge>
                        </TableCell>
                        <TableCell>
                          {item.whatsappNumber ? (
                            <Badge variant="default">
                              <MessageCircle className="mr-1 h-3 w-3" />
                              {item.whatsappNumber}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Non</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.diagBehavior ? (
                            <Badge variant="outline">{item.diagBehavior}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{item.currentStep || "-"}</TableCell>
                        <TableCell>
                          {item.completed ? (
                            <Badge variant="default">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Complété
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="mr-1 h-3 w-3" />
                              En cours
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedData(item)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Détails de l'onboarding</DialogTitle>
                                <DialogDescription>
                                  Données complètes pour {item.user.email}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h3 className="font-semibold mb-2">Informations utilisateur</h3>
                                  <div className="space-y-1 text-sm">
                                    <div><strong>Email:</strong> {item.user.email}</div>
                                    <div><strong>Nom:</strong> {item.user.name || "N/A"}</div>
                                    <div><strong>Statut abonnement:</strong> {item.user.subscriptionStatus || "N/A"}</div>
                                    <div><strong>Statut essai:</strong> {item.user.trialStatus || "N/A"}</div>
                                  </div>
                                </div>

                                <div>
                                  <h3 className="font-semibold mb-2">Informations de base</h3>
                                  <div className="space-y-1 text-sm">
                                    <div><strong>Objectif principal:</strong> {item.mainGoal || "N/A"}</div>
                                    <div><strong>Rôle:</strong> {item.role || "N/A"}</div>
                                    <div><strong>Frustration:</strong> {item.frustration || "N/A"}</div>
                                    <div><strong>Langue:</strong> {item.language || "N/A"}</div>
                                  </div>
                                </div>

                                <div>
                                  <h3 className="font-semibold mb-2">WhatsApp</h3>
                                  <div className="space-y-1 text-sm">
                                    <div><strong>Numéro:</strong> {item.whatsappNumber || "N/A"}</div>
                                    <div><strong>Consentement:</strong> {item.whatsappConsent ? "Oui" : "Non"}</div>
                                  </div>
                                </div>

                                <div>
                                  <h3 className="font-semibold mb-2">Questionnaire de diagnostic</h3>
                                  <div className="space-y-1 text-sm">
                                    <div><strong>Comportement:</strong> {item.diagBehavior || "N/A"}</div>
                                    <div><strong>Sentiment fin de journée:</strong> {item.timeFeeling || "N/A"}</div>
                                    <div><strong>Habitude téléphone:</strong> {item.phoneHabit || "N/A"}</div>
                                  </div>
                                </div>

                                <div>
                                  <h3 className="font-semibold mb-2">Métadonnées</h3>
                                  <div className="space-y-1 text-sm">
                                    <div><strong>Offre:</strong> {item.offer || "N/A"}</div>
                                    <div><strong>Email fallback:</strong> {item.emailFallback || "N/A"}</div>
                                    <div><strong>Cycle de facturation:</strong> {item.billingCycle || "N/A"}</div>
                                    {item.utmParams && (
                                      <div>
                                        <strong>Paramètres UTM:</strong>
                                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                                          {JSON.stringify(item.utmParams, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h3 className="font-semibold mb-2">Progression</h3>
                                  <div className="space-y-1 text-sm">
                                    <div><strong>Étape actuelle:</strong> {item.currentStep || "N/A"}</div>
                                    <div><strong>Complété:</strong> {item.completed ? "Oui" : "Non"}</div>
                                    <div><strong>Créé le:</strong> {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}</div>
                                    <div><strong>Mis à jour le:</strong> {format(new Date(item.updatedAt), "dd/MM/yyyy HH:mm", { locale: fr })}</div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminRequiredPage>
  )
}

