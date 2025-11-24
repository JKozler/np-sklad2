<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

// Dashboard components
import CustomerSupportDashboard from '../customer-support/CustomerSupportDashboard.vue';
import WarehouseManagerDashboard from '../warehouse-manager/WarehouseManagerDashboard.vue';

// Default dashboard components
import TotalEarning from './components/TotalEarning.vue';
import TotalOrder from './components/TotalOrder.vue';
import TotalIncome from './components/TotalIncome.vue';
import TotalGrowth from './components/TotalGrowth.vue';
import PopularStocks from './components/PopularStocks.vue';

const authStore = useAuthStore();

// Determine which dashboard to show based on user dashboards
const currentDashboard = computed(() => {
  const userDashboards = authStore.currentUser?.dashboards || [];

  console.log('📊 User dashboards:', userDashboards);

  // Priority: WAREHOUSE_MANAGER > CUSTOMER_SUPPORT > default
  if (userDashboards.includes('WAREHOUSE_MANAGER')) {
    return 'WAREHOUSE_MANAGER';
  } else if (userDashboards.includes('CUSTOMER_SUPPORT')) {
    return 'CUSTOMER_SUPPORT';
  }

  return 'DEFAULT';
});
</script>

<template>
  <!-- Customer Support Dashboard -->
  <CustomerSupportDashboard v-if="currentDashboard === 'CUSTOMER_SUPPORT'" />

  <!-- Warehouse Manager Dashboard -->
  <WarehouseManagerDashboard v-else-if="currentDashboard === 'WAREHOUSE_MANAGER'" />

  <!-- Default Dashboard -->
  <v-row v-else>
    <!-- -------------------------------------------------------------------- -->
    <!-- Total Earning -->
    <!-- -------------------------------------------------------------------- -->
    <v-col cols="12" md="12">
      <TotalEarning />
    </v-col>
    <!-- -------------------------------------------------------------------- -->
    <!-- Total Income -->
    <!-- -------------------------------------------------------------------- -->
    <v-col cols="12" md="12">
      <TotalIncome />
    </v-col>
    <!-- -------------------------------------------------------------------- -->
    <!-- Total Order -->
    <!-- -------------------------------------------------------------------- -->
    <v-col cols="12" md="4">
      <TotalOrder />
    </v-col>

    <!-- -------------------------------------------------------------------- -->
    <!-- Total Growth -->
    <!--
    <v-col cols="12" lg="8">
      <TotalGrowth />
    </v-col> -->

    <!-- -------------------------------------------------------------------- -->
    <!-- Popular Stocks -->
    <!--
    <v-col cols="12" lg="4">
      <PopularStocks />
    </v-col> -->
  </v-row>
</template>
