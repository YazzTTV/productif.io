import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth"
import { checkPremiumStatus } from "@/lib/premium"
import { PlanMyDay } from "@/components/plan/plan-my-day"
import { PreviewWrapper } from "@/components/premium/preview-wrapper"

export const dynamic = 'force-dynamic'

export default async function PlanMyDayPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const premiumStatus = await checkPremiumStatus(user.id)

  return (
    <PreviewWrapper
      isPremium={premiumStatus.isPremium}
      featureName="Plan My Day"
      description="AI-powered day planning with calendar sync"
      benefits={[
        "Voice or text input for quick planning",
        "Automatic task prioritization",
        "Google Calendar sync",
        "Conflict detection and resolution"
      ]}
    >
      <PlanMyDay 
        onComplete={() => window.location.href = '/dashboard'} 
        onBack={() => window.location.href = '/dashboard'} 
      />
    </PreviewWrapper>
  )
}

