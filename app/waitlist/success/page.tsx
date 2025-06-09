"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Mail, Rocket, Heart } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

function SuccessContent() {
  const searchParams = useSearchParams()
  const email = searchParams?.get("email") || "votre email"

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto border-2 border-green-200 shadow-xl">
        <CardContent className="p-8 text-center">
          {/* Icône de succès */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>

          {/* Titre principal */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            🎉 Félicitations !
          </h1>
          
          <h2 className="text-xl md:text-2xl font-semibold text-green-600 mb-6">
            Ta place est réservée !
          </h2>

          {/* Message principal */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-8">
            <p className="text-lg text-gray-700 mb-4">
              Merci <span className="font-semibold text-green-700">{email}</span> ! 
            </p>
            <p className="text-gray-600 leading-relaxed">
              Tu fais maintenant partie des <span className="font-bold text-green-600">150 premiers utilisateurs</span> qui 
              découvriront Productif.io en avant-première avec le tarif lifetime préférentiel de 
              <span className="font-bold text-green-600"> 4,95€/mois à vie</span>.
            </p>
          </div>

          {/* Ce qui se passe maintenant */}
          <div className="text-left mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">🚀 Prochaines étapes :</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Mail className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Email de confirmation</p>
                  <p className="text-sm text-gray-600">Tu vas recevoir un email avec tous les détails de ton accès prioritaire.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Rocket className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Accès anticipé</p>
                  <p className="text-sm text-gray-600">Tu seras parmi les premiers informés du lancement et auras un accès prioritaire.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Heart className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Communauté exclusive</p>
                  <p className="text-sm text-gray-600">Rejoins notre communauté Discord pour échanger avec les autres early adopters.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rappel de l'offre */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-4 mb-8">
            <p className="text-orange-800 font-semibold">
              💰 Rappel : Ton tarif de 4,95€/mois est verrouillé à vie !
            </p>
            <p className="text-orange-700 text-sm mt-1">
              Aucune augmentation future, même quand le tarif public passera à 20€/mois.
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                Retour à l'accueil
              </Button>
            </Link>
            <Link href="/login">
              <Button className="w-full sm:w-auto bg-green-500 hover:bg-green-600">
                Se connecter
              </Button>
            </Link>
          </div>

          {/* Message de fin */}
          <p className="text-gray-500 text-sm mt-8">
            Des questions ? Contacte-nous à <a href="mailto:contact@productif.io" className="text-green-500 hover:underline">contact@productif.io</a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function WaitlistSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
} 