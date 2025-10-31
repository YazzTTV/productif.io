'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';

const plans = [
  {
    id: 'monthly',
    name: 'Mensuel',
    price: 14.99,
    popular: false,
    features: [
      '✅ Sessions Deep Work illimitées',
      '✅ Agent IA WhatsApp 24/7',
      '✅ Suivi d\'habitudes avancé',
      '✅ Objectifs OKR et analytics',
      '✅ Support par email',
      '✅ 7 jours d\'essai gratuit'
    ]
  },
  {
    id: 'yearly',
    name: 'Annuel',
    price: 9.99,
    popular: true,
    savings: '€60',
    features: [
      '✅ Tout du plan mensuel',
      '✅ Économisez 60€ par an',
      '✅ Support prioritaire',
      '✅ Accès anticipé aux nouvelles fonctionnalités',
      '✅ Badge exclusif communauté',
      '✅ 7 jours d\'essai gratuit'
    ]
  }
];

export function PricingPlans({ userId }: { userId: string }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (billingType: 'monthly' | 'yearly') => {
    setLoading(billingType);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingType, userId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session');
      }

      // Rediriger vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la souscription. Réessayez.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={`relative bg-white rounded-2xl shadow-lg p-8 ${
            plan.popular ? 'ring-2 ring-green-500 scale-105' : ''
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                ⭐ Le plus populaire
              </span>
            </div>
          )}

          <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
          
          <div className="mb-6">
            <span className="text-4xl font-bold text-gray-900">{plan.price}€</span>
            <span className="text-gray-600">/mois</span>
            {plan.savings && (
              <div className="mt-2">
                <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  Économisez {plan.savings}
                </span>
              </div>
            )}
          </div>

          <ul className="space-y-4 mb-8">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            onClick={() => handleSubscribe(plan.id as 'monthly' | 'yearly')}
            disabled={!!loading}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
              plan.popular
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading === plan.id ? 'Chargement...' : 'S\'abonner'}
          </Button>
        </Card>
      ))}
    </div>
  );
}

