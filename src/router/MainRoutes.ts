// src/router/MainRoutes.ts
const MainRoutes = {
  path: '/main',
  meta: {
    requiresAuth: true
  },
  redirect: '/main/dashboard/default',
  component: () => import('@/layouts/full/FullLayout.vue'),
  children: [
    {
      name: 'LandingPage',
      path: '/',
      component: () => import('@/views/dashboards/default/DefaultDashboard.vue'),
      meta: { title: 'Dashboard' }
    },
    {
      name: 'Default',
      path: '/dashboard/default',
      component: () => import('@/views/dashboards/default/DefaultDashboard.vue'),
      meta: { title: 'Dashboard' }
    },
    {
      path: '/profile',
      name: 'UserProfile',
      component: () => import('@/views/utilities/settings/UserProfilePage.vue'),
      meta: { title: 'Můj profil' }
    },
    // Obchod
    {
      name: 'Objednávky',
      path: '/orders',
      component: () => import('@/views/utilities/orders/OrdersPage.vue'),
      meta: { title: 'Objednávky' }
    },
    {
      name: 'Detail objednávky',
      path: '/orders/:id',
      component: () => import('@/views/utilities/orders/OrderDetailPage.vue'),
      meta: { title: 'Detail objednávky' }
    },
    // Výroba
    {
      name: 'Balíky',
      path: '/packages',
      component: () => import('@/views/utilities/packages/PackagesPage.vue'),
      meta: { title: 'Balíky' }
    },
    {
      name: 'Detail balíku',
      path: '/packages/:id',
      component: () => import('@/views/utilities/packages/PackageDetailPage.vue'),
      meta: { title: 'Detail balíku' }
    },
    {
      name: 'Výrobní příkazy',
      path: '/production-orders',
      component: () => import('@/views/utilities/production/ProductionOrdersPage.vue'),
      meta: { title: 'Výrobní příkazy' }
    },
    {
      name: 'Nový výrobní příkaz',
      path: '/production-orders/new',
      component: () => import('@/views/utilities/production/ProductionOrderDetailPage.vue'),
      meta: { title: 'Nový výrobní příkaz' }
    },
    {
      name: 'Detail výrobního příkazu',
      path: '/production-orders/:id',
      component: () => import('@/views/utilities/production/ProductionOrderDetailPage.vue'),
      meta: { title: 'Detail výrobního příkazu' }
    },
    {
      name: 'Zákazníci',
      path: '/customers',
      component: () => import('@/views/utilities/customers/CustomersPage.vue'),
      meta: { title: 'Zákazníci' }
    },
    {
      name: 'Faktury',
      path: '/invoices',
      component: () => import('@/views/utilities/invoices/InvoicesPage.vue'),
      meta: { title: 'Faktury' }
    },
    {
      name: 'Skladové pohyby',
      path: '/inventory-transactions',
      component: () => import('@/views/utilities/inventory/InventoryTransactionsPage.vue'),
      meta: { title: 'Skladové pohyby' }
    },
    {
      name: 'Příjemky',
      path: '/prijemky',
      component: () => import('@/views/utilities/inventory/InventoryTransactionsPage.vue'),
      meta: { title: 'Příjemky' }
    },
    {
      name: 'Výdejky',
      path: '/vydejky',
      component: () => import('@/views/utilities/inventory/InventoryTransactionsPage.vue'),
      meta: { title: 'Výdejky' }
    },
    {
      name: 'Dopravci',
      path: '/carriers',
      component: () => import('@/views/utilities/carriers/CarriersPage.vue'),
      meta: { title: 'Dopravci' }
    },
    {
      name: 'Sklady',
      path: '/warehouses',
      component: () => import('@/views/utilities/warehouses/WarehousesPage.vue'),
      meta: { title: 'Sklady' }
    },
    {
      name: 'Nový skladový pohyb',
      path: '/inventory-transactions/new',
      component: () => import('@/views/utilities/inventory/InventoryTransactionCreatePage.vue'),
      meta: { title: 'Nový skladový pohyb' }
    },
    {
      name: 'Detail skladového pohybu',
      path: '/inventory-transactions/:id',
      component: () => import('@/views/utilities/inventory/InventoryTransactionDetailPage.vue'),
      meta: { title: 'Detail skladového pohybu' }
    },
    {
      name: 'Denní přehled skladových pohybů',
      path: '/inventory-daily-summary',
      component: () => import('@/views/utilities/inventory/InventoryDailySummaryPage.vue'),
      meta: { title: 'Denní přehled skladových pohybů' }
    },
    // Sklad
    {
      name: 'Produkty',
      path: '/products',
      component: () => import('@/views/utilities/products/ProductsPage.vue'),
      meta: { title: 'Produkty' }
    },
    {
      name: 'Nový produkt',
      path: '/products/new',
      component: () => import('@/views/utilities/products/ProductCreatePage.vue'),
      meta: { title: 'Nový produkt' }
    },
    {
      name: 'Detail produktu',
      path: '/products/:id',
      component: () => import('@/views/utilities/products/ProductDetailPage.vue'),
      meta: { title: 'Detail produktu' }
    },
    // ⭐ NOVÁ ROUTA PRO BOM ⭐
    {
      name: 'ProductBom',
      path: '/products/:id/bom',
      component: () => import('@/views/utilities/products/ProductBomPage.vue'),
      meta: {
        requiresAuth: true,
        title: 'Kusovník produktu'
      }
    },
    {
      name: 'Nákupní žádosti',
      path: '/purchase-requests',
      component: () => import('@/views/utilities/purchase/PurchaseRequestsPage.vue'),
      meta: { title: 'Nákupní žádosti' }
    },
    {
      name: 'Dodavatelé',
      path: '/suppliers',
      component: () => import('@/views/utilities/suppliers/SuppliersPage.vue'),
      meta: { title: 'Dodavatelé' }
    },

    // Statistiky
    {
      name: 'Reporty',
      path: '/reports',
      component: () => import('@/views/utilities/reports/ReportsPage.vue'),
      meta: { title: 'Reporty' }
    },

    // Nastavení
    {
      name: 'Synchronizace Abra',
      path: '/settings/sync',
      component: () => import('@/views/utilities/settings/SyncAbraPage.vue'),
      meta: { title: 'Synchronizace Abra' }
    },
    {
      name: 'Uživatelé',
      path: '/settings/users',
      component: () => import('@/views/utilities/settings/UsersPage.vue'),
      meta: { title: 'Uživatelé' }
    },
    {
      name: 'Obecné nastavení',
      path: '/settings/general',
      component: () => import('@/views/utilities/settings/GeneralPage.vue'),
      meta: { title: 'Obecné nastavení' }
    },
    
    // Legacy routes
    {
      name: 'Starter',
      path: '/starter',
      component: () => import('@/views/StarterPage.vue'),
      meta: { title: 'Starter' }
    },
    {
      name: 'Tabler Icons',
      path: '/icons/tabler',
      component: () => import('@/views/utilities/icons/TablerIcons.vue'),
      meta: { title: 'Tabler Icons' }
    },
    {
      name: 'Material Icons',
      path: '/icons/material',
      component: () => import('@/views/utilities/icons/MaterialIcons.vue'),
      meta: { title: 'Material Icons' }
    },
    {
      name: 'Typography',
      path: '/utils/typography',
      component: () => import('@/views/utilities/typography/TypographyPage.vue'),
      meta: { title: 'Typography' }
    },
    {
      name: 'Shadows',
      path: '/utils/shadows',
      component: () => import('@/views/utilities/shadows/ShadowPage.vue'),
      meta: { title: 'Shadows' }
    },
    {
      name: 'Colors',
      path: '/utils/colors',
      component: () => import('@/views/utilities/colors/ColorPage.vue'),
      meta: { title: 'Colors' }
    }
  ]
};

export default MainRoutes;