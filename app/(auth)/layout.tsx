import React from "react"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-4 px-6 border-b">
        <Link href="/" className="font-bold text-xl">productif.io</Link>
      </header>
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
} 