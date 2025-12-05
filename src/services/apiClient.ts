// src/services/apiClient.ts
const API_BASE_URL = 'https://smart-be.naturalprotein.net/api/v1';

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
}

export class ApiClient {
  private getAuthHeader(): string {
    const username = localStorage.getItem('authUsername');
    const password = localStorage.getItem('authPassword');
    
    if (!username || !password) {
      throw new Error('Not authenticated');
    }
    
    return 'Basic ' + btoa(`${username}:${password}`);
  }

  async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;
  
    try {
      const authHeader = this.getAuthHeader();
      const base64Credentials = authHeader.replace('Basic ', '');
      
      console.log('🔵 Full URL:', `${API_BASE_URL}${endpoint}`);
      console.log('🔑 Auth Header:', authHeader);
      console.log('🔐 Username:', localStorage.getItem('authUsername'));
      
      const requestHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authHeader,
        'Espo-Authorization': base64Credentials,
        ...headers
      };
      
      console.log('📤 Request Headers:', requestHeaders);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: requestHeaders,
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined
      });
  
      console.log('📥 Response:', response.status, response.statusText);
      
      // Zobraz response headers
      console.log('📥 Response Headers:');
      response.headers.forEach((value, key) => {
        console.log(`  ${key}: ${value}`);
      });
  
      if (!response.ok) {
        const responseText = await response.text();
        console.error('❌ Response body:', responseText);
        
        if (response.status === 401 || response.status === 403) {
          throw new Error('Access denied - check credentials');
        }
        
        throw new Error(`API Error: ${response.status} - ${responseText}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('🔴 API Request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  async put<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }
}

export const apiClient = new ApiClient();