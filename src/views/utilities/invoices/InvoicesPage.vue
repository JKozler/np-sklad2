<!-- src/views/utilities/invoices/InvoicesPage.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Faktury' });
const breadcrumbs = ref([
  { title: 'Obchod', disabled: false, href: '#' },
  { title: 'Faktury', disabled: true, href: '#' }
]);

const invoices = ref([
  {
    id: 1,
    invoiceNumber: 'FV-2024-0001',
    customerName: 'Jan Novák',
    amount: 4850.50,
    status: 'paid',
    dueDate: '2024-10-15',
    createdAt: '2024-10-01'
  },
  {
    id: 2,
    invoiceNumber: 'FV-2024-0002',
    customerName: 'Petr Dvořák',
    amount: 12450.00,
    status: 'pending',
    dueDate: '2024-10-20',
    createdAt: '2024-10-05'
  },
  {
    id: 3,
    invoiceNumber: 'FV-2024-0003',
    customerName: 'Marie Svobodová',
    amount: 2340.00,
    status: 'overdue',
    dueDate: '2024-10-05',
    createdAt: '2024-09-25'
  },
  {
    id: 4,
    invoiceNumber: 'FV-2024-0004',
    customerName: 'Tomáš Procházka',
    amount: 8920.00,
    status: 'paid',
    dueDate: '2024-10-12',
    createdAt: '2024-10-03'
  }
]);

const headers = ref([
  { title: 'Číslo faktury', key: 'invoiceNumber', sortable: true },
  { title: 'Zákazník', key: 'customerName', sortable: true },
  { title: 'Částka', key: 'amount', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Splatnost', key: 'dueDate', sortable: true },
  { title: 'Akce', key: 'actions', sortable: false }
]);

const statusColors: Record<string, string> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'error'
};

const statusLabels: Record<string, string> = {
  paid: 'Zaplaceno',
  pending: 'Čeká na platbu',
  overdue: 'Po splatnosti'
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK'
  }).format(price);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('cs-CZ');
};
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Seznam faktur">
        <div class="d-flex justify-end mb-4">
          <v-btn color="primary" prepend-icon="mdi-plus">
            Nová faktura
          </v-btn>
        </div>

        <v-data-table
          :headers="headers"
          :items="invoices"
          class="elevation-1"
        >
          <template v-slot:item.invoiceNumber="{ item }">
            <a href="#" class="text-primary text-decoration-none font-weight-medium">
              {{ item.invoiceNumber }}
            </a>
          </template>

          <template v-slot:item.amount="{ item }">
            <span class="font-weight-medium">{{ formatPrice(item.amount) }}</span>
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

          <template v-slot:item.dueDate="{ item }">
            <span :class="item.status === 'overdue' ? 'text-error font-weight-medium' : ''">
              {{ formatDate(item.dueDate) }}
            </span>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn icon size="small" variant="text" color="primary">
              <v-icon>mdi-eye</v-icon>
            </v-btn>
            <v-btn icon size="small" variant="text" color="primary">
              <v-icon>mdi-download</v-icon>
            </v-btn>
            <v-btn icon size="small" variant="text" color="primary">
              <v-icon>mdi-email</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </UiParentCard>
    </v-col>
  </v-row>
</template>