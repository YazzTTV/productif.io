"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function CheckoutRedirectPage() {
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  
  useEffect(() => {
    // Récupérer l'URL du localStorage
    const url = localStorage.getItem('stripeCheckoutUrl')
    setCheckoutUrl(url)
  }, [])
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Finaliser votre inscription</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Pour finaliser votre inscription premium, veuillez cliquer sur le bouton ci-dessous pour accéder à la page de paiement Stripe.
          </p>
          {!checkoutUrl && (
            <p className="text-sm text-red-500">
              Aucune URL de paiement trouvée. Veuillez retourner à la page d'inscription.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {checkoutUrl && (
            <Button 
              className="w-full" 
              onClick={() => window.location.href = checkoutUrl}
            >
              Procéder au paiement
            </Button>
          )}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.href = "/pricing"}
          >
            Retour à la page des tarifs
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 