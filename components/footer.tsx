import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Youtube, Mail } from "lucide-react"

export default function Footer() {
  return (
    <footer className="w-full py-12 md:py-16 lg:py-20 border-t">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl">productif.io</span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400">
              Maximisez votre productivité personnelle et d'équipe avec notre plateforme tout-en-un.
            </p>
            <div className="flex space-x-4">
              <Link href="https://www.youtube.com/@arthurblna" className="text-gray-500 hover:text-brand-green">
                <Youtube className="h-5 w-5" />
                <span className="sr-only">YouTube</span>
              </Link>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Produit</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#features" className="text-gray-500 hover:text-brand-green">
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-gray-500 hover:text-brand-green">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link href="#testimonials" className="text-gray-500 hover:text-brand-green">
                  Témoignages
                </Link>
              </li>
              <li>
                <Link href="#faq" className="text-gray-500 hover:text-brand-green">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Contact</h4>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-gray-500" />
                <Link href="mailto:productifio@gmail.com" className="text-gray-500 hover:text-brand-green">
                  productifio@gmail.com
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-gray-500 dark:text-gray-400">
          <p>© 2025 productif.io. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
} 