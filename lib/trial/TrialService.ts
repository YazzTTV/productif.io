import { prisma } from '@/lib/prisma';

export class TrialService {
  private static TRIAL_DURATION_DAYS = 7;

  /**
   * Initialiser le trial à l'inscription
   */
  static async initializeTrial(userId: string): Promise<void> {
    const now = new Date();
    const trialEndDate = new Date(now.getTime() + this.TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: {
        trialStartDate: now,
        trialEndDate,
        trialStatus: 'active',
        subscriptionStatus: 'trial'
      }
    });

    console.log(`✅ Trial initialisé pour user ${userId} jusqu'au ${trialEndDate.toISOString()}`);
  }

  /**
   * Vérifier si un utilisateur a accès (trial actif ou subscription active)
   */
  static async hasAccess(userId: string): Promise<{
    hasAccess: boolean;
    reason?: string;
    trialDaysLeft?: number;
    status: 'trial_active' | 'trial_expired' | 'subscribed' | 'cancelled';
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        trialStartDate: true,
        trialEndDate: true,
        trialStatus: true,
        subscriptionStatus: true,
        subscriptionEndDate: true
      }
    });

    if (!user) {
      return {
        hasAccess: false,
        reason: 'Utilisateur non trouvé',
        status: 'trial_expired'
      };
    }

    const now = new Date();

    // Cas 1 : Subscription active
    if (user.subscriptionStatus === 'active') {
      if (user.subscriptionEndDate && user.subscriptionEndDate > now) {
        return {
          hasAccess: true,
          status: 'subscribed'
        };
      }
    }

    // Cas 2 : Trial actif
    if (user.subscriptionStatus === 'trial') {
      if (user.trialEndDate && user.trialEndDate > now) {
        const trialDaysLeft = Math.ceil(
          (user.trialEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );

        return {
          hasAccess: true,
          trialDaysLeft,
          status: 'trial_active'
        };
      } else {
        // Trial expiré
        await this.expireTrial(userId);

        return {
          hasAccess: false,
          reason: 'Période d\'essai expirée',
          trialDaysLeft: 0,
          status: 'trial_expired'
        };
      }
    }

    // Cas 3 : Tout le reste = pas d'accès
    return {
      hasAccess: false,
      reason: 'Aucun abonnement actif',
      status: 'trial_expired'
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
        subscriptionStatus: 'expired'
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

