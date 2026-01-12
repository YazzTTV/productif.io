"use client"

import { useRouter } from "next/navigation"
import { FocusFlow } from "@/components/focus/focus-flow"

export default function FocusPage() {
  const router = useRouter()
  
  return (
    <FocusFlow 
      onExit={() => router.push('/dashboard')} 
      onShowPaywall={() => router.push('/dashboard/upgrade')} 
    />
  )
}

