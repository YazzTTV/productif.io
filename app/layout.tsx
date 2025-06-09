import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "./providers"
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Productif.io - Maximisez votre productivité",
  description: "Plateforme complète de gestion de tâches, d'habitudes et d'objectifs pour les individus et les équipes",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
