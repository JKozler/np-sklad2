<!-- src/views/utilities/inventory/InventoryTransactionsPage.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { inventoryTransactionService } from '@/services/inventoryTransactionService';
import { inventoryTransactionTypeService } from '@/services/inventoryTransactionTypeService';
import { useProductAutocomplete } from '@/composables/useProductAutocomplete';
import type { InventoryTransaction } from '@/services/inventoryTransactionService';
import type { InventoryTransactionType } from '@/services/inventoryTransactionTypeService';

const router = useRouter();
const route = useRoute();

const page = ref({ title: 'Skladové pohyby' });
const breadcrumbs = ref([
  { title: 'Sklad', disabled: false, href: '#' },
  { title: 'Skladové pohyby', disabled: true, href: '#' }
]);

const transactions = ref<InventoryTransaction[]>([]);
const transactionTypes = ref<InventoryTransactionType[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// Product autocomplete
const {
  products: autocompleteProducts,
  loading: loadingAutocomplete,
  searchQuery: productSearchQuery
} = useProductAutocomplete();

// **NOVÉ: Taby pro směr pohybu**
const activeTab = ref<'all' | 'prijem' | 'vydej'>('all');

const selectedType = ref<string>('');
const selectedStatus = ref<string>('');
const selectedProduct = ref<string>('');
const dateFrom = ref<string>('');
const dateTo = ref<string>('');
const searchText = ref('');

// **PAGINACE - serverová**
const currentOffset = ref(0);
const itemsPerPage = ref(200); // Max podporované API
const totalFromAPI = ref(0);

// Debounce timer pro vyhledávání
let searchTimeout: number | null = null;

const headers = ref([
  { title: 'Název', key: 'name', sortable: true },
  { title: 'Kód', key: 'code', sortable: true },
  { title: 'Typ pohybu', key: 'transactionTypeName', sortable: true },
  { title: 'Směr', key: 'transactionDirection', sortable: false },
  { title: 'Sklad (z)', key: 'warehouseFromName', sortable: false },
  { title: 'Sklad (do)', key: 'warehouseToName', sortable: false },
  { title: 'Datum', key: 'transactionDate', sortable: true },
  { title: 'Celková částka', key: 'totalPrice', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Akce', key: 'actions', sortable: false }
]);

// **PAGINACE: Computed properties**
const totalPages = computed(() => {
  return Math.ceil(totalFromAPI.value / itemsPerPage.value);
});

const currentPage = computed(() => {
  return Math.floor(currentOffset.value / itemsPerPage.value) + 1;
});

const displayRange = computed(() => {
  const from = currentOffset.value + 1;
  const to = Math.min(currentOffset.value + transactions.value.length, totalFromAPI.value);
  return { from, to };
});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('cs-CZ');
};

const formatPrice = (price: number | undefined) => {
  if (!price) return '—';
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK'
  }).format(price);
};

