"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Mail, Calendar, Users } from "lucide-react"
import Link from "next/link"

export default function WaitlistSuccessPage() {
  const [email, setEmail] = useState("")
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams) {
      const emailParam = searchParams.get("email")
      if (emailParam) {
        setEmail(emailParam)
      }
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 Bienvenue dans la waitlist !
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          Ta place est maintenant sécurisée. Tu fais partie des 150 premiers utilisateurs exclusifs !
        </p>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-green-500">Récapitulatif de ton inscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Mail className="w-5 h-5 text-gray-500" />
              <span className="font-medium">{email}</span>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-3">🚀 Prochaines étapes :</h3>
              <ul className="text-sm text-green-700 space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">1.</span>
                  <span>Tu recevras un email de confirmation dans les prochaines minutes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">2.</span>
                  <span>Nous te tiendrons informé du développement via email</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">3.</span>
                  <span>Tu auras accès en priorité dès le lancement (Q2 2025)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">4.</span>
                  <span>Tarif lifetime préférentiel garanti</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Lancement</h3>
              <p className="text-sm text-gray-600">Q2 2025</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Places limitées</h3>
              <p className="text-sm text-gray-600">150 utilisateurs</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Tarif spécial</h3>
              <p className="text-sm text-gray-600">Lifetime garanti</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Link href="/">
            <Button className="bg-green-500 hover:bg-green-600">
              Retourner à l'accueil
            </Button>
          </Link>
          
          <p className="text-sm text-gray-500">
            Des questions ? Contact : <a href="mailto:noah@productif.io" className="text-green-500 hover:underline">noah@productif.io</a>
          </p>
        </div>
      </div>
    </div>
  )
} 