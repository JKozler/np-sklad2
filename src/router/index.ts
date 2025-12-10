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

  console.log('🛣️ Router guard:', {
    to: to.path,
    from: from.path,
    authRequired,
    isAuthenticated: authStore.isAuthenticated,
    hasUsername: !!localStorage.getItem('authUsername')
  });

  // Pokud je stránka chráněná a uživatel není přihlášen
  if (authRequired && !authStore.isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to login');
    authStore.returnUrl = to.fullPath;
    return next('/login');
  }

  // Pokud je uživatel přihlášen a jde na login stránku
  if (authStore.isAuthenticated && to.path === '/login') {
    console.log('✅ Already authenticated, redirecting to dashboard');
    return next('/dashboard/default');
  }

  console.log('✅ Router guard passed');
  next();
});

// Update document title based on route meta
router.afterEach((to) => {
  const baseTitle = 'NaturalProtein - sklad';
  const pageTitle = to.meta?.title as string | undefined;

  if (pageTitle) {
    document.title = `${pageTitle} | ${baseTitle}`;
  } else {
    document.title = baseTitle;
  }
});

export default router;