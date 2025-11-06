// src/router/routes-example-for-bom.ts
// Tento soubor obsahuje příklad, jak přidat BOM routu do vašeho router/index.ts

/**
 * INSTRUKCE PRO INTEGRACI BOM ROUTY
 * 
 * 1. Otevřete soubor src/router/index.ts
 * 
 * 2. Přidejte import pro ProductBomPage:
 */

import ProductBomPage from '@/views/utilities/products/ProductBomPage.vue';

/**
 * 3. Najděte sekci s routes a přidejte novou routu pro BOM:
 * 
 * Příklad umístění - přidejte tuto routu mezi ostatní product routes:
 */

const routeExample = {
  path: '/',
  component: () => import('@/layouts/full/FullLayout.vue'),
  children: [
    // ... ostatní routes ...
    
    {
      name: 'ProductDetail',
      path: '/products/:id',
      component: () => import('@/views/utilities/products/ProductDetailPage.vue')
    },
    
    // ⭐ PŘIDEJTE TUTO ROUTU ⭐
    {
      name: 'ProductBom',
      path: '/products/:id/bom',
      component: () => import('@/views/utilities/products/ProductBomPage.vue'),
      meta: {
        requiresAuth: true
      }
    },
    
    // ... ostatní routes ...
  ]
};

/**
 * 4. V ProductDetailPage.vue přidejte tlačítko pro navigaci na BOM:
 * 
 * Příklad umístění - v action buttons sekci:
 */

const actionButtonsExample = `
<template>
  <!-- V ProductDetailPage.vue -->
  <div class="d-flex gap-2">
    <v-btn
      color="info"
      prepend-icon="mdi-file-tree"
      @click="router.push(\`/products/\${productId}/bom\`)"
    >
      Kusovník (BOM)
    </v-btn>
    
    <v-btn
      v-if="!editMode"
      color="primary"
      prepend-icon="mdi-pencil"
      @click="toggleEditMode"
    >
      Upravit
    </v-btn>
    
    <!-- ... ostatní tlačítka ... -->
  </div>
</template>
`;

/**
 * 5. KOMPLETNÍ PŘÍKLAD INTEGRACE DO ROUTERU
 * 
 * Pokud máte router strukturu podobnou této:
 */

const completeRouterExample = {
  routes: [
    {
      path: '/',
      redirect: '/dashboard/default',
      component: () => import('@/layouts/full/FullLayout.vue'),
      meta: {
        requiresAuth: true
      },
      children: [
        // Dashboard
        {
          name: 'Dashboard',
          path: 'dashboard/default',
          component: () => import('@/views/dashboards/default/DefaultDashboard.vue')
        },
        
        // Products
        {
          name: 'Products',
          path: 'products',
          component: () => import('@/views/utilities/products/ProductsPage.vue')
        },
        {
          name: 'ProductCreate',
          path: 'products/new',
          component: () => import('@/views/utilities/products/ProductCreatePage.vue')
        },
        {
          name: 'ProductDetail',
          path: 'products/:id',
          component: () => import('@/views/utilities/products/ProductDetailPage.vue')
        },
        // ⭐ NOVÁ ROUTA PRO BOM ⭐
        {
          name: 'ProductBom',
          path: 'products/:id/bom',
          component: () => import('@/views/utilities/products/ProductBomPage.vue')
        },
        
        // ... ostatní routes ...
      ]
    }
  ]
};

/**
 * 6. POZNÁMKY K IMPLEMENTACI
 * 
 * - BOM lze vytvořit pouze pro produkty s stockType = 'typZasoby.vyrobek'
 * - Všechny soubory jsou připravené v /mnt/user-data/outputs/
 * - Nezapomeňte zkopírovat všechny 3 soubory do správných adresářů:
 *   1. bomService.ts -> src/services/
 *   2. BOMTreeNode.vue -> src/components/bom/ (vytvořte složku bom)
 *   3. ProductBomPage.vue -> src/views/utilities/products/
 */

export {};