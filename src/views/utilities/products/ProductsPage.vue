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

// Použití i18n pro scope "Product"
const { tf, tl, to, isLoaded } = useI18n('Product');

// Pro Global scope můžeme použít další instanci
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

// Debounce timer pro vyhledávání
let searchTimeout: number | null = null;

// Computed pro hlavičky tabulky s překlady
const headers = computed(() => [
  { title: tf('abraId'), key: 'abraId', sortable: true },
  { title: tf('code'), key: 'code', sortable: true },
  { title: tf('name'), key: 'name', sortable: true },
  { title: tf('ean'), key: 'ean', sortable: false },
  { title: tf('stockType'), key: 'stockType', sortable: true },
  { title: tf('isStockItem'), key: 'isStockItem', sortable: true },
  { title: tf('priceWithoutVat'), key: 'priceWithoutVat', sortable: true },
  { title: tlGlobal('Actions'), key: 'actions', sortable: false }
]);

/**
 * Přeloží hodnotu stock type
 * Z "typZasoby.zbozi" udělá "zbozi" a přeloží to
 */
const getStockTypeLabel = (stockType: string) => {
  if (!stockType) return '—';
  
  // Extrahujeme klíč za tečkou (např. "typZasoby.zbozi" -> "zbozi")
  const key = stockType.includes('.') ? stockType.split('.').pop()! : stockType;
  
  // Pokusíme se přeložit
  const translation = to('stockType', key);
  return translation || stockType;
};

/**
 * Helper pro určení barvy chipu podle typu zásob
 */
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

/**
 * Formátuje cenu do českého formátu
 */
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
 * Načte produkty z API s textovým filtrem
 */
const loadProducts = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // Vytvoříme query parametry
    const queryParams: any = {
      maxSize: 200,
      offset: 0,
      orderBy: 'createdAt',
      order: 'desc'
    };

    // Pokud je zadán textový filtr, přidáme whereGroup
    if (searchText.value.trim()) {
      const response = await productsService.getAll(undefined, {
        ...queryParams,
        // Přidáme whereGroup parametry pro textový filtr
        'whereGroup[0][type]': 'textFilter',
        'whereGroup[0][value]': searchText.value.trim()
      } as any);
      products.value = response.list;
    } else {
      // Bez filtru načteme všechny produkty
      const response = await productsService.getAll(undefined, queryParams);
      products.value = response.list;
    }
    
    console.log('✅ Načteno produktů:', products.value.length);
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
 * Vyčistí vyhledávání
 */
const clearSearch = () => {
  searchText.value = '';
  loadProducts();
};

/**
 * Naviguje na detail produktu
 */
const viewProduct = (product: Product) => {
  router.push(`/products/${product.id}`);
};

/**
 * Naviguje na editaci produktu
 */
const editProduct = (product: Product) => {
  router.push(`/products/${product.id}`);
};

/**
 * Smaže produkt
 */
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

/**
 * Inicializace při načtení komponenty
 */
onMounted(() => {
  loadProducts();
});
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  
  <v-row>
    <v-col cols="12">
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

        <!-- Info o aktivním filtru -->
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
              <span class="text-medium-emphasis ml-2">(nalezeno {{ products.length }} produktů)</span>
            </span>
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
                {{ searchText.trim() ? 'mdi-magnify' : 'mdi-package-variant' }}
              </v-icon>
              <div class="text-h6 mt-4">
                {{ searchText.trim() ? 'Žádné výsledky' : 'Žádné produkty' }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ searchText.trim() 
                  ? `Pro výraz "${searchText}" nebyly nalezeny žádné produkty.` 
                  : 'Zatím nebyly načteny žádné produkty.' 
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
          {{ searchText.trim() ? 'Výsledky vyhledávání: ' : 'Celkem produktů: ' }}
          <strong>{{ products.length }}</strong>
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