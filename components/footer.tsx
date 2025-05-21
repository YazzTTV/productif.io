import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Youtube, Mail } from "lucide-react"

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Productif.io</h3>
            <p className="text-gray-600 text-sm">
              La solution complète de gestion de productivité pour les professionnels et les équipes.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Produit</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/fonctionnalites" className="text-gray-600 hover:text-blue-600">
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link href="/tarifs" className="text-gray-600 hover:text-blue-600">
                  Tarifs
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Légal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-blue-600">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-600 hover:text-blue-600">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link href="/cgv" className="text-gray-600 hover:text-blue-600">
                  CGV
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-gray-600 hover:text-blue-600">
                  Cookies
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-gray-600 hover:text-blue-600">
                  Politique de remboursement
                </Link>
              </li>
              <li>
                <Link href="/legal" className="text-gray-600 hover:text-blue-600">
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm mb-4 md:mb-0">
            &copy; {currentYear} Productif.io. Tous droits réservés.
          </p>
          <div className="flex space-x-4">
            <a href="https://x.com/productifio" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600">
              <span className="sr-only">Twitter</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="https://www.instagram.com/productif.io/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600">
              <span className="sr-only">Instagram</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5zm4.25 3.25a5.25 5.25 0 1 1 0 10.5a5.25 5.25 0 0 1 0-10.5zm0 1.5a3.75 3.75 0 1 0 0 7.5a3.75 3.75 0 0 0 0-7.5zm5.25.75a1 1 0 1 1-2 0a1 1 0 0 1 2 0z" />
              </svg>
            </a>
            <a href="https://www.tiktok.com/@productif.io4" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600">
              <span className="sr-only">TikTok</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.75 2h2.25a.75.75 0 0 1 .75.75v2.25a3.75 3.75 0 0 0 3.75 3.75h1.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-.75.75h-1.25A6.25 6.25 0 0 1 13.5 6.25V3.5h-1.5v13.25a2.25 2.25 0 1 1-2.25-2.25.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-.75.75A3.75 3.75 0 1 0 12.75 16V2z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
} 