import { RegisterForm } from "@/components/auth/register-form"
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function RegisterPage({ searchParams }: { searchParams: { plan?: string } }) {
  // Redirection côté serveur si aucun plan n'est spécifié
  const isPremiumPlan = searchParams.plan === "premium"
  
  if (!isPremiumPlan) {
    redirect('/pricing')
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Créer un compte Premium</h1>
          <p className="mt-2 text-sm text-gray-600">
            Ou{" "}
            <a href="/login" className="font-medium text-primary hover:text-primary/90">
              connectez-vous à votre compte existant
            </a>
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}

