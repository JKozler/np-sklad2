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
      component: () => import('@/views/dashboards/default/DefaultDashboard.vue')
    },
    {
      name: 'Default',
      path: '/dashboard/default',
      component: () => import('@/views/dashboards/default/DefaultDashboard.vue')
    },
    {
      path: '/profile',
      name: 'UserProfile',
      component: () => import('@/views/utilities/settings/UserProfilePage.vue')
    },
    // Obchod
    {
      name: 'Objednávky',
      path: '/orders',
      component: () => import('@/views/utilities/orders/OrdersPage.vue')
    },
    {
      name: 'Detail objednávky',
      path: '/orders/:id',
      component: () => import('@/views/utilities/orders/OrderDetailPage.vue')
    },
    // Výroba
    {
      name: 'Balíky',
      path: '/packages',
      component: () => import('@/views/utilities/packages/PackagesPage.vue')
    },
    {
      name: 'Detail balíku',
      path: '/packages/:id',
      component: () => import('@/views/utilities/packages/PackageDetailPage.vue')
    },
    {
      name: 'Výrobní příkazy',
      path: '/production-orders',
      component: () => import('@/views/utilities/production/ProductionOrdersPage.vue')
    },
    {
      name: 'Nový výrobní příkaz',
      path: '/production-orders/new',
      component: () => import('@/views/utilities/production/ProductionOrderDetailPage.vue')
    },
    {
      name: 'Detail výrobního příkazu',
      path: '/production-orders/:id',
      component: () => import('@/views/utilities/production/ProductionOrderDetailPage.vue')
    },
    {
      name: 'Zákazníci',
      path: '/customers',
      component: () => import('@/views/utilities/customers/CustomersPage.vue')
    },
    {
      name: 'Faktury',
      path: '/invoices',
      component: () => import('@/views/utilities/invoices/InvoicesPage.vue')
    },
    {
      name: 'Skladové pohyby',
      path: '/inventory-transactions',
      component: () => import('@/views/utilities/inventory/InventoryTransactionsPage.vue')
    },
    {
      name: 'Příjemky',
      path: '/prijemky',
      component: () => import('@/views/utilities/inventory/InventoryTransactionsPage.vue')
    },
    {
      name: 'Výdejky',
      path: '/vydejky',
      component: () => import('@/views/utilities/inventory/InventoryTransactionsPage.vue')
    },
    {
      name: 'Dopravci',
      path: '/carriers',
      component: () => import('@/views/utilities/carriers/CarriersPage.vue')
    },
    {
      name: 'Sklady',
      path: '/warehouses',
      component: () => import('@/views/utilities/warehouses/WarehousesPage.vue')
    },
    {
      name: 'Nový skladový pohyb',
      path: '/inventory-transactions/new',
      component: () => import('@/views/utilities/inventory/InventoryTransactionCreatePage.vue')
    },
    {
      name: 'Detail skladového pohybu',
      path: '/inventory-transactions/:id',
      component: () => import('@/views/utilities/inventory/InventoryTransactionDetailPage.vue')
    },
    {
      name: 'Denní přehled skladových pohybů',
      path: '/inventory-daily-summary',
      component: () => import('@/views/utilities/inventory/InventoryDailySummaryPage.vue')
    },
    // Sklad
    {
      name: 'Produkty',
      path: '/products',
      component: () => import('@/views/utilities/products/ProductsPage.vue')
    },
    {
      name: 'Nový produkt',
      path: '/products/new',
      component: () => import('@/views/utilities/products/ProductCreatePage.vue')
    },
    {
      name: 'Detail produktu',
      path: '/products/:id',
      component: () => import('@/views/utilities/products/ProductDetailPage.vue')
    },
    // ⭐ NOVÁ ROUTA PRO BOM ⭐
    {
      name: 'ProductBom',
      path: '/products/:id/bom',
      component: () => import('@/views/utilities/products/ProductBomPage.vue'),
      meta: {
        requiresAuth: true
      }
    },
    {
      name: 'Nákupní žádosti',
      path: '/purchase-requests',
      component: () => import('@/views/utilities/purchase/PurchaseRequestsPage.vue')
    },
    {
      name: 'Dodavatelé',
      path: '/suppliers',
      component: () => import('@/views/utilities/suppliers/SuppliersPage.vue')
    },
    
    // Statistiky
    {
      name: 'Reporty',
      path: '/reports',
      component: () => import('@/views/utilities/reports/ReportsPage.vue')
    },
    
    // Nastavení
    {
      name: 'Synchronizace Abra',
      path: '/settings/sync',
      component: () => import('@/views/utilities/settings/SyncAbraPage.vue')
    },
    {
      name: 'Uživatelé',
      path: '/settings/users',
      component: () => import('@/views/utilities/settings/UsersPage.vue')
    },
    {
      name: 'Obecné nastavení',
      path: '/settings/general',
      component: () => import('@/views/utilities/settings/GeneralPage.vue')
    },
    
    // Legacy routes
    {
      name: 'Starter',
      path: '/starter',
      component: () => import('@/views/StarterPage.vue')
    },
    {
      name: 'Tabler Icons',
      path: '/icons/tabler',
      component: () => import('@/views/utilities/icons/TablerIcons.vue')
    },
    {
      name: 'Material Icons',
      path: '/icons/material',
      component: () => import('@/views/utilities/icons/MaterialIcons.vue')
    },
    {
      name: 'Typography',
      path: '/utils/typography',
      component: () => import('@/views/utilities/typography/TypographyPage.vue')
    },
    {
      name: 'Shadows',
      path: '/utils/shadows',
      component: () => import('@/views/utilities/shadows/ShadowPage.vue')
    },
    {
      name: 'Colors',
      path: '/utils/colors',
      component: () => import('@/views/utilities/colors/ColorPage.vue')
    }
  ]
};

export default MainRoutes;