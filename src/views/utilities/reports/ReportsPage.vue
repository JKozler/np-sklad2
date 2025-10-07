<!-- src/views/utilities/reports/ReportsPage.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Reporty a statistiky' });
const breadcrumbs = ref([
  { title: 'Statistiky', disabled: false, href: '#' },
  { title: 'Reporty', disabled: true, href: '#' }
]);

const stats = ref([
  {
    title: 'Celkový obrat',
    value: '1 245 680 Kč',
    change: '+12.5%',
    trend: 'up',
    icon: 'mdi-currency-usd',
    color: 'success'
  },
  {
    title: 'Počet objednávek',
    value: '342',
    change: '+8.2%',
    trend: 'up',
    icon: 'mdi-cart',
    color: 'primary'
  },
  {
    title: 'Noví zákazníci',
    value: '28',
    change: '-3.1%',
    trend: 'down',
    icon: 'mdi-account-plus',
    color: 'info'
  },
  {
    title: 'Průměrná hodnota',
    value: '3 642 Kč',
    change: '+5.7%',
    trend: 'up',
    icon: 'mdi-chart-line',
    color: 'warning'
  }
]);

const topProducts = ref([
  { name: 'Bezlaktózový protein 350g', sales: 1245, revenue: 141158 },
  { name: 'Ashwagandha 60cps', sales: 892, revenue: 81259 },
  { name: '3x Maca 60 cps', sales: 754, revenue: 61028 },
  { name: 'BCAA a Kreatin Malina 300g', sales: 623, revenue: 100515 },
  { name: 'Acerola 60 kapslí', sales: 567, revenue: 35154 }
]);

const recentOrders = ref([
  { orderNumber: 'ORD-2024-0125', customer: 'Jan Novák', amount: 4850, status: 'completed' },
  { orderNumber: 'ORD-2024-0124', customer: 'Marie Svobodová', amount: 2340, status: 'processing' },
  { orderNumber: 'ORD-2024-0123', customer: 'Petr Dvořák', amount: 12450, status: 'shipped' },
  { orderNumber: 'ORD-2024-0122', customer: 'Eva Černá', amount: 1580, status: 'pending' }
]);

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK'
  }).format(price);
};
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  
  <!-- Statistics Cards -->
  <v-row>
    <v-col v-for="stat in stats" :key="stat.title" cols="12" sm="6" md="3">
      <v-card elevation="0" variant="outlined">
        <v-card-text>
          <div class="d-flex justify-space-between align-start">
            <div>
              <div class="text-subtitle-2 text-medium-emphasis mb-1">{{ stat.title }}</div>
              <div class="text-h4 font-weight-bold mb-1">{{ stat.value }}</div>
              <div class="d-flex align-center">
                <v-icon 
                  :color="stat.trend === 'up' ? 'success' : 'error'" 
                  size="small"
                >
                  {{ stat.trend === 'up' ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                </v-icon>
                <span 
                  class="text-caption ml-1"
                  :class="stat.trend === 'up' ? 'text-success' : 'text-error'"
                >
                  {{ stat.change }}
                </span>
              </div>
            </div>
            <v-avatar :color="stat.color" size="48" variant="tonal">
              <v-icon :icon="stat.icon" size="24"></v-icon>
            </v-avatar>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-row class="mt-2">
    <!-- Top Products -->
    <v-col cols="12" md="6">
      <UiParentCard title="Top produkty">
        <v-list>
          <v-list-item 
            v-for="(product, index) in topProducts" 
            :key="product.name"
            class="px-0"
          >
            <template v-slot:prepend>
              <v-chip 
                size="small" 
                :color="index === 0 ? 'success' : index === 1 ? 'primary' : 'secondary'"
              >
                {{ index + 1 }}
              </v-chip>
            </template>
            <v-list-item-title class="font-weight-medium">
              {{ product.name }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ product.sales }} prodejů • {{ formatPrice(product.revenue) }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </UiParentCard>
    </v-col>

    <!-- Recent Orders -->
    <v-col cols="12" md="6">
      <UiParentCard title="Poslední objednávky">
        <v-list>
          <v-list-item 
            v-for="order in recentOrders" 
            :key="order.orderNumber"
            class="px-0"
          >
            <v-list-item-title class="font-weight-medium">
              {{ order.orderNumber }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ order.customer }} • {{ formatPrice(order.amount) }}
            </v-list-item-subtitle>
            <template v-slot:append>
              <v-chip size="small" :color="order.status === 'completed' ? 'success' : 'warning'">
                {{ order.status }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
      </UiParentCard>
    </v-col>
  </v-row>

  <!-- Export Buttons -->
  <v-row class="mt-2">
    <v-col cols="12">
      <UiParentCard title="Export reportů">
        <div class="d-flex gap-2 flex-wrap">
          <v-btn color="primary" prepend-icon="mdi-file-excel">
            Export do Excel
          </v-btn>
          <v-btn color="error" variant="outlined" prepend-icon="mdi-file-pdf-box">
            Export do PDF
          </v-btn>
          <v-btn color="success" variant="outlined" prepend-icon="mdi-file-delimited">
            Export do CSV
          </v-btn>
        </div>
      </UiParentCard>
    </v-col>
  </v-row>
</template>