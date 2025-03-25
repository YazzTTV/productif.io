import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Connexion à votre compte</h1>
          <p className="mt-2 text-sm text-gray-600">
            Ou{" "}
            <a href="/register" className="font-medium text-primary hover:text-primary/90">
              créez un nouveau compte
            </a>
          </p>
        </div>
        <Suspense fallback={<div>Chargement...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}