const getStatusColor = (status: string | undefined) => {
  if (!status) return 'default';
  switch (status.toLowerCase()) {
    case 'draft': return 'warning';
    case 'completed': return 'success';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

const getStatusLabel = (status: string | undefined) => {
  if (!status) return 'Koncept';
  switch (status.toLowerCase()) {
    case 'draft': return 'Koncept';
    case 'completed': return 'Dokončeno';
    case 'cancelled': return 'Zrušeno';
    default: return status;
  }
};

const getTypeColor = (typeId: string) => {
  const type = transactionTypes.value.find(t => t.id === typeId);
  if (!type) return 'default';
  
  switch (type.abraId) {
    case 1: return 'primary';
    case 2: return 'info';
    case 3: return 'success';
    default: return 'default';
  }
};

const getDirectionLabel = (direction: string | undefined) => {
  if (!direction) return '—';
  if (direction === 'typPohybu.prijem') return 'Příjem';
  if (direction === 'typPohybu.vydej') return 'Výdej';
  return direction;
};

const getDirectionColor = (direction: string | undefined) => {
  if (!direction) return 'default';
  if (direction === 'typPohybu.prijem') return 'success';
  if (direction === 'typPohybu.vydej') return 'error';
  return 'default';
};

/**
 * Vrací ikonu podle typu zásob (materiál vs. výrobek)
 */
const getStockTypeIcon = (stockType: string | undefined) => {
  if (stockType === 'typZasoby.vyrobek') {
    return 'mdi-food-drumstick';  // Product icon
  }
  // Default for typZasoby.material and others
  return 'mdi-package-variant';   // Material/package icon
};

/**
 * Načte skladové pohyby z API s filtry
 */
const loadTransactions = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Sestavení filtrů pro API
    const filters: any = {
      maxSize: itemsPerPage.value,
      offset: currentOffset.value
    };

    if (searchText.value.trim()) {
      filters.searchText = searchText.value.trim();
    }

    if (selectedType.value) {
      filters.typeId = selectedType.value;
    }

    if (selectedStatus.value) {
      filters.status = selectedStatus.value;
    }

    // Směr podle aktivního tabu
    if (activeTab.value === 'prijem') {
      filters.direction = 'typPohybu.prijem';
    } else if (activeTab.value === 'vydej') {
      filters.direction = 'typPohybu.vydej';
    }

    if (dateFrom.value) {
      filters.dateFrom = dateFrom.value;
    }

    if (dateTo.value) {
      filters.dateTo = dateTo.value;
    }

    const response = await inventoryTransactionService.getAll(filters);
    transactions.value = response.list;
    totalFromAPI.value = response.total;

    console.log('✅ Načteno skladových pohybů:', transactions.value.length, '/', response.total);

    if (response.total > 200) {
      console.warn('⚠️ POZOR: Celkový počet pohybů (' + response.total + ') překračuje maxSize (200)!');
    }
  } catch (err: any) {
    error.value = err.message || 'Chyba při načítání skladových pohybů';
    console.error('❌ Chyba při načítání:', err);
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
    loadTransactions();
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
  loadTransactions();
};

const loadTransactionTypes = async () => {
  try {
    const response = await inventoryTransactionTypeService.getAll();
    transactionTypes.value = response.list;
  } catch (err) {
    console.error('Chyba při načítání typů pohybů:', err);
  }
};

const deleteTransaction = async (id: string, name: string) => {
  if (!confirm(`Opravdu chcete smazat skladový pohyb "${name}"?`)) {
    return;
  }

  try {
    await inventoryTransactionService.delete(id);
    await loadTransactions();
  } catch (err: any) {
    error.value = err.message || 'Chyba při mazání pohybu';
    console.error('Chyba při mazání:', err);
  }
};

const resetFilters = () => {
  selectedType.value = '';
  selectedStatus.value = '';
  selectedProduct.value = '';
  dateFrom.value = '';
  dateTo.value = '';
  searchText.value = '';
  currentOffset.value = 0;
  loadTransactions();
};

/**
 * **NOVÉ: Funkce pro změnu stránky**
 */
const goToPage = (page: number) => {
  currentOffset.value = (page - 1) * itemsPerPage.value;
  loadTransactions();
};

const nextPage = () => {
  if (currentOffset.value + itemsPerPage.value < totalFromAPI.value) {
    currentOffset.value += itemsPerPage.value;
    loadTransactions();
  }
};

const prevPage = () => {
  if (currentOffset.value > 0) {
    currentOffset.value = Math.max(0, currentOffset.value - itemsPerPage.value);
    loadTransactions();
  }
};

// Watchers pro filtry - reload při změně
watch(selectedType, () => {
  currentOffset.value = 0;
  loadTransactions();
});

watch(selectedStatus, () => {
  currentOffset.value = 0;
  loadTransactions();
});

// POZNÁMKA: Filtr podle produktu není podporován s paginací,
// protože API neumožňuje filtrovat podle produktu v related entitě (items)
// watch(selectedProduct, () => {
//   currentOffset.value = 0;
//   loadTransactions();
// });

watch(dateFrom, () => {
  currentOffset.value = 0;
  loadTransactions();
});

watch(dateTo, () => {
  currentOffset.value = 0;
  loadTransactions();
});

// Watch for route changes (when clicking Příjemky/Výdejky in sidebar)
watch(() => route.path, (newPath) => {
  if (newPath === '/prijemky') {
    activeTab.value = 'prijem';
    page.value.title = 'Příjemky';
    breadcrumbs.value = [
      { title: 'Sklad', disabled: false, href: '#' },
      { title: 'Příjemky', disabled: true, href: '#' }
    ];
  } else if (newPath === '/vydejky') {
    activeTab.value = 'vydej';
    page.value.title = 'Výdejky';
    breadcrumbs.value = [
      { title: 'Sklad', disabled: false, href: '#' },
      { title: 'Výdejky', disabled: true, href: '#' }
    ];
  } else {
    activeTab.value = 'all';
    page.value.title = 'Skladové pohyby';
    breadcrumbs.value = [
      { title: 'Sklad', disabled: false, href: '#' },
      { title: 'Skladové pohyby', disabled: true, href: '#' }
    ];
  }
  currentOffset.value = 0;
  loadTransactions();
}, { immediate: true });

onMounted(() => {
  loadTransactionTypes();
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
              <div class="text-subtitle-2 text-medium-emphasis">Zobrazeno pohybů</div>
              <div class="text-h4 font-weight-bold mt-2">{{ transactions.length }}</div>
              <div class="text-caption text-medium-emphasis mt-1">
                z celkových {{ totalFromAPI }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text style="padding-top: 0;padding-bottom: 0;">
              <div class="text-subtitle-2 text-medium-emphasis">Dokončeno</div>
              <div class="text-h4 font-weight-bold mt-2 text-success">
                {{ transactions.filter(t => t.status === 'completed').length }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text style="padding-top: 0;padding-bottom: 0;">
              <div class="text-subtitle-2 text-medium-emphasis">Koncepty</div>
              <div class="text-h4 font-weight-bold mt-2 text-warning">
                {{ transactions.filter(t => !t.status || t.status === 'draft').length }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <UiParentCard title="Seznam skladových pohybů">
        <!-- Vyhledávání -->
        <div class="mb-4">
          <v-row>
            <v-col cols="12" md="6">
              <!-- Vyhledávací pole -->
              <v-text-field
                v-model="searchText"
                prepend-inner-icon="mdi-magnify"
                label="Vyhledat skladový pohyb"
                placeholder="Zadejte název, kód nebo hledaný výraz..."
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
                color="info"
                prepend-icon="mdi-calendar-text"
                @click="router.push('/inventory-daily-summary')"
                variant="outlined"
              >
                Denní přehled
              </v-btn>

              <v-btn
                color="primary"
                prepend-icon="mdi-refresh"
                @click="loadTransactions"
                :loading="loading"
              >
                Obnovit
              </v-btn>

              <v-btn
                color="success"
                prepend-icon="mdi-plus"
                @click="router.push({
                  path: '/inventory-transactions/new',
                  query: activeTab === 'prijem' ? { direction: 'prijem' } : activeTab === 'vydej' ? { direction: 'vydej' } : {}
                })"
              >
                Nový skladový pohyb
              </v-btn>
            </v-col>
          </v-row>
        </div>

        <!-- Info o aktivním textovém filtru -->
        <v-alert
          v-if="searchText.trim()"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4"
          closable
          @click:close="clearSearch"
        >
          <div class="d-flex align-center">
            <v-icon start>mdi-filter</v-icon>
            <span>
              Vyhledávám: <strong>"{{ searchText }}"</strong> 
              <span class="text-medium-emphasis ml-2">(nalezeno {{ transactions.length }} pohybů)</span>
            </span>
          </div>
        </v-alert>

        <!-- Info o aktivním filtru směru -->
        <v-alert
          v-if="activeTab !== 'all'"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          <div class="d-flex align-center">
            <v-icon
              start
              :color="activeTab === 'prijem' ? 'success' : 'error'"
            >
              {{ activeTab === 'prijem' ? 'mdi-arrow-down-circle' : 'mdi-arrow-up-circle' }}
            </v-icon>
            <span>
              Zobrazeny pouze pohyby typu:
              <strong>{{ activeTab === 'prijem' ? 'Příjem' : 'Výdej' }}</strong>
              <span class="text-medium-emphasis ml-2">({{ transactions.length }} pohybů)</span>
            </span>
          </div>
        </v-alert>

        <!-- Filtry -->
        <v-expansion-panels class="mb-4">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-2">mdi-filter</v-icon>
              Pokročilé filtry
              <v-chip
                v-if="selectedType || selectedStatus || dateFrom || dateTo"
                color="primary"
                size="small"
                class="ml-2"
              >
                Aktivní
              </v-chip>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row>
                <v-col cols="12" md="3">
                  <v-select
                    v-model="selectedType"
                    :items="[
                      { title: 'Všechny typy', value: '' },
                      ...transactionTypes.map(t => ({ title: t.name, value: t.id }))
                    ]"
                    label="Typ pohybu"
                    variant="outlined"
                    density="compact"
                    clearable
                  ></v-select>
                </v-col>

                <v-col cols="12" md="3">
                  <v-select
                    v-model="selectedStatus"
                    :items="[
                      { title: 'Všechny stavy', value: '' },
                      { title: 'Koncept', value: 'draft' },
                      { title: 'Dokončeno', value: 'completed' },
                      { title: 'Zrušeno', value: 'cancelled' }
                    ]"
                    label="Status"
                    variant="outlined"
                    density="compact"
                    clearable
                  ></v-select>
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="dateFrom"
                    label="Datum od"
                    type="date"
                    variant="outlined"
                    density="compact"
                    clearable
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="dateTo"
                    label="Datum do"
                    type="date"
                    variant="outlined"
                    density="compact"
                    clearable
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" class="d-flex justify-end">
                  <v-btn
                    variant="outlined"
                    prepend-icon="mdi-refresh"
                    @click="resetFilters"
                  >
                    Resetovat všechny filtry
                  </v-btn>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Chybová hláška -->
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

        <!-- Tabulka -->
        <v-data-table
          :headers="headers"
          :items="transactions"
          :loading="loading"
          :items-per-page="200"
          hide-default-footer
          class="elevation-1"
        >
          <template v-slot:loading>
            <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
          </template>

          <template v-slot:item.name="{ item }">
            <router-link 
              :to="`/inventory-transactions/${item.id}`"
              class="text-primary font-weight-medium text-decoration-none"
            >
              {{ item.name }}
            </router-link>
          </template>

          <template v-slot:item.code="{ item }">
            <v-chip v-if="item.code" color="secondary" size="small" variant="tonal">
              {{ item.code }}
            </v-chip>
            <span v-else class="text-medium-emphasis">—</span>
          </template>

          <template v-slot:item.transactionTypeName="{ item }">
            <v-chip 
              :color="getTypeColor(item.transactionTypeId)"
              size="small"
              variant="tonal"
            >
              {{ item.transactionTypeName }}
            </v-chip>
          </template>

          <template v-slot:item.transactionDirection="{ item }">
            <v-chip 
              :color="getDirectionColor(item.transactionDirection)"
              size="small"
              variant="tonal"
            >
              <v-icon 
                start 
                size="small"
                :icon="item.transactionDirection === 'typPohybu.prijem' ? 'mdi-arrow-down-circle' : 'mdi-arrow-up-circle'"
              ></v-icon>
              {{ getDirectionLabel(item.transactionDirection) }}
            </v-chip>
          </template>

          <template v-slot:item.warehouseFromName="{ item }">
            <span class="text-medium-emphasis">{{ item.warehouseFromName || '—' }}</span>
          </template>

          <template v-slot:item.warehouseToName="{ item }">
            <span class="text-medium-emphasis">{{ item.warehouseToName || '—' }}</span>
          </template>

          <template v-slot:item.transactionDate="{ item }">
            {{ formatDate(item.transactionDate) }}
          </template>

          <template v-slot:item.totalPrice="{ item }">
            <span class="font-weight-medium">{{ formatPrice(item.totalPrice) }}</span>
          </template>

          <template v-slot:item.status="{ item }">
            <v-chip 
              :color="getStatusColor(item.status)"
              size="small"
              variant="tonal"
            >
              {{ getStatusLabel(item.status) }}
            </v-chip>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              size="small"
              variant="text"
              color="primary"
              :to="`/inventory-transactions/${item.id}`"
            >
              <v-icon>mdi-eye</v-icon>
            </v-btn>
            <v-btn
              icon
              size="small"
              variant="text"
              color="error"
              @click="deleteTransaction(item.id, item.name)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>

          <template v-slot:no-data>
            <div class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1">
                {{ searchText.trim() ? 'mdi-magnify' : 'mdi-package-variant-closed' }}
              </v-icon>
              <div class="text-h6 mt-4">
                {{ searchText.trim() ? 'Žádné výsledky' : 'Žádné skladové pohyby' }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ searchText.trim() 
                  ? `Pro výraz "${searchText}" nebyly nalezeny žádné skladové pohyby.` 
                  : activeTab === 'prijem' 
                    ? 'V kategorii "Příjem" nejsou žádné pohyby.'
                    : activeTab === 'vydej'
                      ? 'V kategorii "Výdej" nejsou žádné pohyby.'
                      : 'Vytvořte první skladový pohyb'
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
                Vyčistit filtr
              </v-btn>
            </div>
          </template>

        </v-data-table>

        <!-- **NOVÉ: Paginace** -->
        <div class="d-flex justify-space-between align-center pa-4 flex-wrap" v-if="totalFromAPI > 0">
          <div class="text-body-2">
            Zobrazeno {{ displayRange.from }}-{{ displayRange.to }} z {{ totalFromAPI }} skladových pohybů
            <span v-if="activeTab !== 'all'" class="text-medium-emphasis ml-2">
              ({{ activeTab === 'prijem' ? 'Příjem' : 'Výdej' }})
            </span>
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
          {{ searchText.trim() ? 'Výsledky vyhledávání: ' : 'Celkem skladových pohybů: ' }}
          <strong>{{ totalFromAPI }}</strong>
          {{ activeTab !== 'all' ? `(${activeTab === 'prijem' ? 'Příjem' : 'Výdej'})` : '' }}
        </div>
      </UiParentCard>
    </v-col>
  </v-row>
</template>

<style scoped>
.gap-2 {
  gap: 8px;
}

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