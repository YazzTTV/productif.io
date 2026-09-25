import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useUser } from 'expo-superwall';
import { authService, onAuthTokenChange } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

export function useSuperwallUserSync() {
  const { identify, update, signOut } = useUser();
  const { language } = useLanguage();
  const lastUserId = useRef<string | null>(null);
  // Incremente a chaque connexion ou deconnexion : sans lui, l'effet ne tournait
  // qu'au montage, et un compte cree en cours de session n'etait jamais
  // identifie avant le paywall de fin d'onboarding.
  const [authVersion, setAuthVersion] = useState(0);
  useEffect(() => onAuthTokenChange(() => setAuthVersion((v) => v + 1)), []);
  const normalizedLanguage = language.toLowerCase().startsWith('fr') ? 'fr' : 'en';

  useEffect(() => {
    let cancelled = false;

    async function syncUser() {
      try {
        // Apres un changement de compte, jamais le cache : il peut dater d'avant.
        const user = await authService.checkAuth(authVersion > 0 ? { force: true } : undefined);

        if (cancelled) return;

        if (user) {
          if (lastUserId.current !== user.id) {
            await identify(user.id);
            lastUserId.current = user.id;
          }

          await update({
            name: user.name,
            email: user.email,
            plan: user.plan ?? 'free',
            isPremium: user.isPremium ?? false,
            language: normalizedLanguage,
            createdAt: user.createdAt,
            appPlatform: Platform.OS,
          });
        } else if (lastUserId.current) {
          await signOut();
          lastUserId.current = null;
        }
      } catch {
        // Auth check failed silently - user likely not logged in
      }
    }

    syncUser();

    return () => { cancelled = true; };
  }, [normalizedLanguage, identify, signOut, update, authVersion]);
}
