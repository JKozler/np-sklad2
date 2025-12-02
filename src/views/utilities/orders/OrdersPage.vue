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

// **PAGINACE - serverová**
const currentOffset = ref(0);
const itemsPerPage = ref(200); // Max podporované API
const totalFromAPI = ref(0);

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
  { value: 'starred', title: 'Oblíbené' },
  { value: 'errors', title: 'Chybové' }
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

// **PAGINACE: Computed properties**
const totalPages = computed(() => {
  return Math.ceil(totalFromAPI.value / itemsPerPage.value);
});

const currentPage = computed(() => {
  return Math.floor(currentOffset.value / itemsPerPage.value) + 1;
});

const displayRange = computed(() => {
  const from = currentOffset.value + 1;
  const to = Math.min(currentOffset.value + orders.value.length, totalFromAPI.value);
  return { from, to };
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

const getCarrierColor = (carrierName: string) => {
  const name = carrierName.toLowerCase();

  // Zásilkovna - červená s bílým textem
  if (name.includes('zásilkovna') || name.includes('zasilkovna')) {
    return { color: 'red-darken-1', variant: 'flat' as const };
  }

  // PPL - modrá s bílým textem
  if (name.includes('ppl')) {
    return { color: 'blue-darken-1', variant: 'flat' as const };
  }

  // Balíkovna - světlejší modrá než PPL
  if (name.includes('balíkovna') || name.includes('balikovna')) {
    return { color: 'light-blue-darken-1', variant: 'flat' as const };
  }

  // Ostatní dopravci - výchozí styl
  return { color: undefined, variant: 'outlined' as const };
};

const loadOrders = async () => {
  loading.value = true;
  try {
    const response = await ordersService.getAll(
      searchText.value || undefined,
      activeTab.value || undefined,
      itemsPerPage.value,
      currentOffset.value
    );
    orders.value = response.list;
    totalFromAPI.value = response.total;

    console.log('✅ Načteno objednávek:', orders.value.length, '/', response.total);

    if (response.total > 200) {
      console.warn('⚠️ POZOR: Celkový počet objednávek (' + response.total + ') překračuje maxSize (200)!');
    }
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
  currentOffset.value = 0;
  loadOrders();
};

/**
 * **NOVÉ: Funkce pro změnu stránky**
 */
const goToPage = (page: number) => {
  currentOffset.value = (page - 1) * itemsPerPage.value;
  loadOrders();
};

const nextPage = () => {
  if (currentOffset.value + itemsPerPage.value < totalFromAPI.value) {
    currentOffset.value += itemsPerPage.value;
    loadOrders();
  }
};

const prevPage = () => {
  if (currentOffset.value > 0) {
    currentOffset.value = Math.max(0, currentOffset.value - itemsPerPage.value);
    loadOrders();
  }
};

// Watch pro změnu tabu
watch(activeTab, () => {
  currentOffset.value = 0;
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
            <v-icon
              v-if="tab.value === 'errors'"
              start
              size="small"
            >
              mdi-alert-circle
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
          :items="orders"
          :loading="loading"
          :items-per-page="200"
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
              :color="getCarrierColor(item.carrierName).color"
              :variant="getCarrierColor(item.carrierName).variant"
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
            <div class="d-flex justify-space-between align-center pa-4 flex-wrap" v-if="totalFromAPI > 0">
              <div class="text-body-2">
                Zobrazeno {{ displayRange.from }}-{{ displayRange.to }} z {{ totalFromAPI }} objednávek
              </div>

              <v-pagination
                v-if="totalPages > 1"
                :model-value="currentPage"
                :length="totalPages"
                :total-visible="7"
                density="comfortable"
                @update:model-value="goToPage"
              ></v-pagination>
            </div>
          </template>

          <template v-slot:no-data>
            <div class="text-center pa-6">
              <v-icon size="64" color="grey-lighten-1">mdi-package-variant</v-icon>
              <div class="text-h6 mt-4 text-medium-emphasis">
                {{ searchText ? 'Žádné objednávky nenalezeny' : activeTab === 'starred' ? 'Žádné oblíbené objednávky' : activeTab === 'errors' ? 'Žádné chybové objednávky' : 'Zatím nemáte žádné objednávky' }}
              </div>
              <div class="text-body-2 text-medium-emphasis mt-2">
                {{ searchText ? 'Zkuste jiné vyhledávací kritérium' : activeTab === 'starred' ? 'Označte objednávky hvězdičkou pro rychlý přístup' : activeTab === 'errors' ? 'Skvělé! Nemáte žádné objednávky s chybou' : 'Objednávky se zobrazí automaticky po vytvoření' }}
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