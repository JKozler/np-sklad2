<!-- src/views/utilities/orders/OrdersPage.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { ordersService } from '@/services/ordersService';
import type { SalesOrder, OrderStatus } from '@/services/ordersService';

const page = ref({ title: 'Objednávky' });
const breadcrumbs = ref([
  { title: 'Obchod', disabled: false, href: '#' },
  { title: 'Objednávky', disabled: true, href: '#' }
]);

const orders = ref<SalesOrder[]>([]);
const loading = ref(false);
const searchText = ref('');
const itemsPerPage = ref(20);
const currentPage = ref(1);
const activeTab = ref<string | undefined>(undefined);

const headers = ref([
  { title: 'Číslo', key: 'name', sortable: true },
  { title: 'Zákazník', key: 'customer', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Dopravce', key: 'carrierName', sortable: true },
  { title: 'Celková cena', key: 'priceWithVat', sortable: true },
  { title: 'Datum', key: 'createdAt', sortable: true },
  { title: 'Akce', key: 'actions', sortable: false }
]);

const tabs = ref([
  { value: undefined, title: 'Všechny objednávky' },
  { value: 'starred', title: 'Oblíbené' }
]);

const statusColors: Record<string, string> = {
  'new': 'default',
  'in-progress': 'warning',
  'expedition-error': 'error',
  'data-error': 'error',
  'sent': 'success',
  'return': 'info',
  'delivered': 'primary',
  'cancelled': 'default'
};

const statusLabels: Record<string, string> = {
  'new': 'Nová',
  'in-progress': 'V průběhu',
  'expedition-error': 'Expediční problém',
  'data-error': 'Datový problém',
  'sent': 'Odesláno',
  'return': 'Vratka',
  'delivered': 'Doručeno',
  'cancelled': 'Zrušeno'
};

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return orders.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(orders.value.length / itemsPerPage.value);
});

const formatPrice = (price: number, currency: string = 'CZK') => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: currency
  }).format(price);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('cs-CZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getCustomerName = (order: SalesOrder) => {
  return `${order.shippingAddressFirstName} ${order.shippingAddressLastName}`;
};

const loadOrders = async () => {
  loading.value = true;
  try {
    const response = await ordersService.getAll(
      searchText.value || undefined,
      activeTab.value || undefined
    );
    orders.value = response.list;
  } catch (error) {
    console.error('Chyba při načítání objednávek:', error);
  } finally {
    loading.value = false;
  }
};

const changeStatus = async (order: SalesOrder, newStatus: OrderStatus) => {
  try {
    await ordersService.updateStatus(order.id, newStatus);
    await loadOrders();
  } catch (error) {
    console.error('Chyba při změně statusu:', error);
  }
};

const toggleStar = async (order: SalesOrder) => {
  try {
    await ordersService.toggleStar(order.id, !order.isStarred);
    // Aktualizace lokálního stavu
    order.isStarred = !order.isStarred;
  } catch (error) {
    console.error('Chyba při označování hvězdičkou:', error);
  }
};

