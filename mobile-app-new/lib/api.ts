import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configuration de l'API  
const API_BASE_URL = 'https://www.productif.io/api'; // Utilisation de l'API de production avec www

// Fonction utilitaire pour vérifier AsyncStorage
const isAsyncStorageAvailable = () => {
  try {
    return AsyncStorage !== null && AsyncStorage !== undefined;
  } catch {
    return false;
  }
};

// Types pour l'API
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  company?: {
    name: string;
    description?: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token?: string; // Ajouter le token dans la réponse
  company?: any;
  message?: string;
}

export interface ApiError {
  error: string;
}

// Service de stockage local pour les tokens
export class TokenStorage {
  private static instance: TokenStorage;
  private token: string | null = null;

  static getInstance(): TokenStorage {
    if (!TokenStorage.instance) {
      TokenStorage.instance = new TokenStorage();
    }
    return TokenStorage.instance;
  }

  async setToken(token: string) {
    this.token = token;
    console.log('💾 [TokenStorage] Token sauvegardé en mémoire et AsyncStorage');
    if (isAsyncStorageAvailable()) {
      try {
        await AsyncStorage.setItem('auth_token', token);
        console.log('✅ [TokenStorage] Token sauvegardé dans AsyncStorage');
      } catch (error) {
        console.error('❌ [TokenStorage] Error saving token:', error);
      }
    } else {
      console.warn('⚠️ [TokenStorage] AsyncStorage not available, token stored in memory only');
    }
  }

  async getToken(): Promise<string | null> {
    // Toujours vérifier AsyncStorage en premier pour avoir le token le plus récent
    if (isAsyncStorageAvailable()) {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          this.token = token; // Mettre à jour le token en mémoire
          console.log('🔑 [TokenStorage] Token récupéré depuis AsyncStorage');
          return token;
        }
      } catch (error) {
        console.error('❌ [TokenStorage] Error getting token from AsyncStorage:', error);
      }
    }
    
    // Fallback sur le token en mémoire si AsyncStorage n'est pas disponible
    if (this.token) {
      console.log('🔑 [TokenStorage] Token récupéré depuis la mémoire');
      return this.token;
    }
    
    console.log('⚠️ [TokenStorage] Aucun token trouvé');
    return null;
  }

  async clearToken() {
    this.token = null;
    if (isAsyncStorageAvailable()) {
      try {
        await AsyncStorage.removeItem('auth_token');
        console.log('Token removed from AsyncStorage');
      } catch (error) {
        console.error('Error removing token:', error);
      }
    } else {
      console.warn('AsyncStorage not available, token cleared from memory only');
    }
  }
}

// Fonction utilitaire pour décoder le token JWT (sans vérification de signature)
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('❌ Erreur lors du décodage du token:', error);
    return null;
  }
}

// Fonction utilitaire pour obtenir le token
export async function getAuthToken(): Promise<string | null> {
  const tokenStorage = TokenStorage.getInstance();
  const token = await tokenStorage.getToken();
  
  if (token) {
    const decoded = decodeJWT(token);
    if (decoded) {
      console.log('🔍 [getAuthToken] Token décodé - userId:', decoded.userId, 'email:', decoded.email);
    }
  }
  
  return token;
}

