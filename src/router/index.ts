// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import MainRoutes from './MainRoutes';
import PublicRoutes from './PublicRoutes';
import { useAuthStore } from '@/stores/auth';

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/views/pages/maintenance/error/Error404Page.vue')
    },
    MainRoutes,
    PublicRoutes
  ]
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const publicPages = ['/login', '/login1', '/register', '/error'];
  const authRequired = !publicPages.includes(to.path);

  // Pokud je stránka chráněná a uživatel není přihlášen
  if (authRequired && !authStore.isAuthenticated) {
    authStore.returnUrl = to.fullPath;
    return next('/login');
  }

  // Pokud je uživatel přihlášen a jde na login stránku
  if (authStore.isAuthenticated && to.path === '/login') {
    return next('/dashboard/default');
  }

  next();
});

export default router;