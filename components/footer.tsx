import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, Mail } from "lucide-react"

export default function Footer() {
  return (
    <footer className="w-full py-12 md:py-16 lg:py-20 border-t">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl">productive.io</span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400">
              Maximisez votre productivité personnelle et d'équipe avec notre plateforme tout-en-un.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-500 hover:text-brand-green">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-gray-500 hover:text-brand-green">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-gray-500 hover:text-brand-green">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-gray-500 hover:text-brand-green">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
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
            <h4 className="font-medium text-lg">Ressources</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-500 hover:text-brand-green">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-500 hover:text-brand-green">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-500 hover:text-brand-green">
                  Tutoriels
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-500 hover:text-brand-green">
                  Webinaires
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Contact</h4>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-gray-500" />
                <Link href="mailto:contact@productive.io" className="text-gray-500 hover:text-brand-green">
                  contact@productive.io
                </Link>
              </li>
            </ul>
            <div className="pt-4">
              <h4 className="font-medium text-lg mb-2">Newsletter</h4>
              <form className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Votre email"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Button type="submit" size="sm" className="bg-brand-green hover:bg-brand-green/90">
                  S'abonner
                </Button>
              </form>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-gray-500 dark:text-gray-400">
          <p>© 2025 productive.io. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
} 