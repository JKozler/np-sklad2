<!-- src/views/utilities/purchase/PurchaseRequestsPage.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Nákupní žádosti' });
const breadcrumbs = ref([
  { title: 'Sklad', disabled: false, href: '#' },
  { title: 'Nákupní žádosti', disabled: true, href: '#' }
]);

const purchaseRequests = ref([
  {
    id: 1,
    requestNumber: 'NZ-2024-0001',
    productName: 'Bezlaktózový protein 350g',
    quantity: 200,
    supplier: 'Dodavatel B',
    status: 'pending',
    requestedBy: 'Admin User',
    createdAt: '2024-10-07',
    urgency: 'high'
  },
  {
    id: 2,
    requestNumber: 'NZ-2024-0002',
    productName: 'BCAA a Kreatin Malina 300g',
    quantity: 100,
    supplier: 'Dodavatel D',
    status: 'approved',
    requestedBy: 'Jan Novák',
    createdAt: '2024-10-05',
    urgency: 'medium'
  },
  {
    id: 3,
    requestNumber: 'NZ-2024-0003',
    productName: 'Ashwagandha 60cps',
    quantity: 300,
    supplier: 'Dodavatel A',
    status: 'ordered',
    requestedBy: 'Admin User',
    createdAt: '2024-10-03',
    urgency: 'medium'
  },
  {
    id: 4,
    requestNumber: 'NZ-2024-0004',
    productName: '3x Maca 60 cps',
    quantity: 150,
    supplier: 'Dodavatel A',
    status: 'received',
    requestedBy: 'Admin User',
    createdAt: '2024-09-28',
    urgency: 'low'
  }
]);

const headers = ref([
  { title: 'Číslo žádosti', key: 'requestNumber', sortable: true },
  { title: 'Produkt', key: 'productName', sortable: true },
  { title: 'Množství', key: 'quantity', sortable: true },
  { title: 'Dodavatel', key: 'supplier', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Urgence', key: 'urgency', sortable: true },
  { title: 'Vytvořil', key: 'requestedBy', sortable: true },
  { title: 'Akce', key: 'actions', sortable: false }
]);

const statusColors: Record<string, string> = {
  pending: 'warning',
  approved: 'info',
  ordered: 'primary',
  received: 'success',
  rejected: 'error'
};

const statusLabels: Record<string, string> = {
  pending: 'Čeká na schválení',
  approved: 'Schváleno',
  ordered: 'Objednáno',
  received: 'Přijato',
  rejected: 'Zamítnuto'
};

const urgencyColors: Record<string, string> = {
  high: 'error',
  medium: 'warning',
  low: 'success'
};

const urgencyLabels: Record<string, string> = {
  high: 'Vysoká',
  medium: 'Střední',
  low: 'Nízká'
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('cs-CZ');
};
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Nákupní žádosti">
        <div class="d-flex justify-end mb-4">
          <v-btn color="primary" prepend-icon="mdi-plus">
            Nová žádost
          </v-btn>
        </div>

        <v-data-table
          :headers="headers"
          :items="purchaseRequests"
          class="elevation-1"
        >
          <template v-slot:item.requestNumber="{ item }">
            <a href="#" class="text-primary text-decoration-none font-weight-medium">
              {{ item.requestNumber }}
            </a>
          </template>

          <template v-slot:item.quantity="{ item }">
            <span class="font-weight-medium">{{ item.quantity }} ks</span>
          </template>

          <template v-slot:item.status="{ item }">
            <v-chip 
              :color="statusColors[item.status]" 
              size="small"
              variant="tonal"
            >
              {{ statusLabels[item.status] }}
            </v-chip>
          </template>

          <template v-slot:item.urgency="{ item }">
            <v-chip 
              :color="urgencyColors[item.urgency]" 
              size="small"
              variant="flat"
            >
              {{ urgencyLabels[item.urgency] }}
            </v-chip>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-menu v-if="item.status === 'pending'">
              <template v-slot:activator="{ props }">
                <v-btn icon size="small" variant="text" v-bind="props">
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>Schválit</v-list-item-title>
                </v-list-item>
                <v-list-item class="text-error">
                  <v-list-item-title>Zamítnout</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            <v-btn v-else icon size="small" variant="text" color="primary">
              <v-icon>mdi-eye</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </UiParentCard>
    </v-col>
  </v-row>
</template>