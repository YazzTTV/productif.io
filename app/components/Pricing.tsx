'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const features = [
  'Accès illimité aux fonctionnalités',
  'Support prioritaire',
  'Mises à jour en avant-première',
  'Fonctionnalités exclusives',
];

export default function Pricing() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubscribe = () => {
    router.push('/register?plan=premium');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Tarification simple et transparente</h2>
        <p className="mt-4 text-lg text-gray-600">
          Commencez gratuitement avec un essai de 14 jours. Pas de carte de crédit requise.
        </p>
      </div>

      <div className="mt-12">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Premium</CardTitle>
            <CardDescription>Accédez à toutes les fonctionnalités</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <span className="text-3xl font-bold">9.99€</span>
              <span className="text-gray-600">/mois</span>
            </div>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={handleSubscribe}
              disabled={loading}
            >
              Commencer gratuitement
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 