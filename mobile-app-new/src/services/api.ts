import { TokenStorage } from '../../lib/api';

const API_BASE_URL = 'https://www.productif.io/api';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

class ApiService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const tokenStorage = TokenStorage.getInstance();
    const token = await tokenStorage.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur réseau' }));
      
      // Si token expiré, nettoyer le token
      if (response.status === 401) {
        const tokenStorage = TokenStorage.getInstance();
        await tokenStorage.clearToken();
        console.log('🔒 Token expiré, nettoyage effectué');
      }
      
      throw {
        message: errorData.message || `Erreur ${response.status}`,
        status: response.status,
        code: errorData.code,
      } as ApiError;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const headers = await this.getAuthHeaders();
    const url = `${API_BASE_URL}${endpoint}`;
    const hasAuth = 'Authorization' in headers;
    console.log(`🌐 [ApiService] POST ${url}`, {
      hasData: !!data,
      hasAuth,
      dataKeys: data ? Object.keys(data) : []
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    
    console.log(`📡 [ApiService] Réponse reçue:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    return this.handleResponse<T>(response);
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const tokenStorage = TokenStorage.getInstance();
    const token = await tokenStorage.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return this.handleResponse<T>(response);
  }
}

export const apiService = new ApiService(); 