import { Metadata } from "next"
import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre compte Productif.io",
}

export default function LoginPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
          <p className="text-sm text-muted-foreground">
            Saisissez vos identifiants pour vous connecter
          </p>
        </div>
        <LoginForm />
        <p className="px-8 text-center text-sm text-muted-foreground">
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