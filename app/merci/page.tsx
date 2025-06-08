import { Suspense } from 'react'
import { CheckCircle2 } from 'lucide-react'
import ThankYouContent from './thank-you-content'

function ThankYouFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="text-center">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4 animate-pulse" />
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Chargement...</h1>
        <p className="text-xl text-gray-600">Préparation de votre page de remerciement</p>
      </div>
    </div>
  )
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<ThankYouFallback />}>
      <ThankYouContent />
    </Suspense>
  )
} 