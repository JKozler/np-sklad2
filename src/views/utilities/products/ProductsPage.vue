<!-- src/views/utilities/products/ProductsPage.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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
 * Načte produkty z API
 */
const loadProducts = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await productsService.getAll();
    products.value = response.list;
    console.log('✅ Načteno produktů:', products.value.length);
  } catch (err: any) {
    error.value = err.message || 'Chyba při načítání produktů';
    console.error('❌ Chyba při načítání produktů:', err);
  } finally {
    loading.value = false;
  }
};

/**
 * Naviguje na detail produktu
 */
const viewProduct = (product: Product) => {
  router.push(`/utilities/products/${product.id}`);
};

/**
 * Naviguje na editaci produktu
 */
const editProduct = (product: Product) => {
  router.push(`/utilities/products/${product.id}/edit`);
};

/**
 * Smaže produkt (TODO: implementovat)
 */
const deleteProduct = async (product: Product) => {
  if (!confirm(`Opravdu chcete smazat produkt "${product.name}"?`)) {
    return;
  }
  
  try {
    // TODO: Implementovat delete v productsService
    console.log('Mazání produktu:', product);
    // await productsService.delete(product.id);
    // await loadProducts();
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
        <div class="d-flex justify-space-between align-center mb-4">
          <div>
            <v-btn
              color="primary"
              prepend-icon="mdi-refresh"
              :loading="loading"
              @click="loadProducts"
              variant="tonal"
            >
              {{ tlGlobal('Refresh') }}
            </v-btn>
          </div>
          
          <v-btn
            color="success"
            prepend-icon="mdi-plus"
            @click="router.push('/utilities/products/new')"
          >
            {{ tl('Create Product') }}
          </v-btn>
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
            <v-empty-state
              icon="mdi-package-variant"
              title="Žádné produkty"
              text="Zatím nebyly načteny žádné produkty."
            >
              <template v-slot:actions>
                <v-btn
                  color="primary"
                  @click="loadProducts"
                  prepend-icon="mdi-refresh"
                >
                  Načíst produkty
                </v-btn>
              </template>
            </v-empty-state>
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
          Celkem produktů: <strong>{{ products.length }}</strong>
        </div>
      </UiParentCard>
    </v-col>
  </v-row>
</template>

<script lang="ts">
/**
 * Helper pro určení barvy chipu podle typu zásob
 */
function getStockTypeColor(stockType: string): string {
  if (!stockType) return 'default';
  
  const type = stockType.toLowerCase();
  
  if (type.includes('vyrobek')) return 'success';
  if (type.includes('material')) return 'info';
  if (type.includes('zbozi')) return 'primary';
  if (type.includes('sluzba')) return 'warning';
  if (type.includes('poplatek')) return 'secondary';
  
  return 'default';
}
</script>

<style scoped>
.v-data-table {
  border-radius: 8px;
}

.gap-1 {
  gap: 4px;
}

:deep(.v-data-table-header) {
  background-color: rgb(var(--v-theme-surface));
}

:deep(.v-data-table__tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.05);
}
</style>