<!-- src/views/utilities/products/ProductsPage.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '@/composables/useI18n';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { productsService } from '@/services/productsService';
import type { Product } from '@/services/productsService';

const router = useRouter();

const { tf, tl, to, isLoaded } = useI18n('Product');
const { tl: tlGlobal } = useI18n('Global');

const page = ref({ title: 'Produkty z API' });
const breadcrumbs = ref([
  { title: 'Sklad', disabled: false, href: '#' },
  { title: 'Produkty', disabled: true, href: '#' }
]);

const products = ref<Product[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchText = ref('');
const totalFromAPI = ref(0); // **NOVÉ: Celkový počet z API**

// **NOVÉ: Filtry**
const filters = ref({
  stockType: [] as string[], // Může být více typů najednou
  isStockItem: null as boolean | null,
  ean: ''
});

// Debounce timer pro vyhledávání
let searchTimeout: number | null = null;
let totals = 0;

// **NOVÉ: Typy zásob pro výběr**
const stockTypeOptions = ref([
  { value: 'typZasoby.vyrobek', title: 'Výrobek', icon: 'mdi-hammer-wrench', color: 'success' },
  { value: 'typZasoby.zbozi', title: 'Zboží', icon: 'mdi-package-variant', color: 'primary' },
  { value: 'typZasoby.material', title: 'Materiál', icon: 'mdi-package-variant-closed', color: 'info' },
  { value: 'typZasoby.sluzba', title: 'Služba', icon: 'mdi-briefcase', color: 'warning' },
  { value: 'typZasoby.poplatek', title: 'Poplatek', icon: 'mdi-cash', color: 'secondary' }
]);

// **NOVÉ: Statistiky**
const stats = computed(() => {
  return {
    total: totals,
    vyrobek: products.value.filter(p => p.stockType === 'typZasoby.vyrobek').length,
    zbozi: products.value.filter(p => p.stockType === 'typZasoby.zbozi').length,
    material: products.value.filter(p => p.stockType === 'typZasoby.material').length,
    sluzba: products.value.filter(p => p.stockType === 'typZasoby.sluzba').length,
    poplatek: products.value.filter(p => p.stockType === 'typZasoby.poplatek').length,
    skladove: products.value.filter(p => p.isStockItem).length,
    neskladove: products.value.filter(p => !p.isStockItem).length
  };
});

const headers = computed(() => [
  { title: tf('abraId'), key: 'abraId', sortable: true },
  { title: tf('code'), key: 'code', sortable: true },
  { title: tf('name'), key: 'name', sortable: true },
  { title: tf('ean'), key: 'ean', sortable: false },
  { title: tf('stockType'), key: 'stockType', sortable: true },
  { title: tf('isStockItem'), key: 'isStockItem', sortable: true },
  { title: tf('costPrice'), key: 'costPrice', sortable: true },
  { title: tf('priceWithoutVat'), key: 'priceWithoutVat', sortable: true },
  { title: tlGlobal('Actions'), key: 'actions', sortable: false }
]);

const getStockTypeLabel = (stockType: string) => {
  if (!stockType) return '—';
  const key = stockType.includes('.') ? stockType.split('.').pop()! : stockType;
  const translation = to('stockType', key);
  return translation || stockType;
};

const getStockTypeColor = (stockType: string): string => {
  if (!stockType) return 'default';
  
  const type = stockType.toLowerCase();
  
  if (type.includes('vyrobek')) return 'success';
  if (type.includes('material')) return 'info';
  if (type.includes('zbozi')) return 'primary';
  if (type.includes('sluzba')) return 'warning';
  if (type.includes('poplatek')) return 'secondary';
  
  return 'default';
};

const formatPrice = (price: number | null) => {
  if (price === null || price === undefined) return '—';
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

/**
 * **NOVÉ: Načte produkty s filtry - VŠECHNY najednou pomocí většího maxSize**
 */
const loadProducts = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const queryParams: any = {
      maxSize: 200,
      offset: 0,
      orderBy: 'createdAt',
      order: 'desc'
    };

    let whereGroupIndex = 0;

    // **1. Textový filtr (search)**
    if (searchText.value.trim()) {
      queryParams[`whereGroup[${whereGroupIndex}][type]`] = 'textFilter';
      queryParams[`whereGroup[${whereGroupIndex}][value]`] = searchText.value.trim();
      whereGroupIndex++;
    }

    // **2. Filtr podle stockType (IN - více hodnot)**
    if (filters.value.stockType.length > 0) {
      queryParams[`whereGroup[${whereGroupIndex}][type]`] = 'in';
      queryParams[`whereGroup[${whereGroupIndex}][attribute]`] = 'stockType';
      filters.value.stockType.forEach((type, idx) => {
        queryParams[`whereGroup[${whereGroupIndex}][value][${idx}]`] = type;
      });
      whereGroupIndex++;
    }

    // **3. Filtr podle isStockItem (boolean)**
    if (filters.value.isStockItem !== null) {
      if (filters.value.isStockItem === true) {
        queryParams[`whereGroup[${whereGroupIndex}][type]`] = 'isTrue';
        queryParams[`whereGroup[${whereGroupIndex}][attribute]`] = 'isStockItem';
        queryParams[`whereGroup[${whereGroupIndex}][value]`] = '';
      } else {
        queryParams[`whereGroup[${whereGroupIndex}][type]`] = 'isFalse';
        queryParams[`whereGroup[${whereGroupIndex}][attribute]`] = 'isStockItem';
        queryParams[`whereGroup[${whereGroupIndex}][value]`] = '';
      }
      whereGroupIndex++;
    }

    // **4. Filtr podle EAN (startsWith)**
    if (filters.value.ean.trim()) {
      queryParams[`whereGroup[${whereGroupIndex}][type]`] = 'startsWith';
      queryParams[`whereGroup[${whereGroupIndex}][attribute]`] = 'ean';
      queryParams[`whereGroup[${whereGroupIndex}][value]`] = filters.value.ean.trim();
      whereGroupIndex++;
    }

    console.log('🔍 API Request s filtry:', queryParams);

    const response = await productsService.getAll(undefined, queryParams);
    products.value = response.list;
    totals = response.total;
    
    console.log('✅ Načteno produktů:', products.value.length, '/', response.total);
    
    // ⚠️ Varování pokud je produktů více než maxSize
    if (response.total > 2000) {
      console.warn('⚠️ POZOR: Celkový počet produktů (' + response.total + ') překračuje maxSize (2000)!');
      error.value = `Varování: Zobrazeno pouze prvních 2000 z ${response.total} produktů. Použijte filtry pro zúžení výsledků.`;
    }
  } catch (err: any) {
    error.value = err.message || 'Chyba při načítání produktů';
    console.error('❌ Chyba při načítání produktů:', err);
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
    loadProducts();
  }, 500);
};

