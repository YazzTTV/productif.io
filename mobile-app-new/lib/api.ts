import AsyncStorage from '@react-native-async-storage/async-storage';

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
class TokenStorage {
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
    if (isAsyncStorageAvailable()) {
      try {
        await AsyncStorage.setItem('auth_token', token);
      } catch (error) {
        console.error('Error saving token:', error);
      }
    } else {
      console.warn('AsyncStorage not available, token stored in memory only');
    }
  }

  async getToken(): Promise<string | null> {
    if (this.token) {
      return this.token;
    }
    
    if (isAsyncStorageAvailable()) {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        this.token = token;
        return token;
      } catch (error) {
        console.error('Error getting token:', error);
        return null;
      }
    } else {
      console.warn('AsyncStorage not available, returning memory token only');
      return this.token;
    }
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
    console.log('🌐 apiCall - URL:', `${API_BASE_URL}${endpoint}`);
    console.log('🔑 apiCall - Token présent:', !!token);
    
    // Créer une promesse avec timeout
    const fetchPromise = fetch(`${API_BASE_URL}${endpoint}`, config);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout);
    });
    
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    console.log('📊 apiCall - Status:', response.status);
    console.log('📊 apiCall - Status Text:', response.statusText);
    
    if (!response.ok) {
      let errorData;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          // Si ce n'est pas du JSON, lire comme texte
          const text = await response.text();
          console.error('❌ apiCall - Réponse non-JSON:', text.substring(0, 200));
          throw new Error(`Erreur serveur (${response.status}): ${text.substring(0, 100)}`);
        }
      } catch (parseError) {
        // Si le parsing JSON échoue, lire comme texte
        const text = await response.text();
        console.error('❌ apiCall - Erreur de parsing:', parseError);
        console.error('❌ apiCall - Réponse brute:', text.substring(0, 200));
        throw new Error(`Erreur serveur (${response.status}): Réponse invalide`);
      }
      
      console.error('❌ apiCall - Erreur serveur:', errorData);
      throw new Error(errorData.error || errorData.message || 'Erreur de réseau');
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
    console.error('💥 API Error:', error);
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
    return await apiCall<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
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
  async getTrialStatus(): Promise<{ status: string; daysLeft?: number; hasAccess: boolean }> {
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
    return await apiCall('/habits', {
      method: 'DELETE',
      body: JSON.stringify({ habitId }),
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
};