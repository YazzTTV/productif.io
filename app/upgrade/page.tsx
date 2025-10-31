import { redirect } from 'next/navigation';
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { Header } from '@/components/header';
import { TrialService } from '@/lib/trial/TrialService';
import { PricingPlans } from '@/components/upgrade/PricingPlans';

export default async function UpgradePage() {
  // Récupérer le token depuis les cookies
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  let userId: string;
  try {
    const decoded = verify(token, process.env.JWT_SECRET || 'fallback_secret') as { userId: string };
    userId = decoded.userId;
  } catch (error) {
    redirect('/login');
  }

  const accessCheck = await TrialService.hasAccess(userId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Même header que la LP mais blanc, sans Connexion ni CTA */}
      <Header bg="white" hideAuth hideCTA />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {accessCheck.status === 'trial_expired'
              ? '🚀 Votre période d\'essai est terminée'
              : '⚡ Passez à la vitesse supérieure'
            }
          </h1>
          {accessCheck.status === 'trial_active' && (
            <p className="text-lg text-gray-600">
              Il vous reste {accessCheck.trialDaysLeft} jour(s) d'essai gratuit
            </p>
          )}
          {accessCheck.status === 'trial_expired' && (
            <p className="text-lg text-gray-600">
              Continuez votre productivité avec un abonnement
            </p>
          )}
        </div>

        <PricingPlans userId={userId} />
      </div>
    </div>
  );
}

