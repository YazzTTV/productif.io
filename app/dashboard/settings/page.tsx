import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SettingsEnhanced } from "@/components/settings/settings-enhanced"
import { redirect } from "next/navigation"
import { checkPremiumStatus } from "@/lib/premium"

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const user = await getAuthUser()
  
  if (!user) {
    redirect("/login")
  }

  // Récupérer les informations de l'utilisateur
  const userInfo = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  })

  if (!userInfo) {
    redirect("/login")
  }

  // Récupérer le statut premium
  let isPremium = false
  try {
    const premiumStatus = await checkPremiumStatus(user.id)
    isPremium = premiumStatus.isPremium
  } catch (error) {
    console.error('Error fetching premium status:', error)
  }

  // Récupérer le nom de l'utilisateur
  let userName = "Student"
  if (userInfo.name) {
    userName = userInfo.name.split(' ')[0] || userInfo.name
  } else if (userInfo.email) {
    userName = userInfo.email.split('@')[0]
  }

  return (
    <SettingsEnhanced 
      userName={userName}
      userEmail={userInfo.email}
      isPremium={isPremium}
    />
  )
} 