// Fonction utilitaire pour les appels API avec timeout
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = 30000 // 30 secondes par défaut (augmenté pour les requêtes complexes)
): Promise<T> {
  const tokenStorage = TokenStorage.getInstance();
  const token = await tokenStorage.getToken();

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log('🌐 apiCall - URL complète:', fullUrl);
    console.log('🔑 apiCall - Token présent:', !!token);
    console.log('📋 apiCall - Méthode:', options.method || 'GET');
    if (options.body) {
      console.log('📦 apiCall - Body:', options.body.substring(0, 200));
    }
    
    // Créer une promesse avec timeout
    const fetchPromise = fetch(fullUrl, config);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout);
    });
    
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    console.log('📊 apiCall - Status:', response.status);
    console.log('📊 apiCall - Status Text:', response.statusText);
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      let rawText: string | undefined;
      let errorData: any = undefined;

      if (contentType.includes('application/json')) {
        try {
          errorData = await response.json();
        } catch (parseError) {
          // fallback lecture texte une seule fois
          rawText = await response.text();
          console.error('❌ apiCall - Erreur de parsing JSON:', parseError);
        }
      } else {
        rawText = await response.text();
        console.error('❌ apiCall - Réponse non-JSON:', rawText.substring(0, 200));
      }

      // Gérer les erreurs 401 (Non authentifié) - nettoyer le token invalide
      if (response.status === 401) {
        // Nettoyer le token invalide pour éviter les appels répétés
        await TokenStorage.getInstance().clearToken();
        const message = errorData?.error || errorData?.message || 'Non authentifié';
        // Ne pas logger comme erreur critique - c'est normal si l'utilisateur n'est pas connecté
        console.log('ℹ️ apiCall - Non authentifié (401), token nettoyé');
        throw new Error(message);
      }

      // Si c'est une 404 avec du HTML, c'est probablement que l'endpoint n'existe pas
      if (response.status === 404 && rawText && rawText.includes('<!DOCTYPE')) {
        console.error('❌ apiCall - Endpoint non trouvé (404 HTML):', `${API_BASE_URL}${endpoint}`);
        throw new Error(`Endpoint non trouvé: ${endpoint}. Vérifiez que l'endpoint existe sur le serveur.`);
      }

      const message =
        errorData?.error ||
        errorData?.message ||
        (rawText ? `Erreur serveur (${response.status}): ${rawText.substring(0, 100)}` : 'Erreur de réseau');

      throw new Error(message);
    }

    // Vérifier que la réponse est bien du JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ apiCall - Réponse non-JSON reçue:', text.substring(0, 200));
      throw new Error('Réponse serveur invalide (non-JSON)');
    }

    const result = await response.json();
    console.log('✅ apiCall - Succès:', result);
    return result;
  } catch (error) {
    // Ne pas logger les erreurs 401 comme des erreurs critiques - c'est normal si l'utilisateur n'est pas connecté
    if (error instanceof Error && error.message === 'Non authentifié') {
      // Log silencieux pour les erreurs d'authentification
      // L'erreur sera gérée par le code appelant (checkAuth retourne null)
    } else {
      console.error('💥 API Error:', error);
      console.error('💥 API Error Type:', error instanceof TypeError ? 'TypeError' : typeof error);
      console.error('💥 API Error Message:', error instanceof Error ? error.message : String(error));
      
      // Si c'est une erreur réseau (pas de réponse du serveur), fournir un message plus clair
      if (error instanceof TypeError) {
        const errorMsg = error.message || '';
        if (errorMsg.includes('fetch') || errorMsg.includes('Network request failed') || errorMsg.includes('Failed to fetch')) {
          const fullUrl = `${API_BASE_URL}${endpoint}`;
          console.error('💥 Erreur réseau - Impossible de joindre le serveur');
          console.error('💥 URL complète:', fullUrl);
          console.error('💥 Endpoint:', endpoint);
          console.error('💥 Type d erreur:', error.constructor.name);
          console.error('💥 Message d erreur:', errorMsg);
          console.error('💥 Stack:', error.stack);
          
          // Vérifier si c'est un problème d'endpoint non trouvé
          if (endpoint.includes('/subjects')) {
            throw new Error(`L'endpoint ${endpoint} n'est peut-être pas encore déployé en production. Veuillez contacter le support.`);
          }
          
          throw new Error('Erreur de réseau. Vérifiez votre connexion internet et réessayez.');
        }
      }
      
      // Si c'est une erreur de timeout
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new Error('La requête a pris trop de temps. Vérifiez votre connexion internet.');
      }
      
      // Si l'erreur contient des informations sur l'endpoint
      if (error instanceof Error && error.message.includes('Endpoint non trouvé')) {
        throw new Error(`L'endpoint ${endpoint} n'est pas disponible. Le service peut être en cours de déploiement.`);
      }
    }
    throw error;
  }
}

