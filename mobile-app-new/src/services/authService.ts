bimport { CapacitorHttp } from '@capacitor/core';
import { TokenStorage } from '../../lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
}

export interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  private API_URL = 'https://www.productif.io/api';

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await CapacitorHttp.post({
      url: `${this.API_URL}/auth/login`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        email,
        password
      }
    });

    if (response.status !== 200) {
      throw new Error(response.data?.message || 'Erreur de connexion');
    }

    // Stocker le token
    await TokenStorage.getInstance().setToken(response.data.token);
    
    return response.data;
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await CapacitorHttp.post({
      url: `${this.API_URL}/auth/register`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        name,
        email,
        password
      }
    });

    if (response.status !== 200) {
      throw new Error(response.data?.message || 'Erreur lors de l\'inscription');
    }

    // Stocker le token
    await TokenStorage.getInstance().setToken(response.data.token);
    
    return response.data;
  }

  async getCurrentUser(): Promise<User | null> {
    const token = await TokenStorage.getInstance().getToken();
    if (!token) return null;

    try {
      const response = await CapacitorHttp.get({
        url: `${this.API_URL}/auth/me`,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        return response.data;
      }
      
      return null;
    } catch {
      await TokenStorage.getInstance().clearToken();
      return null;
    }
  }

  async logout(): Promise<void> {
    await TokenStorage.getInstance().clearToken();
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await TokenStorage.getInstance().getToken();
    return !!token;
  }
}

export const authService = new AuthService(); 