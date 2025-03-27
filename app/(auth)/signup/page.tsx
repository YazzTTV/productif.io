import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Inscription",
  description: "Créez votre compte Productif.io",
}

export default function SignupPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Inscription</h1>
          <p className="text-sm text-muted-foreground">
            Créez votre compte pour commencer
          </p>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <p className="text-center mb-4">Formulaire d'inscription</p>
          <Link 
            href="/login"
            className="block w-full text-center text-sm text-muted-foreground hover:text-brand-green underline underline-offset-4"
          >
            Déjà un compte ? Connectez-vous
          </Link>
        </div>
      </div>
    </div>
  )
} 