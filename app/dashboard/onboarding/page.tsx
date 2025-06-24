import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verify } from 'jsonwebtoken';
import AIAgentSetup from '@/components/onboarding/AIAgentSetup';

export default async function OnboardingPage() {
  // Vérifier l'authentification
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const userId = typeof decoded === 'object' && decoded !== null ? decoded.userId : null;

    if (!userId) {
      throw new Error('Token invalide');
    }

    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Bienvenue sur Productif.io</h1>
        <AIAgentSetup />
      </div>
    );
  } catch (error) {
    console.error('Erreur de vérification du token:', error);
    redirect('/login');
  }
} 