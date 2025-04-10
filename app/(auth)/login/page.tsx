import { Metadata } from "next"
import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre compte Productif.io",
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
          <p className="text-sm text-muted-foreground">
            Saisissez vos identifiants pour vous connecter
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          <Link 
            href="/signup"
            className="hover:text-brand-green underline underline-offset-4"
          >
            Pas encore de compte ? Inscrivez-vous
          </Link>
        </p>
      </div>
    </div>
  )
} 