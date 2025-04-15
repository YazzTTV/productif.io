import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "productif.io - Maximisez votre productivité personnelle et d'équipe",
  description:
    "Gérez vos tâches, suivez votre temps, développez des habitudes et atteignez vos objectifs avec notre plateforme tout-en-un.",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "16x16 32x32 48x48",
        type: "image/x-icon"
      },
      {
        url: "/favicon-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        url: "/favicon-512x512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ],
    apple: {
      url: "/apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png"
    }
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={inter.className}>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex min-h-screen flex-col">
              {children}
            </div>
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