const deleteOrder = async (id: string) => {
  if (confirm('Opravdu chcete smazat tuto objednávku?')) {
    try {
      await ordersService.delete(id);
      await loadOrders();
    } catch (error) {
      console.error('Chyba při mazání objednávky:', error);
    }
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  loadOrders();
};

// Watch pro změnu tabu
watch(activeTab, () => {
  currentPage.value = 1;
  loadOrders();
});

onMounted(() => {
  loadOrders();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  
  <v-row>
    <v-col cols="12">
      <UiParentCard title="Seznam objednávek">
        <!-- Tab menu -->
        <v-tabs
          v-model="activeTab"
          class="mb-4"
          color="primary"
          align-tabs="start"
        >
          <v-tab
            v-for="tab in tabs"
            :key="tab.value"
            :value="tab.value"
          >
            <v-icon
              v-if="tab.value === 'starred'"
              start
              size="small"
            >
              mdi-star
            </v-icon>
            {{ tab.title }}
          </v-tab>
        </v-tabs>

        <div class="d-flex justify-space-between align-center mb-4 flex-wrap gap-2">
          <v-text-field
            v-model="searchText"
            @keyup.enter="handleSearch"
            label="Vyhledat objednávku..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            style="max-width: 400px"
            clearable
            @click:clear="handleSearch"
          >
            <template v-slot:append>
              <v-btn
                @click="handleSearch"
                color="primary"
                size="small"
                :loading="loading"
              >
                Hledat
              </v-btn>
            </template>
          </v-text-field>
          
          <div class="d-flex gap-2">
            <v-btn
              @click="loadOrders"
              variant="outlined"
              prepend-icon="mdi-refresh"
              :loading="loading"
            >
              Obnovit
            </v-btn>
          </div>
        </div>

        <v-data-table
          :headers="headers"
          :items="paginatedOrders"
          :loading="loading"
          hide-default-footer
          class="elevation-1"
        >
          <template v-slot:item.name="{ item }">
            <div class="d-flex align-center gap-2">
              <v-btn
                icon
                size="x-small"
                variant="text"
                @click.stop="toggleStar(item)"
              >
                <v-icon 
                  :color="item.isStarred ? 'warning' : 'grey-lighten-1'"
                  size="small"
                >
                  {{ item.isStarred ? 'mdi-star' : 'mdi-star-outline' }}
                </v-icon>
              </v-btn>
              <router-link 
                :to="`/orders/${item.id}`" 
                class="text-primary text-decoration-none font-weight-medium"
              >
                {{ item.name }}
              </router-link>
            </div>
          </template>

          <template v-slot:item.customer="{ item }">
            <div>
              <div class="font-weight-medium">{{ getCustomerName(item) }}</div>
              <div class="text-caption text-medium-emphasis" v-if="item.email">
                {{ item.email }}
              </div>
            </div>
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

          <template v-slot:item.carrierName="{ item }">
            <v-chip 
              v-if="item.carrierName"
              size="small"
              variant="outlined"
            >
              {{ item.carrierName }}
            </v-chip>
            <span v-else class="text-medium-emphasis">—</span>
          </template>

          <template v-slot:item.priceWithVat="{ item }">
            <span class="font-weight-medium">
              {{ formatPrice(item.priceWithVat, item.currency) }}
            </span>
          </template>

          <template v-slot:item.createdAt="{ item }">
            <div class="text-body-2">{{ formatDate(item.createdAt) }}</div>
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
                <v-list-item :to="`/orders/${item.id}`">
                  <v-list-item-title>
                    <v-icon size="small" class="mr-2">mdi-eye</v-icon>
                    Detail
                  </v-list-item-title>
                </v-list-item>
                
                <v-divider></v-divider>
                
                <v-list-item 
                  @click="changeStatus(item, 'in-progress')" 
                  v-if="item.status === 'new'"
                >
                  <v-list-item-title>
                    <v-icon size="small" class="mr-2">mdi-play</v-icon>
                    Zpracovat
                  </v-list-item-title>
                </v-list-item>
                
                <v-list-item 
                  @click="changeStatus(item, 'sent')" 
                  v-if="item.status === 'in-progress'"
                >
                  <v-list-item-title>
                    <v-icon size="small" class="mr-2">mdi-truck</v-icon>
                    Odeslat
                  </v-list-item-title>
                </v-list-item>
                
                <v-list-item 
                  @click="changeStatus(item, 'delivered')" 
                  v-if="item.status === 'sent'"
                >
                  <v-list-item-title>
                    <v-icon size="small" class="mr-2">mdi-check-circle</v-icon>
                    Dokončit
                  </v-list-item-title>
                </v-list-item>
                
                <v-divider></v-divider>
                
                <v-list-item @click="deleteOrder(item.id)" class="text-error">
                  <v-list-item-title>
                    <v-icon size="small" class="mr-2">mdi-delete</v-icon>
                    Smazat
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>

          <template v-slot:bottom>
            <div class="d-flex justify-space-between align-center pa-4 flex-wrap">
              <div class="text-body-2">
                Zobrazeno {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, orders.length) }} 
                z {{ orders.length }} objednávek
              </div>

              <v-pagination
                v-model="currentPage"
                :length="totalPages"
                :total-visible="7"
                density="comfortable"
              ></v-pagination>
            </div>
          </template>

          <template v-slot:no-data>
            <div class="text-center pa-6">
              <v-icon size="64" color="grey-lighten-1">mdi-package-variant</v-icon>
              <div class="text-h6 mt-4 text-medium-emphasis">
                {{ searchText ? 'Žádné objednávky nenalezeny' : activeTab === 'starred' ? 'Žádné oblíbené objednávky' : 'Zatím nemáte žádné objednávky' }}
              </div>
              <div class="text-body-2 text-medium-emphasis mt-2">
                {{ searchText ? 'Zkuste jiné vyhledávací kritérium' : activeTab === 'starred' ? 'Označte objednávky hvězdičkou pro rychlý přístup' : 'Objednávky se zobrazí automaticky po vytvoření' }}
              </div>
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