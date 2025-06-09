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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paye':
        return <Badge className="bg-green-500 text-white">Payé</Badge>
      case 'pas_paye':
        return <Badge variant="outline">Pas payé</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStepBadge = (step: number) => {
    const steps = [
      { label: "Email", color: "bg-blue-500" },
      { label: "Infos", color: "bg-yellow-500" },
      { label: "Paiement", color: "bg-green-500" }
    ]
    
    const currentStep = steps[step - 1]
    if (!currentStep) return <Badge variant="outline">Étape {step}</Badge>
    
    return (
      <Badge className={`${currentStep.color} text-white`}>
        {currentStep.label}
      </Badge>
    )
  }

  if (authLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">Accès refusé</h2>
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={() => router.push("/dashboard")} 
              className="mt-4"
              variant="outline"
            >
              Retour au dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administration Waitlist</h1>
          <p className="text-gray-600 mt-1">Gestion de la waitlist Productif.io</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchData()} variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                <Users className="h-4 w-4 inline mr-1" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">
                <CreditCard className="h-4 w-4 inline mr-1" />
                Payés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.payes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">
                <Clock className="h-4 w-4 inline mr-1" />
                Pas payés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.pasPayes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">
                Étape 1
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.etape1}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">
                Étape 2
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.etape2}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">
                Étape 3
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.etape3}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des entrées */}
      <Card>
        <CardHeader>
          <CardTitle>Entrées Waitlist ({entries.length})</CardTitle>
          <CardDescription>
            Liste de toutes les inscriptions à la waitlist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune entrée dans la waitlist
              </div>
            ) : (
              entries.map((entry) => (
                <div 
                  key={entry.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {entry.email}
                        </div>
                        {entry.phone && (
                          <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                            <Phone className="h-3 w-3" />
                            {entry.phone}
                          </div>
                        )}
                        {entry.motivation && (
                          <div className="text-sm text-gray-600 mt-1 max-w-md truncate">
                            <strong>Motivation:</strong> {entry.motivation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Étape</div>
                      {getStepBadge(entry.currentStep)}
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Statut</div>
                      {getStatusBadge(entry.status)}
                    </div>
                    
                    <div className="text-center min-w-[120px]">
                      <div className="text-sm text-gray-500">Créé le</div>
                      <div className="text-sm font-medium">
                        {formatDate(entry.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 