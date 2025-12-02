<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

// Dashboard components
import CustomerSupportDashboard from '../customer-support/CustomerSupportDashboard.vue';
import WarehouseManagerDashboard from '../warehouse-manager/WarehouseManagerDashboard.vue';

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
    <v-card elevation="0" class="bg-secondary overflow-hidden bubble-shape bubble-secondary-shape">
    <v-card-text style="height: 1200px;">
      <iframe style="width: 100%;height: 100%;" src="https://grafana.naturalprotein.cz/modules/grafana/service/public-dashboards/ff3e7a62b357416d8c0f0722f5334d97"></iframe>
    </v-card-text>
  </v-card>
  </v-row>
</template>
