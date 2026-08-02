import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useUser } from 'expo-superwall';
import { authService } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

export function useSuperwallUserSync() {
  const { identify, update, signOut } = useUser();
  const { language } = useLanguage();
  const lastUserId = useRef<string | null>(null);
  const normalizedLanguage = language.toLowerCase().startsWith('fr') ? 'fr' : 'en';

  useEffect(() => {
    let cancelled = false;

    async function syncUser() {
      try {
        const user = await authService.checkAuth();

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
  }, [normalizedLanguage, identify, signOut, update]);
}
