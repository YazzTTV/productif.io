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
  AlertTriangle,
  Trash2,
  Plus
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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
  const { toast } = useToast()
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [stats, setStats] = useState<WaitlistStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newEntry, setNewEntry] = useState({
    email: "",
    phone: "",
    motivation: "",
    currentStep: 2
  })
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

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette entrée ?")) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/waitlist/${id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression")
      }

      toast({
        title: "Succès",
        description: "L'entrée a été supprimée avec succès",
      })

      // Actualiser les données
      fetchData()
    } catch (err) {
      console.error("Erreur suppression:", err)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'entrée",
        variant: "destructive"
      })
    } finally {
      setDeleting(null)
    }
  }

  const handleAdd = async () => {
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newEntry,
          step: newEntry.currentStep
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout")
      }

      toast({
        title: "Succès",
        description: "L'entrée a été ajoutée avec succès",
      })

      // Réinitialiser le formulaire
      setNewEntry({
        email: "",
        phone: "",
        motivation: "",
        currentStep: 2
      })
      
      // Fermer le dialogue
      setIsAddDialogOpen(false)

      // Actualiser les données
      fetchData()
    } catch (err) {
      console.error("Erreur ajout:", err)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'entrée",
        variant: "destructive"
      })
    }
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
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une entrée</DialogTitle>
                <DialogDescription>
                  Ajoutez manuellement une nouvelle entrée à la waitlist
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEntry.email}
                    onChange={(e) => setNewEntry({ ...newEntry, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newEntry.phone}
                    onChange={(e) => setNewEntry({ ...newEntry, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motivation">Motivation</Label>
                  <Textarea
                    id="motivation"
                    value={newEntry.motivation}
                    onChange={(e) => setNewEntry({ ...newEntry, motivation: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAdd}>
                  Ajouter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={() => fetchData()} variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Total Inscrits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Statut Paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-green-600">Payés</span>
                <span className="font-bold">{stats?.payes || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">Non payés</span>
                <span className="font-bold">{stats?.pasPayes || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Par Étape
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Étape 1</span>
                <span className="font-bold">{stats?.etape1 || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Étape 2</span>
                <span className="font-bold">{stats?.etape2 || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Étape 3</span>
                <span className="font-bold">{stats?.etape3 || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des inscrits</CardTitle>
          <CardDescription>
            Tous les utilisateurs inscrits sur la waitlist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Téléphone</th>
                  <th className="text-left p-2">Motivation</th>
                  <th className="text-center p-2">Statut</th>
                  <th className="text-center p-2">Étape</th>
                  <th className="text-center p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b">
                    <td className="p-2 whitespace-nowrap">
                      {formatDate(entry.createdAt)}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {entry.email}
                      </div>
                    </td>
                    <td className="p-2">
                      {entry.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {entry.phone}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-2">
                      {entry.motivation || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="p-2 text-center">
                      {getStatusBadge(entry.status)}
                    </td>
                    <td className="p-2 text-center">
                      {getStepBadge(entry.currentStep)}
                    </td>
                    <td className="p-2 text-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                        disabled={deleting === entry.id}
                      >
                        {deleting === entry.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 