/**
 * Watch na změnu searchText
 */
watch(searchText, () => {
  debouncedSearch();
});

/**
 * **NOVÉ: Watch na změnu filtrů**
 */
watch([
  () => filters.value.stockType,
  () => filters.value.isStockItem,
  () => filters.value.ean
], () => {
  debouncedSearch();
}, { deep: true });

/**
 * **NOVÉ: Vyčistí všechny filtry**
 */
const clearFilters = () => {
  filters.value = {
    stockType: [],
    isStockItem: null,
    ean: ''
  };
  searchText.value = '';
  loadProducts();
};

/**
 * **NOVÉ: Vrátí počet aktivních filtrů**
 */
const activeFiltersCount = computed(() => {
  let count = 0;
  if (filters.value.stockType.length > 0) count++;
  if (filters.value.isStockItem !== null) count++;
  if (filters.value.ean.trim()) count++;
  if (searchText.value.trim()) count++;
  return count;
});

/**
 * Vyčistí vyhledávání
 */
const clearSearch = () => {
  searchText.value = '';
  loadProducts();
};

const viewProduct = (product: Product) => {
  router.push(`/products/${product.id}`);
};

const editProduct = (product: Product) => {
  router.push(`/products/${product.id}`);
};

const deleteProduct = async (product: Product) => {
  if (!confirm(`Opravdu chcete smazat produkt "${product.name}"?`)) {
    return;
  }
  
  try {
    await productsService.delete(product.id);
    await loadProducts();
  } catch (err: any) {
    error.value = err.message || 'Chyba při mazání produktu';
    console.error('❌ Chyba při mazání:', err);
  }
};

