"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Calendar, Euro, Users, TrendingUp } from 'lucide-react'

interface Lead {
  id: string
  email: string
  phone: string
  reason: string
  status: string
  stripeSessionId: string
  amountPaid: number
  ipAddress: string
  createdAt: string
  emailCapturedAt: string
  phoneAddedAt: string | null
  paidAt: string | null
  completedAt: string | null
}

interface WaitlistData {
  success: boolean
  totalLeads: number
  leads: Lead[]
  statistics: Record<string, number>
}

export default function WaitlistAdminPage() {
  const [data, setData] = useState<WaitlistData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/debug/waitlist')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

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

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Erreur lors du chargement des données</p>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EMAIL_ONLY':
        return <Badge variant="secondary">Email seulement</Badge>
      case 'PAID':
        return <Badge className="bg-green-500">Payé</Badge>
      case 'COMPLETED':
        return <Badge className="bg-blue-500">Complété</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Administration Waitlist
        </h1>
        <Button onClick={() => window.location.reload()}>
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold">{data.totalLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Emails seulement</p>
                <p className="text-2xl font-bold">{data.statistics.EMAIL_ONLY || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Euro className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Payés</p>
                <p className="text-2xl font-bold">{data.statistics.PAID || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Taux conversion</p>
                <p className="text-2xl font-bold">
                  {data.totalLeads > 0 
                    ? Math.round(((data.statistics.PAID || 0) / data.totalLeads) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des leads */}
      <Card>
        <CardHeader>
          <CardTitle>Leads récents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.leads.map((lead) => (
              <div key={lead.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{lead.email}</span>
                      {getStatusBadge(lead.status)}
                    </div>
                    
                    {lead.phone !== 'Non renseigné' && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{lead.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right space-y-1">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(lead.createdAt)}</span>
                    </div>
                    
                    {lead.amountPaid > 0 && (
                      <div className="text-sm font-medium text-green-600">
                        {lead.amountPaid / 100}€ payé
                      </div>
                    )}
                  </div>
                </div>

                {lead.reason !== 'Non renseigné' && (
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-sm text-gray-700">
                      <strong>Raison :</strong> {lead.reason}
                    </p>
                  </div>
                )}

                <div className="flex justify-between text-xs text-gray-500">
                  <span>ID: {lead.id}</span>
                  <span>IP: {lead.ipAddress}</span>
                  {lead.stripeSessionId !== 'Aucune' && (
                    <span>Session: {lead.stripeSessionId.substring(0, 20)}...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 