// Service d'authentification
export const authService = {
  // Enregistrer un token (utilisé après OAuth)
  async setToken(token: string): Promise<void> {
    await TokenStorage.getInstance().setToken(token)
  },
  // Connexion
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiCall<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Stocker le token si présent dans la réponse
    if (response.success && response.token) {
      await TokenStorage.getInstance().setToken(response.token);
    }

    return response;
  },

  // Inscription
  async signup(userData: SignupRequest): Promise<AuthResponse> {
    // Nettoyer l'ancien token avant l'inscription pour éviter les conflits
    console.log('🧹 [SIGNUP] Nettoyage de l\'ancien token avant inscription...');
    await TokenStorage.getInstance().clearToken();
    
    const response = await apiCall<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Stocker le token si présent dans la réponse
    if (response.success && response.token) {
      await TokenStorage.getInstance().setToken(response.token);
      console.log('✅ [SIGNUP] Nouveau token sauvegardé après inscription');
      console.log('👤 [SIGNUP] User ID du nouveau token:', response.user?.id);
    } else {
      console.error('❌ [SIGNUP] Aucun token dans la réponse d\'inscription');
    }

    return response;
  },

  // Déconnexion
  async logout(): Promise<void> {
    try {
      await apiCall('/auth/logout', {
        method: 'POST',
      });
    } finally {
      await TokenStorage.getInstance().clearToken();
    }
  },

  // Connexion avec Google (nouvelle méthode avec idToken dans le header)
  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    // Envoyer l'idToken dans le header Authorization comme recommandé par Google
    const response = await apiCall<AuthResponse>('/auth/google/mobile', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    // Stocker le token si présent dans la réponse
    if (response.success && response.token) {
      await TokenStorage.getInstance().setToken(response.token);
    }

    return response;
  },

  // Connexion avec Apple (avec identityToken dans le header)
  async loginWithApple(identityToken: string, email?: string | null, name?: string | null): Promise<AuthResponse> {
    // Envoyer l'identityToken dans le header Authorization comme recommandé par Apple
    const response = await apiCall<AuthResponse>('/auth/oauth/apple', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${identityToken}`,
      },
      body: email || name ? JSON.stringify({ email, name }) : undefined,
    });

    // Stocker le token si présent dans la réponse
    if (response.success && response.token) {
      await TokenStorage.getInstance().setToken(response.token);
    }

    return response;
  },

  // Vérifier l'état de connexion
  async checkAuth(): Promise<User | null> {
    try {
      const response = await apiCall<{ user: User }>('/auth/me');
      return response.user;
    } catch (error) {
      return null;
    }
  },

  // Récupérer le statut du trial
  async getTrialStatus(): Promise<{ 
    status: 'trial_active' | 'trial_expired' | 'subscribed' | 'cancelled';
    daysLeft?: number;
    hasAccess: boolean;
  }> {
    return await apiCall('/user/trial-status');
  },
};

// Service pour les données du dashboard
export const dashboardService = {
  // Récupérer les métriques du dashboard
  async getMetrics(date?: string): Promise<any> {
    const params = date ? `?date=${date}` : '';
    return await apiCall(`/dashboard/metrics${params}`);
  },

  // Récupérer les statistiques de gamification
  async getGamificationStats(): Promise<any> {
    return await apiCall('/gamification/stats');
  },

  // Récupérer les habitudes
  async getHabits(): Promise<any> {
    return await apiCall('/habits');
  },

  // Récupérer les tâches
  async getTasks(): Promise<any> {
    return await apiCall('/tasks');
  },

  // Récupérer les deep work sessions complétées
  async getDeepWorkSessions(status: 'active' | 'completed' | 'all' = 'completed'): Promise<any> {
    // Note: This endpoint requires API token, so we'll use a workaround
    // We'll get time entries and match them with deep work sessions via the timeEntryId
    return null; // Will be handled differently
  },

  // Récupérer les données de productivité hebdomadaires
  async getWeeklyProductivity(period: 'week' | 'month' | 'trimester' | 'year' = 'week'): Promise<any> {
    return await apiCall(`/dashboard/weekly-productivity?period=${period}`);
  },

  // Récupérer les statistiques analytics pour une période
  async getAnalyticsStats(period: 'week' | 'month' | 'trimester' | 'year' = 'week'): Promise<any> {
    return await apiCall(`/dashboard/analytics-stats?period=${period}`);
  },
};

// Service pour les habitudes
export const habitsService = {
  // Récupérer toutes les habitudes
  async getAll(): Promise<any> {
    return await apiCall('/habits');
  },

  // Créer une habitude
  async create(habitData: any): Promise<any> {
    return await apiCall('/habits', {
      method: 'POST',
      body: JSON.stringify(habitData),
    });
  },

  // Toggle une habitude (complétée/non complétée)
  async complete(habitId: string, date?: string, currentCompleted?: boolean): Promise<any> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    // Inverser l'état actuel
    const newCompleted = currentCompleted !== undefined ? !currentCompleted : true;
    
    return await apiCall('/habits/entries', {
      method: 'POST',
      body: JSON.stringify({
        habitId,
        date: targetDate,
        completed: newCompleted,
      }),
    });
  },

  // Sauvegarder une habitude avec note et/ou rating
  async saveWithNote(habitId: string, date: string, note: string, rating?: number): Promise<any> {
    return await apiCall('/habits/entries', {
      method: 'POST',
      body: JSON.stringify({
        habitId,
        date,
        completed: true,
        note,
        rating,
      }),
    });
  },

  // Supprimer une habitude
  async delete(habitId: string): Promise<any> {
    return await apiCall(`/habits/${habitId}`, {
      method: 'DELETE',
    });
  },

  // Mettre à jour une habitude (pour l'ordre notamment)
  async update(habitId: string, data: any): Promise<any> {
    return await apiCall(`/habits/${habitId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// Service pour les tâches
export const tasksService = {
  // Récupérer toutes les tâches
  async getTasks(): Promise<any> {
    // Forcer le filtrage par utilisateur uniquement (pas par entreprise)
    return await apiCall('/tasks?userOnly=true');
  },

  async getAll(): Promise<any> {
    return await apiCall('/tasks');
  },

  // Créer une tâche
  async create(taskData: any): Promise<any> {
    console.log('📤 tasksService.create - Données envoyées:', taskData);
    console.log('📤 tasksService.create - URL complète:', 'https://www.productif.io/api/tasks');
    
    const result = await apiCall('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
    
    console.log('📥 tasksService.create - Réponse reçue:', result);
    return result;
  },

  // Mettre à jour une tâche
  async updateTask(taskId: string, updates: any): Promise<any> {
    return await apiCall(`/tasks/${taskId}`, {
      method: 'PATCH', // Utiliser PATCH au lieu de PUT
      body: JSON.stringify(updates),
    });
  },

  // Marquer une tâche comme complétée
  async complete(taskId: string): Promise<any> {
    return await apiCall(`/tasks/${taskId}/complete`, {
      method: 'POST',
    });
  },

  // Supprimer une tâche
  async deleteTask(taskId: string): Promise<any> {
    return await apiCall(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },

  // Récupérer les tâches d'aujourd'hui
  async getTodayTasks(): Promise<any> {
    return await apiCall('/tasks/today');
  },

  // Créer des tâches intelligentes (plan tomorrow)
  async planTomorrow(userInput: string, date?: string): Promise<any> {
    return await apiCall('/tasks/agent/batch-create', {
      method: 'POST',
      body: JSON.stringify({
        userInput,
        date,
      }),
    });
  },
};

// Service pour les matières
export const subjectsService = {
  // Récupérer toutes les matières
  async getAll(): Promise<any> {
    console.log('📥 [subjectsService] Récupération des matières...');
    try {
      const result = await apiCall('/subjects');
      console.log('✅ [subjectsService] Matières récupérées:', result);
      return result;
    } catch (error) {
      console.error('❌ [subjectsService] Erreur lors de la récupération:', error);
      throw error;
    }
  },

  // Créer une matière
  async create(subjectData: { name: string; coefficient: number; deadline?: string | null }): Promise<any> {
    console.log('📤 [subjectsService] Création matière - Données:', JSON.stringify(subjectData));
    console.log('📤 [subjectsService] URL complète:', `${API_BASE_URL}/subjects`);
    
    try {
      const result = await apiCall('/subjects', {
        method: 'POST',
        body: JSON.stringify(subjectData),
      });
      console.log('✅ [subjectsService] Matière créée avec succès:', result);
      return result;
    } catch (error: any) {
      console.error('❌ [subjectsService] Erreur lors de la création:', error);
      console.error('❌ [subjectsService] Type d erreur:', error?.constructor?.name);
      console.error('❌ [subjectsService] Message d erreur:', error?.message);
      
      // Re-lancer l'erreur avec un message plus descriptif si nécessaire
      if (error instanceof TypeError) {
        throw new Error('Erreur de connexion. Vérifiez votre connexion internet et que le serveur est accessible.');
      }
      throw error;
    }
  },

  // Analyser une image pour extraire les matières
  async analyzeImage(imageUri: string): Promise<{
    success: boolean;
    subjects: Array<{ name: string; coefficient: number; ue?: string | null }>;
    totalFound: number;
    validCount: number;
    skippedCount: number;
  }> {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Non authentifié');
      }

      // Créer un FormData avec l'image
      // Pour React Native, on doit utiliser un objet avec uri, type, name
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'subject-image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('image', {
        uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
        type: type,
        name: filename,
      } as any);

      const response = await fetch(`${API_BASE_URL}/subjects/analyze-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Ne pas définir Content-Type, FormData le fait automatiquement avec boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('❌ [subjectsService] Erreur analyse image:', error);
      throw error;
    }
  },
};

// Service pour les projets
export const projectsService = {
  // Récupérer tous les projets
  async getProjects(): Promise<any> {
    return await apiCall('/projects');
  },

  // Créer un nouveau projet
  async createProject(projectData: {
    name: string;
    description?: string;
    color?: string;
  }): Promise<any> {
    return await apiCall('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  // Mettre à jour un projet
  async updateProject(projectId: string, updates: any): Promise<any> {
    return await apiCall(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Supprimer un projet
  async deleteProject(projectId: string): Promise<any> {
    return await apiCall(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  },
};

// Service de paiement Stripe
export const paymentService = {
  // Créer un PaymentIntent pour Apple Pay / Google Pay
  async createPaymentIntent(billingType: 'monthly' | 'annual'): Promise<{
    clientSecret: string;
    customerId: string;
    amount: number;
    currency: string;
  }> {
    const user = await authService.checkAuth();
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    return await apiCall('/stripe/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({
        userId: user.id,
        billingType,
      }),
    });
  },

  // Créer une session de checkout Stripe
  async createCheckoutSession(billingType: 'monthly' | 'annual'): Promise<{
    url: string;
  }> {
    // Vérifier que l'utilisateur est authentifié
    const user = await authService.checkAuth();
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    console.log('💳 [PAYMENT] Création de session checkout:', {
      billingType,
      userId: user.id,
      billingTypeType: typeof billingType
    });
    
    // Envoyer le userId dans le body comme fallback (le serveur utilisera le token en priorité)
    const result = await apiCall('/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({
        userId: user.id, // Fallback si le token ne fonctionne pas
        billingType,
      }),
    });
    
    console.log('💳 [PAYMENT] Session créée:', result);
    return result;
  },

  // Confirmer l'abonnement après paiement
  async confirmSubscription(
    paymentMethodId: string,
    billingType: 'monthly' | 'annual'
  ): Promise<{
    success: boolean;
    subscriptionId: string;
    status: string;
  }> {
    const user = await authService.checkAuth();
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    return await apiCall('/stripe/confirm-subscription', {
      method: 'POST',
      body: JSON.stringify({
        userId: user.id,
        paymentMethodId,
        billingType,
      }),
    });
  },
};

// Types pour l'onboarding (nouveau design)
export interface OnboardingDataInput {
  // Langue
  language?: string;
  
  // Identité
  firstName?: string;
  studentType?: string;
  
  // Objectifs & Pression
  goals?: string[];
  pressureLevel?: number;
  
  // Contexte académique
  currentSituation?: string;
  
  // Difficultés quotidiennes
  dailyStruggles?: string[];
  
  // Style de travail
  mentalLoad?: number;
  focusQuality?: number;
  satisfaction?: number;
  overthinkTasks?: boolean;
  shouldDoMore?: boolean;
  
  // Intentions
  wantToChange?: string[];
  timeHorizon?: string;
  
  // Tâches & Journée idéale
  rawTasks?: string;
  clarifiedTasks?: any[];
  idealDay?: any;
  
  // Ancien questionnaire (compatibilité)
  diagBehavior?: string;
  timeFeeling?: string;
  phoneHabit?: string;
  mainGoal?: string;
  
  // Métadonnées
  billingCycle?: 'monthly' | 'annual' | 'yearly';
  currentStep?: number;
  completed?: boolean;
  utmParams?: any;
}

// Service d'onboarding
export const onboardingService = {
  // Sauvegarder les données d'onboarding
  async saveOnboardingData(data: OnboardingDataInput): Promise<{ data: any }> {
    const token = await getAuthToken();
    if (!token) {
      console.error('❌ [ONBOARDING] Aucun token trouvé');
      throw new Error('User not authenticated - no token found');
    }

    // Construire le payload avec tous les champs
    const payload: Record<string, any> = {};
    
    // Copier tous les champs définis
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        payload[key] = value;
      }
    });

    console.log('💾 [ONBOARDING] Sauvegarde des données');

    try {
      const result = await apiCall('/onboarding/data', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      console.log('✅ [ONBOARDING] Données sauvegardées');
      return result;
    } catch (error: any) {
      console.error('❌ [ONBOARDING] Erreur:', error?.message);
      throw error;
    }
  },

  // Récupérer les données d'onboarding
  async getOnboardingData(): Promise<{ data: any }> {
    return await apiCall('/onboarding/data');
  },
};

// Service Google Calendar (mobile)
export const googleCalendarService = {
  // Vérifier si Google Calendar est connecté
  async getStatus(): Promise<{
    connected: boolean;
    isExpired?: boolean;
    expiresAt?: string;
    scope?: string;
  }> {
    return await apiCall('/google-calendar/connect-mobile');
  },

  // Connecter Google Calendar avec le serverAuthCode
  async connect(serverAuthCode: string): Promise<{
    success: boolean;
    message: string;
    expiresAt?: string;
  }> {
    return await apiCall('/google-calendar/connect-mobile', {
      method: 'POST',
      body: JSON.stringify({ serverAuthCode }),
    });
  },

  // Récupérer les événements du jour depuis Google Calendar
  async getTodayEvents(): Promise<{
    events: Array<{
      id: string;
      summary: string;
      description?: string;
      start: string;
      end: string;
      timeZone: string;
      isAllDay?: boolean;
      isProductif: boolean;
    }>;
    connected: boolean;
  }> {
    try {
      return await apiCall('/google-calendar/events');
    } catch (error: any) {
      console.error('❌ [GoogleCalendarService] Erreur récupération événements:', error);
      return {
        events: [],
        connected: false,
      };
    }
  },

  // Créer un événement dans Google Calendar pour une tâche
  async scheduleTask(taskId: string, start: string, end: string, timezone?: string): Promise<{
    success: boolean;
    eventId?: string;
    error?: string;
  }> {
    try {
      return await apiCall('/calendar/schedule', {
        method: 'POST',
        body: JSON.stringify({
          taskId,
          start,
          end,
          timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
    } catch (error: any) {
      console.error('❌ [GoogleCalendarService] Erreur création événement:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la création de l\'événement',
      };
    }
  },
};

// Service Apple Calendar
export const appleCalendarService = {
  // Vérifier si Apple Calendar est connecté
  async getStatus(): Promise<{
    connected: boolean;
    calendarIds?: string[];
    connectedAt?: string;
  }> {
    return await apiCall('/apple-calendar/connect');
  },

  // Signaler que l'accès Apple Calendar a été accordé
  async connect(granted: boolean, calendarIds?: string[]): Promise<{
    success: boolean;
    message: string;
  }> {
    return await apiCall('/apple-calendar/connect', {
      method: 'POST',
      body: JSON.stringify({ granted, calendarIds }),
    });
  },

  // Déconnecter Apple Calendar
  async disconnect(): Promise<{ success: boolean; message: string }> {
    return await apiCall('/apple-calendar/connect', {
      method: 'DELETE',
    });
  },
};

// Service de trial
export const trialService = {
  // Démarrer un free trial de 7 jours
  async startTrial(): Promise<{
    success: boolean;
    message: string;
  }> {
    return await apiCall('/user/start-trial', {
      method: 'POST',
    });
  },
};

// Service de planification hebdomadaire
export const weeklyPlanningService = {
  // Générer un plan hebdomadaire (preview)
  async generatePlan(weekStart?: string): Promise<{
    success: boolean;
    plan: {
      sessions: Array<{
        subjectId: string;
        subjectName: string;
        tasks: string[];
        start: string;
        end: string;
        durationMinutes: number;
        priority: number;
      }>;
      summary: {
        totalSessions: number;
        totalMinutes: number;
        subjectsCovered: string[];
        distribution: Record<string, number>;
      };
    };
  }> {
    const params = weekStart ? `?weekStart=${weekStart}` : '';
    return await apiCall(`/planning/weekly-plan${params}`);
  },

  // Appliquer le plan (créer les événements dans Google Calendar)
  async applyPlan(weekStart?: string): Promise<{
    success: boolean;
    plan: any;
    applied: boolean;
    eventsCreated: number;
    eventsFailed: number;
    message: string;
  }> {
    return await apiCall('/planning/weekly-plan', {
      method: 'POST',
      body: JSON.stringify({
        weekStart,
        apply: true,
      }),
    });
  },
};

// Service pour associer les tâches aux matières
export const taskAssociationService = {
  // Analyser une transcription et associer les tâches aux matières
  async associateTasks(transcription: string): Promise<{
    success: boolean;
    tasks: Array<{
      title: string;
      description?: string;
      priority: number;
      energy: number;
      estimatedDuration: number;
      subjectId: string | null;
      subjectName: string | null;
      confidence: number;
    }>;
    summary: string;
    targetDate: string;
    subjects: Array<{
      id: string;
      name: string;
      coefficient: number;
    }>;
  }> {
    return await apiCall('/tasks/associate-subjects', {
      method: 'POST',
      body: JSON.stringify({ transcription }),
    });
  },
}; 

// Service de gamification (classement, points, etc.)
export const gamificationService = {
  async getLeaderboard(limit: number = 5, includeUserRank: boolean = true): Promise<{
    leaderboard: Array<{
      userId: string;
      userName: string | null;
      userEmail: string;
      totalPoints: number;
      level: number;
      currentStreak: number;
      longestStreak: number;
      totalHabitsCompleted: number;
      achievements: number;
      rank: number;
    }>;
    userRank?: number;
    totalUsers?: number;
  } | Array<any>> {
    const params = `?limit=${limit}&includeUserRank=${includeUserRank ? 'true' : 'false'}`;
    return await apiCall(`/gamification/leaderboard${params}`);
  },

  // Récupérer le classement des amis
  async getFriendsLeaderboard(): Promise<Array<{
    userId: string;
    userName: string | null;
    userEmail: string;
    totalPoints: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
    totalHabitsCompleted: number;
    achievements: number;
    rank: number;
  }>> {
    try {
      // Récupérer les utilisateurs de la même entreprise
      const companyUsers = await apiCall('/my-company/users');
      if (!companyUsers || !companyUsers.users || companyUsers.users.length === 0) {
        console.log('ℹ️ Aucun utilisateur dans l\'entreprise');
        return [];
      }

      // Récupérer le classement général
      const leaderboard = await apiCall('/gamification/leaderboard?limit=100&includeUserRank=false');
      const leaderboardData = Array.isArray(leaderboard) ? leaderboard : (leaderboard?.leaderboard || []);
      
      if (!leaderboardData || leaderboardData.length === 0) {
        console.log('ℹ️ Aucun classement disponible');
        return [];
      }

      // Filtrer pour ne garder que les utilisateurs de l'entreprise
      const companyUserIds = companyUsers.users.map((u: any) => u.id);
      const friendsLeaderboard = leaderboardData
        .filter((entry: any) => companyUserIds.includes(entry.userId))
        .sort((a: any, b: any) => (b.totalPoints || 0) - (a.totalPoints || 0))
        .map((entry: any, index: number) => ({
          ...entry,
          rank: index + 1,
        }));
      
      return friendsLeaderboard;
    } catch (error) {
      console.error('❌ Erreur récupération classement amis:', error);
      return [];
    }
  },
  
  async getAchievements(): Promise<{
    achievements: Array<{
      id: string;
      name: string;
      description: string;
      type: string;
      points: number;
      threshold: number;
      unlocked: boolean;
      unlockedAt: string | null;
    }>;
    totalUnlocked: number;
    totalAvailable: number;
  }> {
    return await apiCall('/gamification/achievements');
  },

  // Récupérer les groupes de l'utilisateur
  async getUserGroups(): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    memberCount?: number;
    type?: string;
  }>> {
    try {
      const response = await apiCall('/gamification/groups');
      if (Array.isArray(response)) {
        return response;
      }
      if (response && response.groups) {
        return response.groups;
      }
      return [];
    } catch (error) {
      console.error('❌ Erreur récupération groupes:', error);
      return [];
    }
  },

  // Récupérer le classement d'un groupe spécifique
  async getGroupLeaderboard(groupId: string): Promise<Array<{
    userId: string;
    userName: string | null;
    userEmail: string;
    totalPoints: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
    totalHabitsCompleted: number;
    achievements: number;
    rank: number;
  }>> {
    try {
      const response = await apiCall(`/gamification/groups/${groupId}/leaderboard`);
      if (Array.isArray(response)) {
        return response;
      }
      if (response && response.leaderboard) {
        return response.leaderboard;
      }
      return [];
    } catch (error) {
      console.error('❌ Erreur récupération classement groupe:', error);
      return [];
    }
  },

  // Créer un nouveau groupe
  async createGroup(data: {
    name: string;
    description?: string;
    memberIds?: string[];
  }): Promise<{
    id: string;
    name: string;
    description?: string;
    memberCount?: number;
    type?: string;
  }> {
    return await apiCall('/gamification/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Service pour l'assistant IA
export const assistantService = {
  // Récupérer la session Deep Work active (s'il y en a une)
  async getActiveDeepWorkSession(): Promise<any> {
    return await apiCall('/deepwork/agent?status=active&limit=1');
  },

  // Démarrer une session Deep Work
  async startDeepWorkSession(plannedDuration: number, type: string = 'deepwork', description?: string): Promise<any> {
    // Note: Cette API nécessite un token API avec les scopes deepwork:write et tasks:write
    // Pour l'instant, on utilise l'endpoint normal qui nécessite l'authentification utilisateur
    // Il faudra peut-être créer un endpoint spécifique pour l'app mobile
    return await apiCall('/deepwork/agent', {
      method: 'POST',
      body: JSON.stringify({
        plannedDuration,
        type,
        description,
      }),
    });
  },

  // Terminer/compléter une session Deep Work
  // actions supportées côté backend: complete, cancel, pause, resume, add_interruption
  async endDeepWorkSession(sessionId: string, action: 'complete' | 'cancel' = 'complete'): Promise<any> {
    return await apiCall(`/deepwork/agent/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    });
  },

  // XP - ajouter un événement
  async addXpEvent(type: string, payload: any = {}): Promise<any> {
    return await apiCall('/xp/events', {
      method: 'POST',
      body: JSON.stringify({ type, payload }),
    });
  },

  // XP - statut actuel
  async getXpStatus(): Promise<any> {
    return await apiCall('/xp/status');
  },

  // XP - leaderboard (range: all | weekly)
  async getXpLeaderboard(range: 'all' | 'weekly' = 'weekly', limit: number = 10): Promise<any> {
    return await apiCall(`/xp/leaderboard?range=${range}&limit=${limit}`);
  },

  // XP - défi hebdomadaire (progression personnelle)
  async getXpWeeklyChallenge(): Promise<any> {
    return await apiCall('/xp/weekly-challenge');
  },

  // Récupérer les tâches d'aujourd'hui
  async getTodayTasks(): Promise<any> {
    return await apiCall('/tasks/today');
  },

  // Créer des tâches intelligentes (plan tomorrow)
  async planTomorrow(userInput: string, date?: string): Promise<any> {
    return await apiCall('/tasks/agent/batch-create', {
      method: 'POST',
      body: JSON.stringify({
        userInput,
        date,
      }),
    });
  },

  // Envoyer un message au chat et recevoir une réponse de l'agent IA
  async sendChatMessage(message: string): Promise<any> {
    return await apiCall('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
      }),
    });
  },

  // Enregistrer un journaling
  async saveJournal(transcription: string, date?: string): Promise<any> {
    return await apiCall('/journal/agent', {
      method: 'POST',
      body: JSON.stringify({
        transcription,
        date: date || new Date().toISOString(),
      }),
    });
  },
};

