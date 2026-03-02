"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Mail, Calendar, Gift } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams?.get('session_id')
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (sessionId) {
      // Vérifier la session Stripe
      fetch(`/api/waitlist/verify-payment?session_id=${sessionId}`)
        .then(response => response.json())
        .then(data => {
          setIsVerified(data.success)
          setIsLoading(false)
        })
        .catch(() => {
          setIsVerified(false)
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [sessionId])

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Vérification du paiement...</p>
      </div>
    )
  }

  if (!sessionId || !isVerified) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">❌</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Erreur de vérification
        </h1>
        <p className="text-gray-600 mb-6">
          Impossible de vérifier votre paiement. Contactez-nous si le problème persiste.
        </p>
        <Button onClick={() => window.location.href = '/inscription'}>
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* En-tête de succès */}
      <div className="text-center">
        <div className="text-green-500 text-6xl mb-4">🎉</div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Bienvenue dans la waitlist exclusive !
        </h1>
        <p className="text-gray-600 text-lg">
          Votre paiement a été confirmé. Vous faites maintenant partie des privilégiés !
        </p>
      </div>

      {/* Confirmation */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <span className="font-semibold text-green-800">Paiement confirmé</span>
          </div>
          <p className="text-green-700">
            Merci pour votre confiance ! Votre place est désormais sécurisée avec tous les avantages exclusifs.
          </p>
        </CardContent>
      </Card>

      {/* Ce qui vous attend */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Mail className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Mises à jour exclusives</h3>
            <p className="text-sm text-gray-600">
              Recevez les dernières nouvelles sur le développement de Productif.io
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Accès prioritaire</h3>
            <p className="text-sm text-gray-600">
              Soyez parmi les premiers à tester la plateforme
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Gift className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Tarif préférentiel</h3>
            <p className="text-sm text-gray-600">
              Bénéficiez d'un prix réduit à vie (jusqu'à -50%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Prochaines étapes */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">Que se passe-t-il maintenant ?</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
              <p className="text-gray-700">Vous recevrez un email de confirmation dans les prochaines minutes</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
              <p className="text-gray-700">Nous vous tiendrons informé du développement avec des mises à jour régulières</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</div>
              <p className="text-gray-700">Vous recevrez un accès prioritaire dès que Productif.io sera prêt</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center space-y-4">
        <p className="text-gray-600">
          Partagez Productif.io avec vos amis et collègues !
        </p>
        <div className="space-x-4">
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/'}
          >
            Retour à l'accueil
          </Button>
          <Button 
            className="bg-green-500 hover:bg-green-600"
            onClick={() => window.open('https://twitter.com/intent/tweet?text=Je viens de rejoindre la waitlist exclusive de Productif.io ! Une IA qui s\'occupe de toute mon organisation. %23productivity %23AI', '_blank')}
          >
            Partager sur Twitter
          </Button>
        </div>
      </div>
    </div>
  )
} 
