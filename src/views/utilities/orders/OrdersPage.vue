<!-- src/views/utilities/orders/OrdersPage.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { ordersService } from '@/services/ordersService';
import type { SalesOrder, OrderStatus, OrderFilters } from '@/services/ordersService';

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

// **NOVÉ: Pokročilé filtry**
const filters = ref<OrderFilters>({
  status: [],
  carrierId: undefined,
  email: '',
  priceMin: undefined,
  priceMax: undefined,
  paymentMethod: [],
  customerName: ''
});

// Debounce timer pro vyhledávání
let searchTimeout: number | null = null;

const headers = ref([
  { title: 'Číslo', key: 'name', sortable: true },
  { title: 'Zákazník', key: 'customer', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Dopravce', key: 'carrierName', sortable: true },
  { title: 'Celková cena', key: 'priceWithVat', sortable: true },
  { title: 'Balíky', key: 'packagesNames', sortable: false },
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
  'expedition-error': 'Chybí produkt',
  'data-error': 'Datový problém',
  'sent': 'Odesláno',
  'return': 'Vratka',
  'delivered': 'Doručeno',
  'cancelled': 'Zrušeno'
};

// **NOVÉ: Možnosti pro filtry**
const statusOptions = ref([
  { title: 'Nová', value: 'new' },
  { title: 'V průběhu', value: 'in-progress' },
  { title: 'Chybí produkt', value: 'expedition-error' },
  { title: 'Datový problém', value: 'data-error' },
  { title: 'Odesláno', value: 'sent' },
  { title: 'Vratka', value: 'return' },
  { title: 'Doručeno', value: 'delivered' },
  { title: 'Zrušeno', value: 'cancelled' }
]);

const paymentMethodOptions = ref([
  { title: 'Kartou', value: 'card' },
  { title: 'Hotově', value: 'cash' },
  { title: 'Dobírka', value: 'cod' },
  { title: 'Bankovní převod', value: 'bank-transfer' }
]);

// Seznam dopravců (bude načten dynamicky)
const carriers = ref<Array<{ id: string; name: string }>>([]);

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

// **NOVÉ: Počet aktivních filtrů**
const activeFiltersCount = computed(() => {
  let count = 0;
  if (filters.value.status && filters.value.status.length > 0) count++;
  if (filters.value.carrierId) count++;
  if (filters.value.email && filters.value.email.trim()) count++;
  if (filters.value.priceMin !== undefined && filters.value.priceMin > 0) count++;
  if (filters.value.priceMax !== undefined && filters.value.priceMax > 0) count++;
  if (filters.value.paymentMethod && filters.value.paymentMethod.length > 0) count++;
  if (filters.value.customerName && filters.value.customerName.trim()) count++;
  if (searchText.value.trim()) count++;
  return count;
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

const paymentMethodLabels: Record<string, string> = {
  'cod': 'Dobírka',
  'card': 'Kartou',
  'cash': 'Hotově',
  'bank-transfer': 'Bankovní převod'
};

const formatPaymentMethod = (paymentMethod: string): string => {
  return paymentMethodLabels[paymentMethod] || paymentMethod;
};

const getCustomerName = (order: SalesOrder) => {
  return `${order.shippingAddressFirstName} ${order.shippingAddressLastName}`;
};

const formatPackagesNames = (packagesNames?: Record<string, string>) => {
  if (!packagesNames || Object.keys(packagesNames).length === 0) {
    return '';
  }
  return Object.values(packagesNames).join(', ');
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

  if (name.includes('gls')) {
    return { color: 'gls-darken-1', variant: 'flat' as const };
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
    // Připrav filtry pro API
    const apiFilters: OrderFilters = {
      status: filters.value.status && filters.value.status.length > 0 ? filters.value.status : undefined,
      carrierId: filters.value.carrierId || undefined,
      email: filters.value.email?.trim() || undefined,
      priceMin: filters.value.priceMin,
      priceMax: filters.value.priceMax,
      paymentMethod: filters.value.paymentMethod && filters.value.paymentMethod.length > 0 ? filters.value.paymentMethod : undefined,
      customerName: filters.value.customerName?.trim() || undefined
    };

    const response = await ordersService.getAll(
      searchText.value || undefined,
      activeTab.value || undefined,
      apiFilters,
      {
        maxSize: itemsPerPage.value,
        offset: currentOffset.value
      }
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
 * Debounced search - čeká 500ms po posledním stisku klávesy
 */
const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = window.setTimeout(() => {
    currentOffset.value = 0;
    loadOrders();
  }, 500);
};

/**
 * **NOVÉ: Vyčistí všechny filtry**
 */
const clearFilters = () => {
  filters.value = {
    status: [],
    carrierId: undefined,
    email: '',
    priceMin: undefined,
    priceMax: undefined,
    paymentMethod: [],
    customerName: ''
  };
  searchText.value = '';
  currentOffset.value = 0;
  loadOrders();
};

/**
 * **NOVÉ: Načte seznam dopravců**
 */
const loadCarriers = async () => {
  try {
    // Načteme všechny objednávky a vytáhneme unikátní dopravce
    const response = await ordersService.getAll(undefined, undefined, undefined, {
      maxSize: 200,
      offset: 0
    });

    const uniqueCarriers = new Map<string, string>();
    response.list.forEach(order => {
      if (order.carrierId && order.carrierName) {
        uniqueCarriers.set(order.carrierId, order.carrierName);
      }
    });

    carriers.value = Array.from(uniqueCarriers.entries()).map(([id, name]) => ({ id, name }));
    console.log('✅ Načteno dopravců:', carriers.value.length);
  } catch (error) {
    console.error('Chyba při načítání dopravců:', error);
  }
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

// **NOVÉ: Watch na změnu searchText**
watch(searchText, () => {
  debouncedSearch();
});

// **NOVÉ: Watch na změnu filtrů**
watch([
  () => filters.value.status,
  () => filters.value.carrierId,
  () => filters.value.email,
  () => filters.value.priceMin,
  () => filters.value.priceMax,
  () => filters.value.paymentMethod,
  () => filters.value.customerName
], () => {
  currentOffset.value = 0;
  debouncedSearch();
}, { deep: true });

onMounted(() => {
  loadOrders();
  loadCarriers();
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

        <div class="mb-4">
          <v-row>
            <v-col cols="12" md="6">
              <!-- Vyhledávací pole -->
              <v-text-field
                v-model="searchText"
                prepend-inner-icon="mdi-magnify"
                label="Vyhledat objednávku"
                placeholder="Zadejte číslo objednávky, jméno zákazníka..."
                variant="outlined"
                density="compact"
                clearable
                hint="Vyhledávání probíhá automaticky při psaní"
                persistent-hint
              >
                <template v-slot:append-inner>
                  <v-progress-circular
                    v-if="loading"
                    indeterminate
                    size="20"
                    width="2"
                    color="primary"
                  ></v-progress-circular>
                </template>
              </v-text-field>
            </v-col>

            <v-col cols="12" md="6" class="d-flex justify-end align-start gap-2">
              <v-btn
                color="primary"
                prepend-icon="mdi-refresh"
                :loading="loading"
                @click="loadOrders"
                variant="tonal"
              >
                Obnovit
              </v-btn>
            </v-col>
          </v-row>
        </div>

        <!-- **NOVÉ: Pokročilé filtry** -->
        <v-expansion-panels class="mb-4">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-2">mdi-filter</v-icon>
              Pokročilé filtry
              <v-chip
                v-if="activeFiltersCount > 0"
                color="primary"
                size="small"
                class="ml-2"
              >
                {{ activeFiltersCount }}
              </v-chip>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row>
                <!-- Status -->
                <v-col cols="12" md="4">
                  <v-select
                    v-model="filters.status"
                    :items="statusOptions"
                    label="Stav objednávky"
                    variant="outlined"
                    density="compact"
                    multiple
                    clearable
                    chips
                    hint="Můžete vybrat více stavů"
                    persistent-hint
                  >
                    <template v-slot:chip="{ item }">
                      <v-chip
                        :color="statusColors[item.value]"
                        size="small"
                      >
                        {{ item.title }}
                      </v-chip>
                    </template>
                  </v-select>
                </v-col>

                <!-- Dopravce -->
                <v-col cols="12" md="4">
                  <v-select
                    v-model="filters.carrierId"
                    :items="carriers"
                    item-title="name"
                    item-value="id"
                    label="Dopravce"
                    variant="outlined"
                    density="compact"
                    clearable
                    hint="Filtrovat podle dopravce"
                    persistent-hint
                  >
                    <template v-slot:selection="{ item }">
                      <v-chip
                        size="small"
                        :color="getCarrierColor(item.title).color"
                        :variant="getCarrierColor(item.title).variant"
                      >
                        {{ item.title }}
                      </v-chip>
                    </template>
                  </v-select>
                </v-col>

                <!-- Platební metoda -->
                <v-col cols="12" md="4">
                  <v-select
                    v-model="filters.paymentMethod"
                    :items="paymentMethodOptions"
                    label="Platební metoda"
                    variant="outlined"
                    density="compact"
                    multiple
                    clearable
                    chips
                    hint="Můžete vybrat více metod"
                    persistent-hint
                  >
                    <template v-slot:chip="{ item }">
                      <v-chip
                        size="small"
                        color="primary"
                      >
                        {{ item.title }}
                      </v-chip>
                    </template>
                  </v-select>
                </v-col>
              </v-row>

              <v-row>
                <!-- Email -->
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="filters.email"
                    label="Email zákazníka"
                    placeholder="Začátek emailu..."
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-email"
                    clearable
                    hint="Vyhledává objednávky, jejichž email začíná zadaným textem"
                    persistent-hint
                  ></v-text-field>
                </v-col>

                <!-- Jméno zákazníka -->
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="filters.customerName"
                    label="Jméno zákazníka"
                    placeholder="Část jména nebo příjmení..."
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-account"
                    clearable
                    hint="Vyhledává ve jméně i příjmení"
                    persistent-hint
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-row>
                <!-- Minimální cena -->
                <v-col cols="12" md="3">
                  <v-text-field
                    v-model.number="filters.priceMin"
                    label="Cena od"
                    type="number"
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-currency-czk"
                    clearable
                    hint="Minimální cena objednávky"
                    persistent-hint
                  ></v-text-field>
                </v-col>

                <!-- Maximální cena -->
                <v-col cols="12" md="3">
                  <v-text-field
                    v-model.number="filters.priceMax"
                    label="Cena do"
                    type="number"
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-currency-czk"
                    clearable
                    hint="Maximální cena objednávky"
                    persistent-hint
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" class="d-flex justify-end">
                  <v-btn
                    variant="outlined"
                    prepend-icon="mdi-refresh"
                    @click="clearFilters"
                  >
                    Resetovat všechny filtry
                  </v-btn>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Info o aktivních filtrech -->
        <v-alert
          v-if="activeFiltersCount > 0"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4"
          closable
          @click:close="clearFilters"
        >
          <div class="d-flex align-center">
            <v-icon start>mdi-filter</v-icon>
            <div class="flex-grow-1">
              <strong>Aktivní filtry ({{ activeFiltersCount }}):</strong>
              <div class="text-caption mt-1">
                <span v-if="searchText.trim()">
                  Hledání: "{{ searchText }}"
                </span>
                <span v-if="filters.status && filters.status.length > 0" class="ml-2">
                  | Status: {{ filters.status.map(s => statusLabels[s]).join(', ') }}
                </span>
                <span v-if="filters.carrierId" class="ml-2">
                  | Dopravce: {{ carriers.find(c => c.id === filters.carrierId)?.name }}
                </span>
                <span v-if="filters.paymentMethod && filters.paymentMethod.length > 0" class="ml-2">
                  | Platba: {{ filters.paymentMethod.map(pm => formatPaymentMethod(pm)).join(', ') }}
                </span>
                <span v-if="filters.email?.trim()" class="ml-2">
                  | Email: "{{ filters.email }}"
                </span>
                <span v-if="filters.customerName?.trim()" class="ml-2">
                  | Zákazník: "{{ filters.customerName }}"
                </span>
                <span v-if="filters.priceMin" class="ml-2">
                  | Cena od: {{ filters.priceMin }} Kč
                </span>
                <span v-if="filters.priceMax" class="ml-2">
                  | Cena do: {{ filters.priceMax }} Kč
                </span>
              </div>
            </div>
            <v-btn
              size="small"
              variant="text"
              @click="clearFilters"
            >
              Vyčistit
            </v-btn>
          </div>
        </v-alert>

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

          <template v-slot:item.packagesNames="{ item }">
            <span v-if="formatPackagesNames(item.packagesNames)" class="text-body-2">
              {{ formatPackagesNames(item.packagesNames) }}
            </span>
            <span v-else class="text-medium-emphasis">—</span>
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