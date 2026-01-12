"use client"

import { useEffect } from 'react';

export function MobileInit() {
  useEffect(() => {
    // Configuration du viewport avec safe area pour tous les appareils
    if (typeof window !== 'undefined') {
      const metaViewport = document.querySelector('meta[name="viewport"]');
      if (metaViewport) {
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
        document.head.appendChild(meta);
      }

      // Only initialize mobile features if Capacitor is available
      try {
        const { Capacitor } = require('@capacitor/core');
        if (Capacitor && Capacitor.isNativePlatform()) {
          initializeMobileFeatures();
        }
      } catch (error) {
        // Capacitor not available, skip mobile initialization
        console.log('Capacitor not available, skipping mobile init');
      }
    }
  }, []);

  const initializeMobileFeatures = async () => {
    try {
      const { StatusBar, Style } = require('@capacitor/status-bar');
      const { Keyboard } = require('@capacitor/keyboard');
      const { SplashScreen } = require('@capacitor/splash-screen');
      
      // Configuration de la barre de statut
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#22c55e' });

      // Configuration du clavier
      Keyboard.addListener('keyboardWillShow', (info: any) => {
        document.body.style.transform = `translateY(-${info.keyboardHeight / 2}px)`;
      });

      Keyboard.addListener('keyboardWillHide', () => {
        document.body.style.transform = 'translateY(0px)';
      });

      // Masquer le splash screen après le chargement
      setTimeout(async () => {
        await SplashScreen.hide();
      }, 2000);

      console.log('Mobile features initialized successfully');
    } catch (error) {
      console.error('Error initializing mobile features:', error);
    }
  };

  // Ce composant ne rend rien visuellement
  return null;
}

// Hook personnalisé pour détecter si on est sur mobile
export const useIsMobile = () => {
  try {
    const { Capacitor } = require('@capacitor/core');
    return Capacitor?.isNativePlatform() || false;
  } catch {
    return false;
  }
};

// Hook pour les fonctionnalités tactiles
export const useMobileFeatures = () => {
  const isMobile = useIsMobile();

  const hapticFeedback = async (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (isMobile) {
      try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        const style = type === 'light' ? ImpactStyle.Light : 
                    type === 'medium' ? ImpactStyle.Medium : 
                    ImpactStyle.Heavy;
        await Haptics.impact({ style });
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    }
  };

  const shareContent = async (title: string, text: string, url?: string) => {
    if (isMobile) {
      try {
        const { Share } = await import('@capacitor/share');
        await Share.share({
          title,
          text,
          url,
        });
      } catch (error) {
        console.warn('Share not available:', error);
      }
    } else {
      // Fallback web share API
      if (navigator.share) {
        await navigator.share({ title, text, url });
      }
    }
  };

  return {
    isMobile,
    hapticFeedback,
    shareContent,
  };
}; 