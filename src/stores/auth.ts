// src/stores/auth.ts
import { defineStore } from 'pinia';
import { router } from '@/router';
import { authService } from '@/services/authService';
import type { User, LoginCredentials, RegisterData } from '@/types/auth';

export const useAuthStore = defineStore({
  id: 'auth',
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null') as User | null,
    returnUrl: null as string | null,
    loading: false,
    error: null as string | null
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.user?.role === 'admin',
    currentUser: (state) => state.user,
    fullName: (state) => state.user ? `${state.user.firstName} ${state.user.lastName}` : ''
  },

  actions: {
    async login(credentials: LoginCredentials) {
      this.loading = true;
      this.error = null;
      
      try {
        const user = await authService.login(credentials);
        
        this.user = user;
        localStorage.setItem('user', JSON.stringify(user));
        
        router.push(this.returnUrl || '/dashboard/default');
      } catch (error: any) {
        this.error = error.message || 'Chyba při přihlášení';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async register(data: RegisterData) {
      this.loading = true;
      this.error = null;
      
      try {
        const user = await authService.register(data);
        
        this.user = user;
        localStorage.setItem('user', JSON.stringify(user));
        
        router.push('/dashboard/default');
      } catch (error: any) {
        this.error = error.message || 'Chyba při registraci';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      try {
        await authService.logout();
      } finally {
        this.user = null;
        localStorage.removeItem('user');
        router.push('/login');
      }
    },

    clearError() {
      this.error = null;
    }
  }
});