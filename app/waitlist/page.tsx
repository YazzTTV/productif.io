"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Mail, Phone, CreditCard, ArrowRight, ArrowLeft, Menu, X } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { AnimatedButton } from "@/components/ui/animated-button"
import Link from "next/link"
import Image from "next/image"

function WaitlistContent() {
  const [currentStep, setCurrentStep] = useState(1)
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [motivation, setMotivation] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const searchParams = useSearchParams()

  useEffect(() => {
    // Récupérer les paramètres URL si disponibles
    if (searchParams) {
      const stepParam = searchParams.get("step")
      const emailParam = searchParams.get("email")
      
      if (stepParam) {
        setCurrentStep(parseInt(stepParam))
      }
      if (emailParam) {
        setEmail(emailParam)
      }
    }
  }, [searchParams])

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, step: 1 })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur lors de l'inscription")
      }

      setCurrentStep(2)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, motivation, step: 2 })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur lors de la sauvegarde")
      }

      setCurrentStep(3)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/waitlist/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur lors de la création du paiement")
      }

      const data = await response.json()
      
      // Rediriger vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const renderHeader = () => (
    <header className="container mx-auto py-4 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <Image
              src="/mon-logo.png"
              alt="Productif.io Logo"
              width={160}
              height={48}
              className="object-contain"
            />
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
            Accueil
          </Link>
          <Link href="/fonctionnalites" className="text-gray-600 hover:text-gray-900 transition-colors">
            Fonctionnalités
          </Link>
          <Link href="/tarification" className="text-gray-600 hover:text-gray-900 transition-colors">
            Tarification
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors hidden md:block">
            Connexion
          </Link>
          
          <AnimatedButton 
            className="text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2"
            onClick={() => window.location.href = '/waitlist'}
          >
            Rejoindre la waitlist
          </AnimatedButton>

          {/* Menu mobile */}
          <div className="relative md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center justify-center p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Menu mobile"
            >
              <Menu className={`h-5 w-5 ${mobileMenuOpen ? 'hidden' : 'block'}`} />
              <X className={`h-5 w-5 ${mobileMenuOpen ? 'block' : 'hidden'}`} />
            </button>
            
            {mobileMenuOpen && (
              <div className="absolute top-full right-0 mt-2 bg-white shadow-lg rounded-lg py-2 w-48 z-50">
                <Link href="/fonctionnalites" className="block px-4 py-2 text-gray-600 hover:bg-green-50 hover:text-green-500 transition-colors">
                  Fonctionnalités
                </Link>
                <Link href="/tarification" className="block px-4 py-2 text-gray-600 hover:bg-green-50 hover:text-green-500 transition-colors">
                  Tarification
                </Link>
                <Link href="/login" className="block px-4 py-2 text-gray-600 hover:bg-green-50 hover:text-green-500 transition-colors">
                  Connexion
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            step < currentStep ? "bg-green-500 text-white" :
            step === currentStep ? "bg-green-500 text-white" :
            "bg-gray-200 text-gray-500"
          }`}>
            {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
          </div>
          {step < 3 && (
            <div className={`w-12 h-1 mx-2 ${
              step < currentStep ? "bg-green-500" : "bg-gray-200"
            }`} />
          )}
        </div>
      ))}
    </div>
  )

  const renderStep1 = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-green-500" />
        </div>
        <CardTitle>Rejoins la waitlist exclusive</CardTitle>
        <CardDescription>
          Seulement 150 places disponibles pour accéder à Productif.io en avant-première
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleStep1Submit} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="ton@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="text-center"
            />
          </div>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <Button type="submit" className="w-full bg-green-500 hover:bg-green-600" disabled={loading}>
            {loading ? "Inscription..." : "Continuer"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )

  const renderStep2 = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-green-500" />
        </div>
        <CardTitle>Dernières informations</CardTitle>
        <CardDescription>
          Pour finaliser ton inscription et personnaliser ton expérience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleStep2Submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Numéro de téléphone</label>
            <Input
              type="tel"
              placeholder="+33 6 12 34 56 78"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Pourquoi veux-tu utiliser Productif.io ?</label>
            <Textarea
              placeholder="Décris-nous tes besoins en productivité..."
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              required
              rows={4}
            />
          </div>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setCurrentStep(1)}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <Button type="submit" className="flex-1 bg-green-500 hover:bg-green-600" disabled={loading}>
              {loading ? "Sauvegarde..." : "Continuer"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )

  const renderStep3 = () => (
    <div className="w-full max-w-2xl mx-auto">
      {/* Badge offre limitée */}
      <div className="flex justify-center mb-6">
        <div className="bg-gradient-to-r from-orange-400 to-pink-400 text-white px-6 py-3 rounded-full text-center font-semibold text-lg shadow-lg">
          🔥 OFFRE LIMITÉE - 150 PLACES SEULEMENT
        </div>
      </div>

      {/* Card principale */}
      <Card className="border-2 border-green-200 shadow-xl bg-white">
        <CardContent className="p-8">
          {/* Titre principal */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Accès Lifetime</h2>
          </div>

          {/* Prix */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-6 mb-4">
              <div className="text-center">
                <div className="text-2xl text-red-500 line-through font-medium">20€/mois</div>
                <div className="text-sm text-gray-500">Prix de lancement</div>
              </div>
              
              <div className="text-4xl text-gray-400">→</div>
              
              <div className="text-center">
                <div className="text-5xl font-bold text-green-500">4,95€/mois</div>
                <div className="text-lg text-green-600 font-semibold">À VIE</div>
              </div>
            </div>
          </div>

          {/* Box économie */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-6 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-800 mb-3">
                💰 Économise 75% en rejoignant la waitlist maintenant !
              </div>
              <div className="text-orange-700 leading-relaxed">
                Paye seulement <span className="font-bold text-orange-900">1€ aujourd'hui</span> et bénéficie du tarif 
                préférentiel de <span className="font-bold text-orange-900">4,95€/mois à vie</span> au lieu de 20€/mois lors du 
                lancement officiel.
              </div>
            </div>
          </div>

          {/* Bouton principal */}
          <div className="mb-6">
            <Button 
              onClick={handlePayment}
              className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200" 
              disabled={loading}
            >
              {loading ? (
                "Redirection vers le paiement..."
              ) : (
                <>
                  🚀 Réserver ma place pour 1€
                </>
              )}
            </Button>
          </div>

          {/* Garantie */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
            <div className="text-center">
              <div className="text-lg font-bold text-green-800 mb-2">
                ✅ 1€ maintenant = 4,95€/mois à vie garanti
              </div>
              <div className="text-green-700">
                Accès prioritaire + tarif préférentiel verrouillé
              </div>
            </div>
          </div>

          {/* Avantages détaillés */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4 text-center">🎯 Ce que tu obtiens avec ta place :</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Accès anticipé à Productif.io</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Tarif lifetime préférentiel verrouillé</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Support prioritaire</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Influence sur le développement</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Communauté exclusive</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Pas d'augmentation de prix future</span>
              </div>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-center">{error}</p>
            </div>
          )}
          
          {/* Boutons navigation */}
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setCurrentStep(2)}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>

          {/* Sécurité */}
          <div className="text-center text-xs text-gray-500 mt-4">
            🔒 Paiement 100% sécurisé via Stripe
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      {renderHeader()}
      
      <div className="bg-gray-50 min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Waitlist <span className="text-green-500">Productif.io</span>
            </h1>
            <p className="text-gray-600">
              Rejoins les 150 premiers utilisateurs à découvrir Productif.io
            </p>
          </div>

          {renderStepIndicator()}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>
      </div>
    </div>
  )
}

export default function WaitlistPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <WaitlistContent />
    </Suspense>
  )
} 