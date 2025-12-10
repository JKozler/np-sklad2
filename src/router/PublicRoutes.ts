const PublicRoutes = {
  path: '/',
  component: () => import('@/layouts/blank/BlankLayout.vue'),
  meta: {
    requiresAuth: false
  },
  children: [
    {
      name: 'Authentication',
      path: '/login',
      component: () => import('@/views/authentication/LoginPage.vue'),
      meta: { title: 'Přihlášení' }
    },
    {
      name: 'Login',
      path: '/login1',
      component: () => import('@/views/authentication/auth/LoginPage.vue'),
      meta: { title: 'Přihlášení' }
    },
    {
      name: 'Register',
      path: '/register',
      component: () => import('@/views/authentication/auth/RegisterPage.vue'),
      meta: { title: 'Registrace' }
    },
    {
      name: 'Error 404',
      path: '/error',
      component: () => import('@/views/pages/maintenance/error/Error404Page.vue'),
      meta: { title: 'Stránka nenalezena' }
    }
  ]
};

export default PublicRoutes;
