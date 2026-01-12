import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth"
import { HabitsEnhanced } from "@/components/habits/habits-enhanced"

export const dynamic = 'force-dynamic'

export default async function HabitsPage() {
  const user = await getAuthUser()
  
  if (!user) {
    redirect("/login")
  }

  return <HabitsEnhanced />
} 