import { Suspense } from 'react'
import { Header } from "@/components/header"
import { SuccessContent } from './success-content'

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <Suspense fallback={<div>Chargement...</div>}>
            <SuccessContent />
          </Suspense>
        </div>
      </div>
    </main>
  )
} 