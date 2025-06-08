"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Mail, Phone, CreditCard, ArrowRight, ArrowLeft } from "lucide-react"

interface FormData {
  email: string
  phone: string
  reason: string
}

export function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    email: "",
    phone: "",
    reason: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<FormData>>({})

  const steps = [
    { number: 1, title: "Email", icon: Mail, description: "Votre adresse email" },
    { number: 2, title: "Informations", icon: Phone, description: "Téléphone et motivation" },
    { number: 3, title: "Paiement", icon: CreditCard, description: "Sécurisez votre place" }
  ]

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<FormData> = {}

    if (step === 1) {
      if (!formData.email) {
        newErrors.email = "L'email est requis"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Format d'email invalide"
      }
    }

    if (step === 2) {
      if (!formData.phone) {
        newErrors.phone = "Le numéro de téléphone est requis"
      }
      if (!formData.reason) {
        newErrors.reason = "Veuillez nous dire pourquoi vous voulez utiliser Productif"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    if (!validateStep(currentStep)) return

    setIsLoading(true)

    try {
      if (currentStep === 1) {
        // Étape 1: Sauvegarder l'email
        const response = await fetch('/api/waitlist/step1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: formData.email,
            metadata: {
              userAgent: navigator.userAgent,
              referrer: document.referrer,
              timestamp: new Date().toISOString()
            }
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Erreur lors de la sauvegarde')
        }
      } else if (currentStep === 2) {
        // Étape 2: Sauvegarder téléphone et raison
        const response = await fetch('/api/waitlist/step2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            phone: formData.phone,
            reason: formData.reason
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Erreur lors de la sauvegarde')
        }
      }

      if (currentStep < 3) {
        setCurrentStep(currentStep + 1)
      } else {
        // Étape 3: Rediriger vers Stripe
        handlePayment()
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async () => {
    try {
      const response = await fetch('/api/waitlist/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
          reason: formData.reason
        })
      })

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Erreur paiement:', error)
      alert('Erreur lors de la création de la session de paiement')
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Effacer l'erreur du champ si il y en a une
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="space-y-8">
      {/* Barre de progression */}
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              currentStep >= step.number 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'border-gray-300 text-gray-400'
            }`}>
              {currentStep > step.number ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <step.icon className="w-5 h-5" />
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-1 mx-4 ${
                currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Titre de l'étape */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {steps[currentStep - 1].title}
        </h2>
        <p className="text-gray-600">
          {steps[currentStep - 1].description}
        </p>
      </div>

      {/* Contenu de l'étape */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email *
                </label>
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  💡 Votre email sera utilisé pour vous tenir informé du développement 
                  et vous donner accès en priorité à Productif.io
                </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de téléphone *
                </label>
                <Input
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pourquoi voulez-vous utiliser Productif ? *
                </label>
                <Textarea
                  placeholder="Décrivez brièvement vos besoins en productivité..."
                  value={formData.reason}
                  onChange={(e) => updateFormData('reason', e.target.value)}
                  rows={4}
                  className={errors.reason ? 'border-red-500' : ''}
                />
                {errors.reason && (
                  <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  Plus qu'une étape !
                </h3>
                <p className="text-green-700">
                  Sécurisez votre place dans la waitlist exclusive pour seulement 1€
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Accès waitlist exclusive</span>
                  <span className="font-semibold">1,00 €</span>
                </div>
                <div className="text-sm text-gray-500">
                  + Accès à vie au tarif préférentiel lors du lancement
                </div>
              </div>

              <div className="text-left space-y-2 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800">Ce que vous obtenez :</h4>
                <ul className="space-y-1">
                  <li>✅ Accès prioritaire à Productif.io</li>
                  <li>✅ Tarif préférentiel à vie (jusqu'à -50%)</li>
                  <li>✅ Mises à jour exclusives sur le développement</li>
                  <li>✅ Influence sur les futures fonctionnalités</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Boutons de navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || isLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <Button
          onClick={handleNext}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600"
        >
          {isLoading ? (
            "Chargement..."
          ) : currentStep === 3 ? (
            "Payer 1€ et rejoindre"
          ) : (
            <>
              Continuer
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
} 