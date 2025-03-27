import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">productif.io</span>
          </Link>
        </div>
        <nav className="hidden md:flex gap-6">
          <Link href="/fonctionnalites" className="text-sm font-medium transition-colors hover:text-primary">
            Fonctionnalités
          </Link>
          <Link href="/tarifs" className="text-sm font-medium transition-colors hover:text-primary">
            Tarifs
          </Link>
          <Link href="/temoignages" className="text-sm font-medium transition-colors hover:text-primary">
            Témoignages
          </Link>
          <Link href="/faq" className="text-sm font-medium transition-colors hover:text-primary">
            FAQ
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">Se connecter</Link>
          </Button>
          <Button size="sm" className="bg-brand-green hover:bg-brand-green/90" asChild>
            <Link href="/register?plan=premium">Essai gratuit</Link>
          </Button>
        </div>
      </div>
    </header>
  )
} 