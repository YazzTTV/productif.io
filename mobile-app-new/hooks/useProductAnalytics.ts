import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import { authService } from '@/lib/api';
import { identifyAnalyticsUser, trackEvent, trackScreen } from '@/lib/analytics';

export function useProductAnalytics() {
  const pathname = usePathname();
  const opened = useRef(false);

  useEffect(() => {
    if (!opened.current) {
      opened.current = true;
      void trackEvent('app_opened');
      void authService.checkAuth()
        .then((user) => identifyAnalyticsUser(user?.id ?? null))
        .catch(() => identifyAnalyticsUser(null));
    }
  }, []);

  useEffect(() => {
    if (pathname) void trackScreen(pathname);
  }, [pathname]);
}
