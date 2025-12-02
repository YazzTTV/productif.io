"use client"

import { Suspense } from "react"
import { RegisterForm } from "@/components/auth/register-form"

function RegisterContent() {
  return (
    <div className="min-h-screen bg-white px-8 py-16 flex flex-col">
      <RegisterForm />
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">Chargement...</div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}