onMounted(() => {
  loadProducts();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  
  <v-row>
    <v-col cols="12">
      <!-- **NOVÉ: Statistiky** -->
      <v-row class="mb-4">
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 text-medium-emphasis">Zobrazeno produktů</div>
              <div class="text-h4 font-weight-bold mt-2">{{ stats.total }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 text-medium-emphasis">Skladové položky</div>
              <div class="text-h4 font-weight-bold mt-2 text-success">
                {{ stats.skladove }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 text-medium-emphasis">Výrobky</div>
              <div class="text-h4 font-weight-bold mt-2 text-success">
                {{ stats.vyrobek }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 text-medium-emphasis">Zboží</div>
              <div class="text-h4 font-weight-bold mt-2 text-primary">
                {{ stats.zbozi }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <UiParentCard :title="tl('Create Product')">
        <!-- Toolbar s akcemi -->
        <div class="mb-4">
          <v-row>
            <v-col cols="12" md="6">
              <!-- Vyhledávací pole -->
              <v-text-field
                v-model="searchText"
                prepend-inner-icon="mdi-magnify"
                label="Vyhledat produkt"
                placeholder="Zadejte název, kód nebo EAN..."
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
                @click="loadProducts"
                variant="tonal"
              >
                {{ tlGlobal('Refresh') }}
              </v-btn>
              
              <v-btn
                color="success"
                prepend-icon="mdi-plus"
                @click="router.push('/products/new')"
              >
                {{ tl('Create Product') }}
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
                <!-- Typ zásob -->
                <v-col cols="12" md="4">
                  <v-select
                    v-model="filters.stockType"
                    :items="stockTypeOptions"
                    label="Typ zásob"
                    variant="outlined"
                    density="compact"
                    multiple
                    chips
                    clearable
                  >
                    <template v-slot:chip="{ item }">
                      <v-chip 
                        :color="item.raw.color"
                        size="small"
                        closable
                        @click:close="filters.stockType = filters.stockType.filter(t => t !== item.value)"
                      >
                        <v-icon start size="small">{{ item.raw.icon }}</v-icon>
                        {{ item.raw.title }}
                      </v-chip>
                    </template>

                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props">
                        <template v-slot:prepend>
                          <v-icon :color="item.raw.color">{{ item.raw.icon }}</v-icon>
                        </template>
                        <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                      </v-list-item>
                    </template>
                  </v-select>
                </v-col>

                <!-- Skladová položka -->
                <v-col cols="12" md="4">
                  <v-select
                    v-model="filters.isStockItem"
                    :items="[
                      { title: 'Všechny produkty', value: null },
                      { title: 'Pouze skladové', value: true },
                      { title: 'Pouze neskladové', value: false }
                    ]"
                    label="Skladová položka"
                    variant="outlined"
                    density="compact"
                    clearable
                  >
                    <template v-slot:selection="{ item }">
                      <v-chip 
                        v-if="item.value !== null"
                        :color="item.value ? 'success' : 'default'"
                        size="small"
                      >
                        <v-icon start size="small">
                          {{ item.value ? 'mdi-check-circle' : 'mdi-close-circle' }}
                        </v-icon>
                        {{ item.title }}
                      </v-chip>
                      <span v-else>{{ item.title }}</span>
                    </template>
                  </v-select>
                </v-col>

                <!-- EAN -->
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="filters.ean"
                    label="EAN"
                    placeholder="Začátek EAN kódu..."
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-barcode-scan"
                    clearable
                    hint="Vyhledává produkty, jejichž EAN začíná zadaným textem"
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
                <span v-if="filters.stockType.length > 0" class="ml-2">
                  | Typy: {{ filters.stockType.length }}
                </span>
                <span v-if="filters.isStockItem !== null" class="ml-2">
                  | Skladové: {{ filters.isStockItem ? 'Ano' : 'Ne' }}
                </span>
                <span v-if="filters.ean.trim()" class="ml-2">
                  | EAN: "{{ filters.ean }}"
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

        <!-- Error alert -->
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="error = null"
        >
          <strong>{{ tlGlobal('Error') }}:</strong> {{ error }}
        </v-alert>

        <!-- Info o načtených překladech (debug) -->
        <v-alert
          v-if="!isLoaded"
          type="info"
          variant="tonal"
          class="mb-4"
          density="compact"
        >
          <v-icon start>mdi-translate</v-icon>
          Načítání překladů...
        </v-alert>

        <!-- Data table -->
        <v-data-table
          :headers="headers"
          :items="products"
          :loading="loading"
          class="elevation-1"
          :items-per-page="10"
          :hover="true"
        >
          <!-- Loading slot -->
          <template v-slot:loading>
            <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
          </template>

          <!-- No data slot -->
          <template v-slot:no-data>
            <div class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1">
                {{ searchText.trim() || activeFiltersCount > 0 ? 'mdi-magnify' : 'mdi-package-variant' }}
              </v-icon>
              <div class="text-h6 mt-4">
                {{ searchText.trim() || activeFiltersCount > 0 ? 'Žádné výsledky' : 'Žádné produkty' }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ searchText.trim() || activeFiltersCount > 0
                  ? 'Pro zadaná kritéria nebyly nalezeny žádné produkty.' 
                  : 'Zatím nebyly načteny žádné produkty.' 
                }}
              </div>
              <v-btn
                v-if="searchText.trim() || activeFiltersCount > 0"
                color="primary"
                @click="clearFilters"
                prepend-icon="mdi-close"
                class="mt-4"
                variant="outlined"
              >
                Vyčistit filtry
              </v-btn>
              <v-btn
                v-else
                color="primary"
                @click="loadProducts"
                prepend-icon="mdi-refresh"
                class="mt-4"
              >
                Načíst produkty
              </v-btn>
            </div>
          </template>

          <!-- Stock Type -->
          <template v-slot:item.stockType="{ item }">
            <v-chip 
              size="small" 
              :color="getStockTypeColor(item.stockType)"
              variant="tonal"
            >
              {{ getStockTypeLabel(item.stockType) }}
            </v-chip>
          </template>

          <!-- Is Stock Item -->
          <template v-slot:item.isStockItem="{ item }">
            <v-chip 
              :color="item.isStockItem ? 'success' : 'default'" 
              size="small"
              variant="tonal"
            >
              <v-icon start :icon="item.isStockItem ? 'mdi-check' : 'mdi-close'"></v-icon>
              {{ item.isStockItem ? tlGlobal('Yes') : tlGlobal('No') }}
            </v-chip>
          </template>

          <!-- Price -->
          <template v-slot:item.costPrice="{ item }">
            <span class="font-weight-medium">
              {{ formatPrice(item.costPrice?item.costPrice:0) }}
            </span>
          </template>

          <!-- Price -->
          <template v-slot:item.priceWithoutVat="{ item }">
            <span class="font-weight-medium">
              {{ formatPrice(item.priceWithoutVat) }}
            </span>
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
                    @click="viewProduct(item)"
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
                    @click="editProduct(item)"
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
                    @click="deleteProduct(item)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
            </div>
          </template>
        </v-data-table>

        <!-- Footer s info -->
        <div class="mt-4 text-caption text-medium-emphasis">
          <v-icon size="small" class="mr-1">mdi-information-outline</v-icon>
          {{ searchText.trim() || activeFiltersCount > 0 ? 'Výsledky filtrování: ' : 'Celkem produktů: ' }}
          <strong>{{ products.length }}</strong>
          <span v-if="activeFiltersCount > 0" class="ml-2">
            ({{ activeFiltersCount }} {{ activeFiltersCount === 1 ? 'filtr' : activeFiltersCount < 5 ? 'filtry' : 'filtrů' }})
          </span>
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
</style>