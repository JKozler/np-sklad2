// src/services/authService.ts
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  role: 'admin' | 'user';
  token: string;
  type?: string;
  dashboards?: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface EspoCRMResponse {
  user: {
    id: string;
    name: string;
    userName: string;
    type: string;
    firstName: string;
    lastName: string;
    emailAddress: string | null;
    token: string;
    dashboards?: string[];
  };
}

// DŮLEŽITÉ: V development módu používáme POUZE proxy endpoint
const API_BASE_URL = 'https://smart-int-be.naturalprotein.net/api/v1';

export const authService = {
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      console.log('🔐 Attempting login for:', credentials.username);
      
      const authHeader = 'Basic ' + btoa(`${credentials.username}:${credentials.password}`);
      const base64Credentials = authHeader.replace('Basic ', '');
      
      console.log('📡 Calling API:', `${API_BASE_URL}/App/user`);
      
      const response = await fetch(`${API_BASE_URL}/App/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
          'Espo-Authorization': base64Credentials,
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Nesprávné přihlašovací údaje');
        }
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error('Chyba při přihlášení');
      }

      const data: EspoCRMResponse = await response.json();
      console.log('✅ Login successful:', data.user.userName);
      console.log('📊 User dashboards:', data.user.dashboards);

      const user: User = {
        id: data.user.id,
        email: data.user.emailAddress || data.user.userName,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        userName: data.user.userName,
        role: data.user.type === 'admin' ? 'admin' : 'user',
        token: data.user.token,
        type: data.user.type,
        dashboards: data.user.dashboards || []
      };

      localStorage.setItem('authToken', data.user.token);
      localStorage.setItem('authUsername', credentials.username);
      localStorage.setItem('authPassword', credentials.password);

      return user;
    } catch (error) {
      console.error('❌ Login error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Chyba při přihlášení');
    }
  },

  async logout(): Promise<void> {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUsername');
      localStorage.removeItem('authPassword');
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  async verifySession(): Promise<boolean> {
    const username = localStorage.getItem('authUsername');
    const password = localStorage.getItem('authPassword');
    
    if (!username || !password) return false;

    try {
      const authHeader = 'Basic ' + btoa(`${username}:${password}`);
      const base64Credentials = authHeader.replace('Basic ', '');
      
      const response = await fetch(`${API_BASE_URL}/App/user`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Espo-Authorization': base64Credentials,
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      return response.ok;
    } catch {
      return false;
    }
  },

  async refreshToken(): Promise<string> {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No token found');
    return token;
  }
};