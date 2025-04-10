import React from "react"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-4 px-4 sm:px-6 border-b">
        <div className="max-w-7xl mx-auto w-full">
          <Link href="/" className="font-bold text-xl sm:text-2xl">productif.io</Link>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  )
} 