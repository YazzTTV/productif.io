import { prisma } from '@/lib/prisma'

export async function checkPremiumStatus(userId: string): Promise<{
  isPremium: boolean
  status: 'trial_active' | 'trial_expired' | 'subscribed' | 'cancelled'
  trialDaysLeft?: number
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      subscriptionEndDate: true,
      trialEndDate: true,
    }
  })

  if (!user) {
    return { isPremium: false, status: 'trial_expired' }
  }

  const now = new Date()

  // Subscription active = Premium
  if (user.subscriptionStatus === 'active') {
    if (user.subscriptionEndDate && user.subscriptionEndDate > now) {
      return { isPremium: true, status: 'subscribed' }
    }
  }

  // Trial actif = Premium (trial gives access to premium features)
  if (user.subscriptionStatus === 'trial') {
    if (user.trialEndDate && user.trialEndDate > now) {
      const trialDaysLeft = Math.ceil(
        (user.trialEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      )
      return { isPremium: true, status: 'trial_active', trialDaysLeft }
    }
  }

  return { isPremium: false, status: 'trial_expired' }
}

