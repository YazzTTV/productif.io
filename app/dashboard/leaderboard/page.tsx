import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth"
import { LeaderboardEnhanced } from "@/components/leaderboard/leaderboard-enhanced"

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  // TODO: Vérifier si l'utilisateur est premium depuis la base de données
  const isPremium = false

  return <LeaderboardEnhanced isPremium={isPremium} />
}
