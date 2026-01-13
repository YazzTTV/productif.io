import { prisma } from '@/lib/prisma';
import { getPlanInfo } from '@/lib/plans';

export class TrialService {
  /**
   * Initialiser le modèle freemium à l'inscription (plus de free trial)
   */
  static async initializeTrial(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        trialStartDate: null,
        trialEndDate: null,
        trialStatus: 'disabled',
        subscriptionStatus: 'free',
        subscriptionTier: 'free',
        subscriptionEndDate: null,
      }
    });

    console.log(`✅ Freemium activé par défaut pour user ${userId}`);
  }

  /**
   * Vérifier si un utilisateur a accès (trial actif ou subscription active)
   */
  static async hasAccess(userId: string): Promise<{
    hasAccess: boolean;
    reason?: string;
    trialDaysLeft?: number;
    status: 'trial_active' | 'trial_expired' | 'subscribed' | 'cancelled' | 'freemium';
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionStatus: true,
        subscriptionTier: true,
        stripeSubscriptionId: true,
        subscriptionEndDate: true,
      }
    });

    if (!user) {
      return {
        hasAccess: false,
        reason: 'Utilisateur non trouvé',
        status: 'trial_expired'
      };
    }

    const planInfo = getPlanInfo(user);
    const status = planInfo.plan === 'premium' ? 'subscribed' : 'freemium';

    return {
      hasAccess: true,
      status
    };
  }

  /**
   * Marquer le trial comme expiré
   */
  static async expireTrial(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        trialStatus: 'expired',
        subscriptionStatus: 'free'
      }
    });

    console.log(`⏰ Trial expiré pour user ${userId}`);
  }

  /**
   * Convertir un trial en subscription payante
   */
  static async convertTrialToSubscription(
    userId: string,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    tier: string = 'pro'
  ): Promise<void> {
    const now = new Date();
    const subscriptionEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 jours

    await prisma.user.update({
      where: { id: userId },
      data: {
        trialStatus: 'converted',
        subscriptionStatus: 'active',
        subscriptionTier: tier,
        stripeCustomerId,
        stripeSubscriptionId,
        subscriptionEndDate,
        convertedAt: now
      }
    });

    console.log(`🎉 Trial converti en subscription pour user ${userId}`);
  }

  /**
   * Récupérer les utilisateurs dont le trial expire bientôt
   */
  static async getUsersWithExpiringTrial(daysBeforeExpiration: number): Promise<any[]> {
    const now = new Date();
    const targetDate = new Date(now.getTime() + daysBeforeExpiration * 24 * 60 * 60 * 1000);
    const targetDateEnd = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

    const users = await prisma.user.findMany({
      where: {
        subscriptionStatus: 'trial',
        trialStatus: 'active',
        trialEndDate: {
          gte: targetDate,
          lt: targetDateEnd
        }
      },
      include: {
        notificationSettings: true
      }
    });

    return users;
  }

  /**
   * Enregistrer qu'une notification a été envoyée
   */
  static async recordNotificationSent(
    userId: string,
    type: string,
    channel: string
  ): Promise<void> {
    await prisma.trialNotification.create({
      data: {
        userId,
        type,
        channel
      }
    });
  }

  /**
   * Vérifier si une notification a déjà été envoyée
   */
  static async hasNotificationBeenSent(userId: string, type: string): Promise<boolean> {
    const notification = await prisma.trialNotification.findFirst({
      where: {
        userId,
        type
      }
    });

    return !!notification;
  }

  /**
   * Obtenir des statistiques sur les trials
   */
  static async getTrialStats(): Promise<{
    activeTrials: number;
    expiredTrials: number;
    convertedTrials: number;
    conversionRate: number;
  }> {
    const [activeTrials, expiredTrials, convertedTrials] = await Promise.all([
      prisma.user.count({
        where: {
          subscriptionStatus: 'trial',
          trialStatus: 'active'
        }
      }),
      prisma.user.count({
        where: {
          trialStatus: 'expired'
        }
      }),
      prisma.user.count({
        where: {
          trialStatus: 'converted'
        }
      })
    ]);

    const totalTrials = activeTrials + expiredTrials + convertedTrials;
    const conversionRate = totalTrials > 0 ? (convertedTrials / totalTrials) * 100 : 0;

    return {
      activeTrials,
      expiredTrials,
      convertedTrials,
      conversionRate
    };
  }
}
