import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth"
import { checkPremiumStatus } from "@/lib/premium"
import { Analytics } from "@/components/analytics/analytics"
import { PreviewWrapper } from "@/components/premium/preview-wrapper"

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const premiumStatus = await checkPremiumStatus(user.id)

  return (
    <PreviewWrapper
      isPremium={premiumStatus.isPremium}
      featureName="Analytics"
      description="Deep insights into your productivity patterns"
      benefits={[
        "Focus time trends and patterns",
        "Task completion analytics",
        "Stress and mood correlation",
        "Long-term consistency tracking"
      ]}
    >
      <Analytics />
    </PreviewWrapper>
  )
}
