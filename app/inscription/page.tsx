import { MultiStepForm } from "./multi-step-form"
import { Header } from "@/components/header"

export default function InscriptionPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Rejoignez la waitlist exclusive
            </h1>
            <p className="text-gray-600 text-lg">
              Sécurisez votre accès à Productif.io avec un tarif préférentiel à vie
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
            <MultiStepForm />
          </div>
        </div>
      </div>
    </main>
  )
} 