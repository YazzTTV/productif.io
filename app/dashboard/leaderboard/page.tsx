import { Metadata } from "next"
import { Leaderboard } from "@/components/gamification/leaderboard"

export const metadata: Metadata = {
  title: "Classement - Productif.io",
  description: "Classement des utilisateurs les plus performants",
}

export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Classement</h1>
        <p className="text-muted-foreground">
          Découvrez les utilisateurs les plus performants et comparez votre progression avec la communauté
        </p>
      </div>
      
      <Leaderboard limit={100} showUserRank={true} />
    </div>
  )
} 