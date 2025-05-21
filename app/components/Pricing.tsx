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
          Rejoignez notre programme beta testeur gratuitement.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="relative">
          <CardHeader>
            <CardTitle className="text-xl">Premium</CardTitle>
            <div className="mt-1">
              <span className="text-3xl font-bold">Gratuit</span>
              <span className="text-gray-500"> pendant la beta</span>
            </div>
            <CardDescription>Idéal pour les particuliers et les petites équipes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="pt-4">
              <Button
                onClick={handleSubscribe}
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Chargement...' : 'Devenir beta testeur'}
              </Button>
              <p className="mt-2 text-center text-xs text-gray-500">
                Aucune carte bancaire requise. Places limitées.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary relative">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-2 py-1 text-xs rotate-0 rounded-bl-lg">
            Programme Beta
          </div>
          
          <CardHeader>
            <CardTitle className="text-xl">Entreprise</CardTitle>
            <div className="mt-1">
              <span className="text-3xl font-bold">Gratuit</span>
              <span className="text-gray-500"> pendant la beta</span>
            </div>
            <CardDescription>Pour les équipes et les organisations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  {feature}
                </li>
              ))}
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                Gestion des équipes et analyse des performances
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                Tableau de bord d'entreprise
              </li>
            </ul>

            <div className="pt-4">
              <Button
                onClick={handleSubscribe}
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Chargement...' : 'Devenir beta testeur'}
              </Button>
              <p className="mt-2 text-center text-xs text-gray-500">
                Aucune carte bancaire requise. Places limitées.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 