import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-gray-900">Productif.io</h1>
          <div className="flex space-x-4">
            <Link href="/login">
              <Button variant="outline">Connexion</Button>
            </Link>
            <Link href="/register">
              <Button>S'inscrire</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Améliorez votre productivité</span>
              <span className="block text-primary">avec Productif.io</span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base text-gray-500 sm:text-lg md:mt-5 md:max-w-3xl md:text-xl">
              La plateforme tout-en-un pour gérer vos tâches, suivre votre temps et atteindre vos objectifs.
            </p>
            <div className="mx-auto mt-5 max-w-md sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link href="/register">
                  <Button size="lg" className="w-full">
                    Commencer gratuitement
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Productif.io. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  )
}

