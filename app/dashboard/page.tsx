import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth"
import { NewDashboard } from "@/components/dashboard/new-dashboard"
import { FitbitMobileDashboard } from "@/components/dashboard/fitbit-mobile-dashboard"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  try {
    return (
      <>
        {/* Interface mobile Fitbit-style */}
        <div className="block md:hidden">
          <FitbitMobileDashboard />
        </div>

        {/* Interface desktop avec nouveau design */}
        <div className="hidden md:block">
          <NewDashboard />
        </div>
      </>
    )
  } catch (error) {
    console.error("Error loading dashboard:", error)
    redirect("/login")
  }
}

