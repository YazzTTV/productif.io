'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TrialBanner() {
  const [visible, setVisible] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Récupérer les infos du trial depuis l'API
    fetch('/api/user/trial-status')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'trial_active' && data.daysLeft !== undefined) {
          setDaysLeft(data.daysLeft);

          // Afficher la bannière seulement si <= 3 jours restants
          if (data.daysLeft <= 3) {
            const dismissed = localStorage.getItem('trial-banner-dismissed');
            if (!dismissed || Date.now() - parseInt(dismissed) > 24 * 60 * 60 * 1000) {
              setVisible(true);
            }
          }
        }
      })
      .catch(console.error);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem('trial-banner-dismissed', Date.now().toString());
  };

  if (!visible || dismissed || daysLeft === null) return null;

  const isUrgent = daysLeft <= 1;
  const bgColor = isUrgent ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className={`${bgColor} text-white py-3 px-4 relative shadow-md`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {isUrgent ? (
            <AlertTriangle className="w-6 h-6" />
          ) : (
            <Clock className="w-6 h-6" />
          )}

          <div>
            <p className="font-medium">
              {daysLeft === 0 && "Votre essai gratuit expire aujourd'hui !"}
              {daysLeft === 1 && "Plus qu'1 jour d'essai gratuit"}
              {daysLeft > 1 && `Plus que ${daysLeft} jours d'essai gratuit`}
            </p>
            <p className="text-sm opacity-90">
              Abonnez-vous maintenant pour continuer sans interruption
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="secondary"
            className="bg-white text-gray-900 hover:bg-gray-100 font-medium"
          >
            <Link href="/upgrade">
              Choisir mon abonnement
            </Link>
          </Button>

          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

