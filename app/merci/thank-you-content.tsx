"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, Sparkles, Trophy, Crown, ArrowRight, Gift, Bot, Zap, MessageSquare, Target } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'

export default function ThankYouContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const success = searchParams?.get('success')
  const [isAnimated, setIsAnimated] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  
  useEffect(() => {
    // Vérifier l'authentification
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) {
          setIsAuthenticated(true)
          // Animation d'entrée
          setTimeout(() => setIsAnimated(true), 100)
        } else {
          setIsAuthenticated(false)
          // Rediriger vers login après 2 secondes
          setTimeout(() => {
            router.push('/login?message=Veuillez vous reconnecter&redirect=/dashboard')
          }, 2000)
        }
      })
      .catch(() => {
        setIsAuthenticated(false)
        setTimeout(() => {
          router.push('/login?message=Veuillez vous reconnecter&redirect=/dashboard')
        }, 2000)
      })
  }, [router])
  
  // Afficher un loader pendant la vérification
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4 animate-pulse" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Vérification...</h1>
          <p className="text-xl text-gray-600">Merci pour votre confiance !</p>
        </div>
      </div>
    )
  }
  
  // Afficher un message de redirection si non authentifié
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Paiement confirmé ! ✅</h1>
          <p className="text-xl text-gray-600 mb-4">Redirection vers la connexion...</p>
          <p className="text-sm text-gray-500">Vous allez être redirigé dans un instant</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className={`max-w-2xl w-full transition-all duration-1000 transform ${
        isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        
        {/* Header avec animation */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4 animate-bounce" />
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-500 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Merci ! 🎉
          </h1>
          <p className="text-xl text-gray-600">
            Votre abonnement Premium est maintenant actif
          </p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown className="w-6 h-6 text-yellow-500" />
              <Badge variant="secondary" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1">
                PREMIUM ACTIVÉ
              </Badge>
              <Crown className="w-6 h-6 text-yellow-500" />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Avantages Premium (version WOW) */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <Bot className="w-8 h-8 text-purple-600 mb-2" />
                <h3 className="font-semibold text-purple-900 mb-1">Assistant IA proactif</h3>
                <p className="text-sm text-purple-700">Un coach qui anticipe tes blocages et propose le prochain meilleur pas.</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <Target className="w-8 h-8 text-blue-600 mb-2" />
                <h3 className="font-semibold text-blue-900 mb-1">Plan Focus quotidien</h3>
                <p className="text-sm text-blue-700">Un plan d’action clair en 1 clic, aligné sur tes objectifs.</p>
              </div>
              
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
                <Zap className="w-8 h-8 text-amber-600 mb-2" />
                <h3 className="font-semibold text-amber-900 mb-1">Routines intelligentes</h3>
                <p className="text-sm text-amber-700">Automations + rappels dynamiques pour garder le rythme sans y penser.</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <MessageSquare className="w-8 h-8 text-green-600 mb-2" />
                <h3 className="font-semibold text-green-900 mb-1">WhatsApp en temps réel</h3>
                <p className="text-sm text-green-700">Ton copilote te guide, célèbre tes wins et te relance au bon moment.</p>
              </div>
            </div>

            {/* Étapes suivantes */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                Prêt à maximiser votre productivité ? 🚀
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <span className="text-gray-700">Explorez votre tableau de bord amélioré</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <span className="text-gray-700">Créez vos premiers projets premium</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <span className="text-gray-700">Découvrez le classement et défis</span>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button asChild className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Link href="/dashboard">
                  <Trophy className="w-4 h-4 mr-2" />
                  Accéder au Dashboard
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="flex-1">
                <Link href="/dashboard/leaderboard">
                  <Crown className="w-4 h-4 mr-2" />
                  Voir le Classement
                </Link>
              </Button>
            </div>

            {/* Message de bienvenue personnalisé */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                Vous avez des questions ? Notre équipe est là pour vous aider !
              </p>
              <Button variant="ghost" size="sm" asChild>
                <Link href="mailto:contact@productif.io">
                  Contacter le support
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer avec confettis CSS */}
        <div className="text-center mt-8 text-sm text-gray-500">
          Merci de faire confiance à Productif.io pour votre productivité ! ✨
        </div>
      </div>

      {/* Styles pour les confettis */}
      <style jsx>{`
        @keyframes confetti {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #f43f5e;
          animation: confetti 3s linear infinite;
        }
      `}</style>
    </div>
  )
} 