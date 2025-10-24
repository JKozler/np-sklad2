<!-- src/views/utilities/orders/OrdersPage.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { ordersService } from '@/services/ordersService';
import type { Order, OrderStatus } from '@/types/auth';

const page = ref({ title: 'Objednávky' });
const breadcrumbs = ref([
  { title: 'Obchod', disabled: false, href: '#' },
  { title: 'Objednávky', disabled: true, href: '#' }
]);

const orders = ref<Order[]>([]);
const loading = ref(false);
const selectedStatus = ref<OrderStatus | 'all'>('all');
const itemsPerPage = ref(10);
const currentPage = ref(1);

const headers = ref([
  { title: 'Číslo objednávky', key: 'orderNumber', sortable: true },
  { title: 'Zákazník', key: 'customerName', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Celková cena', key: 'totalAmount', sortable: true },
  { title: 'Datum vytvoření', key: 'createdAt', sortable: true },
  { title: 'Akce', key: 'actions', sortable: false }
]);

const statusOptions = [
  { value: 'all', title: 'Všechny' },
  { value: 'pending', title: 'Čekající' },
  { value: 'processing', title: 'Zpracovává se' },
  { value: 'shipped', title: 'Odesláno' },
  { value: 'completed', title: 'Dokončeno' },
  { value: 'cancelled', title: 'Zrušeno' }
];

const statusColors: Record<OrderStatus, string> = {
  pending: 'warning',
  processing: 'info',
  shipped: 'primary',
  completed: 'success',
  cancelled: 'error'
};

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Čekající',
  processing: 'Zpracovává se',
  shipped: 'Odesláno',
  completed: 'Dokončeno',
  cancelled: 'Zrušeno'
};

const filteredOrders = computed(() => {
  if (selectedStatus.value === 'all') return orders.value;
  return orders.value.filter((o: Order) => o.status === selectedStatus.value);
});

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredOrders.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredOrders.value.length / itemsPerPage.value);
});

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK'
  }).format(price);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('cs-CZ');
};

const loadOrders = async () => {
  loading.value = true;
  try {
    const filters = selectedStatus.value !== 'all' 
      ? { status: selectedStatus.value as OrderStatus }
      : undefined;
    orders.value = await ordersService.getAll(filters);
  } catch (error) {
    console.error('Chyba při načítání objednávek:', error);
  } finally {
    loading.value = false;
  }
};

const changeStatus = async (order: Order, newStatus: OrderStatus) => {
  try {
    await ordersService.updateStatus(order.id, newStatus);
    await loadOrders();
  } catch (error) {
    console.error('Chyba při změně statusu:', error);
  }
};

const deleteOrder = async (id: number) => {
  if (confirm('Opravdu chcete smazat tuto objednávku?')) {
    try {
      await ordersService.delete(id);
      await loadOrders();
    } catch (error) {
      console.error('Chyba při mazání objednávky:', error);
    }
  }
};

onMounted(() => {
  loadOrders();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Seznam objednávek">
        <div class="d-flex justify-space-between align-center mb-4 flex-wrap gap-2">
          <v-select
            v-model="selectedStatus"
            :items="statusOptions"
            @update:model-value="loadOrders"
            label="Filtrovat podle statusu"
            variant="outlined"
            density="compact"
            hide-details
            style="max-width: 250px"
          ></v-select>
          
          <v-btn color="primary" prepend-icon="mdi-plus" to="/orders/new">
            Nová objednávka
          </v-btn>
        </div>

        <v-data-table
          :headers="headers"
          :items="paginatedOrders"
          :loading="loading"
          hide-default-footer
          class="elevation-1"
        >
          <template v-slot:item.orderNumber="{ item }">
            <router-link :to="`/orders/${item.id}`" class="text-primary text-decoration-none font-weight-medium">
              {{ item.orderNumber }}
            </router-link>
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

          <template v-slot:item.totalAmount="{ item }">
            <span class="font-weight-medium">{{ formatPrice(item.totalAmount) }}</span>
          </template>

          <template v-slot:item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>

          <template v-slot:item.actions="{ item }">
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  v-bind="props"
                >
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item @click="changeStatus(item, 'processing')" v-if="item.status === 'pending'">
                  <v-list-item-title>Zpracovat</v-list-item-title>
                </v-list-item>
                <v-list-item @click="changeStatus(item, 'shipped')" v-if="item.status === 'processing'">
                  <v-list-item-title>Odeslat</v-list-item-title>
                </v-list-item>
                <v-list-item @click="changeStatus(item, 'completed')" v-if="item.status === 'shipped'">
                  <v-list-item-title>Dokončit</v-list-item-title>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item @click="deleteOrder(item.id)" class="text-error">
                  <v-list-item-title>Smazat</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>

          <template v-slot:bottom>
            <div class="d-flex justify-space-between align-center pa-4 flex-wrap">
              <div class="d-flex align-center gap-2">
                <span class="text-body-2">Položek na stránku:</span>
                <v-select
                  v-model="itemsPerPage"
                  :items="[10, 25, 50, 100]"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="max-width: 100px"
                ></v-select>
              </div>
              
              <div class="text-body-2">
                {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, filteredOrders.length) }} 
                z {{ filteredOrders.length }}
              </div>

              <v-pagination
                v-model="currentPage"
                :length="totalPages"
                :total-visible="7"
                density="comfortable"
              ></v-pagination>
            </div>
          </template>
        </v-data-table>
      </UiParentCard>
    </v-col>
  </v-row>
</template>

<style scoped>
:deep(.v-data-table) {
  border-radius: 8px;
}

:deep(.v-data-table th) {
  font-weight: 600;
  background-color: rgba(var(--v-theme-primary), 0.05);
}

:deep(.v-data-table tbody tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.02);
}
</style>