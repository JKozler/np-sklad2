<!-- src/views/utilities/production/ProductionOrdersPage.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { productionOrderService } from '@/services/productionOrderService';
import type { ProductionOrder } from '@/services/productionOrderService';
import { wrapWithWildcards } from '@/utils/searchHelpers';

const router = useRouter();

const page = ref({ title: 'Výrobní příkazy' });
const breadcrumbs = ref([
  { title: 'Výroba', disabled: false, href: '#' },
  { title: 'Výrobní příkazy', disabled: true, href: '#' }
]);

const productionOrders = ref<ProductionOrder[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchText = ref('');
const totalFromAPI = ref(0);

// Paginace
const currentOffset = ref(0);
const itemsPerPage = ref(20);

let searchTimeout: number | null = null;
let totals = 0;

// Computed properties pro paginaci
const totalPages = computed(() => {
  return Math.ceil(totals / itemsPerPage.value);
});

const currentPage = computed(() => {
  return Math.floor(currentOffset.value / itemsPerPage.value) + 1;
});

const displayRange = computed(() => {
  const from = currentOffset.value + 1;
  const to = Math.min(currentOffset.value + productionOrders.value.length, totals);
  return { from, to };
});

// Statistiky
const stats = computed(() => {
  return {
    total: totals,
    produced: productionOrders.value.filter(p => p.status === 'PRODUCED').length,
    withErrors: productionOrders.value.filter(p => p.errorMessage).length,
    booked: productionOrders.value.filter(p => p.productionBookedFlag).length
  };
});

const headers = computed(() => [
  { title: 'Název', key: 'name', sortable: true },
  { title: 'Produkt', key: 'productName', sortable: true },
  { title: 'Datum', key: 'date', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Zaúčtováno', key: 'productionBookedFlag', sortable: true },
  { title: 'Vytvořeno', key: 'createdAt', sortable: true },
  { title: 'Akce', key: 'actions', sortable: false }
]);

const getStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    'PRODUCED': 'success',
    'IN_PROGRESS': 'warning',
    'PLANNED': 'info',
    'CANCELLED': 'error'
  };
  return statusMap[status] || 'default';
};

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'PRODUCED': 'Vyrobeno',
    'IN_PROGRESS': 'Probíhá',
    'PLANNED': 'Plánováno',
    'CANCELLED': 'Zrušeno'
  };
  return statusMap[status] || status;
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('cs-CZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

const formatDateTime = (dateString: string | null) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('cs-CZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

/**
 * Načte výrobní příkazy s filtry
 */
const loadProductionOrders = async () => {
  loading.value = true;
  error.value = null;

  try {
    const queryParams: any = {
      maxSize: itemsPerPage.value,
      offset: currentOffset.value,
      orderBy: 'createdAt',
      order: 'desc'
    };

    let whereGroupIndex = 0;

    // Textový filtr (search)
    if (searchText.value.trim()) {
      queryParams[`whereGroup[${whereGroupIndex}][type]`] = 'textFilter';
      queryParams[`whereGroup[${whereGroupIndex}][value]`] = wrapWithWildcards(searchText.value.trim());
      whereGroupIndex++;
    }

    console.log('🔍 API Request s filtry:', queryParams);

    const response = await productionOrderService.getAll(queryParams);
    productionOrders.value = response.list;
    totals = response.total;

    console.log('✅ Načteno výrobních příkazů:', productionOrders.value.length, '/', response.total);
  } catch (err: any) {
    error.value = err.message || 'Chyba při načítání výrobních příkazů';
    console.error('❌ Chyba při načítání výrobních příkazů:', err);
  } finally {
    loading.value = false;
  }
};

/**
 * Debounced search - čeká 500ms po posledním stisku klávesy
 */
const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = window.setTimeout(() => {
    loadProductionOrders();
  }, 500);
};

/**
 * Watch na změnu searchText
 */
watch(searchText, () => {
  currentOffset.value = 0; // Reset na první stránku
  debouncedSearch();
});

/**
 * Vyčistí vyhledávání
 */
const clearSearch = () => {
  searchText.value = '';
  loadProductionOrders();
};

/**
 * Funkce pro změnu stránky
 */
const goToPage = (page: number) => {
  currentOffset.value = (page - 1) * itemsPerPage.value;
  loadProductionOrders();
};

const nextPage = () => {
  if (currentOffset.value + itemsPerPage.value < totals) {
    currentOffset.value += itemsPerPage.value;
    loadProductionOrders();
  }
};

const prevPage = () => {
  if (currentOffset.value > 0) {
    currentOffset.value = Math.max(0, currentOffset.value - itemsPerPage.value);
    loadProductionOrders();
  }
};

const viewProductionOrder = (order: ProductionOrder) => {
  router.push(`/production-orders/${order.id}`);
};

const editProductionOrder = (order: ProductionOrder) => {
  router.push(`/production-orders/${order.id}`);
};

const deleteProductionOrder = async (order: ProductionOrder) => {
  if (!confirm(`Opravdu chcete smazat výrobní příkaz "${order.name}"?`)) {
    return;
  }

  try {
    await productionOrderService.delete(order.id);
    await loadProductionOrders();
  } catch (err: any) {
    error.value = err.message || 'Chyba při mazání výrobního příkazu';
    console.error('❌ Chyba při mazání:', err);
  }
};

/**
 * Vrací CSS třídu pro řádek s chybou
 */
const getRowClass = (item: ProductionOrder) => {
  return item.errorMessage ? 'error-row' : '';
};

onMounted(() => {
  loadProductionOrders();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

  <v-row>
    <v-col cols="12">
      <!-- Statistiky -->
      <v-row class="mb-4">
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text style="padding-top: 0;padding-bottom: 0;">
              <div class="text-subtitle-2 text-medium-emphasis">Celkem příkazů</div>
              <div class="text-h4 font-weight-bold mt-2">{{ stats.total }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text style="padding-top: 0;padding-bottom: 0;">
              <div class="text-subtitle-2 text-medium-emphasis">Vyrobeno</div>
              <div class="text-h4 font-weight-bold mt-2 text-success">
                {{ stats.produced }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text style="padding-top: 0;padding-bottom: 0;">
              <div class="text-subtitle-2 text-medium-emphasis">Zaúčtováno</div>
              <div class="text-h4 font-weight-bold mt-2 text-info">
                {{ stats.booked }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text style="padding-top: 0;padding-bottom: 0;">
              <div class="text-subtitle-2 text-medium-emphasis">S chybami</div>
              <div class="text-h4 font-weight-bold mt-2 text-error">
                {{ stats.withErrors }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <UiParentCard title="Výrobní příkazy">
        <!-- Toolbar s akcemi -->
        <div class="mb-4">
          <v-row>
            <v-col cols="12" md="6">
              <!-- Vyhledávací pole -->
              <v-text-field
                v-model="searchText"
                prepend-inner-icon="mdi-magnify"
                label="Vyhledat výrobní příkaz"
                placeholder="Zadejte název nebo produkt..."
                variant="outlined"
                density="compact"
                clearable
                @click:clear="clearSearch"
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
                @click="loadProductionOrders"
                variant="tonal"
              >
                Obnovit
              </v-btn>

              <v-btn
                color="success"
                prepend-icon="mdi-plus"
                @click="router.push('/production-orders/new')"
              >
                Nový výrobní příkaz
              </v-btn>
            </v-col>
          </v-row>
        </div>

        <!-- Error alert -->
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="error = null"
        >
          <strong>Chyba:</strong> {{ error }}
        </v-alert>

        <!-- Info o chybách -->
        <v-alert
          v-if="stats.withErrors > 0"
          type="warning"
          variant="tonal"
          class="mb-4"
          density="compact"
        >
          <div class="d-flex align-center">
            <v-icon start>mdi-alert-circle</v-icon>
            <span>
              <strong>{{ stats.withErrors }}</strong> výrobních příkazů má chybovou zprávu (zvýrazněno červeně)
            </span>
          </div>
        </v-alert>

        <!-- Data table -->
        <v-data-table
          :headers="headers"
          :items="productionOrders"
          :loading="loading"
          :items-per-page="itemsPerPage"
          class="elevation-1"
          hide-default-footer
          :hover="true"
          :item-class="getRowClass"
        >
          <!-- Loading slot -->
          <template v-slot:loading>
            <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
          </template>

          <!-- No data slot -->
          <template v-slot:no-data>
            <div class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1">
                {{ searchText.trim() ? 'mdi-magnify' : 'mdi-clipboard-list' }}
              </v-icon>
              <div class="text-h6 mt-4">
                {{ searchText.trim() ? 'Žádné výsledky' : 'Žádné výrobní příkazy' }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ searchText.trim()
                  ? 'Pro zadaná kritéria nebyly nalezeny žádné výrobní příkazy.'
                  : 'Zatím nebyly vytvořeny žádné výrobní příkazy.'
                }}
              </div>
              <v-btn
                v-if="searchText.trim()"
                color="primary"
                @click="clearSearch"
                prepend-icon="mdi-close"
                class="mt-4"
                variant="outlined"
              >
                Vyčistit vyhledávání
              </v-btn>
              <v-btn
                v-else
                color="primary"
                @click="router.push('/production-orders/new')"
                prepend-icon="mdi-plus"
                class="mt-4"
              >
                Vytvořit první výrobní příkaz
              </v-btn>
            </div>
          </template>

          <!-- Name with error indicator -->
          <template v-slot:item.name="{ item }">
            <div class="d-flex align-center">
              <v-icon
                v-if="item.errorMessage"
                color="error"
                size="small"
                class="mr-2"
              >
                mdi-alert-circle
              </v-icon>
              <span :class="{ 'font-weight-bold': item.errorMessage }">
                {{ item.name }}
              </span>
            </div>
          </template>

          <!-- Product name -->
          <template v-slot:item.productName="{ item }">
            <span v-if="item.productName">{{ item.productName }}</span>
            <span v-else class="text-medium-emphasis">—</span>
          </template>

          <!-- Date -->
          <template v-slot:item.date="{ item }">
            {{ formatDate(item.date) }}
          </template>

          <!-- Status -->
          <template v-slot:item.status="{ item }">
            <v-chip
              size="small"
              :color="getStatusColor(item.status)"
              variant="tonal"
            >
              {{ getStatusLabel(item.status) }}
            </v-chip>
          </template>

          <!-- Production Booked Flag -->
          <template v-slot:item.productionBookedFlag="{ item }">
            <v-chip
              :color="item.productionBookedFlag ? 'success' : 'default'"
              size="small"
              variant="tonal"
            >
              <v-icon start :icon="item.productionBookedFlag ? 'mdi-check' : 'mdi-close'"></v-icon>
              {{ item.productionBookedFlag ? 'Ano' : 'Ne' }}
            </v-chip>
          </template>

          <!-- Created At -->
          <template v-slot:item.createdAt="{ item }">
            <span class="text-caption">{{ formatDateTime(item.createdAt) }}</span>
          </template>

          <!-- Actions -->
          <template v-slot:item.actions="{ item }">
            <div class="d-flex gap-1">
              <v-tooltip text="Zobrazit detail" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    size="small"
                    variant="text"
                    color="info"
                    @click="viewProductionOrder(item)"
                  >
                    <v-icon>mdi-eye</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>

              <v-tooltip text="Upravit" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    size="small"
                    variant="text"
                    color="primary"
                    @click="editProductionOrder(item)"
                  >
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>

              <v-tooltip text="Smazat" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    size="small"
                    variant="text"
                    color="error"
                    @click="deleteProductionOrder(item)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
            </div>
          </template>
        </v-data-table>

        <!-- Paginace -->
        <div class="d-flex justify-space-between align-center pa-4 flex-wrap" v-if="totals > 0">
          <div class="text-body-2">
            Zobrazeno {{ displayRange.from }}-{{ displayRange.to }} z {{ totals }} výrobních příkazů
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

        <!-- Footer s info -->
        <div class="mt-4 text-caption text-medium-emphasis">
          <v-icon size="small" class="mr-1">mdi-information-outline</v-icon>
          {{ searchText.trim() ? 'Výsledky filtrování: ' : 'Celkem výrobních příkazů: ' }}
          <strong>{{ totals }}</strong>
        </div>
      </UiParentCard>
    </v-col>
  </v-row>
</template>

<style scoped>
.v-data-table {
  border-radius: 8px;
}

.gap-1 {
  gap: 4px;
}

.gap-2 {
  gap: 8px;
}

:deep(.v-data-table-header) {
  background-color: rgb(var(--v-theme-surface));
}

:deep(.v-data-table__tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

/* Červené podbarvení řádků s chybovou zprávou */
:deep(.error-row) {
  background-color: rgba(var(--v-theme-error), 0.08) !important;
}

:deep(.error-row:hover) {
  background-color: rgba(var(--v-theme-error), 0.12) !important;
}
</style>
