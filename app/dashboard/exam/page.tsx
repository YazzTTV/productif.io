import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth"
import { checkPremiumStatus } from "@/lib/premium"
import { ExamModeClient } from "@/components/exam/exam-mode-client"

export const dynamic = 'force-dynamic'

export default async function ExamModePage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const premiumStatus = await checkPremiumStatus(user.id)

  return <ExamModeClient isPremium={premiumStatus.isPremium} />
}

