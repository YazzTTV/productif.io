import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth"
import { checkPremiumStatus } from "@/lib/premium"
import { WebDashboard } from "@/components/dashboard/web-dashboard"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  try {
    // Récupérer le nom de l'utilisateur
    let userName = "Student"
    if (user.name) {
      userName = user.name.split(' ')[0] || user.name
    } else if (user.email) {
      userName = user.email.split('@')[0]
    }

    // Vérifier le statut premium
    const premiumStatus = await checkPremiumStatus(user.id)

    return (
      <WebDashboard userName={userName} isPremium={premiumStatus.isPremium} />
    )
  } catch (error) {
    console.error("Error loading dashboard:", error)
    redirect("/login")
  }
}

