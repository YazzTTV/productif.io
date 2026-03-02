import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth"
import { AmbassadorDashboard } from "@/components/ambassador/ambassador-dashboard"

export const dynamic = 'force-dynamic'

export default async function AmbassadorPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  return <AmbassadorDashboard />
}
