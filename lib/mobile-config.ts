import { Capacitor } from '@capacitor/core';

export const MobileConfig = {
  // URL de base de l'API selon l'environnement
  getApiBaseUrl: () => {
    if (Capacitor.isNativePlatform()) {
      // En mode mobile, pointer vers le serveur distant
      return process.env.NEXT_PUBLIC_APP_URL || 'https://www.productif.io';
    } else {
      // En mode web, utiliser localhost ou l'URL courante
              return process.env.NEXT_PUBLIC_APP_URL || '';
    }
  },

  // Configuration des headers pour les requêtes API
  getApiHeaders: () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Ajouter d'autres headers si nécessaire
  }),

  // Vérifier si on est en mode mobile
  isMobile: () => Capacitor.isNativePlatform(),

  // Configuration réseau
  networkConfig: {
    timeout: 10000, // 10 secondes
    retries: 3,
  },

  // Configuration du cache pour le mode offline
  cacheConfig: {
    enabled: true,
    duration: 5 * 60 * 1000, // 5 minutes
  }
};

// Helper pour construire l'URL complète de l'API
export const buildApiUrl = (endpoint: string) => {
  const baseUrl = MobileConfig.getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  if (baseUrl.endsWith('/')) {
    return `${baseUrl}${cleanEndpoint}`;
  } else {
    return `${baseUrl}/${cleanEndpoint}`;
  }
};

// Helper pour les requêtes API avec gestion d'erreur mobile
export const makeApiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = buildApiUrl(endpoint);
  const headers = {
    ...MobileConfig.getApiHeaders(),
    ...options.headers,
  };

  try {
    // Utiliser AbortController pour gérer le timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MobileConfig.networkConfig.timeout);

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
}; 