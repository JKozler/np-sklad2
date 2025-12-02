// src/stores/auth.ts
import { defineStore } from 'pinia';
import { router } from '@/router';
import { authService } from '@/services/authService';
import type { User, LoginCredentials } from '@/services/authService';

export const useAuthStore = defineStore({
  id: 'auth',
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null') as User | null,
    returnUrl: null as string | null,
    loading: false,
    error: null as string | null
  }),

  getters: {
    isAuthenticated: (state) => {
      const hasUser = !!state.user;
      const hasCredentials = !!localStorage.getItem('authUsername') && !!localStorage.getItem('authPassword');
      
      console.log('🔐 Auth check:', {
        hasUser,
        hasCredentials,
        userName: state.user?.userName
      });
      
      return hasUser && hasCredentials;
    },
    isAdmin: (state) => state.user?.role === 'admin' || state.user?.type === 'admin',
    currentUser: (state) => state.user,
    fullName: (state) => state.user ? `${state.user.firstName} ${state.user.lastName}` : '',
    userName: (state) => state.user?.userName || ''
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

    async logout() {
      try {
        await authService.logout();
      } finally {
        this.user = null;
        localStorage.removeItem('user');
        router.push('/login');
      }
    },

    async verifySession() {
      if (!this.user) return false;

      try {
        const isValid = await authService.verifySession();
        if (!isValid) {
          await this.logout();
          return false;
        }

        // Refresh user data from localStorage after verifySession updates it
        const updatedUser = JSON.parse(localStorage.getItem('user') || 'null');
        if (updatedUser) {
          this.user = updatedUser;
          console.log('✅ User data refreshed, dashboards:', updatedUser.dashboards);
        }

        return true;
      } catch {
        await this.logout();
        return false;
      }
    },

    clearError() {
      this.error = null;
    }
  }
});