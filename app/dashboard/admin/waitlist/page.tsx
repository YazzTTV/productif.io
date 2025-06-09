"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  CreditCard, 
  Clock, 
  Mail, 
  Phone, 
  Eye,
  Download,
  Shield,
  AlertTriangle
} from "lucide-react"
import { useRouter } from "next/navigation"

interface WaitlistEntry {
  id: string
  email: string
  phone?: string
  motivation?: string
  status: string
  currentStep: number
  createdAt: string
  updatedAt: string
}

interface WaitlistStats {
  total: number
  payes: number
  pasPayes: number
  etape1: number
  etape2: number
  etape3: number
}

interface User {
  id: string
  email: string
  role: string
  name?: string
}

export default function AdminWaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [stats, setStats] = useState<WaitlistStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const router = useRouter()

  // Vérifier l'authentification et le rôle
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (!response.ok) {
          router.push("/login?redirect=/dashboard/admin/waitlist")
          return
        }
        
        const userData = await response.json()
        
        // Vérifier que l'utilisateur est SUPER_ADMIN
        if (userData.user.role !== "SUPER_ADMIN") {
          setError("Accès refusé : Vous devez être SUPER_ADMIN pour accéder à cette page")
          setAuthLoading(false)
          return
        }
        
        setUser(userData.user)
        setAuthLoading(false)
      } catch (err) {
        console.error("Erreur auth:", err)
        router.push("/login?redirect=/dashboard/admin/waitlist")
      }
    }

    checkAuth()
  }, [router])

  const fetchData = async () => {
    try {
      const response = await fetch("/api/waitlist")
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des données")
      }
      const data = await response.json()
      setEntries(data.entries)
      setStats(data.stats)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && user.role === "SUPER_ADMIN") {
      fetchData()
    }
  }, [user])

  const getStatusBadge = (status: string) => {
    if (status === "paye") {
      return <Badge className="bg-green-500">Payé</Badge>
    }
    return <Badge variant="secondary">Pas payé</Badge>
  }

  const getStepBadge = (step: number) => {
    const steps = {
      1: { label: "Email", color: "bg-blue-500" },
      2: { label: "Infos", color: "bg-orange-500" },
      3: { label: "Paiement", color: "bg-purple-500" }
    }
    
    const stepInfo = steps[step as keyof typeof steps] || { label: "Inconnu", color: "bg-gray-500" }
    
    return <Badge className={stepInfo.color}>{stepInfo.label}</Badge>
  }

  const exportToCSV = () => {
    const headers = ["Email", "Téléphone", "Motivation", "Statut", "Étape", "Date inscription"]
    const csvContent = [
      headers.join(","),
      ...entries.map(entry => [
        entry.email,
        entry.phone || "",
        entry.motivation ? `"${entry.motivation.replace(/"/g, '""')}"` : "",
        entry.status,
        entry.currentStep,
        new Date(entry.createdAt).toLocaleDateString('fr-FR')
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `waitlist-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Page de chargement de l'authentification
  if (authLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Vérification des droits d'accès...</p>
        </div>
      </div>
    )
  }

  // Page d'erreur d'accès
  if (error && error.includes("Accès refusé")) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Accès Refusé</h2>
            <p className="text-gray-600 mb-4">
              Vous devez être SUPER_ADMIN pour accéder à cette page.
            </p>
            <Button onClick={() => router.push("/dashboard")} variant="outline">
              Retour au dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return <div className="p-6">Chargement...</div>
  }

  if (error) {
    return <div className="p-6 text-red-500">Erreur: {error}</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-green-500" />
            <h1 className="text-3xl font-bold">Waitlist Admin</h1>
            <Badge className="bg-red-500">SUPER_ADMIN</Badge>
          </div>
          <p className="text-gray-600">
            Gestion des inscriptions à la waitlist - Connecté en tant que {user?.email}
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.payes}</p>
                  <p className="text-sm text-gray-600">Payés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pasPayes}</p>
                  <p className="text-sm text-gray-600">Pas payés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.etape1}</p>
                  <p className="text-sm text-gray-600">Étape 1</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.etape2}</p>
                  <p className="text-sm text-gray-600">Étape 2</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.etape3}</p>
                  <p className="text-sm text-gray-600">Étape 3</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des inscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Inscriptions waitlist</CardTitle>
          <CardDescription>
            Liste de toutes les inscriptions à la waitlist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {entries.map((entry) => (
              <div 
                key={entry.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium">{entry.email}</span>
                    {getStatusBadge(entry.status)}
                    {getStepBadge(entry.currentStep)}
                  </div>
                  
                  {entry.phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {entry.phone}
                    </p>
                  )}
                  
                  {entry.motivation && (
                    <p className="text-sm text-gray-600 mt-1 max-w-md truncate">
                      💭 {entry.motivation}
                    </p>
                  )}
                  
                  <p className="text-xs text-gray-400 mt-1">
                    Inscrit le {new Date(entry.createdAt).toLocaleDateString('fr-FR')} à {new Date(entry.createdAt).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {entry.status === "paye" ? "💳 Payé" : "⏳ En attente"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Étape {entry.currentStep}/3
                  </p>
                </div>
              </div>
            ))}
            
            {entries.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucune inscription pour le moment
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 