// Service pour les journaux
export const journalService = {
  // Enregistrer un journal complet
  async saveJournalEntry(data: {
    date: string;
    emotionalLevel: number;
    energyLevel: number;
    note?: string;
  }): Promise<any> {
    // Utiliser l'endpoint /journal/agent avec la note complète
    const transcription = `Emotional Level: ${data.emotionalLevel}/100 (${data.emotionalLevel < 25 ? 'Calm' : data.emotionalLevel < 50 ? 'Steady' : data.emotionalLevel < 75 ? 'Tense' : 'Heavy'})\nEnergy Level: ${data.energyLevel}/100 (${data.energyLevel < 25 ? 'Low' : data.energyLevel < 50 ? 'Moderate' : data.energyLevel < 75 ? 'Good' : 'High'})\n${data.note ? `\n${data.note}` : ''}`;
    
    return await apiCall('/journal/agent', {
      method: 'POST',
      body: JSON.stringify({
        transcription,
        date: data.date,
        emotionalLevel: data.emotionalLevel,
        energyLevel: data.energyLevel,
        note: data.note,
      }),
    });
  },

  // Récupérer tous les journaux (utilise l'endpoint agent si disponible)
  async getAll(): Promise<any> {
    try {
      // Essayer d'abord /journal/agent
      return await apiCall('/journal/agent');
    } catch (error) {
      // Si l'endpoint n'existe pas, retourner un tableau vide
      console.warn('⚠️ Endpoint /journal/agent non disponible, retour d\'un tableau vide');
      return [];
    }
  },

  // Récupérer un journal pour une date spécifique
  async getByDate(date: string): Promise<any> {
    try {
      return await apiCall(`/journal/agent?date=${date}`);
    } catch (error) {
      console.warn('⚠️ Endpoint /journal/agent non disponible pour cette date');
      return null;
    }
  },
};