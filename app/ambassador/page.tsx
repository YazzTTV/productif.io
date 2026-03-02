import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth"
import { AmbassadorStandalone } from "@/components/ambassador/ambassador-standalone"

export const dynamic = 'force-dynamic'

export default async function AmbassadorPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login?redirect=/ambassador")
  }

  return <AmbassadorStandalone />
}
